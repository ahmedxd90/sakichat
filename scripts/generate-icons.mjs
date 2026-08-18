import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

try { mkdirSync(iconsDir, { recursive: true }); } catch {}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#1a0a2e');
  grad.addColorStop(0.5, '#2d1b4e');
  grad.addColorStop(1, '#0f0f1a');

  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Purple glow
  const glow = ctx.createRadialGradient(size/2, size*0.45, 0, size/2, size*0.45, size*0.55);
  glow.addColorStop(0, 'rgba(168,85,247,0.5)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
  ctx.fill();

  // Border ring
  ctx.strokeStyle = 'rgba(168,85,247,0.6)';
  ctx.lineWidth = size * 0.025;
  const rr = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(rr + ctx.lineWidth, ctx.lineWidth);
  ctx.lineTo(size - rr - ctx.lineWidth, ctx.lineWidth);
  ctx.quadraticCurveTo(size - ctx.lineWidth, ctx.lineWidth, size - ctx.lineWidth, rr + ctx.lineWidth);
  ctx.lineTo(size - ctx.lineWidth, size - rr - ctx.lineWidth);
  ctx.quadraticCurveTo(size - ctx.lineWidth, size - ctx.lineWidth, size - rr - ctx.lineWidth, size - ctx.lineWidth);
  ctx.lineTo(rr + ctx.lineWidth, size - ctx.lineWidth);
  ctx.quadraticCurveTo(ctx.lineWidth, size - ctx.lineWidth, ctx.lineWidth, size - rr - ctx.lineWidth);
  ctx.lineTo(ctx.lineWidth, rr + ctx.lineWidth);
  ctx.quadraticCurveTo(ctx.lineWidth, ctx.lineWidth, rr + ctx.lineWidth, ctx.lineWidth);
  ctx.closePath();
  ctx.stroke();

  // Arabic text
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(168,85,247,0.9)';
  ctx.shadowBlur = size * 0.08;
  ctx.font = `900 ${size * 0.32}px "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ساكي', size / 2, size / 2);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(iconsDir, `icon-${size}x${size}.png`), buffer);
  console.log(`✅ Generated icon-${size}x${size}.png`);
}
