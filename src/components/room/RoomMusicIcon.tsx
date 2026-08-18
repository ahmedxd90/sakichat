// @ts-nocheck
import { useState } from "react";
import { toggleGlobalMusicMute, isGlobalMusicMuted } from "./RoomMusicPlayer";

interface RoomMusicIconProps {
  musicName: string;
  isCp: boolean;
  canControl: boolean;
  onClick: () => void;
}

export default function RoomMusicIcon({ musicName, isCp, canControl, onClick }: RoomMusicIconProps) {
  const color = isCp ? "#ff85a1" : "#c084fc";
  const [muted, setMuted] = useState(() => isGlobalMusicMuted());

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = toggleGlobalMusicMute();
    setMuted(newMuted);
  };

  return (
    <button
      onClick={canControl ? onClick : undefined}
      className="flex items-center gap-1.5 rounded-full px-2 py-1 transition-transform active:scale-95"
      style={{
        background: "rgba(0,0,0,0.45)",
        border: `1px solid ${color}55`,
        backdropFilter: "blur(8px)",
        cursor: canControl ? "pointer" : "default",
        WebkitTapHighlightColor: "transparent",
        maxWidth: "160px",
      }}
    >
      {/* Animated music disc */}
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center relative"
        style={{
          background: `radial-gradient(circle, ${color}33 0%, ${color}11 100%)`,
          border: `1.5px solid ${color}66`,
          animation: "musicDiscSpin 3s linear infinite",
        }}
      >
        {/* Sound waves inside disc */}
        <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end", height: 10 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 2,
                borderRadius: 2,
                background: color,
                height: `${4 + i * 2}px`,
                animation: `musicWave${i} ${0.4 + i * 0.15}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Track name */}
      <span
        className="text-[9px] font-bold truncate"
        style={{ color, maxWidth: 70 }}
      >
        {musicName}
      </span>

      {/* Mute/Unmute button */}
      <button
        onClick={handleMuteToggle}
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)",
          border: `1px solid ${muted ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.2)"}`,
        }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={muted ? "#ef4444" : color} strokeWidth="2.5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          {muted
            ? <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
            : <path d="M15.54 8.46a5 5 0 010 7.07"/>
          }
        </svg>
      </button>

      <style>{`
        @keyframes musicDiscSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes musicWave1 { from { height: 3px; } to { height: 8px; } }
        @keyframes musicWave2 { from { height: 5px; } to { height: 10px; } }
        @keyframes musicWave3 { from { height: 4px; } to { height: 7px; } }
      `}</style>
    </button>
  );
}
