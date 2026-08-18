import { useEffect, useRef } from "react";

// ── Animated orbital/astro waves between seats ───────────────────────────────
export default function AstronomySeatWaves({ count }: { count: number }) {
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

    const ASTRO_COLORS = [
      "#a29bfe", "#74b9ff", "#55efc4", "#fdcb6e",
      "#fd79a8", "#ffd93d", "#6bcb77", "#4d96ff",
    ];

    // Orbital particles between seats
    interface OrbParticle {
      col: number; angle: number; speed: number; r: number; color: string; size: number;
    }
    const orbs: OrbParticle[] = [];
    const cols = Math.min(count, 5);
    for (let c = 0; c < cols - 1; c++) {
      for (let j = 0; j < 4; j++) {
        orbs.push({
          col: c,
          angle: (j / 4) * Math.PI * 2,
          speed: (0.01 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1),
          r: 8 + Math.random() * 12,
          color: ASTRO_COLORS[(c * 4 + j) % ASTRO_COLORS.length],
          size: 1.5 + Math.random() * 2,
        });
      }
    }

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colW = canvas.width / cols;
      const midY = canvas.height / 2;

      // Draw wave lines between columns
      for (let col = 0; col < cols - 1; col++) {
        const x = (col + 1) * colW;
        for (let w = 0; w < 3; w++) {
          const phase = (w / 3) * Math.PI * 2;
          const amp = 6 + 4 * Math.sin(t * 0.002 + phase + col);
          const color = ASTRO_COLORS[(col * 3 + w) % ASTRO_COLORS.length];
          ctx.beginPath();
          for (let y = 0; y < canvas.height; y += 2) {
            const xOff = Math.sin(y * 0.06 + t * 0.003 + phase) * amp;
            if (y === 0) ctx.moveTo(x + xOff, y);
            else ctx.lineTo(x + xOff, y);
          }
          ctx.strokeStyle = color + "44";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw orbital particles
      orbs.forEach((orb) => {
        orb.angle += orb.speed;
        const x = (orb.col + 1) * colW + Math.cos(orb.angle) * orb.r;
        const y = midY + Math.sin(orb.angle) * orb.r * 0.5;
        const alpha = 0.6 + 0.4 * Math.sin(t * 0.003 + orb.angle);

        // Glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, orb.size * 3);
        grd.addColorStop(0, orb.color + Math.floor(alpha * 200).toString(16).padStart(2, "0"));
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
