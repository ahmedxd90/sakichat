import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useEffect } from "react";
import { toast } from "../lib/toast";

const SLOT_SYMBOLS = [
  { key: "cherry",  emoji: "🍒", label: "كرز",    multiplier: 2,   color: "#ef4444" },
  { key: "lemon",   emoji: "🍋", label: "ليمون",  multiplier: 3,   color: "#eab308" },
  { key: "orange",  emoji: "🍊", label: "برتقال", multiplier: 4,   color: "#f97316" },
  { key: "grape",   emoji: "🍇", label: "عنب",    multiplier: 5,   color: "#a855f7" },
  { key: "bell",    emoji: "🔔", label: "جرس",    multiplier: 10,  color: "#fbbf24" },
  { key: "star",    emoji: "⭐", label: "نجمة",   multiplier: 20,  color: "#60a5fa" },
  { key: "seven",   emoji: "7️⃣", label: "سبعة",   multiplier: 50,  color: "#10b981" },
];

const BET_AMOUNTS = [10, 50, 100, 500, 1000, 5000, 10000, 50000];

interface Props { onBack: () => void }

export default function SlotsGame({ onBack }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setProfile(p);
      }
      const { data: h } = await supabase.from('slots_history').select('*').order('created_at', { ascending: false }).limit(20);
      setHistory(h || []);
      const { data: l } = await supabase.from('slots_leaderboard').select('*, profile:profiles(*)').order('total_win', { ascending: false }).limit(10);
      setLeaderboard(l || []);
    };
    fetchData();
  }, []);

  const pullSlots = async (args: any) => ({ reels: [0, 0, 0], payout: 0, profit: 0, winType: "خسارة" });

  const [betAmount, setBetAmount] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [displayReels, setDisplayReels] = useState([0, 1, 2]);
  const [result, setResult] = useState<{ reels: number[]; payout: number; profit: number; winType: string } | null>(null);
  const [tab, setTab] = useState<"game" | "history" | "leaderboard">("game");
  const [showRules, setShowRules] = useState(false);
  const [animReels, setAnimReels] = useState([false, false, false]);

  const handlePull = async () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    setAnimReels([true, true, true]);

    try {
      const res = await pullSlots({ betAmount });

      // Animate reels stopping one by one
      setTimeout(() => {
        setDisplayReels(prev => { const n = [...prev]; n[0] = res.reels[0]; return n; });
        setAnimReels(prev => { const n = [...prev]; n[0] = false; return n; });
      }, 800);
      setTimeout(() => {
        setDisplayReels(prev => { const n = [...prev]; n[1] = res.reels[1]; return n; });
        setAnimReels(prev => { const n = [...prev]; n[1] = false; return n; });
      }, 1400);
      setTimeout(() => {
        setDisplayReels(prev => { const n = [...prev]; n[2] = res.reels[2]; return n; });
        setAnimReels(prev => { const n = [...prev]; n[2] = false; return n; });
        setResult(res);
        setSpinning(false);
        if (res.profit > 0) {
          toast.success(`🎰 ${res.winType} — ربحت ${res.payout.toLocaleString()} 🪙`);
        } else {
          toast.error("😿 خسارة! حظاً أوفر");
        }
      }, 2000);
    } catch (e: any) {
      toast.error(e.message);
      setSpinning(false);
      setAnimReels([false, false, false]);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "linear-gradient(180deg,#06060f,#0a0a1a)" }} dir="rtl">
      {/* BG orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#fbbf24,transparent 70%)", animation: "sl-pulse 5s ease-in-out infinite" }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#f97316,transparent 70%)", animation: "sl-pulse 5s ease-in-out infinite 2.5s" }} />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: "rgba(6,6,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎰</span>
              <h1 className="text-white font-black text-lg">سلوتس</h1>
              <button onClick={() => setShowRules(true)} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: "rgba(255,255,255,0.1)", color: "#9ca3af" }}>?</button>
            </div>
            <p className="text-gray-500 text-[10px]">طابق الرموز واربح!</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}>
          <span className="text-base">🪙</span>
          <span className="text-yellow-400 font-black text-sm">{(profile?.goldCoins ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pt-3 pb-2 flex-shrink-0">
        {[{ id: "game", label: "🎰 اللعبة" }, { id: "history", label: "📜 السجل" }, { id: "leaderboard", label: "🏆 المتصدرون" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
            style={tab === t.id ? { background: "linear-gradient(135deg,#d97706,#f97316)", color: "white", boxShadow: "0 4px 15px rgba(217,119,6,0.4)" } : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.06)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "game" && (
          <div className="px-4 pb-6 space-y-5">
            {/* Slot Machine */}
            <div className="flex flex-col items-center mt-4">
              {/* Machine frame */}
              <div className="relative rounded-3xl p-4" style={{ background: "linear-gradient(135deg,#1a0a00,#2d1500)", border: "2px solid rgba(251,191,36,0.4)", boxShadow: "0 0 40px rgba(251,191,36,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                {/* Reels */}
                <div className="flex gap-3">
                  {[0, 1, 2].map(i => {
                    const symIdx = displayReels[i];
                    const sym = SLOT_SYMBOLS[symIdx];
                    const isAnim = animReels[i];
                    return (
                      <div key={i} className="w-20 h-24 rounded-2xl flex flex-col items-center justify-center overflow-hidden relative"
                        style={{ background: "rgba(0,0,0,0.6)", border: "2px solid rgba(251,191,36,0.3)", boxShadow: result && !spinning ? (result.reels[0] === result.reels[1] && result.reels[1] === result.reels[2] ? `0 0 20px ${sym.color}` : "none") : "none" }}>
                        {isAnim ? (
                          <div className="flex flex-col items-center gap-1" style={{ animation: "sl-spin 0.1s linear infinite" }}>
                            {SLOT_SYMBOLS.map((s, j) => (
                              <span key={j} className="text-3xl">{s.emoji}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-5xl" style={{ animation: result && !spinning && result.profit > 0 ? "sl-pop 0.4s ease-out" : "none" }}>{sym.emoji}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Win line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 pointer-events-none" style={{ background: result && result.profit > 0 ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Result */}
              {result && !spinning && (
                <div className="mt-4 px-6 py-3 rounded-2xl text-center w-full" style={{
                  background: result.profit > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${result.profit > 0 ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.3)"}`,
                  animation: "sl-pop 0.4s ease-out",
                }}>
                  {result.profit > 0 ? (
                    <>
                      <p className="text-green-400 font-black text-lg">🎉 {result.winType}</p>
                      <p className="text-white font-black text-2xl">{result.payout.toLocaleString()} 🪙</p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-400 font-black text-lg">😿 خسارة</p>
                      <p className="text-gray-400 text-sm">حظاً أوفر!</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bet Amount */}
            <div>
              <p className="text-gray-400 text-xs mb-2.5 font-bold">💰 اختر مبلغ الرهان</p>
              <div className="grid grid-cols-4 gap-2">
                {BET_AMOUNTS.map(amt => (
                  <button key={amt} onClick={() => setBetAmount(amt)} className="py-2.5 rounded-xl text-xs font-black transition-all active:scale-95"
                    style={betAmount === amt ? { background: "linear-gradient(135deg,#d97706,#f97316)", color: "white", boxShadow: "0 4px 15px rgba(217,119,6,0.4)" } : { background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {amt >= 1000 ? `${amt / 1000}K` : amt}🪙
                  </button>
                ))}
              </div>
            </div>

            {/* Pull Button */}
            <button onClick={handlePull} disabled={spinning}
              className="w-full py-5 rounded-2xl font-black text-white text-lg transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden"
              style={{ background: spinning ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#d97706,#f97316)", boxShadow: spinning ? "none" : "0 8px 30px rgba(217,119,6,0.5)" }}>
              {!spinning && <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%)", animation: "sl-shimmer 2s ease-in-out infinite" }} />}
              <span className="relative z-10">{spinning ? "⏳ جاري الدوران..." : `🎰 اسحب • ${betAmount.toLocaleString()} 🪙`}</span>
            </button>

            {/* Symbols legend */}
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-gray-400 text-xs font-bold mb-2">🎯 الرموز والمضاعفات</p>
              <div className="grid grid-cols-4 gap-2">
                {SLOT_SYMBOLS.map(sym => (
                  <div key={sym.key} className="flex flex-col items-center gap-1 py-2 rounded-xl" style={{ background: `${sym.color}15`, border: `1px solid ${sym.color}30` }}>
                    <span className="text-xl">{sym.emoji}</span>
                    <span className="text-[10px] font-black" style={{ color: sym.color }}>×{sym.multiplier}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 text-[10px] mt-2 text-center">3 متطابقة = المضاعف الكامل • 2 متطابقة = 30% • 🍒 في أي مكان = 50%</p>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="px-4 pb-6 space-y-3 pt-2">
            <p className="text-gray-400 text-xs font-bold">📜 آخر 20 سحبة</p>
            {!history ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : history.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-10">لا توجد سحبات سابقة</p>
            ) : (history as any[]).map((spin) => (
              <div key={spin.id} className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ background: spin.profit > 0 ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)", border: spin.profit > 0 ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {spin.reels.map((r: number, i: number) => (
                      <span key={i} className="text-xl">{SLOT_SYMBOLS[r]?.emoji}</span>
                    ))}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{spin.winType}</p>
                    <p className="text-gray-500 text-[10px]">رهان: {spin.betAmount.toLocaleString()} 🪙</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`font-black text-sm ${spin.profit > 0 ? "text-green-400" : "text-red-400"}`}>
                    {spin.profit > 0 ? "+" : ""}{spin.profit.toLocaleString()} 🪙
                  </p>
                  <p className="text-gray-600 text-[10px]">{new Date(spin.createdAt).toLocaleTimeString("ar")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="px-4 pb-6 space-y-3 pt-2">
            <p className="text-gray-400 text-xs font-bold">🏆 أكثر الفائزين</p>
            {!leaderboard ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (leaderboard as any[]).map((entry, idx) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: idx === 0 ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)", border: idx === 0 ? "1px solid rgba(251,191,36,0.3)" : "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-xl font-black w-7 text-center">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg,#d97706,#f97316)" }}>
                  {entry.profile?.avatarUrl ? <img src={entry.profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-black text-sm">{entry.profile?.name?.[0] ?? "؟"}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate">{entry.profile?.name ?? "مجهول"}</p>
                  <p className="text-gray-500 text-[10px]">{entry.spinsCount} سحبة</p>
                </div>
                <div className="text-left">
                  <p className="text-yellow-400 font-black text-sm">{entry.totalWon.toLocaleString()} 🪙</p>
                  <p className="text-gray-600 text-[10px]">إجمالي الكسب</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(6,6,15,0.95)" }}>
        <span className="text-gray-500 text-xs">رصيدك الحالي</span>
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 font-black text-base">{(profile?.goldCoins ?? 0).toLocaleString()}</span>
          <span className="text-lg">🪙</span>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="absolute inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setShowRules(false)}>
          <div className="w-full rounded-t-3xl p-5 space-y-4" style={{ background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black text-lg">📖 قواعد السلوتس</h2>
              <button onClick={() => setShowRules(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl p-3" style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)" }}>
                <p className="text-yellow-400 font-black mb-1">🎯 كيف تلعب؟</p>
                <p className="text-gray-300 text-xs leading-relaxed">اختر مبلغ الرهان واضغط "اسحب". ستدور البكرات الثلاث وتتوقف على رموز عشوائية. طابق الرموز لتربح!</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-white font-black text-xs mb-2">🏆 طرق الفوز</p>
                <div className="space-y-1.5">
                  <p className="text-gray-300 text-xs">🎰 <b>3 متطابقة</b> = المضاعف الكامل للرمز</p>
                  <p className="text-gray-300 text-xs">🎰 <b>2 متطابقة</b> = 30% من المضاعف</p>
                  <p className="text-gray-300 text-xs">🍒 <b>كرز في أي مكان</b> = 50% من الرهان</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full py-3 rounded-2xl font-black text-white" style={{ background: "linear-gradient(135deg,#d97706,#f97316)" }}>
              فهمت! لنلعب 🎰
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sl-pulse { 0%,100%{transform:scale(1);opacity:.1} 50%{transform:scale(1.2);opacity:.2} }
        @keyframes sl-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes sl-pop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes sl-spin { 0%{transform:translateY(0)} 100%{transform:translateY(-100%)} }
      `}</style>
    </div>
  );
}
