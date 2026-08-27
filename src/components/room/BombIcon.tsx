// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

interface BombIconProps {
  roomId: string;
  onClick: () => void;
  isCp: boolean;
  isMusic: boolean;
}

const LEVEL_THRESHOLDS = [1_000_000, 5_000_000, 10_000_000, 15_000_000, 20_000_000];

export default function BombIcon({ roomId, onClick, isCp, isMusic }: BombIconProps) {
  const [bombState, setBombState] = useState<any>(null);

  useEffect(() => {
    const fetchBomb = async () => {
      const { data } = await supabase.from('room_bomb_state').select('*').eq('room_id', roomId).single();
      setBombState(data);
    };
    fetchBomb();
    const sub = supabase.channel(`bomb_icon_v2_${roomId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'room_bomb_state' }, fetchBomb).subscribe();
    return () => { sub.unsubscribe(); };
  }, [roomId]);

  const currentLevel = bombState?.current_level ?? 1;
  const totalCoins = bombState?.total_coins_in_level ?? 0;
  const threshold = bombState?.threshold ?? LEVEL_THRESHOLDS[0];
  const isExploding = bombState?.is_exploding ?? false;
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
