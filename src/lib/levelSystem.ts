// ── نظام المستويات المشترك ──
// نفس السياسة المستخدمة في LevelPage:
// - مستوى الثروة: يرتفع بإرسال الهدايا، كل مستوى يحتاج ضعف السابق (×2)
// - مستوى الكاريزما: يرتفع باستقبال الهدايا، كل مستوى يحتاج 4 أضعاف السابق (×4)
// - المستوى الأول يحتاج 200 عملة
// - كل 5 مستويات تتغير الألوان والأيقونة

export function calcLevelWealth(totalCoins: number): number {
  if (totalCoins < 200) return 0;
  let level = 0;
  let required = 200;
  let cumulative = 0;
  for (let i = 1; i <= 500; i++) {
    cumulative += required;
    if (totalCoins >= cumulative) level = i;
    else break;
    required = Math.floor(required * 2);
  }
  return level;
}

export function calcLevelCharisma(totalCoins: number): number {
  if (totalCoins < 200) return 0;
  let level = 0;
  let required = 200;
  let cumulative = 0;
  for (let i = 1; i <= 500; i++) {
    cumulative += required;
    if (totalCoins >= cumulative) level = i;
    else break;
    required = Math.floor(required * 4);
  }
  return level;
}

export function coinsForWealthLevel(n: number): number {
  if (n <= 0) return 0;
  let total = 0;
  let req = 200;
  for (let i = 1; i <= n; i++) {
    total += req;
    req = Math.floor(req * 2);
  }
  return total;
}

export function coinsForCharismaLevel(n: number): number {
  if (n <= 0) return 0;
  let total = 0;
  let req = 200;
  for (let i = 1; i <= n; i++) {
    total += req;
    req = Math.floor(req * 4);
  }
  return total;
}

// ── ألوان كل 5 مستويات ──
export function getLevelColor(level: number): {
  primary: string;
  secondary: string;
  glow: string;
  bg: string;
  tier: string;
} {
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  const group = Math.floor((safeLevel - 1) / 5);
  const tiers = [
    { primary: "#c084fc", secondary: "#9333ea", glow: "rgba(192,132,252,0.6)", bg: "rgba(147,51,234,0.12)", tier: "مبتدئ" },
    { primary: "#60a5fa", secondary: "#2563eb", glow: "rgba(96,165,250,0.6)", bg: "rgba(37,99,235,0.12)", tier: "متقدم" },
    { primary: "#34d399", secondary: "#059669", glow: "rgba(52,211,153,0.6)", bg: "rgba(5,150,105,0.12)", tier: "محترف" },
    { primary: "#fbbf24", secondary: "#d97706", glow: "rgba(251,191,36,0.6)", bg: "rgba(217,119,6,0.12)", tier: "خبير" },
    { primary: "#f97316", secondary: "#ea580c", glow: "rgba(249,115,22,0.6)", bg: "rgba(234,88,12,0.12)", tier: "أسطوري" },
    { primary: "#ef4444", secondary: "#dc2626", glow: "rgba(239,68,68,0.6)", bg: "rgba(220,38,38,0.12)", tier: "بطل" },
    { primary: "#ec4899", secondary: "#db2777", glow: "rgba(236,72,153,0.6)", bg: "rgba(219,39,119,0.12)", tier: "ملكي" },
    { primary: "#8b5cf6", secondary: "#6d28d9", glow: "rgba(139,92,246,0.7)", bg: "rgba(109,40,217,0.15)", tier: "إمبراطوري" },
    { primary: "#06b6d4", secondary: "#0891b2", glow: "rgba(6,182,212,0.7)", bg: "rgba(8,145,178,0.15)", tier: "ماسي" },
    { primary: "#f0abfc", secondary: "#e879f9", glow: "rgba(240,171,252,0.8)", bg: "rgba(232,121,249,0.18)", tier: "إلهي" },
  ];
  return tiers[Math.max(0, Math.min(group, tiers.length - 1))] ?? tiers[0];
}

// ── شكل الأيقونة حسب المجموعة ──
export function getLevelShapeIndex(level: number): number {
  return Math.min(Math.floor((level - 1) / 5), 9);
}

export function getLevelTier(level: number): number {
  if (level <= 10) return 1;
  if (level <= 20) return 2;
  if (level <= 30) return 3;
  if (level <= 40) return 4;
  return 5;
}

export function getLevelAsset(level: number, type: "wealth" | "charisma"): string {
  const clamped = Math.max(1, Math.min(100, level || 1));
  return `/levels/level_${clamped}.png`;
}

export function getLevelTierLabel(level: number): string {
  return "مستوى " + level;
}
