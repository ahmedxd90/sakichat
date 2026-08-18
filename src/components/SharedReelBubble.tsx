// @ts-nocheck
import { useState, useRef, useEffect } from "react";

export default function SharedReelBubble({ msg }: { msg: any }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
    setCurrentTime(v.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoaded(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  };

  const formatDur = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="rounded-2xl overflow-hidden select-none"
      style={{
        width: 220,
        background: "linear-gradient(180deg, #0d0d1a 0%, #1a0d2e 100%)",
        border: "1.5px solid rgba(168,85,247,0.45)",
        boxShadow: "0 8px 32px rgba(168,85,247,0.2), 0 2px 8px rgba(0,0,0,0.5)",
      }}
    >
      {/* Video area */}
      <div
        className="relative cursor-pointer"
        style={{ height: 310 }}
        onClick={togglePlay}
      >
        {msg.reelVideoUrl ? (
          <video
            ref={videoRef}
            src={msg.reelVideoUrl}
            className="w-full h-full object-cover"
            muted={muted}
            playsInline
            loop
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setPlaying(false)}
            preload="metadata"
          />
        ) : msg.reelThumbnailUrl ? (
          <img
            src={msg.reelThumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.1))" }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 40%, transparent 65%)" }} />

        {/* Top: Reel badge + mute */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", boxShadow: "0 2px 8px rgba(168,85,247,0.5)" }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            ريل
          </div>
          {msg.reelVideoUrl && (
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center pointer-events-auto active:scale-90"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)" }}
              onClick={toggleMute}
            >
              {muted ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Center play/pause button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: playing ? "transparent" : "rgba(168,85,247,0.9)",
              backdropFilter: "blur(4px)",
              boxShadow: playing ? "none" : "0 0 30px rgba(168,85,247,0.7)",
              opacity: playing ? 0 : 1,
              transform: playing ? "scale(0.7)" : "scale(1)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* Bottom: duration + time */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {duration > 0 && (
            <span className="text-[10px] text-white/80 font-mono bg-black/50 px-1.5 py-0.5 rounded-md">
              {formatDur(currentTime)} / {formatDur(duration)}
            </span>
          )}
        </div>

        {/* Progress bar (seekable) */}
        {msg.reelVideoUrl && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15 cursor-pointer pointer-events-auto"
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #a855f7, #ec4899)",
                transition: "width 0.1s linear",
              }}
            />
          </div>
        )}
      </div>

      {/* Caption + hashtags */}
      {msg.reelCaption && (
        <div className="px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white text-xs line-clamp-2 leading-relaxed">
            {msg.reelCaption.split(" ").map((word: string, i: number) =>
              word.startsWith("#")
                ? <span key={i} className="text-purple-400 font-bold">{word} </span>
                : word + " "
            )}
          </p>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
      >
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        </div>
        <span className="text-purple-300 text-[10px] font-bold flex-1">مشاركة ريل</span>
        <button
          onClick={togglePlay}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white active:scale-95 transition-transform"
          style={{ background: playing ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #a855f7, #ec4899)" }}
        >
          {playing ? (
            <>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              إيقاف
            </>
          ) : (
            <>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              تشغيل
            </>
          )}
        </button>
      </div>
    </div>
  );
}
