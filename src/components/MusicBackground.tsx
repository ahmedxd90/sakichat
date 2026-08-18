import { useEffect, useRef } from "react";

// ── Disco Music Animated Background ──────────────────────────────────────────
export default function MusicBackground() {
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

    // ── Types ──
    interface Particle {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; color: string; size: number;
    }
    interface Firework {
      x: number; y: number; vy: number; color: string; exploded: boolean;
    }
    interface WaveBar {
      x: number; phase: number; speed: number; color: string; maxH: number;
    }
    interface Note {
      x: number; y: number; vy: number; vx: number;
      opacity: number; size: number; char: string; color: string;
    }
    interface Spark {
      x: number; y: number; vx: number; vy: number;
      life: number; color: string;
    }

    const fireworks: Firework[] = [];
    const particles: Particle[] = [];
    const notes: Note[] = [];
    const sparks: Spark[] = [];

    // Disco colors
    const DISCO_COLORS = [
      "#ff006e", "#fb5607", "#ffbe0b", "#8338ec",
      "#3a86ff", "#06d6a0", "#ff4d6d", "#f72585",
      "#7209b7", "#4cc9f0", "#ff9f1c", "#2ec4b6",
    ];

    // Wave bars at bottom
    const waveBars: WaveBar[] = Array.from({ length: 40 }, (_, i) => ({
      x: (i / 40) * 1,
      phase: Math.random() * Math.PI * 2,
      speed: 0.03 + Math.random() * 0.05,
      color: DISCO_COLORS[i % DISCO_COLORS.length],
      maxH: 0.08 + Math.random() * 0.12,
    }));

    // Disco ball state
    let discoBallAngle = 0;
    let discoBallPulse = 0;

    const spawnFirework = () => {
      fireworks.push({
        x: 0.1 * canvas.width + Math.random() * 0.8 * canvas.width,
        y: canvas.height,
        vy: -(9 + Math.random() * 7),
        color: DISCO_COLORS[Math.floor(Math.random() * DISCO_COLORS.length)],
        exploded: false,
      });
    };

    const explode = (fw: Firework) => {
      const count = 50 + Math.floor(Math.random() * 30);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = 1.5 + Math.random() * 4;
        particles.push({
          x: fw.x, y: fw.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1, maxLife: 0.6 + Math.random() * 0.8,
          color: fw.color,
          size: 1.5 + Math.random() * 2.5,
        });
      }
    };

    const spawnNote = () => {
      const chars = ["♪", "♫", "♬", "♩", "🎵", "🎶"];
      notes.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.7 + Math.random() * canvas.height * 0.2,
        vy: -(0.5 + Math.random() * 1.5),
        vx: (Math.random() - 0.5) * 0.8,
        opacity: 0.8 + Math.random() * 0.2,
        size: 14 + Math.random() * 18,
        char: chars[Math.floor(Math.random() * chars.length)],
        color: DISCO_COLORS[Math.floor(Math.random() * DISCO_COLORS.length)],
      });
    };

    const spawnSpark = (x: number, y: number) => {
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * (1 + Math.random() * 3),
          vy: Math.sin(angle) * (1 + Math.random() * 3),
          life: 1,
          color: DISCO_COLORS[Math.floor(Math.random() * DISCO_COLORS.length)],
        });
      }
    };

    // Draw disco ball
    const drawDiscoBall = (t: number) => {
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.18;
      const r = Math.min(canvas.width, canvas.height) * 0.09;
      discoBallAngle += 0.008;
      discoBallPulse = Math.sin(t * 0.002) * 0.15 + 1;

      // Glow rings
      for (let ring = 3; ring >= 1; ring--) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * ring * 1.2 * discoBallPulse);
        grad.addColorStop(0, `rgba(255,255,255,${0.04 / ring})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, r * ring * 1.2 * discoBallPulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Ball base
      const ballGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r * discoBallPulse);
      ballGrad.addColorStop(0, "#ffffff");
      ballGrad.addColorStop(0.3, "#c0c0c0");
      ballGrad.addColorStop(0.7, "#808080");
      ballGrad.addColorStop(1, "#404040");
      ctx.beginPath();
      ctx.arc(cx, cy, r * discoBallPulse, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();

      // Mirror tiles
      const tileRows = 8;
      const tileCols = 12;
      for (let row = 0; row < tileRows; row++) {
        for (let col = 0; col < tileCols; col++) {
          const phi = (row / tileRows) * Math.PI;
          const theta = (col / tileCols) * Math.PI * 2 + discoBallAngle;
          const tx = cx + r * discoBallPulse * Math.sin(phi) * Math.cos(theta);
          const ty = cy + r * discoBallPulse * Math.cos(phi);
          const tz = Math.sin(phi) * Math.sin(theta);
          if (tz < 0) continue;
          const tileSize = r * 0.18 * discoBallPulse;
          const colorIdx = (row * tileCols + col) % DISCO_COLORS.length;
          const brightness = 0.4 + tz * 0.6;
          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(discoBallAngle * 2);
          ctx.fillStyle = DISCO_COLORS[colorIdx] + Math.floor(brightness * 255).toString(16).padStart(2, "0");
          ctx.fillRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize);
          ctx.restore();
        }
      }

      // Shine
      const shineGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.35, cy - r * 0.35, r * 0.5);
      shineGrad.addColorStop(0, "rgba(255,255,255,0.5)");
      shineGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r * discoBallPulse, 0, Math.PI * 2);
      ctx.fillStyle = shineGrad;
      ctx.fill();

      // Light beams from disco ball
      const beamCount = 8;
      for (let b = 0; b < beamCount; b++) {
        const angle = (b / beamCount) * Math.PI * 2 + discoBallAngle * 3;
        const beamColor = DISCO_COLORS[(b + Math.floor(t / 200)) % DISCO_COLORS.length];
        const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * canvas.width, cy + Math.sin(angle) * canvas.height);
        grad.addColorStop(0, beamColor + "60");
        grad.addColorStop(0.3, beamColor + "20");
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle - 0.05) * canvas.width * 1.5, cy + Math.sin(angle - 0.05) * canvas.height * 1.5);
        ctx.lineTo(cx + Math.cos(angle + 0.05) * canvas.width * 1.5, cy + Math.sin(angle + 0.05) * canvas.height * 1.5);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Hanging string
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, cy - r * discoBallPulse);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // Draw wave bars
    const drawWaveBars = (t: number) => {
      const barW = canvas.width / waveBars.length;
      waveBars.forEach((bar, i) => {
        const h = canvas.height * bar.maxH * (0.5 + 0.5 * Math.sin(t * bar.speed + bar.phase));
        const x = i * barW;
        const y = canvas.height - h;
        const grad = ctx.createLinearGradient(x, y, x, canvas.height);
        grad.addColorStop(0, bar.color + "ff");
        grad.addColorStop(0.5, bar.color + "aa");
        grad.addColorStop(1, bar.color + "22");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, barW - 2, h, [3, 3, 0, 0]);
        ctx.fill();
      });
    };

    // Draw floor grid
    const drawFloorGrid = (t: number) => {
      const gridSize = 40;
      const perspective = 0.6;
      ctx.save();
      ctx.globalAlpha = 0.15;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, canvas.height * 0.6);
        ctx.lineTo(canvas.width / 2 + (x - canvas.width / 2) * perspective, canvas.height);
        ctx.strokeStyle = DISCO_COLORS[Math.floor(x / gridSize) % DISCO_COLORS.length];
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const y = canvas.height * 0.6 + (i / 8) * canvas.height * 0.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = DISCO_COLORS[i % DISCO_COLORS.length];
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.restore();
    };

    let t = 0;
    let lastFirework = 0;
    let lastNote = 0;

    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, "#050010");
      bgGrad.addColorStop(0.4, "#0a0020");
      bgGrad.addColorStop(0.7, "#0d0015");
      bgGrad.addColorStop(1, "#000008");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor grid
      drawFloorGrid(t);

      // Disco ball + beams
      drawDiscoBall(t);

      // Wave bars at bottom
      drawWaveBars(t);

      // Fireworks
      if (t - lastFirework > 1200) {
        spawnFirework();
        lastFirework = t;
      }
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        fw.y += fw.vy;
        fw.vy += 0.15;
        if (!fw.exploded && fw.vy >= -2) {
          fw.exploded = true;
          explode(fw);
          spawnSpark(fw.x, fw.y);
          fireworks.splice(i, 1);
          continue;
        }
        if (!fw.exploded) {
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = fw.color;
          ctx.fill();
          // Trail
          ctx.beginPath();
          ctx.moveTo(fw.x, fw.y);
          ctx.lineTo(fw.x, fw.y - fw.vy * 3);
          ctx.strokeStyle = fw.color + "80";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.98;
        p.life -= 0.012;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.1;
        s.life -= 0.04;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = s.life;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2 * s.life, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Music notes
      if (t - lastNote > 600) {
        spawnNote();
        lastNote = t;
      }
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.y += n.vy;
        n.x += n.vx;
        n.opacity -= 0.005;
        if (n.opacity <= 0 || n.y < -20) { notes.splice(i, 1); continue; }
        ctx.globalAlpha = n.opacity;
        ctx.font = `${n.size}px serif`;
        ctx.fillStyle = n.color;
        ctx.fillText(n.char, n.x, n.y);
        ctx.globalAlpha = 1;
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
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
