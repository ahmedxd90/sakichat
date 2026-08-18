import { useEffect, useRef } from "react";

// ── Animated sand wave frame around room cover image ─────────────────────────
export default function DesertRoomCoverWaves({ size = 44 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = size + 24;
    canvas.width = s;
    canvas.height = s;

    const cx = s / 2;
    const cy = s / 2;
    const r = size / 2;

    const COLORS = ["#d4b483", "#c8a96e", "#e8c99a", "#c8a000", "#f0d8b0", "#b8945a"];

    interface SandStar {
      angle: number; speed: number; orbitR: number; color: string; size: number;
    }
    const sandStars: SandStar[] = Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      speed: 0.012 + Math.random() * 0.008,
      orbitR: r + 5 + Math.random() * 7,
      color: COLORS[i % COLORS.length],
      size: 1.5 + Math.random() * 2,
    }));

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, s, s);

      // Wavy sand rings
      for (let ring = 0; ring < 3; ring++) {
        const phase = (ring / 3) * Math.PI * 2;
        const ringR = r + 3 + ring * 4;
        const color = COLORS[ring % COLORS.length];
        const alpha = 0.65 - ring * 0.15;

        ctx.beginPath();
        const steps = 72;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const wave = Math.sin(angle * 5 + t * 0.003 + phase) * 2.5;
          const x = cx + Math.cos(angle) * (ringR + wave);
          const y = cy + Math.sin(angle) * (ringR + wave);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Orbiting sand particles
      sandStars.forEach((ss) => {
        ss.angle += ss.speed;
        const x = cx + Math.cos(ss.angle) * ss.orbitR;
        const y = cy + Math.sin(ss.angle) * ss.orbitR;
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.004 + ss.angle);

        const grd = ctx.createRadialGradient(x, y, 0, x, y, ss.size * 3);
        grd.addColorStop(0, ss.color + "cc");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, ss.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, ss.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = ss.color;
        ctx.fill();
      });

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
        width: size + 24,
        height: size + 24,
      }}
    />
  );
}
