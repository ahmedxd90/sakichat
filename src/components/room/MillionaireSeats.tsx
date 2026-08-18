// @ts-nocheck

// ── كرسي 3D من سيربح المليون ──
export function MillionaireChair({ type, member, isMe, onClick, seatIndex }: {
  type: "host" | "contestant";
  member?: any;
  isMe?: boolean;
  onClick: () => void;
  seatIndex: number;
}) {
  const isHost = type === "host";
  const color = isHost ? "#c8a000" : "#1565c0";
  const glowColor = isHost ? "rgba(200,160,0,0.6)" : "rgba(21,101,192,0.6)";
  const label = isHost ? "المذيع" : "المشارك";

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95 transition-transform relative">
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center z-20"
        style={{ background: `linear-gradient(135deg, ${color}, ${isHost ? "#8b6914" : "#0d47a1"})`, boxShadow: `0 0 6px ${glowColor}` }}>
        <span className="text-[8px] font-black text-white">{seatIndex + 1}</span>
      </div>

      <div className="relative" style={{ width: 64, height: 72 }}>
        <svg viewBox="0 0 64 72" width="64" height="72" style={{ filter: `drop-shadow(0 4px 12px ${glowColor})` }}>
          <defs>
            <linearGradient id={`cb${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isHost ? "#d4a800" : "#1976d2"} />
              <stop offset="100%" stopColor={isHost ? "#8b6914" : "#0d47a1"} />
            </linearGradient>
            <linearGradient id={`cs${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isHost ? "#ffd700" : "#42a5f5"} />
              <stop offset="100%" stopColor={isHost ? "#b8860b" : "#1565c0"} />
            </linearGradient>
          </defs>
          <rect x="12" y="4" width="40" height="32" rx="6" fill={`url(#cb${type})`} />
          <rect x="16" y="7" width="12" height="26" rx="4" fill="rgba(255,255,255,0.12)" />
          <text x="32" y="24" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.9)">{isHost ? "🎙" : "⭐"}</text>
          <rect x="8" y="36" width="48" height="14" rx="5" fill={`url(#cs${type})`} />
          <rect x="12" y="38" width="18" height="6" rx="3" fill="rgba(255,255,255,0.18)" />
          <rect x="4" y="32" width="8" height="20" rx="4" fill={isHost ? "#b8860b" : "#1565c0"} />
          <rect x="52" y="32" width="8" height="20" rx="4" fill={isHost ? "#b8860b" : "#1565c0"} />
          <rect x="12" y="50" width="6" height="18" rx="3" fill={isHost ? "#8b6914" : "#0d47a1"} />
          <rect x="46" y="50" width="6" height="18" rx="3" fill={isHost ? "#8b6914" : "#0d47a1"} />
          <rect x="15" y="62" width="34" height="4" rx="2" fill={isHost ? "#6b4f10" : "#0a3d7a"} />
          <rect x="12" y="4" width="40" height="3" rx="1.5" fill={isHost ? "#ffe066" : "#90caf9"} opacity="0.8" />
        </svg>

        {member ? (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10">
            <div className="rounded-full overflow-hidden border-2"
              style={{ width: 36, height: 36, borderColor: color, boxShadow: `0 0 10px ${glowColor}` }}>
              {member.profile?.avatarUrl
                ? <img src={member.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white font-black text-sm"
                    style={{ background: `linear-gradient(135deg, ${color}, ${isHost ? "#8b6914" : "#0d47a1"})` }}>
                    {member.profile?.name?.[0] ?? "؟"}
                  </div>
              }
            </div>
            {isMe && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border border-black" />}
          </div>
        ) : (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
            style={{ width: 36, height: 36 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
      </div>

      <div className="px-2 py-0.5 rounded-full text-[9px] font-black"
        style={{ background: `${color}25`, border: `1px solid ${color}40`, color }}>
        {member ? (member.profile?.name?.split(" ")[0] ?? label) : label}
      </div>
    </button>
  );
}

// ── أيقونة من سيربح المليون 3D ──
export function MillionaireIcon({ onClick, hasActiveGame }: { onClick: () => void; hasActiveGame: boolean }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
      style={{ filter: hasActiveGame ? "drop-shadow(0 0 10px rgba(255,215,0,0.8))" : "none" }}>
      <div className="relative w-12 h-12">
        <svg viewBox="0 0 48 48" width="48" height="48">
          <defs>
            <radialGradient id="millI" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="60%" stopColor="#c8a000" />
              <stop offset="100%" stopColor="#8b6914" />
            </radialGradient>
            <radialGradient id="millII" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#001a4d" />
              <stop offset="100%" stopColor="#000d2e" />
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#millI)" />
          <circle cx="24" cy="24" r="17" fill="url(#millII)" />
          <text x="24" y="31" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#ffd700">?</text>
          <text x="8" y="13" fontSize="7">⭐</text>
          <text x="34" y="13" fontSize="7">⭐</text>
          <ellipse cx="17" cy="15" rx="5" ry="2.5" fill="rgba(255,255,255,0.18)" transform="rotate(-30 17 15)" />
        </svg>
        {hasActiveGame && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-black animate-pulse" />
        )}
      </div>
      <span className="text-[8px] font-black" style={{ color: "#ffd700" }}>المليون</span>
    </button>
  );
}
