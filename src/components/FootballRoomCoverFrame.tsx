import { useEffect, useRef } from "react";

interface FootballRoomCoverFrameProps {
  children: React.ReactNode;
  size?: number;
}

export default function FootballRoomCoverFrame({ children, size = 80 }: FootballRoomCoverFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = size;
    canvas.height = size;

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 4;

      // Outer glow ring
      const glowPulse = 0.25 + 0.12 * Math.sin(t * 2.5);
      const glowGrd = ctx.createRadialGradient(cx, cy, r - 5, cx, cy, r + 8);
      glowGrd.addColorStop(0, `rgba(34,197,94,${glowPulse})`);
      glowGrd.addColorStop(0.5, `rgba(34,197,94,${glowPulse * 0.4})`);
      glowGrd.addColorStop(1, "rgba(34,197,94,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = glowGrd;
      ctx.fill();

      // Rotating gradient border (main ring)
      const angle = t * 1.8;
      const grd = ctx.createLinearGradient(
        cx + r * Math.cos(angle), cy + r * Math.sin(angle),
        cx + r * Math.cos(angle + Math.PI), cy + r * Math.sin(angle + Math.PI)
      );
      grd.addColorStop(0, "#22c55e");
      grd.addColorStop(0.2, "#16a34a");
      grd.addColorStop(0.4, "#fbbf24");
      grd.addColorStop(0.6, "#f97316");
      grd.addColorStop(0.8, "#16a34a");
      grd.addColorStop(1, "#22c55e");

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = grd;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Inner ring (static green)
      ctx.beginPath();
      ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34,197,94,${0.15 + 0.08 * Math.sin(t * 3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Orbiting football dots
      const numDots = 10;
      for (let i = 0; i < numDots; i++) {
        const a = (i / numDots) * Math.PI * 2 + t * 1.2;
        const dx = cx + r * Math.cos(a);
        const dy = cy + r * Math.sin(a);
        const dotSize = i % 2 === 0 ? 3 : 2;
        const dotAlpha = 0.6 + 0.4 * Math.sin(t * 2 + i);
        ctx.beginPath();
        ctx.arc(dx, dy, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? `rgba(251,191,36,${dotAlpha})` : `rgba(34,197,94,${dotAlpha})`;
        ctx.fill();
      }

      // Sparkle stars at random positions
      for (let s = 0; s < 4; s++) {
        const sa = (s / 4) * Math.PI * 2 + t * 0.5;
        const sr = r + 2 + 3 * Math.sin(t * 3 + s * 1.5);
        const sx = cx + sr * Math.cos(sa);
        const sy = cy + sr * Math.sin(sa);
        const sparkAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 4 + s));
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${sparkAlpha})`;
        ctx.fill();
      }

      t += 0.025;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2 }}
      />
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
