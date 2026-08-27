// @ts-nocheck
import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useEffect } from "react";
import { toast } from "../lib/toast";
import SVGAPlayer, { isSvgaUrl } from "../components/SVGAPlayer";

type ItemType = "frame" | "entry" | "cp" | "bubble" | "seat_skin";
type FrameAccessType = "normal" | "cp" | "vip" | "aristocracy" | "superadmin";
type EntryAccessType = "normal" | "cp" | "vip" | "superadmin" | "aristocracy";

interface UploadStoreItemPageProps {
  onBack: () => void;
}

const PRIMARY = "#00d4c5";
const SEAT_PRIMARY = "#8b5cf6";

function UploadTypeIcon({ type, color = "#687686" }: { type: string; color?: string }) {
  const p = { width: 25, height: 25, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "entry") return <svg {...p}><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 11h5M10 15h5" /></svg>;
  if (type === "frame") return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="12" cy="12" r="4" /><path d="M8 4v3M16 4v3M4 8h3M17 8h3M4 16h3M17 16h3M8 20v-3M16 20v-3" /></svg>;
  if (type === "bubble") return <svg {...p}><path d="M4 6h16M4 12h11M4 18h7" /><circle cx="18" cy="17" r="3" /><path d="M18 15.5v1.7l1.2.8" /></svg>;
  if (type === "cp") return <svg {...p}><circle cx="8" cy="12" r="4" /><circle cx="16" cy="12" r="4" /><path d="M10.8 9.2l2.4 5.6M13.2 9.2l-2.4 5.6" /></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M8 12h8M12 8v8" /></svg>;
}

const TYPE_CONFIG: { id: ItemType; label: string; icon: string; accept: string; hint: string; isSeat?: boolean }[] = [
  { id: "entry", label: "دخولية", icon: "entry", accept: "video/mp4,video/webm,image/gif,.svga", hint: "فيديو MP4 أو GIF أو SVGA" },
  { id: "frame", label: "إطار", icon: "frame", accept: "image/gif,image/png,image/webp,.svga", hint: "صورة GIF أو PNG أو SVGA" },
  { id: "bubble", label: "فقاعة دردشة", icon: "bubble", accept: "image/gif,image/png,image/webp", hint: "صورة GIF أو PNG" },
  { id: "cp", label: "خاتم CP", icon: "cp", accept: "image/gif,image/png,image/webp,.svga", hint: "صورة GIF أو PNG أو SVGA" },
  { id: "seat_skin", label: "مقعد ملكي", icon: "seat", accept: "image/png,image/gif,image/webp,.svga", hint: "مفتوح/مقفول: PNG أو GIF أو SVGA", isSeat: true },
];

const DEFAULT_SCALE = 1.3;
const MIN_SCALE = 1.0;
const MAX_SCALE = 2.5;

const VIP_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
const PRO_LEVELS = [1, 2, 3, 4, 5];
const ARISTO_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function FramePreview({ avatarSize, avatarUrl, avatarName, frameUrl, scale, label, isSvga }: {
  avatarSize: number; avatarUrl?: string | null; avatarName?: string;
  frameUrl: string; scale: number; label: string; isSvga?: boolean;
}) {
  const frameSize = Math.round(avatarSize * scale);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ width: frameSize, height: frameSize, position: "relative", flexShrink: 0 }}>
        <div className="rounded-full overflow-hidden flex items-center justify-center"
          style={{ width: avatarSize, height: avatarSize, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1, background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-white font-bold" style={{ fontSize: Math.max(10, avatarSize * 0.38) }}>{avatarName?.[0] ?? "أ"}</span>}
        </div>
        {isSvga ? (
          <SVGAPlayer src={frameUrl} width={frameSize} height={frameSize} loop={true}
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10, pointerEvents: "none", background: "transparent" }} />
        ) : (
          <img src={frameUrl} alt=""
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: frameSize, height: frameSize, zIndex: 10, pointerEvents: "none", objectFit: "contain" }} />
        )}
      </div>
      <span className="text-[10px]" style={{ color: "#888" }}>{label}</span>
    </div>
  );
}

// معاينة ستايل المقعد
function SeatSkinPreview({ skinUrl }: { skinUrl: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-bold" style={{ color: "#555" }}>معاينة المقعد</p>
      <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
        {/* خلفية المقعد */}
        <div className="absolute inset-0 rounded-full" style={{
          background: "linear-gradient(145deg, rgba(20,10,40,0.85), rgba(10,5,20,0.9))",
          border: "2px solid rgba(139,92,246,0.6)",
          boxShadow: "0 0 12px rgba(139,92,246,0.4)",
        }} />
        {/* صورة ستايل المقعد */}
        <img src={skinUrl} alt="seat skin" className="absolute inset-0 w-full h-full object-cover rounded-full" style={{ zIndex: 5 }} />
        {/* أيقونة الميكروفون */}
        <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center z-10"
          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "1.5px solid rgba(0,0,0,0.5)" }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
          </svg>
        </div>
      </div>
      <p className="text-[10px]" style={{ color: "#888" }}>هكذا سيظهر المقعد في الغرفة</p>
    </div>
  );
}

export default function UploadStoreItemPage({ onBack }: UploadStoreItemPageProps) {
  const [selectedType, setSelectedType] = useState<ItemType | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [frameThumbnailFile, setFrameThumbnailFile] = useState<File | null>(null);
  const [frameThumbnailPreview, setFrameThumbnailPreview] = useState<string | null>(null);
  const [seatLockedFile, setSeatLockedFile] = useState<File | null>(null);
  const [seatLockedPreview, setSeatLockedPreview] = useState<string | null>(null);
  const [seatThumbnailFile, setSeatThumbnailFile] = useState<File | null>(null);
  const [seatThumbnailPreview, setSeatThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [frameScale, setFrameScale] = useState(DEFAULT_SCALE);
  const [frameAccessType, setFrameAccessType] = useState<FrameAccessType>("normal");
  const [entryAccessType, setEntryAccessType] = useState<EntryAccessType>("normal");
  const [vipMinLevel, setVipMinLevel] = useState("1");
  const [aristocracyMinLevel, setAristocracyMinLevel] = useState("1");
  // seat skin specific
  const [seatSkinVipMinLevel, setSeatSkinVipMinLevel] = useState("8");
  const [seatSkinIsVip, setSeatSkinIsVip] = useState(true);
  const [seatRequiredRank, setSeatRequiredRank] = useState("normal");
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const frameThumbnailRef = useRef<HTMLInputElement>(null);
  const seatLockedRef = useRef<HTMLInputElement>(null);
  const seatThumbnailRef = useRef<HTMLInputElement>(null);

  const [myProfile, setMyProfile] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setMyProfile(p);
      }
    };
    fetchData();
  }, []);

  const generateUploadUrl = async () => "";
  const createStoreItem = async (args: any) => {};

  const resetType = (t: ItemType) => {
    setSelectedType(t);
    setFile(null); setPreview(null);
    setThumbnailFile(null); setThumbnailPreview(null);
    setFrameThumbnailFile(null); setFrameThumbnailPreview(null);
    setSeatLockedFile(null); setSeatLockedPreview(null);
    setSeatThumbnailFile(null); setSeatThumbnailPreview(null);
    setSeatRequiredRank("normal");
    setFrameScale(DEFAULT_SCALE);
    setFrameAccessType("normal");
    setEntryAccessType("normal");
    setVipMinLevel("1");
    setAristocracyMinLevel("1");
    setSeatSkinVipMinLevel("8");
    setSeatSkinIsVip(true);
    if (fileRef.current) fileRef.current.value = "";
    if (thumbnailRef.current) thumbnailRef.current.value = "";
    if (frameThumbnailRef.current) frameThumbnailRef.current.value = "";
    if (seatLockedRef.current) seatLockedRef.current.value = "";
    if (seatThumbnailRef.current) seatThumbnailRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
  };

  const handleFrameThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFrameThumbnailFile(f);
    setFrameThumbnailPreview(URL.createObjectURL(f));
  };

  const handleSeatLockedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSeatLockedFile(f);
    setSeatLockedPreview(URL.createObjectURL(f));
  };

  const handleSeatThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSeatThumbnailFile(f);
    setSeatThumbnailPreview(URL.createObjectURL(f));
  };

  const isFrameType = selectedType === "frame";
  const isEntryType = selectedType === "entry";
  const isCpType = selectedType === "cp";
  const isSeatSkinType = selectedType === "seat_skin";
  const isSvgaFile = file?.name.toLowerCase().endsWith(".svga") ?? false;
  const isSvgaFrame = (isFrameType || isCpType) && isSvgaFile;
  const isSvgaEntry = isEntryType && isSvgaFile;
  const selectedConfig = TYPE_CONFIG.find((t) => t.id === selectedType);
  const accentColor = selectedConfig?.isSeat ? SEAT_PRIMARY : PRIMARY;
  const regularTypes = TYPE_CONFIG.filter((t) => !t.isSeat);
  const seatTypes = TYPE_CONFIG.filter((t) => t.isSeat);
  const sliderPct = ((frameScale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100;
  const BIG = 100;
  const bigFrameSize = Math.round(BIG * frameScale);

  const currentIsFree = (isFrameType && frameAccessType !== "normal") ||
    (isEntryType && entryAccessType !== "normal") ||
    (isSeatSkinType && (seatSkinIsVip || seatRequiredRank !== "normal"));

  const handleUpload = async () => {
    if (!selectedType || !name.trim() || !file) {
      toast.error("يرجى ملء جميع الحقول واختيار الملف المفتوح");
      return;
    }
    if (isSeatSkinType && (!seatLockedFile || !seatThumbnailFile)) {
      toast.error("يرجى رفع صورة المقعد المفتوح والمقفول والصورة المصغرة");
      return;
    }
    if (!currentIsFree && !price) {
      toast.error("يرجى إدخال السعر");
      return;
    }
    const priceNum = currentIsFree ? 0 : parseInt(price);
    if (!currentIsFree && (isNaN(priceNum) || priceNum < 0)) { toast.error("السعر غير صالح"); return; }
    
    // Luxury frame constraints
    if (isFrameType && !currentIsFree) {
      if (priceNum < 19999) {
        toast.error("الحد الأدنى لسعر الإطارات الفخمة هو 19,999 عملة");
        return;
      }
      const days = parseInt(durationDays);
      if (isNaN(days) || days < 7) {
        toast.error("الحد الأدنى لصلاحية الإطارات الفخمة هو 7 أيام");
        return;
      }
    }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const isSvgaFile = file.name.toLowerCase().endsWith(".svga");
      const contentType = isSvgaFile ? "application/octet-stream" : file.type;
      const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": contentType }, body: file });
      const json = await result.json();
      if (!result.ok) throw new Error("فشل رفع الملف");
      if (!json.storageId) throw new Error("فشل الحصول على معرف الملف من الخادم");

      const storeType = selectedType;
      const isFrameTypeLocal = selectedType === "frame";
      const isEntryTypeLocal = selectedType === "entry";

      let lockedStorageId: string | undefined;
      if (isSeatSkinType && seatLockedFile) {
        const lockedUrl = await generateUploadUrl();
        const lockedResult = await fetch(lockedUrl, { method: "POST", headers: { "Content-Type": seatLockedFile.type || "application/octet-stream" }, body: seatLockedFile });
        const lockedJson = await lockedResult.json();
        if (!lockedResult.ok || !lockedJson.storageId) throw new Error("فشل رفع صورة المقعد المقفول");
        lockedStorageId = lockedJson.storageId;
      }

      let thumbnailStorageId: string | undefined;
      const thumbFileToUpload = isEntryTypeLocal ? thumbnailFile : ((isFrameTypeLocal || selectedType === "cp") ? frameThumbnailFile : (isSeatSkinType ? seatThumbnailFile : null));
      if (thumbFileToUpload) {
        const thumbUrl = await generateUploadUrl();
        const thumbResult = await fetch(thumbUrl, { method: "POST", headers: { "Content-Type": thumbFileToUpload.type }, body: thumbFileToUpload });
        const thumbJson = await thumbResult.json();
        if (thumbResult.ok) thumbnailStorageId = thumbJson.storageId;
      }

      let mediaType: string | undefined;
      if (isEntryTypeLocal) {
        mediaType = isSvgaFile ? "svga" : file.type === "image/gif" ? "gif" : "mp4";
      } else if (isFrameTypeLocal || selectedType === "cp") {
        mediaType = isSvgaFile ? "svga" : file.type === "image/gif" ? "gif" : "png";
      } else if (isSeatSkinType) {
        mediaType = isSvgaFile ? "svga" : file.type === "image/gif" ? "gif" : "png";
      }

      const extraArgs: any = {};

      if (isFrameTypeLocal) {
        if (frameAccessType === "vip") {
          extraArgs.isVipFrame = true;
          extraArgs.vipFrameMinLevel = parseInt(vipMinLevel) || 1;
        } else if (frameAccessType === "superadmin") {
          extraArgs.isSuperAdminFrame = true;
        } else if (frameAccessType === "cp") {
          extraArgs.cpStatus = "cp_only";
        } else if (frameAccessType === "aristocracy") {
          extraArgs.isAristocracyFrame = true;
          extraArgs.aristocracyFrameMinLevel = parseInt(aristocracyMinLevel) || 1;
        }
      }

      if (isEntryTypeLocal) {
        if (entryAccessType === "cp") {
          extraArgs.cpStatus = "cp_only";
        } else if (entryAccessType === "superadmin") {
          extraArgs.isSuperAdminFrame = true;
        } else if (entryAccessType === "vip") {
          extraArgs.isVipEntry = true;
          extraArgs.vipEntryMinLevel = parseInt(vipMinLevel) || 1;
        } else if (entryAccessType === "aristocracy") {
          extraArgs.isAristocracyEntry = true;
          extraArgs.aristocracyEntryMinLevel = parseInt(aristocracyMinLevel) || 1;
        }
      }

      if (isSeatSkinType && seatSkinIsVip) {
        extraArgs.isVipSeatSkin = true;
        extraArgs.vipSeatSkinMinLevel = parseInt(seatSkinVipMinLevel) || 8;
      }
      if (isSeatSkinType) {
        extraArgs.seatRequiredRank = seatSkinIsVip ? "normal" : seatRequiredRank;
        extraArgs.seatAssetFormat = isSvgaFile ? "svga" : file.type === "image/gif" ? "gif" : "png";
      }

      await createStoreItem({
        type: storeType as any,
        name: name.trim(),
        price: priceNum,
        durationDays: durationDays ? parseInt(durationDays) : undefined,
        mediaStorageId: json.storageId,
        thumbnailStorageId: thumbnailStorageId as any,
        seatOpenStorageId: isSeatSkinType ? json.storageId : undefined,
        seatLockedStorageId: isSeatSkinType ? lockedStorageId as any : undefined,
        seatRequiredRank: extraArgs.seatRequiredRank,
        seatAssetFormat: extraArgs.seatAssetFormat,
        frameScale: isFrameTypeLocal ? frameScale : undefined,
        mediaType,
        isVipFrame: extraArgs.isVipFrame,
        vipFrameMinLevel: extraArgs.vipFrameMinLevel,
        isSuperAdminFrame: extraArgs.isSuperAdminFrame,
        isVipEntry: extraArgs.isVipEntry,
        vipEntryMinLevel: extraArgs.vipEntryMinLevel,
        isAristocracyFrame: extraArgs.isAristocracyFrame,
        aristocracyFrameMinLevel: extraArgs.aristocracyFrameMinLevel,
        isAristocracyEntry: extraArgs.isAristocracyEntry,
        aristocracyEntryMinLevel: extraArgs.aristocracyEntryMinLevel,
        isVipSeatSkin: extraArgs.isVipSeatSkin,
        vipSeatSkinMinLevel: extraArgs.vipSeatSkinMinLevel,
      });
      toast.success("تم رفع العنصر بنجاح! ✅");
      onBack();
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error(e.message ?? e.data?.message ?? "حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  };

  const VipLevelPicker = ({ label }: { label: string }) => (
    <div className="mt-2">
      <p className="text-xs font-bold mb-1.5" style={{ color: "#555" }}>{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {VIP_LEVELS.map((lvl) => (
          <button key={lvl} onClick={() => setVipMinLevel(String(lvl))}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={vipMinLevel === String(lvl)
              ? { background: "#a855f7", color: "white" }
              : { background: "white", color: "#555", border: "1px solid #e8eef5" }
            }>
            VIP {lvl}
          </button>
        ))}
      </div>
      <p className="text-[10px] mt-1.5" style={{ color: "#a855f7" }}>
        👑 يظهر تلقائياً لكل مستخدم VIP {vipMinLevel}+
      </p>
    </div>
  );

  const AristocracyLevelPicker = ({ label }: { label: string }) => (
    <div className="mt-2">
      <p className="text-xs font-bold mb-1.5" style={{ color: "#555" }}>{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {ARISTO_LEVELS.map((lvl) => (
          <button key={lvl} onClick={() => setAristocracyMinLevel(String(lvl))}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={aristocracyMinLevel === String(lvl)
              ? { background: "#f59e0b", color: "white" }
              : { background: "white", color: "#555", border: "1px solid #e8eef5" }
            }>
            رتبة {lvl}
          </button>
        ))}
      </div>
      <p className="text-[10px] mt-1.5" style={{ color: "#f59e0b" }}>
        🏆 يظهر تلقائياً لكل مستخدم أرستقراطية رتبة {aristocracyMinLevel}+
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#ffffff" }} dir="rtl">
      {/* Header */}
      <div className="flex-shrink-0 z-40" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)", borderBottom: "1px solid #eef2f7" }}>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button onClick={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ background: "#f2f7fc", border: "1px solid #e8eef5" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <h2 className="font-black text-lg flex items-center gap-2" style={{ color: "#222" }}><UploadTypeIcon type="entry" color={PRIMARY} /> رفع منتج جديد</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-10" style={{ background: "#f2f7fc" }}>

        {/* Regular types */}
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: "#555" }}>نوع المنتج</p>
          <div className="grid grid-cols-2 gap-2">
            {regularTypes.map((t) => (
              <button key={t.id} onClick={() => resetType(t.id)}
                className="flex items-center gap-3 p-3 rounded-2xl border transition-all"
                style={selectedType === t.id
                  ? { background: `${PRIMARY}15`, border: `1.5px solid ${PRIMARY}60`, color: "#222" }
                  : { background: "white", border: "1.5px solid #e8eef5", color: "#555" }
                }>
                <UploadTypeIcon type={t.icon} color={selectedType === t.id ? PRIMARY : "#687686"} />
                <div className="text-right">
                  <p className="font-bold text-sm">{t.label}</p>
                  <p className="text-[10px] opacity-60">{t.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Seat Skin types */}
        <div>
          <p className="text-xs font-bold mb-2 flex items-center gap-2" style={{ color: "#555" }}>
            <UploadTypeIcon type="seat" color={SEAT_PRIMARY} /> ستايلات المقاعد
          </p>
          <div className="grid grid-cols-2 gap-2">
            {seatTypes.map((t) => (
              <button key={t.id} onClick={() => resetType(t.id)}
                className="flex items-center gap-3 p-3 rounded-2xl border transition-all"
                style={selectedType === t.id
                  ? { background: `${SEAT_PRIMARY}15`, border: `1.5px solid ${SEAT_PRIMARY}60`, color: "#222" }
                  : { background: "white", border: "1.5px solid #e8eef5", color: "#555" }
                }>
                <UploadTypeIcon type={t.icon} color={selectedType === t.id ? PRIMARY : "#687686"} />
                <div className="text-right">
                  <p className="font-bold text-sm">{t.label}</p>
                  <p className="text-[10px] opacity-60">{t.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedType && (
          <>
            {/* ── شرط الوصول للإطار ── */}
            {isFrameType && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: "1px solid #e8eef5" }}>
                <p className="font-bold text-sm" style={{ color: "#222" }}>🔒 مخصص لـ (شرط الشراء)</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "normal" as FrameAccessType, label: "عام", icon: "🛍️", desc: "يُباع للجميع", color: PRIMARY },
                    { id: "cp" as FrameAccessType, label: "CP فقط", icon: "💍", desc: "أصحاب CP", color: "#ff6b9d" },
                    { id: "vip" as FrameAccessType, label: "VIP", icon: "👑", desc: "حصري VIP", color: "#a855f7" },
                    { id: "aristocracy" as FrameAccessType, label: "أرستقراطية", icon: "🏆", desc: "حصري أرستقراطية", color: "#f59e0b" },
                    { id: "superadmin" as FrameAccessType, label: "مشرفين", icon: "⭐", desc: "حصري مشرفين", color: "#ef4444" },
                  ].map((opt) => (
                    <button key={opt.id} onClick={() => setFrameAccessType(opt.id)}
                      className="flex flex-col items-center gap-1 p-2.5 rounded-2xl border transition-all"
                      style={frameAccessType === opt.id
                        ? { background: `${opt.color}15`, border: `1.5px solid ${opt.color}60`, color: "#222" }
                        : { background: "#f2f7fc", border: "1.5px solid #e8eef5", color: "#888" }
                      }>
                      <span className="text-xl">{opt.icon}</span>
                      <span className="font-bold text-[11px] text-center">{opt.label}</span>
                      <span className="text-[9px] text-center opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                {frameAccessType === "vip" && <VipLevelPicker label="الحد الأدنى لمستوى VIP (للإطار)" />}
                {frameAccessType === "aristocracy" && <AristocracyLevelPicker label="الحد الأدنى لرتبة الأرستقراطية (للإطار)" />}
                {frameAccessType === "cp" && <p className="text-[10px]" style={{ color: "#ff6b9d" }}>💍 يظهر فقط لمن لديه CP نشط في المتجر</p>}
                {frameAccessType === "superadmin" && <p className="text-[10px]" style={{ color: "#ef4444" }}>⭐ حصري للمشرفين فقط ولا يمكن شراؤه</p>}
                {frameAccessType === "normal" && <p className="text-[10px]" style={{ color: "#888" }}>🛍️ يظهر في المتجر ويمكن شراؤه بالعملات الذهبية</p>}
              </div>
            )}

            {/* ── شرط الوصول للدخولية ── */}
            {isEntryType && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: "1px solid #e8eef5" }}>
                <p className="font-bold text-sm" style={{ color: "#222" }}>🔒 مخصص لـ (شرط الشراء)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "normal" as EntryAccessType, label: "عام", icon: "🛍️", desc: "يُباع للجميع", color: PRIMARY },
                    { id: "cp" as EntryAccessType, label: "CP فقط", icon: "💍", desc: "أصحاب CP", color: "#ff6b9d" },
                    { id: "vip" as EntryAccessType, label: "VIP", icon: "👑", desc: "حصري VIP", color: "#a855f7" },
                    { id: "superadmin" as EntryAccessType, label: "مشرفين", icon: "⭐", desc: "حصري مشرفين", color: "#ef4444" },
                    { id: "aristocracy" as EntryAccessType, label: "أرستقراطية", icon: "🏆", desc: "حصري أرستقراطية", color: "#f59e0b" },
                  ].map((opt) => (
                    <button key={opt.id} onClick={() => setEntryAccessType(opt.id)}
                      className="flex items-center gap-2 p-3 rounded-2xl border transition-all"
                      style={entryAccessType === opt.id
                        ? { background: `${opt.color}15`, border: `1.5px solid ${opt.color}60`, color: "#222" }
                        : { background: "#f2f7fc", border: "1.5px solid #e8eef5", color: "#888" }
                      }>
                      <span className="text-xl">{opt.icon}</span>
                      <div className="text-right">
                        <p className="font-bold text-xs">{opt.label}</p>
                        <p className="text-[9px] opacity-70">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {entryAccessType === "vip" && <VipLevelPicker label="الحد الأدنى لمستوى VIP (للدخولية)" />}
                {entryAccessType === "aristocracy" && <AristocracyLevelPicker label="الحد الأدنى لرتبة الأرستقراطية (للدخولية)" />}
                {entryAccessType === "cp" && <p className="text-[10px]" style={{ color: "#ff6b9d" }}>💍 تظهر فقط لمن لديه CP نشط في المتجر</p>}
                {entryAccessType === "superadmin" && <p className="text-[10px]" style={{ color: "#ef4444" }}>⭐ حصرية للمشرفين فقط ولا يمكن شراؤها</p>}
                {entryAccessType === "normal" && <p className="text-[10px]" style={{ color: "#888" }}>🛍️ تظهر في المتجر ويمكن شراؤها بالعملات الذهبية</p>}
              </div>
            )}

            {/* ── شرط الوصول لستايل المقعد ── */}
            {isSeatSkinType && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: "1px solid #e8eef5" }}>
                <p className="font-bold text-sm" style={{ color: "#222" }}>🔒 من يستطيع شراء المقعد؟</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: "normal", label: "عادي", icon: "🛍️" }, { id: "marquis", label: "الماركيز", icon: "💠" }, { id: "sultan", label: "السلطان", icon: "🪽" }, { id: "king", label: "الملك", icon: "👑" }, { id: "emperor", label: "الإمبراطور", icon: "🦁" }].map((opt) => {
                    const selected = !seatSkinIsVip && seatRequiredRank === opt.id;
                    return <button key={opt.id} onClick={() => { setSeatSkinIsVip(false); setSeatRequiredRank(opt.id); }}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                      style={selected ? { background: `${SEAT_PRIMARY}15`, border: `1.5px solid ${SEAT_PRIMARY}60`, color: "#222" } : { background: "#f2f7fc", border: "1.5px solid #e8eef5", color: "#888" }}>
                      <span className="text-lg">{opt.icon}</span><span className="font-bold text-[10px]">{opt.label}</span>
                    </button>;
                  })}
                </div>
                <button onClick={() => setSeatSkinIsVip(true)} className="w-full py-2 rounded-xl text-xs font-bold border" style={seatSkinIsVip ? { background: "#a855f715", borderColor: "#a855f760", color: "#7c3aed" } : { background: "#f2f7fc", borderColor: "#e8eef5", color: "#888" }}>👑 PRO تلقائي (اختر المستوى)</button>
                {seatSkinIsVip && <div className="flex gap-1.5 flex-wrap">{PRO_LEVELS.map((lvl) => <button key={lvl} onClick={() => setSeatSkinVipMinLevel(String(lvl))} className="px-3 py-1.5 rounded-full text-xs font-bold" style={seatSkinVipMinLevel === String(lvl) ? { background: "#a855f7", color: "white" } : { background: "white", color: "#555", border: "1px solid #e8eef5" }}>PRO {lvl}</button>)}</div>}
                <p className="text-[10px]" style={{ color: "#888" }}>{seatSkinIsVip ? "يُضاف تلقائيًا للمستخدمين المؤهلين" : seatRequiredRank === "normal" ? "يظهر في المتجر ويُشترى بالسعر المحدد" : `متاح لرتبة ${seatRequiredRank} أو أعلى`}</p>
              </div>
            )}

            {/* Frame scale slider */}
            {isFrameType && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: "1px solid #e8eef5" }}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm" style={{ color: "#222" }}>📐 حجم الإطار</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${accentColor}15`, color: accentColor }}>×{frameScale.toFixed(1)}</span>
                </div>
                <input type="range" min={MIN_SCALE * 10} max={MAX_SCALE * 10} value={Math.round(frameScale * 10)}
                  onChange={(e) => setFrameScale(parseInt(e.target.value) / 10)}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to left, ${accentColor} ${sliderPct}%, #e8eef5 ${sliderPct}%)` }} />
                {myProfile && (
                  <div className="flex justify-center gap-6 py-2">
                    <FramePreview avatarSize={BIG} avatarUrl={myProfile.avatarUrl} avatarName={myProfile.name}
                      frameUrl={preview ?? ""} scale={frameScale} label="معاينة" isSvga={isSvgaFrame} />
                  </div>
                )}
              </div>
            )}

            {/* Seat skin preview */}
            {isSeatSkinType && preview && (
              <div className="rounded-2xl p-4 flex justify-center" style={{ background: "white", border: "1px solid #e8eef5" }}>
                <SeatSkinPreview skinUrl={preview} />
              </div>
            )}

            {/* Name */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: "white", border: "1px solid #e8eef5" }}>
              <p className="font-bold text-sm" style={{ color: "#222" }}>✏️ اسم المنتج</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسم المنتج..."
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: "#f2f7fc", border: "1px solid #e8eef5", color: "#222" }} />
            </div>

            {/* Price */}
            {!currentIsFree && (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: "white", border: "1px solid #e8eef5" }}>
                <p className="font-bold text-sm" style={{ color: "#222" }}>🪙 السعر (عملات ذهبية)</p>
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="مثال: 5000" type="number"
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ background: "#f2f7fc", border: "1px solid #e8eef5", color: "#222" }} />
              </div>
            )}

            {/* Duration */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: "white", border: "1px solid #e8eef5" }}>
              <p className="font-bold text-sm" style={{ color: "#222" }}>⏳ مدة الصلاحية (أيام) <span className="font-normal text-xs opacity-60">(اختياري - فارغ = دائم)</span></p>
              <input value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="مثال: 30" type="number"
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: "#f2f7fc", border: "1px solid #e8eef5", color: "#222" }} />
            </div>

            {/* Pre-designed Luxury Frames */}
            {isFrameType && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <p className="font-bold text-sm" style={{ color: "#d97706" }}>👑 إطارات فخمة مصممة مسبقاً</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'male', label: 'شباب', url: '/assets/frames/male_luxury_frame.png' },
                    { id: 'female', label: 'بنات', url: '/assets/frames/female_luxury_frame.png' },
                    { id: 'royal', label: 'ملكي', url: '/assets/frames/royal_frame.png' }
                  ].map(f => (
                    <button key={f.id} 
                      onClick={async () => {
                        const res = await fetch(f.url);
                        const blob = await res.blob();
                        const file = new File([blob], `${f.id}_frame.png`, { type: "image/png" });
                        setFile(file);
                        setPreview(f.url);
                        if (price === "") setPrice("19999");
                        if (durationDays === "") setDurationDays("7");
                        toast.success(`تم اختيار إطار ${f.label}`);
                      }}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all hover:bg-white"
                      style={{ borderColor: preview === f.url ? "#f59e0b" : "#fef3c7", background: preview === f.url ? "white" : "transparent" }}
                    >
                      <img src={f.url} alt="" className="w-10 h-10 object-contain" />
                      <span className="text-[10px] font-bold" style={{ color: "#92400e" }}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* File upload */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "#555" }}>
                {isSeatSkinType ? "صورة ستايل المقعد (WebP أو PNG)" : isCpType ? "ملف الخاتم (SVGA أو GIF أو PNG)" : "الملف"}
              </p>
              <input ref={fileRef} type="file" accept={selectedConfig?.accept} onChange={handleFileChange} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-3 transition-colors"
                style={{ borderColor: preview ? accentColor : "#d1d5db", background: "white" }}>
                {preview ? (
                  (isSvgaEntry || isSvgaFrame)
                    ? <div className="flex flex-col items-center gap-2 py-2">
                        <span className="text-5xl">✨</span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>SVGA ✅ جاهز</span>
                      </div>
                    : isSeatSkinType
                      ? <img src={preview} alt="" className="w-32 h-32 object-cover rounded-full border-4" style={{ borderColor: SEAT_PRIMARY }} />
                      : isEntryType
                        ? file?.type === "image/gif"
                          ? <img src={preview} alt="" className="w-32 h-32 object-cover rounded-xl" />
                          : <video src={preview} className="w-32 h-32 object-cover rounded-xl" autoPlay loop muted playsInline />
                        : <img src={preview} alt="" className="w-32 h-32 object-contain rounded-xl" />
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#f2f7fc" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    </div>
                    <p className="text-sm" style={{ color: "#888" }}>اضغط لاختيار ملف</p>
                    <p className="text-xs" style={{ color: "#bbb" }}>{selectedConfig?.hint}</p>
                  </>
                )}
              </button>
              {file && <p className="text-xs mt-1 text-center" style={{ color: "#10b981" }}>✅ {file.name}</p>}
            </div>

            {isSeatSkinType && (
              <>
                <div className="rounded-2xl p-4 space-y-2" style={{ background: "white", border: "1px solid #e8eef5" }}>
                  <p className="font-bold text-sm" style={{ color: "#222" }}>🔒 صورة المقعد المقفول</p>
                  <p className="text-[10px]" style={{ color: "#888" }}>PNG أو GIF أو SVGA — تظهر عند قفل المقعد</p>
                  <input ref={seatLockedRef} type="file" accept="image/png,image/gif,image/webp,.svga" onChange={handleSeatLockedChange} className="hidden" />
                  <button onClick={() => seatLockedRef.current?.click()} className="w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2" style={{ borderColor: seatLockedPreview ? SEAT_PRIMARY : "#d1d5db", background: "#f9fafb" }}>
                    {seatLockedPreview ? <img src={seatLockedPreview} alt="" className="w-28 h-28 object-contain rounded-xl" /> : <><span className="text-3xl">🔒</span><span className="text-xs" style={{ color: "#888" }}>اضغط لاختيار صورة المقعد المقفول</span></>}
                  </button>
                  {seatLockedFile && <p className="text-xs text-center" style={{ color: "#10b981" }}>✅ {seatLockedFile.name}</p>}
                </div>
                <div className="rounded-2xl p-4 space-y-2" style={{ background: "white", border: "1px solid #e8eef5" }}>
                  <p className="font-bold text-sm" style={{ color: "#222" }}>🖼️ الصورة المصغرة للمتجر والحقيبة</p>
                  <p className="text-[10px]" style={{ color: "#888" }}>PNG أو GIF أو JPG — هذه الصورة تظهر في البطاقات فقط</p>
                  <input ref={seatThumbnailRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleSeatThumbnailChange} className="hidden" />
                  <button onClick={() => seatThumbnailRef.current?.click()} className="w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2" style={{ borderColor: seatThumbnailPreview ? SEAT_PRIMARY : "#d1d5db", background: "#f9fafb" }}>
                    {seatThumbnailPreview ? <img src={seatThumbnailPreview} alt="" className="w-28 h-28 object-contain rounded-xl" /> : <><span className="text-3xl">🖼️</span><span className="text-xs" style={{ color: "#888" }}>اضغط لاختيار صورة مصغرة</span></>}
                  </button>
                  {seatThumbnailFile && <p className="text-xs text-center" style={{ color: "#10b981" }}>✅ {seatThumbnailFile.name}</p>}
                </div>
              </>
            )}

            {/* Thumbnail للإطار */}
            {isFrameType && (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: "white", border: "1px solid #e8eef5" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🖼️</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#222" }}>
                      صورة مصغرة للإطار
                      <span className="font-normal text-xs opacity-60 mr-1">(اختياري)</span>
                    </p>
                    <p className="text-[10px]" style={{ color: "#aaa" }}>تظهر في المتجر والحقيبة — PNG أو JPG</p>
                  </div>
                </div>
                <input ref={frameThumbnailRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFrameThumbnailChange} className="hidden" />
                <button onClick={() => frameThumbnailRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
                  style={{ borderColor: frameThumbnailPreview ? accentColor : "#d1d5db", background: "#f9fafb" }}>
                  {frameThumbnailPreview ? (
                    <img src={frameThumbnailPreview} alt="" className="w-28 h-28 object-contain rounded-xl" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f2f7fc" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      </div>
                      <p className="text-xs" style={{ color: "#888" }}>اضغط لاختيار صورة مصغرة</p>
                    </>
                  )}
                </button>
                {frameThumbnailFile && <p className="text-xs text-center" style={{ color: "#10b981" }}>✅ {frameThumbnailFile.name}</p>}
              </div>
            )}

            {/* Thumbnail للدخولية */}
            {isEntryType && (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: "white", border: "1px solid #e8eef5" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🖼️</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#222" }}>
                      صورة مصغرة للمتجر
                      <span className="font-normal text-xs opacity-60 mr-1">(اختياري)</span>
                    </p>
                    <p className="text-[10px]" style={{ color: "#aaa" }}>تظهر في المتجر بدلاً من الفيديو — PNG أو JPG أو GIF</p>
                  </div>
                </div>
                <input ref={thumbnailRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleThumbnailChange} className="hidden" />
                <button onClick={() => thumbnailRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
                  style={{ borderColor: thumbnailPreview ? accentColor : "#d1d5db", background: "#f9fafb" }}>
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="" className="w-28 h-28 object-cover rounded-xl" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f2f7fc" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      </div>
                      <p className="text-xs" style={{ color: "#888" }}>اضغط لاختيار صورة مصغرة</p>
                    </>
                  )}
                </button>
                {thumbnailFile && <p className="text-xs text-center" style={{ color: "#10b981" }}>✅ {thumbnailFile.name}</p>}
              </div>
            )}

            {/* Upload button */}
            <button onClick={handleUpload} disabled={uploading || !file || !name.trim()}
              className="w-full py-4 rounded-2xl font-black text-base text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: uploading ? "#ccc" : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}>
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الرفع...</span>
                </div>
              ) : "رفع المنتج ✅"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
