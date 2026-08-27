// @ts-nocheck
import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useEffect } from "react";
import { toast } from "../lib/toast";

interface UploadEmojiPageProps {
  onBack: () => void;
}

type EmojiTab = "normal" | "vip";

export default function UploadEmojiPage({ onBack }: UploadEmojiPageProps) {
  const [emojis, setEmojis] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('room_emojis').select('*').order('created_at', { ascending: false });
      setEmojis(data || []);
    };
    fetchData();
  }, []);

  const generateUploadUrl = async () => "";
  const createRoomEmoji = async (args: any) => {};
  const createVipEmoji = async (args: any) => {};
  const deleteRoomEmoji = async (args: any) => {};

  const [activeTab, setActiveTab] = useState<EmojiTab>("normal");

  // Normal emoji state
  const [name, setName] = useState("");
  const [isVipOnly, setIsVipOnly] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // VIP emoji state
  const [vipName, setVipName] = useState("");
  const [svgaFile, setSvgaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingVip, setUploadingVip] = useState(false);
  const svgaInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const normalEmojis = emojis?.filter((e) => e.emojiType !== "vip") ?? [];
  const vipEmojis = emojis?.filter((e) => e.emojiType === "vip") ?? [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الملف يجب أن يكون أقل من 5 ميجابايت"); return; }
    if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار ملف صورة (PNG, JPG, GIF, WEBP)"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSvgaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("حجم ملف SVGA يجب أن يكون أقل من 20 ميجابايت"); return; }
    setSvgaFile(file);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار صورة PNG"); return; }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const uploadFile = async (file: File) => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) throw new Error("فشل رفع الملف");
    const { storageId } = await res.json();
    return storageId;
  };

  const handleSaveNormal = async () => {
    if (!name.trim()) { toast.error("أدخل اسم الإيموجي"); return; }
    if (!imageFile) { toast.error("اختر صورة الإيموجي"); return; }
    setUploading(true);
    try {
      const storageId = await uploadFile(imageFile);
      await createRoomEmoji({ name: name.trim(), imageStorageId: storageId, isVipOnly });
      toast.success("تم إضافة الإيموجي بنجاح! 🎉");
      setName(""); setIsVipOnly(false); setImageFile(null); setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveVip = async () => {
    if (!vipName.trim()) { toast.error("أدخل اسم الإيموجي VIP"); return; }
    if (!svgaFile) { toast.error("اختر ملف SVGA"); return; }
    if (!thumbnailFile) { toast.error("اختر صورة مصغرة PNG"); return; }
    setUploadingVip(true);
    try {
      const svgaStorageId = await uploadFile(svgaFile);
      const thumbnailStorageId = await uploadFile(thumbnailFile);
      await createVipEmoji({ name: vipName.trim(), svgaStorageId, thumbnailStorageId });
      toast.success("تم إضافة إيموجي VIP بنجاح! 👑");
      setVipName(""); setSvgaFile(null); setThumbnailFile(null); setThumbnailPreview(null);
      if (svgaInputRef.current) svgaInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setUploadingVip(false);
    }
  };

  const handleDelete = async (emojiId: string) => {
    if (!confirm("هل تريد حذف هذا الإيموجي؟")) return;
    setDeletingId(emojiId);
    try {
      await deleteRoomEmoji({ emojiId });
      toast.success("تم حذف الإيموجي");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-screen flex flex-col" dir="rtl" style={{ background: "linear-gradient(180deg, #0f0f1a 0%, #1a0a2e 100%)" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/8" style={{ background: "rgba(15,15,26,0.95)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">😄</span>
            <h1 className="text-white font-bold text-base">إدارة الإيموجي التفاعلي</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          <button
            onClick={() => setActiveTab("normal")}
            className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all"
            style={activeTab === "normal"
              ? { background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "white" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }}
          >
            😄 إيموجي عادي
          </button>
          <button
            onClick={() => setActiveTab("vip")}
            className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all"
            style={activeTab === "vip"
              ? { background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#000" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }}
          >
            👑 إيموجي VIP
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {activeTab === "normal" ? (
          <>
            {/* Normal emoji upload form */}
            <div className="rounded-3xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="text-base">➕</span> إضافة إيموجي عادي جديد
              </h2>

              <div>
                <p className="text-gray-400 text-xs mb-2">صورة الإيموجي (PNG, JPG, GIF, WEBP)</p>
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-purple-500/50">
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-purple-500/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                    style={{ background: "rgba(168,85,247,0.05)" }}
                  >
                    <span className="text-2xl">🖼️</span>
                    <span className="text-purple-400 text-[10px] font-bold">اختر صورة</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-2">اسم الإيموجي</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: قلب، نجمة، ورد..."
                  maxLength={20}
                  className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              <div
                className="flex items-center justify-between rounded-2xl px-4 py-3.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div>
                  <p className="text-white text-sm font-bold flex items-center gap-2">
                    <span>👑</span> خاص بـ VIP5 وأعلى
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">فقط أعضاء VIP5+ يمكنهم استخدام هذا الإيموجي</p>
                </div>
                <button
                  onClick={() => setIsVipOnly(!isVipOnly)}
                  className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: isVipOnly ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    style={{ right: isVipOnly ? "2px" : undefined, left: isVipOnly ? undefined : "2px" }}
                  />
                </button>
              </div>

              <button
                onClick={handleSaveNormal}
                disabled={uploading || !name.trim() || !imageFile}
                className="w-full py-3.5 rounded-2xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", boxShadow: "0 4px 20px rgba(168,85,247,0.3)", color: "white" }}
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جارٍ الرفع...</>
                ) : (
                  <><span>✨</span>حفظ الإيموجي</>
                )}
              </button>
            </div>

            {/* Normal emojis list */}
            <div>
              <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <span>📋</span> الإيموجي العادية ({normalEmojis.length})
              </h2>
              {!emojis ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : normalEmojis.length === 0 ? (
                <div className="text-center py-8"><span className="text-4xl">😶</span><p className="text-gray-500 text-sm mt-2">لا توجد إيموجي عادية بعد</p></div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {normalEmojis.map((emoji) => (
                    <EmojiCard key={emoji.id} emoji={emoji} onDelete={handleDelete} deletingId={deletingId} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* VIP emoji upload form */}
            <div className="rounded-3xl p-5 space-y-4"
              style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="text-base">👑</span> إضافة إيموجي VIP جديد
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000" }}>VIP1+</span>
              </h2>

              <div className="rounded-2xl p-3 text-xs" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <p className="text-yellow-400 font-bold mb-1">📌 متطلبات إيموجي VIP:</p>
                <p className="text-gray-400">• ملف SVGA للأنيميشن (صيغة .svga)</p>
                <p className="text-gray-400">• صورة مصغرة PNG للمعاينة</p>
                <p className="text-gray-400">• يتطلب VIP1 أو أعلى للاستخدام</p>
              </div>

              {/* SVGA file */}
              <div>
                <p className="text-gray-400 text-xs mb-2">ملف الأنيميشن SVGA</p>
                <button
                  onClick={() => svgaInputRef.current?.click()}
                  className="w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{
                    borderColor: svgaFile ? "rgba(251,191,36,0.6)" : "rgba(251,191,36,0.25)",
                    background: svgaFile ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span className="text-xl">{svgaFile ? "✅" : "🎬"}</span>
                  <span className="text-sm font-bold" style={{ color: svgaFile ? "#fbbf24" : "#6b7280" }}>
                    {svgaFile ? svgaFile.name : "اختر ملف SVGA"}
                  </span>
                </button>
                <input ref={svgaInputRef} type="file" accept=".svga,application/octet-stream" className="hidden" onChange={handleSvgaSelect} />
              </div>

              {/* Thumbnail */}
              <div>
                <p className="text-gray-400 text-xs mb-2">صورة مصغرة PNG (للمعاينة)</p>
                {thumbnailPreview ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-yellow-500/50">
                      <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""; }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center"
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <p className="text-yellow-400 text-xs font-bold">✓ تم اختيار الصورة المصغرة</p>
                  </div>
                ) : (
                  <button
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-yellow-500/30 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                    style={{ background: "rgba(251,191,36,0.05)" }}
                  >
                    <span className="text-2xl">🖼️</span>
                    <span className="text-yellow-400 text-[10px] font-bold">صورة PNG</span>
                  </button>
                )}
                <input ref={thumbnailInputRef} type="file" accept="image/png,image/*" className="hidden" onChange={handleThumbnailSelect} />
              </div>

              {/* Name */}
              <div>
                <p className="text-gray-400 text-xs mb-2">اسم الإيموجي VIP</p>
                <input
                  value={vipName}
                  onChange={(e) => setVipName(e.target.value)}
                  placeholder="مثال: نجمة ذهبية، قلب ملكي..."
                  maxLength={20}
                  className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}
                />
              </div>

              {/* Preview */}
              {thumbnailPreview && vipName && (
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-yellow-500/30">
                    <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{vipName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000" }}>VIP1+ فقط</span>
                      {svgaFile && <span className="text-green-400 text-[10px] font-bold">✓ SVGA جاهز</span>}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveVip}
                disabled={uploadingVip || !vipName.trim() || !svgaFile || !thumbnailFile}
                className="w-full py-3.5 rounded-2xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#000" }}
              >
                {uploadingVip ? (
                  <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />جارٍ الرفع...</>
                ) : (
                  <><span>👑</span>حفظ إيموجي VIP</>
                )}
              </button>
            </div>

            {/* VIP emojis list */}
            <div>
              <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <span>👑</span> إيموجي VIP ({vipEmojis.length})
              </h2>
              {!emojis ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : vipEmojis.length === 0 ? (
                <div className="text-center py-8"><span className="text-4xl">👑</span><p className="text-gray-500 text-sm mt-2">لا توجد إيموجي VIP بعد</p></div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {vipEmojis.map((emoji) => (
                    <EmojiCard key={emoji.id} emoji={emoji} onDelete={handleDelete} deletingId={deletingId} isVip />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmojiCard({ emoji, onDelete, deletingId, isVip = false }: {
  emoji: any;
  onDelete: (id: any) => void;
  deletingId: any;
  isVip?: boolean;
}) {
  const previewUrl = emoji.thumbnailUrl || emoji.imageUrl;
  return (
    <div
      className="rounded-2xl p-3 flex flex-col items-center gap-2 relative"
      style={{
        background: isVip ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.04)",
        border: isVip ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Badge */}
      <div
        className="absolute top-1.5 right-1.5 text-[7px] font-black px-1 py-0.5 rounded-full"
        style={isVip
          ? { background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#000" }
          : emoji.isVipOnly
            ? { background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#000" }
            : { background: "rgba(52,211,153,0.2)", color: "#34d399" }}
      >
        {isVip ? "VIP1+" : emoji.isVipOnly ? "VIP5+" : "عام"}
      </div>

      {/* Animated badge for VIP */}
      {isVip && (
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[10px]">🎬</span>
        </div>
      )}

      <div className="w-16 h-16 rounded-xl overflow-hidden border" style={{ borderColor: isVip ? "rgba(251,191,36,0.3)" : "rgba(168,85,247,0.2)" }}>
        {previewUrl ? (
          <img src={previewUrl} alt={emoji.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <span className="text-2xl">{isVip ? "👑" : "😄"}</span>
          </div>
        )}
      </div>

      <span className="text-white text-[11px] font-bold text-center truncate w-full">{emoji.name}</span>

      <button
        onClick={() => onDelete(emoji.id)}
        disabled={deletingId === emoji.id}
        className="w-full py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95"
        style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
      >
        {deletingId === emoji.id ? "..." : "🗑️ حذف"}
      </button>
    </div>
  );
}
