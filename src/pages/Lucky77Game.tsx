// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

const BET_AMOUNTS = [1000, 10000, 50000, 100000];

const SEGMENTS = [
  { key: "apple",      label: "تفاح",  mult: 2, color: "#b91c1c", darkColor: "#7f1d1d", emoji: "🍎" },
  { key: "lucky77",   label: "77",     mult: 6, color: "#dca035", darkColor: "#78350f", emoji: "77" },
  { key: "watermelon",label: "بطيخ",  mult: 2, color: "#15803d", darkColor: "#14532d", emoji: "🍉" },
  { key: "apple",      label: "تفاح",  mult: 2, color: "#b91c1c", darkColor: "#7f1d1d", emoji: "🍎" },
  { key: "lucky77",   label: "77",     mult: 6, color: "#dca035", darkColor: "#78350f", emoji: "77" },
  { key: "watermelon",label: "بطيخ",  mult: 2, color: "#15803d", darkColor: "#14532d", emoji: "🍉" },
];

const ZONES = [
  { key: "apple",      label: "تفاح",  emoji: "🍎", mult: 2, color: "#ef4444", glow: "rgba(239,68,68,0.7)" },
  { key: "lucky77",   label: "77",     emoji: "77", mult: 6, color: "#f59e0b", glow: "rgba(245,158,11,0.8)" },
  { key: "watermelon",label: "بطيخ",  emoji: "🍉", mult: 2, color: "#22c55e", glow: "rgba(34,197,94,0.7)" },
];

interface Props { onBack: () => void; }

export default function Lucky77Game({ onBack }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [lastRounds, setLastRounds] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [betsSummary, setBetsSummary] = useState<any>({});
  const [myBets, setMyBets] = useState<any[]>([]);
  const [resultRoundId, setResultRoundId] = useState<string | null>(null);
  const [topWinners, setTopWinners] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setProfile(p);
      }
    };
    fetchData();
  }, []);

  const placeBet = async (args: any) => {};
  const startNewRound = async (args: any) => {};

  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const rotRef           = useRef(0);
  const animRef          = useRef<number>(0);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinCdRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevRoundRef     = useRef<string | null>(null);

  const [selAmt, setSelAmt]             = useState(1000);
  const [placing, setPlacing]           = useState(false);
  const [timeLeft, setTimeLeft]         = useState(0);
  const [spinCountdown, setSpinCountdown] = useState(0);
  const [spinning, setSpinning]         = useState(false);
  const [winnerKey, setWinnerKey]       = useState<string | null>(null);
  const [showResult, setShowResult]     = useState(false);
  const [showLB, setShowLB]             = useState(false);
  const [phase, setPhase]               = useState<"betting" | "stopped" | "spinning" | "result">("betting");

  // ── Draw wheel ──
  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 4;
    const arc = (Math.PI * 2) / SEGMENTS.length;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    SEGMENTS.forEach((seg, i) => {
      const start = i * arc - Math.PI / 2;
      const end   = start + arc;
      const mid   = start + arc / 2;
      const grad  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, seg.color + "cc");
      grad.addColorStop(1, seg.darkColor);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 2; ctx.stroke();

      const iconR = r * 0.62;
      ctx.save();
      ctx.translate(cx + iconR * Math.cos(mid), cy + iconR * Math.sin(mid));
      ctx.rotate(mid + Math.PI / 2);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (seg.key === "lucky77") {
        ctx.font = "bold 28px Arial Black, sans-serif"; ctx.fillStyle = "#fef08a";
        ctx.shadowColor = "rgba(245,158,11,1)"; ctx.shadowBlur = 10;
        ctx.fillText("77", 0, -8); ctx.shadowBlur = 0;
        ctx.font = "bold 12px Arial Black, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillText(`×${seg.mult}`, 0, 12);
      } else {
        ctx.font = "30px serif"; ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 4;
        ctx.fillText(seg.emoji, 0, -8); ctx.shadowBlur = 0;
        ctx.font = "bold 12px Arial Black, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillText(`×${seg.mult}`, 0, 14);
      }
      ctx.restore();
    });

    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath(); ctx.arc(cx + (r + 2) * Math.cos(a), cy + (r + 2) * Math.sin(a), 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fill();
    }
    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#1a0633"; ctx.fill();
    ctx.strokeStyle = "#dca035"; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = "bold 18px Arial Black, sans-serif"; ctx.fillStyle = "#f3d46f";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(243,212,111,0.8)"; ctx.shadowBlur = 10;
    ctx.fillText("77", cx, cy); ctx.shadowBlur = 0;
  }, []);

  useEffect(() => { const t = setTimeout(() => drawWheel(0), 100); return () => clearTimeout(t); }, [drawWheel]);

  // ── Betting timer ──
  useEffect(() => {
    if (!currentRound) return;
    const update = () => setTimeLeft(Math.ceil(Math.max(0, currentRound.endsAt - Date.now()) / 1000));
    update();
    timerRef.current = setInterval(update, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentRound?.endsAt]);

  useEffect(() => { if (currentRound === null) startNewRound().catch(() => {}); }, [currentRound]);

  // ── Phase management ──
  useEffect(() => {
    if (!currentRound) return;
    if (currentRound.status === "betting" && timeLeft > 0) {
      setPhase("betting");
      if (spinCdRef.current) { clearInterval(spinCdRef.current); setSpinCountdown(0); }
    } else if ((currentRound.status === "betting" && timeLeft <= 0) || currentRound.status === "closed") {
      if (phase !== "spinning" && phase !== "result" && phase !== "stopped") {
        setPhase("stopped");
        setSpinCountdown(10);
        if (spinCdRef.current) clearInterval(spinCdRef.current);
        spinCdRef.current = setInterval(() => {
          setSpinCountdown((prev) => {
            if (prev <= 1) { if (spinCdRef.current) clearInterval(spinCdRef.current); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    }
  }, [currentRound?.status, timeLeft]);

  // ── Spin animation ──
  const spinTo = useCallback((targetDeg: number, onDone: () => void) => {
    const start = rotRef.current, diff = targetDeg - start, duration = 8000, startTime = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const current = start + diff * ease;
      rotRef.current = current; drawWheel(current);
      if (t < 1) { animRef.current = requestAnimationFrame(animate); }
      else { rotRef.current = targetDeg; drawWheel(targetDeg); onDone(); }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [drawWheel]);

  // ── Detect finished round → spin ──
  useEffect(() => {
    if (!lastRounds?.length) return;
    const last = lastRounds[0];
    if (!last.winnerZone || last.id === prevRoundRef.current) return;
    prevRoundRef.current = last.id;
    setResultRoundId(last.id);

    const segIdx = SEGMENTS.findIndex((s) => s.key === last.winnerZone);
    if (segIdx < 0) return;

    setPhase("spinning"); setSpinning(true); setWinnerKey(null); setShowResult(false);
    if (spinCdRef.current) { clearInterval(spinCdRef.current); setSpinCountdown(0); }

    const segCenter = segIdx * 60 + 30;
    const offset = (270 - segCenter + 3600) % 360;
    const base = Math.ceil(rotRef.current / 360) * 360;
    const final = base + 6 * 360 + offset;

    cancelAnimationFrame(animRef.current);
    spinTo(final, () => {
      setSpinning(false);
      setWinnerKey(last.winnerZone!);
      setPhase("result");
      setShowResult(true);
      setTimeout(() => {
        setShowResult(false); setWinnerKey(null); setResultRoundId(null);
        setPhase("betting"); setSpinCountdown(0);
      }, 7000);
    });
  }, [lastRounds?.[0]?._id, spinTo]);

  const handleBet = async (zk: string) => {
    if (!currentRound || currentRound.status !== "betting" || timeLeft <= 0 || placing) return;
    setPlacing(true);
    try {
      await placeBet({ roundId: currentRound.id, zoneKey: zk, amount: selAmt });
      toast.success(`✅ رهنت ${selAmt.toLocaleString()} 🪙 على ${ZONES.find(z => z.key === zk)?.label}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setPlacing(false); }
  };

  const myBetMap: Record<string, number> = {};
  myBets?.forEach((b: any) => { myBetMap[b.zoneKey] = (myBetMap[b.zoneKey] ?? 0) + b.amount; });

  const isBetting = currentRound?.status === "betting" && timeLeft > 0;
  const totalPool = Object.values(betsSummary ?? {}).reduce((s: number, v: any) => s + v.total, 0);
  const timerColor = phase === "spinning" ? "#f59e0b" : spinCountdown > 0 ? "#f97316" : timeLeft <= 3 ? "#f85b63" : timeLeft <= 7 ? "#f97316" : "#a855f7";

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  // Center display
  const centerDisplay = isBetting ? timeLeft
    : phase === "spinning" ? "🎰"
    : spinCountdown > 0 ? spinCountdown
    : "✓";

  const centerBg = isBetting ? timerColor
    : phase === "spinning" ? "#f59e0b"
    : spinCountdown > 0 ? "#f97316"
    : "#2d0f51";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
      style={{ background: "#0f041f", color: "white", fontFamily: "'Tajawal', sans-serif" }} dir="rtl">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid rgba(75,16,163,0.4)" }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: "rgba(243,212,111,0.1)", border: "1px solid #f3d46f" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f3d46f" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-2xl leading-none" style={{ color: "#f3d46f", textShadow: "0 0 16px rgba(243,212,111,0.9)" }}>77</span>
              <h1 className="text-white font-black text-base leading-none">Lucky 77</h1>
            </div>
            <p className="text-purple-400 text-[10px] opacity-70">جولة #{currentRound?.roundNumber ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLB(true)} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 text-xl"
            style={{ background: "rgba(243,212,111,0.1)", border: "1px solid #f3d46f" }}>🏆</button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm"
            style={{ background: "#2d0f51", border: "1px solid #4B10A3", color: "#f3d46f" }}>
            <span>{fmt(profile?.goldCoins ?? 0)}</span><span>💰</span>
          </div>
        </div>
      </div>

      {/* ── WHEEL AREA ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle,#a855f7,transparent 70%)" }} />
        </div>

        {/* Phase badge */}
        <div className="mb-4 z-10">
          {phase === "betting" && isBetting && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)" }}>
              <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: "l77-blink 1s ease-in-out infinite" }} />
              <span className="text-purple-300 font-black text-xs">الرهان مفتوح — {timeLeft}s</span>
            </div>
          )}
          {phase === "stopped" && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)" }}>
              <div className="w-2 h-2 rounded-full bg-orange-400" style={{ animation: "l77-blink 0.5s ease-in-out infinite" }} />
              <span className="text-orange-300 font-black text-xs">🎰 الدوران خلال {spinCountdown}s</span>
            </div>
          )}
          {phase === "spinning" && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)" }}>
              <span className="text-base" style={{ animation: "l77-spin-icon 0.4s linear infinite", display: "inline-block" }}>🎰</span>
              <span className="text-yellow-300 font-black text-xs">جاري الدوران...</span>
            </div>
          )}
          {phase === "result" && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)" }}>
              <span className="text-base">🎉</span>
              <span className="text-green-300 font-black text-xs">النتيجة!</span>
            </div>
          )}
        </div>

        {/* Wheel */}
        <div className="relative z-10" style={{ width: 280, height: 280 }}>
          {spinning && [1,2,3].map((i) => (
            <div key={i} className="absolute rounded-full border pointer-events-none"
              style={{ width: `${280+i*20}px`, height: `${280+i*20}px`, top:"50%", left:"50%",
                transform:"translate(-50%,-50%)", borderColor:`rgba(220,160,53,${0.3-i*0.08})`,
                animation:`l77-wave ${0.7+i*0.2}s ease-out infinite`, animationDelay:`${i*0.12}s` }} />
          ))}
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border:"8px solid #dca035", borderRadius:"50%", zIndex:2,
              boxShadow: spinning ? "0 0 40px rgba(220,160,53,0.7)" : "0 0 20px rgba(220,160,53,0.3)" }} />
          <canvas ref={canvasRef} width={500} height={500}
            style={{ width:"100%", height:"100%", borderRadius:"50%", display:"block", position:"relative", zIndex:1 }} />
          {/* Center timer */}
          <div className="absolute flex items-center justify-center font-black text-xl"
            style={{ top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:52, height:52,
              borderRadius:"50%", background: centerBg, border:"3px solid white", zIndex:20, color:"white",
              boxShadow: `0 0 16px ${centerBg}`, transition:"background 0.3s" }}>
            {centerDisplay}
          </div>
          {/* Arrow */}
          <div className="absolute z-30 pointer-events-none"
            style={{ bottom:-18, left:"50%", transform:"translateX(-50%)", width:0, height:0,
              borderLeft:"14px solid transparent", borderRight:"14px solid transparent",
              borderBottom:"24px solid white", filter:"drop-shadow(0 0 8px rgba(255,255,255,0.8))" }} />
        </div>

        {/* Betting progress bar */}
        {isBetting && (
          <div className="mt-5 w-64 z-10">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-400">المجموع: {fmt(totalPool)} 🪙</span>
              <span className="font-black" style={{ color: timerColor }}>{timeLeft}s</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-100"
                style={{ width:`${Math.min(100,(timeLeft/20)*100)}%`,
                  background:`linear-gradient(90deg,${timerColor},${timerColor}80)`, boxShadow:`0 0 8px ${timerColor}` }} />
            </div>
          </div>
        )}

        {/* Spin countdown bar */}
        {phase === "stopped" && spinCountdown > 0 && (
          <div className="mt-5 w-64 z-10">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-orange-400 font-black">🎰 الدوران خلال</span>
              <span className="font-black text-orange-400">{spinCountdown}s</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width:`${(spinCountdown/10)*100}%`,
                  background:"linear-gradient(90deg,#f97316,#f59e0b)", boxShadow:"0 0 8px #f97316" }} />
            </div>
          </div>
        )}

        {/* Last rounds */}
        <div className="mt-4 z-10 flex gap-2 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth:"none", maxWidth:"100%" }}>
          {lastRounds?.slice(0,8).map((round: any, idx: number) => {
            const seg = SEGMENTS.find((s) => s.key === round.winnerZone);
            return (
              <div key={round._id} className="flex-shrink-0 flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5"
                style={{ background: idx===0 ? `${seg?.color??"#a855f7"}25` : "rgba(255,255,255,0.04)",
                  border: idx===0 ? `1px solid ${seg?.color??"#a855f7"}60` : "1px solid rgba(255,255,255,0.07)", minWidth:44 }}>
                {seg?.key==="lucky77" ? <span className="font-black text-sm" style={{color:seg.color}}>77</span>
                  : <span className="text-base">{seg?.emoji??"❓"}</span>}
                <span className="text-[8px] font-black" style={{color:seg?.color??"#fff"}}>×{seg?.mult}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BET PANEL ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6"
        style={{ background:"#1a0633", borderRadius:"25px 25px 0 0", borderTop:"2px solid #3d156d" }}>
        <div className="flex gap-2.5 mb-4">
          {ZONES.map((zone) => {
            const myBet = myBetMap[zone.key] ?? 0;
            const pool  = (betsSummary as any)?.[zone.key]?.total ?? 0;
            const isWinner = winnerKey === zone.key;
            return (
              <button key={zone.key} onClick={() => handleBet(zone.key)} disabled={!isBetting || placing}
                className="flex-1 relative rounded-2xl py-3 flex flex-col items-center gap-1.5 transition-all active:scale-95"
                style={{ background: isWinner ? `linear-gradient(135deg,${zone.color}30,${zone.color}10)` : myBet>0 ? `linear-gradient(135deg,${zone.color}20,rgba(45,15,81,0.8))` : "#2d0f51",
                  border: isWinner ? `2px solid ${zone.color}` : myBet>0 ? `2px solid ${zone.color}80` : "2px solid #4B10A3",
                  boxShadow: isWinner ? `0 0 24px ${zone.glow}` : myBet>0 ? `0 0 12px ${zone.glow}50` : "none",
                  opacity: !isBetting && !isWinner && phase!=="result" ? 0.55 : 1,
                  animation: isWinner ? "l77-winner-pulse 0.6s ease-in-out infinite" : "none" }}>
                {myBet > 0 && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black"
                    style={{ background:"#f85b63", color:"white", whiteSpace:"nowrap" }}>{fmt(myBet)}</div>
                )}
                {zone.key==="lucky77"
                  ? <span className="font-black leading-none" style={{fontSize:32,color:zone.color,textShadow:`0 0 14px ${zone.glow}`,fontFamily:"Arial Black, sans-serif"}}>77</span>
                  : <span style={{fontSize:36,lineHeight:1,filter:`drop-shadow(0 2px 6px ${zone.glow})`}}>{zone.emoji}</span>}
                <span className="text-white text-[11px] font-black">{zone.label}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{background:`${zone.color}25`,color:zone.color,border:`1px solid ${zone.color}50`}}>×{zone.mult}</span>
                {pool > 0 && <span className="text-[8px] text-gray-500">{fmt(pool)} 🪙</span>}
              </button>
            );
          })}
        </div>
        <div className="flex justify-center gap-3">
          {BET_AMOUNTS.map((amt) => (
            <button key={amt} onClick={() => setSelAmt(amt)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-[10px] font-black transition-all active:scale-90"
              style={selAmt===amt ? {background:"#f3d46f",color:"#1a0633",border:"2px solid white",transform:"scale(1.12)",boxShadow:"0 0 16px rgba(243,212,111,0.6)"}
                : {background:"#6518b4",color:"white",border:"2px dashed rgba(255,255,255,0.4)"}}>
              {amt>=1000 ? `${(amt/1000).toFixed(0)}K` : amt}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESULT BOTTOM SHEET ── */}
      {showResult && winnerKey && (() => {
        const zone = ZONES.find((z) => z.key === winnerKey)!;
        const myBetAmt = myBetMap[winnerKey] ?? 0;
        const myWin = myBetAmt > 0 ? myBetAmt * zone.mult : 0;
        const didWin = myWin > 0;
        return (
          <>
            <div className="fixed inset-0 z-[90]" style={{background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}} />
            <div className="fixed bottom-0 left-0 w-full z-[100] rounded-t-3xl px-5 pt-4 pb-8"
              style={{background:"linear-gradient(180deg,#1a0633 0%,#0f041f 100%)",borderTop:`4px solid ${zone.color}`,
                boxShadow:`0 -12px 50px ${zone.glow}`,animation:"l77-slide-up 0.45s cubic-bezier(0.2,1,0.3,1)"}}>
              <div className="flex justify-center mb-3"><div className="w-10 h-1 rounded-full" style={{background:"rgba(255,255,255,0.2)"}} /></div>
              <p className="text-center font-black text-xs mb-3" style={{color:"rgba(255,255,255,0.45)",letterSpacing:2}}>🎡 نتيجة الجولة</p>

              {/* Winner */}
              <div className="flex items-center justify-center gap-5 mb-4 py-3 rounded-2xl"
                style={{background:`linear-gradient(135deg,${zone.color}20,${zone.color}06)`,border:`1px solid ${zone.color}40`}}>
                {zone.key==="lucky77"
                  ? <span className="font-black" style={{fontSize:52,color:zone.color,textShadow:`0 0 24px ${zone.glow}`,fontFamily:"Arial Black, sans-serif",lineHeight:1,animation:"l77-winner-pulse 0.7s ease-in-out infinite"}}>77</span>
                  : <span style={{fontSize:52,lineHeight:1,filter:`drop-shadow(0 0 14px ${zone.glow})`,animation:"l77-bounce 0.5s ease-in-out 4"}}>{zone.emoji}</span>}
                <div>
                  <p className="text-white font-black text-xl">{zone.label}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{background:`${zone.color}25`,color:zone.color,border:`1px solid ${zone.color}50`}}>×{zone.mult}</span>
                    {didWin ? <span className="text-green-400 font-black text-lg">+{fmt(myWin)} 🪙</span>
                      : myBetAmt>0 ? <span className="text-red-400 font-black text-sm">-{fmt(myBetAmt)} 🪙</span> : null}
                  </div>
                  {didWin && <p className="text-green-400 text-xs font-bold mt-0.5">🎊 مبروك! ربحت</p>}
                  {myBetAmt>0 && !didWin && <p className="text-red-400 text-xs mt-0.5">حظاً أوفر القادمة!</p>}
                </div>
              </div>

              {/* Top 3 */}
              <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div className="px-3 py-2 border-b" style={{borderColor:"rgba(255,255,255,0.06)"}}>
                  <p className="text-gray-400 text-[11px] font-black text-center">🏆 أعلى 3 فائزين في الجولة</p>
                </div>
                {!topWinners || topWinners.length === 0
                  ? <p className="text-gray-600 text-xs text-center py-4">لا يوجد فائزون في هذه الجولة</p>
                  : topWinners.map((entry: any, idx: number) => {
                    const medal = idx===0?"🥇":idx===1?"🥈":"🥉";
                    const nc = idx===0?"#f3d46f":idx===1?"#c0c0c0":"#cd7f32";
                    return (
                      <div key={entry.userId} className="flex items-center gap-3 px-3 py-2.5"
                        style={{background:idx===0?"rgba(243,212,111,0.06)":"transparent",borderBottom:idx<topWinners.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                        <span className="text-lg flex-shrink-0">{medal}</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{border:`2px solid ${nc}`,background:`linear-gradient(135deg,${zone.color},#000)`}}>
                          {entry.profile?.avatarUrl
                            ? <img src={entry.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center font-black text-xs text-white">{entry.profile?.name?.[0]??"؟"}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm truncate" style={{color:nc}}>{entry.profile?.name??"مجهول"}</p>
                          <p className="text-gray-500 text-[9px]">فائز 🎉</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-green-400 font-black text-sm">+{fmt(entry.totalWon)}</p>
                          <p className="text-gray-600 text-[9px]">🪙</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <p className="text-center text-gray-600 text-[10px] mt-3 font-bold">⏳ جولة جديدة تبدأ قريباً...</p>
            </div>
          </>
        );
      })()}

      {/* ── LEADERBOARD ── */}
      {showLB && (
        <div className="fixed inset-0 z-[250] flex flex-col justify-end"
          style={{background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)"}} onClick={() => setShowLB(false)}>
          <div className="w-full rounded-t-3xl flex flex-col"
            style={{background:"#0f041f",border:"1px solid rgba(75,16,163,0.4)",maxHeight:"75vh"}} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:"rgba(255,255,255,0.07)"}}>
              <h2 className="text-white font-black text-base">🏆 المتصدرون</h2>
              <button onClick={() => setShowLB(false)} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-3 py-3 space-y-2">
              {!leaderboard ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : leaderboard.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-10">لا يوجد لاعبون بعد</p>
              ) : (
                (leaderboard as any[]).map((entry: any, idx: number) => (
                  <div key={entry._id} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
                    style={{background:idx===0?"rgba(243,212,111,0.08)":"rgba(255,255,255,0.03)",border:idx===0?"1px solid rgba(243,212,111,0.3)":"1px solid rgba(255,255,255,0.06)"}}>
                    <span className="text-base font-black w-6 text-center flex-shrink-0">{idx===0?"🥇":idx===1?"🥈":idx===2?"🥉":`${idx+1}`}</span>
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{background:"linear-gradient(135deg,#a855f7,#7c3aed)"}}>
                      {entry.profile?.avatarUrl ? <img src={entry.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white font-black text-xs">{entry.profile?.name?.[0]??"؟"}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-xs truncate">{entry.profile?.name??"مجهول"}</p>
                      <p className="text-gray-500 text-[9px]">{entry.gamesPlayed} جولة</p>
                    </div>
                    <p className="text-yellow-400 font-black text-xs">{fmt(entry.totalWon)} 🪙</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes l77-blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes l77-spin-icon{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes l77-wave{0%{transform:translate(-50%,-50%) scale(0.85);opacity:0.6}100%{transform:translate(-50%,-50%) scale(1.5);opacity:0}}
        @keyframes l77-winner-pulse{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.06);filter:brightness(1.3)}}
        @keyframes l77-bounce{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.05)}}
        @keyframes l77-slide-up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
    </div>
  );
}
