import { useEffect, useRef } from "react";

// ── Animated sound wave frame around room cover image ────────────────────────
export default function MusicRoomCoverWaves({ size = 44 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = size + 20;
    canvas.width = s;
    canvas.height = s;

    const cx = s / 2;
    const cy = s / 2;
    const r = size / 2;

    const COLORS = ["#ff006e", "#ffbe0b", "#3a86ff", "#06d6a0", "#f72585", "#8338ec", "#fb5607", "#4cc9f0"];

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, s, s);

      // 3 wavy rings
      for (let ring = 0; ring < 3; ring++) {
        const phase = (ring / 3) * Math.PI * 2;
        const ringR = r + 3 + ring * 4;
        const color = COLORS[ring % COLORS.length];
        const alpha = 0.8 - ring * 0.2;

        ctx.beginPath();
        const steps = 72;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const wave = Math.sin(angle * 8 + t * 0.005 + phase) * 3;
          const x = cx + Math.cos(angle) * (ringR + wave);
          const y = cy + Math.sin(angle) * (ringR + wave);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: size + 20,
        height: size + 20,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
