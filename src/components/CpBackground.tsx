import { useEffect, useRef } from "react";

// ── Disney Castle + Fireworks + Meteor animated background ──────────────────
export default function CpBackground() {
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

    // ── Firework particles ──────────────────────────────────────────────────
    interface Particle {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; color: string; size: number;
    }
    interface Firework {
      x: number; y: number; vy: number; color: string; exploded: boolean;
    }
    interface Meteor {
      x: number; y: number; vx: number; vy: number;
      len: number; opacity: number; size: number;
    }
    interface FloatingHeart {
      x: number; y: number; vy: number; vx: number;
      size: number; opacity: number; life: number;
    }

    const fireworks: Firework[] = [];
    const particles: Particle[] = [];
    const meteors: Meteor[] = [];
    const hearts: FloatingHeart[] = [];

    const COLORS = ["#ff4d6d", "#ff85a1", "#ffb3c1", "#ff0a54", "#ff477e", "#ffd6e0", "#ff6b9d", "#c9184a", "#ff9ece", "#ffccd5"];

    const spawnFirework = () => {
      fireworks.push({
        x: 0.15 * canvas.width + Math.random() * 0.7 * canvas.width,
        y: canvas.height,
        vy: -(8 + Math.random() * 6),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        exploded: false,
      });
    };

    const explode = (fw: Firework) => {
      const count = 40 + Math.floor(Math.random() * 30);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = 1.5 + Math.random() * 3;
        particles.push({
          x: fw.x, y: fw.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1, maxLife: 0.6 + Math.random() * 0.6,
          color: fw.color,
          size: 1.5 + Math.random() * 2,
        });
      }
    };

    const spawnMeteor = () => {
      meteors.push({
        x: Math.random() * canvas.width * 0.8,
        y: -20,
        vx: 2 + Math.random() * 3,
        vy: 4 + Math.random() * 5,
        len: 60 + Math.random() * 80,
        opacity: 1,
        size: 1.5 + Math.random() * 1.5,
      });
    };

    const spawnHeart = () => {
      hearts.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(0.5 + Math.random() * 1.2),
        size: 8 + Math.random() * 16,
        opacity: 0.6 + Math.random() * 0.4,
        life: 1,
      });
    };

    const drawHeart = (x: number, y: number, size: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y + size * 0.3);
      ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
      ctx.bezierCurveTo(x - size * 0.5, y + size * 0.65, x, y + size * 0.9, x, y + size);
      ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.65, x + size * 0.5, y + size * 0.3);
      ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
      ctx.fill();
      ctx.restore();
    };

    const drawCastle = () => {
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const baseY = H * 0.72;
      const scale = Math.min(W, H) / 400;

      ctx.save();
      ctx.globalAlpha = 0.18;

      // ── Main body ──
      const bodyW = 90 * scale;
      const bodyH = 80 * scale;
      ctx.fillStyle = "#ff4d6d";
      ctx.fillRect(cx - bodyW / 2, baseY - bodyH, bodyW, bodyH);

      // ── Side towers ──
      const towerW = 28 * scale;
      const towerH = 100 * scale;
      ctx.fillRect(cx - bodyW / 2 - towerW + 4 * scale, baseY - towerH, towerW, towerH);
      ctx.fillRect(cx + bodyW / 2 - 4 * scale, baseY - towerH, towerW, towerH);

      // ── Center tall tower ──
      const ctW = 22 * scale;
      const ctH = 140 * scale;
      ctx.fillStyle = "#ff6b9d";
      ctx.fillRect(cx - ctW / 2, baseY - ctH, ctW, ctH);

      // ── Battlements (main body) ──
      ctx.fillStyle = "#ff4d6d";
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(cx - bodyW / 2 + i * 20 * scale, baseY - bodyH - 10 * scale, 12 * scale, 10 * scale);
      }

      // ── Spires ──
      const drawSpire = (x: number, y: number, w: number, h: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x - w / 2, y);
        ctx.lineTo(x + w / 2, y);
        ctx.closePath();
        ctx.fill();
      };
      ctx.fillStyle = "#c9184a";
      drawSpire(cx - bodyW / 2 - towerW / 2 + 4 * scale, baseY - towerH, 20 * scale, 30 * scale);
      drawSpire(cx + bodyW / 2 + towerW / 2 - 4 * scale, baseY - towerH, 20 * scale, 30 * scale);
      ctx.fillStyle = "#ff0a54";
      drawSpire(cx, baseY - ctH, 16 * scale, 45 * scale);

      // ── Windows ──
      ctx.fillStyle = "#ffd6e0";
      ctx.globalAlpha = 0.25;
      // arch windows
      const drawArch = (x: number, y: number, w: number, h: number) => {
        ctx.beginPath();
        ctx.rect(x - w / 2, y, w, h * 0.6);
        ctx.arc(x, y, w / 2, Math.PI, 0);
        ctx.fill();
      };
      drawArch(cx, baseY - bodyH * 0.55, 14 * scale, 20 * scale);
      drawArch(cx - bodyW / 2 - towerW / 2 + 4 * scale, baseY - towerH * 0.55, 10 * scale, 16 * scale);
      drawArch(cx + bodyW / 2 + towerW / 2 - 4 * scale, baseY - towerH * 0.55, 10 * scale, 16 * scale);

      // ── Ground / path ──
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#ff4d6d";
      ctx.fillRect(cx - 60 * scale, baseY, 120 * scale, 8 * scale);

      ctx.restore();
    };

    // Intervals
    const fwInterval = setInterval(spawnFirework, 1200);
    const meteorInterval = setInterval(spawnMeteor, 2500);
    const heartInterval = setInterval(spawnHeart, 400);

    let t = 0;
    const draw = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw castle
      drawCastle();

      // Update & draw fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        if (!fw.exploded) {
          fw.y += fw.vy;
          fw.vy += 0.15;
          // Draw rocket
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = fw.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fw.x, fw.y);
          ctx.lineTo(fw.x, fw.y + 12);
          ctx.stroke();
          ctx.restore();
          if (fw.vy >= -1) {
            fw.exploded = true;
            explode(fw);
            fireworks.splice(i, 1);
          }
        }
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.98;
        p.life -= 0.018;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.life * 0.9;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update & draw meteors
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.opacity -= 0.008;
        if (m.opacity <= 0 || m.y > canvas.height * 0.85) {
          // Impact flash
          if (m.y > canvas.height * 0.8) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "#ff4d6d";
            ctx.shadowColor = "#ff4d6d";
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(m.x, m.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          meteors.splice(i, 1);
          continue;
        }
        const dx = Math.cos(Math.atan2(m.vy, m.vx));
        const dy = Math.sin(Math.atan2(m.vy, m.vx));
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - dx * m.len, m.y - dy * m.len);
        grad.addColorStop(0, `rgba(255,255,200,${m.opacity})`);
        grad.addColorStop(0.3, `rgba(255,100,100,${m.opacity * 0.7})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.size;
        ctx.shadowColor = "#ff4d6d";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - dx * m.len, m.y - dy * m.len);
        ctx.stroke();
        // Head glow
        ctx.globalAlpha = m.opacity;
        ctx.fillStyle = "rgba(255,255,200,0.9)";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update & draw floating hearts
      for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i];
        h.x += h.vx + Math.sin(t * 0.03 + i) * 0.3;
        h.y += h.vy;
        h.life -= 0.004;
        if (h.life <= 0 || h.y < -30) { hearts.splice(i, 1); continue; }
        const alpha = h.opacity * Math.min(h.life * 3, 1);
        drawHeart(h.x - h.size / 2, h.y - h.size / 2, h.size, "#ff4d6d", alpha);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(fwInterval);
      clearInterval(meteorInterval);
      clearInterval(heartInterval);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
