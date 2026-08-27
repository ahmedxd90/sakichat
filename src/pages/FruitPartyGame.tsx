// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

// ── Real fruit emojis ──────────────────────────────────────────────────────────
const FRUIT_ITEMS = [
  { key: "fries",   label: "بطاطس",  multiplier: 5,  color: "#fbbf24", emoji: "🍟", glow: "rgba(251,191,36,0.8)" },
  { key: "hotdog",  label: "هوت دوغ", multiplier: 5, color: "#f97316", emoji: "🌭", glow: "rgba(249,115,22,0.8)" },
  { key: "burger",  label: "برجر",   multiplier: 5,  color: "#d97706", emoji: "🍔", glow: "rgba(217,119,6,0.8)" },
  { key: "cake",    label: "كيك",    multiplier: 5,  color: "#f472b6", emoji: "🍰", glow: "rgba(244,114,182,0.8)" },
  { key: "pizza",   label: "بيتزا",  multiplier: 10, color: "#ef4444", emoji: "🍕", glow: "rgba(239,68,68,0.8)" },
  { key: "donut",   label: "دونات",  multiplier: 15, color: "#ec4899", emoji: "🍩", glow: "rgba(236,72,153,0.8)" },
  { key: "cupcake", label: "كب كيك", multiplier: 25, color: "#a855f7", emoji: "🧁", glow: "rgba(168,85,247,0.8)" },
  { key: "popcorn", label: "فشار",   multiplier: 45, color: "#f8fafc", emoji: "🍿", glow: "rgba(248,250,252,0.8)" },
];

const BET_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 500000, 1000000];

// 3×3 grid: 8 fruits + center
const GRID_KEYS = [
  "fries", "hotdog", "burger",
  "cake", "__center__", "pizza",
  "donut", "cupcake", "popcorn",
];

interface Props { onBack: () => void; roomId?: any }

export default function FruitPartyGame({ onBack, roomId }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [lastRounds, setLastRounds] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [todayWinnings, setTodayWinnings] = useState<any>(null);
  const [betsSummary, setBetsSummary] = useState<any>(null);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [resultRoundId, setResultRoundId] = useState<string | null>(null);
  const [topBettors, setTopBettors] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setProfile(p);
      }
      const { data: round } = await supabase.from('fruit_party_rounds').select('*').eq('status', 'betting').order('created_at', { ascending: false }).limit(1).single();
      setCurrentRound(round);
      const { data: last } = await supabase.from('fruit_party_rounds').select('*').eq('status', 'finished').order('created_at', { ascending: false }).limit(10);
      setLastRounds(last || []);
    };
    fetchData();
  }, []);

  const placeBetMut = async (args: any) => {};
  const startNewRound = async (args: any) => {};
  const resolveExpiredRound = async (args: any) => {};
  const ensureRoomRound = useCallback(() => roomId ? startNewRound({ roomId }) : Promise.resolve(null), [roomId]);

  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [placing, setPlacing]               = useState(false);
  const [timeLeft, setTimeLeft]             = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRules, setShowRules]           = useState(false);

  // Animation state
  const [phase, setPhase]               = useState<"betting"|"spinning"|"result">("betting");
  const [winnerKey, setWinnerKey]       = useState<string | null>(null);
  const [spinnerPos, setSpinnerPos]     = useState<number>(-1); // index in FRUIT_ITEMS for spinning finger
  const [allFlash, setAllFlash]         = useState(false);
  const [showResultSheet, setShowResultSheet] = useState(false);
  const [lastRoundMyBets, setLastRoundMyBets] = useState<any[]>([]);
  const [diagnostic, setDiagnostic] = useState<{ title: string; details: string } | null>(null);
  const [lastRoundWinnerKey, setLastRoundWinnerKey] = useState<string | null>(null);

  const intervalRef    = useRef<any>(null);
  const prevRoundIdRef = useRef<string | null>(null);
  const shownResultRef = useRef<string | null>(null);
  const phaseRef       = useRef<string>("betting");
  const myBetsRef      = useRef<any[]>([]);
  const spinTimerRef   = useRef<any>(null);
  const resultTimerRef = useRef<any>(null);
  const recoveryRoundRef = useRef<string | null>(null);
  const activeRoundRef = useRef<any>(null);
  const spinStartedAtRef = useRef(0);

  useEffect(() => {
    myBetsRef.current = myBets ?? [];
    const distinct = [...new Set((myBets ?? []).map((bet: any) => bet.fruitKey))].slice(0, 6);
    setSelectedKeys((prev) => prev.length ? prev : distinct);
  }, [myBets]);

  // Timer
  useEffect(() => {
    if (!currentRound) {
      // The query intentionally stops returning an expired betting round.
      // Never leave the old number (for example 22) frozen on screen.
      setTimeLeft(0);
      return;
    }
    activeRoundRef.current = currentRound;
    const update = () => setTimeLeft(Math.max(0, Math.ceil((currentRound.endsAt - Date.now()) / 1000)));
    update();
    intervalRef.current = setInterval(update, 200);
    return () => clearInterval(intervalRef.current);
  }, [currentRound?.endsAt, currentRound?.id || currentRound?._id]);

  // New round → reset
  useEffect(() => {
    if (!currentRound) return;
    const rid = currentRound.id as string;
    if (prevRoundIdRef.current && prevRoundIdRef.current !== rid) {
      phaseRef.current = "betting";
      setPhase("betting");
      setWinnerKey(null);
      setSpinnerPos(-1);
      setAllFlash(false);
      setShowResultSheet(false);
      setSelectedKeys([]);
      recoveryRoundRef.current = null;
      clearTimeout(spinTimerRef.current);
      clearTimeout(resultTimerRef.current);
    }
    prevRoundIdRef.current = rid;
  }, [currentRound?.id || currentRound?._id]);

  // Start spinning when the server round expires, even if the query has
  // already removed it from the active-round result.
  useEffect(() => {
    const expiredRound = currentRound ?? activeRoundRef.current;
    if (timeLeft !== 0 || phaseRef.current !== "betting" || !expiredRound) return;
    const roundId = expiredRound._id as string;
    phaseRef.current = "spinning";
    setPhase("spinning");
    startSpinAnimation();
    if (recoveryRoundRef.current !== roundId) {
      recoveryRoundRef.current = roundId;
      // Do not rely only on the scheduled Convex job. Android/Web clients
      // explicitly resolve the expired round, then request the next one.
      resolveExpiredRound({ roundId: expiredRound._id })
        .catch(() => null)
        .then(() => ensureRoomRound())
        .catch(() => {
          recoveryRoundRef.current = null;
        });
    }
  }, [timeLeft, currentRound?.id || currentRound?._id, ensureRoomRound, resolveExpiredRound]);

  const startSpinAnimation = useCallback(() => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinStartedAtRef.current = Date.now();
    const duration = 5000;
    const started = performance.now();
    let index = 0;

    const spin = () => {
      const elapsed = performance.now() - started;
      const progress = Math.min(1, elapsed / duration);
      setSpinnerPos(index % FRUIT_ITEMS.length);
      index += 1;
      if (progress < 1) {
        const delay = Math.round(70 + progress * 170);
        spinTimerRef.current = setTimeout(spin, delay);
      } else {
        setSpinnerPos(-1);
        setAllFlash(true);
        window.setTimeout(() => setAllFlash(false), 700);
      }
    };
    spin();
  }, []);

  // Detect finished round
  useEffect(() => {
    if (!lastRounds || lastRounds.length === 0) return;
    const latest = lastRounds[0];
    if (!latest.winnerFruit) return;
    const rid = latest.id || latest._id as string;
    if (shownResultRef.current === rid) return;
    shownResultRef.current = rid;

    const winner = latest.winnerFruit;
    const apply = () => {
      setWinnerKey(winner);
      setSpinnerPos(-1);
      setAllFlash(false);
      phaseRef.current = "result";
      setPhase("result");
      setResultRoundId(rid as any);
      setLastRoundWinnerKey(winner);
      setLastRoundMyBets(myBetsRef.current);
      setShowResultSheet(true);
      // Auto-hide after exactly 5s, then phase resets when new round arrives
      resultTimerRef.current = setTimeout(() => {
        setShowResultSheet(false);
      }, 5000);
    };

    // A finished result is accepted only after this client entered spinning.
    // This prevents opening a stale result immediately when the game is opened.
    if (phaseRef.current !== "spinning") return;
    const elapsed = Date.now() - spinStartedAtRef.current;
    const remainingSpinMs = Math.max(0, 5000 - elapsed);
    setTimeout(apply, remainingSpinMs);
  }, [lastRounds?.[0]?.id]);

  // Surface a visible diagnostic instead of leaving the user on a silent 0-second screen.
  useEffect(() => {
    if (currentRound !== null || currentRound === undefined) return;
    const timer = window.setTimeout(() => {
      setDiagnostic({
        title: "لم تصل جولة فعالة من الخادم",
        details: `roomId=${String(roomId ?? "مفقود")} • لا توجد جولة betting فعالة • سيتم طلب جولة جديدة تلقائيًا`,
      });
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [currentRound, roomId]);

  useEffect(() => {
    if (phase !== "spinning") return;
    const timer = window.setTimeout(() => {
      setDiagnostic({
        title: "توقفت اللعبة أثناء السحب",
        details: `roundId=${String((activeRoundRef.current?.id || activeRoundRef.current?._id) ?? "مفقود")} • roomId=${String(roomId ?? "مفقود")} • آخر عداد=${timeLeft} • لم تصل نتيجة finished خلال 8 ثوانٍ`,
      });
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [phase, roomId, timeLeft]);

  // Bootstrap the round immediately on mount, then keep a small recovery loop.
  // The first version waited for a null query and silently swallowed server errors,
  // which left Android stuck on "لا توجد جولة betting فعالة".
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    const recover = () => {
      if (cancelled) return;
      ensureRoomRound().catch((error: any) => {
        if (!cancelled) {
          setDiagnostic({
            title: "تعذر إنشاء الجولة من الخادم",
            details: `roomId=${String(roomId)} • ${error?.message ?? String(error)}`,
          });
        }
      });
    };
    recover();
    const timer = window.setInterval(recover, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [roomId, ensureRoomRound]);

  const handleBet = async (fruitKey: string) => {
    if (!currentRound || phase !== "betting" || timeLeft === 0 || placing) return;
    const isNewSelection = !selectedKeys.includes(fruitKey);
    if (isNewSelection) {
      if (selectedKeys.length >= 6) {
        toast.error("يمكنك اختيار 6 أصناف فقط في الجولة");
        return;
      }
      // The first tap both selects the item and places the requested bet.
      setSelectedKeys((prev) => [...prev, fruitKey]);
    }
    // Rate limit: repeated bets on the same selected item are allowed.
    setPlacing(true);
    try {
      await placeBetMut({ roundId: currentRound.id || currentRound._id, fruitKey, amount: selectedAmount });
      toast.success(`رهنت ${selectedAmount.toLocaleString()} على ${FRUIT_ITEMS.find(f => f.key === fruitKey)?.label}`);
    } catch (e: any) {
      const message = e?.message ?? "حدث خطأ غير معروف من الخادم";
      const balance = profile?.goldCoins ?? "غير متاح";
      setDiagnostic({
        title: "تعذر تنفيذ الرهان",
        details: `${message} • roomId=${String(roomId ?? "مفقود")} • roundId=${String((currentRound?.id || currentRound?._id) ?? "مفقود")} • phase=${phase} • timeLeft=${timeLeft} • الرصيد=${balance}`,
      });
      toast.error(message);
    } finally {
      setTimeout(() => setPlacing(false), 300); // debounce
    }
  };

  const myBetsMap: Record<string, number> = {};
  if (myBets) for (const b of myBets) myBetsMap[b.fruitKey] = (myBetsMap[b.fruitKey] ?? 0) + b.amount;

  const isBetting  = phase === "betting" && timeLeft > 0;
  const timerColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f97316" : "#4ade80";
  const timerPulse = timeLeft <= 5;

  if (showLeaderboard) return <LeaderboardSheet leaderboard={leaderboard ?? []} todayWinnings={todayWinnings ?? 0} onClose={() => setShowLeaderboard(false)} />;
  if (showRules) return <RulesSheet onClose={() => setShowRules(false)} />;

  return (
    <div
      className="flex flex-col"
      style={{
        background: "linear-gradient(180deg,#0d0020 0%,#1a0040 40%,#2d0060 70%,#1a0040 100%)",
        minHeight: "100%",
        fontFamily: "'Tajawal', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
      dir="rtl"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-20"
            style={{
              width: `${4 + (i % 4) * 3}px`,
              height: `${4 + (i % 4) * 3}px`,
              background: ["#f3d46f","#a855f7","#22c55e","#ef4444"][i % 4],
              left: `${(i * 8.3) % 100}%`,
              top: `${(i * 13.7) % 100}%`,
              animation: `fp-float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.5)", borderBottom: "1px solid rgba(243,212,111,0.25)", backdropFilter: "blur(10px)" }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-3xl">🎪</span>
          <div className="text-center">
            <h1 className="text-white font-black text-base leading-none">حفلة ساكي</h1>
            <p className="text-yellow-400/70 text-[10px]">اختر 6 أصناف وراهن على الفائز</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowRules(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f3d46f" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </button>
          <button onClick={() => setShowLeaderboard(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="text-lg">🏆</span>
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(90,32,176,0.5)", border: "1px solid rgba(243,212,111,0.35)" }}>
          <span className="text-base">🏆</span>
          <span className="text-yellow-300 font-black text-xs">{(todayWinnings ?? 0).toLocaleString()}</span>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center px-5 py-1.5 rounded-2xl relative"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: `2px solid ${timerColor}`,
            boxShadow: `0 0 20px ${timerColor}55`,
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}>
          {timerPulse && <div className="absolute inset-0 rounded-2xl animate-ping opacity-30" style={{ background: timerColor }}/>}
          <span className="font-black text-3xl leading-none relative z-10"
            style={{ color: timerColor, textShadow: `0 0 20px ${timerColor}` }}>
            {phase === "result" ? "🎉" : phase === "spinning" ? "🎰" : timeLeft}
          </span>
          <span className="text-gray-400 text-[9px] relative z-10">
            {phase === "result" ? "النتيجة" : phase === "spinning" ? "جاري السحب" : "ثانية"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(243,212,111,0.12)", border: "1px solid rgba(243,212,111,0.3)" }}>
          <span className="text-base">🪙</span>
          <span className="text-yellow-300 font-black text-sm">{(profile?.goldCoins ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* ── History bar ── */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.4)", scrollbarWidth: "none" }}>
        {(lastRounds ?? []).slice(0, 14).map((r: any, i: number) => {
          const fruit = FRUIT_ITEMS.find(f => f.key === r.winnerFruit);
          return (
            <div key={r._id}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: i === 0 ? `${fruit?.color ?? "#fff"}22` : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${fruit?.color ?? "#ffffff22"}`,
                boxShadow: i === 0 ? `0 0 10px ${fruit?.color ?? "#fff"}66` : "none",
              }}>
              {fruit?.emoji ?? "❓"}
            </div>
          );
        })}
        {(!lastRounds || lastRounds.length === 0) && (
          <span className="text-gray-600 text-xs py-1">لا توجد جولات سابقة</span>
        )}
      </div>

      {/* ── Main Board ── */}
      <div className="flex-1 flex flex-col items-center px-3 py-2">
        {/* Golden border wrapper */}
        <div className="w-full max-w-sm rounded-3xl p-[3px]"
          style={{
            background: "linear-gradient(135deg,#f3d46f,#dca035,#f3d46f,#dca035)",
            boxShadow: "0 0 50px rgba(243,212,111,0.4), 0 8px 40px rgba(0,0,0,0.6)",
          }}>
          <div className="rounded-[22px] p-2.5" style={{ background: "linear-gradient(180deg,#3d0080,#5a00b8,#3d0080)" }}>

            {/* 3×3 grid */}
            <div className="grid grid-cols-3 gap-2">
              {GRID_KEYS.map((key) => {
                if (key === "__center__") {
                  return (
                    <div key="center" className="rounded-2xl flex flex-col items-center justify-center"
                      style={{
                        background: "rgba(243,212,111,0.1)",
                        border: "2px solid rgba(243,212,111,0.5)",
                        aspectRatio: "1",
                      }}>
                      <span className="text-4xl">🎪</span>
                      <span className="text-yellow-300 font-black text-[8px] text-center leading-tight mt-0.5 px-1">حفلة ساكي</span>
                    </div>
                  );
                }

                const fruit = FRUIT_ITEMS.find(f => f.key === key)!;
                const isSpinning = spinnerPos === FRUIT_ITEMS.indexOf(fruit);
                const isWinner   = winnerKey === fruit.key;
                const isFlash    = allFlash;
                const myBetAmt   = myBetsMap[fruit.key] ?? 0;
                const totalBet   = betsSummary?.[fruit.key]?.total ?? 0;

                return (
                  <FruitCell
                    key={fruit.key}
                    fruit={fruit}
                    isSpinning={isSpinning}
                    isWinner={isWinner}
                    isFlash={isFlash}
                    myBetAmt={myBetAmt}
                    totalBet={totalBet}
                    isBetting={isBetting}
                    placing={placing}
                    onBet={() => handleBet(fruit.key)}
                    isSelected={selectedKeys.includes(fruit.key)}
                  />
                );
              })}
            </div>


          </div>
        </div>
      </div>

      <div className="px-4 pb-2 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {BET_AMOUNTS.map((amt) => (
            <button key={amt} onClick={() => setSelectedAmount(amt)}
              className="flex-shrink-0 px-3 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95"
              style={{
                background: selectedAmount === amt
                  ? "linear-gradient(135deg,#f3d46f,#dca035)"
                  : "rgba(255,255,255,0.07)",
                color: selectedAmount === amt ? "#310b6b" : "white",
                border: selectedAmount === amt ? "none" : "1.5px solid rgba(125,69,186,0.5)",
                boxShadow: selectedAmount === amt ? "0 4px 15px rgba(243,212,111,0.4)" : "none",
              }}>
              {amt >= 1000000 ? `${amt/1000000}M` : amt >= 1000 ? `${amt/1000}k` : amt}
            </button>
          ))}
        </div>
      </div>

      {diagnostic && (
        <div className="mx-4 mb-2 rounded-2xl border border-red-400/50 bg-red-950/80 p-3 text-right text-xs text-red-100 shadow-lg" dir="rtl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-red-200">تشخيص اللعبة: {diagnostic.title}</p>
              <p className="mt-1 break-words font-mono text-[10px] leading-5 text-red-100/80">{diagnostic.details}</p>
            </div>
            <button type="button" onClick={() => setDiagnostic(null)} className="rounded-lg px-2 py-1 text-red-200 hover:bg-red-400/20">×</button>
          </div>
          <button type="button" onClick={async () => {
            try {
              setDiagnostic(null);
              await ensureRoomRound();
              toast.success("تم طلب مزامنة جولة جديدة");
            } catch (e: any) {
              setDiagnostic({ title: "فشل طلب الجولة الجديدة", details: e?.message ?? String(e) });
            }
          }} className="mt-2 rounded-xl bg-red-400/20 px-3 py-2 font-black text-red-100 ring-1 ring-red-300/30">
            إعادة مزامنة الجولة
          </button>
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="px-4 py-2 flex-shrink-0 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isBetting ? "bg-green-400 animate-pulse" : phase === "spinning" ? "bg-yellow-400 animate-pulse" : "bg-blue-400"}`}/>
          <span className="text-gray-300 text-xs font-bold">
            {isBetting ? "وقت الرهان" : phase === "result" ? "النتيجة" : "جاري السحب..."}
          </span>
        </div>
        <span className="text-gray-500 text-xs">الجولة #{currentRound?.roundNumber ?? "—"}</span>
      </div>

      {/* ── Result Sheet ── */}
      {showResultSheet && lastRoundWinnerKey && (
        <ResultSheet
          winnerKey={lastRoundWinnerKey}
          myBets={lastRoundMyBets}
          topBettors={topBettors ?? []}
          onClose={() => setShowResultSheet(false)}
        />
      )}

      <style>{`
        @keyframes fp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fp-winner-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes fp-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes fp-spin-glow { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

// ── Fruit Cell Component ───────────────────────────────────────────────────────
function FruitCell({ fruit, isSpinning, isWinner, isFlash, myBetAmt, totalBet, isBetting, placing, onBet, isSelected }: any) {
  return (
    <button
      onClick={onBet}
      disabled={!isBetting || placing}
      className="relative rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
      style={{
        aspectRatio: "1",
        background: isWinner
          ? `linear-gradient(135deg,${fruit.color}44,${fruit.color}22)`
          : isSpinning
          ? "rgba(255,255,255,0.3)"
          : isFlash
          ? `${fruit.color}22`
          : "rgba(255,255,255,0.07)",
        border: isWinner
          ? `2px solid ${fruit.color}`
          : isSpinning
          ? "2px solid #fff"
          : isFlash
          ? `2px solid ${fruit.color}`
          : isSelected ? `2px solid ${fruit.color}` : "2px solid rgba(125,69,186,0.6)",
        boxShadow: isWinner
          ? `0 0 25px ${fruit.glow}, 0 0 50px ${fruit.glow}55`
          : isSpinning
          ? "0 0 25px rgba(255,255,255,0.95)"
          : isFlash
          ? `0 0 15px ${fruit.glow}`
          : "none",
        transform: isWinner ? "scale(1.08)" : isSpinning ? "scale(1.1)" : "scale(1)",
        transition: "all 0.12s ease",
      }}>
      {isSelected && <div className="absolute top-1 right-1 z-10 rounded-full px-1.5 py-0.5 text-[7px] font-black" style={{ background: fruit.color, color: "#240044" }}>مختار</div>}
      {/* Spinning ring */}
      {isSpinning && (
        <div className="absolute inset-0 rounded-2xl border-2 border-white animate-ping opacity-60"/>
      )}
      {/* Winner ring */}
      {isWinner && (
        <div className="absolute inset-0 rounded-2xl animate-ping opacity-40"
          style={{ border: `3px solid ${fruit.color}` }}/>
      )}

      {/* My bet badge */}
      {myBetAmt > 0 && (
        <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-black z-10"
          style={{ background: "#f85b63", color: "white" }}>
          {myBetAmt >= 1000 ? `${(myBetAmt/1000).toFixed(0)}k` : myBetAmt}
        </div>
      )}
      {/* Total bets */}
      {totalBet > 0 && (
        <div className="absolute top-1 left-1 px-1 py-0.5 rounded text-[7px] font-black z-10"
          style={{ background: "rgba(0,0,0,0.65)", color: "#f3d46f" }}>
          {totalBet >= 1000 ? `${(totalBet/1000).toFixed(0)}k` : totalBet}
        </div>
      )}

      <span className="text-3xl relative z-10"
        style={{
          filter: isWinner ? `drop-shadow(0 0 10px ${fruit.color})` : "none",
          animation: isWinner ? "fp-winner-pulse 0.7s ease-in-out infinite" : "none",
        }}>
        {fruit.emoji}
      </span>
      <span className="text-white font-black text-[9px] mt-0.5 relative z-10">{fruit.label}</span>
      <span className="font-black text-[9px] relative z-10" style={{ color: fruit.color }}>×{fruit.multiplier}</span>
    </button>
  );
}

// ── Result Sheet ───────────────────────────────────────────────────────────────
function ResultSheet({ winnerKey, myBets, topBettors, onClose }: any) {
  const fruit = FRUIT_ITEMS.find(f => f.key === winnerKey);
  if (!fruit) return null;

  const myWinBets = myBets.filter((b: any) => b.fruitKey === winnerKey);
  const totalWon  = myWinBets.reduce((s: number, b: any) => s + (b.payout ?? 0), 0);
  const totalBet  = myBets.reduce((s: number, b: any) => s + b.amount, 0);
  const didWin    = totalWon > 0;

  // No internal auto-close – parent controls visibility

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end" dir="rtl">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose}/>
      <div className="relative rounded-t-3xl border-t border-white/10 p-5"
        style={{
          background: "linear-gradient(180deg,#1a0040,#3d0080)",
          animation: "fp-slide-up 0.35s cubic-bezier(0.32,0.72,0,1) forwards",
        }}>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
            style={{ animation: "fp-progress 5s linear forwards" }}/>
        </div>

        <div className="flex flex-col items-center mb-4">
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-3"
            style={{
              background: `linear-gradient(135deg,${fruit.color}33,${fruit.color}11)`,
              border: `3px solid ${fruit.color}`,
              boxShadow: `0 0 40px ${fruit.glow}`,
              animation: "fp-winner-pulse 0.8s ease-in-out infinite",
            }}>
            <span className="text-6xl">{fruit.emoji}</span>
          </div>
          <h2 className="text-white font-black text-2xl">{fruit.label}</h2>
          <p className="text-gray-400 text-sm">الصنف الفائز · ×{fruit.multiplier}</p>
        </div>

        {myBets.length > 0 && (
          <div className="rounded-2xl p-4 mb-4 text-center"
            style={{
              background: didWin ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${didWin ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.3)"}`,
            }}>
            {didWin ? (
              <>
                <p className="text-green-400 font-black text-lg">🎉 مبروك! ربحت</p>
                <p className="text-white font-black text-3xl mt-1">+{totalWon.toLocaleString()}</p>
                <p className="text-gray-400 text-xs mt-1">عملة ذهبية</p>
              </>
            ) : (
              <>
                <p className="text-red-400 font-black text-lg">😔 لم تربح هذه الجولة</p>
                <p className="text-gray-400 text-sm mt-1">خسرت {totalBet.toLocaleString()} عملة</p>
              </>
            )}
          </div>
        )}

        {topBettors.length > 0 && (
          <div className="mb-4">
            <p className="text-yellow-400 font-black text-sm mb-2 flex items-center gap-1">
              <span>🏆</span> أكبر الفائزين
            </p>
            <div className="space-y-2">
              {topBettors.map((b: any, i: number) => (
                <div key={b.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-black text-sm w-5">{i + 1}</span>
                    <span className="text-white text-sm font-bold">{b.profile?.name ?? "مجهول"}</span>
                  </div>
                  <span className="text-green-400 font-black text-sm">+{b.totalWon.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg,#f3d46f,#dca035)", color: "#310b6b" }}>
          متابعة
        </button>
      </div>
      <style>{`
        @keyframes fp-progress { from{width:100%} to{width:0%} }
        @keyframes fp-winner-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes fp-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── Leaderboard Sheet ──────────────────────────────────────────────────────────
function LeaderboardSheet({ leaderboard, todayWinnings, onClose }: any) {
  return (
    <div className="flex flex-col" style={{ background: "linear-gradient(180deg,#0d0020,#1a0040,#3d0080)", minHeight: "100%" }} dir="rtl">
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div>
          <h2 className="text-white font-black text-lg">لوحة الصدارة</h2>
          <p className="text-yellow-400 text-xs">أكبر الفائزين في حفلة ساكي</p>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="rounded-2xl p-3 flex items-center justify-between" style={{ background: "rgba(243,212,111,0.1)", border: "1px solid rgba(243,212,111,0.3)" }}>
          <span className="text-gray-300 text-sm">أرباحي اليوم</span>
          <span className="text-yellow-300 font-black text-lg">{todayWinnings.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {leaderboard.length === 0 && <div className="text-center py-12 text-gray-500">لا توجد بيانات بعد</div>}
        {leaderboard.map((entry: any, i: number) => (
          <div key={entry._id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-8 text-center">
              {i === 0 ? <span className="text-xl">🥇</span>
               : i === 1 ? <span className="text-xl">🥈</span>
               : i === 2 ? <span className="text-xl">🥉</span>
               : <span className="text-gray-500 text-sm">{i + 1}</span>}
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
              {entry.profile?.avatarUrl
                ? <img src={entry.profile.avatarUrl} className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-white font-black text-sm">{entry.profile?.name?.[0] ?? "?"}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{entry.profile?.name ?? "مجهول"}</p>
              <p className="text-gray-500 text-xs">{entry.gamesPlayed} جولة</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-black text-sm">{entry.totalWon.toLocaleString()}</p>
              <p className="text-gray-600 text-[10px]">ربح</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rules Sheet ────────────────────────────────────────────────────────────────
function RulesSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col" style={{ background: "linear-gradient(180deg,#0d0020,#1a0040,#3d0080)", minHeight: "100%" }} dir="rtl">
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <h2 className="text-white font-black text-lg">قواعد اللعبة</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 className="text-yellow-400 font-black mb-2 flex items-center gap-2">
            <span>🎪</span> كيف تلعب؟
          </h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• كل جولة تستمر 20 ثانية للرهان</li>
            <li>• اختر فاكهة واحدة أو أكثر (حتى 6 فواكه)</li>
            <li>• بعد انتهاء الوقت يتم السحب عشوائياً</li>
            <li>• إذا فازت فاكهتك تحصل على رهانك × المضاعف</li>
            <li>• اللعبة مباشرة ومشتركة مع جميع اللاعبين</li>
          </ul>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 className="text-yellow-400 font-black mb-3">المضاعفات</h3>
          <div className="grid grid-cols-3 gap-2">
            {FRUIT_ITEMS.map(f => (
              <div key={f.key} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <p className="text-white text-xs font-bold">{f.label}</p>
                  <p className="font-black text-xs" style={{ color: f.color }}>×{f.multiplier}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "rgba(243,212,111,0.08)", border: "1px solid rgba(243,212,111,0.2)" }}>
          <h3 className="text-yellow-400 font-black mb-2">💡 نصيحة</h3>
          <p className="text-gray-300 text-sm">الفواكه ذات المضاعف الأعلى أصعب في الفوز، لكن مكافأتها أكبر!</p>
        </div>
      </div>
    </div>
  );
}
