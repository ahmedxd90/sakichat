// Global Agora client singleton — persists across component unmounts
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || "";

interface GlobalAgoraState {
  client: IAgoraRTCClient | null;
  micTrack: any;
  rawMicTrack: IMicrophoneAudioTrack | null;
  squirrelVoiceEnabled: boolean;
  squirrelAudioContext: AudioContext | null;
  squirrelProcessor: AudioNode | null;
  channelName: string | null;
  uid: number | null;
  isOnSeat: boolean;
  isMuted: boolean;
  isSpeakerOff: boolean;
  speakerIntervalId: ReturnType<typeof setInterval> | null;
  volumeIntervalId: ReturnType<typeof setInterval> | null;
  speakingUsers: Set<string>;
  listeners: Set<() => void>;
}

const state: GlobalAgoraState = {
  client: null,
  micTrack: null,
  rawMicTrack: null,
  squirrelVoiceEnabled: false,
  squirrelAudioContext: null,
  squirrelProcessor: null,
  channelName: null,
  uid: null,
  isOnSeat: false,
  isMuted: true,
  isSpeakerOff: false,
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
    isOnSeat: state.isOnSeat,
    speakingUsers: state.speakingUsers,
    squirrelVoiceEnabled: state.squirrelVoiceEnabled,
  };
}

async function createSquirrelTrack(rawTrack: IMicrophoneAudioTrack) {
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return rawTrack;
  const context = new AudioContextCtor();
  await context.resume().catch(() => {});
  const source = context.createMediaStreamSource(new MediaStream([rawTrack.getMediaStreamTrack()]));
  const destination = context.createMediaStreamDestination();
  let processor: AudioNode;

  const connectFallback = () => {
    const fallback = context.createScriptProcessor(8192, 1, 1);
    const filter = context.createBiquadFilter();
    filter.type = "highshelf"; filter.frequency.value = 1800; filter.gain.value = 8;
    source.connect(fallback); fallback.connect(filter); filter.connect(destination);
    return fallback;
  };
  if (context.audioWorklet?.addModule && typeof AudioWorkletNode !== "undefined") {
    const workletCode = `
      class SakiSquirrelProcessor extends AudioWorkletProcessor {
        constructor() { super(); this.buffer = new Float32Array(32768); this.write = 0; this.read = 0; this.ready = false; this.pitch = 1.48; }
        process(inputs, outputs) {
          const input = inputs[0]?.[0]; const output = outputs[0]?.[0];
          if (!output) return true;
          if (input) for (let i = 0; i < input.length; i++) { this.buffer[this.write] = input[i]; this.write = (this.write + 1) % this.buffer.length; }
          let available = (this.write - this.read + this.buffer.length) % this.buffer.length;
          if (!this.ready && available > 8192) { this.read = (this.write - 8192 + this.buffer.length) % this.buffer.length; this.ready = true; }
          for (let i = 0; i < output.length; i++) {
            available = (this.write - this.read + this.buffer.length) % this.buffer.length;
            if (!this.ready || available < 4) { output[i] = 0; continue; }
            const a = this.buffer[Math.floor(this.read)];
            const b = this.buffer[(Math.floor(this.read) + 1) % this.buffer.length];
            const f = this.read - Math.floor(this.read);
            output[i] = (a + (b - a) * f) * 0.82;
            this.read = (this.read + this.pitch) % this.buffer.length;
          }
          return true;
        }
      }
      registerProcessor('saki-squirrel-voice', SakiSquirrelProcessor);
    `;
    const blobUrl = URL.createObjectURL(new Blob([workletCode], { type: "application/javascript" }));
    try {
      await context.audioWorklet.addModule(blobUrl);
      const worklet = new AudioWorkletNode(context, "saki-squirrel-voice", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      source.connect(worklet);
      worklet.connect(destination);
      processor = worklet;
    } catch {
      processor = connectFallback();
    } finally { URL.revokeObjectURL(blobUrl); }
  } else {
    processor = connectFallback();
  }
  state.squirrelAudioContext = context;
  state.squirrelProcessor = processor;
  return AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: destination.stream.getAudioTracks()[0] });
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

  if (!APP_ID) return;

  try {
    const safeChannel = channelName.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 64);
    const safeUid = Math.abs(
      userId.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0) % 100000000
    );

    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    await client.setClientRole(isOnSeat ? "host" : "audience");
    state.client = client;
    state.isOnSeat = isOnSeat;

    client.on("user-published", async (user, mediaType) => {
      if (mediaType === "audio") {
        await client.subscribe(user, "audio");
        if (!state.isSpeakerOff) {
          user.audioTrack?.play();
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

    let token: string | null = null;
    try {
      token = await getToken(safeChannel, safeUid);
    } catch (_) {}

    await client.join(APP_ID, safeChannel, token, safeUid);
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
  }
}

async function startPublishingGlobal() {
  if (!state.client || state.micTrack) return;
  try {
    await state.client.setClientRole("host");
    const rawTrack = await AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: "speech_standard",
      AEC: true,
      AGC: true,
      ANS: true,
    });
    state.rawMicTrack = rawTrack;
    const track = state.squirrelVoiceEnabled ? await createSquirrelTrack(rawTrack) : rawTrack;
    state.micTrack = track;
    await state.client.publish([track]);
    await track.setMuted(false);
    state.isMuted = false;
    notify();
  } catch (e) {
    console.warn("[AgoraGlobal] publish error:", e);
  }
}

async function stopPublishingGlobal() {
  if (!state.client || !state.micTrack) return;
  try {
    await state.client.unpublish([state.micTrack]);
    state.micTrack.stop();
    state.micTrack.close();
    state.micTrack = null;
    state.rawMicTrack?.stop();
    state.rawMicTrack?.close();
    state.rawMicTrack = null;
    state.squirrelProcessor?.disconnect();
    state.squirrelProcessor = null;
    await state.squirrelAudioContext?.close().catch(() => {});
    state.squirrelAudioContext = null;
    state.isMuted = true;
    notify();
  } catch (_) {}
}

export async function setSquirrelVoiceEnabled(enabled: boolean) {
  if (state.squirrelVoiceEnabled === enabled) return;
  state.squirrelVoiceEnabled = enabled;
  if (state.client && state.isOnSeat && state.micTrack) {
    await stopPublishingGlobal();
    await startPublishingGlobal();
  }
  notify();
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
  state.rawMicTrack?.stop();
  state.rawMicTrack?.close();
  state.rawMicTrack = null;
  state.squirrelProcessor?.disconnect();
  state.squirrelProcessor = null;
  await state.squirrelAudioContext?.close().catch(() => {});
  state.squirrelAudioContext = null;
  if (state.client) {
    try { await state.client.leave(); } catch (_) {}
    state.client = null;
  }
  state.channelName = null;
  state.uid = null;
  state.isOnSeat = false;
  state.isMuted = true;
  state.squirrelVoiceEnabled = false;
  notify();
}
