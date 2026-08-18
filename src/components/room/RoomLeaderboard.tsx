// @ts-nocheck
import { Id } from "../../../convex/_generated/dataModel";
import { VipFrame, VipName, VipBadge } from "../VipBadge";

interface RoomLeaderboardProps {
  leaderboard: any[] | undefined;
  leaderboardPeriod: "daily" | "weekly" | "monthly";
  onClose: () => void;
  onPeriodChange: (period: "daily" | "weekly" | "monthly") => void;
}

export default function RoomLeaderboard({
  leaderboard,
  leaderboardPeriod,
  onClose,
  onPeriodChange,
}: RoomLeaderboardProps) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-white/10 animate-slide-up-sheet flex flex-col"
        style={{ height: "88%", background: "linear-gradient(180deg, #0a0015 0%, #12001f 60%, #0a0a15 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0" style={{ borderColor: "rgba(251,191,36,0.2)" }}>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(251,191,36,0.1)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="text-white font-black text-base">المتصدرون</span>
            <span className="text-xl">🏆</span>
          </div>
          <div className="w-8" />
        </div>

        {/* Period tabs */}
        <div className="flex px-4 py-2.5 gap-2 flex-shrink-0">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${leaderboardPeriod === p ? "text-black" : "text-gray-400"}`}
              style={leaderboardPeriod === p
                ? { background: "linear-gradient(135deg, #fbbf24, #f59e0b)", boxShadow: "0 4px 15px rgba(251,191,36,0.3)" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {p === "daily" ? "اليوم" : p === "weekly" ? "الأسبوع" : "الشهر"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-8 min-h-0">
          {!leaderboard ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-5xl">🏆</span>
              <p className="text-gray-400 text-sm">لا توجد بيانات لهذه الفترة</p>
              <p className="text-gray-600 text-xs">أرسل هدايا لتظهر في الترتيب!</p>
            </div>
          ) : (() => {
            const top3 = leaderboard.slice(0, 3);
            const podium = [top3[1], top3[0], top3[2]];
            const crowns = ["🥈", "👑", "🥉"];
            const heights = ["h-16", "h-24", "h-12"];
            const avatarSizes = ["w-14 h-14", "w-20 h-20", "w-12 h-12"];
            const borderColors = ["rgba(156,163,175,0.8)", "rgba(251,191,36,0.9)", "rgba(180,83,9,0.8)"];
            const glows = ["0 0 15px rgba(156,163,175,0.3)", "0 0 25px rgba(251,191,36,0.5)", "0 0 15px rgba(180,83,9,0.3)"];
            const podiumBgs = [
              "linear-gradient(180deg, rgba(156,163,175,0.2), rgba(156,163,175,0.05))",
              "linear-gradient(180deg, rgba(251,191,36,0.3), rgba(251,191,36,0.05))",
              "linear-gradient(180deg, rgba(180,83,9,0.2), rgba(180,83,9,0.05))",
            ];
            return (
              <>
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-end justify-center gap-3">
                    {podium.map((entry, idx) => {
                      if (!entry) return <div key={idx} className="flex-1" />;
                      const isFirst = idx === 1;
                      const entryVipLevel = entry.vipLevel;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                          <div className="text-xl">{crowns[idx]}</div>
                          <div className="relative">
                            <div className={`${avatarSizes[idx]} rounded-full p-0.5`}
                              style={{ background: `linear-gradient(135deg, ${borderColors[idx]}, transparent)`, boxShadow: glows[idx] }}>
                              <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1a2e]">
                                {entry.avatarUrl
                                  ? <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center"
                                      style={{ background: isFirst ? "linear-gradient(135deg, #92400e, #b45309)" : "linear-gradient(135deg, #4b5563, #6b7280)" }}>
                                      <span className="text-white font-black" style={{ fontSize: isFirst ? "1.1rem" : "0.9rem" }}>{entry.name[0]}</span>
                                    </div>
                                }
                              </div>
                            </div>
                            {entry.isVip && <div className="absolute -top-1 -right-1"><VipBadge size="sm" level={entryVipLevel} /></div>}
                          </div>
                          <div className="text-center px-1">
                            {entry.isVip
                              ? <VipName name={entry.name} level={entryVipLevel} />
                              : <p className="text-white font-bold truncate" style={{ fontSize: isFirst ? "0.72rem" : "0.62rem", maxWidth: "68px" }}>{entry.name}</p>
                            }
                            <div className="flex items-center justify-center gap-0.5 mt-0.5">
                              <span style={{ fontSize: "0.58rem" }}>🪙</span>
                              <span className="text-yellow-400 font-bold" style={{ fontSize: "0.58rem" }}>
                                {entry.totalCoins >= 1000 ? `${(entry.totalCoins / 1000).toFixed(1)}k` : entry.totalCoins}
                              </span>
                            </div>
                          </div>
                          <div className={`w-full ${heights[idx]} rounded-t-2xl flex items-center justify-center border-t`}
                            style={{ background: podiumBgs[idx], borderColor: borderColors[idx] }}>
                            <span className="font-black text-2xl" style={{ color: borderColors[idx] }}>{entry.rank}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {leaderboard.slice(3).length > 0 && (
                  <div className="px-4 mt-2 space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px" style={{ background: "rgba(251,191,36,0.15)" }} />
                      <span className="text-yellow-600 text-xs font-bold">المراكز 4 - {leaderboard.length}</span>
                      <div className="flex-1 h-px" style={{ background: "rgba(251,191,36,0.15)" }} />
                    </div>
                    {leaderboard.slice(3).map((entry) => {
                      const entryVipLevel = entry.vipLevel;
                      return (
                        <div key={entry.userId} className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <span className="text-gray-300 font-black text-xs">{entry.rank}</span>
                          </div>
                          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                            <VipFrame isVip={entry.isVip} level={entryVipLevel}>
                              {entry.avatarUrl
                                ? <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"><span className="text-white font-bold text-xs">{entry.name[0]}</span></div>
                              }
                            </VipFrame>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              {entry.isVip ? <VipName name={entry.name} level={entryVipLevel} /> : <span className="text-white text-xs font-bold truncate">{entry.name}</span>}
                              {entry.isVip && <VipBadge size="sm" level={entryVipLevel} />}
                            </div>
                            <p className="text-gray-600 text-[10px] font-mono">#{entry.sakiId}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs">🪙</span>
                            <span className="text-yellow-400 text-xs font-bold">
                              {entry.totalCoins >= 1000 ? `${(entry.totalCoins / 1000).toFixed(1)}k` : entry.totalCoins}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
