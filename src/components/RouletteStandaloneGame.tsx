// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const WHEEL_ORDER = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,
  24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];
const SEGMENT_COUNT = WHEEL_ORDER.length;
const SEGMENT_ANGLE = (2 * Math.PI) / SEGMENT_COUNT;

function getColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.includes(n) ? "red" : "black";
}

function fmtCoins(n: number): string {
  if (!n && n !== 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "") + "T";
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

const BET_ZONES = [
  { id: "zero",   type: "zero",   value: "0",     label: "0",     mult: 36, color: "#22c55e", bg: "linear-gradient(135deg,#14532d,#16a34a)" },
  { id: "r1-12",  type: "range",  value: "1-12",  label: "1-12",  mult: 3,  color: "#60a5fa", bg: "linear-gradient(135deg,#1e3a8a,#2563eb)" },
  { id: "r13-24", type: "range",  value: "13-24", label: "13-24", mult: 3,  color: "#60a5fa", bg: "linear-gradient(135deg,#1e3a8a,#2563eb)" },
  { id: "r25-36", type: "range",  value: "25-36", label: "25-36", mult: 3,  color: "#60a5fa", bg: "linear-gradient(135deg,#1e3a8a,#2563eb)" },
  { id: "red",    type: "color",  value: "red",   label: "احمر",  mult: 2,  color: "#f87171", bg: "linear-gradient(135deg,#7f1d1d,#dc2626)" },
  { id: "black",  type: "color",  value: "black", label: "اسود",  mult: 2,  color: "#9ca3af", bg: "linear-gradient(135deg,#111827,#374151)" },
  { id: "odd",    type: "parity", value: "odd",   label: "فردي",  mult: 2,  color: "#c084fc", bg: "linear-gradient(135deg,#4c1d95,#7c3aed)" },
  { id: "even",   type: "parity", value: "even",  label: "زوجي",  mult: 2,  color: "#22d3ee", bg: "linear-gradient(135deg,#164e63,#0891b2)" },
];

const CHIP_VALUES = [1000, 10000, 100000, 1000000];
const CHIP_COLORS = ["#ef4444","#3b82f6","#22c55e","#ffd700"];

// ── 3D Roulette Wheel ──
function RouletteWheel3D({ spinning, winNumber, onSpinEnd, phase }: {
  spinning: boolean; winNumber?: number; onSpinEnd?: () => void; phase: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);
  const hasEndedRef = useRef(false);
  const ballAngleRef = useRef(0);
  const ballRRef = useRef(0);

  const draw = useCallback((wa: number, ba: number, br: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const outerR = Math.min(cx, cy) - 8;
    const innerR = outerR * 0.50;
    const numR = outerR * 0.80;

    ctx.clearRect(0, 0, W, H);

    // Felt background
    const feltGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR + 20);
    feltGrad.addColorStop(0, "#1a4a1a");
    feltGrad.addColorStop(1, "#0a1f0a");
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 20, 0, 2 * Math.PI);
    ctx.fillStyle = feltGrad;
    ctx.fill();

    // Gold rim
    for (let i = 3; i >= 0; i--) {
      const rg = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
      rg.addColorStop(0, i === 0 ? "#fff8dc" : "#d4a017");
      rg.addColorStop(0.5, "#b8860b");
      rg.addColorStop(1, "#5c4000");
      ctx.beginPath();
      ctx.arc(cx, cy, outerR + 10 - i * 2, 0, 2 * Math.PI);
      ctx.strokeStyle = rg;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    // Segments
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const startA = wa + i * SEGMENT_ANGLE - Math.PI / 2;
      const endA = startA + SEGMENT_ANGLE;
      const num = WHEEL_ORDER[i];
      const col = getColor(num);
      const midA = startA + SEGMENT_ANGLE / 2;
      const baseC = col === "green" ? "#15803d" : col === "red" ? "#b91c1c" : "#111827";
      const lightC = col === "green" ? "#22c55e" : col === "red" ? "#ef4444" : "#374151";
      const sg = ctx.createLinearGradient(
        cx + Math.cos(midA - 0.3) * innerR, cy + Math.sin(midA - 0.3) * innerR,
        cx + Math.cos(midA) * outerR, cy + Math.sin(midA) * outerR
      );
      sg.addColorStop(0, lightC);
      sg.addColorStop(1, baseC);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startA, endA);
      ctx.closePath();
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,215,0,0.5)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // Number
      const tx = cx + numR * Math.cos(midA);
      const ty = cy + numR * Math.sin(midA);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midA + Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${outerR > 90 ? 8 : 6}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 4;
      ctx.fillText(String(num), 0, 0);
      ctx.restore();
    }

    // Inner bowl
    const bowlGrad = ctx.createRadialGradient(cx - innerR * 0.25, cy - innerR * 0.25, 2, cx, cy, innerR);
    bowlGrad.addColorStop(0, "#3d1a00");
    bowlGrad.addColorStop(0.6, "#1a0800");
    bowlGrad.addColorStop(1, "#0a0400");
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = bowlGrad;
    ctx.fill();
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner rings
    for (let r = innerR * 0.9; r > innerR * 0.3; r -= innerR * 0.15) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,215,0,0.12)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Center gem
    const gemR = innerR * 0.2;
    const gemGrad = ctx.createRadialGradient(cx - gemR * 0.3, cy - gemR * 0.3, gemR * 0.05, cx, cy, gemR);
    gemGrad.addColorStop(0, "#fff8dc");
    gemGrad.addColorStop(0.3, "#ffd700");
    gemGrad.addColorStop(0.7, "#b8860b");
    gemGrad.addColorStop(1, "#5c4000");
    ctx.beginPath();
    ctx.arc(cx, cy, gemR, 0, 2 * Math.PI);
    ctx.fillStyle = gemGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pointer
    ctx.save();
    ctx.translate(cx, cy - outerR - 2);
    const pGrad = ctx.createLinearGradient(-5, 0, 5, 22);
    pGrad.addColorStop(0, "#fff8dc");
    pGrad.addColorStop(0.5, "#ffd700");
    pGrad.addColorStop(1, "#8b6914");
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-7, 22);
    ctx.lineTo(7, 22);
    ctx.closePath();
    ctx.fillStyle = pGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Ball
    if (br > 0) {
      const bx = cx + br * Math.cos(ba);
      const by = cy + br * Math.sin(ba);
      ctx.beginPath();
      ctx.arc(bx + 2, by + 2, 7, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fill();
      const bGrad = ctx.createRadialGradient(bx - 2.5, by - 2.5, 0.5, bx, by, 7);
      bGrad.addColorStop(0, "#ffffff");
      bGrad.addColorStop(0.3, "#e8e8e8");
      bGrad.addColorStop(0.7, "#b0b0b0");
      bGrad.addColorStop(1, "#606060");
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, 2 * Math.PI);
      ctx.fillStyle = bGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx - 2, by - 2, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fill();
    }
  }, []);

  useEffect(() => { draw(angleRef.current, ballAngleRef.current, ballRRef.current); }, []);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    if (!spinning) {
      if (phase === "spinning" && winNumber !== undefined) {
        const idx = WHEEL_ORDER.indexOf(winNumber);
        const canvas = canvasRef.current;
        const outerR = canvas ? (Math.min(canvas.width, canvas.height) / 2 - 8) : 90;
        const settleR = outerR * 0.72;
        const segMid = angleRef.current + idx * SEGMENT_ANGLE - Math.PI / 2 + SEGMENT_ANGLE / 2;
        ballAngleRef.current = segMid;
        ballRRef.current = settleR;
        draw(angleRef.current, ballAngleRef.current, ballRRef.current);
      }
      return;
    }
    hasEndedRef.current = false;
    const canvas = canvasRef.current;
    const outerR = canvas ? (Math.min(canvas.width, canvas.height) / 2 - 8) : 90;
    const trackR = outerR * 0.92;
    const settleR = outerR * 0.72;
    ballAngleRef.current = 0;
    ballRRef.current = trackR;
    const startAngle = angleRef.current;
    const startTime = performance.now();
    const duration = 5000;
    let targetWheelAngle = startAngle;
    if (winNumber !== undefined) {
      const idx = WHEEL_ORDER.indexOf(winNumber);
      if (idx >= 0) {
        const target = -(idx * SEGMENT_ANGLE) + Math.PI / 2 - SEGMENT_ANGLE / 2;
        const fullRots = (8 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
        targetWheelAngle = target - fullRots;
      }
    }
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      angleRef.current = startAngle + (targetWheelAngle - startAngle) * eased;
      const ballSpeed = 0.20 * (1 - eased * 0.88);
      ballAngleRef.current -= ballSpeed;
      if (progress < 0.72) {
        ballRRef.current = trackR;
      } else {
        const sp = (progress - 0.72) / 0.28;
        ballRRef.current = trackR - (trackR - settleR) * sp;
      }
      draw(angleRef.current, ballAngleRef.current, ballRRef.current);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        if (!hasEndedRef.current) {
          hasEndedRef.current = true;
          onSpinEnd?.();
        }
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [spinning, winNumber]);

  return (
    <div style={{ filter: "drop-shadow(0 12px 40px rgba(255,215,0,0.4))" }}>
      <canvas ref={canvasRef} width={230} height={230} style={{ borderRadius: "50%", display: "block" }} />
    </div>
  );
}

// ── Result Popup ──
function ResultPopup({ round, myBets, topWinners, onClose }: {
  round: any; myBets: any[]; topWinners: any[]; onClose: () => void;
}) {
  const [cd, setCd] = useState(5);
  useEffect(() => {
    const t = setInterval(() => setCd(p => {
      if (p <= 1) { clearInterval(t); onClose(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, []);

  const totalBet = myBets.reduce((s, b) => s + b.amount, 0);
  const totalWin = myBets.filter(b => b.won).reduce((s, b) => s + (b.payout ?? 0), 0);
  const profit = totalWin - totalBet;
  const winNum = round?.winNumber;
  const winCol = winNum !== undefined ? getColor(winNum) : "green";
  const colHex = winCol === "red" ? "#ef4444" : winCol === "green" ? "#22c55e" : "#9ca3af";
  const medals = ["#ffd700", "#c0c0c0", "#cd7f32"];

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}>
      <div className="relative mx-4 rounded-3xl overflow-hidden w-full max-w-xs"
        style={{ background: "linear-gradient(180deg,#0d0d1f,#080812)", border: "1px solid rgba(255,215,0,0.35)", boxShadow: "0 0 80px rgba(255,215,0,0.2)" }}>
        <div className="h-1" style={{ background: "linear-gradient(90deg,#ffd700,#f59e0b,#ffd700)" }} />
        <div className="p-5 space-y-4">
          {/* Countdown */}
          <div className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)", color: "#ffd700" }}>
            {cd}
          </div>
          {/* Win number */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">الرقم الفائز</p>
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl relative"
              style={{ background: `radial-gradient(circle at 35% 35%, ${colHex}cc, ${colHex}33)`, border: `3px solid ${colHex}`, boxShadow: `0 0 40px ${colHex}66`, color: "#fff" }}>
              {winNum}
              <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%)" }} />
            </div>
            <span className="text-sm font-bold" style={{ color: colHex }}>
              {winCol === "red" ? "احمر" : winCol === "green" ? "اخضر" : "اسود"}
            </span>
          </div>
          {/* My result */}
          {totalBet > 0 && (
            <div className="rounded-2xl p-3 text-center"
              style={{ background: profit > 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${profit > 0 ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}` }}>
              <p className="text-gray-500 text-[10px] mb-1">رهانك: {fmtCoins(totalBet)}</p>
              <p className="font-black text-xl" style={{ color: profit > 0 ? "#22c55e" : "#ef4444" }}>
                {profit > 0 ? `+ ${fmtCoins(profit)}` : `- ${fmtCoins(totalBet)}`}
              </p>
              <p className="text-gray-600 text-[10px] mt-0.5">{profit > 0 ? "مبروك الفوز!" : "حظ اوفر المرة القادمة"}</p>
            </div>
          )}
          {/* Top 3 */}
          {topWinners.length > 0 && (
            <div>
              <p className="text-center text-[10px] font-black mb-2" style={{ color: "#ffd700" }}>اكبر الرابحين</p>
              <div className="space-y-1.5">
                {topWinners.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: i === 0 ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.05)"}` }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                      style={{ background: medals[i], color: "#000" }}>{i + 1}</div>
                    {w.profile?.avatarUrl
                      ? <img src={w.profile.avatarUrl} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: "rgba(255,215,0,0.2)", color: "#ffd700" }}>
                          {(w.profile?.name || "?")[0]}
                        </div>
                    }
                    <span className="flex-1 text-white text-[11px] font-bold truncate">{w.profile?.name || "لاعب"}</span>
                    <span className="text-[11px] font-black" style={{ color: "#22c55e" }}>+{fmtCoins(w.won)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard Sheet ──
function LeaderboardSheet({ onClose }: { onClose: () => void }) {
  const lb = useQuery(api.rouletteStandalone.getDailyLeaderboard);
  const medals = ["#ffd700", "#c0c0c0", "#cd7f32"];
  return (
    <div className="fixed inset-0 z-[600] flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="rounded-t-3xl overflow-hidden" style={{ background: "linear-gradient(180deg,#0d0d1f,#080812)", border: "1px solid rgba(255,215,0,0.2)", maxHeight: "70vh" }} onClick={e => e.stopPropagation()}>
        <div className="h-1" style={{ background: "linear-gradient(90deg,#ffd700,#f59e0b,#ffd700)" }} />
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-white font-black text-base">ترتيب اليوم</h2>
            <p className="text-gray-500 text-[10px]">اكثر الرابحين اليوم</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-6 space-y-2" style={{ maxHeight: "55vh" }}>
          {(!lb || lb.length === 0) && (
            <div className="text-center py-8 text-gray-600 text-sm">لا توجد بيانات بعد</div>
          )}
          {lb?.map((e, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: i < 3 ? "rgba(255,215,0,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${i < 3 ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)"}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: i < 3 ? medals[i] : "rgba(255,255,255,0.08)", color: i < 3 ? "#000" : "#9ca3af" }}>
                {i + 1}
              </div>
              {e.profile?.avatarUrl
                ? <img src={e.profile.avatarUrl} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                : <div className="w-9 h-9 rounded-full flex items-center justify-center font-black flex-shrink-0"
                    style={{ background: "rgba(255,215,0,0.15)", color: "#ffd700", fontSize: "14px" }}>
                    {(e.profile?.name || "?")[0]}
                  </div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{e.profile?.name || "لاعب"}</p>
                <p className="text-gray-500 text-[10px]">{e.roundsPlayed} جولة</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm" style={{ color: "#22c55e" }}>+{fmtCoins(e.todayWon)}</p>
                <p className="text-gray-600 text-[9px]">اليوم</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Game ──
export default function RouletteStandaloneGame({ onBack }: { onBack: () => void }) {
  const myProfile = useQuery(api.profiles.getMyProfile);
  const activeRound = useQuery(api.rouletteStandalone.getActiveRound);
  const myBets = useQuery(
    api.rouletteStandalone.getMyBetsForRound,
    activeRound ? { roundId: activeRound._id } : "skip"
  );
  const recentRounds = useQuery(api.rouletteStandalone.getRecentRounds);
  const topWinners = useQuery(
    api.rouletteStandalone.getRoundTopWinners,
    activeRound?.status === "finished" ? { roundId: activeRound._id } : "skip"
  );

  const ensureRound = useMutation(api.rouletteStandalone.ensureRoundExists);
  const placeBetMut = useMutation(api.rouletteStandalone.placeBet);

  const [selectedChip, setSelectedChip] = useState(1000);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showLB, setShowLB] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastFinishedId, setLastFinishedId] = useState<string | null>(null);
  const [resultRound, setResultRound] = useState<any>(null);
  const [resultBets, setResultBets] = useState<any[]>([]);
  const [resultWinners, setResultWinners] = useState<any[]>([]);

  const coins = myProfile?.goldCoins ?? 0;

  // Ensure round exists on mount
  useEffect(() => {
    ensureRound().catch(() => {});
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!activeRound || activeRound.status !== "betting") { setTimeLeft(0); return; }
    const update = () => {
      const left = Math.max(0, Math.ceil((activeRound.bettingEndsAt - Date.now()) / 1000));
      setTimeLeft(left);
    };
    update();
    const t = setInterval(update, 200);
    return () => clearInterval(t);
  }, [activeRound?.bettingEndsAt, activeRound?.status]);

  // Track spinning state
  useEffect(() => {
    if (activeRound?.status === "spinning") {
      setSpinning(true);
    } else {
      setSpinning(false);
    }
  }, [activeRound?.status]);

  // Show result when round finishes
  useEffect(() => {
    if (activeRound?.status === "finished" && activeRound._id !== lastFinishedId) {
      setLastFinishedId(activeRound._id);
      setResultRound(activeRound);
      setResultBets(myBets ?? []);
      setResultWinners(topWinners ?? []);
      setTimeout(() => setShowResult(true), 500);
    }
  }, [activeRound?.status, activeRound?._id, myBets, topWinners]);

  const handleBet = async (betType: string, betValue: string) => {
    if (!activeRound || activeRound.status !== "betting") {
      toast.error("لا يمكن الرهان الآن");
      return;
    }
    if (timeLeft <= 0) { toast.error("انتهى وقت الرهان"); return; }
    if (coins < selectedChip) { toast.error("رصيدك غير كافٍ"); return; }
    try {
      await placeBetMut({ roundId: activeRound._id, betType, betValue, amount: selectedChip });
    } catch (e: any) { toast.error(e.message); }
  };

  // Build bets map
  const myBetsMap: Record<string, number> = {};
  if (myBets) {
    for (const b of myBets) {
      myBetsMap[`${b.betType}_${b.betValue}`] = (myBetsMap[`${b.betType}_${b.betValue}`] ?? 0) + b.amount;
    }
  }
  const totalBet = Object.values(myBetsMap).reduce((a, b) => a + b, 0);

  const isBetting = activeRound?.status === "betting" && timeLeft > 0;
  const isSpinning = activeRound?.status === "spinning";
  const winNum = activeRound?.winNumber;
  const winCol = winNum !== undefined ? getColor(winNum) : null;
  const colHex = winCol === "red" ? "#ef4444" : winCol === "green" ? "#22c55e" : "#9ca3af";

  // Timer bar progress
  const timerPct = activeRound?.status === "betting"
    ? Math.max(0, Math.min(100, (timeLeft / 20) * 100))
    : 0;
  const timerColor = timeLeft > 10 ? "#22c55e" : timeLeft > 5 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col h-full text-white" dir="rtl"
      style={{ background: "linear-gradient(180deg,#0a0a14 0%,#060610 100%)" }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(255,215,0,0.15)" }}>
        {/* Back */}
        <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-black text-sm">روليت</span>
            {activeRound?.status === "betting" && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-[9px] font-black">رهان مفتوح</span>
              </div>
            )}
            {activeRound?.status === "spinning" && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-[9px] font-black">يدور...</span>
              </div>
            )}
          </div>
        </div>
        {/* Leaderboard btn */}
        <button onClick={() => setShowLB(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90"
          style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>
        {/* Balance */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl flex-shrink-0"
          style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffd700"><circle cx="12" cy="12" r="10"/></svg>
          <span className="text-yellow-300 font-black text-xs">{fmtCoins(coins)}</span>
        </div>
      </div>

      {/* ── Timer Bar ── */}
      {activeRound?.status === "betting" && (
        <div className="flex-shrink-0 px-3 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold" style={{ color: timerColor }}>
              {timeLeft > 0 ? `وقت الرهان: ${timeLeft}ث` : "توقف الرهان"}
            </span>
            {totalBet > 0 && (
              <span className="text-[10px] text-yellow-400 font-bold">رهانك: {fmtCoins(totalBet)}</span>
            )}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-200"
              style={{ width: `${timerPct}%`, background: `linear-gradient(90deg,${timerColor},${timerColor}88)`, boxShadow: `0 0 8px ${timerColor}66` }} />
          </div>
        </div>
      )}
      {activeRound?.status === "spinning" && (
        <div className="flex-shrink-0 px-3 pt-2">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: "100%", background: "linear-gradient(90deg,#ef4444,#ffd700,#ef4444)", animation: "rlt-pulse 1s ease-in-out infinite" }} />
          </div>
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 pt-2">

        {/* Wheel + History row */}
        <div className="flex items-start gap-3">
          {/* Wheel */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <RouletteWheel3D
              spinning={spinning}
              winNumber={winNum}
              onSpinEnd={() => {}}
              phase={activeRound?.status ?? "betting"}
            />
            {/* Win number overlay */}
            {isSpinning && winNum !== undefined && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{ background: `${colHex}22`, border: `1px solid ${colHex}55` }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: colHex, color: "#fff" }}>{winNum}</div>
                <span className="text-[10px] font-bold" style={{ color: colHex }}>
                  {winCol === "red" ? "احمر" : winCol === "green" ? "اخضر" : "اسود"}
                </span>
              </div>
            )}
          </div>

          {/* Right side: history + balance info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* My stats */}
            <div className="rounded-2xl p-2.5 space-y-1.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-[10px]">رصيدي</span>
                <span className="text-yellow-300 font-black text-xs">{fmtCoins(coins)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-[10px]">رهاني</span>
                <span className="font-black text-xs" style={{ color: totalBet > 0 ? "#f59e0b" : "#4b5563" }}>
                  {totalBet > 0 ? fmtCoins(totalBet) : "—"}
                </span>
              </div>
            </div>

            {/* History */}
            <div>
              <p className="text-gray-600 text-[9px] font-bold mb-1">آخر النتائج</p>
              <div className="flex flex-wrap gap-1">
                {(!recentRounds || recentRounds.length === 0) && (
                  <span className="text-gray-700 text-[9px]">لا توجد نتائج</span>
                )}
                {recentRounds?.slice(0, 10).map((r, i) => {
                  if (r.winNumber === undefined) return null;
                  const c = getColor(r.winNumber);
                  const bg = c === "red" ? "#b91c1c" : c === "green" ? "#15803d" : "#1f2937";
                  return (
                    <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                      style={{ background: bg, border: "1px solid rgba(255,255,255,0.15)" }}>
                      {r.winNumber}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bet Zones: 2 rows of 4 ── */}
        <div>
          <p className="text-gray-500 text-[10px] font-bold mb-1.5">مناطق الرهان</p>
          <div className="grid grid-cols-4 gap-1.5">
            {BET_ZONES.map((zone) => {
              const key = `${zone.type}_${zone.value}`;
              const myBet = myBetsMap[key] ?? 0;
              const hasBet = myBet > 0;
              return (
                <button key={zone.id}
                  onClick={() => handleBet(zone.type, zone.value)}
                  disabled={!isBetting}
                  className="relative rounded-xl flex flex-col items-center justify-center active:scale-95 transition-all disabled:opacity-50"
                  style={{
                    background: zone.bg,
                    border: hasBet ? `2px solid ${zone.color}` : `1px solid ${zone.color}44`,
                    boxShadow: hasBet ? `0 0 12px ${zone.color}66` : "none",
                    height: "52px",
                    transform: hasBet ? "translateY(-1px)" : "none",
                  }}>
                  <div className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.12) 0%,transparent 60%)" }} />
                  <span className="relative z-10 text-white font-black text-xs leading-none">{zone.label}</span>
                  <span className="relative z-10 text-[9px] mt-0.5" style={{ color: zone.color }}>x{zone.mult}</span>
                  {hasBet && (
                    <div className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[8px] font-black text-black px-1"
                      style={{ background: "linear-gradient(135deg,#ffd700,#f59e0b)", boxShadow: "0 2px 6px rgba(255,215,0,0.6)" }}>
                      {fmtCoins(myBet)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chip selector ── */}
        <div>
          <p className="text-gray-500 text-[10px] font-bold mb-1.5">قيمة الرقاقة</p>
          <div className="grid grid-cols-4 gap-1.5">
            {CHIP_VALUES.map((v, i) => (
              <button key={v} onClick={() => setSelectedChip(v)}
                className="relative rounded-xl py-2 flex flex-col items-center justify-center active:scale-95 transition-all"
                style={{
                  background: selectedChip === v
                    ? `linear-gradient(135deg,${CHIP_COLORS[i]}44,${CHIP_COLORS[i]}22)`
                    : "rgba(255,255,255,0.04)",
                  border: selectedChip === v
                    ? `2px solid ${CHIP_COLORS[i]}`
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: selectedChip === v ? `0 0 10px ${CHIP_COLORS[i]}44` : "none",
                }}>
                {/* Chip circle */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center mb-0.5"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${CHIP_COLORS[i]}, ${CHIP_COLORS[i]}88)`,
                    border: "2px solid rgba(255,255,255,0.3)",
                    boxShadow: `0 2px 8px ${CHIP_COLORS[i]}66`,
                  }}>
                  <span className="text-white font-black text-[8px]">{fmtCoins(v)}</span>
                </div>
                <span className="text-[9px] font-bold" style={{ color: selectedChip === v ? CHIP_COLORS[i] : "#6b7280" }}>
                  {fmtCoins(v)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Status messages ── */}
        {activeRound?.status === "spinning" && (
          <div className="rounded-2xl p-3 text-center"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-red-400 font-black text-sm">توقف الرهان - العجلة تدور</p>
            <p className="text-gray-600 text-[10px] mt-0.5">انتظر النتيجة...</p>
          </div>
        )}
        {(!activeRound || activeRound.status === "finished") && (
          <div className="rounded-2xl p-3 text-center"
            style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)" }}>
            <p className="text-yellow-500 font-black text-sm">جولة جديدة قريباً</p>
            <p className="text-gray-600 text-[10px] mt-0.5">ستبدأ الجولة القادمة خلال ثوانٍ</p>
          </div>
        )}
      </div>

      {/* ── Result Popup ── */}
      {showResult && resultRound && (
        <ResultPopup
          round={resultRound}
          myBets={resultBets}
          topWinners={resultWinners}
          onClose={() => setShowResult(false)}
        />
      )}

      {/* ── Leaderboard ── */}
      {showLB && <LeaderboardSheet onClose={() => setShowLB(false)} />}

      <style>{`
        @keyframes rlt-pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
