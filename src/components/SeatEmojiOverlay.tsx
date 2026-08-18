import { useEffect, useRef, useState } from "react";

interface SeatEmojiItem {
  seatIndex: number;
  imageUrl: string;
  svgaUrl?: string;
  isAnimated?: boolean;
  emojiType?: string;
  senderName: string;
  id: string;
}

interface SeatEmojiOverlayProps {
  activeEmojis: SeatEmojiItem[];
  seatPositions: Array<{ x: number; y: number } | null>;
}

export default function SeatEmojiOverlay({ activeEmojis, seatPositions }: SeatEmojiOverlayProps) {
  return (
    <>
      {activeEmojis.filter((item) => item.emojiType !== "vip").map((item) => {
        const pos = seatPositions[item.seatIndex];
        if (!pos) return null;
        return (
          <SeatEmojiBubble
            key={item.id}
            imageUrl={item.imageUrl}
            svgaUrl={item.svgaUrl}
            isAnimated={item.isAnimated}
            emojiType={item.emojiType}
            senderName={item.senderName}
            x={pos.x}
            y={pos.y}
          />
        );
      })}
    </>
  );
}

function SeatEmojiBubble({
  imageUrl,
  svgaUrl,
  isAnimated,
  emojiType,
  senderName,
  x,
  y,
}: {
  imageUrl: string;
  svgaUrl?: string;
  isAnimated?: boolean;
  emojiType?: string;
  senderName: string;
  x: number;
  y: number;
}) {
  const [phase, setPhase] = useState<"in" | "show" | "out" | "gone">("in");
  // الإيموجي العادي يظهر فوق المقعد بحركة Pop ثم يختفي بعد حوالي 3 ثوانٍ.
  const isVipEmoji = false;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"), 300);
    const t2 = setTimeout(() => setPhase("out"), 2600);
    const t3 = setTimeout(() => setPhase("gone"), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === "gone") return null;

  const glowColor = isVipEmoji ? "rgba(251,191,36,0.5)" : "rgba(168,85,247,0.5)";
  const borderColor = isVipEmoji ? "rgba(251,191,36,0.7)" : "rgba(168,85,247,0.6)";
  const bgGlow = isVipEmoji ? "rgba(251,191,36,0.15)" : "rgba(168,85,247,0.15)";

  return (
    <div
      className="absolute z-30 pointer-events-none flex flex-col items-center gap-1"
      style={{
        left: x,
        top: y - 72,
        transform: "translateX(-50%)",
      }}
    >
      <div
        className={`relative ${phase === "in" ? "seat-emoji-in" : ""}`}
        style={{
          transition: phase === "out" ? "all 0.4s ease-in" : undefined,
          opacity: phase === "out" ? 0 : 1,
          transform: phase === "out" ? "scale(0.6) translateY(-12px)" : undefined,
        }}
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-2xl seat-emoji-pulse"
          style={{ background: bgGlow, borderRadius: "16px" }}
        />

        {/* VIP crown indicator */}
        {isVipEmoji && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm z-20 animate-bounce" style={{ animationDuration: "1s" }}>
            👑
          </div>
        )}

        <div
          className="relative rounded-2xl overflow-hidden border-2 shadow-2xl"
          style={{
            width: 68,
            height: 68,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            borderColor,
            boxShadow: `0 0 20px ${glowColor}, 0 4px 20px rgba(0,0,0,0.5)`,
          }}
        >
          {isAnimated && svgaUrl ? (
            <SvgaPlayer svgaUrl={svgaUrl} fallbackUrl={imageUrl} />
          ) : (
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ imageRendering: "auto" }}
            />
          )}
        </div>

        {/* Sparkles */}
        <>
          <div className="absolute -top-1 -right-1 text-xs animate-bounce" style={{ animationDuration: "0.6s" }}>✨</div>
          <div className="absolute -bottom-1 -left-1 text-xs animate-bounce" style={{ animationDuration: "0.8s", animationDelay: "0.2s" }}>⭐</div>
        </>
      </div>

      {/* Sender name */}
      <div
        className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white/90 whitespace-nowrap"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(168,85,247,0.3)",
          maxWidth: 80,
          overflow: "hidden",
          textOverflow: "ellipsis",
          opacity: phase === "out" ? 0 : 1,
          transition: "opacity 0.4s",
        }}
      >
        {senderName}
      </div>
    </div>
  );
}

// SVGA Player component using svga-web library
function SvgaPlayer({ svgaUrl, fallbackUrl }: { svgaUrl: string; fallbackUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!svgaUrl || !canvasRef.current) return;

    let cancelled = false;

    const loadSvga = async () => {
      try {
        // Dynamically import svga-web to avoid SSR issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Parser, Player } = await import("svga-web" as any);
        if (cancelled) return;

        const parser = new Parser();
        const svgaData = await parser.load(svgaUrl);
        if (cancelled) return;

        if (canvasRef.current) {
          const player = new Player(canvasRef.current);
          playerRef.current = player;
          await player.mount(svgaData);
          if (!cancelled) {
            player.start();
          }
        }
      } catch (e) {
        console.warn("SVGA load error:", e);
        if (!cancelled) setError(true);
      }
    };

    loadSvga();

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.stop?.();
          playerRef.current.destroy?.();
        } catch (_) {}
        playerRef.current = null;
      }
    };
  }, [svgaUrl]);

  if (error) {
    return <img src={fallbackUrl} alt="" className="w-full h-full object-cover" />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
