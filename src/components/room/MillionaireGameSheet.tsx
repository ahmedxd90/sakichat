// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../lib/toast";

const PRIZE_LEVELS = [
  { level: 1, prize: 1000, label: "١٬٠٠٠" },
  { level: 2, prize: 2000, label: "٢٬٠٠٠" },
  { level: 3, prize: 3000, label: "٣٬٠٠٠" },
  { level: 4, prize: 5000, label: "٥٬٠٠٠" },
  { level: 5, prize: 10000, label: "١٠٬٠٠٠", isSafe: true },
  { level: 6, prize: 20000, label: "٢٠٬٠٠٠" },
  { level: 7, prize: 30000, label: "٣٠٬٠٠٠" },
  { level: 8, prize: 50000, label: "٥٠٬٠٠٠" },
  { level: 9, prize: 75000, label: "٧٥٬٠٠٠" },
  { level: 10, prize: 100000, label: "١٠٠٬٠٠٠", isSafe: true },
  { level: 11, prize: 150000, label: "١٥٠٬٠٠٠" },
  { level: 12, prize: 250000, label: "٢٥٠٬٠٠٠" },
  { level: 13, prize: 500000, label: "٥٠٠٬٠٠٠" },
  { level: 14, prize: 750000, label: "٧٥٠٬٠٠٠" },
  { level: 15, prize: 1000000, label: "١٬٠٠٠٬٠٠٠", isMillion: true },
];

// ── أيقونة المليون المصغّرة ──
function MillionaireMinIcon({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="fixed bottom-24 left-3 z-[400] w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
      style={{
        background: "linear-gradient(135deg,#001a4d,#000d2e)",
        border: "2px solid rgba(255,215,0,0.5)",
        boxShadow: "0 0 20px rgba(255,215,0,0.3)",
      }}>
      <svg viewBox="0 0 48 48" width="26" height="26">
        <defs>
          <radialGradient id="mii2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#c8a000" />
          </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#mii2)" />
        <circle cx="24" cy="24" r="17" fill="#001a4d" />
        <text x="24" y="31" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#ffd700">?</text>
      </svg>
      <span className="text-[8px] font-black" style={{ color: "#ffd700" }}>ابدأ</span>
    </button>
  );
}

function playSound(type: "correct" | "wrong" | "thinking" | "final") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === "correct") {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.25);
        o.start(ctx.currentTime + i * 0.1);
        o.stop(ctx.currentTime + i * 0.1 + 0.25);
      });
    } else if (type === "wrong") {
      [300, 200, 150].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.2);
        o.start(ctx.currentTime + i * 0.15);
        o.stop(ctx.currentTime + i * 0.15 + 0.2);
      });
    } else if (type === "thinking") {
      [440, 494, 523, 587, 659].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.1);
        o.start(ctx.currentTime + i * 0.12);
        o.stop(ctx.currentTime + i * 0.12 + 0.1);
      });
    } else if (type === "final") {
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
        o.start(ctx.currentTime + i * 0.08);
        o.stop(ctx.currentTime + i * 0.08 + 0.3);
      });
    }
  } catch (e) {}
}

// ── لوحة المشارك ──
function ContestantPanel({ game, question, myUserId }: { game: any; question: any; myUserId: string }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const submitAnswer = async (args: any) => {
    const { error } = await supabase.from('millionaire_games').update({ pending_answer: args.selectedOption }).eq('id', args.gameId);
    if (error) throw error;
  };
  const useLifeline = async (args: any) => {
    const { data: g } = await supabase.from('millionaire_games').select('used_lifelines').eq('id', args.gameId).single();
    const used = g?.used_lifelines || [];
    await supabase.from('millionaire_games').update({ used_lifelines: [...used, args.lifeline], active_lifeline: args.lifeline }).eq('id', args.gameId);
  };
  const [confirmed, setConfirmed] = useState(false);
  const [fiftyElim, setFiftyElim] = useState<string[]>([]);

  const isContestant = game.contestantUserId === myUserId;
  const usedLifelines: string[] = game.usedLifelines ?? [];

  useEffect(() => {
    setSelectedOption(null);
    setConfirmed(false);
    setFiftyElim([]);
    playSound("thinking");
  }, [game.currentQuestionIndex]);

  useEffect(() => {
    if (game.activeLifeline === "fifty_fifty" && question) {
      const wrong = ["A", "B", "C", "D"].filter(o => o !== question.correctOption);
      setFiftyElim(wrong.sort(() => Math.random() - 0.5).slice(0, 2));
    }
  }, [game.activeLifeline, question?.correctOption]);

  const handleConfirm = async () => {
    if (!selectedOption || confirmed) return;
    setConfirmed(true);
    try { await submitAnswer({ gameId: game._id, selectedOption: selectedOption as any }); }
    catch (e: any) { toast.error(e.message); setConfirmed(false); }
  };

  const handleLifeline = async (ll: string) => {
    if (usedLifelines.includes(ll)) return;
    try { await useLifeline({ gameId: game._id, lifeline: ll as any }); }
    catch (e: any) { toast.error(e.message); }
  };

  if (!question) return null;

  const optionLabels: Record<string, string> = { A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-end pb-4 px-3"
      style={{ background: "rgba(0,5,20,0.93)", backdropFilter: "blur(8px)" }}>

      <div className="absolute top-4 left-2 flex flex-col-reverse gap-0.5 max-h-[60vh] overflow-hidden">
        {PRIZE_LEVELS.slice(-8).map((p) => (
          <div key={p.level} className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black"
            style={{
              background: game.currentLevel === p.level ? "linear-gradient(135deg,#ffd700,#c8a000)"
                : p.isSafe ? "rgba(0,200,100,0.12)" : "rgba(255,255,255,0.04)",
              color: game.currentLevel === p.level ? "#000" : p.isSafe ? "#00c864" : "#6b7280",
              border: game.currentLevel === p.level ? "1px solid #ffd700" : "1px solid transparent",
            }}>
            <span>{p.label}</span>
            {p.isSafe && <span style={{ fontSize: 8 }}>🛡</span>}
            {p.isMillion && <span style={{ fontSize: 8 }}>💰</span>}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-3">
        {[
          { id: "fifty_fifty", label: "50:50", isText: true },
          { id: "audience", label: "👥", isText: false },
          { id: "call_friend", label: "📞", isText: false },
        ].map((ll) => {
          const used = usedLifelines.includes(ll.id);
          return (
            <button key={ll.id} onClick={() => !used && isContestant && handleLifeline(ll.id)}
              className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
              style={{ opacity: used ? 0.25 : 1 }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-black"
                style={{
                  background: used ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#ffd700,#c8a000)",
                  boxShadow: used ? "none" : "0 0 12px rgba(255,215,0,0.4)",
                  color: used ? "#4b5563" : "#000",
                  fontSize: ll.isText ? "9px" : "18px",
                }}>
                {ll.label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-full rounded-2xl p-4 mb-3 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#001a4d,#000d2e)", border: "2px solid rgba(255,215,0,0.4)", boxShadow: "0 0 30px rgba(255,215,0,0.15)" }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.6),transparent)" }} />
        <div className="flex items-center gap-2 mb-2">
          <div className="px-2 py-0.5 rounded-full text-[10px] font-black"
            style={{ background: "linear-gradient(135deg,#ffd700,#c8a000)", color: "#000" }}>
            سؤال {game.currentLevel + 1}
          </div>
          <div className="px-2 py-0.5 rounded-full text-[10px] font-black"
            style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", color: "#ffd700" }}>
            {PRIZE_LEVELS[game.currentLevel]?.label} 🪙
          </div>
        </div>
        <p className="text-white font-black text-sm text-center leading-relaxed">{question.question}</p>
      </div>

      <div className="w-full grid grid-cols-2 gap-2 mb-3">
        {(["A", "B", "C", "D"] as const).map((opt) => {
          const isElim = fiftyElim.includes(opt);
          const isPending = game.pendingAnswer === opt;
          const isSel = selectedOption === opt;
          return (
            <button key={opt}
              onClick={() => !isElim && !game.pendingAnswer && isContestant && setSelectedOption(opt)}
              disabled={isElim || !!game.pendingAnswer || !isContestant}
              className="relative rounded-xl px-3 py-3 text-right transition-all active:scale-95 overflow-hidden"
              style={{
                background: isElim ? "rgba(255,255,255,0.02)" : isPending ? "linear-gradient(135deg,#ffd700,#c8a000)" : isSel ? "linear-gradient(135deg,#1565c0,#0d47a1)" : "linear-gradient(135deg,#001a4d,#000d2e)",
                border: isElim ? "1px solid rgba(255,255,255,0.04)" : isPending ? "2px solid #ffd700" : isSel ? "2px solid #42a5f5" : "1px solid rgba(255,215,0,0.2)",
                boxShadow: isPending ? "0 0 20px rgba(255,215,0,0.35)" : isSel ? "0 0 12px rgba(66,165,245,0.35)" : "none",
                opacity: isElim ? 0.15 : 1,
              }}>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{ background: isPending ? "rgba(0,0,0,0.25)" : "rgba(255,215,0,0.15)", color: isPending ? "#000" : "#ffd700" }}>
                  {opt}
                </span>
                <span className={`text-xs font-bold leading-tight ${isPending ? "text-black" : isElim ? "text-gray-800" : "text-white"}`}>
                  {optionLabels[opt]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {isContestant && selectedOption && !game.pendingAnswer && (
        <button onClick={handleConfirm} disabled={confirmed}
          className="w-full py-3 rounded-2xl font-black text-sm active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg,#ffd700,#c8a000)", color: "#000", boxShadow: "0 0 25px rgba(255,215,0,0.5)" }}>
          {confirmed ? "جاري التأكيد..." : `✅ تأكيد الإجابة: ${selectedOption}`}
        </button>
      )}
      {game.pendingAnswer && (
        <div className="w-full py-3 rounded-2xl text-center font-black text-sm"
          style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)", color: "#ffd700" }}>
          ⏳ في انتظار تأكيد المذيع...
        </div>
      )}
    </div>
  );
}

// ── لوحة المذيع ──
function HostPanel({ game, question, myUserId }: { game: any; question: any; myUserId: string }) {
  const [revealing, setRevealing] = useState(false);

  const revealAnswer = async (args: any) => {
    // Logic for next question or end game
  };
  const endGame = async (args: any) => {
    await supabase.from('millionaire_games').update({ status: 'ended' }).eq('id', args.gameId);
  };
  const [collapsed, setCollapsed] = useState(false);

  const isHost = game.hostUserId === myUserId;
  if (!isHost) return null;

  const handleReveal = async (isCorrect: boolean) => {
    if (revealing) return;
    setRevealing(true);
    try {
      playSound(isCorrect ? "correct" : "wrong");
      await revealAnswer({ gameId: game._id, isCorrect });
    } catch (e: any) { toast.error(e.message); }
    finally { setRevealing(false); }
  };

  // أيقونة مصغّرة للمذيع
  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)}
        className="fixed bottom-24 left-3 z-[400] w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
        style={{ background: "linear-gradient(135deg,#1a0a00,#0d0500)", border: "2px solid rgba(255,215,0,0.5)", boxShadow: "0 0 16px rgba(255,215,0,0.3)" }}>
        <span className="text-xl">🎙</span>
        <span className="text-[8px] font-black" style={{ color: "#ffd700" }}>
          {game.pendingAnswer ? "⚡" : "لوحة"}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[400] rounded-2xl p-3"
      style={{ background: "linear-gradient(135deg,#1a0a00,#0d0500)", border: "2px solid rgba(255,215,0,0.4)", boxShadow: "0 0 30px rgba(255,215,0,0.15)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
          style={{ background: "linear-gradient(135deg,#ffd700,#c8a000)" }}>🎙</div>
        <span className="text-yellow-400 font-black text-xs">لوحة المذيع</span>
        <div className="mr-auto px-2 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: "rgba(255,215,0,0.12)", color: "#ffd700" }}>
          سؤال {game.currentLevel + 1} / 15
        </div>
        {/* زر الإخفاء */}
        <button onClick={() => setCollapsed(true)}
          className="w-6 h-6 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {question && (
        <div className="mb-2 p-2 rounded-xl text-xs"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          <p className="font-bold text-white mb-1 text-[11px]">{question.question}</p>
          <div className="grid grid-cols-2 gap-1">
            {(["A","B","C","D"] as const).map(opt => (
              <div key={opt} className="flex items-center gap-1">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 ${opt === question.correctOption ? "bg-green-500 text-white" : "bg-white/10 text-gray-500"}`}>
                  {opt}
                </span>
                <span className={`text-[10px] ${opt === question.correctOption ? "text-green-400 font-bold" : "text-gray-500"}`}>
                  {question[`option${opt}`]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {game.pendingAnswer ? (
        <div className="space-y-2">
          <div className="text-center text-xs text-yellow-300 font-bold mb-1">
            المشارك اختار: <span className="text-white bg-blue-600 px-2 py-0.5 rounded">{game.pendingAnswer}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleReveal(true)} disabled={revealing}
              className="flex-1 py-2.5 rounded-xl font-black text-sm active:scale-95"
              style={{ background: "linear-gradient(135deg,#00c864,#00a050)", color: "#fff", boxShadow: "0 0 12px rgba(0,200,100,0.35)" }}>
              ✅ صحيحة
            </button>
            <button onClick={() => handleReveal(false)} disabled={revealing}
              className="flex-1 py-2.5 rounded-xl font-black text-sm active:scale-95"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", boxShadow: "0 0 12px rgba(239,68,68,0.35)" }}>
              ❌ خاطئة
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-xs text-gray-500 py-1">⏳ في انتظار إجابة المشارك...</div>
      )}

      <button onClick={async () => { if (!confirm("إنهاء اللعبة؟")) return; try { await endGame({ gameId: game._id }); } catch (e: any) { toast.error(e.message); } }}
        className="w-full mt-2 py-1.5 rounded-xl text-xs font-bold active:scale-95"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
        إنهاء اللعبة
      </button>
    </div>
  );
}

// ── نتيجة اللعبة ──
function GameResult({ game, onClose }: { game: any; onClose: () => void }) {
  const isWinner = game.currentLevel >= 15;
  const prize = game.finalPrize ?? 0;

  useEffect(() => { playSound(isWinner ? "final" : prize > 0 ? "correct" : "wrong"); }, []);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center"
      style={{ background: "rgba(0,5,20,0.96)", backdropFilter: "blur(10px)" }}>
      <div className="w-full max-w-sm mx-4 rounded-3xl p-6 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#001a4d,#000d2e)",
          border: `2px solid ${isWinner ? "#ffd700" : prize > 0 ? "#00c864" : "#ef4444"}`,
          boxShadow: `0 0 50px ${isWinner ? "rgba(255,215,0,0.35)" : prize > 0 ? "rgba(0,200,100,0.25)" : "rgba(239,68,68,0.25)"}`,
        }}>
        {isWinner && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${(i * 23 + 5) % 95}%`,
                  top: `${(i * 17 + 3) % 90}%`,
                  background: ["#ffd700","#ff6b6b","#4ecdc4","#45b7d1"][i % 4],
                  animation: `conf-fall ${1 + (i % 3) * 0.5}s linear infinite`,
                  animationDelay: `${(i * 0.15) % 2}s`,
                }}
              />
            ))}
          </div>
        )}
        <div className="text-5xl mb-3">{isWinner ? "🏆" : prize > 0 ? "🎁" : "💔"}</div>
        <h2 className="text-white font-black text-xl mb-2">
          {isWinner ? "مبروك! فزت بالمليون! 🎉" : prize > 0 ? "أحسنت! حصلت على جائزة" : "انتهت اللعبة"}
        </h2>
        {prize > 0 && (
          <div className="py-3 px-6 rounded-2xl mb-4 inline-block"
            style={{ background: "linear-gradient(135deg,#ffd700,#c8a000)", boxShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
            <span className="text-black font-black text-2xl">{prize.toLocaleString()}</span>
            <span className="text-black font-bold text-sm mr-1">🪙</span>
          </div>
        )}
        <button onClick={onClose}
          className="w-full py-3 rounded-2xl font-black text-sm active:scale-95"
          style={{ background: "linear-gradient(135deg,#ffd700,#c8a000)", color: "#000" }}>
          إغلاق
        </button>
      </div>
      <style>{`@keyframes conf-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(360deg);opacity:0}}`}</style>
    </div>
  );
}

// ── الشاشة الرئيسية ──
export default function MillionaireGameSheet({
  roomId, myUserId, members, isOwner, isAdmin, onClose,
}: {
  roomId: string;
  myUserId: string;
  members: any[];
  isOwner: boolean;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [activeGame, setActiveGame] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastGameId, setLastGameId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      const { data: game } = await supabase.from('millionaire_games').select('*').eq('room_id', roomId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single();
      setActiveGame(game);
      
      if (game) {
        const { data: q } = await supabase.from('millionaire_questions').select('*').eq('id', game.current_question_id).single();
        setCurrentQuestion(q);
      }
    };
    fetchGame();
    const sub = supabase.channel(`millionaire_room_${roomId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'millionaire_games' }, fetchGame).subscribe();
    return () => { sub.unsubscribe(); };
  }, [roomId]);

  const isHost = activeGame?.host_user_id === myUserId;
  const isContestant = activeGame?.contestant_user_id === myUserId;

  useEffect(() => {
    if (activeGame?.status === "ended" && activeGame.id !== lastGameId) {
      setLastGameId(activeGame.id);
      setShowResult(true);
    }
  }, [activeGame?.status, activeGame?.id]);

  const hostMember = members.find(m => m.seatIndex === 0);
  const contestantMember = members.find(m => m.seatIndex === 1);

  const handleStart = async () => {
    if (!hostMember || !contestantMember) {
      toast.error("يجب أن يكون المذيع في المقعد 1 والمشارك في المقعد 2");
      return;
    }
    try {
      const { data: questions } = await supabase.from('millionaire_questions').select('id').limit(1);
      if (!questions || questions.length === 0) throw new Error("لا توجد أسئلة متوفرة");

      const { error } = await supabase.from('millionaire_games').insert({
        room_id: roomId,
        host_user_id: myUserId,
        contestant_user_id: contestantMember.userId,
        current_level: 0,
        current_question_index: 0,
        current_question_id: questions[0].id,
        status: 'active'
      });
      if (error) throw error;
    } catch (e: any) { toast.error(e.message); }
  };

  if (showResult && activeGame?.status === "ended") {
    return <GameResult game={activeGame} onClose={() => { setShowResult(false); onClose(); }} />;
  }

  if (activeGame?.status === "active") {
    if (isContestant) return <ContestantPanel game={activeGame} question={currentQuestion} myUserId={myUserId} />;
    if (isHost) return <HostPanel game={activeGame} question={currentQuestion} myUserId={myUserId} />;
    return null;
  }

  // ── شريط البدء للمالك/الأدمن ──
  if (!activeGame && (isOwner || isAdmin)) {
    // أيقونة مصغّرة
    if (collapsed) {
      return <MillionaireMinIcon onClick={() => setCollapsed(false)} />;
    }

    return (
      <div className="fixed bottom-20 left-3 right-3 z-[400] rounded-2xl p-4"
        style={{ background: "linear-gradient(135deg,#001a4d,#000d2e)", border: "2px solid rgba(255,215,0,0.4)", boxShadow: "0 0 30px rgba(255,215,0,0.15)" }}>

        {/* رأس الشريط مع زر الإخفاء */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#ffd700,#c8a000)" }}>🎯</div>
          <div className="flex-1">
            <p className="text-white font-black text-sm">من سيربح المليون؟</p>
            <p className="text-gray-500 text-[10px]">المقعد 1: المذيع | المقعد 2: المشارك</p>
          </div>
          {/* زر الإخفاء */}
          <button onClick={() => setCollapsed(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 p-2 rounded-xl text-center text-xs"
            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)" }}>
            <div className="text-yellow-400 font-black">🎙 المذيع</div>
            <div className="text-gray-400 text-[10px]">{hostMember?.profile?.name ?? "فارغ"}</div>
          </div>
          <div className="flex-1 p-2 rounded-xl text-center text-xs"
            style={{ background: "rgba(21,101,192,0.12)", border: "1px solid rgba(21,101,192,0.25)" }}>
            <div className="text-blue-400 font-black">⭐ المشارك</div>
            <div className="text-gray-400 text-[10px]">{contestantMember?.profile?.name ?? "فارغ"}</div>
          </div>
        </div>

        <button onClick={handleStart}
          className="w-full py-3 rounded-2xl font-black text-sm active:scale-95"
          style={{ background: "linear-gradient(135deg,#ffd700,#c8a000)", color: "#000", boxShadow: "0 0 25px rgba(255,215,0,0.4)" }}>
          🎬 بدء اللعبة
        </button>
      </div>
    );
  }

  return null;
}
