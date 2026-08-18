import { useEffect, useRef } from "react";

// ── Desert sand speaking waves around a seat ─────────────────────────────────
export default function DesertSpeakingWaves({ size = 48 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = size + 32;
    canvas.width = s;
    canvas.height = s;
    const cx = s / 2;
    const cy = s / 2;
    const r = size / 2;

    const COLORS = ["#d4b483", "#c8a000", "#e8c99a"];

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, s, s);

      for (let ring = 0; ring < 3; ring++) {
        const phase = (ring / 3) * Math.PI * 2;
        const ringR = r + 4 + ring * 5 + 3 * Math.sin(t * 0.007 + phase);
        const alpha = (0.8 - ring * 0.2) * (0.6 + 0.4 * Math.sin(t * 0.005 + phase));

        ctx.beginPath();
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const wave = Math.sin(angle * 4 + t * 0.005 + phase) * 3.5;
          const x = cx + Math.cos(angle) * (ringR + wave);
          const y = cy + Math.sin(angle) * (ringR + wave);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = COLORS[ring] + Math.floor(alpha * 255).toString(16).padStart(2, "0");
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
        pointerEvents: "none",
        zIndex: 0,
        width: size + 32,
        height: size + 32,
      }}
    />
  );
}
