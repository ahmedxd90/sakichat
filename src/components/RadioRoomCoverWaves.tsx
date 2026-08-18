import { useEffect, useRef } from "react";

// ── Radio waves on room cover ──────────────────────────────────────────────────
export default function RadioRoomCoverWaves() {
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

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width;
      const H = canvas.height;

      // Horizontal FM waves
      const COLORS = ["#ff6b00", "#ffd700", "#ff9500", "#ff3d00"];
      for (let i = 0; i < 5; i++) {
        const y = H * (0.2 + i * 0.15);
        ctx.beginPath();
        for (let x = 0; x < W; x += 2) {
          const yOff = Math.sin(x * 0.04 + t * 0.004 + i * 0.8) * (4 + i * 2);
          if (x === 0) ctx.moveTo(x, y + yOff);
          else ctx.lineTo(x, y + yOff);
        }
        ctx.strokeStyle = COLORS[i % COLORS.length] + "55";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
