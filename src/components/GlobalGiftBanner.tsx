import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Global gift banner — shown for high-value gifts across ALL pages
export default function GlobalGiftBanner() {
  const latestGlobal = useQuery(api.rooms.getLatestGlobalGiftEvent) as any;
  const [banner, setBanner] = useState<any>(null);
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const lastIdRef = useRef<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!latestGlobal) return;
    if (lastIdRef.current === null) { lastIdRef.current = latestGlobal._id; return; }
    if (latestGlobal._id === lastIdRef.current) return;
    lastIdRef.current = latestGlobal._id;

    setBanner(latestGlobal);
    setPhase("enter");

    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (doneTimer.current) clearTimeout(doneTimer.current);

    setTimeout(() => setPhase("show"), 50);
    leaveTimer.current = setTimeout(() => setPhase("exit"), 4200);
    doneTimer.current = setTimeout(() => { setBanner(null); setPhase("enter"); }, 5000);
  }, [latestGlobal?._id]);

  if (!banner) return null;

  const accentColor = "#cc00ff";

  // Fly from right to left
  const translateX = phase === "enter" ? "translateX(110vw)"
    : phase === "show" ? "translateX(0)"
    : "translateX(-110vw)";

  const transition = phase === "enter" ? "none"
    : phase === "show" ? "transform 0.55s cubic-bezier(0.22,1,0.36,1)"
    : "transform 0.6s cubic-bezier(0.55,0,1,0.45)";

  return (
    <div
      className="fixed z-[300] pointer-events-none"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 8px)",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className="pointer-events-auto"
        style={{
          transform: translateX,
          transition,
          willChange: "transform",
        }}
      >
        <div style={{
          background: "linear-gradient(90deg,#1a0030,#2d0050,#1a0030)",
          border: `1.5px solid ${accentColor}55`,
          borderRadius: 40,
          boxShadow: `0 3px 24px ${accentColor}45, 0 0 50px ${accentColor}20`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 14px 5px 6px",
          position: "relative",
          overflow: "hidden",
          maxWidth: "calc(100vw - 32px)",
        }}>
          {/* Shimmer */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 40,
            background: `linear-gradient(105deg,transparent 35%,${accentColor}20 50%,transparent 65%)`,
            animation: "ggb-shimmer 2s linear infinite",
            pointerEvents: "none",
          }} />

          {/* Top glow */}
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
            background: `linear-gradient(90deg,transparent,${accentColor}80,transparent)`,
          }} />

          {/* Global badge */}
          <div style={{
            width: 34, height: 34, borderRadius: 12, flexShrink: 0,
            background: `${accentColor}20`, border: `1.5px solid ${accentColor}50`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 1,
            animation: "ggb-globe 2s ease-in-out infinite",
          }}>
            <span style={{ fontSize: 14 }}>🌍</span>
          </div>

          {/* Sender */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
            border: `2px solid ${accentColor}70`,
            boxShadow: `0 0 8px ${accentColor}50`,
            position: "relative", zIndex: 1,
          }}>
            {banner.senderAvatarUrl
              ? <img src={banner.senderAvatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 900, fontSize: 12 }}>{banner.senderName?.[0]}</div>
            }
          </div>

          {/* Gift image */}
          <div style={{
            width: 32, height: 32, borderRadius: 10, overflow: "hidden", flexShrink: 0,
            background: "rgba(0,0,0,0.4)", border: `1px solid ${accentColor}35`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 1,
          }}>
            {banner.giftImageUrl
              ? <img src={banner.giftImageUrl} alt={banner.giftName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 16 }}>🎁</span>
            }
          </div>

          {/* Text */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 800, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{banner.senderName}</span>
              <span style={{ color: `${accentColor}`, fontSize: 10, fontWeight: 900 }}>{banner.giftName}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>لـ</span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: 700, maxWidth: 55, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{banner.receiverName}</span>
              <span style={{
                background: `${accentColor}30`, color: accentColor,
                fontSize: 9, fontWeight: 900, padding: "1px 5px", borderRadius: 20,
                border: `1px solid ${accentColor}40`,
              }}>×{banner.quantity ?? 1}</span>
            </div>
          </div>

          {/* Receiver */}
          <div style={{
            width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
            border: `1.5px solid ${accentColor}50`,
            position: "relative", zIndex: 1,
          }}>
            {banner.receiverAvatarUrl
              ? <img src={banner.receiverAvatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#ec4899,#7c3aed)", color: "#fff", fontWeight: 900, fontSize: 11 }}>{banner.receiverName?.[0]}</div>
            }
          </div>

          {/* Price */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
            <span style={{ fontSize: 9 }}>🪙</span>
            <span style={{ color: accentColor, fontSize: 9, fontWeight: 900 }}>
              {banner.price >= 1000 ? `${(banner.price/1000).toFixed(0)}k` : banner.price}
            </span>
          </div>

          {/* Sparkles */}
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: i % 2 === 0 ? 3 : 2,
              height: i % 2 === 0 ? 3 : 2,
              borderRadius: "50%",
              background: [accentColor, "#fff", accentColor, "#fbbf24"][i],
              boxShadow: `0 0 6px ${accentColor}`,
              top: `${15 + i * 20}%`,
              right: `${4 + i * 7}%`,
              animation: `ggb-spark ${0.6 + i * 0.2}s ${i * 0.1}s ease-in-out infinite alternate`,
              pointerEvents: "none",
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ggb-shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes ggb-globe {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.1) rotate(10deg); }
        }
        @keyframes ggb-spark {
          from { opacity:0.2; transform:scale(0.5); }
          to { opacity:1; transform:scale(1.8); }
        }
      `}</style>
    </div>
  );
}
