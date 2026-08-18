// @ts-nocheck
import { useEffect, useRef, useState } from "react";

interface PKRoomThemeBackgroundProps {
  active?: boolean;
}

export default function PKRoomThemeBackground({ active = true }: PKRoomThemeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; alpha: number; life: number;
    }> = [];

    const colors = ["#ef4444", "#3b82f6", "#fbbf24", "#a855f7", "#22c55e", "#f97316"];

    const spawnParticle = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(1 + Math.random() * 2),
        size: 1 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.6 + Math.random() * 0.4,
        life: 1,
      });
    };

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark gradient bg
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "rgba(0,8,32,0.95)");
      grad.addColorStop(0.5, "rgba(5,0,16,0.95)");
      grad.addColorStop(1, "rgba(16,0,5,0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center divider line
      const cx = canvas.width / 2;
      const lineGrad = ctx.createLinearGradient(cx, 0, cx, canvas.height);
      lineGrad.addColorStop(0, "transparent");
      lineGrad.addColorStop(0.3, "rgba(251,146,60,0.6)");
      lineGrad.addColorStop(0.5, "rgba(251,146,60,0.9)");
      lineGrad.addColorStop(0.7, "rgba(251,146,60,0.6)");
      lineGrad.addColorStop(1, "transparent");
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Left glow (red)
      const leftGlow = ctx.createRadialGradient(cx * 0.4, canvas.height * 0.5, 0, cx * 0.4, canvas.height * 0.5, cx * 0.8);
      leftGlow.addColorStop(0, "rgba(239,68,68,0.12)");
      leftGlow.addColorStop(1, "transparent");
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Right glow (blue)
      const rightGlow = ctx.createRadialGradient(cx * 1.6, canvas.height * 0.5, 0, cx * 1.6, canvas.height * 0.5, cx * 0.8);
      rightGlow.addColorStop(0, "rgba(59,130,246,0.12)");
      rightGlow.addColorStop(1, "transparent");
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn particles
      if (frame % 3 === 0) spawnParticle();

      // Draw & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.008;
        p.alpha = p.life * 0.8;
        if (p.life <= 0 || p.y < -10) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Lightning bolts occasionally
      if (frame % 90 === 0) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const startX = side > 0 ? cx + 20 : cx - 20;
        ctx.save();
        ctx.strokeStyle = side > 0 ? "rgba(59,130,246,0.7)" : "rgba(239,68,68,0.7)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = side > 0 ? "#3b82f6" : "#ef4444";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        let lx = startX, ly = 0;
        ctx.moveTo(lx, ly);
        while (ly < canvas.height) {
          lx += (Math.random() - 0.5) * 30 * side;
          ly += 20 + Math.random() * 30;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.restore();
      }

      frame++;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
