// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "../../lib/toast";

function getYoutubeId(videoId: string): string | null {
  const m = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  if (videoId.match(/^[a-zA-Z0-9_-]{11}$/)) return videoId;
  return null;
}

interface YTResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

interface RoomVideoScreenProps {
  videoId: string | null;
  videoStartedAt: number | null;
  isPlaying: boolean;
  position: number;
  isMutedByOwner: boolean;
  volume: number;
  isOwner: boolean;
  onOpenSheet: () => void;
  roomId?: Id<"rooms">;
}

// ── Register MediaSession so the OS media controls keep the audio alive ──────
function registerMediaSession(title: string) {
  try {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: "ساكي شات",
        album: "غرفة مباشرة",
      });
      // Override pause/stop actions to prevent OS from killing audio
      navigator.mediaSession.setActionHandler("pause", () => {});
      navigator.mediaSession.setActionHandler("stop", () => {});
      navigator.mediaSession.setActionHandler("play", () => {});
    }
  } catch (_) {}
}

// ── Silent audio trick: keeps audio context alive in background ───────────────
let silentAudioCtx: AudioContext | null = null;
let silentSource: AudioBufferSourceNode | null = null;

function startSilentAudio() {
  try {
    if (silentAudioCtx) {
      // Already created — just resume if suspended
      if (silentAudioCtx.state === "suspended") silentAudioCtx.resume();
      return;
    }
    // MUST be called from a user gesture on iOS
    silentAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = silentAudioCtx.createBuffer(1, silentAudioCtx.sampleRate * 3, silentAudioCtx.sampleRate);
    const source = silentAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(silentAudioCtx.destination);
    source.start();
    silentSource = source;
  } catch (_) {}
}

function resumeSilentAudio() {
  try {
    if (silentAudioCtx?.state === "suspended") {
      silentAudioCtx.resume();
    }
  } catch (_) {}
}

// ── Synchronized YouTube IFrame API Player ─────────────────────────────────
function YouTubePlayer({
  ytId,
  isExpanded,
  videoStartedAt,
  isPlaying,
  position,
  isMutedByOwner,
  volume,
}: {
  ytId: string;
  isExpanded: boolean;
  videoStartedAt: number | null;
  isPlaying: boolean;
  position: number;
  isMutedByOwner: boolean;
  volume: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerReadyRef = useRef(false);
  const isMutedRef = useRef(true);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const getSyncedPosition = useCallback(() => {
    if (!isPlaying || !videoStartedAt) return Math.max(0, position || 0);
    return Math.max(0, (Date.now() - videoStartedAt) / 1000);
  }, [videoStartedAt, isPlaying, position]);

  // ── Keep playing when app goes to background (home button / switch app) ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      resumeSilentAudio();
      if (!playerRef.current || !playerReadyRef.current) return;
      if (document.visibilityState === "hidden") {
        // Force play before hiding — some browsers allow this
        try { playerRef.current.playVideo(); } catch (_) {}
      } else {
        // Came back — resync and resume
        try {
          const elapsed = getSyncedPosition();
          playerRef.current.seekTo(elapsed, true);
          if (isPlaying) playerRef.current.playVideo(); else playerRef.current.pauseVideo();
          if (isMutedByOwner) {
            playerRef.current.mute();
          } else {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume);
          }
        } catch (_) {}
      }
    };

    // Also handle page show (iOS Safari back from background)
    const handlePageShow = () => {
      resumeSilentAudio();
      if (!playerRef.current || !playerReadyRef.current) return;
      try {
        const elapsed = getSyncedPosition();
        playerRef.current.seekTo(elapsed, true);
        if (isPlaying) playerRef.current.playVideo(); else playerRef.current.pauseVideo();
      } catch (_) {}
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
    };
  }, [getSyncedPosition, isPlaying, isMutedByOwner, volume]);

  // ── Periodic keep-alive every 4s ──
  useEffect(() => {
    const interval = setInterval(() => {
      resumeSilentAudio();
      if (!playerRef.current || !playerReadyRef.current) return;
      try {
        const state = playerRef.current.getPlayerState?.();
        if (isPlaying && (state === 2 || state === -1)) {
          playerRef.current.playVideo();
        } else if (!isPlaying && state === 1) {
          playerRef.current.pauseVideo();
        }
      } catch (_) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const initPlayer = useCallback(() => {
    if (!divRef.current) return;
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (_) {}
      playerRef.current = null;
    }
    playerReadyRef.current = false;
    setStatus("loading");
    setErrorCode(null);
    setIsMuted(true);
    isMutedRef.current = true;

    const uid = `yt-${ytId}-${Date.now()}`;
    const el = document.createElement("div");
    el.id = uid;
    divRef.current.innerHTML = "";
    divRef.current.appendChild(el);

    const startSeconds = getSyncedPosition();

    playerRef.current = new (window as any).YT.Player(uid, {
      videoId: ytId,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        fs: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        hl: "ar",
        start: Math.floor(startSeconds),
        disablekb: 1,
        mute: 1,
      },
      events: {
        onReady: (e: any) => {
          playerReadyRef.current = true;
          setStatus("ready");
          const elapsed = getSyncedPosition();
          try {
            e.target.mute();
            e.target.seekTo(elapsed, true);
            if (isPlaying) e.target.playVideo(); else e.target.pauseVideo();
            // NOTE: Do NOT call startSilentAudio() here — iOS blocks AudioContext
            // without a user gesture. It will be called in handleUnmute instead.
            registerMediaSession("فيديو الغرفة");
          } catch (_) {}
        },
        onStateChange: (e: any) => {
          // PAUSED (2) or UNSTARTED (-1) — force resume
          if (isPlaying && (e.data === 2 || e.data === -1)) {
            try { e.target.playVideo(); } catch (_) {}
          }
        },
        onError: (e: any) => {
          setErrorCode(e.data);
          setStatus("error");
        },
      },
    });
  }, [ytId, getSyncedPosition, isPlaying]);

  useEffect(() => {
    if (!playerRef.current || !playerReadyRef.current) return;
    try {
      const elapsed = getSyncedPosition();
      playerRef.current.seekTo(elapsed, true);
      if (isPlaying) playerRef.current.playVideo(); else playerRef.current.pauseVideo();
    } catch (_) {}
  }, [isPlaying, position, videoStartedAt, getSyncedPosition]);

  useEffect(() => {
    if (!playerRef.current || !playerReadyRef.current) return;
    try {
      if (isMutedByOwner) {
        playerRef.current.mute();
        isMutedRef.current = true;
      } else {
        playerRef.current.setVolume(volume);
        if (!isMutedRef.current) playerRef.current.unMute();
      }
    } catch (_) {}
  }, [isMutedByOwner, volume]);

  useEffect(() => {
    const tryInit = () => {
      if ((window as any).YT?.Player) {
        initPlayer();
      } else {
        const prev = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
          if (prev) prev();
          initPlayer();
        };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const s = document.createElement("script");
          s.src = "https://www.youtube.com/iframe_api";
          document.head.appendChild(s);
        }
      }
    };
    tryInit();
    return () => {
      playerReadyRef.current = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (_) {}
        playerRef.current = null;
      }
    };
  }, [ytId]);

  const handleUnmute = () => {
    try {
      // Start/resume silent audio on user gesture — this unlocks AudioContext on iOS
      startSilentAudio();
      resumeSilentAudio();
      if (playerRef.current) {
        // On iOS, unMute may fail silently if AudioContext is still locked.
        // We call playVideo first to ensure the player is active, then unMute.
        playerRef.current.playVideo();
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
        setIsMuted(false);
        isMutedRef.current = false;
        registerMediaSession("فيديو الغرفة");
        // iOS fallback: retry unMute after a short delay
        setTimeout(() => {
          try {
            if (playerRef.current) {
              playerRef.current.unMute();
              playerRef.current.setVolume(80);
            }
          } catch (_) {}
        }, 300);
      }
    } catch (_) {}
  };

  const errorMsg: Record<number, string> = {
    2: "معرّف الفيديو غير صحيح",
    5: "خطأ في مشغّل HTML5",
    100: "الفيديو غير موجود أو محذوف",
    101: "صاحب الفيديو منع التضمين",
    150: "صاحب الفيديو منع التضمين",
  };

  return (
    <div
      style={{ paddingBottom: isExpanded ? "56.25%" : "42%" }}
      className="relative bg-black"
    >
      {/* Transparent overlay to block user interaction with player controls */}
      <div
        className="absolute inset-0 z-20"
        style={{ background: "transparent" }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Player container */}
      <div
        ref={divRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* 🔊 Unmute button — shown to ALL users when muted and ready */}
      {status === "ready" && isMuted && (
        <div className="absolute inset-0 z-40 flex items-end justify-center pb-3 pointer-events-none">
          <button
            onClick={handleUnmute}
            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold text-xs active:scale-95 transition-transform"
            style={{
              background: "rgba(0,0,0,0.85)",
              border: "1.5px solid rgba(59,130,246,0.9)",
              boxShadow: "0 0 20px rgba(59,130,246,0.5)",
              backdropFilter: "blur(10px)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M19.07 4.93a10 10 0 010 14.14" /></svg>
            <span>اضغط لتفعيل الصوت</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></svg>
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-30"
          style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-10 h-10 rounded-full border-3 border-blue-500 border-t-transparent animate-spin"
            style={{ borderWidth: "3px" }} />
          <p className="text-gray-400 text-xs">جارٍ تحميل الفيديو...</p>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 z-30"
          style={{ background: "linear-gradient(135deg,#071126,#030712)" }}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8"><path d="M10.3 3.7L2.2 18a2 2 0 001.74 3h16.12a2 2 0 001.74-3L13.7 3.7a2 2 0 00-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="17" r=".8" fill="#60a5fa" /></svg>
          <p className="text-white text-sm font-bold text-center">
            {errorCode !== null ? (errorMsg[errorCode] ?? `خطأ ${errorCode}`) : "خطأ في تشغيل الفيديو"}
          </p>
          {(errorCode === 101 || errorCode === 150) && (
            <p className="text-gray-400 text-xs text-center">هذا الفيديو لا يسمح بالتضمين — جرّب فيديو آخر</p>
          )}
          <button onClick={initPlayer}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold active:scale-95"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            🔄 إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function RoomVideoScreen({
  videoId,
  videoStartedAt,
  isPlaying,
  position,
  isMutedByOwner,
  volume,
  isOwner,
  onOpenSheet,
  roomId,
}: RoomVideoScreenProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YTResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [volumeDraft, setVolumeDraft] = useState(volume);

  const searchYoutube = useAction(api.youtubeSearch.searchYoutube);
  const setYoutubeVideo = useMutation(api.rooms.setYoutubeVideo);
  const updateYoutubePlayback = useMutation(api.rooms.updateYoutubePlayback);

  const ytId = videoId ? getYoutubeId(videoId) : null;

  useEffect(() => { setVolumeDraft(volume); }, [volume]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q || !roomId) return;
    setSearching(true);
    try {
      const ytMatch = q.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      const directId = ytMatch ? ytMatch[1] : (q.match(/^[a-zA-Z0-9_-]{11}$/) ? q : null);
      if (directId) {
        await setYoutubeVideo({ roomId, videoId: directId });
        toast.success("تم تشغيل الفيديو 🎬");
        setShowSearch(false);
        setSearchQuery("");
        setSearching(false);
        return;
      }
      const results = await searchYoutube({ query: q });
      setSearchResults(results as YTResult[]);
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.includes("YOUTUBE_API_KEY")) {
        toast.error("⚠️ أضف YOUTUBE_API_KEY في إعدادات Convex");
      } else {
        toast.error("فشل البحث");
      }
    } finally { setSearching(false); }
  };

  const handlePlayResult = async (result: YTResult) => {
    if (!roomId) return;
    try {
      await setYoutubeVideo({ roomId, videoId: result.videoId });
      toast.success(`▶ ${result.title}`);
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (e: any) { toast.error(e); }
  };

  const getCurrentPosition = () => {
    if (!isPlaying || !videoStartedAt) return Math.max(0, position || 0);
    return Math.max(0, (Date.now() - videoStartedAt) / 1000);
  };

  const handleTogglePlayback = async () => {
    if (!roomId || !isOwner) return;
    try {
      await updateYoutubePlayback({ roomId, isPlaying: !isPlaying, position: getCurrentPosition() });
    } catch (e: any) { toast.error(e); }
  };

  const handleToggleMute = async () => {
    if (!roomId || !isOwner) return;
    try {
      await updateYoutubePlayback({ roomId, isMuted: !isMutedByOwner, volume: volumeDraft });
    } catch (e: any) { toast.error(e); }
  };

  const handleVolumeChange = async (nextVolume: number) => {
    if (!roomId || !isOwner) return;
    setVolumeDraft(nextVolume);
    try {
      await updateYoutubePlayback({ roomId, volume: nextVolume, isMuted: nextVolume === 0 });
    } catch (e: any) { toast.error(e); }
  };

  const handleStop = async () => {
    if (!roomId || !isOwner) return;
    try {
      await setYoutubeVideo({ roomId, videoId: undefined });
      toast.success("تم إيقاف الفيديو");
    } catch (e: any) { toast.error(e); }
  };

  // ── SEARCH OVERLAY (owner only) ──
  if (showSearch && isOwner) {
    return (
      <div className="flex-shrink-0 px-3 pt-2 pb-1" dir="rtl">
        <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(59,130,246,0.6)", background: "#030712" }}>
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(59,130,246,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="ابحث عن فيديو يوتيوب..."
              className="flex-1 bg-transparent text-white text-xs focus:outline-none"
              dir="rtl"
              autoFocus
            />
            <button onClick={handleSearch} disabled={searching || !searchQuery.trim()}
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white disabled:opacity-40 active:scale-90"
              style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}>
              {searching ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "بحث"}
            </button>
            <button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(""); }}
              className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((r) => (
                <button key={r.videoId} onClick={() => handlePlayResult(r)}
                  className="w-full flex items-center gap-2 px-3 py-2 active:bg-blue-900/20 transition-colors text-right"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="relative flex-shrink-0">
                    <img src={r.thumbnail} alt="" className="w-14 h-10 rounded-lg object-cover" />
                    <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.9)" }}>
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[10px] font-bold leading-tight line-clamp-2 text-right">{r.title}</p>
                    <p className="text-gray-500 text-[9px] mt-0.5 text-right">{r.channelTitle}</p>
                  </div>
                </button>
              ))
            ) : !searching ? (
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <p className="text-gray-500 text-xs">ابحث عن أي فيديو يوتيوب</p>
                <div className="flex flex-wrap gap-1.5 justify-center px-3">
                  {["أغاني عربية", "كرة القدم", "أفلام"].map((s) => (
                    <button key={s} onClick={() => setSearchQuery(s)}
                      className="px-2 py-1 rounded-full text-[10px] text-gray-400 active:scale-95"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── NO VIDEO: owner sees search button, others see nothing ──
  if (!videoId) {
    if (!isOwner) return null;
    return (
      <div className="flex-shrink-0 px-3 pt-2 pb-1" dir="rtl">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full rounded-2xl flex items-center justify-center gap-2 py-3 active:scale-[0.98] transition-transform"
          style={{ border: "2px dashed rgba(59,130,246,0.4)", background: "rgba(59,130,246,0.05)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-blue-400 text-xs font-bold">ابحث وشغّل فيديو للغرفة</span>
        </button>
      </div>
    );
  }

  // ── VIDEO SCREEN — synchronized cinema mode ──
  return (
    <div className="flex-shrink-0 px-3 pt-2 pb-1" dir="rtl">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: "2px solid rgba(59,130,246,0.6)",
          background: "#000",
          boxShadow: "0 0 30px rgba(59,130,246,0.3), 0 0 60px rgba(10,30,90,0.2)",
        }}
      >
        {/* Curtain sides */}
        <div className="absolute inset-y-0 left-0 w-4 z-20 pointer-events-none"
          style={{ background: "linear-gradient(90deg,rgba(15,42,100,0.95),transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-4 z-20 pointer-events-none"
          style={{ background: "linear-gradient(270deg,rgba(15,42,100,0.95),transparent)" }} />

        {ytId ? (
          <YouTubePlayer ytId={ytId} isExpanded={isExpanded} videoStartedAt={videoStartedAt} isPlaying={isPlaying} position={position} isMutedByOwner={isMutedByOwner} volume={volume} />
        ) : (
          <div style={{ paddingBottom: isExpanded ? "56.25%" : "42%" }} className="relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ background: "linear-gradient(135deg,#071126,#030712)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2" /><polygon points="10,9 16,12 10,15" fill="#60a5fa" stroke="none" /></svg>
            </div>
          </div>
        )}

        {/* Cinema controls — owner only for playback, volume, search and stop */}
        <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full pointer-events-none"
            style={{ background: "rgba(37,99,235,0.92)", border: "1px solid rgba(147,197,253,0.55)" }}>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-white text-[9px] font-black">CINEMA</span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {isOwner && (
              <>
                <button onClick={handleTogglePlayback} aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white active:scale-90"
                  style={{ background: "rgba(37,99,235,0.88)", border: "1px solid rgba(147,197,253,0.55)" }}>
                  {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="7,4 20,12 7,20" /></svg>
                  )}
                </button>
                <button onClick={handleToggleMute} aria-label={isMutedByOwner ? "تشغيل الصوت" : "كتم الصوت"}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white active:scale-90"
                  style={{ background: "rgba(30,64,175,0.9)", border: "1px solid rgba(147,197,253,0.55)" }}>
                  {isMutedByOwner ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></svg>
                  )}
                </button>
                <input aria-label="مستوى صوت الفيديو" type="range" min="0" max="100" value={volumeDraft} onChange={(e) => handleVolumeChange(Number(e.target.value))} className="w-12 h-1 accent-blue-400" />
                <button onClick={() => setShowSearch(true)} aria-label="بحث يوتيوب"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white active:scale-90"
                  style={{ background: "rgba(37,99,235,0.88)", border: "1px solid rgba(147,197,253,0.55)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                </button>
                <button onClick={handleStop} aria-label="إيقاف الفيديو"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white active:scale-90"
                  style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(147,197,253,0.45)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
                </button>
              </>
            )}
            <button onClick={() => setIsExpanded(!isExpanded)} aria-label={isExpanded ? "تصغير" : "تكبير"}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white active:scale-90"
              style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(147,197,253,0.45)" }}>
              {isExpanded ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" /></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" /></svg>
              )}
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none z-20"
          style={{ background: "linear-gradient(0deg,rgba(59,130,246,0.5),transparent)" }} />
      </div>

      {/* Floor lights */}
      <div className="flex justify-center gap-2 mt-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full"
            style={{
              background: "rgba(59,130,246,0.7)",
              boxShadow: "0 0 4px rgba(59,130,246,0.9)",
              animation: `pulse ${0.8 + i * 0.1}s ease-in-out infinite alternate`,
            }} />
        ))}
      </div>
    </div>
  );
}
