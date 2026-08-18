import { useEffect, useRef } from "react";

// ── Radio broadcast waves between seats ──────────────────────────────────────
export default function RadioSeatWaves({ count }: { count: number }) {
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

    const RADIO_COLORS = [
      "#ff6b00", "#ffd700", "#ff9500", "#ff3d00",
      "#ffb300", "#e65100", "#ff8c00", "#ff6f00",
    ];

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.min(count, 5);
      const colW = canvas.width / cols;

      // Vertical signal waves between seats
      for (let col = 0; col < cols - 1; col++) {
        const x = (col + 1) * colW;
        for (let w = 0; w < 4; w++) {
          const phase = (w / 4) * Math.PI * 2;
          const amp = 6 + 5 * Math.sin(t * 0.004 + phase + col);
          const color = RADIO_COLORS[(col * 2 + w) % RADIO_COLORS.length];
          ctx.beginPath();
          for (let y = 0; y < canvas.height; y += 2) {
            const xOff = Math.sin(y * 0.1 + t * 0.005 + phase) * amp;
            if (y === 0) ctx.moveTo(x + xOff, y);
            else ctx.lineTo(x + xOff, y);
          }
          ctx.strokeStyle = color + "44";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Horizontal broadcast lines
      for (let row = 0; row < 4; row++) {
        const y = (canvas.height / 5) * (row + 1);
        const color = RADIO_COLORS[row % RADIO_COLORS.length];
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 2) {
          const yOff = Math.sin(x * 0.03 + t * 0.003 + row * 1.2) * 5;
          if (x === 0) ctx.moveTo(x, y + yOff);
          else ctx.lineTo(x, y + yOff);
        }
        ctx.strokeStyle = color + "22";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ON AIR dots between columns
      for (let col = 0; col < cols - 1; col++) {
        const x = (col + 0.5) * colW + colW / 2;
        const pulse = Math.sin(t * 0.006 + col * 1.5);
        const r = 3 + pulse * 2;
        const alpha = 0.4 + pulse * 0.3;
        ctx.beginPath();
        ctx.arc(x, canvas.height / 2, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,107,0,${alpha})`;
        ctx.fill();
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
      style={{ zIndex: 0 }}
    />
  );
}
