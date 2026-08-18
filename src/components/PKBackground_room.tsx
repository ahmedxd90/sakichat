// @ts-nocheck
// PK Room Background - animated battle theme
import { useEffect, useRef } from "react";

interface PKRoomBackgroundProps {
  active: boolean;
}

export default function PKRoomBackground({ active }: PKRoomBackgroundProps) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Main gradient */}
      <div className="absolute inset-0 animate-pk-bg-shift"
        style={{
          background: "linear-gradient(135deg, #000820 0%, #050010 25%, #100005 50%, #050010 75%, #000820 100%)",
          backgroundSize: "200% 200%",
        }}
      />
      {/* Blue side glow */}
      <div className="absolute inset-0 animate-pk-bg-pulse"
        style={{
          background: "radial-gradient(ellipse at 10% 30%, rgba(59,130,246,0.18) 0%, transparent 50%)",
        }}
      />
      {/* Red side glow */}
      <div className="absolute inset-0 animate-pk-bg-pulse"
        style={{
          background: "radial-gradient(ellipse at 90% 30%, rgba(239,68,68,0.18) 0%, transparent 50%)",
          animationDelay: "1s",
        }}
      />
      {/* Center energy */}
      <div className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 20%, rgba(249,115,22,0.08) 0%, transparent 40%)",
          animation: "pk-bg-pulse 2s ease-in-out infinite",
        }}
      />
      {/* Scanlines effect */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.2)" }} />
    </div>
  );
}
