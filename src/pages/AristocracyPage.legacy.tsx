// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import AristocracyBuySheet from "./aristocracy/AristocracyBuySheet";
import AristocracyGiftModal from "./aristocracy/AristocracyGiftModal";

interface AristocracyPageProps {
  onBack: () => void;
  onAdminAristocracy?: () => void;
}

const DURATION_OPTIONS = [
  { days: 30, label: "30 يوم" },
  { days: 90, label: "90 يوم" },
  { days: 365, label: "365 يوم" },
];

function formatPrice(p: number) {
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K`;
  return p.toLocaleString();
}

// SVG Icons (no emoji)
function IconCoin({ size = 18, color = "#fbbf24" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7" fill={color} opacity="0.25" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>$</text>
    </svg>
  );
}

function IconStar({ size = 18, color = "#fbbf24" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function IconShield({ size = 18, color = "#60a5fa" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

function IconCrown({ size = 18, color = "#fbbf24" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M2 19h20v2H2zM2 17l4-10 6 6 4-8 4 8-2 4H2z" />
    </svg>
  );
}

function IconGift({ size = 18, color = "#f472b6" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function IconCheck({ size = 16, color = "#22c55e" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconChevronRight({ size = 20, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconCalendar({ size = 16, color = "#a78bfa" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconAdmin({ size = 16, color = "#a78bfa" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

// Badge component using uploaded image or fallback SVG
function RankBadge({ level, badgeUrl, color, glowColor, size = 100 }: {
  level: number; badgeUrl?: string; color: string; glowColor: string; size?: number;
}) {
  if (badgeUrl) {
    return (
      <div
        style={{
          width: size, height: size,
          filter: `drop-shadow(0 0 ${size * 0.25}px ${glowColor}) drop-shadow(0 4px 8px rgba(0,0,0,0.8))`,
        }}
      >
        <img
          src={badgeUrl}
          alt={`rank-${level}`}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    );
  }
  // Fallback SVG badge
  return <FallbackBadge level={level} color={color} glowColor={glowColor} size={size} />;
}

function FallbackBadge({ level, color, glowColor, size }: { level: number; color: string; glowColor: string; size: number }) {
  const shapes = [
    // Shield
    <path key="s" d="M50 8 L82 22 L82 52 Q82 75 50 92 Q18 75 18 52 L18 22 Z" fill={`url(#fg${level})`} />,
    // Hexagon
    <polygon key="s" points="50,8 85,28 85,72 50,92 15,72 15,28" fill={`url(#fg${level})`} />,
    // Circle
    <circle key="s" cx="50" cy="50" r="42" fill={`url(#fg${level})`} />,
    // Crown shape
    <path key="s" d="M15 65 L15 40 L30 55 L50 20 L70 55 L85 40 L85 65 Z" fill={`url(#fg${level})`} />,
    // Star
    <polygon key="s" points="50,8 61,35 90,35 67,54 76,82 50,65 24,82 33,54 10,35 39,35" fill={`url(#fg${level})`} />,
    // Crown with base
    <path key="s" d="M12 68 L12 42 L28 58 L50 18 L72 58 L88 42 L88 68 Z" fill={`url(#fg${level})`} />,
    // Imperial crown
    <path key="s" d="M10 70 L10 40 L26 58 L50 12 L74 58 L90 40 L90 70 Z" fill={`url(#fg${level})`} />,
    // Empress crown
    <path key="s" d="M10 70 L10 40 L26 58 L50 12 L74 58 L90 40 L90 70 Z" fill={`url(#fg${level})`} />,
  ];
  const idx = Math.min(level - 1, shapes.length - 1);
  const c1 = color;
  const c2 = color + "99";

  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ filter: `drop-shadow(0 0 ${size * 0.2}px ${glowColor}) drop-shadow(0 4px 8px rgba(0,0,0,0.8))` }}
    >
      <defs>
        <linearGradient id={`fg${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} stopOpacity="1" />
        </linearGradient>
      </defs>
      {shapes[idx]}
      <circle cx="50" cy="50" r="14" fill="rgba(255,255,255,0.15)" />
      <text x="50" y="56" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" opacity="0.9">{level}</text>
    </svg>
  );
}

// Rank name with gradient animation
function RankNameDisplay({ name, color, gradient, glowColor, size = "base" }: {
  name: string; color: string; gradient?: string; glowColor: string; size?: "sm" | "base" | "lg" | "xl";
}) {
  const sizeClass = size === "xl" ? "text-3xl" : size === "lg" ? "text-2xl" : size === "sm" ? "text-xs" : "text-base";
  return (
    <span
      className={`font-black ${sizeClass}`}
      style={{
        background: gradient || `linear-gradient(135deg, ${color}, ${color}cc)`,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "shimmer-flow 3s linear infinite",
        filter: `drop-shadow(0 0 6px ${glowColor})`,
      }}
    >
      {name}
    </span>
  );
}

// Feature icon mapping using SVG
function FeatureIcon({ icon, color }: { icon: string; color: string }) {
  // Map common feature types to SVG icons
  const iconMap: Record<string, JSX.Element> = {
    "badge": <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={color} />,
    "coin": <><circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" /><text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>$</text></>,
    "name": <><rect x="3" y="6" width="18" height="3" rx="1.5" fill={color} /><rect x="3" y="11" width="14" height="3" rx="1.5" fill={color} opacity="0.7" /><rect x="3" y="16" width="10" height="3" rx="1.5" fill={color} opacity="0.5" /></>,
    "door": <><rect x="5" y="2" width="14" height="20" rx="2" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" /><circle cx="15" cy="12" r="1.5" fill={color} /></>,
    "chat": <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" /></>,
    "lock": <><rect x="5" y="11" width="14" height="10" rx="2" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" /><path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="1.5" fill="none" /></>,
    "mic": <><rect x="9" y="2" width="6" height="12" rx="3" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" /><path d="M5 10a7 7 0 0014 0" stroke={color} strokeWidth="1.5" fill="none" /><line x1="12" y1="17" x2="12" y2="22" stroke={color} strokeWidth="1.5" /></>,
    "home": <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" /></>,
    "shield": <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" /></>,
    "trophy": <><path d="M6 9H4a2 2 0 000 4h2" stroke={color} strokeWidth="1.5" fill="none" /><path d="M18 9h2a2 2 0 010 4h-2" stroke={color} strokeWidth="1.5" fill="none" /><path d="M6 9V4h12v5a6 6 0 01-12 0z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" /><line x1="12" y1="15" x2="12" y2="19" stroke={color} strokeWidth="1.5" /><line x1="8" y1="19" x2="16" y2="19" stroke={color} strokeWidth="1.5" /></>,
    "star": <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={color} />,
    "id": <><rect x="2" y="5" width="20" height="14" rx="2" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" /><circle cx="8" cy="12" r="2" fill={color} /><line x1="13" y1="10" x2="19" y2="10" stroke={color} strokeWidth="1.5" /><line x1="13" y1="14" x2="17" y2="14" stroke={color} strokeWidth="1.5" /></>,
    "gif": <><rect x="2" y="4" width="20" height="16" rx="2" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" /><path d="M8 12h4v2H8v-4h5" stroke={color} strokeWidth="1.5" fill="none" /><line x1="15" y1="10" x2="15" y2="14" stroke={color} strokeWidth="1.5" /></>,
    "search": <><circle cx="11" cy="11" r="7" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" /><line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="1.5" /></>,
    "unlock": <><rect x="5" y="11" width="14" height="10" rx="2" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" /><path d="M8 11V7a4 4 0 017.43-2" stroke={color} strokeWidth="1.5" fill="none" /></>,
    "sparkle": <><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" fill={color} /></>,
  };

  // Try to detect icon type from the emoji/text
  const getIconType = (ic: string): string => {
    if (ic.includes("🛡") || ic.includes("shield")) return "shield";
    if (ic.includes("🪙") || ic.includes("coin")) return "coin";
    if (ic.includes("🎨") || ic.includes("name")) return "name";
    if (ic.includes("🚪") || ic.includes("door")) return "door";
    if (ic.includes("💬") || ic.includes("chat")) return "chat";
    if (ic.includes("🔒") || ic.includes("lock")) return "lock";
    if (ic.includes("📢") || ic.includes("mic")) return "mic";
    if (ic.includes("🏠") || ic.includes("home")) return "home";
    if (ic.includes("🏆") || ic.includes("trophy")) return "trophy";
    if (ic.includes("⭐") || ic.includes("🌟") || ic.includes("star")) return "star";
    if (ic.includes("🆔") || ic.includes("id")) return "id";
    if (ic.includes("🎭") || ic.includes("gif")) return "gif";
    if (ic.includes("🔍") || ic.includes("search")) return "search";
    if (ic.includes("🔓") || ic.includes("unlock")) return "unlock";
    if (ic.includes("✨") || ic.includes("sparkle")) return "sparkle";
    if (ic.includes("👑") || ic.includes("crown")) return "badge";
    if (ic.includes("🔱") || ic.includes("🌹") || ic.includes("⚔")) return "badge";
    return "star";
  };

  const type = getIconType(icon);
  const paths = iconMap[type] || iconMap["star"];

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {paths}
    </svg>
  );
}

export default function AristocracyPage({ onBack, onAdminAristocracy }: AristocracyPageProps) {
  const status = useQuery(api.aristocracy.getAristocracyStatus);
  const myProfile = useQuery(api.profiles.getMyProfile);
  const dbLevels = useQuery(api.aristocracyAdmin.getAllAristocracyLevels);
  const purchase = useMutation(api.aristocracy.purchaseAristocracy);
  const gift = useMutation(api.aristocracy.giftAristocracy);
  const claimDaily = useMutation(api.aristocracyExtra.claimAristocracyDailyReward);

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [buying, setBuying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showBuySheet, setShowBuySheet] = useState(false);
  const [badgeAnim, setBadgeAnim] = useState(false);

  // Only show levels that have been added by admin
  const availableLevels = (dbLevels ?? []).filter(
    (l) => l.name && (l.price30 || l.price90 || l.price365)
  );

  // Auto-select first available level
  useEffect(() => {
    if (availableLevels.length > 0 && selectedLevel === null) {
      setSelectedLevel(availableLevels[0].level);
    }
  }, [availableLevels.length]);

  useEffect(() => {
    setBadgeAnim(false);
    const t = setTimeout(() => setBadgeAnim(true), 50);
    return () => clearTimeout(t);
  }, [selectedLevel]);

  const selectedDbLevel = availableLevels.find((l) => l.level === selectedLevel);

  // Build rank object from DB level
  const buildRankFromDb = (dbLevel: any) => {
    const colorMap: Record<number, { color: string; gradient: string; glowColor: string; bgGradient: string }> = {
      1: { color: "#60a5fa", gradient: "linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)", glowColor: "rgba(96,165,250,0.8)", bgGradient: "linear-gradient(160deg, #001a3a 0%, #002d5c 50%, #001a3a 100%)" },
      2: { color: "#34d399", gradient: "linear-gradient(135deg, #059669, #34d399, #6ee7b7)", glowColor: "rgba(52,211,153,0.8)", bgGradient: "linear-gradient(160deg, #001a10 0%, #002d1a 50%, #001a10 100%)" },
      3: { color: "#f472b6", gradient: "linear-gradient(135deg, #db2777, #f472b6, #fbcfe8)", glowColor: "rgba(244,114,182,0.9)", bgGradient: "linear-gradient(160deg, #1a0010 0%, #2d001a 50%, #1a0010 100%)" },
      4: { color: "#a78bfa", gradient: "linear-gradient(135deg, #7c3aed, #a78bfa, #c4b5fd)", glowColor: "rgba(167,139,250,1)", bgGradient: "linear-gradient(160deg, #0d0020 0%, #1a0035 50%, #0d0020 100%)" },
      5: { color: "#fbbf24", gradient: "linear-gradient(135deg, #d97706, #fbbf24, #fde68a)", glowColor: "rgba(251,191,36,1)", bgGradient: "linear-gradient(160deg, #1a1000 0%, #2d2000 50%, #1a1000 100%)" },
      6: { color: "#f97316", gradient: "linear-gradient(135deg, #ea580c, #f97316, #fb923c, #fbbf24)", glowColor: "rgba(249,115,22,1)", bgGradient: "linear-gradient(160deg, #1a0800 0%, #2d1200 50%, #1a0800 100%)" },
      7: { color: "#ffd700", gradient: "linear-gradient(135deg, #ff8c00, #ffd700, #ff6347, #ffd700, #ff8c00)", glowColor: "rgba(255,215,0,1)", bgGradient: "linear-gradient(160deg, #1a0f00 0%, #2d1a00 30%, #1a0f00 60%, #ffd70010 100%)" },
      8: { color: "#f0abfc", gradient: "linear-gradient(135deg, #c026d3, #e879f9, #f0abfc, #e879f9, #c026d3)", glowColor: "rgba(240,171,252,1)", bgGradient: "linear-gradient(160deg, #1a0020 0%, #2d0040 30%, #1a0020 60%, #f0abfc10 100%)" },
    };
    const theme = colorMap[dbLevel.level] || colorMap[1];
    return {
      level: dbLevel.level,
      nameAr: dbLevel.name,
      name: dbLevel.name,
      color: theme.color,
      gradient: theme.gradient,
      glowColor: theme.glowColor,
      bgGradient: theme.bgGradient,
      price30: dbLevel.price30 ?? 0,
      price90: dbLevel.price90 ?? 0,
      price365: dbLevel.price365 ?? 0,
      dailyCoins: dbLevel.dailyCoins ?? 0,
      features: dbLevel.features ?? [],
      badgeUrl: dbLevel.badgeUrl,
      frameUrl: dbLevel.frameUrl,
      chatBubbleUrl: dbLevel.chatBubbleUrl,
      entryEffectUrl: dbLevel.entryEffectUrl,
      heartUrl: dbLevel.heartUrl,
    };
  };

  const selectedRank = selectedDbLevel ? buildRankFromDb(selectedDbLevel) : null;
  const price = selectedRank
    ? (selectedDuration === 30 ? selectedRank.price30 : selectedDuration === 90 ? selectedRank.price90 : selectedRank.price365)
    : 0;

  const handleBuy = async () => {
    if (buying || !selectedRank) return;
    setBuying(true);
    try {
      const result = await purchase({ level: selectedRank.level, durationDays: selectedDuration });
      toast.success(`تهانينا! أصبحت ${result.rank.nameAr} لمدة ${result.daysLeft} يوم!`);
      setShowBuySheet(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBuying(false);
    }
  };

  const handleClaimDaily = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await claimDaily();
      toast.success(`تم استلام ${result.coins.toLocaleString()} عملة!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClaiming(false);
    }
  };

  const isMyRank = status?.isActive && status.rank?.level === selectedRank?.level;
  const daysLeft = isMyRank && status?.expiresAt
    ? Math.max(0, Math.ceil((status.expiresAt - Date.now()) / 86400000))
    : 0;

  const bgGradient = selectedRank?.bgGradient || "linear-gradient(160deg, #0f0f1a 0%, #1a1a2e 100%)";

  // Loading state
  if (dbLevels === undefined) {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center" style={{ background: "#0f0f1a" }}>
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No levels added yet
  if (availableLevels.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-h-0 relative" dir="rtl" style={{ background: "#0f0f1a" }}>
        <div className="sticky top-0 z-40" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center active:scale-90 transition-transform">
              <IconChevronRight />
            </button>
            <span className="text-white font-black text-base" style={{ background: "linear-gradient(90deg,#f1d382,#d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              نظام الأرستقراطية
            </span>
            {myProfile?.isSuperAdmin && onAdminAristocracy ? (
              <button onClick={onAdminAristocracy} className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform" style={{ background: "rgba(108,92,231,0.2)", border: "1px solid rgba(108,92,231,0.4)" }}>
                <IconAdmin />
              </button>
            ) : <div className="w-9 h-9" />}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <IconCrown size={40} color="#666" />
          </div>
          <p className="text-gray-500 text-sm text-center">لم تُضف أي رتب بعد</p>
          {myProfile?.isSuperAdmin && onAdminAristocracy && (
            <button onClick={onAdminAristocracy} className="px-6 py-3 rounded-2xl text-white text-sm font-bold" style={{ background: "rgba(108,92,231,0.3)", border: "1px solid rgba(108,92,231,0.5)" }}>
              إضافة رتبة
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0 relative"
      dir="rtl"
      style={{ background: bgGradient, fontFamily: "'Tajawal', sans-serif", transition: "background 0.6s ease" }}
    >
      {/* ── Header ── */}
      <div className="sticky top-0 z-40" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center active:scale-90 transition-transform">
            <IconChevronRight />
          </button>
          <span className="text-white font-black text-base" style={{ background: "linear-gradient(90deg,#f1d382,#d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            نظام الأرستقراطية
          </span>
          {myProfile?.isSuperAdmin && onAdminAristocracy ? (
            <button onClick={onAdminAristocracy} className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform" style={{ background: "rgba(108,92,231,0.2)", border: "1px solid rgba(108,92,231,0.4)" }}>
              <IconAdmin />
            </button>
          ) : <div className="w-9 h-9" />}
        </div>

        {/* Rank tabs */}
        <div className="flex overflow-x-auto px-4 pb-3 gap-3" style={{ scrollbarWidth: "none" }}>
          {availableLevels.map((dbLevel) => {
            const rank = buildRankFromDb(dbLevel);
            const isSelected = selectedLevel === rank.level;
            return (
              <button
                key={rank.level}
                onClick={() => setSelectedLevel(rank.level)}
                className="flex-shrink-0 pb-1.5 transition-all relative flex flex-col items-center gap-1"
                style={{ minWidth: 56 }}
              >
                {/* Mini badge */}
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center transition-all"
                  style={{
                    width: 40, height: 40,
                    background: isSelected ? `${rank.color}20` : "rgba(255,255,255,0.05)",
                    border: isSelected ? `1.5px solid ${rank.color}60` : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isSelected ? `0 0 12px ${rank.glowColor}40` : "none",
                    transform: isSelected ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <RankBadge level={rank.level} badgeUrl={rank.badgeUrl} color={rank.color} glowColor={rank.glowColor} size={32} />
                </div>
                <span
                  className="text-[9px] font-bold"
                  style={{ color: isSelected ? rank.color : "#555", transition: "color 0.3s" }}
                >
                  {rank.nameAr}
                </span>
                {isSelected && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ background: rank.color }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      {selectedRank && (
        <div className="flex-1 overflow-y-auto pb-36">

          {/* ── Hero Section ── */}
          <div
            className="relative text-center px-6 pt-10 pb-8 overflow-hidden"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${selectedRank.color}22 0%, transparent 70%)` }}
          >
            {/* Glow rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{ width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${selectedRank.glowColor}15 0%, transparent 70%)`, animation: "badge-pulse 3s ease-in-out infinite" }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{ width: 160, height: 160, borderRadius: "50%", border: `1px solid ${selectedRank.color}20`, animation: "ring-expand 3s ease-in-out infinite" }} />
            </div>

            {/* Badge */}
            <div
              className="relative mx-auto mb-5 flex items-center justify-center"
              style={{
                width: 120, height: 120,
                transform: badgeAnim ? "scale(1) rotateY(0deg)" : "scale(0.7) rotateY(-30deg)",
                transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <RankBadge
                level={selectedRank.level}
                badgeUrl={selectedRank.badgeUrl}
                color={selectedRank.color}
                glowColor={selectedRank.glowColor}
                size={120}
              />
            </div>

            {/* Rank name */}
            <div className="mb-2">
              <RankNameDisplay
                name={selectedRank.nameAr}
                color={selectedRank.color}
                gradient={selectedRank.gradient}
                glowColor={selectedRank.glowColor}
                size="xl"
              />
            </div>

            {/* Level + daily coins badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-3"
              style={{ background: `${selectedRank.color}20`, border: `1px solid ${selectedRank.color}40`, color: selectedRank.color }}
            >
              <IconStar size={12} color={selectedRank.color} />
              <span>المستوى {selectedRank.level}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <IconCoin size={12} color="#fbbf24" />
              <span>+{selectedRank.dailyCoins.toLocaleString()} يومياً</span>
            </div>

            {/* Active status */}
            {isMyRank && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                  style={{ background: `${selectedRank.color}20`, border: `1px solid ${selectedRank.color}50`, color: selectedRank.color }}
                >
                  <IconCheck size={14} color={selectedRank.color} />
                  <span>رتبتك الحالية</span>
                  <span style={{ opacity: 0.6 }}>·</span>
                  <IconCalendar size={12} color={selectedRank.color} />
                  <span>{daysLeft} يوم متبقية</span>
                </div>
                <button
                  onClick={handleClaimDaily}
                  disabled={claiming}
                  className="px-3 py-2 rounded-full text-black text-xs font-black disabled:opacity-50 active:scale-95 transition-transform flex items-center gap-1"
                  style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
                >
                  <IconGift size={14} color="#000" />
                  {claiming ? "..." : "استلم"}
                </button>
              </div>
            )}

            {/* My active rank indicator (different rank) */}
            {status?.isActive && !isMyRank && status.rank && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mt-2"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#888" }}
              >
                <span>رتبتك الحالية:</span>
                <span style={{ color: "#fff", fontWeight: "bold" }}>{status.rank.nameAr}</span>
              </div>
            )}
          </div>

          {/* ── Assets Preview (frame, entry, bubble) ── */}
          {(selectedRank.frameUrl || selectedRank.entryEffectUrl || selectedRank.chatBubbleUrl || selectedRank.heartUrl) && (
            <div className="px-4 mb-6">
              <SectionTitle color={selectedRank.color} title="الأصول الحصرية" />
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {selectedRank.frameUrl && (
                  <AssetCard label="الإطار" url={selectedRank.frameUrl} color={selectedRank.color} />
                )}
                {selectedRank.entryEffectUrl && (
                  <AssetCard label="تأثير الدخول" url={selectedRank.entryEffectUrl} color={selectedRank.color} isVideo />
                )}
                {selectedRank.chatBubbleUrl && (
                  <AssetCard label="فقاعة الدردشة" url={selectedRank.chatBubbleUrl} color={selectedRank.color} />
                )}
                {selectedRank.heartUrl && (
                  <AssetCard label="القلب" url={selectedRank.heartUrl} color={selectedRank.color} />
                )}
              </div>
            </div>
          )}

          {/* ── Features ── */}
          {selectedRank.features.length > 0 && (
            <div className="px-4 mb-6">
              <SectionTitle color={selectedRank.color} title="المميزات الحصرية" />
              <div className="grid grid-cols-2 gap-2.5">
                {selectedRank.features.map((f: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-2xl p-3.5 flex items-start gap-3 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${selectedRank.color}12, ${selectedRank.color}06)`,
                      border: `1px solid ${selectedRank.color}25`,
                    }}
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${selectedRank.color}15, transparent)` }} />
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${selectedRank.color}30, ${selectedRank.color}15)`,
                        border: `1px solid ${selectedRank.color}40`,
                        boxShadow: `0 2px 8px ${selectedRank.glowColor}30`,
                      }}
                    >
                      <FeatureIcon icon={f.icon} color={selectedRank.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold leading-tight">{f.title}</p>
                      <p className="text-[10px] mt-0.5 leading-tight" style={{ color: `${selectedRank.color}99` }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pricing ── */}
          <div className="px-4 mb-4">
            <SectionTitle color={selectedRank.color} title="الأسعار" />
            <div className="grid grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const p = opt.days === 30 ? selectedRank.price30 : opt.days === 90 ? selectedRank.price90 : selectedRank.price365;
                if (!p) return null;
                const isSelected = selectedDuration === opt.days;
                return (
                  <button
                    key={opt.days}
                    onClick={() => setSelectedDuration(opt.days)}
                    className="rounded-2xl p-3 text-center transition-all active:scale-95"
                    style={isSelected
                      ? { background: `${selectedRank.color}25`, border: `1.5px solid ${selectedRank.color}60`, boxShadow: `0 0 12px ${selectedRank.glowColor}30` }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <IconCalendar size={11} color={isSelected ? selectedRank.color : "#555"} />
                      <span className="text-xs font-bold" style={{ color: isSelected ? selectedRank.color : "#666" }}>{opt.label}</span>
                    </div>
                    <div className="text-sm font-black" style={{ color: isSelected ? "#fff" : "#888" }}>{formatPrice(p)}</div>
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      <IconCoin size={10} color="#fbbf24" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Compare Ranks ── */}
          {availableLevels.length > 1 && (
            <div className="px-4 mb-4">
              <SectionTitle color={selectedRank.color} title="مقارنة الرتب" />
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {availableLevels.map((dbLevel) => {
                  const rank = buildRankFromDb(dbLevel);
                  const isSelected = selectedLevel === rank.level;
                  return (
                    <button
                      key={rank.level}
                      onClick={() => setSelectedLevel(rank.level)}
                      className="flex-shrink-0 rounded-2xl p-3 text-center transition-all active:scale-95 flex flex-col items-center gap-1.5"
                      style={{
                        width: 76,
                        background: isSelected ? `${rank.color}20` : "rgba(255,255,255,0.04)",
                        border: isSelected ? `1.5px solid ${rank.color}60` : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: isSelected ? `0 0 14px ${rank.glowColor}30` : "none",
                      }}
                    >
                      <div style={{ width: 40, height: 40 }}>
                        <RankBadge level={rank.level} badgeUrl={rank.badgeUrl} color={rank.color} glowColor={rank.glowColor} size={40} />
                      </div>
                      <p className="text-[9px] font-bold" style={{ color: isSelected ? rank.color : "#555" }}>
                        {rank.nameAr}
                      </p>
                      <p className="text-[8px]" style={{ color: "#555" }}>
                        {formatPrice(rank.price30)}
                      </p>
                      {status?.isActive && status.rank?.level === rank.level && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: rank.color }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Bar ── */}
      {selectedRank && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-4 py-4 flex items-center gap-3"
          style={{
            background: "rgba(0,0,0,0.95)", backdropFilter: "blur(12px)",
            borderTop: `1px solid ${selectedRank.color}20`, maxWidth: 480, margin: "0 auto",
          }}
        >
          <button
            onClick={() => setShowBuySheet(true)}
            className="flex-1 py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-transform text-black flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${selectedRank.color}, ${selectedRank.color}cc)`,
              boxShadow: `0 4px 20px ${selectedRank.glowColor}50`,
            }}
          >
            <IconCrown size={16} color="#000" />
            <span>شحن الآن · {formatPrice(price)}</span>
            <IconCoin size={14} color="#000" />
          </button>
          <button
            onClick={() => setShowGiftModal(true)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${selectedRank.color}30` }}
          >
            <IconGift size={20} color={selectedRank.color} />
          </button>
        </div>
      )}

      {/* ── Buy Sheet ── */}
      {showBuySheet && selectedRank && (
        <AristocracyBuySheet
          rank={selectedRank}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          price={price}
          status={status}
          buying={buying}
          onBuy={handleBuy}
          onClose={() => setShowBuySheet(false)}
        />
      )}

      {/* ── Gift Modal ── */}
      {showGiftModal && selectedRank && (
        <AristocracyGiftModal
          rank={selectedRank}
          duration={selectedDuration}
          price={price}
          onClose={() => setShowGiftModal(false)}
          onGift={gift}
        />
      )}

      <style>{`
        @keyframes shimmer-flow { 0%{background-position:0% center} 100%{background-position:200% center} }
        @keyframes badge-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.85;transform:scale(1.04)} }
        @keyframes ring-expand { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.15);opacity:0.15} }
      `}</style>
    </div>
  );
}

function SectionTitle({ color, title }: { color: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
      <span className="text-xs font-bold" style={{ color }}>{title}</span>
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
    </div>
  );
}

function AssetCard({ label, url, color, isVideo = false }: { label: string; url: string; color: string; isVideo?: boolean }) {
  const isVid = isVideo || url.includes(".mp4") || url.includes(".webm");
  return (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden flex flex-col items-center gap-2 p-2"
      style={{ width: 90, background: `${color}10`, border: `1px solid ${color}25` }}
    >
      <div className="w-full rounded-xl overflow-hidden" style={{ height: 70 }}>
        {isVid ? (
          <video src={url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
        ) : (
          <img src={url} alt={label} className="w-full h-full object-contain" />
        )}
      </div>
      <span className="text-[9px] font-bold" style={{ color }}>{label}</span>
    </div>
  );
}
