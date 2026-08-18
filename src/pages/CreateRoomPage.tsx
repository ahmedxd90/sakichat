import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";
import { ARAB_COUNTRIES } from "../data/countries";
import { Id } from "../../convex/_generated/dataModel";

interface CreateRoomPageProps {
  onBack: () => void;
  onSuccess: (roomId: Id<"rooms">) => void;
}

const SEAT_OPTIONS = [5, 10, 15, 20];

export default function CreateRoomPage({ onBack, onSuccess }: CreateRoomPageProps) {
  const createRoom = useMutation(api.rooms.createRoom);
  const generateUploadUrl = useMutation(api.rooms.generateRoomCoverUploadUrl);
  const profile = useQuery(api.profiles.getMyProfile);

  const [name, setName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [seats, setSeats] = useState(5);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isActive = profile?.isActive ?? false;
  const autoCountry = profile?.country ?? "";
  const countryInfo = ARAB_COUNTRIES.find((c) => c.code === autoCountry);
  const displayImage = coverPreview ?? profile?.avatarUrl ?? null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار صورة صالحة"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت"); return; }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("أدخل اسم الغرفة");
    if (!isActive) return toast.error("حسابك غير مفعّل");
    setLoading(true);
    try {
      let coverStorageId: Id<"_storage"> | undefined;
      if (coverFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": coverFile.type }, body: coverFile });
        const json = await result.json();
        if (!result.ok) throw new Error("فشل رفع الصورة");
        coverStorageId = json.storageId;
      }
      const roomId = await createRoom({
        name: name.trim(),
        country: autoCountry || "SA",
        coverStorageId,
      });
      toast.success("تم إنشاء الغرفة بنجاح! 🎉");
      onSuccess(roomId);
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{
        background: "#f8f9fd",
        fontFamily: "'Tajawal', 'Cairo', sans-serif",
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{
          background: "#ffffff",
          borderColor: "#eef0f7",
          boxShadow: "0 2px 12px rgba(71,118,230,0.07)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "#f0f3ff", border: "1px solid #e0e6ff" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4776E6" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <div>
            <h2 className="font-black text-lg leading-tight" style={{ color: "#222" }}>إنشاء غرفة</h2>
            <p className="text-xs font-semibold" style={{ color: "#8E54E9" }}>مجاني تماماً ✨</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">

        {/* تحذير الحساب */}
        {!isActive && profile && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#fff7ed", border: "1.5px solid #fed7aa" }}>
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-bold" style={{ color: "#c2410c" }}>حسابك غير مفعّل</p>
              <p className="text-xs mt-0.5" style={{ color: "#9a3412" }}>فعّل حسابك من الملف الشخصي أولاً</p>
            </div>
          </div>
        )}

        {/* البطاقة الرئيسية */}
        <div
          className="rounded-3xl p-6 flex flex-col items-center gap-5"
          style={{
            background: "#ffffff",
            boxShadow: "0 10px 40px rgba(71,118,230,0.1)",
            border: "1px solid #eef0f7",
          }}
        >
          {/* صورة الغرفة الدائرية */}
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full overflow-hidden cursor-pointer"
              style={{
                border: "4px solid #ffffff",
                boxShadow: "0 5px 20px rgba(71,118,230,0.25)",
                background: "#f0f3ff",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {displayImage ? (
                <img src={displayImage} alt="صورة الغرفة" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">🏠</span>
                </div>
              )}
            </div>
            {/* زر التغيير */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 left-1 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform font-black text-lg"
              style={{
                background: "linear-gradient(135deg,#4776E6,#8E54E9)",
                border: "3px solid #ffffff",
                color: "#fff",
                boxShadow: "0 2px 10px rgba(71,118,230,0.4)",
              }}
            >
              +
            </button>
            {coverPreview && (
              <button
                onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)", border: "1.5px solid #fff" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <p className="text-xs font-semibold" style={{ color: "#aaa" }}>
            {coverPreview ? "صورة مخصصة" : "صورتك الشخصية تلقائياً"}
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

          {/* اسم الغرفة */}
          <div className="w-full">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسم الغرفة..."
              maxLength={50}
              className="w-full text-center font-bold text-lg focus:outline-none transition-colors"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: name ? "2px solid #8E54E9" : "2px solid #eee",
                paddingBottom: "10px",
                color: "#222",
                fontFamily: "'Tajawal', sans-serif",
              }}
            />
          </div>

          {/* الدولة */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: "#f0f0f0" }}
          >
            <span className="text-sm">📍</span>
            <span className="text-sm font-semibold" style={{ color: "#666" }}>
              {countryInfo ? `${countryInfo.flag} ${countryInfo.name}` : "جاري التحديد..."}
            </span>
          </div>
        </div>

        {/* معلومات تلقائية */}
        <div
          className="rounded-3xl p-4 space-y-3"
          style={{ background: "#ffffff", boxShadow: "0 4px 20px rgba(71,118,230,0.07)", border: "1px solid #eef0f7" }}
        >
          {/* Room ID */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f0f3ff" }}>
                <span className="text-sm">🆔</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#555" }}>معرّف الغرفة</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl" style={{ background: "linear-gradient(135deg,#f0f3ff,#f5f0ff)", border: "1px solid #d0d8ff" }}>
              <span className="font-black text-sm" style={{ color: "#4776E6" }}>{profile?.sakiId ?? "—"}</span>
            </div>
          </div>

          <div style={{ height: 1, background: "#f0f0f0" }} />

          {/* المنشئ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#fdf0ff" }}>
                <span className="text-sm">👤</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#555" }}>المنشئ</span>
            </div>
            <span className="font-black text-sm" style={{ color: "#333" }}>{profile?.name ?? "—"}</span>
          </div>
        </div>

        {/* عدد المقاعد */}
        <div
          className="rounded-3xl p-4"
          style={{ background: "#ffffff", boxShadow: "0 4px 20px rgba(71,118,230,0.07)", border: "1px solid #eef0f7" }}
        >
          <p className="text-sm font-black mb-3" style={{ color: "#555" }}>عدد المقاعد:</p>
          <div className="grid grid-cols-4 gap-2">
            {SEAT_OPTIONS.map((s) => {
              const isSelected = seats === s;
              return (
                <button
                  key={s}
                  onClick={() => setSeats(s)}
                  className="py-3 rounded-2xl font-black text-base transition-all active:scale-95"
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg,#4776E6,#8E54E9)"
                      : "#f8f9fd",
                    border: isSelected ? "2px solid #4776E6" : "2px solid #eee",
                    color: isSelected ? "#fff" : "#777",
                    boxShadow: isSelected ? "0 5px 15px rgba(71,118,230,0.3)" : "none",
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* زر الإنشاء */}
      <div
        className="px-4 pb-8 pt-4 border-t"
        style={{ borderColor: "#eef0f7", background: "#ffffff" }}
      >
        <button
          onClick={handleCreate}
          disabled={loading || !isActive || !name.trim()}
          className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(to left,#4776E6,#8E54E9)",
            boxShadow: "0 10px 25px rgba(142,84,233,0.35)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري الإنشاء...
            </span>
          ) : "تأكيد الإنشاء"}
        </button>
        <p className="text-center text-xs mt-3 font-semibold" style={{ color: "#bbb" }}>يمكنك امتلاك غرفة واحدة فقط</p>
      </div>
    </div>
  );
}
