import { useEffect, useRef, useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

const APP_ID = parseInt(import.meta.env.VITE_ZEGO_APP_ID || "0", 10);
const SERVER = import.meta.env.VITE_ZEGO_SERVER || "";

async function requestPermissions() {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach((t) => t.stop());
  } catch (_e) {}
}

export interface ZegoVoiceRoomState {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isSpeakerOff: boolean;
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
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const joinedRef = useRef(false);
  const isSpeakerOffRef = useRef(false);
  const remoteStreamsRef = useRef<Map<string, any>>(new Map());
  const generateToken = useAction(api.zego.generateToken);

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
    setIsConnected(false);
    setIsConnecting(false);
    setSpeakingUsers(new Set());
  }, [roomId, userId, destroyEngine]);

  const startPublishing = useCallback(async () => {
    if (!zegoRef.current || localStreamRef.current) return;
    try {
      const stream = await zegoRef.current.createStream({ camera: { audio: true, video: false } });
      localStreamRef.current = stream;
      zegoRef.current.startPublishingStream(`pub_${userId}`, stream);
      setIsMuted(false);
    } catch (e) {
      console.warn("ZEGO: Failed to publish mic", e);
    }
  }, [userId]);

  const stopPublishing = useCallback(async () => {
    if (!zegoRef.current || !localStreamRef.current) return;
    try {
      zegoRef.current.stopPublishingStream(`pub_${userId}`);
      zegoRef.current.destroyStream(localStreamRef.current);
      localStreamRef.current = null;
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

    await requestPermissions();

    setIsConnecting(true);
    setError(null);

    try {
      const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");
      const zego = new ZegoExpressEngine(APP_ID, SERVER);
      zegoRef.current = zego;

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
              if (!isSpeakerOffRef.current) {
                const audio = document.createElement("audio");
                audio.autoplay = true;
                audio.srcObject = remoteStream;
                audio.setAttribute("data-zego-stream", s.streamID);
                document.body.appendChild(audio);
              }
            } catch (_e) {}
          }
        } else if (updateType === "DELETE") {
          for (const s of streamList) {
            try {
              zego.stopPlayingStream(s.streamID);
              remoteStreamsRef.current.delete(s.streamID);
              const el = document.querySelector(`audio[data-zego-stream="${s.streamID}"]`);
              if (el) el.remove();
            } catch (_e) {}
          }
        }
      });

      (zego as any).on("remoteSoundLevelUpdate", (list: Array<{ streamID: string; soundLevel: number }>) => {
        const speaking = new Set<string>();
        for (const item of list) {
          if (item.soundLevel > 10) speaking.add(item.streamID.replace(/^pub_/, ""));
        }
        setSpeakingUsers(speaking);
      });

      (zego as any).on("localSoundLevelUpdate", (soundLevel: number) => {
        setSpeakingUsers((prev) => {
          const next = new Set(prev);
          if (soundLevel > 10 && localStreamRef.current) next.add(userId);
          else next.delete(userId);
          return next;
        });
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
      (zego as any).startSoundLevelMonitor?.({ millisecond: 300 });
      if (isOnSeat) await startPublishing();

    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("ZEGO: Fatal error:", msg);
      setError("خطأ في الصوت: " + msg);
      setIsConnecting(false);
      joinedRef.current = false;
      destroyEngine();
    }
  }, [roomId, userId, userName, enabled, isOnSeat, startPublishing, generateToken, destroyEngine]);

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
    speakingUsers,
    error,
    toggleMute,
    toggleSpeaker,
    setMicEnabled,
    leaveVoiceRoom,
  };
}
