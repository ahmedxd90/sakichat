// @ts-nocheck
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatNumber } from "../../lib/formatNumber";

interface InRoomPKResultsOverlayProps {
  pkId: Id<"inRoomPKBattles">;
  onClose: () => void;
}

export default function InRoomPKResultsOverlay({ pkId, onClose }: InRoomPKResultsOverlayProps) {
  const contributors = useQuery(api.pkInRoom.getInRoomPKContributors, { pkId });
  const [pk, setPk] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Get PK data from contributors query context
  useEffect(() => {
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Auto close after 8 seconds
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, []);

  const team1Contribs = contributors?.filter((c: any) => c.team === "team1") ?? [];
  const team2Contribs = contributors?.filter((c: any) => c.team === "team2") ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(15px)" }}
      onClick={onClose}>
      <div className="animate-pk-results mx-4 w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(180deg,#0a0020,#050010)", border: "1px solid rgba(251,146,60,0.4)", boxShadow: "0 0 60px rgba(251,146,60,0.3)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="text-center py-4 px-4"
          style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.2),rgba(59,130,246,0.2))", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-4xl mb-1">⚔️</div>
          <h2 className="text-white font-black text-xl">انتهى التحدي!</h2>
          <p className="text-white/50 text-xs mt-1">نتائج تحدي PK الغرفة</p>
        </div>

        {/* Teams result */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            {/* Team 1 */}
            <div className="flex-1 text-center p-3 rounded-2xl"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <p className="text-[10px] text-white/60 mb-1">الفريق الأحمر</p>
              <p className="text-lg font-black" style={{ color: "#ef4444" }}>
                {formatNumber(team1Contribs.reduce((s: number, c: any) => s + c.coins, 0))}
              </p>
              <p className="text-[9px] text-white/40">🎁 عملة</p>
            </div>

            {/* VS */}
            <div className="text-center">
              <span className="text-2xl">⚔️</span>
              <p className="text-xs font-black" style={{ color: "#fbbf24" }}>VS</p>
            </div>

            {/* Team 2 */}
            <div className="flex-1 text-center p-3 rounded-2xl"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <p className="text-[10px] text-white/60 mb-1">الفريق الأزرق</p>
              <p className="text-lg font-black" style={{ color: "#3b82f6" }}>
                {formatNumber(team2Contribs.reduce((s: number, c: any) => s + c.coins, 0))}
              </p>
              <p className="text-[9px] text-white/40">🎁 عملة</p>
            </div>
          </div>

          {/* Top contributors */}
          {contributors && contributors.length > 0 && (
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/60 text-xs font-bold mb-2 text-center">🏆 أبطال التحدي</p>
              {contributors.slice(0, 5).map((c: any, i: number) => (
                <div key={c._id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                    <span className="text-white text-xs truncate max-w-[100px]">{c.userName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: c.team === "team1" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)", color: c.team === "team1" ? "#ef4444" : "#3b82f6" }}>
                      {c.team === "team1" ? "🔴" : "🔵"}
                    </span>
                  </div>
                  <span className="text-yellow-400 text-xs font-black">{formatNumber(c.coins)} 🎁</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close */}
        <div className="px-4 pb-4">
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg,#ef4444,#3b82f6)", color: "white" }}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
