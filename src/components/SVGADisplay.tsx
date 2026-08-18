// @ts-nocheck
import { useEffect, useRef, useState } from "react";

interface SVGADisplayProps {
  src: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
  loop?: boolean;
  fallback?: React.ReactNode;
  forceSvga?: boolean;
}

/**
 * مكوّن عرض SVGA مع fallback تلقائي للصور العادية
 * يدعم: .svga, .png, .jpg, .gif, .webp
 */
export default function SVGADisplay({
  src, width = 80, height = 80, style, className, loop = true, fallback, forceSvga = false,
}: SVGADisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState(false);
  const isSvga = forceSvga || src?.toLowerCase().includes(".svga") || src?.toLowerCase().includes("svga");

  useEffect(() => {
    if (!src || !isSvga) return;
    if (!canvasRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        setError(false);
        // @ts-ignore
        const mod = await import("svga.lite");
        const { Downloader, Parser, Player } = mod.default || mod;
        if (cancelled) return;

        try { playerRef.current?.stop(); playerRef.current?.destroy?.(); } catch (_) {}
        playerRef.current = null;

        const canvas = canvasRef.current!;
        canvas.width = width;
        canvas.height = height;

        const downloader = new Downloader();
        const buffer: ArrayBuffer = await downloader.get(src);
        if (cancelled) return;

        const parser = new Parser();
        const videoItem = await parser.do(buffer);
        if (cancelled) return;

        const player = new Player(canvas);
        playerRef.current = player;
        player.loop = loop ? 0 : 1;
        await player.mount(videoItem);
        if (cancelled) return;
        player.start();
      } catch (err) {
        console.warn("SVGA load error:", err);
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      try { playerRef.current?.stop(); playerRef.current?.destroy?.(); } catch (_) {}
      playerRef.current = null;
    };
  }, [src, width, height, isSvga]);

  if (!src) return fallback ? <>{fallback}</> : null;

  // صورة عادية
  if (!isSvga || error) {
    return (
      <img
        src={src}
        alt=""
        className={className}
        style={{ width, height, objectFit: "contain", ...style }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height, ...style }}
    />
  );
}
