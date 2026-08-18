interface NewUserFrameProps {
  size: number;
  children: React.ReactNode;
}

export default function NewUserFrame({ size, children }: NewUserFrameProps) {
  const outerSize = Math.round(size * 1.38);
  const borderWidth = Math.max(2, Math.round(size * 0.045));

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: outerSize, height: outerSize }}
    >
      {/* الحلقة الدوارة الخارجية */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #00d2ff 0%, #a855f7 25%, #ec4899 50%, #FFD700 75%, #00d2ff 100%)",
          animation: "newFrameSpin 3s linear infinite",
          padding: borderWidth,
          boxShadow: "0 0 20px rgba(0,210,255,0.7), 0 0 40px rgba(168,85,247,0.5), 0 0 60px rgba(0,210,255,0.3)",
        }}
      >
        <div className="w-full h-full rounded-full" style={{ background: "#0f0f1a" }} />
      </div>

      {/* حلقة ثانية عكسية */}
      <div
        className="absolute rounded-full opacity-50"
        style={{
          inset: borderWidth * 0.5,
          background: "conic-gradient(from 90deg, transparent 0%, rgba(0,210,255,0.5) 30%, transparent 60%, rgba(236,72,153,0.5) 90%, transparent 100%)",
          animation: "newFrameSpin 2s linear infinite reverse",
        }}
      />

      {/* شارة NEW */}
      <div
        className="absolute z-20 flex items-center gap-0.5 rounded-full font-black"
        style={{
          bottom: -1,
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg,#FFD700,#FFA500)",
          color: "#000",
          fontSize: Math.max(7, Math.round(size * 0.12)),
          padding: `${Math.max(2, Math.round(size * 0.03))}px ${Math.max(5, Math.round(size * 0.1))}px`,
          boxShadow: "0 2px 10px rgba(255,165,0,0.8)",
          whiteSpace: "nowrap",
          animation: "newBadgePulse 2s ease-in-out infinite",
        }}
      >
        ✨ NEW
      </div>

      {/* الصورة */}
      <div
        className="relative z-10 rounded-full overflow-hidden"
        style={{ width: size, height: size }}
      >
        {children}
      </div>

      <style>{`
        @keyframes newFrameSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes newBadgePulse {
          0%,100% { transform: translateX(-50%) scale(1); box-shadow: 0 2px 10px rgba(255,165,0,0.8); }
          50%      { transform: translateX(-50%) scale(1.12); box-shadow: 0 2px 18px rgba(255,165,0,1); }
        }
      `}</style>
    </div>
  );
}
