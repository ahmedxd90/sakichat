import { useEffect, useRef, useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// Public ZEGOCLOUD connection values for the Android pilot. The ServerSecret never belongs here.
const APP_ID = parseInt(import.meta.env.VITE_ZEGO_APP_ID || "736552649", 10);
const SERVER = import.meta.env.VITE_ZEGO_SERVER || "wss://webliveroom736552649-api.coolzcloud.com/ws";

async function requestPermissions(): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return "الميكروفون غير متاح داخل WebView هذا الجهاز";
  }
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach((t) => t.stop());
    return null;
  } catch (e: any) {
    return e?.name === "NotAllowedError"
      ? "تم رفض صلاحية الميكروفون. افتح إعدادات التطبيق > الصلاحيات > الميكروفون واسمح بها ثم أعد دخول الغرفة"
      : `تعذر تشغيل الميكروفون: ${e?.message || String(e)}`;
  }
}

export interface ZegoVoiceRoomState {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isSpeakerOff: boolean;
  isPublishing: boolean;
  remoteAudioCount: number;
  speakingUsers: Set<string>;
  error: string | null;
  toggleMute: () => Promise<void>;
  toggleSpeaker: () => void;
  setMicEnabled: (enabled: boolean) => Promise<void>;
  leaveVoiceRoom: () => Promise<void>;
}

export function useZegoVoiceRoom(
  roomId: string,
  userId: string,
  userName: string,
  enabled: boolean,
  isOnSeat: boolean,
  _token: string | null
): ZegoVoiceRoomState {
  const zegoRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [remoteAudioCount, setRemoteAudioCount] = useState(0);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const joinedRef = useRef(false);
  const isSpeakerOffRef = useRef(false);
  const remoteStreamsRef = useRef<Map<string, any>>(new Map());
  const speakingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const generateToken = useAction(api.zego.generateToken);

  const markSpeaking = useCallback((speakerId: string, level: number) => {
    if (!speakerId) return;
    const timers = speakingTimersRef.current;
    const oldTimer = timers.get(speakerId);
    if (oldTimer) clearTimeout(oldTimer);
    if (Number(level) > 3) {
      setSpeakingUsers((prev) => {
        const next = new Set(prev);
        next.add(speakerId);
        return next;
      });
      timers.set(speakerId, setTimeout(() => {
        setSpeakingUsers((prev) => {
          if (!prev.has(speakerId)) return prev;
          const next = new Set(prev);
          next.delete(speakerId);
          return next;
        });
        timers.delete(speakerId);
      }, 650));
    }
  }, []);

  const destroyEngine = useCallback(() => {
    if (zegoRef.current) {
      try { zegoRef.current.destroyEngine(); } catch (_e) {}
      zegoRef.current = null;
    }
  }, []);

  const cleanup = useCallback(async () => {
    if (localStreamRef.current && zegoRef.current) {
      try {
        zegoRef.current.stopPublishingStream(`pub_${userId}`);
        zegoRef.current.destroyStream(localStreamRef.current);
      } catch (_e) {}
      localStreamRef.current = null;
    }
    if (zegoRef.current && joinedRef.current) {
      try { await zegoRef.current.logoutRoom(roomId); } catch (_e) {}
    }
    destroyEngine();
    joinedRef.current = false;
    remoteStreamsRef.current.clear();
    speakingTimersRef.current.forEach((timer) => clearTimeout(timer));
    speakingTimersRef.current.clear();
    setIsConnected(false);
    setIsConnecting(false);
    setIsPublishing(false);
    setRemoteAudioCount(0);
    setSpeakingUsers(new Set());
  }, [roomId, userId, destroyEngine]);

  const startPublishing = useCallback(async () => {
    if (!zegoRef.current || localStreamRef.current) return;
    try {
      const stream = await zegoRef.current.createStream({ camera: { audio: true, video: false } });
      localStreamRef.current = stream;
      await zegoRef.current.startPublishingStream(`pub_${userId}`, stream);
      setIsPublishing(true);
      setIsMuted(false);
    } catch (e) {
      setIsPublishing(false);
      console.warn("ZEGO: Failed to publish mic", e);
    }
  }, [userId]);

  const stopPublishing = useCallback(async () => {
    if (!zegoRef.current || !localStreamRef.current) return;
    try {
      zegoRef.current.stopPublishingStream(`pub_${userId}`);
      zegoRef.current.destroyStream(localStreamRef.current);
      localStreamRef.current = null;
      setIsPublishing(false);
      setIsMuted(true);
    } catch (_e) {}
  }, [userId]);

  useEffect(() => {
    if (!isConnected) return;
    if (isOnSeat) startPublishing();
    else stopPublishing();
  }, [isOnSeat, isConnected]);

  const initEngine = useCallback(async () => {
    if (!enabled || !userId || !roomId) return;
    if (!APP_ID || !SERVER) {
      setError(`ZEGO غير مهيأ: APP_ID=${APP_ID} SERVER=${SERVER ? "موجود" : "مفقود"}`);
      return;
    }
    if (joinedRef.current || zegoRef.current) return;

    const permissionError = await requestPermissions();
    if (permissionError) {
      setError(permissionError);
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");
      const zego = new ZegoExpressEngine(APP_ID, SERVER);
      zegoRef.current = zego;

      const capabilities = await (zego as any).checkSystemRequirements?.();
      if (capabilities && (!capabilities.webRTC || !capabilities.microphone)) {
        const missing = [
          !capabilities.webRTC ? "WebRTC" : "",
          !capabilities.microphone ? "الميكروفون" : "",
        ].filter(Boolean).join(" و ");
        setError(`الجهاز لا يدعم ${missing} داخل WebView`);
        setIsConnecting(false);
        destroyEngine();
        return;
      }

      zego.on("roomStateChanged", (_rID: string, reason: string, errorCode: number) => {
        console.log("ZEGO roomStateChanged:", reason, "code:", errorCode);
        if (reason === "LOGINED") {
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          joinedRef.current = true;
        } else if (reason === "LOGIN_FAILED" || reason === "KICKED_OUT") {
          setIsConnected(false);
          setIsConnecting(false);
          joinedRef.current = false;
          setError(`فشل الدخول للغرفة الصوتية (${reason}) - كود الخطأ: ${errorCode}`);
        } else if (reason === "RECONNECTING") {
          setIsConnecting(true);
        } else if (reason === "RECONNECTED") {
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
        }
      });

      zego.on("roomStreamUpdate", async (_rID: string, updateType: string, streamList: any[]) => {
        if (updateType === "ADD") {
          for (const s of streamList) {
            try {
              const remoteStream = await zego.startPlayingStream(s.streamID);
              remoteStreamsRef.current.set(s.streamID, remoteStream);
              setRemoteAudioCount(remoteStreamsRef.current.size);
              if (!isSpeakerOffRef.current) {
                const audio = document.createElement("audio");
                audio.autoplay = true;
                audio.controls = false;
                audio.muted = false;
                audio.volume = 1;
                audio.setAttribute("playsinline", "true");
                audio.srcObject = remoteStream;
                audio.setAttribute("data-zego-stream", s.streamID);
                document.body.appendChild(audio);
                // Android WebView may not honor autoplay for a newly attached MediaStream.
                // Explicitly start playback and surface a useful error if the platform blocks it.
                void audio.play().catch((e) => {
                  console.warn("ZEGO: remote audio play blocked", e);
                  setError("الصوت متصل لكن تشغيل السماعة محظور. اضغط داخل الغرفة مرة واحدة ثم أعد المحاولة");
                  const retryPlayback = () => {
                    void audio.play().catch(() => {});
                  };
                  document.addEventListener("pointerdown", retryPlayback, { once: true, passive: true });
                });
              }
            } catch (_e) {}
          }
        } else if (updateType === "DELETE") {
          for (const s of streamList) {
            try {
              zego.stopPlayingStream(s.streamID);
              remoteStreamsRef.current.delete(s.streamID);
              setRemoteAudioCount(remoteStreamsRef.current.size);
              const el = document.querySelector(`audio[data-zego-stream="${s.streamID}"]`);
              if (el) el.remove();
            } catch (_e) {}
          }
        }
      });

      (zego as any).on("remoteSoundLevelUpdate", (payload: any) => {
        const list = Array.isArray(payload) ? payload : [];
        for (const item of list) {
          const streamId = String(item?.streamID ?? item?.streamId ?? item?.userID ?? item?.userId ?? "");
          const speakerId = streamId.replace(/^pub_/, "");
          const level = Number(item?.soundLevel ?? item?.level ?? item?.volume ?? 0);
          markSpeaking(speakerId, level);
        }
      });

      (zego as any).on("localSoundLevelUpdate", (payload: any) => {
        const level = typeof payload === "number"
          ? payload
          : Number(payload?.soundLevel ?? payload?.level ?? payload?.volume ?? 0);
        if (localStreamRef.current) markSpeaking(userId, level);
      });

      // Generate token
      let token: string;
      try {
        console.log("ZEGO: Generating token for userId:", userId, "roomId:", roomId);
        token = await generateToken({ roomId, userId });
        console.log("ZEGO: Token generated OK, length:", token?.length);
      } catch (e: any) {
        const msg = e?.message || String(e);
        console.error("ZEGO: Token generation error:", msg);
        setError("فشل توليد التوكن: " + msg);
        setIsConnecting(false);
        destroyEngine();
        return;
      }

      console.log("ZEGO: Logging into room:", roomId);
      await zego.loginRoom(
        roomId,
        token,
        { userID: userId, userName: userName || userId },
        { userUpdate: true }
      );
      (zego as any).startSoundLevelMonitor?.({ millisecond: 100 });
      if (isOnSeat) await startPublishing();

    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("ZEGO: Fatal error:", msg);
      setError("خطأ في الصوت: " + msg);
      setIsConnecting(false);
      joinedRef.current = false;
      destroyEngine();
    }
  }, [roomId, userId, userName, enabled, isOnSeat, startPublishing, generateToken, destroyEngine, markSpeaking]);

  useEffect(() => {
    if (enabled && userId && roomId) initEngine();
    return () => { cleanup(); };
  }, [enabled, userId, roomId]);

  const toggleMute = useCallback(async () => {
    if (!localStreamRef.current || !zegoRef.current) return;
    const newMuted = !isMuted;
    try { zegoRef.current.muteMicrophone(newMuted); setIsMuted(newMuted); } catch (_e) {}
  }, [isMuted]);

  const toggleSpeaker = useCallback(() => {
    const newOff = !isSpeakerOff;
    isSpeakerOffRef.current = newOff;
    setIsSpeakerOff(newOff);
    document.querySelectorAll<HTMLAudioElement>("audio[data-zego-stream]").forEach((el) => {
      el.muted = newOff;
    });
  }, [isSpeakerOff]);

  const setMicEnabled = useCallback(async (en: boolean) => {
    if (!zegoRef.current) return;
    try { zegoRef.current.muteMicrophone(!en); setIsMuted(!en); } catch (_e) {}
  }, []);

  const leaveVoiceRoom = useCallback(async () => { await cleanup(); }, [cleanup]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    isSpeakerOff,
    isPublishing,
    remoteAudioCount,
    speakingUsers,
    error,
    toggleMute,
    toggleSpeaker,
    setMicEnabled,
    leaveVoiceRoom,
  };
}
