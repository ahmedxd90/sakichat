import { useEffect, useRef } from "react";

// ── Astronomy / Astrology Animated Background ─────────────────────────────────
// Night sky with all 12 zodiac constellations, planets, shooting stars, fireworks
export default function AstronomyBackground() {
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

    // ── Zodiac constellations data (normalized 0-1 coords) ──
    const ZODIACS = [
      {
        name: "الحمل", symbol: "♈", color: "#ff6b6b",
        stars: [[0.1,0.15],[0.13,0.12],[0.17,0.14],[0.2,0.11]],
        lines: [[0,1],[1,2],[2,3]]
      },
      {
        name: "الثور", symbol: "♉", color: "#ffd93d",
        stars: [[0.3,0.08],[0.33,0.12],[0.36,0.09],[0.38,0.13],[0.35,0.16]],
        lines: [[0,1],[1,2],[2,3],[3,4],[1,4]]
      },
      {
        name: "الجوزاء", symbol: "♊", color: "#6bcb77",
        stars: [[0.55,0.07],[0.58,0.07],[0.55,0.12],[0.58,0.12],[0.55,0.17],[0.58,0.17]],
        lines: [[0,2],[2,4],[1,3],[3,5],[0,1],[4,5]]
      },
      {
        name: "السرطان", symbol: "♋", color: "#4d96ff",
        stars: [[0.75,0.1],[0.78,0.08],[0.81,0.12],[0.78,0.15]],
        lines: [[0,1],[1,2],[2,3],[3,0]]
      },
      {
        name: "الأسد", symbol: "♌", color: "#ff9f43",
        stars: [[0.05,0.35],[0.09,0.32],[0.13,0.34],[0.16,0.31],[0.13,0.38],[0.09,0.4]],
        lines: [[0,1],[1,2],[2,3],[2,4],[4,5],[5,0]]
      },
      {
        name: "العذراء", symbol: "♍", color: "#a29bfe",
        stars: [[0.3,0.3],[0.34,0.28],[0.37,0.32],[0.34,0.36],[0.38,0.38]],
        lines: [[0,1],[1,2],[2,3],[3,4]]
      },
      {
        name: "الميزان", symbol: "♎", color: "#fd79a8",
        stars: [[0.55,0.28],[0.59,0.25],[0.63,0.28],[0.59,0.32]],
        lines: [[0,1],[1,2],[2,3],[3,0],[1,3]]
      },
      {
        name: "العقرب", symbol: "♏", color: "#e17055",
        stars: [[0.78,0.28],[0.81,0.25],[0.84,0.28],[0.87,0.31],[0.85,0.35],[0.82,0.38],[0.85,0.41]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]
      },
      {
        name: "القوس", symbol: "♐", color: "#00cec9",
        stars: [[0.1,0.55],[0.14,0.52],[0.18,0.55],[0.15,0.59],[0.19,0.62]],
        lines: [[0,1],[1,2],[2,3],[3,4],[0,3]]
      },
      {
        name: "الجدي", symbol: "♑", color: "#74b9ff",
        stars: [[0.35,0.52],[0.39,0.5],[0.43,0.53],[0.4,0.57],[0.36,0.57]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,0]]
      },
      {
        name: "الدلو", symbol: "♒", color: "#55efc4",
        stars: [[0.6,0.5],[0.64,0.48],[0.68,0.51],[0.64,0.55],[0.68,0.58]],
        lines: [[0,1],[1,2],[2,3],[3,4]]
      },
      {
        name: "الحوت", symbol: "♓", color: "#fdcb6e",
        stars: [[0.82,0.5],[0.86,0.48],[0.9,0.51],[0.86,0.55],[0.82,0.57]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,0],[1,3]]
      },
    ];

    // ── Stars background ──
    interface Star {
      x: number; y: number; r: number; opacity: number; twinkleSpeed: number; twinklePhase: number;
    }
    const bgStars: Star[] = Array.from({ length: 200 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.3 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.001 + Math.random() * 0.003,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    // ── Planets ──
    interface Planet {
      x: number; y: number; r: number; color: string; glowColor: string;
      orbitR: number; orbitSpeed: number; orbitAngle: number; orbitCx: number; orbitCy: number;
      name: string;
    }
    const planets: Planet[] = [
      { x: 0.5, y: 0.5, r: 18, color: "#ffd700", glowColor: "rgba(255,215,0,0.6)", orbitR: 0, orbitSpeed: 0, orbitAngle: 0, orbitCx: 0.5, orbitCy: 0.5, name: "الشمس" },
      { x: 0.2, y: 0.7, r: 8, color: "#ff6b6b", glowColor: "rgba(255,107,107,0.5)", orbitR: 0.12, orbitSpeed: 0.0008, orbitAngle: 0, orbitCx: 0.2, orbitCy: 0.7, name: "المريخ" },
      { x: 0.75, y: 0.72, r: 12, color: "#ffd93d", glowColor: "rgba(255,217,61,0.5)", orbitR: 0.1, orbitSpeed: 0.0005, orbitAngle: 1.5, orbitCx: 0.75, orbitCy: 0.72, name: "زحل" },
      { x: 0.5, y: 0.8, r: 10, color: "#4d96ff", glowColor: "rgba(77,150,255,0.5)", orbitR: 0.08, orbitSpeed: 0.0006, orbitAngle: 3, orbitCx: 0.5, orbitCy: 0.8, name: "نبتون" },
    ];

    // ── Shooting stars ──
    interface ShootingStar {
      x: number; y: number; vx: number; vy: number; len: number; opacity: number; life: number; maxLife: number; color: string;
    }
    const shootingStars: ShootingStar[] = [];

    // ── Fireworks ──
    interface FWParticle {
      x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number;
    }
    interface Firework {
      x: number; y: number; vy: number; color: string; exploded: boolean;
    }
    const fireworks: Firework[] = [];
    const fwParticles: FWParticle[] = [];

    const ASTRO_COLORS = ["#a29bfe", "#74b9ff", "#55efc4", "#fdcb6e", "#fd79a8", "#ffd93d", "#6bcb77", "#4d96ff"];

    const spawnFirework = () => {
      fireworks.push({
        x: 0.1 * canvas.width + Math.random() * 0.8 * canvas.width,
        y: canvas.height,
        vy: -(7 + Math.random() * 5),
        color: ASTRO_COLORS[Math.floor(Math.random() * ASTRO_COLORS.length)],
        exploded: false,
      });
    };

    const explodeFirework = (fw: Firework) => {
      const count = 40 + Math.floor(Math.random() * 30);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        fwParticles.push({
          x: fw.x, y: fw.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1, maxLife: 60 + Math.random() * 40,
          color: fw.color,
          size: 1.5 + Math.random() * 2.5,
        });
      }
    };

    const spawnShootingStar = () => {
      const angle = Math.PI / 6 + Math.random() * Math.PI / 6;
      const speed = 8 + Math.random() * 10;
      shootingStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 60 + Math.random() * 80,
        opacity: 1,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        color: ASTRO_COLORS[Math.floor(Math.random() * ASTRO_COLORS.length)],
      });
    };

    // ── Zodiac symbol floaters ──
    interface ZodiacFloat {
      symbol: string; x: number; y: number; vy: number; vx: number; opacity: number; size: number; color: string; life: number;
    }
    const zodiacFloats: ZodiacFloat[] = [];
    const spawnZodiacFloat = () => {
      const z = ZODIACS[Math.floor(Math.random() * ZODIACS.length)];
      zodiacFloats.push({
        symbol: z.symbol,
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        vy: -(0.5 + Math.random() * 1),
        vx: (Math.random() - 0.5) * 0.5,
        opacity: 0.8 + Math.random() * 0.2,
        size: 16 + Math.random() * 24,
        color: z.color,
        life: 0,
      });
    };

    let t = 0;
    let lastFW = 0;
    let lastSS = 0;
    let lastZF = 0;

    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const W = canvas.width;
      const H = canvas.height;

      // ── Deep space gradient ──
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#000510");
      grad.addColorStop(0.3, "#020818");
      grad.addColorStop(0.6, "#050a1a");
      grad.addColorStop(1, "#030610");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // ── Nebula glow ──
      const nebula1 = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.35);
      nebula1.addColorStop(0, "rgba(100,50,200,0.08)");
      nebula1.addColorStop(1, "transparent");
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, W, H);

      const nebula2 = ctx.createRadialGradient(W * 0.75, H * 0.6, 0, W * 0.75, H * 0.6, W * 0.3);
      nebula2.addColorStop(0, "rgba(0,100,180,0.07)");
      nebula2.addColorStop(1, "transparent");
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, W, H);

      // ── Background stars ──
      bgStars.forEach((s) => {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const alpha = s.opacity * (0.4 + 0.6 * twinkle);
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });

      // ── Zodiac constellations ──
      ZODIACS.forEach((z, zi) => {
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.001 + zi * 0.8);
        const alpha = 0.35 * pulse;

        // Draw lines
        z.lines.forEach(([a, b]) => {
          const ax = z.stars[a][0] * W;
          const ay = z.stars[a][1] * H;
          const bx = z.stars[b][0] * W;
          const by = z.stars[b][1] * H;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = z.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
          ctx.lineWidth = 0.8;
          ctx.stroke();
        });

        // Draw stars
        z.stars.forEach(([sx, sy], si) => {
          const starPulse = 0.7 + 0.3 * Math.sin(t * 0.002 + zi + si);
          const r = 1.5 + starPulse;
          ctx.beginPath();
          ctx.arc(sx * W, sy * H, r, 0, Math.PI * 2);
          ctx.fillStyle = z.color;
          ctx.globalAlpha = 0.7 * pulse;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Glow
          const grd = ctx.createRadialGradient(sx * W, sy * H, 0, sx * W, sy * H, r * 4);
          grd.addColorStop(0, z.color + "88");
          grd.addColorStop(1, "transparent");
          ctx.fillStyle = grd;
          ctx.globalAlpha = 0.5 * pulse;
          ctx.beginPath();
          ctx.arc(sx * W, sy * H, r * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });

        // Draw zodiac symbol near first star
        const fx = z.stars[0][0] * W;
        const fy = z.stars[0][1] * H - 14;
        ctx.font = `bold 11px serif`;
        ctx.fillStyle = z.color + Math.floor(0.6 * pulse * 255).toString(16).padStart(2, "0");
        ctx.textAlign = "center";
        ctx.fillText(z.symbol, fx, fy);
      });

      // ── Planets ──
      planets.forEach((p, pi) => {
        p.orbitAngle += p.orbitSpeed;
        const px = p.orbitR > 0
          ? (p.orbitCx + Math.cos(p.orbitAngle) * p.orbitR) * W
          : p.x * W;
        const py = p.orbitR > 0
          ? (p.orbitCy + Math.sin(p.orbitAngle) * p.orbitR * 0.5) * H
          : p.y * H;

        // Orbit ring
        if (p.orbitR > 0) {
          ctx.beginPath();
          ctx.ellipse(p.orbitCx * W, p.orbitCy * H, p.orbitR * W, p.orbitR * H * 0.5, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Planet glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, p.r * 3);
        grd.addColorStop(0, p.glowColor);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 3, 0, Math.PI * 2);
        ctx.fill();

        // Planet body
        const bodyGrd = ctx.createRadialGradient(px - p.r * 0.3, py - p.r * 0.3, 0, px, py, p.r);
        bodyGrd.addColorStop(0, "#ffffff");
        bodyGrd.addColorStop(0.3, p.color);
        bodyGrd.addColorStop(1, p.color + "88");
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrd;
        ctx.fill();

        // Saturn rings
        if (pi === 2) {
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(1, 0.35);
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 2.2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,217,61,0.5)";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }
      });

      // ── Shooting stars ──
      if (t - lastSS > 1500 + Math.random() * 2000) {
        spawnShootingStar();
        lastSS = t;
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life++;
        ss.opacity = 1 - ss.life / ss.maxLife;
        if (ss.life >= ss.maxLife) { shootingStars.splice(i, 1); continue; }

        const tailX = ss.x - ss.vx * (ss.len / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy));
        const tailY = ss.y - ss.vy * (ss.len / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy));
        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, ss.color + Math.floor(ss.opacity * 255).toString(16).padStart(2, "0"));
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Head glow
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = ss.color + Math.floor(ss.opacity * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }

      // ── Fireworks ──
      if (t - lastFW > 3000 + Math.random() * 4000) {
        spawnFirework();
        lastFW = t;
      }
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        fw.y += fw.vy;
        fw.vy += 0.15;
        if (!fw.exploded && fw.vy >= -1) {
          fw.exploded = true;
          explodeFirework(fw);
          fireworks.splice(i, 1);
          continue;
        }
        if (!fw.exploded) {
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = fw.color;
          ctx.fill();
          const trailGrd = ctx.createLinearGradient(fw.x, fw.y + 20, fw.x, fw.y);
          trailGrd.addColorStop(0, "transparent");
          trailGrd.addColorStop(1, fw.color + "aa");
          ctx.beginPath();
          ctx.moveTo(fw.x, fw.y + 20);
          ctx.lineTo(fw.x, fw.y);
          ctx.strokeStyle = trailGrd;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      for (let i = fwParticles.length - 1; i >= 0; i--) {
        const p = fwParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.98;
        p.life++;
        if (p.life >= p.maxLife) { fwParticles.splice(i, 1); continue; }
        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }

      // ── Floating zodiac symbols ──
      if (t - lastZF > 2000 + Math.random() * 3000) {
        spawnZodiacFloat();
        lastZF = t;
      }
      for (let i = zodiacFloats.length - 1; i >= 0; i--) {
        const zf = zodiacFloats[i];
        zf.x += zf.vx;
        zf.y += zf.vy;
        zf.life++;
        const maxLife = 300;
        if (zf.life >= maxLife || zf.y < -30) { zodiacFloats.splice(i, 1); continue; }
        const alpha = zf.life < 30 ? zf.life / 30 : zf.life > maxLife - 30 ? (maxLife - zf.life) / 30 : 1;
        ctx.font = `bold ${zf.size}px serif`;
        ctx.fillStyle = zf.color + Math.floor(alpha * 0.7 * 255).toString(16).padStart(2, "0");
        ctx.textAlign = "center";
        ctx.fillText(zf.symbol, zf.x, zf.y);
      }

      // ── "سـاكـي" text in Thuluth-style ──
      const textAlpha = 0.06 + 0.03 * Math.sin(t * 0.0008);
      ctx.save();
      ctx.font = `bold ${Math.min(W * 0.18, 80)}px 'Amiri', 'Scheherazade New', serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textGrad = ctx.createLinearGradient(W * 0.3, H * 0.5, W * 0.7, H * 0.5);
      textGrad.addColorStop(0, `rgba(162,155,254,${textAlpha})`);
      textGrad.addColorStop(0.5, `rgba(116,185,255,${textAlpha * 1.5})`);
      textGrad.addColorStop(1, `rgba(85,239,196,${textAlpha})`);
      ctx.fillStyle = textGrad;
      ctx.fillText("سـاكـي", W * 0.5, H * 0.5);
      ctx.restore();

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
      style={{ display: "block" }}
    />
  );
}
