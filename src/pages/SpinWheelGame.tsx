// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

const PRIZES = [
  { key: "lose_a",      label: "حظ أوفر",       type: "lose",    value: 0,       emoji: "💨", color: "#1e1b4b", light: "#4338ca", textColor: "#818cf8" },
  { key: "coins_5000",  label: "5,000",          type: "coins",   value: 5000,    emoji: "🪙", color: "#78350f", light: "#d97706", textColor: "#fcd34d" },
  { key: "lose_b",      label: "حظ أوفر",       type: "lose",    value: 0,       emoji: "💨", color: "#1e1b4b", light: "#4338ca", textColor: "#818cf8" },
  { key: "coins_10000", label: "10,000",         type: "coins",   value: 10000,   emoji: "💰", color: "#7c2d12", light: "#ea580c", textColor: "#fed7aa" },
  { key: "lose_c",      label: "حظ أوفر",       type: "lose",    value: 0,       emoji: "💨", color: "#1e1b4b", light: "#4338ca", textColor: "#818cf8" },
  { key: "coins_50000", label: "50,000",         type: "coins",   value: 50000,   emoji: "💎", color: "#713f12", light: "#ca8a04", textColor: "#fef08a" },
  { key: "vip11",       label: "VIP 11",         type: "vip",     value: 11,      emoji: "👑", color: "#3b0764", light: "#9333ea", textColor: "#e9d5ff" },
  { key: "jackpot",     label: "الجائزة الكبرى", type: "jackpot", value: 5000000, emoji: "🏆", color: "#7f1d1d", light: "#dc2626", textColor: "#fecaca" },
];

const SEG_COUNT = PRIZES.length;
const SEG_ANGLE = 360 / SEG_COUNT;
const SINGLE_COST = 2000;
const MULTI_COST = 20000;

interface Props { onBack: () => void }

export default function SpinWheelGame({ onBack }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [globalBanners, setGlobalBanners] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setProfile(p);
      }
      const { data: h } = await supabase.from('spin_history').select('*').order('created_at', { ascending: false }).limit(20);
      setHistory(h || []);
      const { data: l } = await supabase.from('spin_leaderboard').select('*, profile:profiles(*)').order('total_win', { ascending: false }).limit(10);
      setLeaderboard(l || []);
      const { data: b } = await supabase.from('spin_banners').select('*').eq('active', true).order('created_at', { ascending: false }).limit(5);
      setGlobalBanners(b || []);
    };
    fetchData();
  }, []);

  const spinOnceMut = async () => ({ prizeIdx: 0, prize: PRIZES[0] });
  const spinMultiMut = async () => ({ results: [] });

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [tab, setTab] = useState<"game" | "history" | "leaderboard">("game");
  const [multiResults, setMultiResults] = useState<any[] | null>(null);
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [singleResult, setSingleResult] = useState<any | null>(null);
  const [showSingleResult, setShowSingleResult] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);

  const totalRotRef = useRef(0);

  useEffect(() => {
    if (!globalBanners || globalBanners.length === 0) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % globalBanners.length), 4000);
    return () => clearInterval(t);
  }, [globalBanners?.length]);

  const animateWheel = (segIdx: number, onDone: () => void) => {
    const segCenter = segIdx * SEG_ANGLE + SEG_ANGLE / 2;
    const targetAngle = 360 - segCenter;
    const extraSpins = 6 + Math.floor(Math.random() * 3);
    const finalRotation = totalRotRef.current + extraSpins * 360 + targetAngle - (totalRotRef.current % 360);
    totalRotRef.current = finalRotation;
    setRotation(finalRotation);
    setTimeout(onDone, 4800);
  };

  const doSpin = async (multi: boolean) => {
    if (spinning) return;
    setSingleResult(null);
    setShowSingleResult(false);
    setMultiResults(null);
    setSpinning(true);

    try {
      if (multi) {
        const res = await spinMultiMut();
        const lastIdx = res.results[res.results.length - 1].prizeIdx;
        animateWheel(lastIdx, () => {
          setMultiResults(res.results);
          setShowMultiModal(true);
          setSpinning(false);
        });
      } else {
        const res = await spinOnceMut();
        animateWheel(res.prizeIdx, () => {
          setSingleResult(res);
          setShowSingleResult(true);
          setSpinning(false);
          if (res.prize.type !== "lose") {
            toast.success(`🎉 فزت بـ ${res.prize.label} ${res.prize.emoji}`);
          } else {
            toast.error("💨 حظ أوفر في المرة القادمة!");
          }
        });
      }
    } catch (e: any) {
      toast.error(e.message);
      setSpinning(false);
    }
  };

  const activeBanner = globalBanners && globalBanners.length > 0 ? globalBanners[bannerIdx % globalBanners.length] : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg,#0a0005 0%,#120010 40%,#0d0008 100%)" }}
      dir="rtl"
    >
      {/* Royal BG particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
              top: `${(i * 41) % 100}%`, left: `${(i * 67) % 100}%`,
              background: i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#a855f7" : "#dc2626",
              opacity: 0.15 + (i % 5) * 0.05,
              animation: `kw-twinkle ${2 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.4) % 4}s`,
            }}
          />
        ))}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(251,191,36,0.08) 0%,transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)" }} />
      </div>

      {/* GLOBAL WINNER BANNER */}
      {activeBanner && (
        <div
          className="relative flex-shrink-0 flex items-center gap-2 px-3 py-2 overflow-hidden"
          style={{
            background: "linear-gradient(90deg,#7f1d1d,#4c1d95,#7f1d1d)",
            borderBottom: "1px solid rgba(251,191,36,0.4)",
            animation: "kw-banner-slide 0.5s ease-out",
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(251,191,36,0.1),transparent)", animation: "kw-shimmer 3s linear infinite" }} />
          <span className="text-lg flex-shrink-0">🎊</span>
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-yellow-400"
            style={{ background: "linear-gradient(135deg,#7c3aed,#dc2626)" }}>
            {activeBanner.userAvatarUrl
              ? <img src={activeBanner.userAvatarUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white font-black text-xs">{activeBanner.userName?.[0] ?? "؟"}</div>
            }
          </div>
          <p className="text-yellow-300 font-black text-xs flex-1 truncate">
            <span className="text-white">{activeBanner.userName}</span> فاز بـ {activeBanner.prizeEmoji} {activeBanner.prizeLabel}!
          </p>
          <span className="text-yellow-400 text-xs font-black flex-shrink-0">عجلة الملوك 👑</span>
        </div>
      )}

      {/* HEADER */}
      <div
        className="relative flex items-center justify-between px-3 py-2.5 flex-shrink-0"
        style={{ background: "rgba(10,0,5,0.97)", borderBottom: "1px solid rgba(251,191,36,0.15)" }}
      >
        <div className="flex items-center gap-2">
          <button onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl" style={{ animation: "kw-lion-roar 3s ease-in-out infinite" }}>🦁</span>
              <h1 className="font-black text-base leading-none"
                style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b,#dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                عجلة الملوك
              </h1>
              <span className="text-base" style={{ animation: "kw-crown-bounce 2s ease-in-out infinite" }}>👑</span>
            </div>
            <p className="text-yellow-900 text-[9px] font-bold">الجائزة الكبرى 5,000,000 🪙</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setTab("history")}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl active:scale-95 text-[10px] font-black"
            style={tab === "history"
              ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "white" }
              : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
            📜
          </button>
          <button onClick={() => setTab("leaderboard")}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl active:scale-95 text-[10px] font-black"
            style={tab === "leaderboard"
              ? { background: "linear-gradient(135deg,#b45309,#fbbf24)", color: "#000" }
              : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
            🏆
          </button>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
            <span className="text-sm">🪙</span>
            <span className="text-yellow-400 font-black text-xs">{(profile?.goldCoins ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">

        {tab === "game" && (
          <div className="flex flex-col items-center px-4 pb-8 pt-3 gap-4">

            {/* Royal decorative line */}
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)" }} />
              <span className="text-yellow-600 text-xs">✦ ✦ ✦</span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)" }} />
            </div>

            {/* WHEEL */}
            <div className="relative flex items-center justify-center" style={{ width: "min(300px, 88vw)", height: "min(300px, 88vw)" }}>
              {/* Outer royal ring */}
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "conic-gradient(from 0deg,#fbbf24,#dc2626,#7c3aed,#fbbf24,#dc2626,#7c3aed,#fbbf24)",
                  padding: "3px",
                  borderRadius: "50%",
                  animation: spinning ? "kw-ring-spin 1.5s linear infinite" : "kw-ring-spin 8s linear infinite",
                }}>
                <div className="w-full h-full rounded-full" style={{ background: "#0a0005" }} />
              </div>

              {/* Pointer */}
              <div className="absolute top-0 left-1/2 z-30 flex flex-col items-center" style={{ transform: "translateX(-50%) translateY(-4px)" }}>
                <div style={{
                  width: 0, height: 0,
                  borderLeft: "13px solid transparent",
                  borderRight: "13px solid transparent",
                  borderTop: "30px solid #fbbf24",
                  filter: "drop-shadow(0 0 10px rgba(251,191,36,1))",
                }} />
              </div>

              {/* Wheel SVG */}
              <svg
                width="100%" height="100%" viewBox="0 0 300 300"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? "transform 4.8s cubic-bezier(0.17,0.67,0.08,0.99)" : "none",
                  filter: spinning ? "drop-shadow(0 0 30px rgba(251,191,36,0.5))" : "drop-shadow(0 0 15px rgba(251,191,36,0.2))",
                }}
              >
                <defs>
                  {PRIZES.map((p, i) => (
                    <radialGradient key={i} id={`seg-grad-${i}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={p.light} stopOpacity="0.9" />
                      <stop offset="100%" stopColor={p.color} stopOpacity="1" />
                    </radialGradient>
                  ))}
                </defs>
                {PRIZES.map((prize, i) => {
                  const startAngle = i * SEG_ANGLE - 90;
                  const endAngle = startAngle + SEG_ANGLE;
                  const r = 140;
                  const cx = 150, cy = 150;
                  const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
                  const midAngle = startAngle + SEG_ANGLE / 2;
                  const tx = cx + (r * 0.68) * Math.cos((midAngle * Math.PI) / 180);
                  const ty = cy + (r * 0.68) * Math.sin((midAngle * Math.PI) / 180);
                  const ex = cx + (r * 0.42) * Math.cos((midAngle * Math.PI) / 180);
                  const ey = cy + (r * 0.42) * Math.sin((midAngle * Math.PI) / 180);
                  return (
                    <g key={i}>
                      <path
                        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
                        fill={`url(#seg-grad-${i})`}
                        stroke="rgba(251,191,36,0.3)"
                        strokeWidth="1.5"
                      />
                      <text x={ex} y={ey} textAnchor="middle" dominantBaseline="middle" fontSize="16"
                        transform={`rotate(${midAngle + 90},${ex},${ey})`}>
                        {prize.emoji}
                      </text>
                      <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                        fill={prize.textColor} fontSize={prize.type === "jackpot" ? "7" : "8"} fontWeight="900"
                        transform={`rotate(${midAngle + 90},${tx},${ty})`}>
                        {prize.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="150" cy="150" r="28" fill="#0a0005" stroke="rgba(251,191,36,0.6)" strokeWidth="2.5" />
                <circle cx="150" cy="150" r="22" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
                <text x="150" y="150" textAnchor="middle" dominantBaseline="middle" fontSize="22">🦁</text>
              </svg>

              {spinning && (
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ boxShadow: "0 0 60px rgba(251,191,36,0.4), 0 0 120px rgba(220,38,38,0.2)", animation: "kw-glow-pulse 0.5s ease-in-out infinite alternate" }} />
              )}
            </div>

            {/* SPIN BUTTONS */}
            <div className="w-full grid grid-cols-2 gap-3">
              <button
                onClick={() => doSpin(false)}
                disabled={spinning}
                className="relative rounded-2xl py-4 flex flex-col items-center gap-1 active:scale-95 transition-all overflow-hidden disabled:opacity-50"
                style={{
                  background: spinning ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#7c2d12,#c2410c,#ea580c)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  boxShadow: spinning ? "none" : "0 8px 30px rgba(194,65,12,0.5)",
                }}
              >
                {!spinning && <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.12) 50%,transparent 70%)", animation: "kw-shimmer 2.5s ease-in-out infinite" }} />}
                <span className="text-2xl relative z-10">🎡</span>
                <span className="text-white font-black text-sm relative z-10">دورة واحدة</span>
                <div className="flex items-center gap-1 relative z-10">
                  <span className="text-yellow-300 font-black text-xs">{SINGLE_COST.toLocaleString()}</span>
                  <span className="text-sm">🪙</span>
                </div>
              </button>

              <button
                onClick={() => doSpin(true)}
                disabled={spinning}
                className="relative rounded-2xl py-4 flex flex-col items-center gap-1 active:scale-95 transition-all overflow-hidden disabled:opacity-50"
                style={{
                  background: spinning ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#3b0764,#7c3aed,#a855f7)",
                  border: "1px solid rgba(251,191,36,0.4)",
                  boxShadow: spinning ? "none" : "0 8px 30px rgba(124,58,237,0.6)",
                }}
              >
                {!spinning && <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%)", animation: "kw-shimmer 2s ease-in-out infinite" }} />}
                <div className="flex items-center gap-1 relative z-10">
                  <span className="text-2xl">✨</span>
                  <span className="text-yellow-300 font-black text-base">x10</span>
                </div>
                <span className="text-white font-black text-sm relative z-10">عشر دورات</span>
                <div className="flex items-center gap-1 relative z-10">
                  <span className="text-yellow-300 font-black text-xs">{MULTI_COST.toLocaleString()}</span>
                  <span className="text-sm">🪙</span>
                </div>
              </button>
            </div>

            {spinning && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-yellow-400 font-black text-sm animate-pulse">العجلة تدور... 🦁</p>
              </div>
            )}

            {/* PRIZES TABLE */}
            <div className="w-full rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251,191,36,0.15)" }}>
              <div className="px-3 py-2 flex items-center gap-2"
                style={{ background: "rgba(251,191,36,0.08)", borderBottom: "1px solid rgba(251,191,36,0.15)" }}>
                <span className="text-base">👑</span>
                <p className="text-yellow-400 font-black text-xs">جوائز عجلة الملوك</p>
              </div>
              <div className="grid grid-cols-2 gap-0">
                {PRIZES.filter(p => p.type !== "lose").map((prize, i) => (
                  <div key={prize.key}
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{
                      borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      background: prize.type === "jackpot" ? "rgba(220,38,38,0.08)" : prize.type === "vip" ? "rgba(124,58,237,0.08)" : "transparent",
                    }}>
                    <span className="text-xl">{prize.emoji}</span>
                    <div>
                      <p className="font-black text-xs" style={{ color: prize.type === "jackpot" ? "#fca5a5" : prize.type === "vip" ? "#c4b5fd" : "#fcd34d" }}>
                        {prize.type === "coins" ? `${prize.value.toLocaleString()} 🪙` : prize.label}
                      </p>
                      {prize.type === "jackpot" && <p className="text-red-400 text-[9px] font-bold">🔥 جائزة كبرى</p>}
                      {prize.type === "vip" && <p className="text-purple-400 text-[9px] font-bold">7 أيام</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {tab === "history" && (
          <div className="px-4 pb-6 pt-3 space-y-3">
            <p className="text-yellow-700 text-xs font-bold">📜 آخر 20 دورة</p>
            {!history ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : history.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-10">لا توجد دورات سابقة</p>
            ) : (history as any[]).map((spin) => {
              const prize = PRIZES[spin.segmentIndex] ?? PRIZES[0];
              const won = spin.profit > 0;
              return (
                <div key={spin.id} className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{
                    background: won ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.03)",
                    border: won ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${prize.light}20`, border: `1px solid ${prize.light}40` }}>
                      {prize.emoji}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{prize.label}</p>
                      <p className="text-gray-500 text-[10px]">تكلفة: {spin.betAmount.toLocaleString()} 🪙</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm ${won ? "text-yellow-400" : "text-gray-500"}`}>
                      {won ? `+${spin.payout.toLocaleString()} 🪙` : "حظ أوفر"}
                    </p>
                    <p className="text-gray-600 text-[10px]">{new Date(spin.createdAt).toLocaleTimeString("ar")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="px-4 pb-6 pt-3 space-y-3">
            <p className="text-yellow-700 text-xs font-bold">🏆 أكثر الفائزين</p>
            {!leaderboard ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : leaderboard.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-10">لا يوجد لاعبون بعد</p>
            ) : (leaderboard as any[]).map((entry, idx) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: idx === 0 ? "rgba(251,191,36,0.1)" : idx === 1 ? "rgba(156,163,175,0.06)" : "rgba(255,255,255,0.03)",
                  border: idx === 0 ? "1px solid rgba(251,191,36,0.35)" : "1px solid rgba(255,255,255,0.07)",
                }}>
                <span className="text-xl font-black w-7 text-center flex-shrink-0">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                </span>
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#dc2626)", border: "1px solid rgba(251,191,36,0.3)" }}>
                  {entry.profile?.avatarUrl
                    ? <img src={entry.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-black text-sm">{entry.profile?.name?.[0] ?? "؟"}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate">{entry.profile?.name ?? "مجهول"}</p>
                  <p className="text-gray-500 text-[10px]">{entry.spinsCount} دورة</p>
                </div>
                <div className="text-left">
                  <p className="text-yellow-400 font-black text-sm">{entry.totalWon.toLocaleString()} 🪙</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SINGLE RESULT OVERLAY */}
      {showSingleResult && singleResult && (
        <div
          className="absolute inset-0 z-[300] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowSingleResult(false)}
        >
          <div
            className="w-full max-w-xs mx-4 rounded-3xl p-6 text-center"
            style={{
              background: singleResult.prize.type === "jackpot"
                ? "linear-gradient(135deg,rgba(127,29,29,0.95),rgba(76,29,149,0.9))"
                : singleResult.prize.type === "vip"
                ? "linear-gradient(135deg,rgba(76,29,149,0.95),rgba(30,27,75,0.9))"
                : singleResult.prize.type === "lose"
                ? "linear-gradient(135deg,rgba(30,27,75,0.85),rgba(17,24,39,0.95))"
                : "linear-gradient(135deg,rgba(120,53,15,0.95),rgba(30,27,75,0.9))",
              border: singleResult.prize.type === "lose" ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(251,191,36,0.5)",
              boxShadow: singleResult.prize.type !== "lose" ? "0 0 60px rgba(251,191,36,0.3)" : "none",
              animation: "kw-pop 0.5s ease-out",
            }}
            onClick={e => e.stopPropagation()}
          >
            {singleResult.prize.type !== "lose" && (
              <div className="flex justify-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm" style={{ animation: `kw-star-pop 0.3s ease-out ${i * 0.1}s both` }}>⭐</span>
                ))}
              </div>
            )}
            <div className="text-7xl mb-3" style={{ animation: "kw-prize-bounce 0.6s ease-out" }}>
              {singleResult.prize.emoji}
            </div>
            {singleResult.prize.type === "lose" ? (
              <>
                <p className="text-indigo-300 font-black text-xl mb-1">حظ أوفر! 💨</p>
                <p className="text-gray-400 text-sm">جرب مرة أخرى</p>
              </>
            ) : (
              <>
                <p className="text-yellow-300 font-black text-xs mb-1">🎉 مبروك! فزت بـ</p>
                <p className="text-white font-black text-2xl mb-1">
                  {singleResult.prize.type === "coins" || singleResult.prize.type === "jackpot"
                    ? `${singleResult.prize.value.toLocaleString()} 🪙`
                    : singleResult.prize.label}
                </p>
                {singleResult.prize.type === "vip" && (
                  <p className="text-purple-300 text-sm font-bold">VIP 11 لمدة 7 أيام 👑</p>
                )}
                {singleResult.prize.type === "jackpot" && (
                  <p className="text-red-300 text-sm font-bold animate-pulse">🏆 الجائزة الكبرى!</p>
                )}
              </>
            )}
            <button
              onClick={() => setShowSingleResult(false)}
              className="mt-4 w-full py-3 rounded-2xl font-black text-sm"
              style={{ background: "linear-gradient(135deg,#b45309,#fbbf24)", color: "#000" }}
            >
              رائع! 👑
            </button>
          </div>
        </div>
      )}

      {/* MULTI SPIN RESULTS MODAL */}
      {showMultiModal && multiResults && (
        <div
          className="absolute inset-0 z-[300] flex items-end"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowMultiModal(false)}
        >
          <div
            className="w-full rounded-t-3xl flex flex-col"
            style={{
              background: "linear-gradient(180deg,#120010,#0a0005)",
              border: "1px solid rgba(251,191,36,0.3)",
              maxHeight: "85vh",
              animation: "kw-slide-up 0.4s ease-out",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(251,191,36,0.15)" }}>
              <div>
                <h2 className="font-black text-base"
                  style={{ background: "linear-gradient(135deg,#fbbf24,#dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  نتائج x10 دورات 👑
                </h2>
                <p className="text-gray-500 text-[10px]">
                  إجمالي الكسب: <span className="text-yellow-400 font-black">
                    {multiResults.reduce((s, r) => s + r.coinsGained, 0).toLocaleString()} 🪙
                  </span>
                </p>
              </div>
              <button onClick={() => setShowMultiModal(false)} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                {multiResults.map((r, i) => {
                  const prize = PRIZES[r.prizeIdx] ?? PRIZES[0];
                  const won = r.coinsGained > 0 || r.vipGranted;
                  return (
                    <div key={i}
                      className="rounded-2xl p-3 flex items-center gap-2"
                      style={{
                        background: prize.type === "jackpot" ? "rgba(220,38,38,0.15)" : prize.type === "vip" ? "rgba(124,58,237,0.15)" : won ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)",
                        border: prize.type === "jackpot" ? "1px solid rgba(220,38,38,0.5)" : prize.type === "vip" ? "1px solid rgba(124,58,237,0.4)" : won ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.06)",
                        animation: `kw-pop ${0.1 + i * 0.05}s ease-out`,
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${prize.light}20` }}>
                        {prize.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-black text-xs truncate">{prize.label}</p>
                        {won && !r.vipGranted && (
                          <p className="text-yellow-400 font-bold text-[10px]">+{r.coinsGained.toLocaleString()} 🪙</p>
                        )}
                        {r.vipGranted && <p className="text-purple-400 font-bold text-[10px]">VIP 11 👑</p>}
                        {!won && <p className="text-gray-600 text-[10px]">حظ أوفر</p>}
                      </div>
                      <span className="text-xs font-black text-gray-600 flex-shrink-0">#{i + 1}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 rounded-2xl p-3 flex items-center justify-between"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <span className="text-gray-400 text-xs font-bold">إجمالي الكسب</span>
                <span className="text-yellow-400 font-black text-base">
                  {multiResults.reduce((s, r) => s + r.coinsGained, 0).toLocaleString()} 🪙
                </span>
              </div>
            </div>

            <div className="px-4 pb-4 pt-2 flex-shrink-0">
              <button
                onClick={() => setShowMultiModal(false)}
                className="w-full py-3.5 rounded-2xl font-black text-black text-base"
                style={{ background: "linear-gradient(135deg,#b45309,#fbbf24)", boxShadow: "0 6px 20px rgba(180,83,9,0.5)" }}
              >
                رائع! العب مجدداً 🦁
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes kw-twinkle { 0%,100%{opacity:.1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.8)} }
        @keyframes kw-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes kw-ring-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes kw-glow-pulse { 0%{opacity:.6} 100%{opacity:1} }
        @keyframes kw-pop { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes kw-prize-bounce { 0%{transform:scale(0.5) rotate(-10deg)} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0deg)} }
        @keyframes kw-star-pop { 0%{transform:scale(0);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes kw-slide-up { 0%{transform:translateY(100%)} 100%{transform:translateY(0)} }
        @keyframes kw-banner-slide { 0%{transform:translateY(-100%);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes kw-lion-roar { 0%,100%{transform:scale(1) rotate(0deg)} 25%{transform:scale(1.15) rotate(-5deg)} 75%{transform:scale(1.15) rotate(5deg)} }
        @keyframes kw-crown-bounce { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-4px) rotate(10deg)} }
      `}</style>
    </div>
  );
}
