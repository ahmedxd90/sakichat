import { useEffect, useRef } from "react";

// ── Desert Night Animated Background ─────────────────────────────────────────
// Night sky + stars + shooting stars + sand dunes + camels + coffee pot + tent
export default function DesertBackground() {
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

    // ── Stars ──
    interface Star {
      x: number; y: number; r: number; opacity: number; twinkleSpeed: number; twinklePhase: number;
    }
    const stars: Star[] = Array.from({ length: 220 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.65,
      r: 0.4 + Math.random() * 1.8,
      opacity: 0.4 + Math.random() * 0.6,
      twinkleSpeed: 0.001 + Math.random() * 0.004,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    // ── Shooting stars ──
    interface ShootingStar {
      x: number; y: number; vx: number; vy: number; len: number; life: number; maxLife: number; opacity: number;
    }
    const shootingStars: ShootingStar[] = [];
    let lastSS = 0;

    const spawnShootingStar = () => {
      const angle = Math.PI / 5 + Math.random() * Math.PI / 5;
      const speed = 10 + Math.random() * 12;
      shootingStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 70 + Math.random() * 90,
        life: 0,
        maxLife: 35 + Math.random() * 25,
        opacity: 1,
      });
    };

    // ── Sand particles ──
    interface SandParticle {
      x: number; y: number; vx: number; vy: number; r: number; opacity: number; life: number;
    }
    const sandParticles: SandParticle[] = [];
    let lastSand = 0;

    const spawnSandBurst = () => {
      const count = 8 + Math.floor(Math.random() * 12);
      const startX = Math.random() * canvas.width;
      const startY = canvas.height * (0.55 + Math.random() * 0.45);
      for (let i = 0; i < count; i++) {
        sandParticles.push({
          x: startX + (Math.random() - 0.5) * 60,
          y: startY,
          vx: (Math.random() - 0.3) * 3,
          vy: -(1 + Math.random() * 3),
          r: 1 + Math.random() * 3,
          opacity: 0.6 + Math.random() * 0.4,
          life: 0,
        });
      }
    };

    // ── Camel state ──
    interface Camel {
      x: number; y: number; speed: number; legPhase: number; dir: number; scale: number;
    }
    const camels: Camel[] = [
      { x: -80, y: 0, speed: 0.4, legPhase: 0, dir: 1, scale: 1 },
      { x: canvas.width + 60, y: 0, speed: 0.3, legPhase: Math.PI, dir: -1, scale: 0.75 },
    ];

    // ── Fire particles ──
    interface FireParticle {
      x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number;
    }
    const fireParticles: FireParticle[] = [];
    let lastFire = 0;

    const spawnFire = (fx: number, fy: number) => {
      for (let i = 0; i < 3; i++) {
        fireParticles.push({
          x: fx + (Math.random() - 0.5) * 10,
          y: fy,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(1.5 + Math.random() * 2),
          life: 0,
          maxLife: 20 + Math.random() * 15,
          size: 3 + Math.random() * 5,
        });
      }
    };

    // ── Draw camel ──
    const drawCamel = (cx: number, cy: number, legPhase: number, dir: number, scale: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(dir * scale, scale);

      const sandY = 0;

      // Body
      ctx.beginPath();
      ctx.ellipse(0, sandY - 28, 32, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#c8a96e";
      ctx.fill();

      // Hump
      ctx.beginPath();
      ctx.ellipse(8, sandY - 44, 14, 18, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = "#b8945a";
      ctx.fill();

      // Neck
      ctx.beginPath();
      ctx.moveTo(-22, sandY - 28);
      ctx.quadraticCurveTo(-30, sandY - 50, -26, sandY - 62);
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#c8a96e";
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.ellipse(-26, sandY - 68, 10, 8, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#c8a96e";
      ctx.fill();

      // Eye
      ctx.beginPath();
      ctx.arc(-30, sandY - 70, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#3d2b1f";
      ctx.fill();

      // Nose
      ctx.beginPath();
      ctx.arc(-34, sandY - 65, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#8b6347";
      ctx.fill();

      // Ear
      ctx.beginPath();
      ctx.moveTo(-20, sandY - 74);
      ctx.lineTo(-16, sandY - 82);
      ctx.lineTo(-14, sandY - 74);
      ctx.fillStyle = "#b8945a";
      ctx.fill();

      // Legs
      const legSwing = Math.sin(legPhase) * 8;
      const legSwing2 = Math.sin(legPhase + Math.PI) * 8;

      // Front legs
      ctx.beginPath();
      ctx.moveTo(-18, sandY - 14);
      ctx.lineTo(-18 + legSwing, sandY);
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#b8945a";
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-10, sandY - 14);
      ctx.lineTo(-10 + legSwing2, sandY);
      ctx.stroke();

      // Back legs
      ctx.beginPath();
      ctx.moveTo(16, sandY - 14);
      ctx.lineTo(16 + legSwing2, sandY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(22, sandY - 14);
      ctx.lineTo(22 + legSwing, sandY);
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(32, sandY - 24);
      ctx.quadraticCurveTo(40, sandY - 18, 38, sandY - 10);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#8b6347";
      ctx.stroke();

      ctx.restore();
    };

    // ── Draw tent (بيت شعر) ──
    const drawTent = (tx: number, ty: number, scale: number) => {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);

      // Main tent body
      ctx.beginPath();
      ctx.moveTo(-70, 0);
      ctx.lineTo(-50, -45);
      ctx.lineTo(0, -55);
      ctx.lineTo(50, -45);
      ctx.lineTo(70, 0);
      ctx.closePath();
      ctx.fillStyle = "#8b6347";
      ctx.fill();

      // Tent stripes
      for (let i = 0; i < 4; i++) {
        const x = -60 + i * 30;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 15, -40);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#5c3d1e";
        ctx.stroke();
      }

      // Tent opening
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-10, -30);
      ctx.lineTo(10, -30);
      ctx.lineTo(15, 0);
      ctx.fillStyle = "#2d1a0a";
      ctx.fill();

      // Tent poles
      ctx.beginPath();
      ctx.moveTo(-50, -45);
      ctx.lineTo(-50, 5);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#5c3d1e";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(50, -45);
      ctx.lineTo(50, 5);
      ctx.stroke();

      // Ropes
      ctx.beginPath();
      ctx.moveTo(-50, -45);
      ctx.lineTo(-90, 5);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#8b6347";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(50, -45);
      ctx.lineTo(90, 5);
      ctx.stroke();

      ctx.restore();
    };

    // ── Draw coffee pot (دلة) ──
    const drawDalla = (dx: number, dy: number, scale: number) => {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.scale(scale, scale);

      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#c8a000";
      ctx.fill();
      ctx.strokeStyle = "#8b6d00";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Neck
      ctx.beginPath();
      ctx.moveTo(-4, -14);
      ctx.lineTo(-3, -22);
      ctx.lineTo(3, -22);
      ctx.lineTo(4, -14);
      ctx.fillStyle = "#c8a000";
      ctx.fill();

      // Spout
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.quadraticCurveTo(-20, -10, -22, -18);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#c8a000";
      ctx.lineCap = "round";
      ctx.stroke();

      // Handle
      ctx.beginPath();
      ctx.arc(12, -4, 8, -Math.PI / 2, Math.PI / 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#8b6d00";
      ctx.stroke();

      // Lid
      ctx.beginPath();
      ctx.ellipse(0, -22, 4, 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#c8a000";
      ctx.fill();

      // Decoration lines
      ctx.beginPath();
      ctx.moveTo(-8, -6);
      ctx.lineTo(8, -6);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#8b6d00";
      ctx.stroke();

      ctx.restore();
    };

    // ── Draw moon ──
    const drawMoon = (W: number) => {
      const mx = W * 0.82;
      const my = 60;
      const mr = 28;

      // Moon glow
      const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 3);
      moonGlow.addColorStop(0, "rgba(255,240,180,0.25)");
      moonGlow.addColorStop(1, "transparent");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(mx, my, mr * 3, 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fillStyle = "#fff8d0";
      ctx.fill();

      // Crescent shadow
      ctx.beginPath();
      ctx.arc(mx + 10, my - 5, mr - 4, 0, Math.PI * 2);
      ctx.fillStyle = "#1a1a3a";
      ctx.fill();
    };

    // ── Draw Arabic poem text ──
    const drawPoem = (W: number, H: number, t: number) => {
      const alpha = 0.05 + 0.02 * Math.sin(t * 0.0005);
      ctx.save();
      ctx.font = `bold ${Math.min(W * 0.04, 18)}px 'Amiri', serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(255,220,150,${alpha})`;
      ctx.fillText("يا ليلَ الصبِّ متى غدُهُ", W * 0.5, H * 0.18);
      ctx.font = `bold ${Math.min(W * 0.035, 15)}px 'Amiri', serif`;
      ctx.fillStyle = `rgba(255,200,100,${alpha * 0.8})`;
      ctx.fillText("أقيموا بني أمي صدور مطيكم", W * 0.5, H * 0.23);
      ctx.restore();
    };

    // ── Draw "سـاكـي" watermark ──
    const drawWatermark = (W: number, H: number, t: number) => {
      const alpha = 0.05 + 0.02 * Math.sin(t * 0.0007);
      ctx.save();
      ctx.font = `bold ${Math.min(W * 0.16, 72)}px 'Amiri', 'Scheherazade New', serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const grad = ctx.createLinearGradient(W * 0.3, H * 0.5, W * 0.7, H * 0.5);
      grad.addColorStop(0, `rgba(200,169,110,${alpha})`);
      grad.addColorStop(0.5, `rgba(255,220,150,${alpha * 1.5})`);
      grad.addColorStop(1, `rgba(180,130,60,${alpha})`);
      ctx.fillStyle = grad;
      ctx.fillText("سـاكـي", W * 0.5, H * 0.5);
      ctx.restore();
    };

    let t = 0;

    const animate = (timestamp: number) => {
      t = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const W = canvas.width;
      const H = canvas.height;

      // ── Night sky gradient ──
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
      skyGrad.addColorStop(0, "#050510");
      skyGrad.addColorStop(0.4, "#0a0820");
      skyGrad.addColorStop(0.7, "#1a1008");
      skyGrad.addColorStop(1, "#2d1a05");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Milky way glow ──
      const mw = ctx.createLinearGradient(0, H * 0.1, W, H * 0.5);
      mw.addColorStop(0, "rgba(100,80,200,0.04)");
      mw.addColorStop(0.5, "rgba(150,120,255,0.07)");
      mw.addColorStop(1, "rgba(80,60,150,0.03)");
      ctx.fillStyle = mw;
      ctx.fillRect(0, 0, W, H * 0.65);

      // ── Stars ──
      stars.forEach((s) => {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const alpha = s.opacity * (0.4 + 0.6 * twinkle);
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,240,${alpha})`;
        ctx.fill();
      });

      // ── Moon ──
      drawMoon(W);

      // ── Shooting stars ──
      if (t - lastSS > 2000 + Math.random() * 3000) {
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
        grad.addColorStop(1, `rgba(255,240,200,${ss.opacity})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,240,200,${ss.opacity})`;
        ctx.fill();
      }

      // ── Poem text ──
      drawPoem(W, H, t);

      // ── Watermark ──
      drawWatermark(W, H, t);

      // ── Sand dunes (background) ──
      const duneY = H * 0.62;

      // Far dune
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, duneY + H * 0.08);
      ctx.quadraticCurveTo(W * 0.25, duneY - H * 0.06, W * 0.5, duneY + H * 0.04);
      ctx.quadraticCurveTo(W * 0.75, duneY + H * 0.12, W, duneY + H * 0.02);
      ctx.lineTo(W, H);
      ctx.closePath();
      const farDuneGrad = ctx.createLinearGradient(0, duneY - H * 0.06, 0, H);
      farDuneGrad.addColorStop(0, "#8b6347");
      farDuneGrad.addColorStop(0.3, "#c8a96e");
      farDuneGrad.addColorStop(1, "#d4b483");
      ctx.fillStyle = farDuneGrad;
      ctx.fill();

      // Mid dune
      const midDuneY = H * 0.7;
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, midDuneY + H * 0.05);
      ctx.quadraticCurveTo(W * 0.2, midDuneY - H * 0.08, W * 0.45, midDuneY + H * 0.02);
      ctx.quadraticCurveTo(W * 0.7, midDuneY + H * 0.1, W, midDuneY - H * 0.02);
      ctx.lineTo(W, H);
      ctx.closePath();
      const midDuneGrad = ctx.createLinearGradient(0, midDuneY - H * 0.08, 0, H);
      midDuneGrad.addColorStop(0, "#c8a96e");
      midDuneGrad.addColorStop(0.4, "#d4b483");
      midDuneGrad.addColorStop(1, "#e8c99a");
      ctx.fillStyle = midDuneGrad;
      ctx.fill();

      // Front dune
      const frontDuneY = H * 0.78;
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, frontDuneY + H * 0.03);
      ctx.quadraticCurveTo(W * 0.3, frontDuneY - H * 0.05, W * 0.6, frontDuneY + H * 0.04);
      ctx.quadraticCurveTo(W * 0.85, frontDuneY + H * 0.08, W, frontDuneY);
      ctx.lineTo(W, H);
      ctx.closePath();
      const frontDuneGrad = ctx.createLinearGradient(0, frontDuneY - H * 0.05, 0, H);
      frontDuneGrad.addColorStop(0, "#d4b483");
      frontDuneGrad.addColorStop(0.3, "#e8c99a");
      frontDuneGrad.addColorStop(1, "#f0d8b0");
      ctx.fillStyle = frontDuneGrad;
      ctx.fill();

      // ── Tent ──
      drawTent(W * 0.15, H * 0.72, 0.7);

      // ── Coffee pot ──
      drawDalla(W * 0.28, H * 0.74, 1.2);

      // ── Fire ──
      const fireX = W * 0.22;
      const fireY = H * 0.74;

      if (t - lastFire > 60) {
        spawnFire(fireX, fireY);
        lastFire = t;
      }

      // Fire base glow
      const fireGlow = ctx.createRadialGradient(fireX, fireY, 0, fireX, fireY, 25);
      fireGlow.addColorStop(0, "rgba(255,150,0,0.4)");
      fireGlow.addColorStop(1, "transparent");
      ctx.fillStyle = fireGlow;
      ctx.beginPath();
      ctx.arc(fireX, fireY, 25, 0, Math.PI * 2);
      ctx.fill();

      // Fire stones
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const sx = fireX + Math.cos(angle) * 12;
        const sy = fireY + Math.sin(angle) * 5;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 4, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#555";
        ctx.fill();
      }

      // Fire particles
      for (let i = fireParticles.length - 1; i >= 0; i--) {
        const fp = fireParticles[i];
        fp.x += fp.vx;
        fp.y += fp.vy;
        fp.vy -= 0.05;
        fp.life++;
        if (fp.life >= fp.maxLife) { fireParticles.splice(i, 1); continue; }
        const progress = fp.life / fp.maxLife;
        const alpha = 1 - progress;
        const r = fp.size * (1 - progress * 0.5);
        const fireColor = progress < 0.3
          ? `rgba(255,200,50,${alpha})`
          : progress < 0.6
            ? `rgba(255,100,20,${alpha})`
            : `rgba(150,50,10,${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, r, 0, Math.PI * 2);
        ctx.fillStyle = fireColor;
        ctx.fill();
      }

      // ── Camels ──
      const camelGroundY = H * 0.76;
      camels.forEach((camel) => {
        camel.x += camel.speed * camel.dir;
        camel.legPhase += 0.08;
        if (camel.dir === 1 && camel.x > W + 100) camel.x = -100;
        if (camel.dir === -1 && camel.x < -100) camel.x = W + 100;
        drawCamel(camel.x, camelGroundY, camel.legPhase, camel.dir, camel.scale);
      });

      // ── Sand storm particles ──
      if (t - lastSand > 200) {
        spawnSandBurst();
        lastSand = t;
      }
      for (let i = sandParticles.length - 1; i >= 0; i--) {
        const sp = sandParticles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.08;
        sp.life++;
        const maxLife = 60;
        if (sp.life >= maxLife || sp.y > H) { sandParticles.splice(i, 1); continue; }
        const alpha = sp.opacity * (1 - sp.life / maxLife);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,180,131,${alpha})`;
        ctx.fill();
      }

      // ── Sand wave overlay (bottom) ──
      const waveY = H * 0.82;
      for (let w = 0; w < 3; w++) {
        const phase = (w / 3) * Math.PI * 2;
        const amp = 6 + 4 * Math.sin(t * 0.001 + phase);
        ctx.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const y = waveY + w * 12 + Math.sin(x * 0.02 + t * 0.002 + phase) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(255,220,160,${0.15 - w * 0.04})`;
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
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}
