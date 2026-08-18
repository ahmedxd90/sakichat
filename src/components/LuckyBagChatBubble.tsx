// @ts-nocheck
export default function LuckyBagChatBubble({ m }: { m: any }) {
  return (
    <div className="flex justify-center my-1.5">
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
        style={{
          background: "linear-gradient(135deg,rgba(251,191,36,0.15),rgba(220,38,38,0.08))",
          border: "1.5px solid rgba(251,191,36,0.5)",
          boxShadow: "0 0 20px rgba(251,191,36,0.2), 0 2px 8px rgba(0,0,0,0.4)",
          maxWidth: "92%",
        }}
      >
        {/* Avatar */}
        {m.senderAvatarUrl ? (
          <img src={m.senderAvatarUrl} alt=""
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            style={{ border: "2px solid rgba(251,191,36,0.6)" }}
          />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", border: "2px solid rgba(251,191,36,0.6)" }}>
            <span className="text-black font-black text-sm">{(m.senderName ?? "؟")[0]}</span>
          </div>
        )}

        {/* Red money bag SVG */}
        <div className="flex-shrink-0" style={{ animation: "bagBounceChat 1.2s ease-in-out infinite" }}>
          <svg width="38" height="38" viewBox="0 0 64 64" fill="none">
            <ellipse cx="32" cy="42" rx="22" ry="18" fill="#dc2626"/>
            <ellipse cx="32" cy="42" rx="22" ry="18" fill="url(#chatBagBodyGrad)"/>
            <rect x="24" y="24" width="16" height="10" rx="4" fill="#b91c1c"/>
            <ellipse cx="32" cy="24" rx="8" ry="5" fill="#991b1b"/>
            <ellipse cx="32" cy="24" rx="6" ry="3.5" fill="#dc2626"/>
            <ellipse cx="24" cy="36" rx="6" ry="4" fill="rgba(255,255,255,0.25)" transform="rotate(-20 24 36)"/>
            <circle cx="32" cy="44" r="9" fill="#fbbf24"/>
            <circle cx="32" cy="44" r="7" fill="#f59e0b"/>
            <circle cx="32" cy="44" r="4" fill="#fbbf24" opacity="0.6"/>
            <circle cx="48" cy="30" r="2.5" fill="#fbbf24" opacity="0.9"/>
            <circle cx="14" cy="35" r="2" fill="#fbbf24" opacity="0.7"/>
            <circle cx="50" cy="50" r="1.5" fill="#fbbf24" opacity="0.6"/>
            <defs>
              <linearGradient id="chatBagBodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,120,120,0.3)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0.35)"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-yellow-300 font-black text-xs truncate max-w-[85px]">{m.senderName}</span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000" }}
            >
              SUPER
            </span>
          </div>
          <p className="text-white text-[11px] font-bold leading-tight">أرسل حقيبة حظ سوبر 🎁</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-yellow-400 text-[10px] font-bold">
              {(m.luckyBagCoins ?? 0).toLocaleString()} 🪙
            </span>
            <span className="text-gray-500 text-[9px]">لـ {m.luckyBagRecipients ?? 0} شخص</span>
          </div>
        </div>

        {/* Sparkle */}
        <div className="flex-shrink-0 text-yellow-400 text-lg" style={{ animation: "sparkleSpin 2s linear infinite" }}>
          ✨
        </div>
      </div>

      <style>{`
        @keyframes bagBounceChat {
          0%, 100% { transform: translateY(0) rotate(-5deg) scale(1); }
          50% { transform: translateY(-5px) rotate(5deg) scale(1.05); }
        }
        @keyframes sparkleSpin {
          0% { transform: rotate(0deg) scale(1); opacity: 1; }
          50% { transform: rotate(180deg) scale(1.3); opacity: 0.7; }
          100% { transform: rotate(360deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
