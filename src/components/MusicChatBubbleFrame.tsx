import { useEffect, useRef } from "react";

// ── Animated sound wave frame for chat bubble ────────────────────────────────
export default function MusicChatBubbleFrame({ isSpeaking }: { isSpeaking?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const COLORS = isSpeaking
      ? ["#ff006e", "#ffbe0b", "#3a86ff", "#06d6a0", "#f72585"]
      : ["#8338ec", "#4cc9f0", "#ff006e", "#06d6a0"];

    let t = 0;
    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const amp = isSpeaking ? 5 : 2.5;
      const speed = isSpeaking ? 0.006 : 0.003;

      // Top wave
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = Math.sin(x * 0.08 + t * speed) * amp + amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = COLORS[0] + (isSpeaking ? "cc" : "66");
      ctx.lineWidth = isSpeaking ? 2 : 1.5;
      ctx.stroke();

      // Bottom wave
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h - Math.sin(x * 0.08 + t * speed + Math.PI) * amp - amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = COLORS[1] + (isSpeaking ? "cc" : "66");
      ctx.lineWidth = isSpeaking ? 2 : 1.5;
      ctx.stroke();

      // Left wave
      ctx.beginPath();
      for (let y = 0; y <= h; y += 2) {
        const x = Math.sin(y * 0.1 + t * speed + 1) * amp + amp;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = COLORS[2] + (isSpeaking ? "cc" : "66");
      ctx.lineWidth = isSpeaking ? 2 : 1.5;
      ctx.stroke();

      // Right wave
      ctx.beginPath();
      for (let y = 0; y <= h; y += 2) {
        const x = w - Math.sin(y * 0.1 + t * speed + 2) * amp - amp;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = COLORS[3] + (isSpeaking ? "cc" : "66");
      ctx.lineWidth = isSpeaking ? 2 : 1.5;
      ctx.stroke();

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isSpeaking]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl"
      style={{ zIndex: 0 }}
    />
  );
}
