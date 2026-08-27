// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../lib/toast";

interface RoomInteractiveGamesProps {
  roomId: string;
  myProfile: any;
  mySeatIndex: number | null;
  seatedMembers: any[];
  isCp: boolean;
  onClose: () => void;
}

type GameTab = "dice" | "rps";
type RPSChoice = "rock" | "paper" | "scissors";

const RPS_CHOICES: { key: RPSChoice; emoji: string; label: string }[] = [
  { key: "rock", emoji: "🪨", label: "حجر" },
  { key: "paper", emoji: "📄", label: "ورقة" },
  { key: "scissors", emoji: "✂️", label: "مقص" },
];

export default function RoomInteractiveGames({
  roomId, myProfile, mySeatIndex, seatedMembers, isCp, onClose,
}: RoomInteractiveGamesProps) {
  const [tab, setTab] = useState<GameTab>("dice");
  const [diceResult, setDiceResult] = useState<any>(null);
  const [rpsResult, setRpsResult] = useState<any>(null);
  const [rpsChoice, setRpsChoice] = useState<RPSChoice | null>(null);
  const [betAmount, setBetAmount] = useState(0);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);

  const others = seatedMembers.filter((m) => m.profile?.user_id !== myProfile?.user_id);
  const accentColor = isCp ? "#ff4d6d" : "#a855f7";
  const accentGrad = isCp
    ? "linear-gradient(135deg,#c9184a,#ff4d6d)"
    : "linear-gradient(135deg,#a855f7,#ec4899)";

  const handleRollDice = async () => {
    setLoading(true);
    setDiceRolling(true);
    setDiceResult(null);
    try {
      // Game logic migration to Supabase Edge Function pending
      const myRoll = Math.floor(Math.random() * 6) + 1;
      const res = { myRoll, outcome: "تم رمي النرد!" };
      
      let count = 0;
      const interval = setInterval(() => {
        setDiceValue(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count >= 8) {
          clearInterval(interval);
          setDiceValue(res.myRoll);
          setDiceRolling(false);
          setDiceResult(res);
        }
      }, 120);
    } catch (e: any) {
      toast.error(e.message);
      setDiceRolling(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayRPS = async () => {
    if (!rpsChoice) { toast.error("اختر حجر أو ورقة أو مقص"); return; }
    setLoading(true);
    setRpsResult(null);
    try {
      // Game logic migration to Supabase Edge Function pending
      const cpuChoice = RPS_CHOICES[Math.floor(Math.random() * 3)].key;
      const res = { myChoice: rpsChoice, cpuChoice, outcome: "انتهت الجولة!" };
      setRpsResult(res);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  return (
    <div className="fixed inset-0 z-[65] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t animate-slide-up-sheet flex flex-col max-h-[85vh]"
        style={{
          background: isCp ? "#1a000d" : "#181828",
          borderColor: isCp ? "rgba(255,77,109,0.3)" : "rgba(255,255,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
          <h3 className="text-white font-black text-base">🎮 الألعاب التفاعلية</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
          {[
            { key: "dice", label: "🎲 النرد", emoji: "🎲" },
            { key: "rps", label: "✊ حجر ورقة مقص", emoji: "✊" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as GameTab); setDiceResult(null); setRpsResult(null); setRpsChoice(null); }}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={tab === t.key
                ? { background: accentGrad, color: "#fff", boxShadow: `0 2px 12px ${accentColor}50` }
                : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
          {/* Target selector */}
          {others.length > 0 && (
            <div className="mb-3">
              <p className="text-gray-400 text-[10px] font-bold mb-1.5">اختر خصماً (اختياري)</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => setTargetUserId(null)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border transition-all"
                  style={!targetUserId
                    ? { borderColor: accentColor, background: `${accentColor}20` }
                    : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }
                  }
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">🤖</div>
                  <span className="text-[9px] font-bold" style={{ color: !targetUserId ? accentColor : "#6b7280" }}>كمبيوتر</span>
                </button>
                {others.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setTargetUserId(m.user_id)}
                    className="flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl border transition-all"
                    style={targetUserId === m.user_id
                      ? { borderColor: accentColor, background: `${accentColor}20` }
                      : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }
                    }
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      {m.profile?.avatarUrl
                        ? <img src={m.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-[9px] font-bold">{m.profile?.name?.[0]}</div>
                      }
                    </div>
                    <span className="text-[9px] font-bold truncate max-w-[40px]" style={{ color: targetUserId === m.userId ? accentColor : "#9ca3af" }}>{m.profile?.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bet amount */}
          {targetUserId && (
            <div className="mb-3">
              <p className="text-gray-400 text-[10px] font-bold mb-1.5">مبلغ الرهان 🪙 (اختياري)</p>
              <div className="flex gap-1.5 flex-wrap">
                {[0, 100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                    style={betAmount === amt
                      ? { background: accentGrad, color: "#fff" }
                      : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    {amt === 0 ? "بدون رهان" : `${amt.toLocaleString()}🪙`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DICE GAME */}
          {tab === "dice" && (
            <div className="flex flex-col items-center gap-4">
              {/* Dice display */}
              <div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center text-6xl transition-all ${diceRolling ? "animate-bounce" : ""}`}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `2px solid ${accentColor}40`,
                  boxShadow: diceValue ? `0 0 30px ${accentColor}40` : "none",
                }}
              >
                {diceValue ? DICE_FACES[diceValue - 1] : "🎲"}
              </div>

              {/* Result */}
              {diceResult && !diceRolling && (
                <div className="w-full rounded-2xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <p className="text-white font-black text-lg mb-1">
                    {DICE_FACES[(diceResult.myRoll ?? 1) - 1]} {diceResult.myRoll}
                    {diceResult.opponentRoll != null && ` vs ${DICE_FACES[(diceResult.opponentRoll ?? 1) - 1]} ${diceResult.opponentRoll}`}
                  </p>
                  {diceResult.outcome && (
                    <p className="text-yellow-400 font-bold text-sm">{diceResult.outcome}</p>
                  )}
                </div>
              )}

              <button
                onClick={handleRollDice}
                disabled={loading || diceRolling}
                className="w-full py-3.5 rounded-2xl text-white font-black text-base disabled:opacity-50 active:scale-95 transition-all"
                style={{ background: accentGrad, boxShadow: `0 4px 20px ${accentColor}50` }}
              >
                {diceRolling ? "🎲 يرمي..." : "🎲 ارمِ النرد"}
              </button>
            </div>
          )}

          {/* RPS GAME */}
          {tab === "rps" && (
            <div className="flex flex-col items-center gap-4">
              {/* Choices */}
              <div className="flex gap-3 w-full justify-center">
                {RPS_CHOICES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setRpsChoice(c.key)}
                    className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border transition-all active:scale-95"
                    style={rpsChoice === c.key
                      ? { borderColor: accentColor, background: `${accentColor}25`, boxShadow: `0 0 20px ${accentColor}40` }
                      : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }
                    }
                  >
                    <span className="text-3xl">{c.emoji}</span>
                    <span className="text-[10px] font-bold" style={{ color: rpsChoice === c.key ? accentColor : "#9ca3af" }}>{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Result */}
              {rpsResult && (
                <div className="w-full rounded-2xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">{RPS_CHOICES.find((c) => c.key === rpsResult.myChoice)?.emoji}</span>
                      <span className="text-[9px] text-gray-400">أنت</span>
                    </div>
                    <span className="text-white font-black text-lg">VS</span>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">{RPS_CHOICES.find((c) => c.key === rpsResult.cpuChoice)?.emoji}</span>
                      <span className="text-[9px] text-gray-400">{targetUserId ? "الخصم" : "الكمبيوتر"}</span>
                    </div>
                  </div>
                  <p className="text-yellow-400 font-black text-base">{rpsResult.outcome}</p>
                </div>
              )}

              <button
                onClick={handlePlayRPS}
                disabled={loading || !rpsChoice}
                className="w-full py-3.5 rounded-2xl text-white font-black text-base disabled:opacity-50 active:scale-95 transition-all"
                style={{ background: accentGrad, boxShadow: `0 4px 20px ${accentColor}50` }}
              >
                {loading ? "⏳ جاري اللعب..." : "✊ العب الآن"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
