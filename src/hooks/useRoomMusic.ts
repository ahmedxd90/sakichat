import { useEffect, useRef } from "react";

// Global audio instance shared across the app
let globalAudio: HTMLAudioElement | null = null;

export function useRoomMusic(activeMusicUrl?: string, musicVolume?: number) {
  const prevUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!activeMusicUrl) {
      // Stop music
      if (globalAudio) {
        globalAudio.pause();
        globalAudio.src = "";
      }
      prevUrlRef.current = undefined;
      return;
    }

    if (prevUrlRef.current === activeMusicUrl) {
      // Same track, just update volume
      if (globalAudio) globalAudio.volume = (musicVolume ?? 80) / 100;
      return;
    }

    // New track
    if (!globalAudio) globalAudio = new Audio();
    globalAudio.pause();
    globalAudio.src = activeMusicUrl;
    globalAudio.loop = true;
    globalAudio.volume = (musicVolume ?? 80) / 100;
    globalAudio.play().catch(() => {});
    prevUrlRef.current = activeMusicUrl;

    return () => {};
  }, [activeMusicUrl, musicVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (globalAudio) {
        globalAudio.pause();
        globalAudio.src = "";
        globalAudio = null;
      }
    };
  }, []);
}
