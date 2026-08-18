// @ts-nocheck
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useState, useEffect, useRef } from "react";

interface RoomBombSheetProps {
  roomId: Id<"rooms">;
  onClose: () => void;
}

const MAX_LEVEL = 10;
const LEVEL_COLORS = [
  { from: "#f59e0b", to: "#ef4444", name: "نار" },
  { from: "#a855f7", to: "#7c3aed", name: "بنفسج" },
  { from: "#3b82f6", to: "#1d4ed8", name: "أزرق" },
  { from: "#ff006e", to: "#8338ec", name: "وردي" },
  { from: "#10b981", to: "#059669", name: "أخضر" },
  { from: "#f97316", to: "#ea580c", name: "برتقالي" },
  { from: "#ec4899", to: "#db2777", name: "زهري" },
  { from: "#06b6d4", to: "#0891b2", name: "سماوي" },
  { from: "#84cc16", to: "#65a30d", name: "ليموني" },
  { from: "#8b5cf6", to: "#7c3aed", name: "بنفسجي" },
];

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

// SVG Icons
function BombIcon({ size = 32, color = "#fff", glow = false }: { size?: number; color?: string; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={glow ? { filter: `drop-shadow(0 0 8px ${color})` } : {}}>
      <circle cx="30" cy="36" r="20" fill={color} opacity="0.15" stroke={color} strokeWidth="2.5" />
      <circle cx="30" cy="36" r="14" fill={color} opacity="0.25" />
      <circle cx="30" cy="36" r="8" fill={color} opacity="0.5" />
      <path d="M30 16 L34 8 L38 10 L36 4 L42 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="44" cy="4" r="3" fill="#fbbf24" opacity="0.9" />
      <path d="M44 4 Q46 2 48 5 Q50 8 47 10" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.8" />
    </svg>
  );
}

function TrophyIcon({ size = 24, color = "#fbbf24" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 01-2-2V5h4" />
      <path d="M18 9h2a2 2 0 002-2V5h-4" />
      <path d="M12 17c-3.31 0-6-2.69-6-6V3h12v8c0 3.31-2.69 6-6 6z" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function GiftIcon({ size = 20, color = "#a855f7" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function MapIcon({ size = 20, color = "#06b6d4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function MedalIcon({ rank, size = 28 }: { rank: number; size?: number }) {
  const colors = { 1: ["#fbbf24", "#f59e0b"], 2: ["#9ca3af", "#6b7280"], 3: ["#cd7c2f", "#b45309"] };
  const c = colors[rank as 1 | 2 | 3] || ["#6b7280", "#4b5563"];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="20" r="10" fill={`url(#medal${rank})`} stroke={c[0]} strokeWidth="1.5" />
      <defs>
        <radialGradient id={`medal${rank}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={c[0]} />
          <stop offset="100%" stopColor={c[1]} />
        </radialGradient>
      </defs>
      <path d="M12 10 L10 2 L16 5 L22 2 L20 10" fill={c[0]} opacity="0.8" />
      <text x="16" y="24" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{rank}</text>
    </svg>
  );
}

function WaveBar({ index, color, active }: { index: number; color: string; active: boolean }) {
  const heights = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4, 0.8, 0.5];
  const h = heights[index % heights.length];
  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{
        width: "3px",
        height: `${8 + h * 24}px`,
        background: active ? `linear-gradient(180deg, ${color}, ${color}88)` : "rgba(255,255,255,0.1)",
        animation: active ? `waveBar ${0.6 + index * 0.07}s ease-in-out infinite alternate` : "none",
        animationDelay: `${index * 0.05}s`,
        boxShadow: active ? `0 0 6px ${color}88` : "none",
      }}
    />
  );
}

function SoundWaves({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 12 }, (_, i) => (
        <WaveBar key={i} index={i} color={color} active={active} />
      ))}
    </div>
  );
}

function ExplosionRing({ color, delay }: { color: string; delay: number }) {
  return (
    <div
      className="absolute inset-0 rounded-full border-2"
      style={{
        borderColor: color,
        animation: `explodeRing 1.5s ${delay}s ease-out infinite`,
        opacity: 0,
      }}
    />
  );
}

export default function RoomBombSheet({ roomId, onClose }: RoomBombSheetProps) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "rewards" | "map">("leaderboard");
  const bombState = useQuery(api.roomBomb.getRoomBombState, { roomId });
  const leaderboard = useQuery(api.roomBomb.getRoomBombLeaderboard, { roomId, level: selectedLevel });
  const allConfigs = useQuery(api.roomBomb.getAllLevelConfigs);

  const currentLevel = bombState?.currentLevel ?? 1;
  const totalCoins = bombState?.totalCoinsInLevel ?? 0;
  const threshold = bombState?.threshold ?? 1_000_000;
  const isExploding = bombState?.isExploding ?? false;
  const progress = Math.min((totalCoins / threshold) * 100, 100);
  const isDone = currentLevel > MAX_LEVEL;

  const lvlIdx = Math.min(currentLevel - 1, LEVEL_COLORS.length - 1);
  const lvlColor = LEVEL_COLORS[lvlIdx];
  const currentCfg = bombState?.levelConfig;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="relative rounded-t-3xl flex flex-col overflow-hidden"
        style={{
          height: "92%",
          background: "linear-gradient(180deg, #060010 0%, #0d0020 50%, #060010 100%)",
          borderTop: `1px solid ${lvlColor.from}40`,
          boxShadow: `0 -20px 60px ${lvlColor.from}20`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background grid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(${lvlColor.from}20 1px, transparent 1px), linear-gradient(90deg, ${lvlColor.from}20 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }} />
        </div>

        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 50% 0%, ${lvlColor.from}30 0%, transparent 70%)`,
        }} />

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1 rounded-full" style={{ background: `${lvlColor.from}60` }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <SoundWaves color={lvlColor.from} active={isExploding} />
              <div className="relative">
                <BombIcon size={36} color={lvlColor.from} glow />
                {isExploding && (
                  <>
                    <ExplosionRing color={lvlColor.from} delay={0} />
                    <ExplosionRing color={lvlColor.to} delay={0.5} />
                    <ExplosionRing color={lvlColor.from} delay={1} />
                  </>
                )}
              </div>
              <SoundWaves color={lvlColor.to} active={isExploding} />
            </div>
            <h2 className="font-black text-base" style={{
              background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>قنبلة الغرفة</h2>
          </div>

          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">

          {/* Current Level Card */}
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{
            background: `linear-gradient(135deg, ${lvlColor.from}18, ${lvlColor.to}0a)`,
            border: `1px solid ${lvlColor.from}35`,
            boxShadow: `0 0 30px ${lvlColor.from}15, inset 0 0 20px ${lvlColor.from}08`,
          }}>
            {/* Shimmer overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `linear-gradient(105deg, transparent 40%, ${lvlColor.from}08 50%, transparent 60%)`,
              animation: "cardShimmer 3s ease-in-out infinite",
            }} />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Bomb icon with level badge */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                    background: `linear-gradient(135deg, ${lvlColor.from}25, ${lvlColor.to}15)`,
                    border: `1.5px solid ${lvlColor.from}50`,
                    boxShadow: `0 0 20px ${lvlColor.from}40`,
                  }}>
                    <BombIcon size={32} color={lvlColor.from} glow />
                  </div>
                  {!isDone && (
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`, boxShadow: `0 0 8px ${lvlColor.from}80` }}>
                      {currentLevel}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-black text-base">
                    {isDone ? "اكتملت جميع المستويات!" : `المستوى ${currentLevel} / ${MAX_LEVEL}`}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: `${lvlColor.from}cc` }}>
                    {isDone ? "ستُعاد القنبلة من المستوى 1" : isExploding ? "جاري الانفجار..." : "جمع الهدايا"}
                  </p>
                </div>
              </div>
              {!isDone && (
                <div className="text-right">
                  <p className="text-white font-black text-lg">{formatCoins(totalCoins)}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>/ {formatCoins(threshold)}</p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {!isDone && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-bold" style={{ color: `${lvlColor.from}cc` }}>التقدم</span>
                  <span className="text-[10px] font-bold text-white">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${lvlColor.from}20` }}>
                  <div className="h-full rounded-full relative overflow-hidden transition-all duration-700" style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${lvlColor.from}, ${lvlColor.to})`,
                    boxShadow: `0 0 12px ${lvlColor.from}aa`,
                  }}>
                    <div className="absolute inset-0" style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                      animation: "shimmer 1.8s infinite",
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* Exploding state */}
            {isExploding && (
              <div className="mt-3 flex items-center justify-center gap-3 py-3 rounded-xl" style={{
                background: `${lvlColor.from}15`,
                border: `1px solid ${lvlColor.from}40`,
                animation: "pulseGlow 1s ease-in-out infinite",
              }}>
                <div className="relative w-8 h-8">
                  <BombIcon size={32} color={lvlColor.from} glow />
                  <ExplosionRing color={lvlColor.from} delay={0} />
                </div>
                <span className="font-black text-sm" style={{ color: lvlColor.from }}>القنبلة على وشك الانفجار!</span>
                <SoundWaves color={lvlColor.from} active={true} />
              </div>
            )}

            {/* Reward preview */}
            {!isDone && currentCfg && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "الأول", value: `VIP${currentCfg.firstVip}`, sub: `${currentCfg.firstVipDays} أيام`, color: "#fbbf24" },
                  { label: "الثاني", value: formatCoins(currentCfg.secondCoins), sub: "عملة", color: "#9ca3af" },
                  { label: "الثالث", value: formatCoins(currentCfg.thirdCoins), sub: "عملة", color: "#cd7c2f" },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-xl p-2.5 text-center" style={{
                    background: `${item.color}12`,
                    border: `1px solid ${item.color}30`,
                  }}>
                    <div className="flex justify-center mb-1">
                      <MedalIcon rank={idx + 1} size={22} />
                    </div>
                    <p className="font-black text-[11px]" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-gray-500 text-[9px]">{item.sub}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {([
              { id: "leaderboard", label: "المتصدرون", icon: <TrophyIcon size={14} color="currentColor" /> },
              { id: "rewards", label: "الجوائز", icon: <GiftIcon size={14} color="currentColor" /> },
              { id: "map", label: "الخريطة", icon: <MapIcon size={14} color="currentColor" /> },
            ] as const).map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                style={activeTab === tab.id
                  ? { background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})`, color: "white", boxShadow: `0 4px 15px ${lvlColor.from}40` }
                  : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" }
                }>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* LEADERBOARD TAB */}
          {activeTab === "leaderboard" && (
            <>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((lvl) => {
                  const c = LEVEL_COLORS[lvl - 1];
                  const isActive = selectedLevel === lvl;
                  return (
                    <button key={lvl} onClick={() => setSelectedLevel(lvl)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
                      style={isActive
                        ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})`, color: "white", boxShadow: `0 4px 12px ${c.from}50` }
                        : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" }
                      }>
                      M{lvl}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                {!leaderboard ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${lvlColor.from} transparent transparent transparent` }} />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <BombIcon size={40} color={lvlColor.from} />
                    <p className="text-gray-400 text-sm">لا يوجد مساهمون بعد</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {leaderboard.map((entry, i) => (
                      <div key={entry.userId} className="flex items-center gap-3 px-4 py-3" style={{
                        background: i < 3 ? `${LEVEL_COLORS[i]?.from ?? lvlColor.from}08` : "transparent",
                      }}>
                        <div className="w-8 flex items-center justify-center flex-shrink-0">
                          {i < 3 ? <MedalIcon rank={i + 1} size={28} /> : (
                            <span className="text-gray-500 text-sm font-black">{i + 1}</span>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{
                          border: i === 0 ? `2px solid ${lvlColor.from}` : "1.5px solid rgba(255,255,255,0.1)",
                          boxShadow: i === 0 ? `0 0 10px ${lvlColor.from}60` : "none",
                        }}>
                          {entry.avatarUrl
                            ? <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                                style={{ background: `linear-gradient(135deg, ${lvlColor.from}, ${lvlColor.to})` }}>
                                {entry.name?.[0] ?? "?"}
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold truncate">{entry.name}</p>
                          {entry.isVip && (
                            <p className="text-[10px] font-bold" style={{ color: lvlColor.from }}>VIP {entry.vipLevel}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: `${lvlColor.from}30` }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill={lvlColor.from}><circle cx="12" cy="12" r="10" /></svg>
                          </div>
                          <span className="font-black text-sm" style={{ color: lvlColor.from }}>{formatCoins(entry.coins)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* REWARDS TAB */}
          {activeTab === "rewards" && (
            <div className="space-y-3">
              {allConfigs ? allConfigs.map((cfg) => {
                const c = LEVEL_COLORS[cfg.level - 1];
                const isCurrent = currentLevel === cfg.level;
                const isDoneLvl = currentLevel > cfg.level;
                return (
                  <div key={cfg.level} className="rounded-2xl p-4 relative overflow-hidden" style={{
                    background: isCurrent ? `${c.from}12` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isCurrent ? c.from + "40" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isCurrent ? `0 0 20px ${c.from}15` : "none",
                  }}>
                    {isDoneLvl && (
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          <span className="text-green-400 font-black text-sm">مكتمل</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, boxShadow: `0 4px 12px ${c.from}50` }}>
                        {cfg.level}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-black text-sm">المستوى {cfg.level}</p>
                        <p className="text-gray-500 text-[10px]">{formatCoins(cfg.threshold)} هدايا مطلوبة</p>
                      </div>
                      {isCurrent && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${c.from}20`, border: `1px solid ${c.from}40` }}>
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.from }} />
                          <span className="text-[10px] font-bold" style={{ color: c.from }}>الحالي</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {[
                        { rank: 1, label: "المركز الأول", value: `VIP${cfg.firstVip} — ${cfg.firstVipDays} أيام${cfg.firstCoins > 0 ? ` + ${formatCoins(cfg.firstCoins)}` : ""}`, color: "#fbbf24" },
                        { rank: 2, label: "المركز الثاني", value: `${formatCoins(cfg.secondCoins)} عملة${cfg.secondVip ? ` + VIP${cfg.secondVip}` : ""}`, color: "#9ca3af" },
                        { rank: 3, label: "المركز الثالث", value: `${formatCoins(cfg.thirdCoins)} عملة${cfg.thirdVip ? ` + VIP${cfg.thirdVip}` : ""}`, color: "#cd7c2f" },
                      ].map((item) => (
                        <div key={item.rank} className="flex items-center gap-3 p-2.5 rounded-xl" style={{
                          background: `${item.color}0a`,
                          border: `1px solid ${item.color}20`,
                        }}>
                          <MedalIcon rank={item.rank} size={26} />
                          <div className="flex-1">
                            <p className="text-xs font-bold" style={{ color: item.color }}>{item.label}</p>
                            <p className="text-gray-300 text-[11px]">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }) : (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${lvlColor.from} transparent transparent transparent` }} />
                </div>
              )}
            </div>
          )}

          {/* MAP TAB */}
          {activeTab === "map" && (
            <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-2 mb-4">
                <MapIcon size={18} color={lvlColor.from} />
                <h3 className="text-white font-black text-sm">خريطة المستويات العشرة</h3>
              </div>
              <div className="space-y-2">
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((lvl) => {
                  const c = LEVEL_COLORS[lvl - 1];
                  const isDoneLvl = currentLevel > lvl;
                  const isCurrent = currentLevel === lvl;
                  const cfg = allConfigs?.find((x) => x.level === lvl);
                  return (
                    <div key={lvl} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{
                      background: isCurrent ? `${c.from}15` : "transparent",
                      border: isCurrent ? `1px solid ${c.from}35` : "1px solid transparent",
                    }}>
                      {/* Status icon */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                        background: isDoneLvl ? "rgba(16,185,129,0.15)" : isCurrent ? `${c.from}20` : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isDoneLvl ? "rgba(16,185,129,0.3)" : isCurrent ? c.from + "40" : "rgba(255,255,255,0.08)"}`,
                      }}>
                        {isDoneLvl ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : isCurrent ? (
                          <BombIcon size={16} color={c.from} glow />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-xs font-black">المستوى {lvl}</p>
                          {isCurrent && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.from }} />}
                        </div>
                        <p className="text-gray-600 text-[10px]">VIP{cfg?.firstVip ?? "?"} للأول</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold" style={{ color: isDoneLvl ? "#10b981" : isCurrent ? c.from : "#4b5563" }}>
                          {cfg ? formatCoins(cfg.threshold) : "..."}
                        </p>
                        <p className="text-gray-600 text-[9px]">هدايا</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-3 rounded-xl flex items-center gap-2" style={{
                background: `${lvlColor.from}10`,
                border: `1px solid ${lvlColor.from}25`,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={lvlColor.from} strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
                <p className="text-xs font-bold" style={{ color: lvlColor.from }}>بعد المستوى 10 تُعاد القنبلة من المستوى 1</p>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes cardShimmer { 0% { transform: translateX(-100%); } 50% { transform: translateX(100%); } 100% { transform: translateX(100%); } }
        @keyframes waveBar { 0% { transform: scaleY(0.4); opacity: 0.6; } 100% { transform: scaleY(1); opacity: 1; } }
        @keyframes explodeRing { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 10px rgba(255,100,0,0.3); } 50% { box-shadow: 0 0 25px rgba(255,100,0,0.7); } }
      `}</style>
    </div>
  );
}
