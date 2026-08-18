// @ts-nocheck
// تبويب إدارة إعلانات الشاشة الكاملة
import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";

export default function AdminSplashAdTab() {
  const ads = useQuery(api.splashAds.getAllSplashAds) ?? [];
  const generateUploadUrl = useMutation(api.splashAds.generateSplashAdUploadUrl);
  const createAd = useMutation(api.splashAds.createSplashAd);
  const toggleAd = useMutation(api.splashAds.toggleSplashAd);
  const deleteAd = useMutation(api.splashAds.deleteSplashAd);

  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(5);
  const [mediaType, setMediaType] = useState<"image" | "gif">("image");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("الحجم الأقصى 20 ميجابايت"); return; }
    const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
    setMediaType(isGif ? "gif" : "image");
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error("اختر صورة أو GIF أولاً"); return; }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      const { storageId } = await result.json();
      await createAd({
        imageStorageId: storageId,
        mediaType,
        title: title.trim() || undefined,
        durationSeconds: duration,
      });
      toast.success("تم رفع الإعلان بنجاح ✅");
      setSelectedFile(null);
      setPreview(null);
      setTitle("");
      setDuration(5);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message ?? "فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-5">
      {/* رفع إعلان جديد */}
      <div
        className="rounded-2xl p-4 space-y-4"
        style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}
      >
        <h3 className="text-white font-black text-sm flex items-center gap-2">
          <span className="text-lg">📢</span> رفع إعلان جديد
        </h3>

        {/* اختيار الملف */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.2)", color: "#a78bfa" }}
          >
            {selectedFile ? `✅ ${selectedFile.name}` : "📁 اختر صورة أو GIF"}
          </button>
        </div>

        {/* معاينة */}
        {preview && (
          <div className="rounded-xl overflow-hidden" style={{ maxHeight: 200 }}>
            <img src={preview} alt="معاينة" className="w-full h-full object-cover" />
          </div>
        )}

        {/* العنوان */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">عنوان الإعلان (اختياري)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: عرض خاص لعيد الفطر..."
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* مدة الظهور */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">مدة الظهور: {duration} ثانية</label>
          <input
            type="range"
            min={3}
            max={15}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3 ث</span>
            <span>15 ث</span>
          </div>
        </div>

        {/* نوع الوسائط */}
        <div className="flex gap-2">
          {(["image", "gif"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMediaType(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={mediaType === t
                ? { background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.6)", color: "#c4b5fd" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
              }
            >
              {t === "image" ? "🖼️ صورة ثابتة" : "🎞️ صورة GIF"}
            </button>
          ))}
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="w-full py-3 rounded-xl font-black text-sm text-white disabled:opacity-40 active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 15px rgba(124,58,237,0.4)" }}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جارٍ الرفع...
            </span>
          ) : "رفع الإعلان"}
        </button>
      </div>

      {/* قائمة الإعلانات */}
      <div>
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2">
          <span>📋</span> الإعلانات ({ads.length})
        </h3>
        {ads.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">لا توجد إعلانات بعد</div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <div
                key={ad._id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: ad.isActive ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${ad.isActive ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {/* صورة مصغرة */}
                {ad.imageUrl && (
                  <div style={{ height: 120, overflow: "hidden" }}>
                    <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-bold text-sm">{ad.title || "بدون عنوان"}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {ad.mediaType === "gif" ? "🎞️ GIF" : "🖼️ صورة"} • {ad.durationSeconds ?? 5} ثانية
                      </p>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded-full text-xs font-black"
                      style={ad.isActive
                        ? { background: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.4)" }
                        : { background: "rgba(107,114,128,0.2)", color: "#9ca3af", border: "1px solid rgba(107,114,128,0.3)" }
                      }
                    >
                      {ad.isActive ? "● نشط" : "○ معطل"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAd({ adId: ad._id, isActive: !ad.isActive }).then(() => toast.success(ad.isActive ? "تم إيقاف الإعلان" : "تم تفعيل الإعلان ✅")).catch((e) => toast.error(e.message))}
                      className="flex-1 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                      style={ad.isActive
                        ? { background: "rgba(107,114,128,0.15)", border: "1px solid rgba(107,114,128,0.3)", color: "#9ca3af" }
                        : { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }
                      }
                    >
                      {ad.isActive ? "إيقاف" : "تفعيل"}
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm("هل تريد حذف هذا الإعلان؟")) return;
                        deleteAd({ adId: ad._id }).then(() => toast.success("تم الحذف")).catch((e) => toast.error(e.message));
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
