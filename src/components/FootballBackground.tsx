import { useEffect, useRef } from "react";

// Enhanced Football Stadium Background with realistic field, crowd, and sports effects
export default function FootballBackground() {
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

    // Crowd particles - more dense and colorful
    interface Crowd {
      x: number; y: number; r: number; color: string;
      phase: number; speed: number; amp: number; row: number;
    }
    const crowdColors = [
      "#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#a855f7",
      "#ec4899","#ffffff","#fbbf24","#06b6d4","#84cc16","#f43f5e",
      "#10b981","#6366f1","#f59e0b","#14b8a6",
    ];
    const crowd: Crowd[] = Array.from({ length: 200 }, (_, idx) => ({
      x: Math.random(),
      y: 0.30 + Math.random() * 0.28,
      r: 1.5 + Math.random() * 3.5,
      color: crowdColors[Math.floor(Math.random() * crowdColors.length)],
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.8,
      amp: 1.5 + Math.random() * 4,
      row: idx % 8,
    }));

    // Confetti / ticker tape
    interface Confetti {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; rot: number; rotSpeed: number;
    }
    const confetti: Confetti[] = Array.from({ length: 50 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.45,
      vx: (Math.random() - 0.5) * 0.0008,
      vy: 0.0002 + Math.random() * 0.0004,
      color: crowdColors[Math.floor(Math.random() * crowdColors.length)],
      size: 2 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06,
    }));

    // Flares / light beams
    interface Flare {
      x: number; phase: number; speed: number;
    }
    const flares: Flare[] = Array.from({ length: 6 }, (_, i) => ({
      x: 0.1 + (i / 5) * 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
    }));

    let t = 0;
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // ── Night sky gradient ──
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.32);
      sky.addColorStop(0, "#020510");
      sky.addColorStop(0.5, "#050d20");
      sky.addColorStop(1, "#071528");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H * 0.32);

      // Stars in sky
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      for (let s = 0; s < 40; s++) {
        const sx = ((s * 137.5) % 1) * W;
        const sy = ((s * 73.1) % 1) * H * 0.28;
        const sr = 0.5 + ((s * 31) % 1) * 1;
        const twinkle = 0.4 + 0.4 * Math.sin(t * 1.5 + s);
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Stadium structure ──
      // Upper stands arch
      const standGrad = ctx.createLinearGradient(0, H * 0.22, 0, H * 0.60);
      standGrad.addColorStop(0, "#0d1e30");
      standGrad.addColorStop(0.4, "#0a1828");
      standGrad.addColorStop(1, "#060e18");
      ctx.fillStyle = standGrad;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.60);
      ctx.lineTo(0, H * 0.28);
      ctx.quadraticCurveTo(W * 0.25, H * 0.18, W * 0.5, H * 0.16);
      ctx.quadraticCurveTo(W * 0.75, H * 0.18, W, H * 0.28);
      ctx.lineTo(W, H * 0.60);
      ctx.closePath();
      ctx.fill();

      // Stadium roof edge highlight
      ctx.strokeStyle = "rgba(34,197,94,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.28);
      ctx.quadraticCurveTo(W * 0.25, H * 0.18, W * 0.5, H * 0.16);
      ctx.quadraticCurveTo(W * 0.75, H * 0.18, W, H * 0.28);
      ctx.stroke();

      // Crowd rows (tiered seating)
      for (let row = 0; row < 8; row++) {
        const rowY = H * (0.22 + row * 0.045);
        const rowH = H * 0.04;
        const rowGrad = ctx.createLinearGradient(0, rowY, 0, rowY + rowH);
        const b = 15 + row * 3;
        rowGrad.addColorStop(0, `rgba(${b + 5},${b * 2},${b * 3},0.85)`);
        rowGrad.addColorStop(1, `rgba(${b},${b + 5},${b * 2},0.9)`);
        ctx.fillStyle = rowGrad;
        ctx.fillRect(0, rowY, W, rowH);

        // Row separator line
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, rowY);
        ctx.lineTo(W, rowY);
        ctx.stroke();
      }

      // Animated crowd dots
      crowd.forEach((c) => {
        const cy = c.y * H + Math.sin(t * c.speed + c.phase) * c.amp;
        ctx.beginPath();
        ctx.arc(c.x * W, cy, c.r, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t * c.speed * 0.7 + c.phase);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ── Pitch (green field) ──
      const pitchTop = H * 0.58;
      const pitchGrad = ctx.createLinearGradient(0, pitchTop, 0, H);
      pitchGrad.addColorStop(0, "#0f4a0f");
      pitchGrad.addColorStop(0.15, "#145214");
      pitchGrad.addColorStop(0.35, "#0f4a0f");
      pitchGrad.addColorStop(0.55, "#145214");
      pitchGrad.addColorStop(0.75, "#0f4a0f");
      pitchGrad.addColorStop(1, "#0a3a0a");
      ctx.fillStyle = pitchGrad;
      ctx.fillRect(0, pitchTop, W, H - pitchTop);

      // Pitch stripes (alternating dark/light)
      const stripeCount = 10;
      for (let i = 0; i < stripeCount; i++) {
        const sx = (i / stripeCount) * W;
        const sw = W / stripeCount;
        if (i % 2 === 0) {
          ctx.fillStyle = "rgba(0,0,0,0.07)";
          ctx.fillRect(sx, pitchTop, sw, H - pitchTop);
        }
      }

      // Pitch lines
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 1.5;

      // Outer boundary
      const px = W * 0.04, py = pitchTop + H * 0.02;
      const pw = W * 0.92, ph = H - pitchTop - H * 0.04;
      ctx.strokeRect(px, py, pw, ph);

      // Center line
      ctx.beginPath();
      ctx.moveTo(W / 2, py);
      ctx.lineTo(W / 2, py + ph);
      ctx.stroke();

      // Center circle
      ctx.beginPath();
      ctx.arc(W / 2, py + ph * 0.5, W * 0.1, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(W / 2, py + ph * 0.5, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();

      // Penalty areas (top)
      ctx.strokeRect(px + pw * 0.28, py, pw * 0.44, ph * 0.22);
      // Goal area (top)
      ctx.strokeRect(px + pw * 0.38, py, pw * 0.24, ph * 0.1);

      // Penalty areas (bottom)
      ctx.strokeRect(px + pw * 0.28, py + ph * 0.78, pw * 0.44, ph * 0.22);
      // Goal area (bottom)
      ctx.strokeRect(px + pw * 0.38, py + ph * 0.9, pw * 0.24, ph * 0.1);

      // Penalty spots
      ctx.beginPath();
      ctx.arc(W / 2, py + ph * 0.14, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(W / 2, py + ph * 0.86, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Corner arcs
      const cr = W * 0.025;
      [[px, py], [px + pw, py], [px, py + ph], [px + pw, py + ph]].forEach(([cx2, cy2]) => {
        ctx.beginPath();
        ctx.arc(cx2, cy2, cr, 0, Math.PI * 2);
        ctx.stroke();
      });

      // ── Confetti / ticker tape ──
      confetti.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.rotSpeed;
        if (c.y > 0.58) { c.y = 0; c.x = Math.random(); }
        if (c.x < 0) c.x = 1;
        if (c.x > 1) c.x = 0;
        ctx.save();
        ctx.translate(c.x * W, c.y * H);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = 0.65;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
        ctx.globalAlpha = 1;
      });

      // ── Stadium light poles ──
      const lightPositions = [0.06, 0.94];
      lightPositions.forEach((lx) => {
        // Pole
        ctx.fillStyle = "#1e3040";
        ctx.fillRect(lx * W - 3, H * 0.04, 6, H * 0.22);

        // Light head
        ctx.fillStyle = "#fffde0";
        ctx.beginPath();
        ctx.ellipse(lx * W, H * 0.05, 22, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glow pulse
        const pulse = 0.12 + 0.06 * Math.sin(t * 1.5 + lx * 10);
        const lg = ctx.createRadialGradient(lx * W, H * 0.05, 0, lx * W, H * 0.05, 60);
        lg.addColorStop(0, `rgba(255,255,200,${pulse + 0.1})`);
        lg.addColorStop(0.5, `rgba(255,255,180,${pulse * 0.4})`);
        lg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(lx * W, H * 0.05, 60, 0, Math.PI * 2);
        ctx.fill();

        // Light beam downward
        const beamAlpha = 0.04 + 0.02 * Math.sin(t * 0.8 + lx * 5);
        const beam = ctx.createLinearGradient(lx * W, H * 0.05, lx * W, H * 0.6);
        beam.addColorStop(0, `rgba(255,255,200,${beamAlpha})`);
        beam.addColorStop(1, "rgba(255,255,200,0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(lx * W - 5, H * 0.05);
        ctx.lineTo(lx * W + 5, H * 0.05);
        ctx.lineTo(lx * W + W * 0.15, H * 0.6);
        ctx.lineTo(lx * W - W * 0.15, H * 0.6);
        ctx.closePath();
        ctx.fill();
      });

      // ── Light flares across crowd ──
      flares.forEach((f) => {
        const alpha = 0.03 + 0.02 * Math.sin(t * f.speed + f.phase);
        const fy = H * (0.25 + 0.1 * Math.sin(t * f.speed * 0.5 + f.phase));
        const fg = ctx.createRadialGradient(f.x * W, fy, 0, f.x * W, fy, W * 0.12);
        fg.addColorStop(0, `rgba(255,255,255,${alpha})`);
        fg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(f.x * W, fy, W * 0.12, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Scoreboard (top center) ──
      const sbW = W * 0.28, sbH = H * 0.055;
      const sbX = (W - sbW) / 2, sbY = H * 0.17;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.roundRect(sbX, sbY, sbW, sbH, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(34,197,94,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Score text
      ctx.fillStyle = "#22c55e";
      ctx.font = `bold ${Math.max(8, sbH * 0.55)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("⚽ LIVE", W / 2, sbY + sbH * 0.68);

      t += 0.018;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}
