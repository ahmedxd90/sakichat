// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface PKFloatingIconProps {
  roomId: Id<"rooms">;
  onClick: () => void;
}

function SwordSVG({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
      <line x1="13" y1="19" x2="19" y2="13"/>
      <line x1="16" y1="16" x2="20" y2="20"/>
      <line x1="19" y1="21" x2="21" y2="19"/>
    </svg>
  );
}

export default function PKFloatingIcon({ roomId, onClick }: PKFloatingIconProps) {
  const activePK = useQuery(api.pk.getActivePKBattle, { roomId });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activePK || activePK.status !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activePK?.status]);

  if (!activePK || (activePK.status !== "active" && activePK.status !== "pending")) return null;

  const isActive = activePK.status === "active";
  const timeLeft = activePK.endsAt ? Math.max(0, activePK.endsAt - now) : 0;
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isUrgent = timeLeft < 60000 && isActive;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-2xl active:scale-95 transition-all animate-pk-icon"
      style={{
        width: 44,
        height: 44,
        background: "linear-gradient(135deg, #1a0820, #0a0510)",
        border: `1.5px solid ${isUrgent ? "rgba(239,68,68,0.7)" : "rgba(249,115,22,0.6)"}`,
        boxShadow: `0 0 12px ${isUrgent ? "rgba(239,68,68,0.5)" : "rgba(249,115,22,0.4)"}`,
      }}
    >
      <SwordSVG color={isUrgent ? "#ef4444" : "#fb923c"} size={16} />
      {isActive && (
        <span className="text-[7px] font-black tabular-nums leading-none"
          style={{ color: isUrgent ? "#ef4444" : "#fb923c" }}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      )}
      {!isActive && (
        <span className="text-[7px] font-bold leading-none" style={{ color: "#fb923c" }}>PK</span>
      )}
    </button>
  );
}
