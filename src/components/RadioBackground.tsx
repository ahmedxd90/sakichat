import { useEffect, useRef } from "react";

// ── Radio / Broadcasting Animated Background ──────────────────────────────────
export default function RadioBackground() {
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

    // Radio colors: warm amber, red, orange, gold
    const RADIO_COLORS = [
      "#ff6b00", "#ff9500", "#ffd700", "#ff3d00",
      "#ff8c00", "#ffb300", "#e65100", "#ff6f00",
    ];

    // Signal towers
    interface Tower {
      x: number; y: number; height: number; color: string;
      pulsePhase: number; signalRadius: number;
    }
    const towers: Tower[] = Array.from({ length: 3 }, (_, i) => ({
      x: (i + 1) * 0.25 * 1,
      y: 0.7 + Math.random() * 0.1,
      height: 0.15 + Math.random() * 0.1,
      color: RADIO_COLORS[i % RADIO_COLORS.length],
      pulsePhase: (i / 3) * Math.PI * 2,
      signalRadius: 0,
    }));

    // Frequency bars (equalizer)
    interface FreqBar {
      x: number; phase: number; speed: number; color: string; maxH: number;
    }
    const freqBars: FreqBar[] = Array.from({ length: 60 }, (_, i) => ({
      x: i / 60,
      phase: Math.random() * Math.PI * 2,
      speed: 0.04 + Math.random() * 0.06,
      color: RADIO_COLORS[i % RADIO_COLORS.length],
      maxH: 0.06 + Math.random() * 0.14,
    }));

    // Floating radio waves (horizontal sine lines)
    interface RadioWave {
      y: number; amplitude: number; freq: number; speed: number;
      color: string; opacity: number; phase: number;
    }
    const radioWaves: RadioWave[] = Array.from({ length: 8 }, (_, i) => ({
      y: 0.1 + i * 0.1,
      amplitude: 8 + Math.random() * 20,
      freq: 0.01 + Math.random() * 0.02,
      speed: 0.002 + Math.random() * 0.003,
      color: RADIO_COLORS[i % RADIO_COLORS.length],
      opacity: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));

    // Floating particles (signal dots)
    interface Particle {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; color: string; size: number;
    }
    const particles: Particle[] = [];

    // FM frequency display numbers
    interface FreqNum {
      x: number; y: number; vy: number; value: string;
      opacity: number; color: string; size: number;
    }
    const freqNums: FreqNum[] = [];

    let t = 0;
    let frame = 0;

    const spawnParticle = () => {
      const tower = towers[Math.floor(Math.random() * towers.length)];
      particles.push({
        x: tower.x * canvas.width,
        y: tower.y * canvas.height - tower.height * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1 - Math.random() * 2,
        life: 0,
        maxLife: 60 + Math.random() * 80,
        color: tower.color,
        size: 1 + Math.random() * 2,
      });
    };

    const spawnFreqNum = () => {
      const fm = (88 + Math.random() * 20).toFixed(1);
      freqNums.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.3 + Math.random() * canvas.height * 0.4,
        vy: -0.3 - Math.random() * 0.5,
        value: `FM ${fm}`,
        opacity: 0.6,
        color: RADIO_COLORS[Math.floor(Math.random() * RADIO_COLORS.length)],
        size: 10 + Math.random() * 8,
      });
    };

    const animate = (timestamp: number) => {
      t = timestamp;
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const W = canvas.width;
      const H = canvas.height;

      // ── Background gradient ──
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0a0500");
      grad.addColorStop(0.4, "#150800");
      grad.addColorStop(0.7, "#1a0a00");
      grad.addColorStop(1, "#0d0600");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // ── Horizontal radio waves ──
      for (const wave of radioWaves) {
        wave.phase += wave.speed;
        ctx.beginPath();
        for (let x = 0; x < W; x += 2) {
          const y = wave.y * H + Math.sin(x * wave.freq + wave.phase) * wave.amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wave.color + Math.floor(wave.opacity * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── Signal towers ──
      for (const tower of towers) {
        const tx = tower.x * W;
        const ty = tower.y * H;
        const th = tower.height * H;

        // Tower body
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - 6, ty + th);
        ctx.lineTo(tx + 6, ty + th);
        ctx.closePath();
        const tGrad = ctx.createLinearGradient(tx, ty, tx, ty + th);
        tGrad.addColorStop(0, tower.color + "cc");
        tGrad.addColorStop(1, tower.color + "33");
        ctx.fillStyle = tGrad;
        ctx.fill();

        // Tower cross bars
        for (let i = 1; i <= 3; i++) {
          const barY = ty + (th * i) / 4;
          const barW = 4 + i * 3;
          ctx.beginPath();
          ctx.moveTo(tx - barW, barY);
          ctx.lineTo(tx + barW, barY);
          ctx.strokeStyle = tower.color + "88";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Blinking top light
        const blink = Math.sin(t * 0.005 + tower.pulsePhase) > 0;
        if (blink) {
          ctx.beginPath();
          ctx.arc(tx, ty - 4, 4, 0, Math.PI * 2);
          ctx.fillStyle = tower.color;
          ctx.fill();
          ctx.shadowColor = tower.color;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Signal rings emanating from tower top
        for (let ring = 0; ring < 4; ring++) {
          const ringPhase = (t * 0.002 + ring * 0.5 + tower.pulsePhase) % (Math.PI * 2);
          const ringR = 20 + ring * 25 + (ringPhase / (Math.PI * 2)) * 60;
          const ringAlpha = Math.max(0, 0.5 - ring * 0.1 - (ringPhase / (Math.PI * 2)) * 0.5);
          ctx.beginPath();
          ctx.arc(tx, ty - 4, ringR, Math.PI, Math.PI * 2);
          ctx.strokeStyle = tower.color + Math.floor(ringAlpha * 255).toString(16).padStart(2, "0");
          ctx.lineWidth = 1.5 - ring * 0.3;
          ctx.stroke();
        }
      }

      // ── Frequency equalizer bars at bottom ──
      const barW = W / freqBars.length;
      for (const bar of freqBars) {
        const h = (Math.sin(t * bar.speed + bar.phase) * 0.5 + 0.5) * bar.maxH * H;
        const x = bar.x * W;
        const barGrad = ctx.createLinearGradient(x, H - h, x, H);
        barGrad.addColorStop(0, bar.color + "cc");
        barGrad.addColorStop(1, bar.color + "22");
        ctx.fillStyle = barGrad;
        ctx.fillRect(x, H - h, barW - 1, h);
      }

      // ── Spawn & draw particles ──
      if (frame % 3 === 0) spawnParticle();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 200).toString(16).padStart(2, "0");
        ctx.fill();
      }

      // ── Spawn & draw FM frequency numbers ──
      if (frame % 120 === 0) spawnFreqNum();
      for (let i = freqNums.length - 1; i >= 0; i--) {
        const fn = freqNums[i];
        fn.y += fn.vy;
        fn.opacity -= 0.003;
        if (fn.opacity <= 0) { freqNums.splice(i, 1); continue; }
        ctx.font = `bold ${fn.size}px monospace`;
        ctx.fillStyle = fn.color + Math.floor(fn.opacity * 255).toString(16).padStart(2, "0");
        ctx.fillText(fn.value, fn.x, fn.y);
      }

      // ── Center glow ──
      const centerGrad = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.4);
      centerGrad.addColorStop(0, "rgba(255,107,0,0.08)");
      centerGrad.addColorStop(1, "transparent");
      ctx.fillStyle = centerGrad;
      ctx.fillRect(0, 0, W, H);

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
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.9 }}
    />
  );
}
