import { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface AgoraVideoLiveState {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
  error: string | null;
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  toggleMute: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  switchCamera: () => Promise<void>;
  leave: () => Promise<void>;
}

export function useAgoraVideoLive(
  channelName: string,
  userId: string,
  role: "host" | "audience",
  enabled: boolean,
  publishVideo = true
): AgoraVideoLiveState {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const cameraTrackRef = useRef<ICameraVideoTrack | null>(null);
  const micTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const facingModeRef = useRef<"user" | "environment">("user");
  const mountedRef = useRef(true);
  const joinedRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateToken = useAction(api.agora.generateToken);
  const getAppId = useAction((api as any).agora.getAppId);

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
    joinedRef.current = false;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled || !channelName || !userId) return;

    const init = async () => {
      if (joinedRef.current || clientRef.current) return;
      try {
        setIsConnecting(true);
        setError(null);

        // Prefer a build-time public ID, then fall back to the server-configured ID.
        // The App Certificate is never sent to the client.
        let appId = import.meta.env.VITE_AGORA_APP_ID || "";
        if (!appId) {
          try {
            appId = (await getAppId()) || "";
          } catch (_) {
            appId = "";
          }
        }
        if (!appId) {
          setError("لم يتم تكوين Agora App ID على الخادم");
          setIsConnecting(false);
          return;
        }

        // Sanitize channel name (Agora requires alphanumeric + _ -)
        const safeChannel = channelName.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 64);
        const safeUid = Math.abs(
          userId
            .split("")
            .reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0) % 100000000
        );

        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        clientRef.current = client;

        await client.setClientRole(role);

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mountedRef.current) {
            setRemoteUsers((prev) => {
              const exists = prev.find((u) => u.uid === user.uid);
              return exists
                ? prev.map((u) => (u.uid === user.uid ? user : u))
                : [...prev, user];
            });
          }
          if (mediaType === "video" && user.videoTrack) {
            setTimeout(() => {
              const el = document.getElementById(`remote-video-${user.uid}`);
              if (el) user.videoTrack?.play(el);
            }, 200);
          }
          if (mediaType === "audio" && user.audioTrack) {
            user.audioTrack.play();
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video" && mountedRef.current) {
            setRemoteUsers((prev) =>
              prev.map((u) => (u.uid === user.uid ? user : u))
            );
          }
        });

        client.on("user-left", (user) => {
          if (mountedRef.current) {
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          }
        });

        // Generate token from server (required when App Certificate is enabled)
        let token: string | null = null;
        try {
          token = await generateToken({ channelName: safeChannel, uid: safeUid });
        } catch (_e) {
          token = null;
        }

        await client.join(appId, safeChannel, token, safeUid);
        joinedRef.current = true;

        if (role === "host") {
          const micTrack = await AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: "music_standard" });
          micTrackRef.current = micTrack;
          const publishTracks: Array<IMicrophoneAudioTrack | ICameraVideoTrack> = [micTrack];

          if (publishVideo) {
            const cameraTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p_1", facingMode: "user" });
            cameraTrackRef.current = cameraTrack;
            if (localVideoRef.current) cameraTrack.play(localVideoRef.current);
            publishTracks.push(cameraTrack);
          }

          await client.publish(publishTracks);
        }

        if (mountedRef.current) {
          setIsConnected(true);
          setIsConnecting(false);
        }
      } catch (err: any) {
        console.error("Agora video error:", err);
        if (mountedRef.current) {
          setError(err?.message || "فشل الاتصال بالبث");
          setIsConnecting(false);
        }
        joinedRef.current = false;
        clientRef.current = null;
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [enabled, channelName, userId, role, publishVideo]);

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
      facingModeRef.current =
        facingModeRef.current === "user" ? "environment" : "user";
      const newTrack = await AgoraRTC.createCameraVideoTrack({
        facingMode: facingModeRef.current,
        encoderConfig: "720p_1",
      });
      await clientRef.current.unpublish(cameraTrackRef.current);
      cameraTrackRef.current.stop();
      cameraTrackRef.current.close();
      cameraTrackRef.current = newTrack;
      if (localVideoRef.current) newTrack.play(localVideoRef.current);
      await clientRef.current.publish(newTrack);
    } catch (err) {
      console.error("Switch camera error:", err);
    }
  }, []);

  const leave = useCallback(async () => {
    setIsConnected(false);
    setRemoteUsers([]);
    await cleanup();
  }, [cleanup]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    isCameraOff,
    remoteUsers,
    error,
    localVideoRef,
    toggleMute,
    toggleCamera,
    switchCamera,
    leave,
  };
}
