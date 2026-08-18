// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface BombExplosionOverlayProps {
  roomId: Id<"rooms">;
}

const LEVEL_COLORS = [
  { from: "#f59e0b", to: "#ef4444",  glow: "rgba(245,158,11,0.7)"  },
  { from: "#ef4444", to: "#dc2626",  glow: "rgba(239,68,68,0.7)"   },
  { from: "#a855f7", to: "#7c3aed",  glow: "rgba(168,85,247,0.7)"  },
  { from: "#3b82f6", to: "#1d4ed8",  glow: "rgba(59,130,246,0.7)"  },
  { from: "#10b981", to: "#059669",  glow: "rgba(16,185,129,0.7)"  },
  { from: "#f97316", to: "#ea580c",  glow: "rgba(249,115,22,0.7)"  },
  { from: "#ec4899", to: "#db2777",  glow: "rgba(236,72,153,0.7)"  },
  { from: "#06b6d4", to: "#0891b2",  glow: "rgba(6,182,212,0.7)"   },
  { from: "#84cc16", to: "#65a30d",  glow: "rgba(132,204,22,0.7)"  },
  { from: "#ff006e", to: "#8338ec",  glow: "rgba(255,0,110,0.7)"   },
];

const LEVEL_REWARDS = [
  { vipLevel: 3,  vipDays: 7,  coinsRewards: [5000,    4000,   3000,   2000,   1000]   },
  { vipLevel: 4,  vipDays: 7,  coinsRewards: [10000,   8000,   6000,   4000,   2000]   },
  { vipLevel: 5,  vipDays: 7,  coinsRewards: [20000,   15000,  10000,  7000,   3000]   },
  { vipLevel: 6,  vipDays: 7,  coinsRewards: [50000,   40000,  30000,  20000,  10000]  },
  { vipLevel: 7,  vipDays: 7,  coinsRewards: [100000,  80000,  60000,  40000,  20000]  },
  { vipLevel: 8,  vipDays: 14, coinsRewards: [200000,  150000, 100000, 70000,  30000]  },
  { vipLevel: 9,  vipDays: 14, coinsRewards: [300000,  250000, 200000, 150000, 100000] },
  { vipLevel: 10, vipDays: 30, coinsRewards: [500000,  400000, 300000, 200000, 100000] },
  { vipLevel: 11, vipDays: 30, coinsRewards: [800000,  600000, 400000, 300000, 200000] },
  { vipLevel: 12, vipDays: 30, coinsRewards: [1000000, 800000, 600000, 400000, 200000] },
];

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

type Phase = "countdown" | "explode" | "leaderboard" | "done";

// Simple explosion sound using Web Audio API
function playExplosionSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 1.5;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(1.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export default function BombExplosionOverlay({ roomId }: BombExplosionOverlayProps) {
  const bombState = useQuery(api.roomBomb.getRoomBombState, { roomId });
  const [phase, setPhase] = useState<Phase>("done");
  const [countdown, setCountdown] = useState(10);
  const [explodedLevel, setExplodedLevel] = useState(1);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("done");
  const trackedExplodeAt = useRef<number | null>(null);

  const leaderboard = useQuery(
    api.roomBomb.getRoomBombLeaderboard,
    showLeaderboard ? { roomId, level: explodedLevel } : "skip"
  );

  useEffect(() => {
    if (!bombState) return;
    const isExploding = bombState.isExploding;
    const explodeAt = bombState.explodeAt as number | null;

    if (isExploding && explodeAt && explodeAt !== trackedExplodeAt.current) {
      trackedExplodeAt.current = explodeAt;
      setExplodedLevel(bombState.currentLevel ?? 1);
      setShowLeaderboard(false);
      setShowRewards(false);

      const startCountdown = () => {
        const remaining = Math.max(0, Math.ceil((explodeAt - Date.now()) / 1000));
        setCountdown(remaining);
        setPhase("countdown");
        phaseRef.current = "countdown";

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          const rem = Math.max(0, Math.ceil((explodeAt - Date.now()) / 1000));
          setCountdown(rem);
          if (rem <= 0) {
            clearInterval(timerRef.current!);
            playExplosionSound();
            setPhase("explode");
            phaseRef.current = "explode";
            setTimeout(() => {
              setPhase("leaderboard");
              phaseRef.current = "leaderboard";
              setShowLeaderboard(true);
            }, 2500);
          }
        }, 200);
      };
      startCountdown();
    }

    if (!isExploding && phaseRef.current === "leaderboard") {
      const t = setTimeout(() => {
        setPhase("done");
        phaseRef.current = "done";
        setShowLeaderboard(false);
        trackedExplodeAt.current = null;
      }, 10000);
      return () => clearTimeout(t);
    }
  }, [bombState?.isExploding, bombState?.explodeAt]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (phase === "done") return null;

  const lvlColor = LEVEL_COLORS[Math.min(explodedLevel - 1, LEVEL_COLORS.length - 1)];
  const rewardIdx = Math.min(explodedLevel - 1, LEVEL_REWARDS.length - 1);
  const rewards = LEVEL_REWARDS[rewardIdx];

  // ── COUNTDOWN PHASE ──
  if (phase === "countdown") {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
        style={{ background: "rgba(0,0,0,0.95)" }}
      >
        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-ping"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: lvlColor.from,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.8 + Math.random()}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Outer glow rings */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full animate-ping"
            style={{
              width: `${i * 120}px`,
              height: `${i * 120}px`,
              border: `2px solid ${lvlColor.from}`,
              opacity: 0.15 / i,
              animationDuration: `${1.5 + i * 0.5}s`,
            }}
          />
        ))}

        {/* Bomb icon */}
        <div
          className="text-[100px] mb-4 relative"
          style={{
            filter: `drop-shadow(0 0 40px ${lvlColor.glow}) drop-shadow(0 0 80px ${lvlColor.glow})`,
            animation: "bombShake 0.3s ease-in-out infinite",
          }}
        >
          💣
          {/* Fuse sparks */}
          <div
            className="absolute -top-2 -right-2 text-2xl"
            style={{ animation: "sparkle 0.2s ease-in-out infinite alternate" }}
          >
            ✨
          </div>
        </div>

        <p
          className="text-xl font-black mb-1 tracking-widest uppercase"
          style={{
            color: lvlColor.from,
            textShadow: `0 0 20px ${lvlColor.glow}`,
          }}
        >
          القنبلة على وشك الانفجار!
        </p>
        <p className="text-gray-400 text-sm mb-6">المستوى {explodedLevel} 💥</p>

        {/* Countdown circle */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 176 176">
            <circle cx="88" cy="88" r="78" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
              cx="88" cy="88" r="78"
              fill="none"
              stroke={`url(#bombGrad${explodedLevel})`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 78}`}
              strokeDashoffset={`${2 * Math.PI * 78 * (1 - countdown / 10)}`}
              style={{ transition: "stroke-dashoffset 0.2s linear" }}
            />
            <defs>
              <linearGradient id={`bombGrad${explodedLevel}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={lvlColor.from} />
                <stop offset="100%" stopColor={lvlColor.to} />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex flex-col items-center">
            <span
              className="font-black leading-none"
              style={{
                fontSize: "5rem",
                background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 25px ${lvlColor.glow})`,
              }}
            >
              {countdown}
            </span>
            <span className="text-gray-400 text-xs mt-1">ثانية</span>
          </div>
        </div>

        {/* Warning bar */}
        <div
          className="mt-6 px-6 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: `${lvlColor.from}22`, border: `1px solid ${lvlColor.from}55` }}
        >
          <span className="text-2xl animate-pulse">⚠️</span>
          <span className="text-white text-sm font-bold">استعد لقائمة المتصدرين!</span>
          <span className="text-2xl animate-pulse">⚠️</span>
        </div>

        <style>{`
          @keyframes bombShake {
            0%,100% { transform: rotate(-3deg) scale(1); }
            50% { transform: rotate(3deg) scale(1.05); }
          }
          @keyframes sparkle {
            0% { opacity: 0.5; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  // ── EXPLODE PHASE ──
  if (phase === "explode") {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "rgba(0,0,0,0.98)" }}
      >
        {/* Full screen flash */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${lvlColor.from}60 0%, transparent 70%)`,
            animation: "flashExpand 0.5s ease-out forwards",
          }}
        />

        {/* Shockwave rings */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border-4"
            style={{
              width: `${(i + 1) * 180}px`,
              height: `${(i + 1) * 180}px`,
              borderColor: i % 2 === 0 ? lvlColor.from : lvlColor.to,
              opacity: 0.4 - i * 0.07,
              animation: `shockwave ${0.5 + i * 0.15}s ease-out forwards`,
            }}
          />
        ))}

        {/* Flying debris particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              background: i % 2 === 0 ? lvlColor.from : lvlColor.to,
              left: "50%",
              top: "50%",
              animation: `debris${i} 1.5s ease-out forwards`,
            }}
          />
        ))}

        {/* Explosion emoji */}
        <div
          className="text-[140px] leading-none relative z-10"
          style={{
            filter: `drop-shadow(0 0 80px ${lvlColor.glow}) drop-shadow(0 0 40px ${lvlColor.glow})`,
            animation: "explodePop 0.5s ease-out forwards",
          }}
        >
          💥
        </div>

        <p
          className="mt-4 text-4xl font-black tracking-wider relative z-10"
          style={{
            background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 20px ${lvlColor.glow})`,
            animation: "textPop 0.4s ease-out 0.2s both",
          }}
        >
          انفجرت القنبلة!
        </p>
        <p className="text-gray-300 mt-2 text-lg relative z-10">المستوى {explodedLevel} 🎉</p>

        <style>{`
          @keyframes flashExpand { 0% { opacity: 1; } 100% { opacity: 0; } }
          @keyframes shockwave { 0% { transform: scale(0); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
          @keyframes explodePop { 0% { transform: scale(0.2) rotate(-20deg); opacity: 0; } 60% { transform: scale(1.4) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
          @keyframes textPop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        `}</style>
      </div>
    );
  }

  // ── LEADERBOARD PHASE ──
  if (phase === "leaderboard") {
    const top3 = (leaderboard ?? []).slice(0, 3);
    const rest = (leaderboard ?? []).slice(3);
    const podium = [top3[1], top3[0], top3[2]];
    const podiumRanks = ["🥈", "🥇", "🥉"];
    const podiumHeights = ["h-16", "h-24", "h-12"];
    const podiumSizes = ["w-14 h-14", "w-20 h-20", "w-12 h-12"];
    const podiumBorders = ["rgba(156,163,175,0.9)", "rgba(251,191,36,1)", "rgba(180,83,9,0.9)"];

    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(180deg, #0a0015 0%, #12001f 50%, #0a0a15 100%)" }}
        dir="rtl"
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-ping"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: lvlColor.from,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div
          className="relative flex-shrink-0 pt-10 pb-3 px-4 text-center"
          style={{
            background: `linear-gradient(180deg, ${lvlColor.from}33 0%, transparent 100%)`,
            borderBottom: `1px solid ${lvlColor.from}33`,
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-4xl">💣</span>
            <div>
              <h1
                className="text-2xl font-black"
                style={{
                  background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                انفجار القنبلة!
              </h1>
              <p className="text-gray-400 text-sm">المستوى {explodedLevel} — أبطال التفجير</p>
            </div>
            <span className="text-4xl">💥</span>
          </div>
          <p className="text-gray-600 text-xs mt-1">تُغلق تلقائياً بعد 10 ثوانٍ</p>
        </div>

        {/* Tab switcher */}
        <div className="flex-shrink-0 flex gap-2 px-4 pt-3 pb-1">
          <button
            onClick={() => setShowRewards(false)}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={!showRewards
              ? { background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`, color: "white" }
              : { background: "rgba(255,255,255,0.07)", color: "#9ca3af" }
            }
          >
            🏆 المتصدرون
          </button>
          <button
            onClick={() => setShowRewards(true)}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={showRewards
              ? { background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`, color: "white" }
              : { background: "rgba(255,255,255,0.07)", color: "#9ca3af" }
            }
          >
            🎁 الجوائز
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">

          {showRewards ? (
            /* ── REWARDS TAB ── */
            <div className="pt-4 space-y-3">
              <div
                className="rounded-2xl p-4 border"
                style={{ background: `${lvlColor.from}15`, borderColor: `${lvlColor.from}40` }}
              >
                <h3 className="text-white font-black text-center text-base mb-4">
                  🎁 جوائز المستوى {explodedLevel}
                </h3>
                {/* 1st place */}
                <div
                  className="flex items-center gap-3 p-3 rounded-2xl mb-2"
                  style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)" }}
                >
                  <span className="text-3xl">🥇</span>
                  <div className="flex-1">
                    <p className="text-yellow-400 font-black text-sm">المركز الأول</p>
                    <p className="text-white text-xs mt-0.5">
                      VIP{rewards.vipLevel} لمدة {rewards.vipDays} يوم
                    </p>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-xl text-xs font-black"
                    style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}
                  >
                    VIP{rewards.vipLevel}
                  </div>
                </div>
                {/* 2nd-6th */}
                {rewards.coinsRewards.map((coins, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-xl mb-1.5"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span className="text-xl">{["🥈", "🥉", "4️⃣", "5️⃣", "6️⃣"][i]}</span>
                    <div className="flex-1">
                      <p className="text-gray-300 text-xs font-bold">المركز {i + 2}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">💰</span>
                      <span
                        className="font-black text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {formatCoins(coins)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── LEADERBOARD TAB ── */
            <>
              {!leaderboard ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div
                    className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: `${lvlColor.from} transparent transparent transparent` }}
                  />
                  <p className="text-gray-400">جاري تحميل النتائج...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <span className="text-6xl">💣</span>
                  <p className="text-gray-400">لا يوجد مساهمون</p>
                </div>
              ) : (
                <>
                  {/* Podium */}
                  <div className="pt-4 pb-3">
                    <div className="flex items-end justify-center gap-4">
                      {podium.map((entry, idx) => {
                        if (!entry) return <div key={idx} className="flex-1 max-w-[90px]" />;
                        const isFirst = idx === 1;
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1 flex-1 max-w-[90px]">
                            <span className="text-2xl">{podiumRanks[idx]}</span>
                            <div
                              className={`${podiumSizes[idx]} rounded-full p-0.5 flex-shrink-0`}
                              style={{
                                background: `linear-gradient(135deg, ${podiumBorders[idx]}, transparent)`,
                                boxShadow: isFirst ? `0 0 25px ${lvlColor.glow}` : undefined,
                              }}
                            >
                              <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1a2e]">
                                {entry.avatarUrl
                                  ? <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                                  : (
                                    <div
                                      className="w-full h-full flex items-center justify-center font-black text-white"
                                      style={{
                                        background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`,
                                        fontSize: isFirst ? "1.2rem" : "0.9rem",
                                      }}
                                    >
                                      {entry.name?.[0] ?? "?"}
                                    </div>
                                  )
                                }
                              </div>
                            </div>
                            <p
                              className="text-center font-bold truncate w-full"
                              style={{ fontSize: isFirst ? "0.72rem" : "0.62rem", color: isFirst ? "#fbbf24" : "#e5e7eb" }}
                            >
                              {entry.name}
                            </p>
                            <div className="flex items-center gap-0.5">
                              <span style={{ fontSize: "0.6rem" }}>💰</span>
                              <span
                                className="font-black"
                                style={{
                                  fontSize: "0.65rem",
                                  background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`,
                                  WebkitBackgroundClip: "text",
                                  WebkitTextFillColor: "transparent",
                                }}
                              >
                                {formatCoins(entry.coins)}
                              </span>
                            </div>
                            <div
                              className={`w-full ${podiumHeights[idx]} rounded-t-2xl flex items-center justify-center border-t`}
                              style={{
                                background: `linear-gradient(180deg, ${lvlColor.from}33, ${lvlColor.from}11)`,
                                borderColor: `${podiumBorders[idx]}66`,
                              }}
                            >
                              <span className="font-black text-2xl" style={{ color: podiumBorders[idx] }}>
                                {entry.rank}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {rest.length > 0 && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px" style={{ background: `${lvlColor.from}33` }} />
                      <span className="text-xs font-bold" style={{ color: lvlColor.from }}>المراكز 4 - {leaderboard.length}</span>
                      <div className="flex-1 h-px" style={{ background: `${lvlColor.from}33` }} />
                    </div>
                  )}

                  <div className="space-y-2">
                    {rest.map((entry) => (
                      <div
                        key={entry.userId}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm" style={{ background: "rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                          {entry.rank}
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                          {entry.avatarUrl
                            ? <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm" style={{ background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})` }}>{entry.name?.[0] ?? "?"}</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold truncate">{entry.name}</p>
                          {entry.isVip && <p className="text-yellow-400 text-xs">VIP{entry.vipLevel}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-sm">💰</span>
                          <span className="font-black text-sm" style={{ background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            {formatCoins(entry.coins)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Bottom close button */}
        <div className="flex-shrink-0 px-4 pb-8 pt-2">
          <button
            onClick={() => {
              setPhase("done");
              phaseRef.current = "done";
              setShowLeaderboard(false);
              trackedExplodeAt.current = null;
            }}
            className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95 transition-all"
            style={{
              background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`,
              boxShadow: `0 8px 30px ${lvlColor.glow}`,
            }}
          >
            🎉 رائع! إغلاق
          </button>
        </div>
      </div>
    );
  }

  return null;
}
