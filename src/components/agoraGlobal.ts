// Global Agora client singleton — persists across component unmounts
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || "";

interface GlobalAgoraState {
  client: IAgoraRTCClient | null;
  micTrack: IMicrophoneAudioTrack | null;
  channelName: string | null;
  uid: number | null;
  isOnSeat: boolean;
  isMuted: boolean;
  isSpeakerOff: boolean;
  isAudioPlaybackBlocked: boolean;
  speakerIntervalId: ReturnType<typeof setInterval> | null;
  volumeIntervalId: ReturnType<typeof setInterval> | null;
  speakingUsers: Set<string>;
  listeners: Set<() => void>;
}

const state: GlobalAgoraState = {
  client: null,
  micTrack: null,
  channelName: null,
  uid: null,
  isOnSeat: false,
  isMuted: true,
  isSpeakerOff: false,
  isAudioPlaybackBlocked: false,
  speakerIntervalId: null,
  volumeIntervalId: null,
  speakingUsers: new Set(),
  listeners: new Set(),
};

function notify() {
  state.listeners.forEach((fn) => fn());
}

export function subscribeAgoraGlobal(fn: () => void) {
  state.listeners.add(fn);
  return () => state.listeners.delete(fn);
}

export function getAgoraGlobalState() {
  return {
    isConnected: !!state.client && state.channelName !== null,
    channelName: state.channelName,
    isMuted: state.isMuted,
    isSpeakerOff: state.isSpeakerOff,
    isAudioPlaybackBlocked: state.isAudioPlaybackBlocked,
    isOnSeat: state.isOnSeat,
    speakingUsers: state.speakingUsers,
  };
}

// ── Volume detection ───────────────────────────────────────────────────────
const SPEAK_THRESHOLD = 8; // 0-100 scale

function startVolumeDetection() {
  if (state.volumeIntervalId) return;
  state.volumeIntervalId = setInterval(() => {
    if (!state.client) return;
    const newSpeaking = new Set<string>();

    // Remote users
    for (const user of state.client.remoteUsers) {
      const vol = (user.audioTrack?.getVolumeLevel?.() ?? 0) * 100;
      if (vol > SPEAK_THRESHOLD) {
        newSpeaking.add(String(user.uid));
      }
    }

    // Local user (me) — only when on seat and not muted
    if (state.micTrack && !state.isMuted && state.isOnSeat && state.uid !== null) {
      const localVol = (state.micTrack.getVolumeLevel?.() ?? 0) * 100;
      if (localVol > SPEAK_THRESHOLD) {
        newSpeaking.add(String(state.uid));
      }
    }

    // Only notify if changed
    const prev = state.speakingUsers;
    const changed =
      newSpeaking.size !== prev.size ||
      [...newSpeaking].some((u) => !prev.has(u)) ||
      [...prev].some((u) => !newSpeaking.has(u));

    if (changed) {
      state.speakingUsers = newSpeaking;
      notify();
    }
  }, 150);
}

function stopVolumeDetection() {
  if (state.volumeIntervalId) {
    clearInterval(state.volumeIntervalId);
    state.volumeIntervalId = null;
  }
  if (state.speakingUsers.size > 0) {
    state.speakingUsers = new Set();
    notify();
  }
}

export async function joinAgoraGlobal(
  channelName: string,
  userId: string,
  isOnSeat: boolean,
  getToken: (channel: string, uid: number) => Promise<string | null>
) {
  // Already connected to same channel — just update seat status
  if (state.client && state.channelName === channelName) {
    await updateSeatStatus(isOnSeat);
    return;
  }

  // Leave existing channel first
  await leaveAgoraGlobal();

  if (!APP_ID) throw new Error("معرّف Agora غير مضاف إلى إعدادات التطبيق");

  try {
    const safeChannel = channelName.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 64);
    // يجب أن يطابق هذا الحساب الخادم حرفياً؛ إبقاء الباقي في كل خطوة يمنع
    // فقدان الدقة الرقمية مع معرّفات المستخدمين الطويلة.
    const safeUid = Math.abs(
      userId.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 100000000, 0)
    );

    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    await client.setClientRole(isOnSeat ? "host" : "audience");
    state.client = client;
    state.isOnSeat = isOnSeat;
    state.isAudioPlaybackBlocked = false;

    const markAudioPlaybackBlocked = () => {
      if (!state.isAudioPlaybackBlocked) {
        state.isAudioPlaybackBlocked = true;
        notify();
      }
    };
    const playRemoteAudio = async (track: any) => {
      if (!track || state.isSpeakerOff) return;
      try {
        await Promise.resolve(track.play());
      } catch (error) {
        console.warn("[AgoraGlobal] remote audio autoplay blocked:", error);
        markAudioPlaybackBlocked();
      }
    };

    // Agora يطلق هذا الحدث عندما يمنع المتصفح/Android WebView تشغيل الصوت تلقائياً.
    (AgoraRTC as any).onAutoplayFailed = markAudioPlaybackBlocked;
    (AgoraRTC as any).onAudioAutoplayFailed = markAudioPlaybackBlocked;

    // المسار الرسمي من Agora لكشف مستوى صوت جميع المضيفين والمحلي.
    // getVolumeLevel وحده لا يعيد قيماً ثابتة في بعض إصدارات WebView.
    client.on("volume-indicator", (volumes) => {
      const newSpeaking = new Set<string>();
      for (const volume of volumes) {
        if (Number(volume.level) > SPEAK_THRESHOLD) {
          newSpeaking.add(String(volume.uid));
        }
      }
      const prev = state.speakingUsers;
      const changed =
        newSpeaking.size !== prev.size ||
        [...newSpeaking].some((uid) => !prev.has(uid)) ||
        [...prev].some((uid) => !newSpeaking.has(uid));
      if (changed) {
        state.speakingUsers = newSpeaking;
        notify();
      }
    });
    client.enableAudioVolumeIndicator();

    client.on("user-published", async (user, mediaType) => {
      if (mediaType === "audio") {
        await client.subscribe(user, "audio");
        if (!state.isSpeakerOff) {
          await playRemoteAudio(user.audioTrack);
          try {
            const devices = await AgoraRTC.getPlaybackDevices();
            if (devices?.length > 0) {
              await (user.audioTrack as any)?.setPlaybackDevice(devices[0].deviceId);
            }
          } catch (_) {}
        }
      }
    });

    client.on("user-unpublished", (user) => {
      user.audioTrack?.stop();
    });

    const token = await getToken(safeChannel, safeUid);
    if (!token) throw new Error("تعذر الحصول على رمز Agora للغرفة");

    await client.join(APP_ID, safeChannel, token, safeUid);
    client.on("token-privilege-will-expire", async () => {
      try {
        const renewedToken = await getToken(safeChannel, safeUid);
        if (renewedToken) await client.renewToken(renewedToken);
      } catch (error) {
        console.warn("[AgoraGlobal] token renewal error:", error);
      }
    });
    state.channelName = channelName;
    state.uid = safeUid;

    // Re-route audio on device change
    AgoraRTC.onPlaybackDeviceChanged = async () => {
      try {
        const devices = await AgoraRTC.getPlaybackDevices();
        if (!devices?.length) return;
        for (const u of client.remoteUsers) {
          if (u.audioTrack) {
            await (u.audioTrack as any).setPlaybackDevice(devices[0].deviceId);
          }
        }
      } catch (_) {}
    };

    if (isOnSeat) await startPublishingGlobal();

    // Start volume detection after joining
    startVolumeDetection();

    notify();
  } catch (err) {
    console.error("[AgoraGlobal] join error:", err);
    state.client = null;
    state.channelName = null;
    state.uid = null;
    throw err;
  }
}

async function startPublishingGlobal() {
  if (!state.client || state.micTrack) return;
  try {
    // تأكيد صلاحية الميكروفون في المتصفح وWebView قبل إنشاء مسار Agora.
    // هذا مهم في Android لأن WebView قد لا يطلب RECORD_AUDIO تلقائياً.
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      const permissionProbe = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionProbe.getTracks().forEach((track) => track.stop());
    }

    await state.client.setClientRole("host");
    const track = await AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: "speech_standard",
      AEC: true,
      AGC: true,
      ANS: true,
    });
    state.micTrack = track;
    await state.client.publish([track]);
    await track.setMuted(false);
    state.isMuted = false;
    state.isSpeakerOff = false;
    state.isAudioPlaybackBlocked = false;
    notify();
  } catch (e) {
    console.error("[AgoraGlobal] publish error:", e);
    // لا نحتفظ بمسار ناقص حتى يمكن للمستخدم إعادة المحاولة بعد منح الصلاحية.
    if (state.micTrack) {
      state.micTrack.stop();
      state.micTrack.close();
      state.micTrack = null;
    }
    state.isMuted = true;
    notify();
  }
}

async function stopPublishingGlobal() {
  if (!state.client || !state.micTrack) return;
  try {
    await state.client.unpublish([state.micTrack]);
    state.micTrack.stop();
    state.micTrack.close();
    state.micTrack = null;
    state.isMuted = true;
    notify();
  } catch (_) {}
}

export async function updateSeatStatus(isOnSeat: boolean) {
  if (state.isOnSeat === isOnSeat) return;
  state.isOnSeat = isOnSeat;
  if (isOnSeat) {
    await startPublishingGlobal();
  } else {
    await stopPublishingGlobal();
  }
}

export async function toggleMuteGlobal() {
  if (!state.micTrack) return;
  const newMuted = !state.isMuted;
  await state.micTrack.setMuted(newMuted);
  state.isMuted = newMuted;
  notify();
}

export async function resumeAudioGlobal() {
  try {
    const resume = (AgoraRTC as any).resumeAudioContext;
    if (typeof resume === "function") await resume.call(AgoraRTC);
    if (state.client) {
      for (const user of state.client.remoteUsers) {
        if (user.audioTrack && !state.isSpeakerOff) {
          try { await Promise.resolve(user.audioTrack.play()); } catch (_) {}
        }
      }
    }
    state.isAudioPlaybackBlocked = false;
    notify();
  } catch (error) {
    console.warn("[AgoraGlobal] resume audio error:", error);
    state.isAudioPlaybackBlocked = true;
    notify();
  }
}

export async function toggleSpeakerGlobal() {
  const newOff = !state.isSpeakerOff;
  state.isSpeakerOff = newOff;
  if (state.client) {
    for (const u of state.client.remoteUsers) {
      if (newOff) {
        u.audioTrack?.stop();
      } else {
        u.audioTrack?.play();
        try {
          const devices = await AgoraRTC.getPlaybackDevices();
          if (devices?.length > 0) {
            await (u.audioTrack as any)?.setPlaybackDevice(devices[0].deviceId);
          }
        } catch (_) {}
      }
    }
  }
  notify();
}

export async function leaveAgoraGlobal() {
  stopVolumeDetection();
  if (state.speakerIntervalId) {
    clearInterval(state.speakerIntervalId);
    state.speakerIntervalId = null;
  }
  if (state.micTrack) {
    state.micTrack.stop();
    state.micTrack.close();
    state.micTrack = null;
  }
  if (state.client) {
    try { await state.client.leave(); } catch (_) {}
    state.client = null;
  }
  state.channelName = null;
  state.uid = null;
  state.isOnSeat = false;
  state.isMuted = true;
  notify();
}
