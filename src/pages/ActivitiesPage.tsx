import { useState } from "react";
import React from "react";
import GreedyCatGame from "./GreedyCatGame";
import SpinWheelGame from "./SpinWheelGame";
import SlotsGame from "./SlotsGame";
import Lucky77Game from "./Lucky77Game";
import CardBattleGame from "./CardBattleGame";
import RouletteStandaloneGame from "../components/RouletteStandaloneGame";
import FruitPartyGame from "./FruitPartyGame";
import WeeklyStarPage from "./WeeklyStarPage";

interface ActivitiesPageProps {
  onBack: () => void;
}

function IconFruitParty({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="13" r="8" fill="#4ade80" opacity="0.9"/>
      <path d="M9 15c0 1.7 1.3 3 3 3s3-1.3 3-3" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="12" r="1" fill="#14532d"/>
      <circle cx="14" cy="12" r="1" fill="#14532d"/>
      <path d="M12 5v4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 6l2 3 2-3" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconRoulette({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="9" stroke="#f87171" strokeWidth="1.5" fill="rgba(220,38,38,0.2)"/>
      <circle cx="12" cy="12" r="3" fill="#dc2626"/>
      <line x1="12" y1="3" x2="12" y2="6" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="18" x2="12" y2="21" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="12" x2="6" y2="12" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="12" x2="21" y2="12" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="5.6" y1="5.6" x2="7.8" y2="7.8" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="16.2" y1="16.2" x2="18.4" y2="18.4" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="5.6" y1="18.4" x2="7.8" y2="16.2" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="16.2" y1="7.8" x2="18.4" y2="5.6" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconGreedyCat({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <path d="M5 11c0-3.9 3.1-7 7-7s7 3.1 7 7v3c0 2.2-1.8 4-4 4H9c-2.2 0-4-1.8-4-4v-3z" fill="#ff6b35" opacity="0.9"/>
      <path d="M5 11L3 8l3.5 1.5" fill="#ef4444"/>
      <path d="M19 11l2-3-3.5 1.5" fill="#ef4444"/>
      <circle cx="9.5" cy="12" r="1" fill="white"/>
      <circle cx="14.5" cy="12" r="1" fill="white"/>
      <path d="M10 15c.5.5 1 .8 2 .8s1.5-.3 2-.8" stroke="white" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function IconSpin({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="9" stroke="#a855f7" strokeWidth="1.5" fill="rgba(124,58,237,0.2)"/>
      <path d="M12 3a9 9 0 019 9" stroke="#ec4899" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2.5" fill="#a855f7"/>
      <path d="M21 12l-2.5 2.5M21 12l-2.5-2.5" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="3" x2="12" y2="7" stroke="#a855f7" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="12" y1="17" x2="12" y2="21" stroke="#a855f7" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="3" y1="12" x2="7" y2="12" stroke="#a855f7" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

function IconSlots({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <rect x="2" y="5" width="20" height="14" rx="2" fill="#d97706" opacity="0.9"/>
      <rect x="4" y="8" width="4.5" height="8" rx="1" fill="#fbbf24"/>
      <rect x="9.75" y="8" width="4.5" height="8" rx="1" fill="#fbbf24"/>
      <rect x="15.5" y="8" width="4.5" height="8" rx="1" fill="#fbbf24"/>
      <text x="6.25" y="14.5" fontSize="5.5" fill="#92400e" textAnchor="middle" fontWeight="900">7</text>
      <text x="12" y="14.5" fontSize="5.5" fill="#92400e" textAnchor="middle" fontWeight="900">7</text>
      <text x="17.75" y="14.5" fontSize="5.5" fill="#92400e" textAnchor="middle" fontWeight="900">7</text>
    </svg>
  );
}

function IconLucky77({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <rect x="1" y="4" width="22" height="16" rx="3" fill="#3d2800" opacity="0.95"/>
      <text x="12" y="16.5" fontSize="11" fill="#f59e0b" textAnchor="middle" fontWeight="900" fontFamily="Arial Black, sans-serif">77</text>
      <circle cx="4" cy="7" r="1" fill="#f59e0b" opacity="0.4"/>
      <circle cx="20" cy="7" r="1" fill="#f59e0b" opacity="0.4"/>
    </svg>
  );
}

function IconCardBattle({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <rect x="2" y="5" width="12" height="16" rx="2" fill="#3730a3" stroke="#7c3aed" strokeWidth="1"/>
      <rect x="10" y="3" width="12" height="16" rx="2" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1"/>
      <text x="8" y="15" fontSize="8" fill="#a855f7" textAnchor="middle" fontWeight="bold">A</text>
      <text x="16" y="13" fontSize="8" fill="#7c3aed" textAnchor="middle" fontWeight="bold">K</text>
    </svg>
  );
}

function IconQuiz({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="9" fill="#059669" opacity="0.8"/>
      <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-1.5 2-2.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1" fill="white"/>
    </svg>
  );
}

function IconFootball({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="9" fill="#065f46" opacity="0.8" stroke="#34d399" strokeWidth="1"/>
      <polygon points="12,7 14.5,10.5 12,14 9.5,10.5" fill="#34d399" opacity="0.8"/>
    </svg>
  );
}

function IconTreasure({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <rect x="3" y="10" width="18" height="11" rx="2" fill="#1d4ed8" opacity="0.8"/>
      <path d="M3 13h18" stroke="#60a5fa" strokeWidth="1"/>
      <path d="M8 10V8a4 4 0 018 0v2" stroke="#60a5fa" strokeWidth="1.5"/>
      <circle cx="12" cy="16" r="1.5" fill="#60a5fa"/>
    </svg>
  );
}

function IconHorse({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <path d="M4 18c0-5 3-9 8-9 3 0 5 1.5 6 4l1.5-4-2-1C16 5 13 4 10 5 6 6 4 10 4 14" fill="#b91c1c" opacity="0.8"/>
      <path d="M4 18h16" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconFishing({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <path d="M5 4l3 8" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="12" r="1.5" fill="#0369a1"/>
      <path d="M8 13.5C8 17 10 19 13 19s5-2 5-5.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 13.5l2 2-2 2" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconBomb({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="14" r="7" fill="#44403c" opacity="0.9"/>
      <path d="M12 7V5" stroke="#a8a29e" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14.5 5.5l2-2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9.5" cy="12" r="1.5" fill="#a8a29e" opacity="0.4"/>
    </svg>
  );
}

function IconMagic({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="7" fill="#6d28d9" opacity="0.8"/>
      <path d="M12 6v2M12 16v2M6 12h2M16 12h2" stroke="#c084fc" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" fill="#c084fc" opacity="0.5"/>
      <path d="M8.5 8.5l1.5 1.5M14 14l1.5 1.5M14 8.5l-1.5 1.5M10 14l-1.5 1.5" stroke="#c084fc" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

const GAME_ICON_MAP: Record<string, (size?: number) => React.ReactElement> = {
  "fruit-party": (s) => <IconFruitParty size={s} />,
  "roulette": (s) => <IconRoulette size={s} />,
  "greedy-cat": (s) => <IconGreedyCat size={s} />,
  "spin": (s) => <IconSpin size={s} />,
  "slots": (s) => <IconSlots size={s} />,
  "lucky77": (s) => <IconLucky77 size={s} />,
  "card-battle": (s) => <IconCardBattle size={s} />,
  "quiz": (s) => <IconQuiz size={s} />,
  "football": (s) => <IconFootball size={s} />,
  "treasure": (s) => <IconTreasure size={s} />,
  "horse": (s) => <IconHorse size={s} />,
  "fishing": (s) => <IconFishing size={s} />,
  "bomb": (s) => <IconBomb size={s} />,
  "magic": (s) => <IconMagic size={s} />,
};

const ROW1 = [
  {
    id: "fruit-party",
    nameAr: "حفلة الفواكه",
    gradient: "linear-gradient(135deg,#14532d,#16a34a,#4ade80)",
    glow: "rgba(74,222,128,0.6)",
    border: "rgba(74,222,128,0.5)",
    available: true,
    badge: "مباشر",
    badgeColor: "#4ade80",
    isNew: true,
  },
  {
    id: "roulette",
    nameAr: "روليت",
    gradient: "linear-gradient(135deg,#7f1d1d,#b91c1c,#dc2626)",
    glow: "rgba(220,38,38,0.6)",
    border: "rgba(220,38,38,0.5)",
    available: true,
    badge: "العب",
    badgeColor: "#f87171",
  },
  {
    id: "greedy-cat",
    nameAr: "القط الجشع",
    gradient: "linear-gradient(135deg,#ff6b35,#f7c59f,#ef4444)",
    glow: "rgba(255,107,53,0.6)",
    border: "rgba(255,107,53,0.5)",
    available: true,
    badge: "مباشر",
    badgeColor: "#ef4444",
  },
  {
    id: "spin",
    nameAr: "العجلة",
    gradient: "linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)",
    glow: "rgba(168,85,247,0.5)",
    border: "rgba(168,85,247,0.4)",
    available: true,
    badge: "العب",
    badgeColor: "#a855f7",
  },
  {
    id: "slots",
    nameAr: "سلوتس",
    gradient: "linear-gradient(135deg,#92400e,#d97706,#fbbf24)",
    glow: "rgba(251,191,36,0.5)",
    border: "rgba(251,191,36,0.4)",
    available: true,
    badge: "العب",
    badgeColor: "#fbbf24",
  },
  {
    id: "lucky77",
    nameAr: "Lucky 77",
    gradient: "linear-gradient(135deg,#1a1000,#3d2800,#92400e)",
    glow: "rgba(245,158,11,0.6)",
    border: "rgba(245,158,11,0.5)",
    available: true,
    badge: "العب",
    badgeColor: "#f59e0b",
  },
  {
    id: "card-battle",
    nameAr: "Card Battle",
    gradient: "linear-gradient(135deg,#1e1b4b,#3730a3,#7c3aed)",
    glow: "rgba(124,58,237,0.6)",
    border: "rgba(124,58,237,0.5)",
    available: true,
    badge: "العب",
    badgeColor: "#a855f7",
  },
];

const ROW2 = [
  {
    id: "quiz",
    nameAr: "مسابقة",
    gradient: "linear-gradient(135deg,#059669,#10b981,#6ee7b7)",
    glow: "rgba(16,185,129,0.5)",
    border: "rgba(16,185,129,0.4)",
    available: false,
  },
  {
    id: "football",
    nameAr: "كرة القدم",
    gradient: "linear-gradient(135deg,#064e3b,#065f46,#34d399)",
    glow: "rgba(52,211,153,0.5)",
    border: "rgba(52,211,153,0.4)",
    available: false,
  },
  {
    id: "treasure",
    nameAr: "الكنز",
    gradient: "linear-gradient(135deg,#1e3a5f,#1d4ed8,#60a5fa)",
    glow: "rgba(96,165,250,0.5)",
    border: "rgba(96,165,250,0.4)",
    available: false,
  },
];

const ROW3 = [
  {
    id: "horse",
    nameAr: "سباق الخيل",
    gradient: "linear-gradient(135deg,#7f1d1d,#b91c1c,#f87171)",
    glow: "rgba(248,113,113,0.5)",
    border: "rgba(248,113,113,0.4)",
    available: false,
  },
  {
    id: "fishing",
    nameAr: "الصيد",
    gradient: "linear-gradient(135deg,#0c4a6e,#0369a1,#38bdf8)",
    glow: "rgba(56,189,248,0.5)",
    border: "rgba(56,189,248,0.4)",
    available: false,
  },
  {
    id: "bomb",
    nameAr: "القنبلة",
    gradient: "linear-gradient(135deg,#1c1917,#44403c,#a8a29e)",
    glow: "rgba(168,162,158,0.4)",
    border: "rgba(168,162,158,0.3)",
    available: false,
  },
  {
    id: "magic",
    nameAr: "السحر",
    gradient: "linear-gradient(135deg,#2e1065,#6d28d9,#c084fc)",
    glow: "rgba(192,132,252,0.5)",
    border: "rgba(192,132,252,0.4)",
    available: false,
  },
];

export default function ActivitiesPage({ onBack }: ActivitiesPageProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (selected === "weekly-star") return <WeeklyStarPage onBack={() => setSelected(null)} />;
  if (selected === "fruit-party") return <FruitPartyGame onBack={() => setSelected(null)} />;
  if (selected === "greedy-cat") return <GreedyCatGame onBack={() => setSelected(null)} />;
  if (selected === "spin") return <SpinWheelGame onBack={() => setSelected(null)} />;
  if (selected === "slots") return <SlotsGame onBack={() => setSelected(null)} />;
  if (selected === "lucky77") return <Lucky77Game onBack={() => setSelected(null)} />;
  if (selected === "card-battle") return <CardBattleGame onBack={() => setSelected(null)} />;
  if (selected === "roulette") return <RouletteStandaloneGame onBack={() => setSelected(null)} />;

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg, #06060f 0%, #0a0a1a 50%, #080812 100%)" }}
      dir="rtl"
    >
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              opacity: 0.1 + (i % 5) * 0.06,
              animation: `star-twinkle ${2 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.3) % 3}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div
        className="relative flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{
          background: "rgba(6,6,15,0.9)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-xl leading-none">الأنشطة</h1>
          <p className="text-gray-500 text-[11px] mt-0.5">العاب ومسابقات وترفيه</p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)" }}
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-[10px] font-black">مباشر</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-8">

        {/* Weekly Star Featured Banner */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500" />
            <p className="text-white font-black text-sm">فعالية النجمة الأسبوعية</p>
            <div className="px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
              جديد
            </div>
          </div>
          <button
            onClick={() => setSelected("weekly-star")}
            className="w-full relative rounded-3xl overflow-hidden active:scale-[0.98] transition-all"
            style={{
              border: "2px solid rgba(255,215,0,0.6)",
              boxShadow: "0 8px 40px rgba(255,215,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              height: "130px",
            }}
          >
            <img
              src="https://j.top4top.io/p_3742mh9j21.jpg"
              alt="نجمة أسبوعية"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }} />
            <div className="absolute inset-0 flex items-center justify-between px-5">
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                    style={{ background: "rgba(255,215,0,0.3)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.5)" }}>
                    أسبوعي
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                    style={{ background: "rgba(239,68,68,0.3)", color: "#f87171", border: "1px solid rgba(239,68,68,0.5)" }}>
                    مباشر
                  </span>
                </div>
                <h2 className="text-white font-black text-xl drop-shadow-lg">نجمة أسبوعية</h2>
                <p className="text-yellow-300 text-xs mt-1 drop-shadow">أرسل الهدايا وكن النجم الأول</p>
                <p className="text-gray-300 text-[10px] mt-0.5 drop-shadow">جوائز حقيقية · وسام النجمة</p>
              </div>
              <div
                className="px-4 py-2 rounded-2xl font-black text-sm"
                style={{ background: "linear-gradient(135deg,#ffd700,#ff9c00)", color: "#5a1a00", boxShadow: "0 4px 15px rgba(255,215,0,0.5)" }}
              >
                شارك الآن
              </div>
            </div>
          </button>
        </div>

        {/* Featured - Greedy Cat */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-orange-400 to-red-500" />
            <p className="text-white font-black text-sm">مميز</p>
          </div>
          <button
            onClick={() => setSelected("greedy-cat")}
            className="w-full relative rounded-3xl overflow-hidden active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg,#1a0a00,#3d1500,#7c2d00)",
              border: "1px solid rgba(255,107,53,0.5)",
              boxShadow: "0 8px 40px rgba(255,107,53,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              height: "120px",
            }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(255,107,53,0.25), transparent 70%)" }} />
            <div className="absolute inset-0 flex items-center justify-between px-6">
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                    style={{ background: "rgba(239,68,68,0.3)", color: "#f87171", border: "1px solid rgba(239,68,68,0.5)" }}>
                    مباشر
                  </span>
                </div>
                <h2 className="text-white font-black text-xl">القط الجشع</h2>
                <p className="text-orange-300 text-xs mt-1">راهن على طعام القط الفائز</p>
              </div>
              <div style={{ filter: "drop-shadow(0 0 15px rgba(255,107,53,0.8))" }}>
                <IconGreedyCat size={64} />
              </div>
            </div>
          </button>
        </div>

        {/* Grid of games */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500" />
            <p className="text-white font-black text-sm">جميع الألعاب</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ROW1.filter(g => g.id !== "greedy-cat").map((game) => (
              <button
                key={game.id}
                onClick={() => game.available ? setSelected(game.id) : undefined}
                className="relative rounded-2xl overflow-hidden active:scale-[0.96] transition-all"
                style={{
                  background: game.gradient,
                  border: `1px solid ${game.border}`,
                  boxShadow: `0 4px 20px ${game.glow}`,
                  height: "100px",
                  opacity: game.available ? 1 : 0.6,
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                  <div style={{ filter: `drop-shadow(0 0 8px ${game.glow})` }}>
                    {GAME_ICON_MAP[game.id]?.(28)}
                  </div>
                  <span className="text-white font-black text-xs text-center leading-tight">{game.nameAr}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(0,0,0,0.3)", color: (game as any).badgeColor }}>
                    {(game as any).badge}
                  </span>
                </div>
                {(game as any).isNew && (
                  <div className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded font-black"
                    style={{ background: "#ef4444", color: "white" }}>NEW</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* قريباً */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-gray-400 to-gray-600" />
            <p className="text-white font-black text-sm">قريباً</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[...ROW2, ...ROW3].map((game) => (
              <button
                key={game.id}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: game.gradient,
                  border: `1px solid ${game.border}`,
                  height: "80px",
                  opacity: 0.5,
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1">
                  {GAME_ICON_MAP[game.id]?.(22)}
                  <span className="text-white font-bold text-[9px] text-center leading-tight">{game.nameAr}</span>
                  <span className="text-[8px] text-gray-300">قريباً</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes star-twinkle { 0%,100%{opacity:0.1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
      `}</style>
    </div>
  );
}
