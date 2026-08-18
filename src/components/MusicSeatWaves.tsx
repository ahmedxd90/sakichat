import { useEffect, useRef } from "react";

// ── Animated sound waves between seats ──────────────────────────────────────
export default function MusicSeatWaves({ count }: { count: number }) {
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

    const DISCO_COLORS = [
      "#ff006e", "#fb5607", "#ffbe0b", "#8338ec",
      "#3a86ff", "#06d6a0", "#f72585", "#4cc9f0",
    ];

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.min(count, 5);
      const colW = canvas.width / cols;

      // Draw vertical wave bars between seats
      for (let col = 0; col < cols - 1; col++) {
        const x = (col + 1) * colW;
        const waveCount = 5;
        for (let w = 0; w < waveCount; w++) {
          const phase = (w / waveCount) * Math.PI * 2;
          const amp = 8 + 6 * Math.sin(t * 0.003 + phase + col);
          const color = DISCO_COLORS[(col * 3 + w) % DISCO_COLORS.length];
          ctx.beginPath();
          for (let y = 0; y < canvas.height; y += 2) {
            const xOff = Math.sin(y * 0.08 + t * 0.004 + phase) * amp;
            if (y === 0) ctx.moveTo(x + xOff, y);
            else ctx.lineTo(x + xOff, y);
          }
          ctx.strokeStyle = color + "55";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Horizontal wave lines across the grid
      for (let row = 0; row < 3; row++) {
        const y = (canvas.height / 4) * (row + 1);
        const color = DISCO_COLORS[row % DISCO_COLORS.length];
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 2) {
          const yOff = Math.sin(x * 0.05 + t * 0.003 + row * 1.2) * 5;
          if (x === 0) ctx.moveTo(x, y + yOff);
          else ctx.lineTo(x, y + yOff);
        }
        ctx.strokeStyle = color + "30";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

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
    />
  );
}
