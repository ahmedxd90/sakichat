// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const FOOD_ITEMS = [
  { key: "corn",   label: "ذرة",    multiplier: 5,  emoji: "🌽", color: "#fbbf24", group: "veg" },
  { key: "tomato", label: "طماطم",  multiplier: 5,  emoji: "🍅", color: "#f87171", group: "veg" },
  { key: "pepper", label: "فلفل",   multiplier: 5,  emoji: "🌶️", color: "#fb923c", group: "veg" },
  { key: "carrot", label: "جزر",    multiplier: 5,  emoji: "🥕", color: "#f97316", group: "veg" },
  { key: "shrimp", label: "جمبري",  multiplier: 10, emoji: "🍤", color: "#e879f9", group: "meat" },
  { key: "cow",    label: "لحم",    multiplier: 15, emoji: "🐄", color: "#a78bfa", group: "meat" },
  { key: "fish",   label: "سمكة",   multiplier: 25, emoji: "🐟", color: "#60a5fa", group: "meat" },
  { key: "chick",  label: "دجاج",   multiplier: 45, emoji: "🐥", color: "#fde047", group: "meat" },
];

const BET_AMOUNTS = [1000, 10000, 50000, 100000];
const BET_COLORS  = ["#22c55e", "#f59e0b", "#3b82f6", "#e91e63"];

interface ToastMsg { id: number; text: string; color: string }
interface Props { onBack: () => void }

export default function GreedyCatGame({ onBack }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [lastRounds, setLastRounds] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [todayWinnings, setTodayWinnings] = useState<any>(null);
  const [betsSummary, setBetsSummary] = useState<any>(null);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [recentBets, setRecentBets] = useState<any[]>([]);

  const [resultRoundId, setResultRoundId] = useState<string | null>(null);
  const [topBettors, setTopBettors] = useState<any[]>([]);
  const [finishedRoundMyBets, setFinishedRoundMyBets] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setProfile(p);
      }
      const { data: round } = await supabase.from('greedy_cat_rounds').select('*').eq('status', 'betting').order('created_at', { ascending: false }).limit(1).single();
      setCurrentRound(round);
      const { data: last } = await supabase.from('greedy_cat_rounds').select('*').eq('status', 'finished').order('created_at', { ascending: false }).limit(10);
      setLastRounds(last || []);
    };
    fetchData();
  }, []);

  const [lastRoundWinnerKey, setLastRoundWinnerKey] = useState<string | null>(null);
  const placeBet = async (args: any) => {
    const { error } = await supabase.from('greedy_cat_bets').insert({
      round_id: args.roundId,
      user_id: profile.user_id,
      food_key: args.foodKey,
      amount: args.amount
    });
    if (error) throw error;
  };
  const forceRestart = async () => {
    // Logic for force restart
  };

  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [placing, setPlacing]   = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRules, setShowRules]             = useState(false);
  const [phase, setPhase] = useState<"betting"|"stopped"|"spinning"|"result">("betting");
  const [winnerKey, setWinnerKey]       = useState<string | null>(null);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [showResultSheet, setShowResultSheet] = useState(false);
  const [winnerFlash, setWinnerFlash]         = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastIdRef = useRef(0);

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevRoundIdRef = useRef<string | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartingRef  = useRef(false);

  // ── toast helper ──────────────────────────────────────────────────────────
  const showToast = (text: string, color = "#22c55e") => {
    const id = ++toastIdRef.current;
    setToasts(p => [...p, { id, text, color }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 1000);
  };

  // ── timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentRound) return;
    const update = () => setTimeLeft(Math.ceil(Math.max(0, currentRound.endsAt - Date.now()) / 1000));
    update();
    intervalRef.current = setInterval(update, 200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentRound?.endsAt]);

  // ── auto-restart ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentRound === undefined) return;
    const isStuck = currentRound !== null && currentRound.status === "betting" && Date.now() >= currentRound.endsAt + 15000;
    const noRound = currentRound === null;
    if ((noRound || isStuck) && !restartingRef.current && phase !== "spinning" && phase !== "result") {
      restartingRef.current = true;
      forceRestart().catch(() => {}).finally(() => setTimeout(() => { restartingRef.current = false; }, 5000));
    }
    if (currentRound !== null && !isStuck) restartingRef.current = false;
  }, [currentRound?.id, currentRound?.status, currentRound?.endsAt, phase]);

  // ── phase sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentRound) return;
    const now = Date.now();
    if (currentRound.status === "betting" && currentRound.endsAt > now) setPhase("betting");
    else if (currentRound.status === "betting" && currentRound.endsAt <= now) setPhase("stopped");
  }, [currentRound?.id, currentRound?.status, timeLeft === 0]);

  // ── spin animation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lastRounds || lastRounds.length === 0) return;
    const last = lastRounds[0];
    if (!last.winningFood) return;
    if (last._id === prevRoundIdRef.current) return;
    prevRoundIdRef.current = last._id;
    setResultRoundId(last._id);
    setLastRoundWinnerKey(last.winningFood);
    setWinnerKey(null);
    setShowResultSheet(false);
    setPhase("spinning");
    let flashCount = 0;
    const totalFlashes = 28;
    const flashInterval = setInterval(() => {
      setHighlightKey(FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)].key);
      flashCount++;
      if (flashCount >= totalFlashes) {
        clearInterval(flashInterval);
        setHighlightKey(last.winningFood!);
        setWinnerKey(last.winningFood!);
        setWinnerFlash(true);
        setPhase("result");
        setTimeout(() => setShowResultSheet(true), 600);
        resultTimerRef.current = setTimeout(() => {
          setShowResultSheet(false);
          setHighlightKey(null);
          setWinnerFlash(false);
          setPhase("betting");
        }, 7000);
      }
    }, 120);
    return () => clearInterval(flashInterval);
  }, [lastRounds?.[0]?.id]);

  // ── place bet ─────────────────────────────────────────────────────────────
  const handleBetOnFood = async (foodKey: string) => {
    if (!currentRound || phase !== "betting" || timeLeft <= 0 || placing) return;
    const food = FOOD_ITEMS.find(f => f.key === foodKey);
    setPlacing(true);
    try {
      await placeBet({ roundId: currentRound.id, foodKey, amount: selectedAmount });
      showToast(`✅ رهنت ${selectedAmount.toLocaleString()} على ${food?.emoji} ${food?.label}`, "#22c55e");
    } catch (e: any) {
      showToast(`❌ ${e.message}`, "#ef4444");
    } finally {
      setPlacing(false);
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const myBetMap: Record<string, number> = {};
  myBets?.forEach(b => { myBetMap[b.foodKey] = (myBetMap[b.foodKey] ?? 0) + b.amount; });

  const isBetting    = phase === "betting" && timeLeft > 0 && !!currentRound;
  const timerColor   = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f97316" : "#22c55e";
  const winnerFood   = FOOD_ITEMS.find(f => f.key === winnerKey);
  const lastWinnerFood = FOOD_ITEMS.find(f => f.key === lastRoundWinnerKey);
  const resultBets   = finishedRoundMyBets ?? [];
  const totalBetAmount = resultBets.reduce((s, b) => s + b.amount, 0);
  const totalWonAmount = resultBets.reduce((s, b) => s + (b.payout ?? 0), 0);
  const totalPool    = Object.values(betsSummary ?? {}).reduce((s, v) => s + v.total, 0);

  const WHEEL_SIZE = 300;
  const RADIUS     = 108;
  const CX = WHEEL_SIZE / 2;
  const CY = WHEEL_SIZE / 2;
  const ITEM_SIZE  = 62;

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden" dir="rtl"
      style={{ background: "radial-gradient(circle at 50% 26%,rgba(104,55,190,0.26),transparent 34%), radial-gradient(circle at 10% 85%,rgba(30,64,175,0.24),transparent 30%), linear-gradient(160deg,#07051a 0%,#160d38 48%,#060817 100%)", backgroundImage: "radial-gradient(circle at 50% 40%,rgba(139,92,246,0.18) 0 1px,transparent 1px), radial-gradient(circle at 18% 25%,rgba(96,165,250,0.55) 0 1px,transparent 1px), radial-gradient(circle at 84% 18%,rgba(244,114,182,0.5) 0 1px,transparent 1px)", backgroundSize: "170px 170px, 240px 240px, 310px 310px" }}>

      {/* ── FLOATING TOASTS ── */}
      <div className="absolute top-0 left-0 right-0 z-[100] flex flex-col items-center pt-2 gap-1 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="px-4 py-2 rounded-2xl text-white text-xs font-black shadow-2xl"
            style={{ background: t.color, animation: "toast-in 0.2s ease-out", boxShadow: `0 4px 20px ${t.color}80` }}>
            {t.text}
          </div>
        ))}
      </div>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 relative z-10"
        style={{ background: "rgba(11,7,38,0.72)", borderBottom: "1px solid rgba(196,181,253,0.22)", backdropFilter: "blur(18px)", boxShadow: "0 12px 34px rgba(3,0,24,0.28)" }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 2px 12px rgba(245,158,11,0.5)" }}>🐱</div>
            <div>
              <h1 className="text-white font-black text-sm leading-none tracking-wide">القط الشجع</h1><p className="text-purple-200/45 text-[8px] mt-0.5 tracking-[0.18em]">NEON FOOD WHEEL</p>
              {currentRound && <p className="text-white/40 text-[9px] mt-0.5">جولة #{currentRound.roundNumber}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLeaderboard(true)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.25)" }}>
            <span className="text-base">🏆</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 2px 12px rgba(245,158,11,0.4)" }}>
            <span className="text-xs">🪙</span>
            <span className="text-black font-black text-xs">{(profile?.goldCoins ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-3 pb-6 flex flex-col items-center gap-3">

          {/* ── PHASE BANNER ── */}
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl"
            style={{
              background: isBetting ? "rgba(34,197,94,0.1)" : phase === "spinning" ? "rgba(249,115,22,0.1)" : phase === "result" ? "rgba(168,85,247,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${isBetting ? "rgba(34,197,94,0.25)" : phase === "spinning" ? "rgba(249,115,22,0.25)" : phase === "result" ? "rgba(168,85,247,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}>
            {isBetting && <>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }}/>
              <span className="text-xs font-black" style={{ color: "#22c55e" }}>🎯 وقت الرهان</span>
              <div className="px-2 py-0.5 rounded-full text-xs font-black" style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e" }}>{timeLeft}ث</div>
            </>}
            {phase === "stopped" && <span className="text-xs font-black" style={{ color: "#ef4444" }}>🔒 انتهى وقت الرهان — جاري السحب...</span>}
            {phase === "spinning" && <span className="text-xs font-black" style={{ color: "#f97316" }}>🎰 يدور... من سيفوز؟</span>}
            {phase === "result" && <span className="text-xs font-black" style={{ color: "#a855f7" }}>🎉 النتيجة! {winnerFood?.emoji} {winnerFood?.label}</span>}
          </div>

          {/* ── WHEEL ── */}
          <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE, filter: "drop-shadow(0 22px 42px rgba(6,0,36,0.48))" }}>
            {/* Neon wheel plate: the existing food bet targets remain interactive above this visual layer. */}
            <div className="absolute inset-[18px] rounded-full" style={{ background: "conic-gradient(#facc15 0 12.5%,#fb7185 12.5% 25%,#4ade80 25% 37.5%,#fb923c 37.5% 50%,#f97316 50% 62.5%,#fbbf24 62.5% 75%,#f472b6 75% 87.5%,#a78bfa 87.5% 100%)", border: "7px solid rgba(31,19,77,0.95)", boxShadow: "0 0 0 2px rgba(251,191,36,0.8),0 0 32px rgba(139,92,246,0.72),inset 0 0 34px rgba(0,0,0,0.42)" }} />
            <div className="absolute top-[7px] left-1/2 -translate-x-1/2 z-[8]" style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "28px solid #fbbf24", filter: "drop-shadow(0 0 9px #f59e0b)" }} />
            {/* Glow rings */}
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle,rgba(168,85,247,0.12) 0%,transparent 70%)", animation: "pulse-ring 3s ease-in-out infinite" }}/>
            <div className="absolute inset-0 rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.1)", boxShadow: "0 0 60px rgba(168,85,247,0.2),inset 0 0 40px rgba(0,0,0,0.4)" }}/>
            {/* Inner ring */}
            <div className="absolute rounded-full" style={{ top: "16%", left: "16%", right: "16%", bottom: "16%", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.06)" }}/>

            {/* Food items */}
            {FOOD_ITEMS.map((food, i) => {
              const angle = (i / FOOD_ITEMS.length) * 2 * Math.PI - Math.PI / 2;
              const x = CX + RADIUS * Math.cos(angle);
              const y = CY + RADIUS * Math.sin(angle);
              const isHighlighted = highlightKey === food.key;
              const isWinner = winnerKey === food.key;
              const hasBet = (myBetMap[food.key] ?? 0) > 0;
              const myBetAmt = myBetMap[food.key] ?? 0;
              const betCount = betsSummary?.[food.key]?.count ?? 0;
              return (
                <button key={food.key} onClick={() => handleBetOnFood(food.key)} disabled={!isBetting}
                  className="absolute flex flex-col items-center justify-center transition-all active:scale-90"
                  style={{
                    width: ITEM_SIZE, height: ITEM_SIZE,
                    left: x - ITEM_SIZE / 2, top: y - ITEM_SIZE / 2,
                    borderRadius: 18,
                    background: isHighlighted
                      ? `linear-gradient(135deg,${food.color},${food.color}cc)`
                      : hasBet ? `${food.color}18` : "rgba(255,255,255,0.07)",
                    boxShadow: isHighlighted
                      ? `0 0 28px ${food.color},0 0 56px ${food.color}50,inset 0 1px 0 rgba(255,255,255,0.3)`
                      : hasBet ? `0 0 14px ${food.color}40` : "0 2px 8px rgba(0,0,0,0.4)",
                    border: isHighlighted ? `2px solid white` : hasBet ? `2px solid ${food.color}60` : "1px solid rgba(255,255,255,0.12)",
                    transform: isHighlighted ? "scale(1.22)" : "scale(1)",
                    zIndex: isHighlighted ? 10 : 1,
                    animation: isWinner && winnerFlash ? "winner-pulse 0.35s ease-in-out infinite" : "none",
                  }}>
                  <span style={{ fontSize: 20 }}>{food.emoji}</span>
                  <span className="text-[8px] font-black leading-none mt-0.5"
                    style={{ color: isHighlighted ? "white" : "rgba(255,255,255,0.85)" }}>×{food.multiplier}</span>
                  {myBetAmt > 0 && (
                    <span className="text-[7px] font-bold leading-none mt-0.5"
                      style={{ color: isHighlighted ? "white" : food.color }}>
                      {myBetAmt >= 1000 ? `${(myBetAmt/1000).toFixed(0)}K` : myBetAmt}
                    </span>
                  )}
                  {betCount > 0 && !myBetAmt && (
                    <span className="text-[7px] font-bold leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {betCount}👤
                    </span>
                  )}
                </button>
              );
            })}

            {/* Center circle */}
            <div className="absolute flex flex-col items-center justify-center"
              style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 104, height: 104, borderRadius: "50%",
                background: "radial-gradient(circle at 50% 22%,#3b1e75,#120c32 72%)",
                boxShadow: "0 0 0 5px rgba(139,92,246,0.38),0 0 28px rgba(139,92,246,0.72),inset 0 2px 8px rgba(255,255,255,0.08)",
                border: "3px solid rgba(255,255,255,0.5)", zIndex: 5 }}>
              <span className="absolute -top-10 text-4xl" style={{ filter: "drop-shadow(0 0 12px #f0abfc)", animation: "bounce-food 0.8s ease-in-out infinite" }}>🐱‍🚀</span>
              {phase === "betting" && timeLeft > 0 ? (<>
                <span className="text-white/50 text-[8px] font-bold">الوقت</span>
                <span className="font-black leading-none" style={{ fontSize: 28, color: timerColor, textShadow: `0 0 16px ${timerColor}`, transition: "color 0.3s" }}>{timeLeft}</span>
              </>) : phase === "stopped" ? (<>
                <span className="text-2xl">🔒</span>
                <span className="text-red-400 text-[8px] font-black">توقف</span>
              </>) : phase === "spinning" ? (<>
                <span className="text-2xl" style={{ animation: "spin-emoji 0.35s linear infinite" }}>🎰</span>
                <span className="text-orange-400 text-[8px] font-black">يدور</span>
              </>) : (<>
                <span className="text-2xl" style={{ animation: "bounce-food 0.5s ease-in-out infinite" }}>{winnerFood?.emoji ?? "🎉"}</span>
                <span className="text-green-400 text-[8px] font-black">فاز!</span>
              </>)}
            </div>
          </div>

          {/* ── STATS ROW ── */}
          <div className="flex items-center gap-2 w-full">
            {[
              { icon: "💰", label: "مجموع الرهانات", value: totalPool.toLocaleString(), color: "#f59e0b" },
              { icon: "📈", label: "كسبت اليوم",     value: (todayWinnings ?? 0).toLocaleString(), color: "#22c55e" },
              { icon: "🎯", label: "رهاناتي",         value: String(myBets?.length ?? 0), color: "#60a5fa" },
            ].map(s => (
              <div key={s.label} className="flex-1 rounded-2xl px-2 py-2.5 flex flex-col items-center gap-0.5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-sm">{s.icon}</span>
                <p className="font-black text-xs" style={{ color: s.color }}>{s.value}</p>
                <p className="text-white/30 text-[8px]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── BET AMOUNTS ── */}
          <div className="w-full">
            <p className="text-purple-100/70 text-[10px] font-bold mb-2 text-center tracking-wide">💎 اختر مبلغ الرهان</p>
            <div className="grid grid-cols-4 gap-2 w-full">
              {BET_AMOUNTS.map((amt, idx) => (
                <button key={amt} onClick={() => setSelectedAmount(amt)}
                  className="py-3 rounded-2xl font-black text-white text-xs transition-all active:scale-95 flex flex-col items-center gap-0.5"
                  style={{
                    background: selectedAmount === amt ? `linear-gradient(135deg,${BET_COLORS[idx]},${BET_COLORS[idx]}cc)` : `${BET_COLORS[idx]}18`,
                    border: selectedAmount === amt ? `2px solid ${BET_COLORS[idx]}` : `1px solid ${BET_COLORS[idx]}30`,
                    boxShadow: selectedAmount === amt ? `0 4px 16px ${BET_COLORS[idx]}50` : "none",
                  }}>
                  <span>{amt >= 1000 ? `${(amt/1000).toFixed(0)}K` : amt}</span>
                  <span className="text-[8px] opacity-70">🪙</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── LIVE BETS FEED ── */}
          {recentBets && recentBets.length > 0 && (
            <div className="w-full rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }}/>
                <p className="text-white/60 text-[10px] font-black">رهانات مباشرة</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold mr-auto"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>{recentBets.length}</span>
              </div>
              <div className="px-3 py-2 space-y-1.5 max-h-32 overflow-y-auto">
                {recentBets.slice(0, 8).map((bet, idx) => {
                  const food = FOOD_ITEMS.find(f => f.key === bet.foodKey);
                  return (
                    <div key={bet.id} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                        style={{ background: `${food?.color ?? "#fff"}20`, border: `1px solid ${food?.color ?? "#fff"}40` }}>
                        {food?.emoji ?? "❓"}
                      </div>
                      <p className="text-white/70 text-[10px] flex-1 truncate font-bold">{bet.profileName}</p>
                      <p className="text-[10px] font-black flex-shrink-0" style={{ color: food?.color ?? "#fff" }}>
                        {bet.amount >= 1000 ? `${(bet.amount/1000).toFixed(0)}K` : bet.amount} 🪙
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── LAST 10 ROUNDS ── */}
          <div className="w-full rounded-2xl p-3" style={{ background: "rgba(15,12,46,0.68)", border: "1px solid rgba(167,139,250,0.22)", boxShadow: "0 12px 28px rgba(0,0,0,0.16)" }}>
            <p className="font-black text-white/40 text-[10px] mb-2 text-center">آخر 10 جولات</p>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {!lastRounds ? (
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/>
              ) : lastRounds.length === 0 ? (
                <p className="text-white/20 text-xs">لا توجد جولات بعد</p>
              ) : lastRounds.map((round, idx) => {
                const hide = idx === 0 && (phase === "betting" || phase === "stopped");
                const food = hide ? null : FOOD_ITEMS.find(f => f.key === round.winningFood);
                return (
                  <div key={round.id} className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5"
                    style={{ background: idx === 0 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)", border: idx === 0 ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.07)", minWidth: 36 }}>
                    <span style={{ fontSize: 15 }}>{hide ? "🔒" : (food?.emoji ?? "❓")}</span>
                    <span className="text-[7px] font-black" style={{ color: hide ? "rgba(255,255,255,0.2)" : (food?.color ?? "#fff") }}>
                      {hide ? "؟" : (food?.multiplier ? `×${food.multiplier}` : "؟")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── BOTTOM BUTTONS ── */}
          <div className="flex gap-2 w-full">
            <button onClick={() => setShowRules(true)}
              className="flex-1 py-3 rounded-2xl font-bold text-xs active:scale-95"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
              📖 القواعد
            </button>
            {(!currentRound || phase === "result") && (
              <button onClick={async () => {
                try { await forceRestart(); showToast("✅ تم إعادة تشغيل اللعبة"); }
                catch (e: any) { showToast(`❌ ${e.message}`, "#ef4444"); }
              }}
                className="flex-1 py-3 rounded-2xl font-black text-xs active:scale-95 flex items-center justify-center gap-1"
                style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", boxShadow: "0 4px 16px rgba(249,115,22,0.4)" }}>
                🔄 إعادة تشغيل
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── RESULT SHEET ── */}
      {showResultSheet && (
        <div className="absolute inset-0 z-[50] flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => { setShowResultSheet(false); if (resultTimerRef.current) clearTimeout(resultTimerRef.current); }}>
          <div className="w-full rounded-t-3xl px-4 pt-5 pb-8"
            style={{ background: "linear-gradient(180deg,#1a1040,#0a0818)", border: "1px solid rgba(168,85,247,0.25)", animation: "ra-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.15)" }}/>

            {lastWinnerFood && (
              <div className="flex flex-col items-center mb-5">
                <p className="text-white/40 text-xs font-bold mb-2">🏆 الفائز في الجولة #{lastRounds?.[0]?.roundNumber}</p>
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-2"
                  style={{ background: `linear-gradient(135deg,${lastWinnerFood.color}30,${lastWinnerFood.color}10)`, border: `2px solid ${lastWinnerFood.color}50`, animation: "bounce-food 0.6s ease-in-out infinite" }}>
                  <span style={{ fontSize: 44 }}>{lastWinnerFood.emoji}</span>
                </div>
                <p className="font-black text-2xl text-white">{lastWinnerFood.label}</p>
                <div className="mt-2 px-5 py-1.5 rounded-full font-black text-base"
                  style={{ background: `${lastWinnerFood.color}20`, color: lastWinnerFood.color, border: `2px solid ${lastWinnerFood.color}60` }}>
                  ×{lastWinnerFood.multiplier}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-white/40 text-[10px] font-bold mb-1">💸 راهنت</p>
                <p className="text-white font-black text-xl">{totalBetAmount > 0 ? totalBetAmount.toLocaleString() : "—"}</p>
              </div>
              <div className="rounded-2xl p-3 text-center"
                style={{ background: totalWonAmount > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${totalWonAmount > 0 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                <p className="text-white/40 text-[10px] font-bold mb-1">🏆 ربحت</p>
                <p className="font-black text-xl" style={{ color: totalWonAmount > 0 ? "#22c55e" : "#ef4444" }}>
                  {totalWonAmount > 0 ? `+${totalWonAmount.toLocaleString()}` : "0"}
                </p>
              </div>
            </div>

            {topBettors && topBettors.length > 0 && (
              <div className="mb-4">
                <p className="text-white/40 text-xs font-black text-center mb-2">🥇 أفضل الرابحين</p>
                <div className="space-y-2">
                  {topBettors.map((entry, idx) => (
                    <div key={entry.userId} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <span className="text-lg flex-shrink-0">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)" }}>
                        {entry.profile?.avatarUrl
                          ? <img src={entry.profile.avatarUrl} alt="" className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center text-white font-black text-xs">{entry.profile?.name?.[0] ?? "؟"}</div>}
                      </div>
                      <p className="text-white font-black text-xs flex-1 truncate">{entry.profile?.name ?? "مجهول"}</p>
                      <p className="font-black text-sm flex-shrink-0" style={{ color: "#22c55e" }}>+{entry.totalWon.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#a855f7,#6366f1)", animation: "shrink-bar 7s linear forwards" }}/>
            </div>
          </div>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {showLeaderboard && (
        <div className="absolute inset-0 z-[60] flex flex-col"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowLeaderboard(false)}>
          <div className="mt-auto w-full rounded-t-3xl flex flex-col"
            style={{ background: "linear-gradient(180deg,#1a1040,#0a0818)", maxHeight: "80%", border: "1px solid rgba(168,85,247,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-white font-black text-base">🏆 المتصدرون</h2>
              <button onClick={() => setShowLeaderboard(false)} className="text-white/40 text-xl w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)" }}>✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-3 py-3 space-y-2">
              {!leaderboard ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/></div>
              ) : leaderboard.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-10">لا يوجد لاعبون بعد</p>
              ) : leaderboard.map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
                  style={{ background: idx === 0 ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)", border: idx === 0 ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="text-sm font-black w-6 text-center flex-shrink-0" style={{ color: idx < 3 ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx+1}`}
                  </span>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)" }}>
                    {entry.profile?.avatarUrl
                      ? <img src={entry.profile.avatarUrl} alt="" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-white font-black text-xs">{entry.profile?.name?.[0] ?? "؟"}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-xs truncate">{entry.profile?.name ?? "مجهول"}</p>
                    <p className="text-white/30 text-[9px]">{entry.gamesPlayed} جولة</p>
                  </div>
                  <p className="font-black text-sm" style={{ color: "#fbbf24" }}>{entry.totalWon.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RULES ── */}
      {showRules && (
        <div className="absolute inset-0 z-[60] flex items-end"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowRules(false)}>
          <div className="w-full rounded-t-3xl p-4 space-y-3"
            style={{ background: "linear-gradient(180deg,#1a1040,#0a0818)", border: "1px solid rgba(168,85,247,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black text-base">📖 قواعد اللعبة</h2>
              <button onClick={() => setShowRules(false)} className="text-white/40 text-xl w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)" }}>✕</button>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <p className="text-indigo-300 font-black mb-1 text-xs">كيف تلعب؟</p>
              <p className="text-white/50 text-xs leading-relaxed">اختر مبلغ الرهان ثم اضغط على الطعام للرهان. لديك 30 ثانية. بعدها تضيء العناصر وتتوقف على الفائز!</p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <p className="text-purple-300 font-black text-xs mb-2">المضاعفات</p>
              <div className="grid grid-cols-2 gap-1.5">
                {FOOD_ITEMS.map(f => (
                  <div key={f.key} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 18 }}>{f.emoji}</span>
                    <span className="text-white/60 text-xs">{f.label}</span>
                    <span className="text-xs font-black mr-auto" style={{ color: f.color }}>×{f.multiplier}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setShowRules(false)}
              className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
              style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)", boxShadow: "0 4px 20px rgba(168,85,247,0.4)" }}>
              فهمت! لنلعب 🎮
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes winner-pulse { 0%,100%{transform:scale(1.22)} 50%{transform:scale(1.38)} }
        @keyframes spin-emoji { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes bounce-food { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-8px) scale(1.08)} }
        @keyframes shrink-bar { from{width:100%} to{width:0%} }
        @keyframes ra-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes pulse-ring { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.02)} }
        @keyframes toast-in { from{opacity:0;transform:translateY(-12px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  );
}
