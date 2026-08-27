// @ts-nocheck
import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useProfile } from "../components/ProfileManager";
import { useEffect } from "react";
import { toast } from "../lib/toast";

interface CreateMomentPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\u0600-\u06FFa-zA-Z0-9_]+/g) ?? [];
  return [...new Set(matches.map((h) => h.slice(1)))];
}

export default function CreateMomentPage({ onBack, onSuccess }: CreateMomentPageProps) {
  const { profile } = useProfile();
  const [myFriends, setMyFriends] = useState<any[]>([]);
  const isPro1 = Boolean(profile?.is_vip && Number(profile?.vip_level ?? 0) >= 1);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('friends').select('*, friend_profile:profiles(*)');
      setMyFriends(data || []);
    };
    fetchData();
  }, []);

  const createMoment = async (args: any) => {};
  const generateUploadUrl = async () => "";
  const generateCaption = async (args: any) => "";

  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "friends">("public");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hashtags = extractHashtags(content);

  const handleAiCaption = async () => {
    setAiLoading(true);
    try {
      const result = await generateCaption({ hint: content.trim() || undefined });
      setContent(result ?? "");
      toast.success("تم توليد التعليق ✨");
    } catch {
      toast.error("فشل توليد التعليق");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    
    const newFiles = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(newFiles);
    
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeFile = (idx: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(idx, 1);
    setSelectedFiles(newFiles);
    
    const newPreviews = [...previews];
    newPreviews.splice(idx, 1);
    setPreviews(newPreviews);
  };

  const handlePublish = async () => {
    if (!isPro1) {
      toast.error("نشر المنشورات متاح لأعضاء PRO1 فأعلى فقط");
      return;
    }
    if (!content.trim() && selectedFiles.length === 0) {
      return toast.error("أضف نصاً أو صورة للمنشور");
    }
    setLoading(true);
    try {
      const imageStorageIds = [];
      
      for (const file of selectedFiles) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error("فشل رفع إحدى الصور");
        const { storageId } = await result.json();
        imageStorageIds.push(storageId);
      }

      await createMoment({
        content: content.trim(),
        imageStorageIds,
        hashtags,
        visibility,
      });
      
      toast.success("تم نشر اللحظة! ✨");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء النشر");
    } finally {
      setLoading(false);
    }
  };

  if (profile && !isPro1) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6 text-center font-cairo" dir="rtl">
        <button onClick={onBack} className="absolute right-4 top-4 rounded-full bg-gray-100 px-4 py-2 text-gray-500">رجوع</button>
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-pink-100 text-4xl">✦</div>
        <h2 className="text-xl font-black text-gray-800">النشر متاح لأعضاء PRO1</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">ارفع مستوى PRO إلى PRO1 أو أعلى حتى تتمكن من نشر المنشورات واللحظات.</p>
        <button onClick={onBack} className="mt-6 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 px-8 py-3 font-black text-white shadow-md">حسنًا</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white font-cairo" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="text-gray-500 text-xl p-1 active:scale-90 transition-transform">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        
        <button
          onClick={handlePublish}
          disabled={loading || (!content.trim() && selectedFiles.length === 0)}
          className={`px-6 py-1.5 rounded-full font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
            loading || (!content.trim() && selectedFiles.length === 0)
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#5ce1e6] to-[#3dbda7] text-white active:scale-95 shadow-md"
          }`}
        >
          <span>{loading ? "جاري النشر..." : "نشر"}</span>
          {!loading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Topic / Hashtag Guide */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#3dbda7] font-bold text-sm">
            <div className="w-6 h-6 rounded-full bg-[#3dbda7]/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 21"/></svg>
            </div>
            <span>إضافة موضوع</span>
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed">
            تؤدي إضافة مواضيع ذي صلة إلى زيادة فرص ترشيحك ضمن المقترحة.
          </p>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="شارِك لحظاتك وشغفك اليوم..."
            className="w-full h-32 text-gray-800 placeholder-gray-300 resize-none focus:outline-none text-base leading-relaxed"
            maxLength={500}
          />
          <div className="absolute bottom-0 left-0 flex items-center gap-2">
             <button 
              onClick={handleAiCaption} 
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all bg-gray-50 text-gray-500 border border-gray-100 hover:border-cyan-200"
            >
              {aiLoading ? <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /> : "✨ ذكاء اصطناعي"}
            </button>
            <span className="text-[10px] text-gray-300">{content.length}/500</span>
          </div>
        </div>

        {/* Image Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {previews.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeFile(idx)}
                  className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm active:scale-90 transition-transform"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
            
            {previews.length < 5 && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:bg-gray-100 hover:border-gray-200"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                </div>
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400">يمكنك إرفاق حتى 5 صور (تم تحديد {previews.length}/5)</p>
        </div>

        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={handleFileSelect} 
          className="hidden" 
        />
      </div>

      {/* Footer Tools */}
      <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-6 text-gray-400">
          <button onClick={() => fileInputRef.current?.click()} className="active:scale-90 transition-transform hover:text-[#5ce1e6]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <button className="active:scale-90 transition-transform hover:text-[#5ce1e6]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
          <button className="active:scale-90 transition-transform hover:text-[#5ce1e6]">
            <span className="font-bold text-lg">@</span>
          </button>
        </div>

        <button 
          onClick={() => setVisibility(v => v === "public" ? "friends" : "public")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500 text-xs font-bold active:scale-95 transition-all"
        >
          <span>{visibility === "public" ? "عام" : "للأصدقاء"}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {visibility === "public" ? (
              <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>
            ) : (
              <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
