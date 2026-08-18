import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { VipBadge, VipName } from "../components/VipBadge";

interface CpLeaderboardPageProps { onBack: () => void; }

interface Particle { id: number; x: number; y: number; size: number; delay: number; duration: number; emoji: string; }

export default function CpLeaderboardPage({ onBack }: CpLeaderboardPageProps) {
  const data = useQuery(api.leaderboards.getCpLeaderboard);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const emojis = ["💍", "💕", "❤️", "💑", "🌹", "💫", "✨", "💎"];
    const p = Array.from({ length: 18 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: 10 + Math.random() * 14, delay: Math.random() * 4,
      duration: 3 + Math.random() * 3,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles(p);
  }, []);

  const top3 = data?.slice(0, 3) ?? [];
  const rest = data?.slice(3) ?? [];
  const podium = [top3[1], top3[0], top3[2]];
  const podiumColors = ["#9ca3af", "#ff6b9d", "#c44dff"];
  const podiumGlows = ["rgba(156,163,175,0.4)", "rgba(255,107,157,0.7)", "rgba(196,77,255,0.4)"];
  const podiumHeights = ["h-16", "h-24", "h-12"];
  const podiumSizes = ["w-14 h-14", "w-20 h-20", "w-12 h-12"];
  const crowns = ["🥈", "💍", "🥉"];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(180deg, #1a0010 0%, #2d0020 40%, #1a0010 100%)" }} dir="rtl">
      {/* Floating particles */}
      {particles.map((p) => (
        <div key={p.id} className="absolute pointer-events-none select-none" style={{
          left: `${p.x}%`, top: `${p.y}%`, fontSize: `${p.size}px`,
          animation: `floatUp ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
          opacity: 0.18,
        }}>{p.emoji}</div>
      ))}

      {/* Top radial glow */}
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(255,107,157,0.25) 0%, transparent 70%)",
      }} />

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 100%, rgba(196,77,255,0.12) 0%, transparent 70%)",
      }} />

      {/* Animated wave lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute w-full" style={{
            top: `${20 + i * 30}%`, height: "1px",
            background: `linear-gradient(90deg, transparent, rgba(255,107,157,${0.06 + i * 0.02}), transparent)`,
            animation: `waveLine ${4 + i}s ${i * 0.5}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4 border-b" style={{ borderColor: "rgba(255,107,157,0.15)", background: "rgba(26,0,16,0.6)", backdropFilter: "blur(20px)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,107,157,0.1)", border: "1px solid rgba(255,107,157,0.25)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b9d" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl" style={{ filter: "drop-shadow(0 0 8px rgba(255,107,157,0.8))" }}>💑</span>
            <h1 className="font-black text-lg" style={{ background: "linear-gradient(135deg, #fda4af, #ff6b9d, #c44dff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>أفضل CP</h1>
            <span className="text-2xl" style={{ filter: "drop-shadow(0 0 8px rgba(255,107,157,0.8))" }}>💑</span>
          </div>
          <p className="text-pink-600/60 text-[10px] mt-0.5">أجمل الأزواج في SAKU 💍</p>
        </div>
        <div className="w-9" />
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto pb-8">
        {!data ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">💑</span>
            <p className="text-gray-400 text-sm">لا توجد أزواج CP حتى الآن</p>
            <p className="text-gray-600 text-xs">أرسل خاتم CP لشريكك لتظهر هنا</p>
          </div>
        ) : (
          <>
            {/* Podium - same style as WealthPage but with CP couple avatars */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-end justify-center gap-3">
                {podium.map((entry, idx) => {
                  if (!entry) return <div key={idx} className="flex-1" />;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                      <div className="text-xl" style={{ filter: idx === 1 ? "drop-shadow(0 0 6px rgba(255,107,157,0.9))" : "none" }}>{crowns[idx]}</div>
                      {/* Couple avatars stacked */}
                      <div className="relative" style={{ width: podiumSizes[idx].split(" ")[0].replace("w-", "") + "px" }}>
                        <div className={`${podiumSizes[idx]} relative`} style={{ boxShadow: `0 0 24px ${podiumGlows[idx]}` }}>
                          {/* Two overlapping avatars */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-full h-full">
                              {/* Avatar 1 - left */}
                              <div className="absolute left-0 top-0 rounded-full overflow-hidden border-2" style={{
                                width: "60%", height: "60%",
                                borderColor: podiumColors[idx],
                                boxShadow: `0 0 8px ${podiumGlows[idx]}`,
                              }}>
                                {entry.user1Avatar ? <img src={entry.user1Avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ff6b9d, #c44dff)" }}><span className="text-white font-black" style={{ fontSize: "8px" }}>{entry.user1Name[0]}</span></div>}
                              </div>
                              {/* Avatar 2 - right bottom */}
                              <div className="absolute right-0 bottom-0 rounded-full overflow-hidden border-2" style={{
                                width: "60%", height: "60%",
                                borderColor: podiumColors[idx],
                                boxShadow: `0 0 8px ${podiumGlows[idx]}`,
                              }}>
                                {entry.user2Avatar ? <img src={entry.user2Avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #c44dff, #ff6b9d)" }}><span className="text-white font-black" style={{ fontSize: "8px" }}>{entry.user2Name[0]}</span></div>}
                              </div>
                              {/* Heart in center */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span style={{ fontSize: "10px", filter: "drop-shadow(0 0 4px rgba(255,107,157,0.9))" }}>💕</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center px-1">
                        <p className="text-white font-bold truncate text-[10px]" style={{ maxWidth: "68px" }}>{entry.user1Name}</p>
                        <p className="text-pink-400/70 font-bold truncate text-[9px]" style={{ maxWidth: "68px" }}>& {entry.user2Name}</p>
                        <div className="flex items-center justify-center gap-0.5 mt-0.5">
                          <span className="text-[9px]">💍</span>
                          <span className="font-bold text-[9px]" style={{ color: podiumColors[idx] }}>{entry.ringName}</span>
                        </div>
                      </div>
                      <div className={`w-full ${podiumHeights[idx]} rounded-t-2xl flex items-center justify-center border-t`} style={{ background: `linear-gradient(180deg, ${podiumColors[idx]}35, transparent)`, borderColor: podiumColors[idx] }}>
                        <span className="font-black text-2xl" style={{ color: podiumColors[idx] }}>{entry.rank}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rest */}
            {rest.length > 0 && (
              <div className="px-4 mt-2 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,107,157,0.2)" }} />
                  <span className="text-pink-600 text-xs font-bold">المراكز 4 - {data.length}</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,107,157,0.2)" }} />
                </div>
                {rest.map((pair) => (
                  <div key={`${pair.user1Id}-${pair.user2Id}`} className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,107,157,0.12)", border: "1px solid rgba(255,107,157,0.2)" }}>
                      <span className="text-pink-400 font-black text-xs">{pair.rank}</span>
                    </div>
                    {/* Overlapping avatars */}
                    <div className="flex items-center flex-shrink-0 relative" style={{ width: "52px", height: "36px" }}>
                      <div className="absolute left-0 w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: "rgba(255,107,157,0.5)", zIndex: 2 }}>
                        {pair.user1Avatar ? <img src={pair.user1Avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center"><span className="text-white text-[10px] font-bold">{pair.user1Name[0]}</span></div>}
                      </div>
                      <div className="absolute right-0 w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: "rgba(196,77,255,0.5)", zIndex: 1 }}>
                        {pair.user2Avatar ? <img src={pair.user2Avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"><span className="text-white text-[10px] font-bold">{pair.user2Name[0]}</span></div>}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[10px] font-bold truncate">{pair.user1Name} 💕 {pair.user2Name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px]">💍</span>
                        <span className="text-pink-400/70 text-[9px] truncate">{pair.ringName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px]">🪙</span>
                      <span className="text-pink-400 text-[10px] font-bold">{pair.ringPrice >= 1000 ? `${(pair.ringPrice / 1000).toFixed(1)}k` : pair.ringPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes floatUp { 0% { transform: translateY(0) rotate(-8deg) scale(1); } 100% { transform: translateY(-20px) rotate(8deg) scale(1.1); } }
        @keyframes waveLine { 0% { transform: scaleX(0.3) translateX(-30%); opacity: 0.3; } 100% { transform: scaleX(1.2) translateX(10%); opacity: 1; } }
      `}</style>
    </div>
  );
}
