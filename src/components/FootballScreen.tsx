import { useState } from "react";

interface FootballScreenProps {
  streamUrl?: string | null;
  isOwner?: boolean;
  onOpenSheet?: () => void;
}

export default function FootballScreen({ streamUrl, isOwner, onOpenSheet }: FootballScreenProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className="flex-shrink-0 mx-1 mt-1 mb-0.5 relative"
      style={{ zIndex: 10 }}
    >
      {/* Outer glow frame */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#0a1a0a,#051005)",
          border: "3px solid rgba(34,197,94,0.6)",
          boxShadow: [
            "0 0 0 1px rgba(34,197,94,0.2)",
            "0 0 20px rgba(34,197,94,0.4)",
            "0 0 50px rgba(34,197,94,0.2)",
            "0 0 80px rgba(34,197,94,0.1)",
            "inset 0 0 30px rgba(0,0,0,0.6)",
          ].join(", "),
          aspectRatio: "16/9",
          maxHeight: "220px",
        }}
      >
        {/* Animated corner accents */}
        {[
          { top: 0, left: 0, borderTop: "3px solid #22c55e", borderLeft: "3px solid #22c55e" },
          { top: 0, right: 0, borderTop: "3px solid #22c55e", borderRight: "3px solid #22c55e" },
          { bottom: 0, left: 0, borderBottom: "3px solid #22c55e", borderLeft: "3px solid #22c55e" },
          { bottom: 0, right: 0, borderBottom: "3px solid #22c55e", borderRight: "3px solid #22c55e" },
        ].map((style, i) => (
          <div
            key={i}
            className="absolute z-30 pointer-events-none"
            style={{ ...style, width: 16, height: 16 }}
          />
        ))}

        {/* Screen bezel inner glow */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-20"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.7)",
          }}
        />

        {streamUrl ? (
          <iframe
            src={streamUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            style={{ border: "none", background: "#000" }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#071207,#030803)" }}>
            {/* Animated football field mini */}
            <div className="relative" style={{ width: 90, height: 56 }}>
              <div className="absolute inset-0 rounded-lg" style={{ background: "#0f4a0f", border: "1.5px solid rgba(255,255,255,0.35)" }} />
              {/* Stripes */}
              {[0,1,2,3,4].map(i => (
                <div key={i} className="absolute top-0 bottom-0" style={{
                  left: `${i * 20}%`, width: "10%",
                  background: "rgba(0,0,0,0.08)",
                }} />
              ))}
              {/* Center line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: "rgba(255,255,255,0.4)" }} />
              {/* Center circle */}
              <div className="absolute" style={{
                top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: 22, height: 22,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.4)",
              }} />
              {/* Ball */}
              <div className="absolute" style={{
                top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: 8, height: 8,
                borderRadius: "50%",
                background: "white",
                boxShadow: "0 0 4px rgba(255,255,255,0.8)",
              }} />
            </div>
            <p className="text-green-400 text-xs font-bold">لا يوجد بث مباشر</p>
            <p className="text-gray-500 text-[10px]">مشاهدة المباريات مع الأصدقاء</p>
            {isOwner && (
              <button
                onClick={onOpenSheet}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white active:scale-95 transition-transform"
                style={{
                  background: "linear-gradient(135deg,#16a34a,#15803d)",
                  boxShadow: "0 0 12px rgba(34,197,94,0.4)",
                }}
              >
                ⚽ ابدأ البث المباشر
              </button>
            )}
          </div>
        )}

        {/* Live badge */}
        {streamUrl && (
          <div className="absolute top-2 right-2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(239,68,68,0.92)", backdropFilter: "blur(4px)", boxShadow: "0 0 8px rgba(239,68,68,0.5)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-[10px] font-black">LIVE</span>
          </div>
        )}

        {/* Owner control */}
        {isOwner && streamUrl && (
          <button
            onClick={onOpenSheet}
            className="absolute bottom-2 left-2 z-30 px-2 py-1 rounded-lg text-[10px] font-bold text-white active:scale-95"
            style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            تغيير البث
          </button>
        )}

        {/* Football emoji decoration */}
        {!streamUrl && (
          <div className="absolute top-2 left-2 z-30 text-lg opacity-30">⚽</div>
        )}
      </div>

      {/* Screen stand */}
      <div className="flex justify-center">
        <div style={{
          width: 50, height: 7,
          background: "linear-gradient(90deg,#0a1a0a,#1a3a1a,#0a1a0a)",
          borderRadius: "0 0 6px 6px",
          boxShadow: "0 2px 8px rgba(34,197,94,0.2)",
        }} />
      </div>
    </div>
  );
}
