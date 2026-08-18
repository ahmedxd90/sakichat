import { useEffect, useRef } from "react";

export default function CinemaBackground() {
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

    // Floating film particles
    interface Particle {
      x: number; y: number; size: number; speed: number;
      opacity: number; color: string; phase: number;
    }
    const COLORS = ["#ef4444", "#dc2626", "#fbbf24", "#f59e0b", "#ffffff"];
    const particles: Particle[] = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 1 + Math.random() * 2.5,
      speed: 0.0002 + Math.random() * 0.0003,
      opacity: 0.1 + Math.random() * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
    }));

    // Film strip holes
    interface FilmHole {
      y: number; side: "left" | "right";
    }
    const filmHoles: FilmHole[] = Array.from({ length: 20 }, (_, i) => ({
      y: i / 20,
      side: i % 2 === 0 ? "left" : "right",
    }));

    // Spotlight beams
    interface Beam {
      x: number; angle: number; speed: number; phase: number;
    }
    const beams: Beam[] = [
      { x: 0.3, angle: -0.3, speed: 0.003, phase: 0 },
      { x: 0.7, angle: 0.3, speed: 0.004, phase: Math.PI },
    ];

    let t = 0;
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Deep cinema background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0d0000");
      bg.addColorStop(0.4, "#1a0000");
      bg.addColorStop(0.7, "#120000");
      bg.addColorStop(1, "#080000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Spotlight beams from top
      beams.forEach((beam) => {
        const bx = beam.x * W + Math.sin(t * beam.speed + beam.phase) * W * 0.08;
        const grad = ctx.createRadialGradient(bx, 0, 0, bx, H * 0.6, W * 0.4);
        grad.addColorStop(0, "rgba(239,68,68,0.06)");
        grad.addColorStop(0.5, "rgba(239,68,68,0.02)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx - W * 0.25, H * 0.7);
        ctx.lineTo(bx + W * 0.25, H * 0.7);
        ctx.closePath();
        ctx.fill();
      });

      // Film strip left
      const stripW = W * 0.06;
      ctx.fillStyle = "rgba(20,0,0,0.8)";
      ctx.fillRect(0, 0, stripW, H);
      ctx.fillRect(W - stripW, 0, stripW, H);

      // Film strip border lines
      ctx.strokeStyle = "rgba(239,68,68,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(stripW, 0); ctx.lineTo(stripW, H);
      ctx.moveTo(W - stripW, 0); ctx.lineTo(W - stripW, H);
      ctx.stroke();

      // Film holes
      filmHoles.forEach((hole) => {
        const hy = (hole.y + (t * 0.0001)) % 1;
        const hx = hole.side === "left" ? stripW * 0.5 : W - stripW * 0.5;
        const hSize = stripW * 0.35;
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.strokeStyle = "rgba(239,68,68,0.4)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(hx - hSize / 2, hy * H - hSize / 2, hSize, hSize, 2);
        ctx.fill();
        ctx.stroke();
      });

      // Floating particles (dust/stars)
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        const px = p.x * W;
        const py = p.y * H;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.02 + p.phase);
        ctx.globalAlpha = p.opacity * pulse;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Bottom red glow
      const bottomGlow = ctx.createLinearGradient(0, H * 0.8, 0, H);
      bottomGlow.addColorStop(0, "rgba(0,0,0,0)");
      bottomGlow.addColorStop(1, "rgba(120,0,0,0.15)");
      ctx.fillStyle = bottomGlow;
      ctx.fillRect(0, H * 0.8, W, H * 0.2);

      t++;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.9 }}
    />
  );
}
