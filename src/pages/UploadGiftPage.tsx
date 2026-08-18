import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";
import SVGAPlayer from "../components/SVGAPlayer";

interface UploadGiftPageProps {
  onBack: () => void;
}

const CATEGORIES = [
  { id: "general", label: "عامة", emoji: "✨" },
  { id: "celebrities", label: "مشاهير", emoji: "⭐" },
  { id: "cp", label: "CP", emoji: "💑" },
  { id: "countries", label: "الدول", emoji: "🌍" },
  { id: "luck", label: "الحظ", emoji: "🍀" },
  { id: "horoscope", label: "أبراج", emoji: "♈" },
  { id: "comedy", label: "فكاهة", emoji: "😂" },
  { id: "events", label: "الفعاليات", emoji: "⭐" },
];

const MEDIA_TYPES = [
  { id: "video", label: "فيديو MP4", emoji: "🎬", accept: "video/mp4", maxSize: 50, ext: "MP4" },
  { id: "gif", label: "GIF متحرك", emoji: "🖼️", accept: "image/gif", maxSize: 10, ext: "GIF" },
  { id: "image", label: "صورة", emoji: "📷", accept: "image/png,image/jpeg,image/webp", maxSize: 10, ext: "PNG/JPG" },
  { id: "svga", label: "SVGA متحرك", emoji: "✨", accept: ".svga", maxSize: 20, ext: "SVGA" },
];

export default function UploadGiftPage({ onBack }: UploadGiftPageProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("general");
  const [mediaType, setMediaType] = useState("video");
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isWeeklyStarGift, setIsWeeklyStarGift] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [soundFile, setSoundFile] = useState<File | null>(null);
  const [soundName, setSoundName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);

  // @ts-ignore
  const generateUploadUrl = useMutation(api.rooms.generateUploadUrl);
  // @ts-ignore
  const createCustomGift = useMutation(api.rooms.createCustomGift);

  const currentMediaType = MEDIA_TYPES.find((m) => m.id === mediaType)!;

  const handleMediaTypeChange = (type: string) => {
    setMediaType(type);
    setMediaFile(null);
    setMediaPreview(null);
    setVideoDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = currentMediaType.maxSize * 1024 * 1024;
    if (file.size > maxBytes) { toast.error(`حجم الملف يجب أن يكون أقل من ${currentMediaType.maxSize} ميجابايت`); return; }
    if (mediaType === "video" && file.type !== "video/mp4") { toast.error("يرجى اختيار ملف MP4 فقط"); return; }
    if (mediaType === "gif" && file.type !== "image/gif") { toast.error("يرجى اختيار ملف GIF فقط"); return; }
    if (mediaType === "image" && !file.type.startsWith("image/")) { toast.error("يرجى اختيار ملف صورة"); return; }
    if (mediaType === "svga" && !file.name.toLowerCase().endsWith(".svga")) { toast.error("يرجى اختيار ملف SVGA فقط"); return; }
    setMediaPreview(URL.createObjectURL(file));
    setMediaFile(file);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار صورة"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت"); return; }
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbnailFile(file);
  };

  const handleSoundSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { toast.error("يرجى اختيار ملف صوتي"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("حجم الصوت يجب أن يكون أقل من 10 ميجابايت"); return; }
    setSoundFile(file);
    setSoundName(file.name);
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setVideoDuration(dur);
      if (dur > 15) {
        toast.error("مدة الفيديو يجب أن تكون 15 ثانية أو أقل");
        setMediaFile(null); setMediaPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("أدخل اسم الهدية"); return; }
    const priceNum = parseInt(price);
    if (!priceNum || priceNum < 1) { toast.error("أدخل سعراً صحيحاً"); return; }
    if (!mediaFile) { toast.error("اختر ملف الهدية"); return; }
    if (mediaType === "video" && videoDuration > 15) { toast.error("مدة الفيديو يجب أن تكون 15 ثانية أو أقل"); return; }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      // For SVGA, use application/octet-stream since browser may not know the MIME type
      const contentType = mediaType === "svga" ? "application/octet-stream" : mediaFile.type;
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": contentType }, body: mediaFile });
      if (!res.ok) throw new Error("فشل رفع الملف");
      const { storageId } = await res.json();

      let thumbnailStorageId: string | undefined;
      if (thumbnailFile) {
        const thumbUrl = await generateUploadUrl();
        const thumbRes = await fetch(thumbUrl, { method: "POST", headers: { "Content-Type": thumbnailFile.type }, body: thumbnailFile });
        if (thumbRes.ok) { const { storageId: tid } = await thumbRes.json(); thumbnailStorageId = tid; }
      }

      let soundStorageId: string | undefined;
      if (soundFile) {
        const sUrl = await generateUploadUrl();
        const sRes = await fetch(sUrl, { method: "POST", headers: { "Content-Type": soundFile.type }, body: soundFile });
        if (sRes.ok) { const { storageId: sid } = await sRes.json(); soundStorageId = sid; }
      }

      const finalCategory = isWeeklyStarGift ? "events" : category;

      await createCustomGift({
        name: name.trim(), price: priceNum, videoStorageId: storageId,
        thumbnailStorageId: thumbnailStorageId as any,
        soundStorageId: soundStorageId as any,
        category: finalCategory, mediaType, showFullScreen,
      });
      toast.success("تم إضافة الهدية بنجاح! 🎉");
      onBack();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  };

  const isValid = name.trim() && parseInt(price) > 0 && mediaFile && (mediaType !== "video" || videoDuration <= 15);

  return (
    <div className="h-screen bg-[#0f0f1a] flex flex-col" dir="rtl">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-white/10">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
        <h1 className="text-white font-bold text-lg">رفع هدية مخصصة</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        {/* Weekly Star Gift Toggle */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,140,0,0.05))", border: "1px solid rgba(255,215,0,0.3)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 font-black text-sm">⭐ هدية النجمة الأسبوعية</p>
              <p className="text-gray-500 text-xs mt-0.5">تُحتسب في فعالية النجمة الأسبوعية</p>
            </div>
            <button
              onClick={() => {
                setIsWeeklyStarGift(!isWeeklyStarGift);
                if (!isWeeklyStarGift) setCategory("events");
              }}
              className={`w-12 h-6 rounded-full transition-all relative ${isWeeklyStarGift ? "bg-yellow-500" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isWeeklyStarGift ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
          {isWeeklyStarGift && (
            <div className="mt-3 flex items-center gap-2 bg-yellow-500/10 rounded-xl px-3 py-2">
              <span className="text-yellow-400 text-sm">✅</span>
              <p className="text-yellow-400 text-xs font-bold">سيتم تصنيف هذه الهدية تلقائياً في فئة الفعاليات</p>
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <p className="text-gray-400 text-sm font-medium mb-3">فئة الهدية</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl border transition-all ${
                  category === cat.id
                    ? "border-yellow-500 bg-yellow-500/20 text-yellow-300"
                    : "border-white/10 bg-white/5 text-gray-400"
                }`}>
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-xs font-bold">{cat.label}</span>
                {cat.id === "events" && (
                  <span className="text-[8px] px-1 py-0.5 rounded font-black bg-yellow-500/30 text-yellow-400">نجمة</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Media Type */}
        <div>
          <p className="text-gray-400 text-sm font-medium mb-3">نوع الهدية</p>
          <div className="grid grid-cols-4 gap-2">
            {MEDIA_TYPES.map((mt) => (
              <button key={mt.id} onClick={() => handleMediaTypeChange(mt.id)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                  mediaType === mt.id
                    ? mt.id === "svga" ? "border-pink-500 bg-pink-500/20" : "border-purple-500 bg-purple-500/20"
                    : "border-white/10 bg-white/5"
                }`}>
                <span className="text-2xl">{mt.emoji}</span>
                <span className={`text-[10px] font-bold ${mediaType === mt.id ? (mt.id === "svga" ? "text-pink-300" : "text-purple-300") : "text-gray-400"}`}>{mt.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                  mediaType === mt.id
                    ? mt.id === "svga" ? "bg-pink-500/30 text-pink-300" : "bg-purple-500/30 text-purple-300"
                    : "bg-white/5 text-gray-500"
                }`}>{mt.ext}</span>
              </button>
            ))}
          </div>
          {mediaType === "svga" && (
            <div className="mt-2 rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.25)" }}>
              <span className="text-pink-400 text-sm">✨</span>
              <p className="text-pink-300 text-xs">ملفات SVGA تدعم الرسوم المتحركة عالية الجودة مع شفافية كاملة</p>
            </div>
          )}
        </div>

        {/* Show Full Screen toggle */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5">
          <div>
            <p className="text-white text-sm font-bold">عرض في الشاشة الكاملة 📺</p>
            <p className="text-gray-500 text-xs mt-0.5">تظهر الهدية شفافة على كامل الشاشة</p>
          </div>
          <button onClick={() => setShowFullScreen(!showFullScreen)}
            className={`w-12 h-6 rounded-full transition-all relative ${showFullScreen ? "bg-purple-500" : "bg-white/10"}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${showFullScreen ? "right-0.5" : "left-0.5"}`} />
          </button>
        </div>

        {/* Sound upload */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-purple-300 text-sm font-bold">🎵 موسيقى الهدية (اختياري)</p>
              <p className="text-gray-500 text-xs mt-0.5">يُشغَّل الصوت تلقائياً عند إرسال الهدية</p>
            </div>
            {soundName && (
              <button
                onClick={() => { setSoundFile(null); setSoundName(null); if (soundInputRef.current) soundInputRef.current.value = ""; }}
                className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          {soundName ? (
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 mt-2">
              <span className="text-2xl">🔊</span>
              <span className="text-white text-sm flex-1 truncate">{soundName}</span>
              <span className="text-purple-400 text-xs font-bold">✅ محدد</span>
            </div>
          ) : (
            <button onClick={() => soundInputRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed border-purple-500/40 text-purple-400 text-sm font-bold flex items-center justify-center gap-2 mt-2">
              <span>🎵</span> اختر ملف صوتي MP3 (اختياري)
            </button>
          )}
          <input ref={soundInputRef} type="file" accept="audio/*" className="hidden" onChange={handleSoundSelect} />
        </div>

        {/* Media Upload */}
        <div>
          <p className="text-gray-400 text-sm font-medium mb-3">
            {mediaType === "video" ? "فيديو MP4 (حد أقصى 15 ثانية)"
              : mediaType === "gif" ? "صورة GIF متحركة"
              : mediaType === "svga" ? "ملف SVGA متحرك ✨"
              : "صورة الهدية"}
          </p>
          {mediaPreview ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
              {mediaType === "video" ? (
                <video ref={videoRef} src={mediaPreview} className="w-full h-full object-contain" controls onLoadedMetadata={handleVideoLoaded} playsInline />
              ) : mediaType === "svga" ? (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "#111" }}>
                  <SVGAPlayer
                    src={mediaPreview}
                    width={280}
                    height={280}
                    style={{ width: 280, height: 280 }}
                    loop={true}
                  />
                </div>
              ) : (
                <img src={mediaPreview} alt="معاينة" className="w-full h-full object-contain" />
              )}
              <button onClick={() => { setMediaFile(null); setMediaPreview(null); setVideoDuration(0); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="absolute top-2 left-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
              {mediaType === "video" && videoDuration > 0 && (
                <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-bold ${videoDuration > 15 ? "bg-red-500" : "bg-green-500"}`}>
                  {videoDuration.toFixed(1)}ث
                </div>
              )}
              {mediaType === "svga" && (
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-bold bg-pink-500">
                  ✨ SVGA
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 bg-white/3 active:bg-white/5 transition-colors"
              style={{ borderColor: mediaType === "svga" ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.2)" }}>
              <span className="text-4xl">{currentMediaType.emoji}</span>
              <div className="text-center">
                <p className="text-white text-sm font-bold">اضغط لاختيار {currentMediaType.label}</p>
                <p className="text-gray-500 text-xs mt-1">الحد الأقصى: {currentMediaType.maxSize} ميجابايت</p>
                {mediaType === "svga" && (
                  <p className="text-pink-400 text-xs mt-1">✨ يدعم الرسوم المتحركة الشفافة</p>
                )}
              </div>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={mediaType === "svga" ? ".svga,application/octet-stream" : currentMediaType.accept}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Thumbnail */}
        <div>
          <p className="text-gray-400 text-sm font-medium mb-3">
            صورة مصغرة {mediaType === "svga" ? "(مطلوبة للـ SVGA)" : "(اختياري)"}
          </p>
          {thumbnailPreview ? (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden">
              <img src={thumbnailPreview} alt="thumbnail" className="w-full h-full object-cover" />
              <button onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); if (thumbInputRef.current) thumbInputRef.current.value = ""; }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <button onClick={() => thumbInputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 bg-white/3">
              <span className="text-2xl">🖼️</span>
              <span className="text-gray-500 text-[10px]">صورة</span>
            </button>
          )}
          <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
        </div>

        {/* Name */}
        <div>
          <p className="text-gray-400 text-sm font-medium mb-2">اسم الهدية</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: قلب ذهبي"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500" />
        </div>

        {/* Price */}
        <div>
          <p className="text-gray-400 text-sm font-medium mb-2">السعر (عملات ذهبية)</p>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="مثال: 1000"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500" />
        </div>

        {/* Save button */}
        <button onClick={handleSave} disabled={!isValid || uploading}
          className="w-full py-4 rounded-2xl text-black font-black text-base disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow: "0 4px 20px rgba(251,191,36,0.4)" }}>
          {uploading ? (
            <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /><span>جاري الرفع...</span></>
          ) : (
            <><span>💾</span><span>حفظ الهدية</span></>
          )}
        </button>
      </div>
    </div>
  );
}
