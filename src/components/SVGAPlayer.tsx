import { useEffect, useRef, useState } from "react";

interface SVGAPlayerProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  loop?: boolean;
  onFinish?: () => void;
  width?: number;
  height?: number;
}

/**
 * مشغّل SVGA باستخدام svga.lite
 * API: Downloader.get() → Parser.do() → Player.mount() → Player.start()
 */
export default function SVGAPlayer({
  src, className, style, loop = true, onFinish, width = 200, height = 200,
}: SVGAPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !src) return;
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

        if (!loop) {
          player.$on("end" as any, () => { onFinish?.(); });
        }

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
  }, [src, width, height]);

  if (error) {
    return (
      <div className={className} style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent", borderRadius: 0, ...style,
      }}>
        <span style={{ fontSize: 20 }}>✨</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: "block", width, height, backgroundColor: "transparent", mixBlendMode: "normal", ...style }}
    />
  );
}

/** هل الرابط ملف SVGA؟ */
export function isSvgaUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.toLowerCase().includes(".svga");
}
