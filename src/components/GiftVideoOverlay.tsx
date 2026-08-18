import { useEffect, useRef, useState } from "react";
import SVGAPlayer, { isSvgaUrl } from "./SVGAPlayer";

interface GiftVideoOverlayProps {
  videoUrl: string;
  senderName: string;
  receiverName: string;
  giftName: string;
  giftImageUrl?: string;
  senderAvatarUrl?: string;
  isGif?: boolean;
  quantity?: number;
  soundUrl?: string;
  mediaType?: string;
  showFullScreen?: boolean;
  alphaMaskColorFraction?: number;
  alphaMaskSide?: "right" | "left";
  alphaMaskInvert?: boolean;
  alphaMaskThreshold?: number;
  onDone: () => void;
}

export default function GiftVideoOverlay({
  videoUrl, senderName, receiverName, giftName, giftImageUrl, senderAvatarUrl,
  isGif, quantity = 1, soundUrl, mediaType, showFullScreen,
  alphaMaskColorFraction = 0.66,
  alphaMaskSide = "right", alphaMaskInvert = false, alphaMaskThreshold = 0,
  onDone,
}: GiftVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerLeaving, setBannerLeaving] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const isSvga = isSvgaUrl(videoUrl);
  const isGifMedia = !isSvga && (isGif || videoUrl?.toLowerCase().endsWith(".gif") || videoUrl?.includes("image/gif"));
  // MP4 gifts are treated as black-background effects automatically; screen blending removes black.
  const isAlphaMask = !isSvga && !isGifMedia && (mediaType === "alpha-mask" || mediaType === "video-alpha" || /\.(mp4|webm)(\?|$)/i.test(videoUrl ?? "") || videoUrl?.toLowerCase().includes("alpha"));
  const duration = isSvga ? 6000 : isGifMedia ? 7000 : 15000;

  useEffect(() => {
    const t0 = setTimeout(() => setBannerVisible(true), 200);
    // MP4 closes from its natural ended event so a long gift is never cut off at 15s.
    const shouldUseFallbackTimer = isSvga || isGifMedia;
    const t1 = shouldUseFallbackTimer ? setTimeout(() => setBannerLeaving(true), duration - 600) : null;
    const t2 = shouldUseFallbackTimer ? setTimeout(() => doneRef.current(), duration) : null;

    if (soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = 0.85;
        audio.play().catch(() => {});
        audioRef.current = audio;
      } catch (e) {}
    }

    return () => {
      clearTimeout(t0);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || isSvga) return;
    vid.muted = Boolean(soundUrl);
    vid.preload = "auto";
    const playPromise = vid.play();
    playPromise?.then(() => {
      if (!soundUrl) vid.muted = false;
    }).catch(() => {});
  }, [videoUrl, isSvga]);

  const handleVideoEnded = () => {
    setBannerLeaving(true);
    window.setTimeout(() => doneRef.current(), 500);
  };

  const keepVideoPlaying = () => {
    const vid = videoRef.current;
    if (vid && vid.paused && !vid.ended) {
      vid.muted = Boolean(soundUrl);
      vid.play().then(() => {
        if (!soundUrl) vid.muted = false;
      }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-[400] pointer-events-none overflow-hidden" style={{ top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh" }}>
      {/* Full-screen media */}
      <div className="absolute inset-0">
        {isSvga ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <SVGAPlayer
              src={videoUrl}
              style={{ width: "100%", height: "100%", maxWidth: "100vw", maxHeight: "100vh" }}
              loop={false}
              onFinish={() => {
                setBannerLeaving(true);
                setTimeout(onDone, 500);
              }}
            />
          </div>
        ) : isGifMedia ? (
          <img
            src={videoUrl}
            alt={giftName}
            className="absolute inset-0 w-full h-full object-contain bg-black/40"
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            preload="auto"
            loop={false}
            muted={Boolean(soundUrl)}
            controls={false}
            disablePictureInPicture
            onCanPlay={keepVideoPlaying}
            onWaiting={() => {
              // Let the browser buffer naturally; do not call load() or restart the decoder.
            }}
            onStalled={() => {
              // A stalled network stream resumes through canplay without resetting playback.
            }}
            onEnded={handleVideoEnded}
            style={isAlphaMask ? { mixBlendMode: "screen", background: "transparent" } : undefined}
          />
        )}
      </div>

      {/* ── GIFT INFO CARD (Sender, Gift, Receiver) ── */}
      <div
        className="absolute top-16 left-0 right-0 flex justify-center z-20 px-4"
        style={{
          opacity: bannerVisible && !bannerLeaving ? 1 : 0,
          transform: bannerVisible && !bannerLeaving ? "translateY(0)" : "translateY(-30px)",
          transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-2.5 rounded-full shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(59,10,30,0.9), rgba(24,4,15,0.95))",
            border: "1.5px solid rgba(251,191,36,0.6)",
            boxShadow: "0 4px 25px rgba(0,0,0,0.8), 0 0 30px rgba(251,191,36,0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Sender Avatar & Name */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400 flex-shrink-0">
              {senderAvatarUrl ? (
                <img src={senderAvatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-xs">
                  {senderName?.[0]}
                </div>
              )}
            </div>
            <span className="text-white font-bold text-xs max-w-[80px] truncate">{senderName}</span>
          </div>

          {/* Action & Gift Thumbnail */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/40 border border-white/10">
            {giftImageUrl ? (
              <img src={giftImageUrl} alt="" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            ) : (
              <span className="text-lg">🎁</span>
            )}
            <div className="flex flex-col">
              <span className="text-amber-300 font-extrabold text-[11px] leading-tight">{giftName}</span>
              <span className="text-white/80 text-[9px] font-semibold">×{quantity}</span>
            </div>
          </div>

          {/* Receiver Name */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/60 text-[10px]">إلى</span>
            <span className="text-rose-300 font-bold text-xs max-w-[80px] truncate">{receiverName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
