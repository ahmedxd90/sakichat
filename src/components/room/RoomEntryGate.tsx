// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

interface RoomEntryGateProps {
  roomId: string;
  children: React.ReactNode;
}

export default function RoomEntryGate({ roomId, children }: RoomEntryGateProps) {
  const [room, setRoom] = useState<any>(null);
  const [phase, setPhase] = useState<"loading" | "gate" | "opening" | "done">("loading");

  useEffect(() => {
    supabase.from('rooms').select('*').eq('id', roomId).single().then(({ data }) => setRoom(data));
  }, [roomId]);

  useEffect(() => {
    if (!room) return;
    // الغرفة جاهزة — شغّل تسلسل الدخول مرة واحدة فقط
    setPhase("gate");
    const t1 = setTimeout(() => setPhase("opening"), 800);
    const t2 = setTimeout(() => setPhase("done"), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [room?.id]); // نعتمد فقط على id الغرفة لتجنب إعادة التشغيل

  // fallback: إذا تأخر تحميل الغرفة أكثر من 4 ثوانٍ، ادخل مباشرة
  useEffect(() => {
    const fallback = setTimeout(() => setPhase("done"), 4000);
    return () => clearTimeout(fallback);
  }, []);

  if (phase === "done") return <>{children}</>;

  const roomName = room?.name ?? "";
  const coverUrl = room?.cover_url ?? null;

  return (
    <div
      className="fixed inset-0 z-[9998] overflow-hidden"
      style={{ background: "#0a0a14" }}
      dir="rtl"
    >
      <style>{`
        @keyframes gateOpenLeft {
          0%   { transform: translateX(0) scaleX(1); opacity: 1; }
          100% { transform: translateX(-100%) scaleX(0.8); opacity: 0; }
        }
        @keyframes gateOpenRight {
          0%   { transform: translateX(0) scaleX(1); opacity: 1; }
          100% { transform: translateX(100%) scaleX(0.8); opacity: 0; }
        }
        @keyframes gateGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes gatePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes loadingDots {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
      `}</style>

      {/* ── LEFT GATE DOOR ── */}
      <div
        className="absolute inset-y-0 left-0 w-1/2"
        style={{
          background: "linear-gradient(135deg, #1a1200 0%, #2d1f00 40%, #1a1200 100%)",
          borderRight: "2px solid rgba(212,175,55,0.6)",
          animation: phase === "opening" ? "gateOpenLeft 0.7s cubic-bezier(0.4,0,0.2,1) forwards" : "none",
          transformOrigin: "left center",
          zIndex: 2,
        }}
      >
        {/* Door decoration */}
        <div className="absolute inset-0 flex items-center justify-end pr-4">
          <div className="flex flex-col gap-3">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="w-1 rounded-full"
                style={{
                  height: `${20 + Math.abs(2-i) * 8}px`,
                  background: "rgba(212,175,55,0.4)",
                  animation: `gateGlow ${1 + i * 0.2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }} />
            ))}
          </div>
        </div>
        {/* Gold border lines */}
        <div className="absolute top-0 bottom-0 right-0 w-px" style={{ background: "linear-gradient(180deg, transparent, #D4AF37, #D4AF37, transparent)" }} />
        <div className="absolute top-8 bottom-8 right-3 w-px" style={{ background: "rgba(212,175,55,0.2)" }} />
        {/* Handle */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-8 rounded-full"
          style={{ background: "linear-gradient(180deg,#fbbf24,#92400e)", boxShadow: "0 0 8px rgba(251,191,36,0.5)" }} />
      </div>

      {/* ── RIGHT GATE DOOR ── */}
      <div
        className="absolute inset-y-0 right-0 w-1/2"
        style={{
          background: "linear-gradient(225deg, #1a1200 0%, #2d1f00 40%, #1a1200 100%)",
          borderLeft: "2px solid rgba(212,175,55,0.6)",
          animation: phase === "opening" ? "gateOpenRight 0.7s cubic-bezier(0.4,0,0.2,1) forwards" : "none",
          transformOrigin: "right center",
          zIndex: 2,
        }}
      >
        {/* Door decoration */}
        <div className="absolute inset-0 flex items-center justify-start pl-4">
          <div className="flex flex-col gap-3">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="w-1 rounded-full"
                style={{
                  height: `${20 + Math.abs(2-i) * 8}px`,
                  background: "rgba(212,175,55,0.4)",
                  animation: `gateGlow ${1 + i * 0.2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }} />
            ))}
          </div>
        </div>
        {/* Gold border lines */}
        <div className="absolute top-0 bottom-0 left-0 w-px" style={{ background: "linear-gradient(180deg, transparent, #D4AF37, #D4AF37, transparent)" }} />
        <div className="absolute top-8 bottom-8 left-3 w-px" style={{ background: "rgba(212,175,55,0.2)" }} />
        {/* Handle */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-8 rounded-full"
          style={{ background: "linear-gradient(180deg,#fbbf24,#92400e)", boxShadow: "0 0 8px rgba(251,191,36,0.5)" }} />
      </div>

      {/* ── CENTER CONTENT (behind doors) ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-1">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.15) 0%, transparent 70%)" }} />

        {/* App icon */}
        <div className="relative mb-4" style={{ animation: "gatePulse 2s ease-in-out infinite" }}>
          <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#3B4D2E,#232F1A)",
              border: "2px solid rgba(212,175,55,0.6)",
              boxShadow: "0 0 30px rgba(212,175,55,0.3), 0 8px 32px rgba(0,0,0,0.5)",
            }}>
            <img src="/icon.svg" alt="" className="w-12 h-12" onError={(e) => { (e.target as any).style.display = 'none'; }} />
            <span className="text-3xl absolute" style={{ display: "none" }}>🎙️</span>
          </div>
          {/* Glow ring */}
          <div className="absolute -inset-2 rounded-[28px] pointer-events-none"
            style={{
              border: "1px solid rgba(212,175,55,0.3)",
              animation: "gateGlow 1.5s ease-in-out infinite",
            }} />
        </div>

        {/* Room cover */}
        {coverUrl && (
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3 border-2"
            style={{ borderColor: "rgba(212,175,55,0.4)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", animation: "fadeInUp 0.5s ease forwards" }}>
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Room name */}
        {roomName && (
          <h2 className="text-white font-black text-lg mb-1 text-center px-8"
            style={{ animation: "fadeInUp 0.5s ease 0.1s both", textShadow: "0 0 20px rgba(212,175,55,0.5)" }}>
            {roomName}
          </h2>
        )}

        {/* Loading text */}
        <div className="flex items-center gap-1 mt-2" style={{ animation: "fadeInUp 0.5s ease 0.2s both" }}>
          <span className="text-amber-400 text-sm font-bold">جارٍ الدخول</span>
          {[0,1,2].map((i) => (
            <span key={i} className="text-amber-400 font-black text-lg"
              style={{ animation: `loadingDots 1.2s ease-in-out ${i * 0.2}s infinite` }}>.</span>
          ))}
        </div>

        {/* Gold shimmer bar */}
        <div className="mt-4 w-32 h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(212,175,55,0.15)" }}>
          <div className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s linear infinite",
            }} />
        </div>
      </div>

      {/* Top & bottom gold borders */}
      <div className="absolute top-0 left-0 right-0 h-1 z-10"
        style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-1 z-10"
        style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
    </div>
  );
}
