// @ts-nocheck
import { AristocracyName, AristocracyBadge } from "./AristocracyBadge";

export function AristocracyBanner({ profile, onOpen }: { profile: any; onOpen?: () => void }) {
  const aristLevel = profile.aristocracyLevel ?? 0;
  const aristExpiry = profile.aristocracyExpiresAt ?? 0;
  const isActive = aristLevel > 0 && aristExpiry > Date.now();
  const rank = ARISTOCRACY_RANKS.find((r) => r.level === aristLevel);
  const daysLeft = isActive
    ? Math.max(0, Math.ceil((aristExpiry - Date.now()) / 86400000))
    : 0;

  // Progress bar: days left out of 30 (capped at 100%)
  const progressPct = isActive ? Math.min(100, Math.round((daysLeft / 30) * 100)) : 0;

  return (
    <button
      onClick={onOpen}
      className="mx-4 mt-3 rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform relative overflow-hidden"
      style={{
        background: isActive && rank
          ? `linear-gradient(135deg, ${rank.color}18, ${rank.color}06, rgba(0,0,0,0.3))`
          : "linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,140,0,0.03))",
        border: isActive && rank
          ? `1px solid ${rank.color}45`
          : "1px solid rgba(255,215,0,0.18)",
        boxShadow: isActive && rank
          ? `0 4px 24px ${rank.glowColor}18, inset 0 1px 0 ${rank.color}20`
          : "0 2px 12px rgba(255,215,0,0.06)",
      }}
    >
      {/* Ambient glow blob */}
      {isActive && rank && (
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${rank.color}25, transparent 70%)`,
            filter: "blur(8px)",
            animation: "aristo-banner-glow 3s ease-in-out infinite",
          }}
        />
      )}

      {/* Icon */}
      <div
        className="relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
        style={
          isActive && rank
            ? {
                background: rank.gradient,
                boxShadow: `0 0 16px ${rank.glowColor}60`,
                animation: aristLevel === 7
                  ? "aristo-icon-emperor 2s ease-in-out infinite"
                  : "aristo-icon-pulse 3s ease-in-out infinite",
              }
            : {
                background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.08))",
                border: "1px solid rgba(255,215,0,0.2)",
              }
        }
      >
        <span style={{ fontSize: 22 }}>{isActive && rank ? rank.icon : "🏅"}</span>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 text-right">
        {isActive && rank ? (
          <>
            <div className="flex items-center gap-1.5 mb-0.5 flex-row-reverse justify-end">
              <AristocracyName name={rank.nameAr} level={aristLevel} />
              <AristocracyBadge level={aristLevel} size="sm" />
            </div>
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-[10px] text-gray-400">{daysLeft} يوم متبقي</span>
              <span className="text-[10px] font-bold" style={{ color: rank.color }}>
                +{rank.dailyCoins.toLocaleString()} 🪙/يوم
              </span>
            </div>
            {/* Progress bar */}
            <div
              className="mt-1.5 h-1 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: rank.gradient,
                  boxShadow: `0 0 6px ${rank.glowColor}`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div
              className="font-black text-sm"
              style={{
                background: "linear-gradient(90deg,#ff8c00,#ffd700,#ff6347)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "aristo-title-shimmer 3s linear infinite",
              }}
            >
              الأرستقراطية 👑
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              رتب ملكية حصرية · 7 مستويات
            </div>
            <div className="flex items-center gap-1 mt-1 flex-row-reverse">
              {ARISTOCRACY_RANKS.slice(0, 5).map((r) => (
                <span key={r.level} style={{ fontSize: 12 }}>{r.icon}</span>
              ))}
              <span className="text-gray-600 text-[9px]">+2</span>
            </div>
          </>
        )}
      </div>

      {/* Arrow chevron */}
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: isActive && rank ? `${rank.color}20` : "rgba(255,215,0,0.08)",
          border: isActive && rank
            ? `1px solid ${rank.color}30`
            : "1px solid rgba(255,215,0,0.15)",
        }}
      >
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke={isActive && rank ? rank.color : "#ffd700"}
          strokeWidth="2.5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </div>

      <style>{`
        @keyframes aristo-banner-glow {
          0%,100% { opacity:0.6; transform:scale(1); }
          50% { opacity:1; transform:scale(1.15); }
        }
        @keyframes aristo-icon-pulse {
          0%,100% { box-shadow:0 0 16px rgba(255,215,0,0.6); }
          50% { box-shadow:0 0 28px rgba(255,215,0,0.9); }
        }
        @keyframes aristo-icon-emperor {
          0%,100% { transform:scale(1); box-shadow:0 0 20px rgba(255,215,0,0.8); }
          50% { transform:scale(1.06); box-shadow:0 0 36px rgba(255,215,0,1),0 0 60px rgba(255,140,0,0.5); }
        }
        @keyframes aristo-title-shimmer {
          0% { background-position:0% center; }
          100% { background-position:200% center; }
        }
      `}</style>
    </button>
  );
}
