// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

const LEVEL_COLORS = [
  "#f59e0b", "#ef4444", "#a855f7", "#3b82f6", "#10b981",
  "#f97316", "#ec4899", "#06b6d4", "#84cc16", "#ff006e",
];

export default function GlobalBombBanner() {
  const [latestEvent, setLatestEvent] = useState<any>(null);
  const [banner, setBanner] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const lastIdRef = useRef<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('global_bombs')
      .on('postgres_changes', { event: 'INSERT', table: 'bomb_explosions' }, (payload) => {
        setLatestEvent(payload.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!latestEvent) return;
    if (lastIdRef.current === null) { lastIdRef.current = latestEvent.id; return; }
    if (latestEvent.id === lastIdRef.current) return;
    lastIdRef.current = latestEvent.id;

    setBanner(latestEvent);
    setVisible(false);
    setLeaving(false);

    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (doneTimer.current) clearTimeout(doneTimer.current);

    setTimeout(() => setVisible(true), 50);
    leaveTimer.current = setTimeout(() => setLeaving(true), 15000);
    doneTimer.current = setTimeout(() => {
      setBanner(null);
      setVisible(false);
      setLeaving(false);
    }, 15800);
  }, [latestEvent?._id]);

  if (!banner) return null;

  const lvl = banner.level ?? 1;
  const color = LEVEL_COLORS[Math.min(lvl - 1, LEVEL_COLORS.length - 1)];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[350] flex justify-start pointer-events-none"
      style={{ paddingTop: "env(safe-area-inset-top, 8px)" }}
    >
      <div
        className="pointer-events-auto mt-2 rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #0a0015 0%, #1a0030 50%, #0a0015 100%)`,
          border: `1.5px solid ${color}60`,
          boxShadow: `0 4px 30px ${color}60, 0 0 60px ${color}30`,
          transform: visible && !leaving
            ? "translateX(0) scale(1)"
            : leaving
              ? "translateX(-110%) scale(0.95)"
              : "translateX(-110%) scale(0.95)",
          opacity: visible && !leaving ? 1 : 0,
          transition: leaving
            ? "transform 0.7s cubic-bezier(0.4,0,1,1), opacity 0.5s ease"
            : "transform 0.6s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.3s ease",
          maxWidth: "calc(100vw - 16px)",
          marginLeft: "8px",
        }}
      >
        {/* Shimmer */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(105deg, transparent 40%, ${color}80 50%, transparent 60%)`,
              animation: "bombShimmer 2s infinite",
            }}
          />
        </div>

        {/* Sound waves decoration */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-40">
          {[3, 5, 8, 5, 3].map((h, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 2,
                height: h * 2,
                background: color,
                animation: `bombWave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>

        <div className="relative flex items-center gap-2.5 px-3 py-2.5 pr-10">
          {/* Bomb icon with level */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center relative"
              style={{
                background: `${color}25`,
                border: `1px solid ${color}50`,
                boxShadow: `0 0 15px ${color}40`,
              }}
            >
              <span className="text-xl">💣</span>
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                style={{ background: color }}
              >
                {lvl}
              </div>
            </div>
            <span className="text-[8px] font-black mt-0.5" style={{ color }}>انفجر!</span>
          </div>

          {/* Top contributor avatar */}
          {banner.topContributorAvatarUrl ? (
            <div
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2"
              style={{ borderColor: color, boxShadow: `0 0 10px ${color}60` }}
            >
              <img src={banner.topContributorAvatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 font-black text-white text-sm"
              style={{
                borderColor: color,
                background: `linear-gradient(135deg, ${color}60, ${color}30)`,
                boxShadow: `0 0 10px ${color}60`,
              }}
            >
              {banner.topContributorName?.[0] ?? "?"}
            </div>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-gray-400">💥 انفجار المستوى</span>
              <span className="text-[9px] font-black" style={{ color }}>{lvl}</span>
            </div>
            <p className="text-white text-xs font-black truncate">
              {banner.topContributorName ?? "مجهول"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px]">🥇</span>
              <span className="text-[9px] font-bold" style={{ color }}>
                أكثر مساهم
              </span>
              {banner.topContributorCoins && (
                <span className="text-[9px] text-gray-400">
                  {formatCoins(banner.topContributorCoins)} 💰
                </span>
              )}
            </div>
          </div>

          {/* Explosion emoji */}
          <div className="flex-shrink-0 text-2xl" style={{ animation: "bombPulse 0.5s ease-in-out infinite alternate" }}>
            💥
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bombShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes bombWave { 0% { transform: scaleY(0.5); } 100% { transform: scaleY(1.5); } }
        @keyframes bombPulse { 0% { transform: scale(0.9); } 100% { transform: scale(1.1); } }
      `}</style>
    </div>
  );
}
