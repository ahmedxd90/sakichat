// @ts-nocheck
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface CinemaPlayerSheetProps {
  roomId: Id<"rooms">;
  isOwner: boolean;
  currentVideoId?: string; // stores the full URL or youtube ID
  onClose: () => void;
}

type VideoType = "youtube" | "telegram" | "facebook" | "direct" | null;

interface ParsedVideo {
  type: VideoType;
  embedUrl: string;
  thumbnailUrl: string | null;
  originalUrl: string;
  youtubeId: string | null;
}

function parseVideoUrl(input: string): ParsedVideo | null {
  const url = input.trim();
  if (!url) return null;

  // ── YouTube ──────────────────────────────────────────────────────
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of ytPatterns) {
    const m = url.match(p);
    if (m) {
      const id = m[1];
      return {
        type: "youtube",
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        originalUrl: url,
        youtubeId: id,
      };
    }
  }

  // ── Telegram ─────────────────────────────────────────────────────
  // t.me/channel/123 or t.me/c/123/456
  if (url.includes("t.me/") || url.includes("telegram.me/")) {
    return {
      type: "telegram",
      embedUrl: url,
      thumbnailUrl: null,
      originalUrl: url,
      youtubeId: null,
    };
  }

  // ── Facebook ─────────────────────────────────────────────────────
  if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com")) {
    const encodedUrl = encodeURIComponent(url);
    return {
      type: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&autoplay=true&mute=false`,
      thumbnailUrl: null,
      originalUrl: url,
      youtubeId: null,
    };
  }

  // ── Direct video URL (mp4, webm, etc.) ───────────────────────────
  if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i) || url.includes("drive.google.com") || url.includes("dropbox.com")) {
    return {
      type: "direct",
      embedUrl: url,
      thumbnailUrl: null,
      originalUrl: url,
      youtubeId: null,
    };
  }

  // ── Generic iframe (any https URL) ───────────────────────────────
  if (url.startsWith("https://") || url.startsWith("http://")) {
    return {
      type: "direct",
      embedUrl: url,
      thumbnailUrl: null,
      originalUrl: url,
      youtubeId: null,
    };
  }

  return null;
}

function getTypeLabel(type: VideoType): string {
  switch (type) {
    case "youtube": return "يوتيوب";
    case "telegram": return "تيليغرام";
    case "facebook": return "فيسبوك";
    case "direct": return "رابط مباشر";
    default: return "فيديو";
  }
}

function getTypeIcon(type: VideoType): string {
  switch (type) {
    case "youtube": return "▶️";
    case "telegram": return "✈️";
    case "facebook": return "📘";
    case "direct": return "🎞️";
    default: return "🎬";
  }
}

// ── Full Screen Player ────────────────────────────────────────────
function FullScreenPlayer({ parsed, isOwner, onBack, onStop }: {
  parsed: ParsedVideo;
  isOwner: boolean;
  onBack: () => void;
  onStop: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.9)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/80 active:scale-95 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="text-sm font-bold">رجوع</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base">{getTypeIcon(parsed.type)}</span>
          <span className="text-white font-bold text-sm">🎬 شاشة السينما</span>
        </div>
        {isOwner ? (
          <button onClick={onStop}
            className="text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            ⏹ إيقاف
          </button>
        ) : <div className="w-16" />}
      </div>

      {/* Player */}
      <div className="flex-1 relative bg-black">
        {parsed.type === "direct" ? (
          // Direct video file
          <video
            className="absolute inset-0 w-full h-full"
            src={parsed.embedUrl}
            controls
            autoPlay
            playsInline
            style={{ background: "#000" }}
          />
        ) : parsed.type === "telegram" ? (
          // Telegram - can't embed, open in browser
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
            <span className="text-6xl">✈️</span>
            <p className="text-white font-bold text-lg text-center">فيديو تيليغرام</p>
            <p className="text-gray-400 text-sm text-center">تيليغرام لا يدعم التضمين المباشر</p>
            <a href={parsed.originalUrl} target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl font-bold text-white text-sm active:scale-95"
              style={{ background: "linear-gradient(135deg,#0088cc,#006699)" }}>
              🔗 فتح في تيليغرام
            </a>
          </div>
        ) : parsed.type === "youtube" ? (
          // YouTube - use IFrame API with all permissions
          <iframe
            className="absolute inset-0 w-full h-full"
            src={parsed.embedUrl}
            title="Cinema Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="origin"
            style={{ border: "none" }}
            // iOS Safari requires these attributes on the iframe element
            {...({ allowfullscreen: "true", webkitallowfullscreen: "true" } as any)}
          />
        ) : (
          // Facebook iframe
          <iframe
            className="absolute inset-0 w-full h-full"
            src={parsed.embedUrl}
            title="Cinema Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ border: "none" }}
          />
        )}
      </div>

      {/* Bottom note */}
      <div className="flex-shrink-0 px-4 py-2 flex flex-col items-center gap-2"
        style={{ background: "rgba(0,0,0,0.9)" }}>
        <p className="text-yellow-400/70 text-[10px] text-center">
          {parsed.type === "youtube" && "⚠️ إذا لم يعمل الفيديو اضغط «فتح في يوتيوب»"}
          {parsed.type === "facebook" && "⚠️ تأكد أن الفيديو عام (Public) على فيسبوك"}
          {parsed.type === "direct" && "🎞️ تشغيل مباشر من الرابط"}
          {parsed.type === "telegram" && "✈️ افتح الرابط في تطبيق تيليغرام"}
        </p>
        {parsed.type === "youtube" && parsed.youtubeId && (
          <a href={`https://www.youtube.com/watch?v=${parsed.youtubeId}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-bold"
            style={{ background: "linear-gradient(135deg,#ff0000,#cc0000)" }}>
            ▶ فتح في يوتيوب
          </a>
        )}
      </div>
    </div>
  );
}

export default function YoutubePlayerSheet({ roomId, isOwner, currentVideoId, onClose }: CinemaPlayerSheetProps) {
  const setYoutubeVideo = useMutation(api.rooms.setYoutubeVideo);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [activeTab, setActiveTab] = useState<"youtube" | "facebook" | "telegram" | "direct">("youtube");

  // Parse current stored video
  const currentParsed = currentVideoId ? parseVideoUrl(currentVideoId) : null;

  const handleSet = async () => {
    const trimmed = input.trim();
    if (!trimmed) { toast.error("أدخل رابط الفيديو"); return; }
    const parsed = parseVideoUrl(trimmed);
    if (!parsed) { toast.error("رابط غير صالح"); return; }

    setLoading(true);
    try {
      // Store the original URL (for non-youtube) or youtube ID
      const storeValue = parsed.type === "youtube" ? parsed.youtubeId! : parsed.originalUrl;
      await setYoutubeVideo({ roomId, videoId: storeValue });
      toast.success(`تم تشغيل ${getTypeLabel(parsed.type)} 🎬`);
      setInput("");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await setYoutubeVideo({ roomId, videoId: undefined });
      toast.success("تم إيقاف الفيديو");
      setShowFullPlayer(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // Show full player
  if (showFullPlayer && currentParsed) {
    return (
      <FullScreenPlayer
        parsed={currentParsed}
        isOwner={isOwner}
        onBack={() => setShowFullPlayer(false)}
        onStop={handleStop}
      />
    );
  }

  const placeholders: Record<string, string> = {
    youtube: "https://youtube.com/watch?v=... أو youtu.be/...",
    facebook: "https://www.facebook.com/watch?v=...",
    telegram: "https://t.me/channel/123",
    direct: "https://example.com/video.mp4",
  };

  return (
    <div className="fixed inset-0 z-[65] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-red-500/30 flex flex-col"
        style={{ background: "linear-gradient(180deg,#1a0000 0%,#0d0000 100%)", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-red-500/40 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-red-500/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <span className="text-white font-bold text-sm">شاشة السينما</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">

          {/* Current video preview */}
          {currentParsed ? (
            <div className="rounded-2xl overflow-hidden border border-red-500/40"
              style={{ background: "rgba(0,0,0,0.6)" }}>
              {/* Preview area */}
              <div className="relative" style={{ paddingBottom: "56.25%" }}>
                {currentParsed.thumbnailUrl ? (
                  <img src={currentParsed.thumbnailUrl} alt="thumbnail"
                    className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#1a0000,#0d0000)" }}>
                    <span className="text-6xl">{getTypeIcon(currentParsed.type)}</span>
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} />

                {/* Play button */}
                <button
                  onClick={() => setShowFullPlayer(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
                    style={{ background: "rgba(239,68,68,0.95)", boxShadow: "0 0 30px rgba(239,68,68,0.6)" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                      <polygon points="6,3 20,12 6,21" />
                    </svg>
                  </div>
                  <span className="text-white text-xs font-bold px-4 py-1.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)" }}>
                    {getTypeIcon(currentParsed.type)} اضغط لمشاهدة {getTypeLabel(currentParsed.type)}
                  </span>
                </button>
              </div>

              {/* Info bar */}
              <div className="px-3 py-2 flex items-center justify-between"
                style={{ background: "rgba(239,68,68,0.1)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{getTypeIcon(currentParsed.type)}</span>
                  <span className="text-red-300 text-xs font-bold">{getTypeLabel(currentParsed.type)}</span>
                </div>
                {isOwner && (
                  <button onClick={handleStop} disabled={loading}
                    className="text-red-400 text-xs font-bold px-2 py-1 rounded-lg active:scale-95"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    ⏹ إيقاف
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <span className="text-5xl">🎥</span>
              <p className="text-gray-400 text-sm text-center">لا يوجد فيديو يعرض الآن</p>
              {!isOwner && <p className="text-gray-600 text-xs text-center">فقط مالك الغرفة يمكنه تشغيل الفيديو</p>}
            </div>
          )}

          {/* Owner controls */}
          {isOwner && (
            <div className="space-y-3">
              {/* Platform tabs */}
              <div className="grid grid-cols-4 gap-1.5">
                {(["youtube", "facebook", "telegram", "direct"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    style={{
                      background: activeTab === tab ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${activeTab === tab ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                      color: activeTab === tab ? "#f87171" : "#9ca3af",
                    }}
                  >
                    <span className="text-base">{getTypeIcon(tab)}</span>
                    <span className="text-[9px]">{getTypeLabel(tab)}</span>
                  </button>
                ))}
              </div>

              {/* Tips per platform */}
              <div className="px-3 py-2 rounded-xl text-[10px] text-gray-400"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {activeTab === "youtube" && "📌 الصق رابط يوتيوب أو معرّف الفيديو (11 حرف)"}
                {activeTab === "facebook" && "📌 الصق رابط فيديو فيسبوك — تأكد أن الفيديو عام (Public)"}
                {activeTab === "telegram" && "📌 الصق رابط قناة تيليغرام — سيُفتح في التطبيق"}
                {activeTab === "direct" && "📌 الصق رابط مباشر لملف فيديو (.mp4, .webm, ...)"}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSet()}
                  placeholder={placeholders[activeTab]}
                  className="flex-1 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                  dir="ltr"
                />
                <button
                  onClick={handleSet}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white" }}
                >
                  {loading ? "..." : "▶"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
