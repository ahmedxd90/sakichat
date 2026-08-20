import { useEffect, useRef, useState } from "react";

interface GiftFlyingBannerProps {
  senderName: string;
  receiverName: string;
  senderAvatar?: string;
  receiverAvatar?: string;
  giftName: string;
  giftImageUrl?: string;
  giftEmoji?: string;
  quantity?: number;
  luckMultiplier?: number;
  luckWinAmount?: number;
  price: number;
  isGlobal?: boolean;
  roomName?: string;
  onTap?: () => void;
  onDone: () => void;
}

export default function GiftFlyingBanner({
  senderName, receiverName, senderAvatar, receiverAvatar,
  giftName, giftImageUrl, giftEmoji, quantity = 1, luckMultiplier, luckWinAmount,
  price, isGlobal, roomName, onTap, onDone,
}: GiftFlyingBannerProps) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const [displayQty, setDisplayQty] = useState(quantity);

  useEffect(() => {
    setDisplayQty((prev) => Math.max(prev, quantity));
  }, [quantity]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"), 60);
    const t2 = setTimeout(() => setPhase("exit"), 3600);
    const t3 = setTimeout(onDone, 4300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const isMaxLuck   = luckMultiplier !== undefined && luckMultiplier >= 1000;
  const isUltraLuck = luckMultiplier !== undefined && luckMultiplier >= 500 && luckMultiplier < 1000;
  const isRareLuck  = luckMultiplier !== undefined && luckMultiplier >= 250 && luckMultiplier < 500;
  const isMedLuck50 = luckMultiplier !== undefined && luckMultiplier >= 50  && luckMultiplier < 250;
  const isMedLuck20 = luckMultiplier !== undefined && luckMultiplier >= 20  && luckMultiplier < 50;
  const isMedLuck10 = luckMultiplier !== undefined && luckMultiplier >= 10  && luckMultiplier < 20;
  const isSmallLuck = luckMultiplier !== undefined && luckMultiplier < 10;
  const isLuck = luckMultiplier !== undefined;

  // Accent color based on type
  const accent = isGlobal ? "#cc00ff"
    : isMaxLuck   ? "#ffd700"
    : isUltraLuck ? "#cc00ff"
    : isRareLuck  ? "#ff4444"
    : isMedLuck50 ? "#ff8800"
    : isMedLuck20 ? "#4488ff"
    : isMedLuck10 ? "#00ccff"
    : isSmallLuck ? "#00ff88"
    : "#fbbf24";

  const accent2 = isGlobal ? "#7700cc"
    : isMaxLuck   ? "#ff8c00"
    : isUltraLuck ? "#7700cc"
    : isRareLuck  ? "#aa0000"
    : isMedLuck50 ? "#cc5500"
    : isMedLuck20 ? "#2255cc"
    : isMedLuck10 ? "#0088aa"
    : isSmallLuck ? "#00aa55"
    : "#f59e0b";

  // Flying from right → left
  const tx = phase === "enter" ? "translateX(105vw)"
    : phase === "show" ? "translateX(0)"
    : "translateX(-105vw)";

  const tr = phase === "enter" ? "none"
    : phase === "show" ? "transform 0.5s cubic-bezier(0.22,1,0.36,1)"
    : "transform 0.55s cubic-bezier(0.55,0,1,0.45)";

  // Only show non-SVGA gift image (no SVGA rendering)
  const showGiftImg = giftImageUrl && !giftImageUrl.toLowerCase().includes(".svga");

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 150,
        top: "calc(env(safe-area-inset-top, 0px) + 10px)",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: tx,
          transition: tr,
          willChange: "transform",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
        onClick={onTap}
      >
        {/* ── Outer glow wrapper ── */}
        <div style={{
          position: "relative",
          borderRadius: 18,
          padding: 1.5,
          background: `linear-gradient(135deg, ${accent}, ${accent2}, ${accent})`,
          backgroundSize: "200% 200%",
          animation: "gfb-border 3s linear infinite",
          boxShadow: `0 4px 28px ${accent}55, 0 0 50px ${accent}25`,
        }}>
          {/* ── Inner card ── */}
          <div style={{
            background: `linear-gradient(135deg, #0a0a18 0%, #12102a 50%, #0a0a18 100%)`,
            borderRadius: 17,
            display: "flex",
            alignItems: "center",
            gap: 0,
            overflow: "hidden",
            position: "relative",
            minWidth: 220,
            maxWidth: "calc(100vw - 40px)",
          }}>

            {/* Left colored stripe */}
            <div style={{
              width: 4,
              alignSelf: "stretch",
              background: `linear-gradient(180deg, ${accent}, ${accent2})`,
              flexShrink: 0,
            }} />

            {/* Shimmer overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(105deg, transparent 30%, ${accent}18 50%, transparent 70%)`,
              animation: "gfb-shimmer 2.2s linear infinite",
              pointerEvents: "none",
              zIndex: 0,
            }} />

            {/* Stars top-right */}
            <div style={{
              position: "absolute", top: 3, right: 8,
              display: "flex", gap: 2, zIndex: 1,
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 3, height: 3, borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 5px ${accent}`,
                  animation: `gfb-star ${0.6+i*0.2}s ${i*0.15}s ease-in-out infinite alternate`,
                }} />
              ))}
            </div>

            {/* Content row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 12px 7px 10px",
              position: "relative", zIndex: 1,
            }}>

              {/* Sender avatar with ring */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  position: "absolute", inset: -2, borderRadius: "50%",
                  background: `conic-gradient(${accent}, ${accent2}, ${accent})`,
                  animation: "gfb-ring 2s linear infinite",
                }} />
                <div style={{
                  position: "absolute", inset: -0.5, borderRadius: "50%",
                  background: "#0a0a18",
                }} />
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", overflow: "hidden",
                  position: "relative", zIndex: 2,
                  background: "linear-gradient(135deg,#7c3aed,#ec4899)",
                }}>
                  {senderAvatar
                    ? <img src={senderAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 14 }}>{senderName[0]}</div>
                  }
                </div>
              </div>

              {/* Gift image box */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0,
                background: `linear-gradient(135deg, ${accent}22, ${accent2}15)`,
                border: `1px solid ${accent}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 10px ${accent}30`,
                animation: "gfb-gift 1.8s ease-in-out infinite",
              }}>
                {showGiftImg
                  ? <img src={giftImageUrl} alt={giftName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 18 }}>{giftEmoji ?? "🎁"}</span>
                }
              </div>

              {/* Text block */}
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                {/* Sender name */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{
                    color: "#fff", fontSize: 12, fontWeight: 900,
                    maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    textShadow: "0 0 8px rgba(255,255,255,0.3)",
                  }}>{senderName}</span>
                  <span style={{ color: `${accent}cc`, fontSize: 9 }}>أرسل</span>
                </div>

                {/* Gift name + qty */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <span style={{
                    color: accent, fontSize: 11, fontWeight: 900,
                    maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    textShadow: `0 0 8px ${accent}80`,
                  }}>{giftName}</span>
                  {displayQty > 1 && (
                    <span style={{
                      background: `${accent}25`, color: accent,
                      fontSize: 9, fontWeight: 900, padding: "1px 6px", borderRadius: 20,
                      border: `1px solid ${accent}45`,
                    }}>×{displayQty}</span>
                  )}
                </div>

                {/* Luck badge */}
                {isLuck && luckMultiplier && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                    <span style={{
                      background: isMaxLuck ? "linear-gradient(135deg,#ffd700,#ff8c00)"
                        : isUltraLuck ? "linear-gradient(135deg,#cc00ff,#7700cc)"
                        : isRareLuck  ? "linear-gradient(135deg,#ff4444,#aa0000)"
                        : isMedLuck50 ? "linear-gradient(135deg,#ff8800,#cc5500)"
                        : isMedLuck20 ? "linear-gradient(135deg,#4488ff,#2255cc)"
                        : isMedLuck10 ? "linear-gradient(135deg,#00ccff,#0088aa)"
                        : "rgba(0,255,136,0.25)",
                      color: isMaxLuck ? "#000" : "#fff",
                      fontSize: 9, fontWeight: 900, padding: "1px 6px", borderRadius: 20,
                      animation: isMaxLuck ? "gfb-pulse 0.7s infinite" : "none",
                      boxShadow: `0 0 8px ${accent}60`,
                    }}>🍀 ×{luckMultiplier}</span>
                    {luckWinAmount && luckWinAmount > 0 && (
                      <span style={{ color: accent, fontSize: 9, fontWeight: 900 }}>
                        +{luckWinAmount >= 1000 ? `${(luckWinAmount/1000).toFixed(0)}k` : luckWinAmount}🪙
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Receiver avatar only — recipient name is intentionally hidden. */}
              <div style={{
                width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                border: `1.5px solid ${accent}70`, background: "#0a0a18",
              }}>
                {receiverAvatar
                  ? <img src={receiverAvatar} alt="صورة المستلم" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontWeight: 900, fontSize: 11 }}>●</div>
                }
              </div>

              {/* Price pill */}
              <div style={{
                flexShrink: 0,
                background: `linear-gradient(135deg, ${accent}30, ${accent2}20)`,
                border: `1px solid ${accent}45`,
                borderRadius: 12,
                padding: "3px 8px",
                display: "flex", flexDirection: "column", alignItems: "center",
                boxShadow: `0 0 10px ${accent}30`,
              }}>
                <span style={{ fontSize: 10 }}>🪙</span>
                <span style={{ color: accent, fontSize: 9, fontWeight: 900, lineHeight: 1 }}>
                  {price >= 1000 ? `${(price/1000).toFixed(0)}k` : price}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gfb-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gfb-shimmer {
          0% { transform: translateX(-130%); }
          100% { transform: translateX(230%); }
        }
        @keyframes gfb-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gfb-gift {
          0%,100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.08) rotate(-5deg); }
          75% { transform: scale(1.08) rotate(5deg); }
        }
        @keyframes gfb-star {
          from { opacity: 0.3; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1.6); }
        }
        @keyframes gfb-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.85; transform:scale(1.08); }
        }
      `}</style>
    </div>
  );
}
