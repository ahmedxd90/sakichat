import { memo } from "react";

export const FootballSpeakingWaves = memo(function FootballSpeakingWaves() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: "50%", overflow: "visible" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            inset: -(i + 1) * 6,
            border: `2px solid ${i === 0 ? "#22c55e" : i === 1 ? "#16a34a" : "#fbbf24"}`,
            opacity: 0.85 - i * 0.22,
            animation: `footballWave 1.3s ease-out ${i * 0.28}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes footballWave {
          0% { transform: scale(1); opacity: 0.85; }
          100% { transform: scale(1.7); opacity: 0; }
        }
      `}</style>
    </div>
  );
});
