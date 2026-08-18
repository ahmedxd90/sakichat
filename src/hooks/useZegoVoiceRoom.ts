import { useEffect, useRef, useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { createZegoVoiceEffect, destroyZegoVoiceEffect, type ZegoVoiceEffectHandle } from "../lib/zegoVoiceEffects";

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
  squirrelVoiceEnabled: boolean;
  setSquirrelVoiceEnabled: (enabled: boolean) => Promise<void>;
  childVoiceEnabled: boolean;
  setChildVoiceEnabled: (enabled: boolean) => Promise<void>;
}

export function useZegoVoiceRoom(
  roomId: string,
  userId: string,
  userName: string,
  enabled: boolean,
  isOnSeat: boolean,
  _token: string | null,
  isGloballyMuted = false
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
  const [squirrelVoiceEnabled, setSquirrelVoiceEnabledState] = useState(false);
  const [childVoiceEnabled, setChildVoiceEnabledState] = useState(false);
  const joinedRef = useRef(false);
  const isSpeakerOffRef = useRef(false);
  const squirrelVoiceEnabledRef = useRef(false);
  const childVoiceEnabledRef = useRef(false);
  const voiceEffectRef = useRef<ZegoVoiceEffectHandle | null>(null);
  const remoteStreamsRef = useRef<Map<string, any>>(new Map());
  const speakingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const generateToken = useAction(api.zego.generateToken);

  const markSpeaking = useCallback((speakerId: string, level: number) => {
    if (!speakerId) return;
    const numericLevel = Number(level);
    if (!Number.isFinite(numericLevel) || numericLevel <= 0.5) return;

    const raw = String(speakerId);
    const base = raw.replace(/^pub_/, "");
    const sanitized = base.replace(/[^a-zA-Z0-9_-]/g, "");
    // Keep aliases so seat grids can match ZEGOCLOUD stream IDs, raw IDs,
    // sanitized IDs, and the legacy hashed Agora-style ID.
    const hash = String(Math.abs(base.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0) % 100000000));
    const aliases = [...new Set([raw, base, sanitized, `pub_${base}`, `pub_${sanitized}`, hash, `pub_${hash}`].filter(Boolean))];
    const timers = speakingTimersRef.current;

    setSpeakingUsers((prev) => {
      const next = new Set(prev);
      aliases.forEach((alias) => next.add(alias));
      return next;
    });

    aliases.forEach((alias) => {
      const oldTimer = timers.get(alias);
      if (oldTimer) clearTimeout(oldTimer);
      timers.set(alias, setTimeout(() => {
        setSpeakingUsers((prev) => {
          if (!prev.has(alias)) return prev;
          const next = new Set(prev);
          next.delete(alias);
          return next;
        });
        timers.delete(alias);
      }, 500));
    });
  }, []);

  const destroyEngine = useCallback(() => {
    if (zegoRef.current) {
      try { zegoRef.current.destroyEngine(); } catch (_e) {}
      zegoRef.current = null;
    }
  }, []);

  const cleanup = useCallback(async () => {
    if (voiceEffectRef.current) {
      await destroyZegoVoiceEffect(voiceEffectRef.current);
      voiceEffectRef.current = null;
    }
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
    squirrelVoiceEnabledRef.current = false;
    childVoiceEnabledRef.current = false;
    setSquirrelVoiceEnabledState(false);
    setChildVoiceEnabledState(false);
  }, [roomId, userId, destroyEngine]);

  const startPublishing = useCallback(async () => {
    if (isGloballyMuted || !isOnSeat || !zegoRef.current || localStreamRef.current) return;
    try {
      const stream = await zegoRef.current.createStream({ camera: { audio: true, video: false } });
      localStreamRef.current = stream;
      if (typeof zegoRef.current.setVoiceChangerParam === "function") {
        if (squirrelVoiceEnabledRef.current) await zegoRef.current.setVoiceChangerParam(stream, 8);
        else if (childVoiceEnabledRef.current) await zegoRef.current.setVoiceChangerParam(stream, 11);
      }
      await zegoRef.current.startPublishingStream(`pub_${userId}`, stream);
      setIsPublishing(true);
      setIsMuted(false);
    } catch (e) {
      setIsPublishing(false);
      console.warn("ZEGO: Failed to publish mic", e);
    }
  }, [isGloballyMuted, isOnSeat, userId]);

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
    if (isOnSeat && !isGloballyMuted) startPublishing();
    else stopPublishing();
  }, [isOnSeat, isGloballyMuted, isConnected, startPublishing, stopPublishing]);

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

      // ZEGOCLOUD Web SDK returns remote levels as Record<streamID, level>,
      // not as an array of objects. Normalize both formats for SDK compatibility.
      const handleRemoteSoundLevels = (payload: any) => {
        if (Array.isArray(payload)) {
          for (const item of payload) {
            const streamId = String(item?.streamID ?? item?.streamId ?? item?.userID ?? item?.userId ?? "");
            const level = Number(item?.soundLevel ?? item?.level ?? item?.volume ?? 0);
            markSpeaking(streamId.replace(/^pub_/, ""), level);
          }
          return;
        }
        if (payload && typeof payload === "object") {
          for (const [streamId, rawLevel] of Object.entries(payload)) {
            markSpeaking(String(streamId).replace(/^pub_/, ""), Number(rawLevel));
          }
        }
      };
      (zego as any).on("remoteSoundLevelUpdate", handleRemoteSoundLevels);

      const handleLocalSoundLevel = (payload: any) => {
        const level = typeof payload === "number"
          ? payload
          : Number(payload?.soundLevel ?? payload?.level ?? payload?.volume ?? 0);
        if (localStreamRef.current) markSpeaking(userId, level);
      };
      // Official Web SDK event name is capturedSoundLevelUpdate; retain the
      // legacy alias for older SDK builds used by some Android WebViews.
      (zego as any).on("capturedSoundLevelUpdate", handleLocalSoundLevel);
      (zego as any).on("localSoundLevelUpdate", handleLocalSoundLevel);

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

  const applyVoiceEffect = useCallback(async (effect: "none" | "squirrel" | "child") => {
    const engine = zegoRef.current;
    const stream = localStreamRef.current;
    if (!engine || !stream || typeof engine.replaceTrack !== "function") {
      if (effect !== "none") setError("مسار المؤثر الصوتي غير جاهز؛ اجلس على المقعد أولًا");
      return;
    }
    try {
      if (voiceEffectRef.current) {
        await engine.replaceTrack(stream, stream.getAudioTracks()[0]);
        await destroyZegoVoiceEffect(voiceEffectRef.current);
        voiceEffectRef.current = null;
      }
      if (effect !== "none") {
        const handle = await createZegoVoiceEffect(stream, effect);
        await engine.replaceTrack(stream, handle.processedTrack);
        voiceEffectRef.current = handle;
      }
      squirrelVoiceEnabledRef.current = effect === "squirrel";
      childVoiceEnabledRef.current = effect === "child";
      setSquirrelVoiceEnabledState(effect === "squirrel");
      setChildVoiceEnabledState(effect === "child");
      setError(null);
    } catch (e: any) {
      if (voiceEffectRef.current) {
        await destroyZegoVoiceEffect(voiceEffectRef.current);
        voiceEffectRef.current = null;
      }
      try { await engine.replaceTrack(stream, stream.getAudioTracks()[0]); } catch (_) {}
      squirrelVoiceEnabledRef.current = false;
      childVoiceEnabledRef.current = false;
      setSquirrelVoiceEnabledState(false);
      setChildVoiceEnabledState(false);
      setError(e?.message || "تعذر تشغيل مؤثر الصوت");
    }
  }, []);

  const setSquirrelVoiceEnabled = useCallback(async (enabled: boolean) => {
    await applyVoiceEffect(enabled ? "squirrel" : "none");
  }, [applyVoiceEffect]);

  const setChildVoiceEnabled = useCallback(async (enabled: boolean) => {
    await applyVoiceEffect(enabled ? "child" : "none");
  }, [applyVoiceEffect]);

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
    squirrelVoiceEnabled,
    setSquirrelVoiceEnabled,
    childVoiceEnabled,
    setChildVoiceEnabled,
  };
}
