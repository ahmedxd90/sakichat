// نظام الأوسمة الاحترافي - SVG بدون إيموجي مع خلفيات لامعة
import React from "react";
import { getLevelColor } from "../lib/levelSystem";
import { getVipConfig, SUPER_ADMIN_BADGE_URL } from "./VipBadge";
import { getAristocracyConfig } from "./AristocracyBadge";

export interface BadgeData {
  id: string;
  label: string;
  sublabel: string;
  colors: {
    primary: string;
    secondary: string;
    glow: string;
    bg: string;
    border: string;
    text: string;
  };
  icon: React.ReactNode;
  shimmer?: boolean;
  tier?: "legendary" | "epic" | "rare" | "common";
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────

export function CrownIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 24h24M6 24L4 10l8 6 4-8 4 8 8-6-2 14H6z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}30`} />
      <circle cx="4" cy="10" r="2.5" fill={color} />
      <circle cx="16" cy="6" r="2.5" fill={color} />
      <circle cx="28" cy="10" r="2.5" fill={color} />
    </svg>
  );
}

export function ShieldIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3L4 8v8c0 7 5.5 12 12 13 6.5-1 12-6 12-13V8L16 3z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}25`} />
      <path d="M11 16l3 3 7-7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3l3.5 8.5L28 13l-6.5 6 2 9L16 24l-7.5 4 2-9L4 13l8.5-1.5L16 3z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}30`} />
    </svg>
  );
}

export function DiamondIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 4L4 14l12 14 12-14L16 4z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}25`} />
      <path d="M4 14h24M10 8l-6 6M22 8l6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LightningIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M18 3L6 18h10l-2 11 14-16H18L20 3z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}30`} />
    </svg>
  );
}

export function HomeIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 14L16 4l12 10v14a2 2 0 01-2 2H6a2 2 0 01-2-2V14z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}25`} />
      <path d="M12 28V20h8v8" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function HeartIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 27S4 20 4 11a7 7 0 0112-4.9A7 7 0 0128 11c0 9-12 16-12 16z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}30`} />
    </svg>
  );
}

export function TrophyIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M10 4h12v10a6 6 0 01-12 0V4z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}25`} />
      <path d="M10 8H6a4 4 0 004 4M22 8h4a4 4 0 01-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 20v4M10 28h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function MicIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="11" y="3" width="10" height="16" rx="5" stroke={color} strokeWidth="2" fill={`${color}25`} />
      <path d="M6 16a10 10 0 0020 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 26v3M12 29h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FamilyIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="10" cy="9" r="4" stroke={color} strokeWidth="2" fill={`${color}20`} />
      <circle cx="22" cy="9" r="4" stroke={color} strokeWidth="2" fill={`${color}20`} />
      <circle cx="16" cy="20" r="3" stroke={color} strokeWidth="2" fill={`${color}20`} />
      <path d="M4 26a6 6 0 0112 0M16 26a6 6 0 0112 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function VerifiedIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3l3 3h4l1 4 3 2-1 4 1 4-3 2-1 4h-4l-3 3-3-3H8L7 22l-3-2 1-4-1-4 3-2 1-4h4l3-3z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}20`} />
      <path d="M11 16l3 3 7-7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CoinIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill={`${color}20`} />
      <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="1.5" fill={`${color}15`} />
      <path d="M16 10v2M16 20v2M13 13h4a2 2 0 010 4h-2a2 2 0 000 4h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SparkleIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 4v6M16 22v6M4 16h6M22 16h6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 8l4 4M20 20l4 4M8 24l4-4M20 12l4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" fill={color} />
    </svg>
  );
}

export function AdminIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="10" r="5" stroke={color} strokeWidth="2" fill={`${color}20`} />
      <path d="M6 28a10 10 0 0020 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 18l2 2 4-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Ambassador icon
export function AmbassadorIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 2l2 5h5l-4 3 1.5 5L16 12l-4.5 3 1.5-5-4-3h5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}40`} />
      <path d="M8 20h16M10 24h12M12 28h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="9" r="2" fill={color} />
    </svg>
  );
}

// Aristocracy icon
export function AristocracyIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 2l2.5 6 6.5 0.5-5 4.5 1.5 6.5L16 16l-5.5 3.5 1.5-6.5-5-4.5 6.5-0.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}30`} />
      <path d="M8 26h16M10 22h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="10" r="2" fill={color} />
    </svg>
  );
}

// Pen icon for writer badge
export function PenIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M22 4l6 6-16 16H6v-6L22 4z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}25`} />
      <path d="M18 8l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 26h20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Film icon for reels king
export function FilmIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="6" width="26" height="20" rx="2" stroke={color} strokeWidth="2" fill={`${color}20`} />
      <path d="M3 12h26M3 20h26M9 6v6M9 20v6M23 6v6M23 20v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" fill={color} />
    </svg>
  );
}

// Super Admin Image Badge Icon
function SuperAdminImageIcon({ size = 30 }: { size?: number }) {
  return (
    <img
      src={SUPER_ADMIN_BADGE_URL}
      alt="سوبر أدمن"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: "50%",
        filter: "drop-shadow(0 0 8px rgba(255,71,87,0.8))",
      }}
    />
  );
}

// ── Badge Builder ──────────────────────────────────────────────────────────────

export function buildBadges({
  isPro, proLevel, isSuperAdmin, isAdmin, isAgent, isActive,
  wealthLevel, charismaLevel, familyInfo, isBestRoom, isRoomOwner,
  isLuckyBagKing, isGamesKing, hasReelsBadge, hasPostsBadge,
  aristocracyLevel, aristocracyExpiresAt, isSakiAmbassador,
  isMomentsKing, isMomentWriter, isMillionaireTitle, isReelsKing,
}: {
  isPro?: boolean;
  proLevel?: number;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  isAgent?: boolean;
  isActive?: boolean;
  wealthLevel?: number;
  charismaLevel?: number;
  familyInfo?: { name: string; role: string } | null;
  isBestRoom?: boolean;
  isRoomOwner?: boolean;
  isLuckyBagKing?: boolean;
  isGamesKing?: boolean;
  hasReelsBadge?: boolean;
  hasPostsBadge?: boolean;
  aristocracyLevel?: number;
  aristocracyExpiresAt?: number | null;
  isSakiAmbassador?: boolean;
  isMomentsKing?: boolean;
  isMomentWriter?: boolean;
  isMillionaireTitle?: boolean;
  isReelsKing?: boolean;
}): BadgeData[] {
  const badges: BadgeData[] = [];
  const proConfig = getVipConfig(proLevel);

  // ── Aristocracy Badge (highest priority) ──
  const aristoActive = aristocracyLevel && aristocracyLevel > 0 && aristocracyExpiresAt && aristocracyExpiresAt > Date.now();
  if (aristoActive) {
    const aristoCfg = getAristocracyConfig(aristocracyLevel);
    if (aristoCfg) {
      badges.push({
        id: "aristocracy",
        label: aristoCfg.nameAr,
        sublabel: `المستوى ${aristocracyLevel}`,
        tier: "legendary",
        colors: {
          primary: aristoCfg.color,
          secondary: aristoCfg.color,
          glow: aristoCfg.glowColor,
          bg: `linear-gradient(135deg, ${aristoCfg.color}25, ${aristoCfg.color}12)`,
          border: `${aristoCfg.color}70`,
          text: aristoCfg.color,
        },
        icon: <AristocracyIcon color={aristoCfg.color} size={30} />,
        shimmer: true,
      });
    }
  }

  // ── Saki Ambassador Badge ──
  if (isSakiAmbassador) {
    badges.push({
      id: "ambassador",
      label: "سفير ساكي",
      sublabel: "10 دعوات مكتملة",
      tier: "legendary",
      colors: {
        primary: "#ffd700",
        secondary: "#ff8c00",
        glow: "rgba(255,215,0,0.6)",
        bg: "linear-gradient(135deg,rgba(255,215,0,0.25),rgba(255,140,0,0.15))",
        border: "rgba(255,215,0,0.7)",
        text: "#ffd700",
      },
      icon: <AmbassadorIcon color="#ffd700" size={30} />,
      shimmer: true,
    });
  }

  // PRO Badge
  if (isPro && proConfig) {
    const proBadgeUrl = [
      null,
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/MbOLUMQIiNgrPZUy.png",
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/eFWeniGUWrZigXUD.png",
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/EbgsqPFpOeOdjyTs.png",
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/rzKXICCEIboqpTIo.png",
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/OzJlHyrhBOyiYwPC.png"
    ][proLevel ?? 1];

    badges.push({
      id: "pro",
      label: proConfig.name,
      sublabel: `المستوى ${proLevel}`,
      tier: "legendary",
      colors: {
        primary: proConfig.nameColor,
        secondary: proConfig.glowColor,
        glow: proConfig.glowColor,
        bg: `linear-gradient(135deg, ${proConfig.nameColor}20, ${proConfig.glowColor}30)`,
        border: `${proConfig.nameColor}60`,
        text: proConfig.nameColor,
      },
      icon: proBadgeUrl 
        ? <img src={proBadgeUrl} alt={`PRO${proLevel}`} style={{ width: 30, height: 30, objectFit: "contain", background: "transparent" }} />
        : <CrownIcon color={proConfig.nameColor} size={30} />,
      shimmer: true,
    });
  }

  // Super Admin - with real badge image
  if (isSuperAdmin) {
    badges.push({
      id: "superadmin",
      label: "سوبر أدمن",
      sublabel: "مدير النظام",
      tier: "legendary",
      colors: {
        primary: "#ff4757",
        secondary: "#c0392b",
        glow: "rgba(255,71,87,0.7)",
        bg: "linear-gradient(135deg, rgba(255,71,87,0.25), rgba(192,57,43,0.18))",
        border: "rgba(255,71,87,0.7)",
        text: "#ff6b6b",
      },
      icon: <SuperAdminImageIcon size={30} />,
      shimmer: true,
    });
  }

  // Admin
  if (isAdmin && !isSuperAdmin) {
    badges.push({
      id: "admin",
      label: "أدمن",
      sublabel: "مشرف الغرفة",
      tier: "epic",
      colors: {
        primary: "#a78bfa",
        secondary: "#7c3aed",
        glow: "rgba(167,139,250,0.4)",
        bg: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(167,139,250,0.15))",
        border: "rgba(167,139,250,0.5)",
        text: "#a78bfa",
      },
      icon: <AdminIcon color="#a78bfa" size={30} />,
      shimmer: false,
    });
  }

  // Agent
  if (isAgent) {
    badges.push({
      id: "agent",
      label: "وكيل شحن",
      sublabel: "وكيل معتمد",
      tier: "epic",
      colors: {
        primary: "#4ade80",
        secondary: "#16a34a",
        glow: "rgba(74,222,128,0.4)",
        bg: "linear-gradient(135deg, rgba(22,163,74,0.2), rgba(74,222,128,0.15))",
        border: "rgba(74,222,128,0.5)",
        text: "#4ade80",
      },
      icon: <LightningIcon color="#4ade80" size={30} />,
      shimmer: false,
    });
  }

  // Best Room
  if (isBestRoom) {
    badges.push({
      id: "bestroom",
      label: "أفضل غرفة",
      sublabel: "الأكثر نشاطاً",
      tier: "legendary",
      colors: {
        primary: "#fbbf24",
        secondary: "#f59e0b",
        glow: "rgba(251,191,36,0.5)",
        bg: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(251,191,36,0.15))",
        border: "rgba(251,191,36,0.6)",
        text: "#fbbf24",
      },
      icon: <TrophyIcon color="#fbbf24" size={30} />,
      shimmer: true,
    });
  }

  // Room Owner
  if (isRoomOwner) {
    badges.push({
      id: "roomowner",
      label: "مالك غرفة",
      sublabel: "صاحب الغرفة",
      tier: "rare",
      colors: {
        primary: "#60a5fa",
        secondary: "#3b82f6",
        glow: "rgba(96,165,250,0.4)",
        bg: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(96,165,250,0.15))",
        border: "rgba(96,165,250,0.5)",
        text: "#60a5fa",
      },
      icon: <HomeIcon color="#60a5fa" size={30} />,
      shimmer: false,
    });
  }

  // Family
  if (familyInfo) {
    const isOwner = familyInfo.role === "owner";
    badges.push({
      id: "family",
      label: isOwner ? "مضيف العائلة" : "عضو العائلة",
      sublabel: familyInfo.name,
      tier: isOwner ? "epic" : "rare",
      colors: {
        primary: "#f472b6",
        secondary: "#ec4899",
        glow: "rgba(244,114,182,0.4)",
        bg: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(244,114,182,0.15))",
        border: "rgba(244,114,182,0.5)",
        text: "#f472b6",
      },
      icon: <FamilyIcon color="#f472b6" size={30} />,
      shimmer: isOwner,
    });
  }

  // Verified
  if (isActive) {
    badges.push({
      id: "verified",
      label: "موثّق",
      sublabel: "حساب مفعّل",
      tier: "rare",
      colors: {
        primary: "#34d399",
        secondary: "#10b981",
        glow: "rgba(52,211,153,0.4)",
        bg: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.15))",
        border: "rgba(52,211,153,0.5)",
        text: "#34d399",
      },
      icon: <VerifiedIcon color="#34d399" size={30} />,
      shimmer: false,
    });
  }

  // Wealth Level
  if (wealthLevel && wealthLevel > 0) {
    const wc = getLevelColor(wealthLevel);
    badges.push({
      id: "wealth",
      label: `ثروة ${wealthLevel}`,
      sublabel: wc.tier,
      tier: wealthLevel >= 5 ? "legendary" : wealthLevel >= 3 ? "epic" : "rare",
      colors: {
        primary: wc.primary,
        secondary: wc.secondary,
        glow: wc.glow,
        bg: `linear-gradient(135deg, ${wc.primary}20, ${wc.secondary}15)`,
        border: `${wc.primary}50`,
        text: wc.primary,
      },
      icon: <CoinIcon color={wc.primary} size={30} />,
      shimmer: wealthLevel >= 5,
    });
  }

  // Charisma Level
  if (charismaLevel && charismaLevel > 0) {
    const cc = getLevelColor(charismaLevel);
    badges.push({
      id: "charisma",
      label: `كاريزما ${charismaLevel}`,
      sublabel: cc.tier,
      tier: charismaLevel >= 5 ? "legendary" : charismaLevel >= 3 ? "epic" : "rare",
      colors: {
        primary: cc.primary,
        secondary: cc.secondary,
        glow: cc.glow,
        bg: `linear-gradient(135deg, ${cc.primary}20, ${cc.secondary}15)`,
        border: `${cc.primary}50`,
        text: cc.primary,
      },
      icon: <SparkleIcon color={cc.primary} size={30} />,
      shimmer: charismaLevel >= 5,
    });
  }

  if (isLuckyBagKing) badges.push({ id:"luckybag_king", label:"ملك الحظ", sublabel:"صناديق الحظ", tier:"legendary" as const, colors:{ primary:"#dc2626", secondary:"#991b1b", glow:"rgba(220,38,38,0.5)", bg:"linear-gradient(135deg,rgba(220,38,38,0.2),rgba(251,191,36,0.15))", border:"rgba(220,38,38,0.6)", text:"#fca5a5" }, icon:<TrophyIcon color="#dc2626" size={30}/>, shimmer:true });
  if (isGamesKing) badges.push({ id:"games_king", label:"ملك الألعاب", sublabel:"100M ألعاب", tier:"legendary" as const, colors:{ primary:"#8b5cf6", secondary:"#6d28d9", glow:"rgba(139,92,246,0.6)", bg:"linear-gradient(135deg,rgba(109,40,217,0.25),rgba(139,92,246,0.15))", border:"rgba(139,92,246,0.6)", text:"#c4b5fd" }, icon:<CrownIcon color="#8b5cf6" size={30}/>, shimmer:true });
  if (hasReelsBadge) badges.push({ id:"reels", label:"نجم الريلز", sublabel:"صانع محتوى", tier:"epic" as const, colors:{ primary:"#f97316", secondary:"#ea580c", glow:"rgba(249,115,22,0.4)", bg:"linear-gradient(135deg,rgba(234,88,12,0.2),rgba(249,115,22,0.12))", border:"rgba(249,115,22,0.5)", text:"#fdba74" }, icon:<StarIcon color="#f97316" size={30}/>, shimmer:false });
  if (hasPostsBadge) badges.push({ id:"posts", label:"كاتب نشط", sublabel:"10 إجابات", tier:"rare" as const, colors:{ primary:"#10b981", secondary:"#059669", glow:"rgba(16,185,129,0.4)", bg:"linear-gradient(135deg,rgba(5,150,105,0.2),rgba(16,185,129,0.12))", border:"rgba(16,185,129,0.5)", text:"#6ee7b7" }, icon:<VerifiedIcon color="#10b981" size={30}/>, shimmer:false });

  // ── الألقاب الجديدة اللامعة ──
  if (isMomentsKing) badges.push({
    id: "moments_king", label: "ملك اللحظات", sublabel: "100 إعجاب",
    tier: "legendary" as const,
    colors: { primary: "#f43f5e", secondary: "#be123c", glow: "rgba(244,63,94,0.75)", bg: "linear-gradient(135deg,rgba(244,63,94,0.28),rgba(251,113,133,0.18))", border: "rgba(244,63,94,0.75)", text: "#fda4af" },
    icon: <HeartIcon color="#f43f5e" size={30} />, shimmer: true,
  });
  if (isMillionaireTitle) badges.push({
    id: "millionaire", label: "المليونير", sublabel: "100M عملة ذهبية",
    tier: "legendary" as const,
    colors: { primary: "#eab308", secondary: "#a16207", glow: "rgba(234,179,8,0.9)", bg: "linear-gradient(135deg,rgba(234,179,8,0.32),rgba(251,191,36,0.22))", border: "rgba(234,179,8,0.9)", text: "#fef08a" },
    icon: <CoinIcon color="#eab308" size={30} />, shimmer: true,
  });
  if (isMomentWriter) badges.push({
    id: "moment_writer", label: "كاتب منشور", sublabel: "100 منشور",
    tier: "legendary" as const,
    colors: { primary: "#06b6d4", secondary: "#0e7490", glow: "rgba(6,182,212,0.75)", bg: "linear-gradient(135deg,rgba(6,182,212,0.28),rgba(103,232,249,0.18))", border: "rgba(6,182,212,0.75)", text: "#a5f3fc" },
    icon: <PenIcon color="#06b6d4" size={30} />, shimmer: true,
  });
  if (isReelsKing) badges.push({
    id: "reels_king", label: "ملك الريلز", sublabel: "100 إعجاب ريلز",
    tier: "legendary" as const,
    colors: { primary: "#a855f7", secondary: "#7e22ce", glow: "rgba(168,85,247,0.9)", bg: "linear-gradient(135deg,rgba(168,85,247,0.32),rgba(216,180,254,0.18))", border: "rgba(168,85,247,0.9)", text: "#e9d5ff" },
    icon: <FilmIcon color="#a855f7" size={30} />, shimmer: true,
  });

  // Broadcaster
  badges.push({
    id: "broadcaster",
    label: "مذيع",
    sublabel: "يبث في الغرف",
    tier: "common",
    colors: {
      primary: "#818cf8",
      secondary: "#6366f1",
      glow: "rgba(129,140,248,0.3)",
      bg: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.1))",
      border: "rgba(129,140,248,0.35)",
      text: "#818cf8",
    },
    icon: <MicIcon color="#818cf8" size={30} />,
    shimmer: false,
  });

  return badges;
}

// ── InlineBadge (compact inline display) ──────────────────────────────────────
export function InlineBadge({ badge }: { badge: BadgeData }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
      style={{
        background: badge.colors.bg,
        border: `1px solid ${badge.colors.border}`,
        color: badge.colors.text,
        boxShadow: `0 0 6px ${badge.colors.glow}`,
      }}
    >
      {badge.label}
    </span>
  );
}

// ── Badge Card Component ───────────────────────────────────────────────────────

export function BadgeCard({ badge, size = "md" }: { badge: BadgeData; size?: "sm" | "md" | "lg" }) {
  const isLg = size === "lg";
  const isSm = size === "sm";

  return (
    <div
      className="relative rounded-2xl flex flex-col items-center overflow-hidden transition-all active:scale-95"
      style={{
        background: badge.colors.bg,
        border: `1px solid ${badge.colors.border}`,
        boxShadow: `0 0 ${isLg ? 25 : 15}px ${badge.colors.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        padding: isLg ? "20px 12px" : isSm ? "10px 8px" : "14px 10px",
        gap: isLg ? 10 : 6,
      }}
    >
      {/* Shimmer overlay */}
      {badge.shimmer && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: "badge-shimmer 2.5s ease-in-out infinite",
          }}
        />
      )}

      {/* Icon */}
      <div style={{ filter: `drop-shadow(0 0 ${isLg ? 8 : 5}px ${badge.colors.glow})` }}>
        {badge.icon}
      </div>

      {/* Text */}
      <div className="text-center" style={{ gap: 2 }}>
        <div
          className="font-black leading-tight"
          style={{
            fontSize: isLg ? 13 : isSm ? 9 : 11,
            color: badge.colors.text,
            textShadow: `0 0 8px ${badge.colors.glow}`,
          }}
        >
          {badge.label}
        </div>
        <div
          className="leading-tight"
          style={{
            fontSize: isLg ? 10 : isSm ? 7 : 9,
            color: `${badge.colors.text}80`,
            marginTop: 1,
          }}
        >
          {badge.sublabel}
        </div>
      </div>

      {/* Tier indicator */}
      {badge.tier === "legendary" && (
        <div
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: badge.colors.primary, boxShadow: `0 0 4px ${badge.colors.glow}` }}
        />
      )}

      <style>{`
        @keyframes badge-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
