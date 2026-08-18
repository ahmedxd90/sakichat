import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";

interface CreateReelPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function CreateReelPage({ onBack, onSuccess }: CreateReelPageProps) {
  const createReel = useMutation(api.reels.createReel);
  const generateUploadUrl = useMutation(api.reels.generateReelUploadUrl);

  const [caption, setCaption] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("يرجى اختيار ملف فيديو"); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("حجم الفيديو يجب أن يكون أقل من 50 ميجابايت"); return; }
    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handlePublish = async () => {
    if (!caption.trim() && !selectedVideo) { toast.error("أضف نصاً أو فيديو"); return; }
    setLoading(true);
    try {
      let videoStorageId = undefined;
      if (selectedVideo) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": selectedVideo.type }, body: selectedVideo });
        if (!result.ok) throw new Error("فشل رفع الفيديو");
        const { storageId } = await result.json();
        videoStorageId = storageId;
      }
      await createReel({ caption: caption.trim(), videoStorageId });
      toast.success("تم نشر الريل! 🎬");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col" dir="rtl">
      <div className="sticky top-0 z-40 bg-[#0f0f1a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="text-gray-400 text-sm font-medium hover:text-white">إلغاء</button>
          <h2 className="text-white font-bold text-base">ريل جديد</h2>
          <button onClick={handlePublish} disabled={loading || (!caption.trim() && !selectedVideo)} className="text-sm font-bold text-purple-400 disabled:opacity-40">
            {loading ? "نشر..." : "نشر"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {videoPreview ? (
          <div className="relative bg-black aspect-[9/16] max-h-[50vh] overflow-hidden">
            <video src={videoPreview} className="w-full h-full object-cover" autoPlay loop muted playsInline />
            <button onClick={() => { setSelectedVideo(null); setVideoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="absolute top-3 left-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()}
            className="mx-4 mt-4 rounded-2xl border-2 border-dashed border-white/20 aspect-[9/16] max-h-[50vh] flex flex-col items-center justify-center gap-3 hover:border-purple-500/50 transition-colors bg-white/3">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-sm">اضغط لاختيار فيديو</p>
              <p className="text-gray-500 text-xs mt-0.5">MP4, MOV حتى 50 ميجابايت</p>
            </div>
          </button>
        )}

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />

        <div className="px-4 mt-4 flex-1">
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="اكتب وصفاً للريل..." rows={3} maxLength={300}
            className="w-full bg-transparent text-white placeholder-gray-500 text-base focus:outline-none resize-none leading-relaxed" />
          <p className="text-gray-600 text-xs mt-1 text-left">{caption.length}/300</p>
        </div>

        <div className="px-4 pb-8 pt-4">
          <button onClick={handlePublish} disabled={loading || (!caption.trim() && !selectedVideo)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all active:scale-95">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري النشر...
              </span>
            ) : "نشر الريل 🎬"}
          </button>
        </div>
      </div>
    </div>
  );
}
