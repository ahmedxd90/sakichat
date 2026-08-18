// @ts-nocheck
import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "../../lib/toast";

interface Props {
  roomId: Id<"rooms">;
  onBack: () => void;
}

interface YTResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
}

export default function YoutubeSettingsSubPage({ roomId, onBack }: Props) {
  const room = useQuery(api.rooms.getRoom, { roomId });
  const setYoutubeVideo = useMutation(api.rooms.setYoutubeVideo);
  const searchYoutube = useAction(api.youtubeSearch.searchYoutube);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YTResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YTResult | null>(null);
  const [loading, setLoading] = useState(false);

  const currentVideoId = (room as any)?.youtubeVideoId ?? null;
  const currentIsYt = currentVideoId?.match(/^[a-zA-Z0-9_-]{11}$/);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSelectedVideo(null);
    setSearchResults([]);
    try {
      // If it's a YouTube URL or ID, play directly
      const ytMatch = q.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      const ytId = ytMatch ? ytMatch[1] : (q.match(/^[a-zA-Z0-9_-]{11}$/) ? q : null);
      if (ytId) {
        setLoading(true);
        await setYoutubeVideo({ roomId, videoId: ytId });
        toast.success("تم تشغيل الفيديو 🎬");
        setSearchQuery("");
        setLoading(false);
        setSearching(false);
        return;
      }
      const results = await searchYoutube({ query: q });
      setSearchResults(results as YTResult[]);
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.includes("YOUTUBE_API_KEY")) {
        toast.error("⚠️ أضف YOUTUBE_API_KEY في إعدادات Convex لتفعيل البحث");
      } else {
        toast.error("فشل البحث: " + msg);
      }
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const handlePlaySelected = async (video: YTResult) => {
    setLoading(true);
    try {
      await setYoutubeVideo({ roomId, videoId: video.videoId });
      toast.success(`▶ يعرض الآن: ${video.title}`);
      setSelectedVideo(null);
      setSearchResults([]);
      setSearchQuery("");
    } catch (e: any) { toast.error(e); }
    finally { setLoading(false); }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await setYoutubeVideo({ roomId, videoId: undefined });
      toast.success("تم إيقاف الفيديو ⏹");
    } catch (e: any) { toast.error(e); }
    finally { setLoading(false); }
  };

  const SUGGESTIONS = ["أغاني عربية 2024", "كرة القدم", "أفلام مضحكة", "موسيقى هادئة"];

  return (
    <div className="flex flex-col h-screen" style={{ background: "linear-gradient(180deg,#080000 0%,#120000 50%,#0d0000 100%)" }} dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90" style={{ background: "rgba(255,255,255,0.08)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">شاشة السينما</h2>
            <p className="text-red-400/70 text-[10px]">ابحث وشغّل لجميع الأعضاء</p>
          </div>
        </div>
        {currentVideoId && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}>
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            <span className="text-red-300 text-[10px] font-bold">LIVE</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Current video */}
        {currentVideoId && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)" }}>
            <div className="flex items-center gap-3 p-3">
              {currentIsYt ? (
                <div className="relative flex-shrink-0">
                  <img src={`https://img.youtube.com/vi/${currentVideoId}/mqdefault.jpg`} alt=""
                    className="w-20 h-14 rounded-xl object-cover" />
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.9)" }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
                  <span className="text-2xl">🎬</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">{currentVideoId}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-green-400 text-[10px] font-bold">يعرض الآن لجميع الأعضاء</p>
                </div>
              </div>
              <button onClick={handleStop} disabled={loading}
                className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 active:scale-95"
                style={{ background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.5)" }}>
                ⏹ إيقاف
              </button>
            </div>
          </div>
        )}

        {/* Search box */}
        <div className="space-y-2">
          <p className="text-gray-400 text-xs font-bold">🔍 ابحث عن فيديو أو الصق رابط يوتيوب</p>
          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="اسم الفيديو أو رابط يوتيوب..."
              className="flex-1 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(239,68,68,0.3)" }}
              dir="rtl"
            />
            <button
              onClick={handleSearch}
              disabled={searching || loading || !searchQuery.trim()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-40 active:scale-90 flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
            >
              {searching || loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Selected video confirm */}
        {selectedVideo && (
          <div className="rounded-2xl p-3" style={{ background: "rgba(239,68,68,0.12)", border: "2px solid rgba(239,68,68,0.5)" }}>
            <p className="text-red-300 text-[10px] font-bold mb-2">✅ تم اختيار الفيديو — اضغط تشغيل</p>
            <div className="flex items-center gap-3">
              <img src={selectedVideo.thumbnail} alt="" className="w-20 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold leading-tight line-clamp-2">{selectedVideo.title}</p>
                <p className="text-red-300/70 text-[10px] mt-1">{selectedVideo.channelTitle}</p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={() => handlePlaySelected(selectedVideo)} disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                  {loading ? "..." : "▶ تشغيل"}
                </button>
                <button onClick={() => setSelectedVideo(null)}
                  className="px-4 py-1.5 rounded-xl text-[10px] font-bold text-gray-400 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && !selectedVideo && (
          <div className="space-y-2">
            <p className="text-gray-400 text-xs font-bold">نتائج البحث • {searchResults.length} فيديو</p>
            {searchResults.map((video) => (
              <button
                key={video.videoId}
                onClick={() => setSelectedVideo(video)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl active:scale-[0.98] transition-all text-right"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="relative flex-shrink-0">
                  <img src={video.thumbnail} alt="" className="w-20 h-14 rounded-xl object-cover" />
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.9)" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold leading-tight line-clamp-2 text-right">{video.title}</p>
                  <p className="text-gray-500 text-[10px] mt-1 text-right">{video.channelTitle}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {searchResults.length === 0 && !searching && !selectedVideo && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <span className="text-4xl">🎬</span>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">ابحث عن فيديو يوتيوب</p>
              <p className="text-gray-500 text-xs mt-1">اكتب اسم الفيديو أو الصق رابط يوتيوب</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setSearchQuery(s)}
                  className="px-3 py-1.5 rounded-full text-xs text-gray-400 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-red-400/80 text-[11px] font-bold mb-1.5">💡 كيف يعمل؟</p>
          <p className="text-gray-500 text-[11px]">• ابحث بالاسم أو الصق رابط يوتيوب مباشرة</p>
          <p className="text-gray-500 text-[11px]">• الفيديو يظهر فوراً لجميع أعضاء الغرفة</p>
          <p className="text-gray-500 text-[11px]">• يتطلب البحث إضافة YOUTUBE_API_KEY في Convex</p>
        </div>
      </div>
    </div>
  );
}
