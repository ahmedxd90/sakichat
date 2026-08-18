// ── Love sound waves between seats ──────────────────────────────────────────
interface CpSeatWavesProps {
  count: number; // number of seats
}

export default function CpSeatWaves({ count }: CpSeatWavesProps) {
  const bars = Array.from({ length: 20 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {/* Horizontal love wave across seats */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] h-6 opacity-30">
        {bars.map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: "3px",
              background: `linear-gradient(to top, #ff4d6d, #ff85a1)`,
              height: `${30 + Math.sin(i * 0.7) * 50}%`,
              animation: `cpWave ${0.5 + (i % 6) * 0.12}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
      {/* Floating mini hearts between seats */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-red-400"
          style={{
            left: `${10 + i * 11}%`,
            bottom: "20%",
            fontSize: `${8 + (i % 3) * 4}px`,
            animation: `cpHeartFloat ${2 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            opacity: 0.5,
          }}
        >
          ❤️
        </div>
      ))}
      <style>{`
        @keyframes cpWave {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes cpHeartFloat {
          0%   { transform: translateY(0) scale(1); opacity: 0.5; }
          50%  { transform: translateY(-18px) scale(1.2); opacity: 0.8; }
          100% { transform: translateY(-36px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
