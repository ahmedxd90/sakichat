import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

interface Props {
  onClose: () => void;
}

export default function BannerUploadSheet({ onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = async () => "";
  const addBanner = async (args: any) => {};

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      await addBanner({ storageId, title: title || undefined });
      toast.success("تم رفع البنر بنجاح ✅");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-t-3xl p-5 space-y-4 animate-slide-up-sheet"
        style={{ background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.08)" }}
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-black text-lg">رفع بنر جديد</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Preview */}
        <div
          className="w-full rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer active:scale-98 transition-transform"
          style={{ aspectRatio: "16/6", background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(168,85,247,0.4)" }}
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-sm font-bold">اضغط لاختيار صورة</p>
              <p className="text-xs">JPG, PNG, GIF, WebP</p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,.gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {/* Title */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان البنر (اختياري)"
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", boxShadow: "0 8px 30px rgba(168,85,247,0.4)" }}
        >
          {uploading ? "جاري الرفع..." : "رفع البنر 🖼️"}
        </button>
      </div>
    </div>
  );
}
