// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

interface BombFloatingIconProps {
  roomId: string;
  onClick: () => void;
  isCp: boolean;
  isMusic: boolean;
}

const MAX_LEVEL = 10;
const LEVEL_THRESHOLDS = [
  1_000_000, 5_000_000, 10_000_000, 15_000_000, 20_000_000,
  30_000_000, 50_000_000, 75_000_000, 100_000_000, 150_000_000,
];

const LEVEL_COLORS = [
  "#f59e0b", "#ef4444", "#a855f7", "#3b82f6", "#10b981",
  "#f97316", "#ec4899", "#06b6d4", "#84cc16", "#ff006e",
];

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function BombFloatingIcon({ roomId, onClick, isCp, isMusic }: BombFloatingIconProps) {
  const [bombState, setBombState] = useState<any>(null);

  useEffect(() => {
    const fetchBomb = async () => {
      const { data } = await supabase.from('room_bomb_state').select('*').eq('room_id', roomId).single();
      setBombState(data);
    };
    fetchBomb();
    const sub = supabase.channel(`bomb_icon_${roomId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'room_bomb_state' }, fetchBomb).subscribe();
    return () => { sub.unsubscribe(); };
  }, [roomId]);

  const currentLevel = bombState?.current_level ?? 1;
  const totalCoins = bombState?.total_coins_in_level ?? 0;
  const threshold = bombState?.threshold ?? LEVEL_THRESHOLDS[0];
  const isExploding = bombState?.is_exploding ?? false;
  const progress = Math.min((totalCoins / threshold) * 100, 100);
  const isDone = currentLevel > MAX_LEVEL;

  const lvlIdx = Math.min(currentLevel - 1, LEVEL_COLORS.length - 1);
  const accentColor = isExploding ? "#ef4444" : LEVEL_COLORS[lvlIdx];

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 relative"
      style={{ minWidth: 44 }}
    >
      {/* Circular progress ring */}
      <div className="relative w-11 h-11 flex items-center justify-center">
        {/* SVG ring */}
        {!isDone && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
            {/* Track */}
            <circle
              cx="22" cy="22" r="19"
              fill="none"
              stroke={isExploding ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}
              strokeWidth="3"
            />
            {/* Progress */}
            <circle
              cx="22" cy="22" r="19"
              fill="none"
              stroke={accentColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 19}`}
              strokeDashoffset={`${2 * Math.PI * 19 * (1 - progress / 100)}`}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
        )}

        {/* Center background */}
        <div
          className="w-9 h-9 rounded-full flex flex-col items-center justify-center relative z-10"
          style={
            isExploding
              ? { background: "rgba(239,68,68,0.25)", boxShadow: "0 0 16px rgba(239,68,68,0.5)" }
              : { background: `${accentColor}25`, boxShadow: `0 0 10px ${accentColor}40` }
          }
        >
          <span className={`text-xl leading-none ${isExploding ? "animate-bounce" : ""}`}>
            {isDone ? "✅" : "💣"}
          </span>
        </div>

        {/* Exploding pulse ring */}
        {isExploding && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "rgba(239,68,68,0.15)" }}
          />
        )}
      </div>

      {/* Level label */}
      {!isDone && (
        <span
          className="text-[9px] font-black leading-none"
          style={{ color: accentColor }}
        >
          {isExploding ? "💥" : `M${currentLevel}`}
        </span>
      )}
    </button>
  );
}
