import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";
import { ARAB_COUNTRIES } from "../data/countries";

interface EditProfilePageProps {
  onBack: () => void;
}

export default function EditProfilePage({ onBack }: EditProfilePageProps) {
  const profile = useQuery(api.profiles.getMyProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const generateAvatarUploadUrl = useMutation(api.profiles.generateAvatarUploadUrl);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);

  if (profile && !initialized) {
    setName(profile.name);
    setBio(profile.bio ?? "");
    setInitialized(true);
  }

  const isVip = profile?.isVip ?? false;
  const vipLevel = profile?.vipLevel ?? 0;
  const canUploadGif = isVip && vipLevel >= 8;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isGif = file.type === "image/gif";
    if (isGif && !canUploadGif) {
      toast.error("رفع صور GIF متاح لـ VIP8 وأعلى فقط 👑");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 10 ميجابايت");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("أدخل اسمك");
    setLoading(true);
    try {
      let avatarStorageId = undefined;
      if (selectedFile) {
        const uploadUrl = await generateAvatarUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        if (!result.ok) throw new Error("فشل رفع الصورة");
        const { storageId } = await result.json();
        avatarStorageId = storageId;
      }
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatarStorageId,
      });
      toast.success("تم تحديث الملف الشخصي ✅");
      onBack();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const currentAvatar = avatarPreview || profile?.avatarUrl;
  const gender = profile?.gender;
  const defaultAvatar = gender === "female"
    ? "https://api.dicebear.com/7.x/avataaars/svg?seed=female&backgroundColor=b6e3f4"
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=male&backgroundColor=c0aede";

  const countryInfo = ARAB_COUNTRIES.find(c => c.code === profile?.country);

  if (!profile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #0b2a5b 0%, #1aa6a6 100%)" }}>
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      dir="rtl"
      style={{
        background: "linear-gradient(180deg, #0b2a5b 0%, #1aa6a6 100%)",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-white font-black text-lg">تعديل الملف الشخصي</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-sm font-black px-4 py-2 rounded-full transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "#FFD400", color: "#000" }}
        >
          {loading ? "..." : "حفظ"}
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 pb-10">

        {/* ── Avatar ── */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="relative cursor-pointer"
            onClick={() => setShowSheet(true)}
            style={{ width: 110, height: 110 }}
          >
            <div style={{
              width: 110, height: 110, borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid rgba(255,255,255,0.85)",
              boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
              background: "rgba(255,255,255,0.15)",
            }}>
              <img
                src={currentAvatar || defaultAvatar}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLImageElement).src = defaultAvatar; }}
              />
            </div>
            {/* Camera icon */}
            <div style={{
              position: "absolute", bottom: 4, left: 4,
              width: 30, height: 30, borderRadius: "50%",
              background: "#FFD400",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              border: "2px solid white",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            اضغط على الصورة لتغييرها
          </p>
          {canUploadGif && (
            <span className="text-xs px-3 py-1 rounded-full font-bold"
              style={{ background: "rgba(255,212,0,0.2)", border: "1px solid rgba(255,212,0,0.4)", color: "#FFD400" }}>
              ✅ GIF متاح لك (VIP8+)
            </span>
          )}
        </div>

        {/* ── Name ── */}
        <div>
          <label className="text-xs font-black mb-2 block" style={{ color: "rgba(255,255,255,0.7)" }}>
            الاسم *
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="أدخل اسمك"
            maxLength={30}
            className="w-full px-5 py-4 text-gray-800 text-sm focus:outline-none"
            style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none" }}
          />
        </div>

        {/* ── Bio ── */}
        <div>
          <label className="text-xs font-black mb-2 block" style={{ color: "rgba(255,255,255,0.7)" }}>
            نبذة عنك
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="اكتب نبذة مختصرة عنك..."
            rows={3}
            maxLength={150}
            className="w-full px-5 py-4 text-gray-800 text-sm focus:outline-none resize-none"
            style={{ borderRadius: 20, background: "rgba(255,255,255,0.92)", border: "none" }}
          />
          <p className="text-xs mt-1 text-left" style={{ color: "rgba(255,255,255,0.35)" }}>
            {bio.length}/150
          </p>
        </div>

        {/* ── Gender (read-only) ── */}
        <div>
          <label className="text-xs font-black mb-2 block" style={{ color: "rgba(255,255,255,0.7)" }}>
            الجنس
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "male", label: "ذكر", icon: "♂" },
              { value: "female", label: "أنثى", icon: "♀" },
            ].map(g => (
              <div
                key={g.value}
                className="py-3 rounded-full text-sm font-black flex items-center justify-center gap-2"
                style={gender === g.value ? {
                  background: "rgba(255,255,255,0.92)",
                  color: "#0b2a5b",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                } : {
                  background: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <span style={{ fontSize: 16 }}>{g.icon}</span>
                <span>{g.label}</span>
                {gender === g.value && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-black"
                    style={{ background: "rgba(11,42,91,0.12)", color: "#0b2a5b", fontSize: 9 }}>
                    🔒
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            لا يمكن تغيير الجنس بعد التسجيل
          </p>
        </div>

        {/* ── Country (read-only) ── */}
        <div>
          <label className="text-xs font-black mb-2 block" style={{ color: "rgba(255,255,255,0.7)" }}>
            الدولة
          </label>
          <div
            className="w-full px-5 py-4 text-sm flex items-center gap-3"
            style={{
              borderRadius: 30,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <span style={{ fontSize: 22 }}>{countryInfo?.flag ?? "🌍"}</span>
            <span className="font-bold">{countryInfo?.name ?? profile?.country ?? "غير محدد"}</span>
            <span className="mr-auto text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
              🔒 ثابت
            </span>
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            لا يمكن تغيير الدولة بعد التسجيل
          </p>
        </div>

        {/* ── Save Button ── */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 font-black text-black text-base transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: "#FFD400", borderRadius: 30, boxShadow: "0 4px 20px rgba(255,212,0,0.4)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              جارٍ الحفظ...
            </span>
          ) : "حفظ التغييرات 💾"}
        </button>
      </div>

      {/* ── Hidden file inputs ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={gifInputRef}
        type="file"
        accept="image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ── Bottom Sheet ── */}
      {showSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setShowSheet(false)}
        >
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
          <div
            className="relative rounded-t-3xl overflow-hidden"
            style={{ background: "#fff" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "#e5e7eb" }} />
            </div>
            <p className="text-center font-black text-gray-700 py-3 text-base border-b border-gray-100">
              تغيير الصورة
            </p>

            <button
              className="w-full py-4 text-center font-bold text-gray-800 text-sm border-b border-gray-100 active:bg-gray-50"
              onClick={() => { fileInputRef.current?.click(); setShowSheet(false); }}
            >
              📷 اختيار صورة عادية
            </button>

            <button
              className="w-full py-4 text-center font-bold text-sm border-b border-gray-100 active:bg-gray-50"
              style={{ color: canUploadGif ? "#f59e0b" : "#9ca3af" }}
              onClick={() => {
                if (!canUploadGif) {
                  toast.error("رفع GIF متاح لـ VIP8 وأعلى فقط 👑");
                  setShowSheet(false);
                  return;
                }
                gifInputRef.current?.click();
                setShowSheet(false);
              }}
            >
              🎞️ اختيار GIF {!canUploadGif && "(VIP8+ فقط)"}
            </button>

            <button
              className="w-full py-4 text-center font-bold text-red-400 text-sm active:bg-gray-50"
              onClick={() => setShowSheet(false)}
            >
              إلغاء
            </button>
            <div style={{ height: "env(safe-area-inset-bottom, 16px)" }} />
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}
