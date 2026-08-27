import { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || "";

export interface VideoCallState {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  remoteUser: IAgoraRTCRemoteUser | null;
  error: string | null;
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  remoteVideoRef: React.RefObject<HTMLDivElement | null>;
  toggleMute: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  switchCamera: () => Promise<void>;
  leave: () => Promise<void>;
}

function getUserUid(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash * 31) + userId.charCodeAt(i)) >>> 0;
  }
  return (hash % 999998) + 1; // 1 to 999999
}

export function useAgoraVideoCall(
  channelName: string,
  userId: string,
  enabled: boolean
): VideoCallState {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const cameraTrackRef = useRef<ICameraVideoTrack | null>(null);
  const micTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const facingModeRef = useRef<"user" | "environment">("user");
  const mountedRef = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateToken = async (args: any) => {
    return null; // Mock for now
  };

  // Retry playing video until the DOM element is ready
  const playVideoWithRetry = useCallback(
    (
      track: { play: (el: HTMLDivElement) => void } | undefined | null,
      refGetter: () => HTMLDivElement | null,
      label: string,
      attempts = 0
    ) => {
      if (!track) return;
      const el = refGetter();
      if (el) {
        try {
          track.play(el);
        } catch (e) {
          console.warn(`${label} play error:`, e);
        }
      } else if (attempts < 30) {
        setTimeout(() => playVideoWithRetry(track, refGetter, label, attempts + 1), 150);
      }
    },
    []
  );

  const cleanup = useCallback(async () => {
    try {
      cameraTrackRef.current?.stop();
      cameraTrackRef.current?.close();
      micTrackRef.current?.stop();
      micTrackRef.current?.close();
      cameraTrackRef.current = null;
      micTrackRef.current = null;
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled || !channelName || !userId) return;

    const init = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        if (!APP_ID) {
          setError("يرجى إضافة VITE_AGORA_APP_ID في ملف .env.local");
          setIsConnecting(false);
          return;
        }

        const uid = getUserUid(userId);

        // Get token (null = testing mode without certificate)
        let token: string | null = null;
        try {
          token = await generateToken({ channelName, uid });
        } catch (e) {
          console.warn("Token generation skipped (no certificate):", e);
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (!mountedRef.current) return;

          // Spread to trigger re-render
          setRemoteUser({ ...user } as IAgoraRTCRemoteUser);

          if (mediaType === "video" && user.videoTrack) {
            playVideoWithRetry(
              user.videoTrack,
              () => remoteVideoRef.current,
              "Remote video"
            );
          }
          if (mediaType === "audio" && user.audioTrack) {
            user.audioTrack.play();
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (!mountedRef.current) return;
          if (mediaType === "video") {
            setRemoteUser(prev =>
              prev?.uid === user.uid ? ({ ...user } as IAgoraRTCRemoteUser) : prev
            );
          }
        });

        client.on("user-left", () => {
          if (mountedRef.current) setRemoteUser(null);
        });

        await client.join(APP_ID, channelName, token, uid);

        const [micTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: "music_standard" },
          { encoderConfig: "480p_1", facingMode: "user" }
        );
        micTrackRef.current = micTrack;
        cameraTrackRef.current = cameraTrack;

        // Play local video with retry
        playVideoWithRetry(
          cameraTrack,
          () => localVideoRef.current,
          "Local video"
        );

        await client.publish([micTrack, cameraTrack]);

        if (mountedRef.current) {
          setIsConnected(true);
          setIsConnecting(false);
        }
      } catch (err: any) {
        console.error("Agora init error:", err);
        if (mountedRef.current) {
          setError(err?.message || "فشل الاتصال بـ Agora");
          setIsConnecting(false);
        }
      }
    };

    init();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [enabled, channelName, userId]);

  // Re-play local video whenever camera turns back on
  useEffect(() => {
    if (isConnected && !isCameraOff && cameraTrackRef.current) {
      playVideoWithRetry(
        cameraTrackRef.current,
        () => localVideoRef.current,
        "Local video (re-play)"
      );
    }
  }, [isConnected, isCameraOff]);

  // Re-play remote video whenever remoteUser changes
  useEffect(() => {
    if (remoteUser?.videoTrack) {
      playVideoWithRetry(
        remoteUser.videoTrack,
        () => remoteVideoRef.current,
        "Remote video (re-play)"
      );
    }
  }, [remoteUser]);

  const toggleMute = useCallback(async () => {
    if (!micTrackRef.current) return;
    const newMuted = !isMuted;
    await micTrackRef.current.setEnabled(!newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    if (!cameraTrackRef.current) return;
    const newOff = !isCameraOff;
    await cameraTrackRef.current.setEnabled(!newOff);
    setIsCameraOff(newOff);
  }, [isCameraOff]);

  const switchCamera = useCallback(async () => {
    if (!cameraTrackRef.current || !clientRef.current) return;
    try {
      facingModeRef.current = facingModeRef.current === "user" ? "environment" : "user";
      const newTrack = await AgoraRTC.createCameraVideoTrack({
        facingMode: facingModeRef.current,
        encoderConfig: "480p_1",
      });
      await clientRef.current.unpublish(cameraTrackRef.current);
      cameraTrackRef.current.stop();
      cameraTrackRef.current.close();
      cameraTrackRef.current = newTrack;
      playVideoWithRetry(newTrack, () => localVideoRef.current, "Local video (switch)");
      await clientRef.current.publish(newTrack);
    } catch (err) {
      console.error("Switch camera error:", err);
    }
  }, [playVideoWithRetry]);

  const leave = useCallback(async () => {
    setIsConnected(false);
    setRemoteUser(null);
    await cleanup();
  }, [cleanup]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    isCameraOff,
    remoteUser,
    error,
    localVideoRef,
    remoteVideoRef,
    toggleMute,
    toggleCamera,
    switchCamera,
    leave,
  };
}
