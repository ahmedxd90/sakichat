import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  joinAgoraGlobal,
  leaveAgoraGlobal,
  toggleMuteGlobal,
  toggleSpeakerGlobal,
  updateSeatStatus,
  setSquirrelVoiceEnabled,
  getAgoraGlobalState,
  subscribeAgoraGlobal,
} from "../lib/agoraGlobal";

export interface AgoraVoiceRoomState {
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
  squirrelVoiceEnabled: boolean;
  setSquirrelVoiceEnabled: (enabled: boolean) => Promise<void>;
  childVoiceEnabled: boolean;
  setChildVoiceEnabled: (enabled: boolean) => Promise<void>;
}

export function useAgoraVoiceRoom(
  roomId: string,
  userId: string,
  _userName: string,
  enabled: boolean,
  isOnSeat: boolean,
  _agoraToken: string | null
): AgoraVoiceRoomState {
  const [, forceUpdate] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [speakingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const isLeavingRef = useRef(false);

  const generateToken = async ({ channelName, uid }: { channelName: string; uid: string }) => {
    const { data, error } = await supabase.functions.invoke('agora-token', {
      body: { channelName, uid }
    });
    if (error) throw error;
    return data.token;
  };

  // Subscribe to global state changes
  useEffect(() => {
    const unsub = subscribeAgoraGlobal(() => forceUpdate((n) => n + 1));
    return () => { unsub(); };
  }, []);

  // Join / switch channel
  useEffect(() => {
    if (!enabled || !userId || !roomId) return;

    isLeavingRef.current = false;
    setIsConnecting(true);
    setError(null);

    const safeChannel = roomId.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 64);

    joinAgoraGlobal(
      safeChannel,
      userId,
      isOnSeat,
      async (channel, uid) => {
        try {
          return await generateToken({ channelName: channel, uid });
        } catch (_) {
          return null;
        }
      }
    )
      .then(() => setIsConnecting(false))
      .catch((e) => {
        setError(e?.message || "فشل الاتصال بالغرفة الصوتية");
        setIsConnecting(false);
      });

    // Cleanup: only leave if this component is truly unmounting (not going to background)
    return () => {
      if (!isLeavingRef.current) {
        // Don't leave — the global client persists for background mode
        // leaveAgoraGlobal() is called explicitly when user leaves the room
      }
    };
  }, [enabled, userId, roomId]);

  // React to seat changes
  useEffect(() => {
    const globalState = getAgoraGlobalState();
    if (globalState.isConnected) {
      updateSeatStatus(isOnSeat).catch(() => {});
    }
  }, [isOnSeat]);

  const toggleMute = useCallback(async () => {
    await toggleMuteGlobal();
  }, []);

  const toggleSpeaker = useCallback(async () => {
    await toggleSpeakerGlobal();
  }, []);

  const setMicEnabled = useCallback(async (micEnabled: boolean) => {
    const gs = getAgoraGlobalState();
    if (gs.isMuted === !micEnabled) return;
    await toggleMuteGlobal();
  }, []);

  const leaveVoiceRoom = useCallback(async () => {
    isLeavingRef.current = true;
    await leaveAgoraGlobal();
  }, []);

  const setSquirrelVoice = useCallback(async (enabled: boolean) => {
    await setSquirrelVoiceEnabled(enabled);
  }, []);
  const setChildVoice = useCallback(async (_enabled: boolean) => {
    // The Android production path uses ZEGOCLOUD. Keep the Agora fallback safe and unchanged.
  }, []);

  const globalState = getAgoraGlobalState();

  return {
    isConnected: globalState.isConnected,
    isConnecting,
    isMuted: globalState.isMuted,
    isSpeakerOff: globalState.isSpeakerOff,
    speakingUsers: globalState.speakingUsers,
    error,
    toggleMute,
    toggleSpeaker,
    setMicEnabled,
    leaveVoiceRoom,
    squirrelVoiceEnabled: globalState.squirrelVoiceEnabled,
    setSquirrelVoiceEnabled: setSquirrelVoice,
    childVoiceEnabled: false,
    setChildVoiceEnabled: setChildVoice,
  };
}
