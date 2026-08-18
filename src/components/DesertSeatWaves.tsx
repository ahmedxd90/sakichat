import { useEffect, useRef } from "react";

// ── Animated sand waves between seats ────────────────────────────────────────
export default function DesertSeatWaves({ count }: { count: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const SAND_COLORS = [
      "#d4b483", "#c8a96e", "#e8c99a", "#b8945a",
      "#f0d8b0", "#c8a000", "#d4a017", "#e8b84b",
    ];

    // Sand particles between seats
    interface SandOrb {
      col: number; angle: number; speed: number; r: number; color: string; size: number;
    }
    const orbs: SandOrb[] = [];
    const cols = Math.min(count, 5);
    for (let c = 0; c < cols - 1; c++) {
      for (let j = 0; j < 5; j++) {
        orbs.push({
          col: c,
          angle: (j / 5) * Math.PI * 2,
          speed: (0.008 + Math.random() * 0.015) * (Math.random() > 0.5 ? 1 : -1),
          r: 10 + Math.random() * 14,
          color: SAND_COLORS[(c * 5 + j) % SAND_COLORS.length],
          size: 2 + Math.random() * 3,
        });
      }
    }

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colW = canvas.width / cols;
      const midY = canvas.height / 2;

      // Sand wave lines between columns
      for (let col = 0; col < cols - 1; col++) {
        const x = (col + 1) * colW;
        for (let w = 0; w < 4; w++) {
          const phase = (w / 4) * Math.PI * 2;
          const amp = 8 + 5 * Math.sin(t * 0.0015 + phase + col);
          const color = SAND_COLORS[(col * 4 + w) % SAND_COLORS.length];
          ctx.beginPath();
          for (let y = 0; y < canvas.height; y += 2) {
            const xOff = Math.sin(y * 0.05 + t * 0.002 + phase) * amp;
            if (y === 0) ctx.moveTo(x + xOff, y);
            else ctx.lineTo(x + xOff, y);
          }
          ctx.strokeStyle = color + "55";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Sand orbs
      orbs.forEach((orb) => {
        orb.angle += orb.speed;
        const x = (orb.col + 1) * colW + Math.cos(orb.angle) * orb.r;
        const y = midY + Math.sin(orb.angle) * orb.r * 0.5;
        const alpha = 0.5 + 0.3 * Math.sin(t * 0.003 + orb.angle);

        const grd = ctx.createRadialGradient(x, y, 0, x, y, orb.size * 3);
        grd.addColorStop(0, orb.color + Math.floor(alpha * 180).toString(16).padStart(2, "0"));
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, orb.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, orb.size, 0, Math.PI * 2);
        ctx.fillStyle = orb.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ display: "block" }}
    />
  );
}
