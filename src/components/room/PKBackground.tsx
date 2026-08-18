// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatNumber } from "../../lib/formatNumber";

interface PKBackgroundProps {
  roomId: Id<"rooms">;
}

/* ── Firework particle ── */
function FireworkBurst({ x, y }: { x: number; y: number }) {
  const colors = ["#fbbf24", "#f97316", "#ef4444", "#a855f7", "#3b82f6", "#22c55e", "#ec4899", "#06b6d4"];
  const count = 14;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360;
        const dist = 25 + Math.random() * 55;
        const tx = Math.cos((angle * Math.PI) / 180) * dist;
        const ty = Math.sin((angle * Math.PI) / 180) * dist;
        const color = colors[i % colors.length];
        const size = 2 + Math.random() * 3;
        return (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: x,
              top: y,
              width: size,
              height: size,
              background: color,
              boxShadow: `0 0 ${size * 2}px ${color}`,
              "--tx": `${tx}px`,
              "--ty": `${ty}px`,
              animation: `pk-firework ${0.5 + Math.random() * 0.5}s ease-out forwards`,
            } as any}
          />
        );
      })}
    </>
  );
}

/* ── Sound wave bar ── */
function SoundWaveBar({ color, delay, height }: { color: string; delay: number; height: number }) {
  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{
        width: 3,
        height,
        background: color,
        boxShadow: `0 0 4px ${color}80`,
        animation: `pk-wave ${0.3 + Math.random() * 0.5}s ease-in-out ${delay}s infinite alternate`,
        transformOrigin: "bottom",
      }}
    />
  );
}

export default function PKBackground({ roomId }: PKBackgroundProps) {
  const activePK = useQuery(api.pk.getActivePKBattle, { roomId });
  const [now, setNow] = useState(() => Date.now());
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const fwIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePK || activePK.status !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activePK?.status]);

  useEffect(() => {
    if (!activePK || activePK.status !== "active") return;
    const t = setInterval(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = rect.width * (0.05 + Math.random() * 0.9);
      const y = rect.height * (0.05 + Math.random() * 0.8);
      const id = ++fwIdRef.current;
      setFireworks((prev) => [...prev.slice(-8), { id, x, y }]);
      setTimeout(() => setFireworks((prev) => prev.filter((f) => f.id !== id)), 1200);
    }, 1200);
    return () => clearInterval(t);
  }, [activePK?.status]);

  if (!activePK || (activePK.status !== "active" && activePK.status !== "pending")) return null;

  const isPending = activePK.status === "pending";
  const isActive = activePK.status === "active";

  const timeLeft = activePK.endsAt ? Math.max(0, activePK.endsAt - now) : 0;
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const totalCoins = (activePK.room1Coins ?? 0) + (activePK.room2Coins ?? 0);
  const room1Pct = totalCoins > 0 ? ((activePK.room1Coins ?? 0) / totalCoins) * 100 : 50;
  const room2Pct = 100 - room1Pct;
  const room1Winning = (activePK.room1Coins ?? 0) >= (activePK.room2Coins ?? 0);

  const blueColor = "#3b82f6";
  const redColor = "#ef4444";

  const waveHeights1 = [8, 14, 20, 12, 18, 10, 16, 8];
  const waveHeights2 = [10, 16, 12, 20, 8, 18, 14, 10];

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0 mx-2 mb-1 rounded-2xl overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #000820 0%, #050010 30%, #100005 60%, #000820 100%)",
        backgroundSize: "200% 200%",
        animation: "pk-bg-shift 4s ease infinite",
        border: "1px solid rgba(100,100,255,0.25)",
        boxShadow: "0 0 20px rgba(59,130,246,0.1), 0 0 20px rgba(239,68,68,0.08)",
      }}
    >
      {/* Dual glow bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 15% 50%, rgba(59,130,246,0.15) 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, rgba(239,68,68,0.15) 0%, transparent 45%)",
        animation: "pk-bg-pulse 3s ease-in-out infinite",
      }} />

      {/* Fireworks */}
      {fireworks.map((fw) => <FireworkBurst key={fw.id} x={fw.x} y={fw.y} />)}

      <div className="relative z-10 px-3 py-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm animate-pk-sword">⚔️</span>
            <span className="text-[11px] font-black" style={{ color: "#fb923c", textShadow: "0 0 8px rgba(249,115,22,0.7)" }}>
              {isPending ? "⏳ تحدي PK معلّق" : "🔥 معركة PK نشطة"}
            </span>
          </div>
          {isActive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: timeLeft < 60000 ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.15)", border: `1px solid ${timeLeft < 60000 ? "rgba(239,68,68,0.5)" : "rgba(249,115,22,0.4)"}` }}>
              <span className="text-[11px] font-black tabular-nums" style={{ color: timeLeft < 60000 ? "#ef4444" : "#fb923c" }}>
                ⏱ {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          )}
          {isPending && (
            <div className="px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse"
              style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c" }}>
              في الانتظار...
            </div>
          )}
        </div>

        {/* Main battle */}
        <div className="flex items-center gap-1">
          {/* Room 1 - النمور (Blue) */}
          <div className="flex flex-col items-center gap-0.5 flex-1">
            {/* Sound waves */}
            <div className="flex items-end gap-0.5 h-5 mb-0.5">
              {waveHeights1.map((h, i) => <SoundWaveBar key={i} color={blueColor} delay={i * 0.08} height={h} />)}
            </div>
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 animate-pk-lion"
              style={{ borderColor: blueColor, boxShadow: `0 0 14px ${blueColor}80` }}>
              <div className="w-full h-full flex items-center justify-center text-xl" style={{ background: "rgba(59,130,246,0.2)" }}>🏠</div>
            </div>
            <p className="text-[10px] font-black truncate max-w-[75px] text-center" style={{ color: room1Winning && isActive ? blueColor : "rgba(255,255,255,0.9)" }}>
              {activePK.room1Name}
            </p>
            <p className="text-[8px] font-bold" style={{ color: blueColor }}>🐯 النمور</p>
            <div className="px-2 py-0.5 rounded-full text-[9px] font-black tabular-nums animate-pk-bar-blue"
              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.5)", color: blueColor }}>
              🎁 {formatNumber(activePK.room1Coins ?? 0)}
            </div>
          </div>

          {/* VS Center */}
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-1">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full animate-pk-bg-pulse"
                style={{ background: "radial-gradient(circle, rgba(249,115,22,0.35) 0%, transparent 70%)" }} />
              <span className="text-lg relative z-10 animate-pk-sword" style={{ filter: "drop-shadow(0 0 8px rgba(249,115,22,1))" }}>⚔️</span>
            </div>
            <span className="text-sm font-black animate-pk-vs" style={{ color: "#fbbf24", textShadow: "0 0 15px rgba(255,200,0,0.9)" }}>VS</span>
          </div>

          {/* Room 2 - الأسود (Red) */}
          <div className="flex flex-col items-center gap-0.5 flex-1">
            {/* Sound waves */}
            <div className="flex items-end gap-0.5 h-5 mb-0.5">
              {waveHeights2.map((h, i) => <SoundWaveBar key={i} color={redColor} delay={i * 0.08} height={h} />)}
            </div>
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 animate-pk-tiger"
              style={{ borderColor: redColor, boxShadow: `0 0 14px ${redColor}80` }}>
              <div className="w-full h-full flex items-center justify-center text-xl" style={{ background: "rgba(239,68,68,0.2)" }}>🏠</div>
            </div>
            <p className="text-[10px] font-black truncate max-w-[75px] text-center" style={{ color: !room1Winning && isActive ? redColor : "rgba(255,255,255,0.9)" }}>
              {activePK.room2Name}
            </p>
            <p className="text-[8px] font-bold" style={{ color: redColor }}>🦁 الأسود</p>
            <div className="px-2 py-0.5 rounded-full text-[9px] font-black tabular-nums animate-pk-bar-red"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)", color: redColor }}>
              🎁 {formatNumber(activePK.room2Coins ?? 0)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="mt-2">
            <div className="h-2.5 rounded-full overflow-hidden flex relative" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full transition-all duration-700 ease-out"
                style={{ width: `${room1Pct}%`, background: `linear-gradient(90deg, ${blueColor}, #60a5fa)`, borderRadius: "9999px 0 0 9999px" }} />
              <div className="h-full transition-all duration-700 ease-out"
                style={{ width: `${room2Pct}%`, background: "linear-gradient(90deg, #dc2626, #ef4444)", borderRadius: "0 9999px 9999px 0" }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: `${room1Pct}%`, transform: "translateX(-50%)" }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] font-black" style={{ color: blueColor }}>{room1Pct.toFixed(0)}%</span>
              <span className="text-[8px] text-gray-500">{formatNumber(totalCoins)} 🎁</span>
              <span className="text-[9px] font-black" style={{ color: redColor }}>{room2Pct.toFixed(0)}%</span>
            </div>
          </div>
        )}

        {/* Pending */}
        {isPending && (
          <div className="mt-1.5 flex items-center justify-center gap-1 py-1 rounded-xl"
            style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <span className="text-[9px] animate-pulse">⏳</span>
            <span className="text-[9px] font-bold text-orange-400/80">
              {activePK.room2Id === roomId
                ? `"${activePK.room1Name}" تتحداك!`
                : `في انتظار قبول "${activePK.room2Name}"`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PKFloatingIcon (أيقونة PK العائمة في الشريط) ──
export function PKFloatingIconSVG({ color = "#fb923c", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
    </svg>
  );
}
