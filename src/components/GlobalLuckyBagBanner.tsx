// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface GlobalLuckyBagBannerProps {
  onGoToRoom?: (roomId: Id<"rooms">) => void;
}

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function GlobalLuckyBagBanner({ onGoToRoom }: GlobalLuckyBagBannerProps) {
  const latestEvent = useQuery(api.luckyBag.getLatestLuckyBagEvent);
  const [banner, setBanner] = useState<any>(null);
  const [phase, setPhase] = useState<"enter" | "fly" | "exit">("enter");
  const [posX, setPosX] = useState(110); // % from left
  const lastIdRef = useRef<string | null>(null);
  const flyRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAll = () => {
    if (flyRef.current) clearInterval(flyRef.current);
    if (doneRef.current) clearTimeout(doneRef.current);
    if (exitRef.current) clearTimeout(exitRef.current);
  };

  useEffect(() => {
    if (!latestEvent) return;
    if (latestEvent.bagType !== "super") return;
    if (lastIdRef.current === null) { lastIdRef.current = latestEvent._id; return; }
    if (latestEvent._id === lastIdRef.current) return;
    lastIdRef.current = latestEvent._id;

    clearAll();
    setBanner(latestEvent);
    setPhase("enter");
    setPosX(110);

    // Start flying after mount
    setTimeout(() => {
      setPhase("fly");
      let x = 110;
      flyRef.current = setInterval(() => {
        x -= 0.35;
        setPosX(x);
        if (x < -60) {
          // Reset to right side for loop
          x = 110;
          setPosX(110);
        }
      }, 16);
    }, 50);

    // Exit after 22s
    exitRef.current = setTimeout(() => {
      setPhase("exit");
      clearAll();
    }, 22000);

    doneRef.current = setTimeout(() => {
      setBanner(null);
      setPhase("enter");
    }, 23000);

    return clearAll;
  }, [latestEvent?._id]);

  if (!banner) return null;

  return (
    <>
      <div
        className="fixed z-[350] pointer-events-none"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 6px)",
          left: 0,
          right: 0,
          height: 72,
          overflow: "hidden",
        }}
      >
        {/* Flying pill */}
        <div
          className="absolute pointer-events-auto cursor-pointer active:scale-95"
          style={{
            top: 6,
            left: `${posX}%`,
            transform: "translateX(-50%)",
            opacity: phase === "exit" ? 0 : 1,
            transition: phase === "exit" ? "opacity 0.8s ease" : "none",
            whiteSpace: "nowrap",
          }}
          onClick={() => {
            if (onGoToRoom && banner.roomId) onGoToRoom(banner.roomId);
          }}
        >
          <div style={{
            background: "linear-gradient(90deg,#1a1200,#2d2000,#3d2800,#2d2000,#1a1200)",
            border: "1.5px solid rgba(251,191,36,0.65)",
            borderRadius: 40,
            boxShadow: "0 3px 24px rgba(251,191,36,0.45), 0 0 50px rgba(251,191,36,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px 5px 6px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Shimmer */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 40,
              background: "linear-gradient(105deg,transparent 35%,rgba(255,215,0,0.12) 50%,transparent 65%)",
              animation: "glb-shimmer 2s linear infinite",
              pointerEvents: "none",
            }} />

            {/* Top glow */}
            <div style={{
              position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
              background: "linear-gradient(90deg,transparent,#fbbf24,transparent)",
            }} />

            {/* Bag icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,rgba(251,191,36,0.25),rgba(245,158,11,0.15))",
              border: "1.5px solid rgba(251,191,36,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "glb-bag 1.5s ease-in-out infinite",
              position: "relative", zIndex: 1,
            }}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="12" width="24" height="17" rx="4" fill="#fbbf24" opacity="0.95"/>
                <path d="M11 12 Q11 6 16 6 Q21 6 21 12" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <circle cx="16" cy="20" r="3" fill="#92400e" opacity="0.7"/>
              </svg>
              {/* Super badge */}
              <div style={{
                position: "absolute", top: -5, right: -5,
                width: 16, height: 16, borderRadius: "50%",
                background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 6px rgba(251,191,36,0.7)",
                fontSize: 8, fontWeight: 900, color: "#000",
              }}>S</div>
            </div>

            {/* Avatar */}
            {banner.senderAvatarUrl && (
              <div style={{
                width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                border: "1.5px solid rgba(251,191,36,0.6)",
                position: "relative", zIndex: 1,
              }}>
                <img src={banner.senderAvatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#fde68a", fontWeight: 900, fontSize: 12 }}>{banner.senderName}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>أرسل حقيبة حظ</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                <span style={{ color: "#fbbf24", fontWeight: 900, fontSize: 11 }}>{formatCoins(banner.totalCoins)}</span>
                <span style={{ fontSize: 10 }}>🪙</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>لـ</span>
                <span style={{ color: "#fde68a", fontWeight: 800, fontSize: 11 }}>{banner.maxRecipients}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>شخص</span>
              </div>
            </div>

            {/* CTA */}
            <div style={{
              flexShrink: 0, padding: "4px 10px", borderRadius: 20,
              background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
              color: "#000", fontSize: 10, fontWeight: 900,
              boxShadow: "0 2px 10px rgba(251,191,36,0.5)",
              zIndex: 1,
            }}>
              افتح 🎁
            </div>

            {/* Coin particles */}
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                fontSize: 10,
                left: `${15 + i * 20}%`,
                animation: `glb-coin${i % 2} ${1.2 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                pointerEvents: "none",
                zIndex: 2,
              }}>🪙</div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes glb-shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes glb-bag {
          0%,100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-8deg); }
          75% { transform: scale(1.1) rotate(8deg); }
        }
        @keyframes glb-coin0 {
          0% { transform: translateY(30px); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(-8px); opacity: 0; }
        }
        @keyframes glb-coin1 {
          0% { transform: translateY(25px) rotate(0deg); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(-12px) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </>
  );
}
