// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatNumber } from "../../lib/formatNumber";

interface InRoomPKBarProps {
  roomId: Id<"rooms">;
  onOpenDetails: () => void;
}

export default function InRoomPKBar({ roomId, onOpenDetails }: InRoomPKBarProps) {
  const activePK = useQuery(api.pkInRoom.getActiveInRoomPK, { roomId });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activePK) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activePK?._id]);

  if (!activePK) return null;

  const timeLeft = Math.max(0, activePK.endsAt - now);
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isUrgent = timeLeft < 60000;
  const isFever = activePK.isFeverTime;

  const total = (activePK.team1Coins ?? 0) + (activePK.team2Coins ?? 0);
  const t1Pct = total > 0 ? ((activePK.team1Coins ?? 0) / total) * 100 : 50;
  const t2Pct = 100 - t1Pct;
  const t1Leading = (activePK.team1Coins ?? 0) >= (activePK.team2Coins ?? 0);

  return (
    <button
      onClick={onOpenDetails}
      className="flex-shrink-0 mx-2 mb-1 rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
      style={{
        background: "linear-gradient(135deg,rgba(0,8,32,0.95),rgba(5,0,16,0.95),rgba(16,0,5,0.95))",
        border: isFever ? "1px solid rgba(251,146,60,0.6)" : "1px solid rgba(251,146,60,0.3)",
        boxShadow: isFever
          ? "0 0 20px rgba(251,146,60,0.4)"
          : "0 0 12px rgba(59,130,246,0.15)",
      }}
    >
      {isFever && (
        <div className="w-full py-1 text-center text-[10px] font-black"
          style={{ background: "linear-gradient(90deg,#ef4444,#f97316,#fbbf24,#f97316,#ef4444)", color: "#000" }}>
          🔥 FEVER TIME × 2 — مضاعفة النقاط! 🔥
        </div>
      )}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">⚔️</span>
            <span className="text-[11px] font-black" style={{ color: "#fb923c" }}>تحدي PK داخل الغرفة</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: isUrgent ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.15)", border: `1px solid ${isUrgent ? "rgba(239,68,68,0.5)" : "rgba(249,115,22,0.4)"}` }}>
            <span className="text-[11px] font-black tabular-nums" style={{ color: isUrgent ? "#ef4444" : "#fb923c" }}>
              ⏱ {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "rgba(239,68,68,0.2)", border: `2px solid ${t1Leading ? "#ef4444" : "rgba(239,68,68,0.3)"}`, boxShadow: t1Leading ? "0 0 12px rgba(239,68,68,0.5)" : "none" }}>
              🔴
            </div>
            <p className="text-[9px] font-black truncate max-w-[60px] text-center" style={{ color: t1Leading ? "#ef4444" : "rgba(255,255,255,0.7)" }}>
              {activePK.team1Name}
            </p>
            <div className="px-1.5 py-0.5 rounded-full text-[9px] font-black tabular-nums"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
              🎁 {formatNumber(activePK.team1Coins ?? 0)}
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <span className="text-base" style={{ filter: "drop-shadow(0 0 6px rgba(249,115,22,1))" }}>⚔️</span>
            <span className="text-xs font-black" style={{ color: "#fbbf24" }}>VS</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "rgba(59,130,246,0.2)", border: `2px solid ${!t1Leading ? "#3b82f6" : "rgba(59,130,246,0.3)"}`, boxShadow: !t1Leading ? "0 0 12px rgba(59,130,246,0.5)" : "none" }}>
              🔵
            </div>
            <p className="text-[9px] font-black truncate max-w-[60px] text-center" style={{ color: !t1Leading ? "#3b82f6" : "rgba(255,255,255,0.7)" }}>
              {activePK.team2Name}
            </p>
            <div className="px-1.5 py-0.5 rounded-full text-[9px] font-black tabular-nums"
              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#3b82f6" }}>
              🎁 {formatNumber(activePK.team2Coins ?? 0)}
            </div>
          </div>
        </div>
        <div className="mt-2">
          <div className="h-2.5 rounded-full overflow-hidden flex relative" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full transition-all duration-700 ease-out"
              style={{ width: `${t1Pct}%`, background: "linear-gradient(90deg,#dc2626,#ef4444)", borderRadius: "9999px 0 0 9999px" }} />
            <div className="h-full transition-all duration-700 ease-out"
              style={{ width: `${t2Pct}%`, background: "linear-gradient(90deg,#2563eb,#3b82f6)", borderRadius: "0 9999px 9999px 0" }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: `${t1Pct}%`, transform: "translateX(-50%)" }} />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] font-black" style={{ color: "#ef4444" }}>{t1Pct.toFixed(0)}%</span>
            <span className="text-[8px] text-gray-500">{formatNumber(total)} 🎁</span>
            <span className="text-[9px] font-black" style={{ color: "#3b82f6" }}>{t2Pct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </button>
  );
}
