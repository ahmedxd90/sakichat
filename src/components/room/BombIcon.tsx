// @ts-nocheck
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface BombIconProps {
  roomId: Id<"rooms">;
  onClick: () => void;
  isCp: boolean;
  isMusic: boolean;
}

const LEVEL_THRESHOLDS = [1_000_000, 5_000_000, 10_000_000, 15_000_000, 20_000_000];

export default function BombIcon({ roomId, onClick, isCp, isMusic }: BombIconProps) {
  const bombState = useQuery(api.roomBomb.getRoomBombState, { roomId });

  const currentLevel = bombState?.currentLevel ?? 1;
  const totalCoins = bombState?.totalCoinsInLevel ?? 0;
  const threshold = bombState?.threshold ?? LEVEL_THRESHOLDS[0];
  const isExploding = bombState?.isExploding ?? false;
  const progress = Math.min((totalCoins / threshold) * 100, 100);
  const isDone = currentLevel > 5;

  const bgStyle = isExploding
    ? { background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.6)", boxShadow: "0 0 12px rgba(239,68,68,0.4)" }
    : isMusic
      ? { background: "rgba(255,0,110,0.15)", border: "1px solid rgba(255,0,110,0.3)" }
      : isCp
        ? { background: "rgba(255,77,109,0.15)", border: "1px solid rgba(255,77,109,0.25)" }
        : { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" };

  return (
    <button
      onClick={onClick}
      className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden"
      style={bgStyle}
    >
      {/* Progress fill at bottom */}
      {!isDone && (
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-500"
          style={{
            height: `${progress}%`,
            background: isExploding
              ? "rgba(239,68,68,0.25)"
              : "rgba(245,158,11,0.15)",
          }}
        />
      )}
      <span className={`text-lg relative z-10 ${isExploding ? "animate-bounce" : ""}`}>
        {isDone ? "✅" : "💣"}
      </span>
      {!isDone && (
        <span className="text-[8px] font-bold relative z-10" style={{ color: isExploding ? "#ef4444" : "#f59e0b" }}>
          M{currentLevel}
        </span>
      )}
    </button>
  );
}
