import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect, useState } from "react";

interface Props {
  userId: Id<"users">;
  myAvatarUrl?: string | null;
  myName?: string;
}

function FloatingHearts() {
  const hearts = ["❤️", "💕", "💗", "💓", "💞", "🩷", "💖"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-sm select-none"
          style={{
            left: `${8 + i * 9}%`,
            bottom: "10%",
            animation: `cp-float ${1.5 + (i % 4) * 0.6}s ease-out infinite`,
            animationDelay: `${i * 0.3}s`,
            fontSize: `${10 + (i % 3) * 4}px`,
          }}
        >
          {hearts[i % hearts.length]}
        </span>
      ))}
    </div>
  );
}

function SoundWaves({ color = "#ec4899" }: { color?: string }) {
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 24 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            backgroundColor: color,
            animation: `cp-sound-wave ${0.6 + (i % 3) * 0.2}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`,
            height: 4,
          }}
        />
      ))}
    </div>
  );
}

function daysLeft(expiresAt: number | null): string {
  if (!expiresAt) return "دائم ♾️";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "منتهي";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} يوم`;
  return `${hours} ساعة`;
}

function totalDays(startedAt: number, expiresAt: number | null): string {
  if (!expiresAt) return "دائم";
  const diff = expiresAt - startedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days} يوم`;
}

export default function CpBanner({ userId, myAvatarUrl, myName }: Props) {
  const cp = useQuery(api.store.getActiveCpPartner, { userId });
  const [showWave, setShowWave] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setShowWave((v) => !v), 2000);
    return () => clearInterval(t);
  }, []);

  if (!cp) return null;

  const remaining = daysLeft(cp.expiresAt);
  const total = totalDays(cp.startedAt ?? 0, cp.expiresAt ?? 0);
  const isExpired = cp.expiresAt && cp.expiresAt < Date.now();
  if (isExpired) return null;

  return (
    <div
      className="relative mx-4 mt-4 rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a0020 0%, #2d0035 30%, #1a0020 60%, #2d0010 100%)",
        border: "1px solid rgba(236,72,153,0.4)",
        boxShadow: "0 0 30px rgba(236,72,153,0.2), inset 0 1px 0 rgba(236,72,153,0.15)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full opacity-20 animate-pulse"
          style={{ background: "radial-gradient(circle, #ec4899, transparent)", animationDuration: "2s" }} />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 rounded-full opacity-15 animate-pulse"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)", animationDuration: "3s", animationDelay: "1s" }} />
      </div>

      <FloatingHearts />

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="cp-heartbeat text-lg">💍</span>
          <span className="cp-shimmer-text text-sm font-black">زوجان سحريان</span>
          <span className="cp-heartbeat text-lg" style={{ animationDelay: "0.7s" }}>💍</span>
        </div>

        <div className="flex items-center justify-center gap-0 mb-3">
          <div className="relative" style={{ zIndex: 2 }}>
            <div
              className="cp-pulse-ring rounded-full p-[2px]"
              style={{ background: "linear-gradient(135deg, #ec4899, #a855f7, #ec4899)" }}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-600 to-purple-600">
                {myAvatarUrl
                  ? <img src={myAvatarUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white font-black text-xl">{myName?.[0] ?? "أ"}</span>
                    </div>
                }
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-pink-400 opacity-0"
              style={{ animation: "cp-wave 2s ease-out infinite" }} />
          </div>

          <div className="relative z-10 flex flex-col items-center mx-1" style={{ marginTop: -8 }}>
            <span className="cp-heartbeat text-3xl drop-shadow-lg" style={{ filter: "drop-shadow(0 0 8px rgba(236,72,153,0.8))" }}>
              💗
            </span>
            <div className="mt-1">
              <SoundWaves color={showWave ? "#ec4899" : "#a855f7"} />
            </div>
          </div>

          <div className="relative" style={{ zIndex: 2 }}>
            <div
              className="cp-pulse-ring rounded-full p-[2px]"
              style={{ background: "linear-gradient(135deg, #a855f7, #ec4899, #a855f7)", animationDelay: "1s" }}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600">
                {cp.partnerAvatarUrl
                  ? <img src={cp.partnerAvatarUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white font-black text-xl">{cp.partnerName?.[0] ?? "؟"}</span>
                    </div>
                }
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-0"
              style={{ animation: "cp-wave 2s ease-out infinite", animationDelay: "1s" }} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-pink-300 text-xs font-bold truncate max-w-[80px] text-center">{myName ?? "أنت"}</span>
          <span className="text-pink-500 text-xs">💕</span>
          <span className="text-purple-300 text-xs font-bold truncate max-w-[80px] text-center">{cp.partnerName}</span>
        </div>

        <div className="flex items-center justify-between bg-white/5 rounded-2xl px-3 py-2 border border-pink-500/20">
          <div className="flex items-center gap-1.5">
            <span className="text-base">💍</span>
            <span className="text-pink-300 text-xs font-bold">{cp.ringName}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400">⏳</span>
            <span className="text-pink-400 text-xs font-black">{remaining}</span>
            {cp.expiresAt && (
              <span className="text-gray-500 text-[10px]">/ {total}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
