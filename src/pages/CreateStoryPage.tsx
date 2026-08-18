import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";

interface CreateStoryPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

const TEXT_BACKGROUNDS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #ffecd2, #fcb69f)",
  "linear-gradient(135deg, #ff9a9e, #fecfef)",
  "linear-gradient(135deg, #2af598, #009efd)",
  "linear-gradient(135deg, #f7971e, #ffd200)",
  "linear-gradient(135deg, #ee0979, #ff6a00)",
  "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
];

type StoryType = "image" | "video" | "text";

export default function CreateStoryPage({ onBack, onSuccess }: CreateStoryPageProps) {
  const createStory = useMutation(api.stories.createStory);
  const generateUploadUrl = useMutation(api.stories.generateStoryUploadUrl);

  const [storyType, setStoryType] = useState<StoryType>("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedBg, setSelectedBg] = useState(TEXT_BACKGROUNDS[0]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = storyType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(storyType === "video" ? "حجم الفيديو يجب أن يكون أقل من 50 ميجابايت" : "حجم الصورة يجب أن يكون أقل من 10 ميجابايت");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (storyType === "text" && !text.trim()) {
      return toast.error("اكتب نصاً للقصة");
    }
    if (storyType !== "text" && !selectedFile) {
      return toast.error("اختر صورة أو فيديو");
    }
    setLoading(true);
    try {
      let mediaStorageId: any = undefined;
      if (selectedFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        if (!result.ok) throw new Error("فشل رفع الملف");
        const { storageId } = await result.json();
        mediaStorageId = storageId;
      }
      await createStory({
        type: storyType,
        mediaStorageId,
        text: storyType === "text" ? text.trim() : undefined,
        textBg: storyType === "text" ? selectedBg : undefined,
        caption: caption.trim() || undefined,
      });
      toast.success("تم نشر القصة! ✨");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#080812" }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: "rgba(8,8,18,0.95)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="text-gray-400 text-sm font-medium hover:text-white transition-colors">
            إلغاء
          </button>
          <h2 className="text-white font-black text-base">قصة جديدة</h2>
          <button
            onClick={handlePublish}
            disabled={loading || (storyType === "text" ? !text.trim() : !selectedFile)}
            className="text-sm font-black disabled:opacity-30 transition-all"
            style={{ color: "#a855f7" }}
          >
            {loading ? "جاري النشر..." : "نشر"}
          </button>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2 px-4 pb-3">
          {(["image", "video", "text"] as StoryType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setStoryType(t); setSelectedFile(null); setFilePreview(null); }}
              className="flex-1 py-2 rounded-2xl text-xs font-black transition-all active:scale-95"
              style={storyType === t ? {
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
                color: "white",
                boxShadow: "0 0 15px rgba(168,85,247,0.4)",
              } : {
                background: "rgba(255,255,255,0.05)",
                color: "#6b7280",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {t === "image" ? "📸 صورة" : t === "video" ? "🎥 فيديو" : "✏️ نص"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-4 pb-8 gap-4">
        {/* Media / Text Area */}
        {storyType === "text" ? (
          <div className="flex flex-col gap-4">
            {/* Text Preview */}
            <div
              className="w-full rounded-3xl flex items-center justify-center p-8 min-h-[300px] relative overflow-hidden"
              style={{ background: selectedBg }}
            >
              <p className="text-white font-black text-2xl text-center leading-relaxed break-words max-w-full" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                {text || "اكتب قصتك هنا..."}
              </p>
            </div>
            {/* Text Input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب نص قصتك..."
              maxLength={200}
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <div className="text-left text-gray-600 text-xs">{text.length}/200</div>
            {/* Background Picker */}
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2">اختر خلفية</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {TEXT_BACKGROUNDS.map((bg, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedBg(bg)}
                    className="flex-shrink-0 w-10 h-10 rounded-xl transition-all active:scale-90"
                    style={{
                      background: bg,
                      border: selectedBg === bg ? "3px solid white" : "2px solid transparent",
                      boxShadow: selectedBg === bg ? "0 0 12px rgba(255,255,255,0.4)" : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {filePreview ? (
              <div className="relative rounded-3xl overflow-hidden bg-black">
                {storyType === "video" ? (
                  <video src={filePreview} className="w-full max-h-[400px] object-cover" controls />
                ) : (
                  <img src={filePreview} alt="" className="w-full max-h-[400px] object-cover" />
                )}
                <button
                  onClick={() => { setSelectedFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 py-16 transition-all active:scale-98"
                style={{ borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.05)" }}
              >
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                  {storyType === "video"
                    ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                    : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" fill="#a855f7" /><polyline points="21 15 16 10 5 21" /></svg>
                  }
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-base">اضغط لاختيار {storyType === "video" ? "فيديو" : "صورة"}</p>
                  <p className="text-gray-500 text-xs mt-1">{storyType === "video" ? "MP4, MOV حتى 50 ميجابايت" : "JPG, PNG حتى 10 ميجابايت"}</p>
                </div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={storyType === "video" ? "video/*" : "image/*"}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Caption */}
        <div>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="أضف وصفاً (اختياري)..."
            maxLength={150}
            className="w-full rounded-2xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* VIP Notice */}
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)" }}>
          <span className="text-2xl">👑</span>
          <p className="text-yellow-400/80 text-xs leading-relaxed">نشر القصص متاح لأعضاء <strong>VIP 10</strong> وأعلى فقط</p>
        </div>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={loading || (storyType === "text" ? !text.trim() : !selectedFile)}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", boxShadow: "0 0 25px rgba(168,85,247,0.4)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري النشر...
            </span>
          ) : "نشر القصة ✨"}
        </button>
      </div>
    </div>
  );
}
