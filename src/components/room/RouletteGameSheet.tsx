// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "../../lib/toast";

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const WHEEL_ORDER = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,
  24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];

function getColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.includes(n) ? "red" : "black";
}

const BET_ZONES = [
  { id: "zero", type: "zero", value: "0", label: "0", multiplier: 36, color: "#16a34a" },
  { id: "r1-12", type: "range", value: "1-12", label: "1-12", multiplier: 3, color: "#1e40af" },
  { id: "r13-24", type: "range", value: "13-24", label: "13-24", multiplier: 3, color: "#1e40af" },
  { id: "r25-36", type: "range", value: "25-36", label: "25-36", multiplier: 3, color: "#1e40af" },
  { id: "red", type: "color", value: "red", label: "أحمر", multiplier: 2, color: "#dc2626" },
  { id: "black", type: "color", value: "black", label: "أسود", multiplier: 2, color: "#1f2937" },
  { id: "odd", type: "parity", value: "odd", label: "فردي", multiplier: 2, color: "#7c3aed" },
  { id: "even", type: "parity", value: "even", label: "زوجي", multiplier: 2, color: "#0891b2" },
];

const CHIP_VALUES = [10, 50, 100, 500, 1000, 5000];

// ── عجلة الروليت SVG ──
function RouletteWheel({ spinning, winNumber, onSpinEnd }: {
  spinning: boolean;
  winNumber?: number;
  onSpinEnd?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);
  const spinSpeedRef = useRef(0);
  const [finalAngle, setFinalAngle] = useState<number | null>(null);
  const hasEndedRef = useRef(false);

  const SEGMENT_COUNT = WHEEL_ORDER.length; // 37
  const SEGMENT_ANGLE = (2 * Math.PI) / SEGMENT_COUNT;

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const outerR = cx - 4;
    const innerR = outerR * 0.55;
    const ballTrackR = outerR * 0.82;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // الحلقة الخارجية
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a0a00";
    ctx.fill();
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // رسم الأقسام
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const startAngle = angle + i * SEGMENT_ANGLE - Math.PI / 2;
      const endAngle = startAngle + SEGMENT_ANGLE;
      const num = WHEEL_ORDER[i];
      const color = getColor(num);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR - 2, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color === "green" ? "#15803d" : color === "red" ? "#dc2626" : "#111827";
      ctx.fill();
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // الأرقام
      const midAngle = startAngle + SEGMENT_ANGLE / 2;
      const textR = (outerR + innerR) / 2;
      const tx = cx + textR * Math.cos(midAngle);
      const ty = cy + textR * Math.sin(midAngle);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${outerR > 100 ? 9 : 7}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(num), 0, 0);
      ctx.restore();
    }

    // الدائرة الداخلية
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
    grad.addColorStop(0, "#2d1a00");
    grad.addColorStop(1, "#1a0a00");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    ctx.stroke();

    // النجمة المركزية
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 0.25, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffd700";
    ctx.fill();

    // مؤشر الكرة (أعلى)
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR + 2);
    ctx.lineTo(cx - 6, cy - outerR + 14);
    ctx.lineTo(cx + 6, cy - outerR + 14);
    ctx.closePath();
    ctx.fillStyle = "#ffd700";
    ctx.fill();
  };

  useEffect(() => {
    if (!spinning) {
      drawWheel(angleRef.current);
      return;
    }
    hasEndedRef.current = false;
    spinSpeedRef.current = 0.35 + Math.random() * 0.15;

    // حساب الزاوية النهائية للرقم الفائز
    let targetAngle = angleRef.current;
    if (winNumber !== undefined) {
      const winIdx = WHEEL_ORDER.indexOf(winNumber);
      if (winIdx >= 0) {
        // الزاوية التي يجب أن يكون فيها الرقم الفائز عند المؤشر (أعلى = -PI/2)
        const targetSegmentAngle = -winIdx * SEGMENT_ANGLE;
        // عدة دورات كاملة + الزاوية المستهدفة
        const fullRotations = (6 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
        targetAngle = targetSegmentAngle - fullRotations;
      }
    }

    const startAngle = angleRef.current;
    const totalRotation = targetAngle - startAngle - (Math.floor((targetAngle - startAngle) / (2 * Math.PI)) * 2 * Math.PI);
    const duration = 4500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const totalDelta = (6 + Math.floor(Math.random() * 2)) * 2 * Math.PI;
      angleRef.current = startAngle + totalDelta * eased;
      drawWheel(angleRef.current);
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

  useEffect(() => {
    drawWheel(angleRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={220}
      className="rounded-full"
      style={{ filter: "drop-shadow(0 0 20px rgba(255,215,0,0.4))" }}
    />
  );
}

// ── أيقونة الروليت المصغّرة ──
function RouletteMinIcon({ onClick, hasActive }: { onClick: () => void; hasActive: boolean }) {
  return (
    <button onClick={onClick}
      className="fixed bottom-24 left-3 z-[400] w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
      style={{
        background: "linear-gradient(135deg,#1a0a00,#0d0500)",
        border: `2px solid ${hasActive ? "#ef4444" : "rgba(255,215,0,0.5)"}`,
        boxShadow: `0 0 20px ${hasActive ? "rgba(239,68,68,0.4)" : "rgba(255,215,0,0.3)"}`,
      }}>
      <span className="text-xl">🎰</span>
      <span className="text-[8px] font-black" style={{ color: hasActive ? "#ef4444" : "#ffd700" }}>
        {hasActive ? "🔴" : "روليت"}
      </span>
    </button>
  );
}

// ── لوحة الرهانات ──
function BettingBoard({
  myBets, selectedChip, onBet, disabled, coins,
}: {
  myBets: Record<string, number>;
  selectedChip: number;
  onBet: (type: string, value: string) => void;
  disabled: boolean;
  coins: number;
}) {
  return (
    <div className="w-full space-y-2">
      {/* صف الصفر */}
      <div className="flex justify-center">
        <button
          onClick={() => !disabled && onBet("zero", "0")}
          disabled={disabled}
          className="relative w-16 h-10 rounded-xl flex flex-col items-center justify-center font-black text-sm active:scale-95 transition-all"
          style={{
            background: myBets["zero_0"] ? "linear-gradient(135deg,#15803d,#166534)" : "linear-gradient(135deg,#16a34a,#15803d)",
            border: myBets["zero_0"] ? "2px solid #4ade80" : "1px solid rgba(74,222,128,0.4)",
            boxShadow: myBets["zero_0"] ? "0 0 12px rgba(74,222,128,0.5)" : "none",
          }}>
          <span className="text-white">0</span>
          <span className="text-[8px] text-green-200">×36</span>
          {myBets["zero_0"] > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[8px] font-black text-black">
              {myBets["zero_0"] >= 1000 ? `${(myBets["zero_0"]/1000).toFixed(0)}k` : myBets["zero_0"]}
            </div>
          )}
        </button>
      </div>

      {/* صف النطاقات */}
      <div className="grid grid-cols-3 gap-1.5">
        {BET_ZONES.filter(z => z.type === "range").map(zone => (
          <button key={zone.id}
            onClick={() => !disabled && onBet(zone.type, zone.value)}
            disabled={disabled}
            className="relative h-10 rounded-xl flex flex-col items-center justify-center font-black text-xs active:scale-95 transition-all"
            style={{
              background: myBets[`${zone.type}_${zone.value}`]
                ? "linear-gradient(135deg,#1d4ed8,#1e40af)"
                : "linear-gradient(135deg,#2563eb,#1d4ed8)",
              border: myBets[`${zone.type}_${zone.value}`] ? "2px solid #60a5fa" : "1px solid rgba(96,165,250,0.3)",
              boxShadow: myBets[`${zone.type}_${zone.value}`] ? "0 0 10px rgba(96,165,250,0.4)" : "none",
            }}>
            <span className="text-white">{zone.label}</span>
            <span className="text-[8px] text-blue-200">×{zone.multiplier}</span>
            {myBets[`${zone.type}_${zone.value}`] > 0 && (
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[8px] font-black text-black">
                {myBets[`${zone.type}_${zone.value}`] >= 1000 ? `${(myBets[`${zone.type}_${zone.value}`]/1000).toFixed(0)}k` : myBets[`${zone.type}_${zone.value}`]}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* صف الألوان والتعادل */}
      <div className="grid grid-cols-2 gap-1.5">
        {BET_ZONES.filter(z => z.type === "color" || z.type === "parity").map(zone => (
          <button key={zone.id}
            onClick={() => !disabled && onBet(zone.type, zone.value)}
            disabled={disabled}
            className="relative h-10 rounded-xl flex flex-col items-center justify-center font-black text-xs active:scale-95 transition-all"
            style={{
              background: myBets[`${zone.type}_${zone.value}`]
                ? `${zone.color}dd`
                : `${zone.color}99`,
              border: myBets[`${zone.type}_${zone.value}`] ? `2px solid ${zone.color}` : `1px solid ${zone.color}66`,
              boxShadow: myBets[`${zone.type}_${zone.value}`] ? `0 0 10px ${zone.color}66` : "none",
            }}>
            <span className="text-white">{zone.label}</span>
            <span className="text-[8px] text-white/70">×{zone.multiplier}</span>
            {myBets[`${zone.type}_${zone.value}`] > 0 && (
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[8px] font-black text-black">
                {myBets[`${zone.type}_${zone.value}`] >= 1000 ? `${(myBets[`${zone.type}_${zone.value}`]/1000).toFixed(0)}k` : myBets[`${zone.type}_${zone.value}`]}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── الشاشة الرئيسية ──
export default function RouletteGameSheet({
  roomId, myUserId, isOwner, isAdmin, onClose,
}: {
  roomId: Id<"rooms">;
  myUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const activeSession = useQuery(api.roulette.getActiveSession, { roomId });
  const myBetsData = useQuery(
    api.roulette.getSessionBets,
    activeSession ? { sessionId: activeSession._id } : "skip"
  );
  const recentResults = useQuery(api.roulette.getRecentResults, { roomId });
  const myProfile = useQuery(api.profiles.getMyProfile);

  const startSession = useMutation(api.roulette.startSession);
  const placeBet = useMutation(api.roulette.placeBet);
  const spinWheel = useMutation(api.roulette.spinWheel);
  const endSession = useMutation(api.roulette.endSession);

  const [selectedChip, setSelectedChip] = useState(100);
  const [collapsed, setCollapsed] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [spinEnded, setSpinEnded] = useState(false);

  const coins = myProfile?.goldCoins ?? 0;
  const isHost = isOwner || isAdmin;

  // حساب الرهانات المحلية
  const myBetsMap: Record<string, number> = {};
  if (myBetsData) {
    for (const bet of myBetsData) {
      myBetsMap[`${bet.betType}_${bet.betValue}`] = bet.amount;
    }
  }

  const totalBet = Object.values(myBetsMap).reduce((a, b) => a + b, 0);

  // العد التنازلي
  useEffect(() => {
    if (!activeSession || activeSession.status !== "betting") { setTimeLeft(0); return; }
    const update = () => {
      const left = Math.max(0, Math.ceil((activeSession.bettingEndsAt - Date.now()) / 1000));
      setTimeLeft(left);
    };
    update();
    const t = setInterval(update, 500);
    return () => clearInterval(t);
  }, [activeSession?.bettingEndsAt, activeSession?.status]);

  // تتبع حالة الدوران
  useEffect(() => {
    if (activeSession?.status === "spinning" && !spinning) {
      setSpinning(true);
      setSpinEnded(false);
    }
    if (activeSession?.status === "ended" && activeSession._id !== lastSessionId) {
      setLastSessionId(activeSession._id);
      setShowResult(true);
    }
  }, [activeSession?.status, activeSession?._id]);

  const handleSpinEnd = () => {
    setSpinning(false);
    setSpinEnded(true);
  };

  const handleBet = async (betType: string, betValue: string) => {
    if (!activeSession || activeSession.status !== "betting") return;
    if (timeLeft <= 0) { toast.error("انتهى وقت الرهان"); return; }
    if (coins < selectedChip) { toast.error("رصيدك غير كافٍ"); return; }
    try {
      await placeBet({ sessionId: activeSession._id, betType, betValue, amount: selectedChip });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSpin = async () => {
    if (!activeSession) return;
    try {
      await spinWheel({ sessionId: activeSession._id });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleStart = async () => {
    try {
      await startSession({ roomId });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleEnd = async () => {
    if (!activeSession) return;
    if (!confirm("إنهاء الجلسة؟")) return;
    try {
      await endSession({ sessionId: activeSession._id });
    } catch (e: any) { toast.error(e.message); }
  };

  // نتيجة الجلسة
  const winNumber = activeSession?.winNumber;
  const winColor = winNumber !== undefined ? (winNumber === 0 ? "green" : RED_NUMBERS.includes(winNumber) ? "red" : "black") : null;

  // حساب الربح/الخسارة
  let totalWin = 0;
  if (activeSession?.status === "ended" && myBetsData) {
    for (const bet of myBetsData) {
      if (bet.won && bet.payout) totalWin += bet.payout;
    }
  }

  if (collapsed) {
    return <RouletteMinIcon onClick={() => setCollapsed(false)} hasActive={!!activeSession && activeSession.status !== "ended"} />;
  }

  return (
    <div className="fixed inset-0 z-[500] flex flex-col" dir="rtl"
      style={{ background: "rgba(0,5,20,0.95)", backdropFilter: "blur(8px)" }}>

      {/* رأس الصفحة */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,215,0,0.2)" }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
          style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-base">🎰 روليت الكازينو</h1>
          <p className="text-yellow-500/70 text-xs">
            {activeSession?.status === "betting" ? `⏳ وقت الرهان: ${timeLeft}ث`
              : activeSession?.status === "spinning" ? "🎡 العجلة تدور..."
              : activeSession?.status === "ended" ? "✅ انتهت الجلسة"
              : "في انتظار بدء الجلسة"}
          </p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)" }}>
          <span className="text-yellow-400 font-black text-sm">{coins.toLocaleString()}</span>
          <span className="text-yellow-400 text-xs">🪙</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* آخر النتائج */}
        {recentResults && recentResults.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {recentResults.slice(0, 15).map((r, i) => (
              <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                style={{
                  background: r.color === "green" ? "#15803d" : r.color === "red" ? "#dc2626" : "#111827",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}>
                <span className="text-white">{r.number}</span>
              </div>
            ))}
          </div>
        )}

        {/* العجلة */}
        <div className="flex justify-center">
          <div className="relative">
            <RouletteWheel
              spinning={spinning}
              winNumber={activeSession?.winNumber}
              onSpinEnd={handleSpinEnd}
            />
            {/* عرض الرقم الفائز */}
            {(activeSession?.status === "ended" || spinEnded) && winNumber !== undefined && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center"
                  style={{
                    background: winColor === "green" ? "#15803d" : winColor === "red" ? "#dc2626" : "#111827",
                    border: "3px solid #ffd700",
                    boxShadow: "0 0 30px rgba(255,215,0,0.6)",
                  }}>
                  <span className="text-white font-black text-xl">{winNumber}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* نتيجة الجلسة */}
        {activeSession?.status === "ended" && showResult && winNumber !== undefined && (
          <div className="rounded-2xl p-4 text-center"
            style={{
              background: totalWin > totalBet ? "rgba(0,200,100,0.1)" : totalBet > 0 ? "rgba(239,68,68,0.1)" : "rgba(255,215,0,0.08)",
              border: `2px solid ${totalWin > totalBet ? "rgba(0,200,100,0.4)" : totalBet > 0 ? "rgba(239,68,68,0.3)" : "rgba(255,215,0,0.3)"}`,
            }}>
            <div className="text-3xl mb-2">
              {totalWin > totalBet ? "🎉" : totalBet > 0 ? "💔" : "🎰"}
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                style={{
                  background: winColor === "green" ? "#15803d" : winColor === "red" ? "#dc2626" : "#111827",
                  border: "2px solid #ffd700",
                }}>
                <span className="text-white">{winNumber}</span>
              </div>
              <span className="text-white font-black text-base">
                {winColor === "green" ? "أخضر" : winColor === "red" ? "أحمر" : "أسود"}
              </span>
            </div>
            {totalBet > 0 && (
              <div className="text-sm font-bold">
                {totalWin > 0 ? (
                  <span style={{ color: "#00c864" }}>
                    ربحت: +{totalWin.toLocaleString()} 🪙
                  </span>
                ) : (
                  <span style={{ color: "#ef4444" }}>
                    خسرت: -{totalBet.toLocaleString()} 🪙
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* لوحة الرهانات */}
        {activeSession?.status === "betting" && (
          <>
            <BettingBoard
              myBets={myBetsMap}
              selectedChip={selectedChip}
              onBet={handleBet}
              disabled={timeLeft <= 0}
              coins={coins}
            />

            {/* اختيار الرقاقة */}
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2">اختر قيمة الرقاقة:</p>
              <div className="flex gap-2 flex-wrap">
                {CHIP_VALUES.map(v => (
                  <button key={v} onClick={() => setSelectedChip(v)}
                    className="px-3 py-1.5 rounded-xl text-xs font-black active:scale-95 transition-all"
                    style={{
                      background: selectedChip === v ? "linear-gradient(135deg,#ffd700,#c8a000)" : "rgba(255,215,0,0.08)",
                      border: selectedChip === v ? "2px solid #ffd700" : "1px solid rgba(255,215,0,0.2)",
                      color: selectedChip === v ? "#000" : "#ffd700",
                      boxShadow: selectedChip === v ? "0 0 10px rgba(255,215,0,0.4)" : "none",
                    }}>
                    {v >= 1000 ? `${v/1000}k` : v}
                  </button>
                ))}
              </div>
            </div>

            {totalBet > 0 && (
              <div className="text-center text-xs text-yellow-400 font-bold">
                إجمالي رهاناتك: {totalBet.toLocaleString()} 🪙
              </div>
            )}
          </>
        )}

        {/* حالة الدوران */}
        {activeSession?.status === "spinning" && (
          <div className="text-center py-4">
            <div className="text-2xl mb-2 animate-bounce">🎡</div>
            <p className="text-yellow-400 font-black text-base">العجلة تدور...</p>
            <p className="text-gray-400 text-xs mt-1">انتظر النتيجة</p>
          </div>
        )}

        {/* لا توجد جلسة */}
        {!activeSession && (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">🎰</div>
            <p className="text-white font-black text-base mb-1">روليت الكازينو</p>
            <p className="text-gray-500 text-xs mb-4">
              {isHost ? "ابدأ جلسة جديدة ليتمكن الجميع من المراهنة" : "في انتظار المذيع لبدء الجلسة"}
            </p>
            {/* شرح الاحتمالات */}
            <div className="rounded-2xl p-3 text-right space-y-1.5 mb-4"
              style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)" }}>
              <p className="text-yellow-400 font-black text-xs mb-2">📊 الاحتمالات:</p>
              {[
                { label: "0 (الصفر)", mult: "×36", color: "#16a34a" },
                { label: "1-12 / 13-24 / 25-36", mult: "×3", color: "#2563eb" },
                { label: "أحمر / أسود", mult: "×2", color: "#dc2626" },
                { label: "فردي / زوجي", mult: "×2", color: "#7c3aed" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-300 text-xs">{item.label}</span>
                  <span className="font-black text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${item.color}22`, color: item.color, border: `1px solid ${item.color}44` }}>
                    {item.mult}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أزرار المذيع */}
        {isHost && (
          <div className="space-y-2">
            {!activeSession && (
              <button onClick={handleStart}
                className="w-full py-3 rounded-2xl font-black text-sm active:scale-95"
                style={{ background: "linear-gradient(135deg,#ffd700,#c8a000)", color: "#000", boxShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
                🎬 بدء جلسة جديدة (30 ثانية للرهان)
              </button>
            )}
            {activeSession?.status === "betting" && (
              <button onClick={handleSpin}
                className="w-full py-3 rounded-2xl font-black text-sm active:scale-95"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", boxShadow: "0 0 20px rgba(239,68,68,0.4)" }}>
                🎡 تدوير العجلة الآن
              </button>
            )}
            {activeSession && activeSession.status !== "ended" && (
              <button onClick={handleEnd}
                className="w-full py-2 rounded-2xl font-bold text-xs active:scale-95"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                إنهاء الجلسة
              </button>
            )}
            {activeSession?.status === "ended" && (
              <button onClick={handleStart}
                className="w-full py-3 rounded-2xl font-black text-sm active:scale-95"
                style={{ background: "linear-gradient(135deg,#ffd700,#c8a000)", color: "#000", boxShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
                🔄 جلسة جديدة
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── أيقونة الروليت للشريط الاجتماعي ──
export function RouletteIcon({ onClick, hasActive }: { onClick: () => void; hasActive: boolean }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl active:scale-95 transition-all"
      style={{
        background: hasActive ? "rgba(239,68,68,0.15)" : "rgba(255,215,0,0.08)",
        border: `1px solid ${hasActive ? "rgba(239,68,68,0.4)" : "rgba(255,215,0,0.2)"}`,
        boxShadow: hasActive ? "0 0 12px rgba(239,68,68,0.3)" : "none",
      }}>
      <span className="text-base">🎰</span>
      <span className="text-xs font-black" style={{ color: hasActive ? "#ef4444" : "#ffd700" }}>
        {hasActive ? "🔴 جارٍ" : "روليت"}
      </span>
    </button>
  );
}

