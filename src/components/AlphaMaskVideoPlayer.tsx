import { useEffect, useRef, type CSSProperties } from "react";

interface AlphaMaskVideoPlayerProps {
  src?: string;
  videoUrl?: string;
  onEnded?: () => void;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  colorFraction?: number;
  maskSide?: "right" | "left";
  invertMask?: boolean;
  threshold?: number;
  fit?: "cover" | "contain";
  muted?: boolean;
  loop?: boolean;
}

/**
 * Displays MP4 effects with a black background as a screen-blended layer.
 * Screen blending removes the visual black background while preserving
 * bright and colored particles over the room background.
 */
export default function AlphaMaskVideoPlayer({
  src,
  videoUrl,
  onEnded,
  width = "100%",
  height = "100%",
  className,
  style,
  fit = "contain",
  muted = true,
  loop = false,
}: AlphaMaskVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resolvedSrc = videoUrl ?? src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedSrc) return;
    video.preload = "auto";
    // Do not call load() here: it resets the decoder and can freeze an effect
    // when React re-renders the overlay. The native autoplay pipeline is enough.
    if (video.paused) video.play().catch(() => {});
  }, [resolvedSrc]);

  if (!resolvedSrc) return null;

  return (
    <div
      className={`relative flex items-center justify-center overflow-visible ${className ?? ""}`}
      style={{ width, height, ...style }}
    >
      <video
        ref={videoRef}
        src={resolvedSrc}
        autoPlay
        playsInline
        muted={muted}
        loop={loop}
        onEnded={onEnded}
        onCanPlay={(event) => {
          const video = event.currentTarget;
          if (video.paused && !video.ended) video.play().catch(() => {});
        }}
        className={`w-full h-full object-${fit}`}
        style={{ mixBlendMode: "screen", background: "transparent", isolation: "isolate" }}
        aria-hidden="true"
      />
    </div>
  );
}

export { AlphaMaskVideoPlayer };
