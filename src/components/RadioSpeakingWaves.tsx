import { useEffect, useRef } from "react";

// ── Radio broadcast speaking waves ring ──────────────────────────────────────
export default function RadioSpeakingWaves({ size = 48 }: { size?: number }) {
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

    const COLORS = ["#ff6b00", "#ffd700", "#ff9500", "#ff3d00", "#ffb300", "#e65100"];

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Expanding signal rings
      for (let ring = 0; ring < 5; ring++) {
        const phase = (ring / 5) * Math.PI * 2;
        const r = baseR + 4 + ring * 7 + Math.sin(t * 0.007 + phase) * 5;
        const alpha = 0.75 - ring * 0.13;
        const color = COLORS[ring % COLORS.length];

        // Jagged radio wave ring
        ctx.beginPath();
        const steps = 72;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const waveR = r + Math.sin(angle * 8 + t * 0.01 + phase) * 3;
          const x = cx + Math.cos(angle) * waveR;
          const y = cy + Math.sin(angle) * waveR;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 2 - ring * 0.3;
        ctx.stroke();
      }

      // ON AIR pulsing glow
      const glowAlpha = 0.3 + Math.sin(t * 0.01) * 0.2;
      const grd = ctx.createRadialGradient(cx, cy, baseR, cx, cy, baseR + 30);
      grd.addColorStop(0, `rgba(255,107,0,${glowAlpha})`);
      grd.addColorStop(0.5, `rgba(255,149,0,${glowAlpha * 0.5})`);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR + 30, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute pointer-events-none"
      style={{
        width: size * 3,
        height: size * 3,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1,
      }}
    />
  );
}
