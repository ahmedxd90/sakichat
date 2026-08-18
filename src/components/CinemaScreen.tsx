function detectType(videoId: string | null): "youtube" | "facebook" | "telegram" | "direct" | null {
  if (!videoId) return null;
  if (videoId.match(/^[a-zA-Z0-9_-]{11}$/)) return "youtube";
  if (videoId.includes("youtube") || videoId.includes("youtu.be")) return "youtube";
  if (videoId.includes("facebook") || videoId.includes("fb.watch") || videoId.includes("fb.com")) return "facebook";
  if (videoId.includes("t.me") || videoId.includes("telegram")) return "telegram";
  return "direct";
}

function getYoutubeId(videoId: string): string | null {
  const m = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  if (videoId.match(/^[a-zA-Z0-9_-]{11}$/)) return videoId;
  return null;
}

interface CinemaScreenProps {
  videoId: string | null;
  isOwner: boolean;
  onOpen: () => void;
}

const TYPE_ICONS: Record<string, string> = { youtube: "▶️", facebook: "📘", telegram: "✈️", direct: "🎞️" };
const TYPE_LABELS: Record<string, string> = { youtube: "يوتيوب", facebook: "فيسبوك", telegram: "تيليغرام", direct: "فيديو مباشر" };

export default function CinemaScreen({ videoId, isOwner, onOpen }: CinemaScreenProps) {
  const vType = detectType(videoId);
  const ytId = vType === "youtube" && videoId ? getYoutubeId(videoId) : null;

  return (
    <div className="flex-shrink-0 px-3 pt-2 pb-1">
      {/* Screen frame */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        style={{
          border: "2px solid rgba(239,68,68,0.5)",
          background: "#000",
          boxShadow: "0 0 24px rgba(239,68,68,0.25), 0 0 60px rgba(100,0,0,0.15)",
        }}
        onClick={onOpen}
      >
        {/* Red curtains */}
        <div className="absolute inset-y-0 left-0 w-5 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg,rgba(120,0,0,0.98),rgba(80,0,0,0.6),transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-5 z-10 pointer-events-none"
          style={{ background: "linear-gradient(270deg,rgba(120,0,0,0.98),rgba(80,0,0,0.6),transparent)" }} />
        <div className="absolute top-0 left-0 right-0 h-2 z-10 pointer-events-none"
          style={{ background: "linear-gradient(180deg,rgba(100,0,0,0.9),transparent)" }} />

        {videoId ? (
          <div style={{ paddingBottom: "38%" }} className="relative">
            {/* Thumbnail */}
            {ytId ? (
              <img
                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                alt="thumbnail"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ background: "linear-gradient(135deg,#1a0000,#0d0000)" }}>
                <span className="text-5xl">{TYPE_ICONS[vType ?? "direct"] ?? "🎬"}</span>
              </div>
            )}
            {/* Dark overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.35)" }} />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.9)", boxShadow: "0 0 20px rgba(239,68,68,0.7)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </div>
            </div>
            {/* Label */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: "rgba(0,0,0,0.75)" }}>
                <span>{TYPE_ICONS[vType ?? "direct"]}</span>
                <span>اضغط لمشاهدة {TYPE_LABELS[vType ?? "direct"]}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-5 gap-1.5">
            <div className="text-4xl">🎬</div>
            <p className="text-red-300 text-xs font-bold tracking-wide">شاشة السينما</p>
            <p className="text-gray-500 text-[10px]">
              {isOwner ? "اضغط لتشغيل فيديو 🎥" : "لا يوجد فيديو الآن"}
            </p>
          </div>
        )}

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none"
          style={{ background: "linear-gradient(0deg,rgba(239,68,68,0.4),transparent)" }} />
      </div>

      {/* Floor lights */}
      <div className="flex justify-center gap-2 mt-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full"
            style={{
              background: "rgba(239,68,68,0.7)",
              boxShadow: "0 0 4px rgba(239,68,68,0.9)",
              animation: `pulse ${0.8 + i * 0.1}s ease-in-out infinite alternate`,
            }} />
        ))}
      </div>
    </div>
  );
}
