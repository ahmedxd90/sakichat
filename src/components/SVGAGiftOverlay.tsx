import { useEffect, useRef, useState } from "react";

interface SVGAGiftOverlayProps {
  svgaUrl: string;
  senderName: string;
  receiverName: string;
  giftName: string;
  senderAvatarUrl?: string;
  quantity?: number;
  soundUrl?: string;
  onDone: () => void;
}

const SPARKLE_COLORS = ["#fbbf24", "#a855f7", "#ec4899", "#60a5fa", "#34d399", "#f472b6", "#fde68a"];

export default function SVGAGiftOverlay({
  svgaUrl, senderName, receiverName, giftName,
  senderAvatarUrl, quantity = 1, soundUrl, onDone,
}: SVGAGiftOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerLeaving, setBannerLeaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const DURATION = 7000;

  useEffect(() => {
    const t0 = setTimeout(() => setBannerVisible(true), 300);
    const t1 = setTimeout(() => setBannerLeaving(true), DURATION - 700);
    const t2 = setTimeout(onDone, DURATION);
    if (soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = 0.85;
        audio.play().catch(() => {});
        audioRef.current = audio;
      } catch (_) {}
    }
    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2);
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !svgaUrl) return;
    let cancelled = false;

    (async () => {
      try {
        // @ts-ignore
        const mod = await import("svga.lite");
        const { Downloader, Parser, Player } = mod.default || mod;
        if (cancelled) return;

        const canvas = canvasRef.current!;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const downloader = new Downloader();
        const buffer: ArrayBuffer = await downloader.get(svgaUrl);
        if (cancelled) return;

        const parser = new Parser();
        const videoItem = await parser.do(buffer);
        if (cancelled) return;

        const player = new Player(canvas);
        playerRef.current = player;
        player.loop = 0;
        await player.mount(videoItem);
        if (cancelled) return;

        player.start();
        setLoaded(true);
      } catch (err) {
        console.warn("SVGAGiftOverlay:", err);
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
      try { playerRef.current?.stop(); playerRef.current?.destroy?.(); } catch (_) {}
      playerRef.current = null;
    };
  }, [svgaUrl]);

  return (
    <div className="fixed inset-0 z-[400] pointer-events-none overflow-hidden">

      {/* SVGA Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block" }}
      />

      {/* Sparkle particles */}
      {loaded && [...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${5 + (i * 8) % 90}%`,
          top: `${10 + (i * 13) % 80}%`,
          width: i % 3 === 0 ? 6 : 4,
          height: i % 3 === 0 ? 6 : 4,
          borderRadius: "50%",
          background: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
          boxShadow: `0 0 10px ${SPARKLE_COLORS[i % SPARKLE_COLORS.length]}`,
          animation: `svga-sparkle ${0.6 + (i * 0.15)}s ${i * 0.07}s ease-in-out infinite alternate`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Gift Banner */}
      <div style={{
        position: "absolute", top: "20%", right: 0, zIndex: 20,
        transform: bannerVisible ? (bannerLeaving ? "translateX(115%)" : "translateX(0)") : "translateX(115%)",
        transition: bannerVisible && !bannerLeaving
          ? "transform 0.65s cubic-bezier(0.34,1.56,0.64,1)"
          : "transform 0.5s cubic-bezier(0.55,0,1,0.45)",
      }}>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <div style={{
            background: "linear-gradient(108deg,#0a001a 0%,#1a0035 25%,#2d0060 50%,#1a0035 75%,#0a001a 100%)",
            border: "1px solid rgba(236,72,153,0.7)", borderRight: "none",
            borderRadius: "22px 0 0 22px",
            boxShadow: "0 0 28px rgba(236,72,153,0.5), 0 0 55px rgba(168,85,247,0.25)",
            padding: "11px 14px 11px 18px",
            display: "flex", alignItems: "center", gap: 11,
            minWidth: 255, maxWidth: 310,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(108deg,transparent 35%,rgba(255,255,255,0.06) 50%,transparent 65%)",
              animation: "svga-shimmer 2.8s linear infinite", pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg,transparent,#ec4899 20%,#a855f7 50%,#ec4899 80%,transparent)",
              backgroundSize: "200% 100%", animation: "svga-gold 2.2s linear infinite",
            }} />

            {/* Gift icon */}
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(168,85,247,0.15)", border: "1px solid rgba(236,72,153,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 22 }}>✨</span>
              </div>
              {quantity > 1 && (
                <span style={{
                  color: "#fff", fontWeight: 900, fontSize: 10,
                  background: "linear-gradient(135deg,#ec4899,#a855f7)",
                  borderRadius: 20, padding: "1px 6px",
                }}>×{quantity}</span>
              )}
            </div>

            {/* Text */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <span style={{
                color: "#f9a8d4", fontWeight: 900, fontSize: 14,
                textShadow: "0 0 14px rgba(236,72,153,0.9)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{senderName}</span>
              <span style={{
                color: "rgba(255,200,230,0.95)", fontSize: 11, fontWeight: 600, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                أرسل <span style={{ color: "#ec4899", fontWeight: 900 }}>{giftName}</span>
                {receiverName ? <> إلى {receiverName}</> : null}
              </span>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                {[0,1,2,3,4].map(i => (
                  <svg key={i} width="9" height="9" viewBox="0 0 24 24" fill="#ec4899"
                    style={{ filter: "drop-shadow(0 0 4px #ec4899)", animation: `svga-star ${0.7+i*0.12}s ${i*0.08}s ease-in-out infinite alternate` }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                <span style={{ fontSize: 10 }}>✨</span>
                <span style={{
                  color: "#fff", fontSize: 8, fontWeight: 900,
                  background: "linear-gradient(135deg,#ec4899,#a855f7)",
                  borderRadius: 6, padding: "1px 5px",
                }}>SVGA</span>
              </div>
            </div>

            {/* Sender avatar */}
            <div style={{ position: "relative", flexShrink: 0, width: 50, height: 50 }}>
              <div style={{
                position: "absolute", inset: -3, borderRadius: "50%",
                background: "conic-gradient(from 0deg,#ec4899,#a855f7,#ec4899,#f472b6,#ec4899)",
                animation: "svga-ring 2.4s linear infinite",
              }} />
              <div style={{ position: "absolute", inset: -1, borderRadius: "50%", background: "#0a001a" }} />
              <div style={{
                width: 50, height: 50, borderRadius: "50%", overflow: "hidden",
                position: "relative", zIndex: 2,
                background: "linear-gradient(135deg,#ec4899,#a855f7)",
              }}>
                {senderAvatarUrl
                  ? <img src={senderAvatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "white", fontWeight: 900, fontSize: 20 }}>{senderName?.[0] ?? "؟"}</span>
                    </div>
                }
              </div>
            </div>
          </div>

          {[...Array(7)].map((_, i) => (
            <div key={i} style={{
              position: "absolute", left: -(25 + i * 5), top: `${12 + i * 11}%`,
              width: i % 2 === 0 ? 4 : 3, height: i % 2 === 0 ? 4 : 3,
              borderRadius: "50%", background: SPARKLE_COLORS[i],
              boxShadow: `0 0 8px ${SPARKLE_COLORS[i]}`,
              animation: `svga-sparkle ${0.5+i*0.18}s ${i*0.09}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes svga-shimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(220%)} }
        @keyframes svga-gold { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes svga-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes svga-star { from{opacity:0.4;transform:scale(0.7)} to{opacity:1;transform:scale(1.3)} }
        @keyframes svga-sparkle { from{opacity:0.2;transform:scale(0.4)} to{opacity:1;transform:scale(1.8)} }
      `}</style>
    </div>
  );
}
