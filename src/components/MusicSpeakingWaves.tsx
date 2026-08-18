import { useEffect, useRef } from "react";

// ── Strong speaking waves ring around a seat ────────────────────────────────
export default function MusicSpeakingWaves({ size = 48 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size * 3;
    canvas.height = size * 3;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const baseR = size / 2;

    const COLORS = ["#ff006e", "#ffbe0b", "#3a86ff", "#06d6a0", "#f72585", "#8338ec"];

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Multiple expanding rings
      for (let ring = 0; ring < 4; ring++) {
        const phase = (ring / 4) * Math.PI * 2;
        const r = baseR + 4 + ring * 8 + Math.sin(t * 0.006 + phase) * 6;
        const alpha = 0.7 - ring * 0.15;
        const color = COLORS[ring % COLORS.length];

        // Wavy ring
        ctx.beginPath();
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const waveR = r + Math.sin(angle * 6 + t * 0.008 + phase) * 4;
          const x = cx + Math.cos(angle) * waveR;
          const y = cy + Math.sin(angle) * waveR;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 2.5 - ring * 0.4;
        ctx.stroke();
      }

      // Pulsing glow
      const glowR = baseR + 2 + Math.sin(t * 0.01) * 8;
      const grad = ctx.createRadialGradient(cx, cy, baseR - 4, cx, cy, glowR + 20);
      grad.addColorStop(0, "rgba(255,0,110,0.3)");
      grad.addColorStop(0.5, "rgba(251,86,7,0.15)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, glowR + 20, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

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
        width: size * 3,
        height: size * 3,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
