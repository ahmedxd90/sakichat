import { useEffect, useRef, useState } from "react";

interface LuckWinOverlayProps {
  multiplier: number;
  giftName: string;
  giftPrice: number;
  onDone: () => void;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  emoji: string;
}

export default function LuckWinOverlay({ multiplier, giftName, giftPrice, onDone }: LuckWinOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showText, setShowText] = useState(false);
  const [showAmount, setShowAmount] = useState(false);
  const [showMultiplier, setShowMultiplier] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMax = multiplier >= 1000;
  const isBig = multiplier >= 500;
  const isMed = multiplier >= 250;
  const winAmount = giftPrice * multiplier;

  useEffect(() => {
    const emojis = isMax
      ? ["🪙", "💰", "🌟", "✨", "🎉", "🏆", "💎", "🔥"]
      : isBig
      ? ["🪙", "💜", "✨", "🌟", "🎉"]
      : ["🪙", "🍀", "✨", "🎉"];

    const count = isMax ? 80 : isBig ? 60 : isMed ? 40 : 25;
    const generated: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 1.5 + Math.random() * 2.5,
      size: isMax ? 20 + Math.random() * 28 : 14 + Math.random() * 20,
      rotation: Math.random() * 360,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles(generated);

    setTimeout(() => setShowText(true), 300);
    setTimeout(() => setShowMultiplier(true), 700);
    setTimeout(() => setShowAmount(true), 1100);

    const duration = isMax ? 7000 : isBig ? 5500 : isMed ? 4500 : 3500;
    timerRef.current = setTimeout(onDone, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const bgGradient = isMax
    ? "linear-gradient(135deg, #0a0800 0%, #1a1200 30%, #2d2000 60%, #1a1000 100%)"
    : isBig
    ? "linear-gradient(135deg, #0a0015 0%, #1a0030 40%, #0d0020 100%)"
    : isMed
    ? "linear-gradient(135deg, #001a00 0%, #002d00 40%, #001500 100%)"
    : "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)";

  const glowColor = isMax ? "#ffd700" : isBig ? "#cc00ff" : isMed ? "#00ff88" : "#ffd700";
  const glowColor2 = isMax ? "#ff8c00" : isBig ? "#7700cc" : isMed ? "#00cc66" : "#ffaa00";

  const multiplierLabel = isMax
    ? "🏆 الحد الأقصى! 🏆"
    : isBig
    ? "✨ ضعف هائل! ✨"
    : isMed
    ? "🍀 حظ رائع! 🍀"
    : "🍀 حظ جيد!";

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: bgGradient }}
      onClick={onDone}
    >
      {/* Falling particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 pointer-events-none select-none"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}px`,
            animation: `fallParticle ${p.duration}s ${p.delay}s linear infinite`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Extra sparkles for big wins */}
      {isBig && Array.from({ length: isMax ? 30 : 20 }, (_, i) => (
        <div
          key={`spark-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${8 + Math.random() * 18}px`,
            animation: `sparkle ${0.4 + Math.random() * 1.5}s ${Math.random() * 2}s ease-in-out infinite`,
          }}
        >
          {isMax ? "⭐" : "✨"}
        </div>
      ))}

      {/* Radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor}20 0%, transparent 70%)`,
          animation: "glowPulse 1.5s ease-in-out infinite",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-8">

        {/* Top label */}
        {showText && (
          <div
            className="text-center"
            style={{ animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}
          >
            <p
              className="font-black text-lg mb-1 tracking-wider"
              style={{ color: glowColor, textShadow: `0 0 20px ${glowColor}` }}
            >
              {multiplierLabel}
            </p>
          </div>
        )}

        {/* Luck icon */}
        <div
          className="text-8xl"
          style={{
            filter: `drop-shadow(0 0 30px ${glowColor})`,
            animation: isMax ? "bounceScale 0.6s ease-in-out infinite alternate" : "bounce 1s infinite",
          }}
        >
          {isMax ? "🏆" : isBig ? "💎" : "🍀"}
        </div>

        {/* Congratulations text */}
        {showText && (
          <div
            className="text-center"
            style={{ animation: "popIn 0.5s 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275) both" }}
          >
            <p
              className="font-black text-4xl mb-1"
              style={{
                color: glowColor,
                textShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
                WebkitTextStroke: "1px rgba(255,255,255,0.3)",
              }}
            >
              مبروووك! 🎉
            </p>
            <p className="text-white/80 text-base font-bold">ربحت من هدية {giftName}</p>
          </div>
        )}

        {/* Multiplier badge */}
        {showMultiplier && (
          <div
            className="rounded-3xl px-10 py-5 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${glowColor}25, ${glowColor2}15)`,
              border: `2.5px solid ${glowColor}`,
              boxShadow: `0 0 50px ${glowColor}70, inset 0 0 30px ${glowColor}10`,
              animation: "popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
            }}
          >
            {/* Shimmer inside badge */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(105deg, transparent 30%, ${glowColor}80 50%, transparent 70%)`,
                animation: "shimmer 1.5s infinite",
              }}
            />
            <p className="text-white/60 text-sm font-bold mb-1 relative z-10">الضعف</p>
            <p
              className="font-black relative z-10"
              style={{
                fontSize: isMax ? "4.5rem" : "3.5rem",
                color: glowColor,
                textShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
                lineHeight: 1,
              }}
            >
              ×{multiplier}
            </p>
          </div>
        )}

        {/* Win amount */}
        {showAmount && (
          <div
            className="flex items-center gap-2 rounded-2xl px-6 py-3"
            style={{
              background: "rgba(255,215,0,0.15)",
              border: "1px solid rgba(255,215,0,0.4)",
              animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
              boxShadow: "0 0 20px rgba(255,215,0,0.2)",
            }}
          >
            <span className="text-2xl">🪙</span>
            <span
              className="font-black text-2xl"
              style={{ color: "#ffd700", textShadow: "0 0 15px rgba(255,215,0,0.8)" }}
            >
              +{winAmount.toLocaleString()}
            </span>
            <span className="text-white/60 text-sm">عملة ذهبية</span>
          </div>
        )}

        {/* Tap to close */}
        <p className="text-white/30 text-xs mt-2 animate-pulse">اضغط للإغلاق</p>
      </div>

      <style>{`
        @keyframes fallParticle {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes popIn {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes bounceScale {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
