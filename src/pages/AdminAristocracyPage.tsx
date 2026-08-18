// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "../lib/toast";
import { ARISTOCRACY_RANKS } from "../../convex/aristocracy";

interface AdminAristocracyPageProps {
  onBack: () => void;
}

const FEATURE_ICONS = [
  "🛡️","⚔️","🌹","👑","🔱","👸","🌟","🌸","🪙","🎨",
  "🚪","💬","🔒","🙈","🎭","📢","🆔","🏠","✨","🔓","🏆",
  "🎯","💎","🌈","🔥","⭐","🎪","🎠","🎡","🎢","🎰",
];

function AssetUploadRow({
  label,
  hint,
  preview,
  currentUrl,
  inputRef,
  accept,
  onChange,
}: {
  label: string;
  hint: string;
  preview: string | null;
  currentUrl?: string;
  inputRef: React.RefObject<HTMLInputElement>;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const displayUrl = preview || currentUrl;
  const isVideo = displayUrl && (displayUrl.includes(".mp4") || displayUrl.includes(".webm") || displayUrl.includes("video"));

  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer active:scale-95 transition-all"
        style={{ background: "rgba(255,255,255,0.06)", border: "1.5px dashed rgba(255,255,255,0.2)" }}
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          isVideo ? (
            <video src={displayUrl} className="w-full h-full object-cover rounded-xl" muted loop autoPlay playsInline />
          ) : (
            <img src={displayUrl} className="w-full h-full object-cover rounded-xl" alt={label} />
          )
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-bold">{label}</p>
        <p className="text-[10px] mt-0.5" style={{ color: "#888" }}>{hint}</p>
        {displayUrl && (
          <p className="text-[9px] mt-0.5 truncate" style={{ color: "#6c5ce7" }}>
            {preview ? "✅ ملف جديد محدد" : "✅ مرفوع مسبقاً"}
          </p>
        )}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all"
        style={{ background: "rgba(108,92,231,0.2)", border: "1px solid rgba(108,92,231,0.4)", color: "#a78bfa" }}
      >
        {displayUrl ? "تغيير" : "رفع"}
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} />
    </div>
  );
}

export default function AdminAristocracyPage({ onBack }: AdminAristocracyPageProps) {
  const myProfile = useQuery(api.profiles.getMyProfile);
  const allLevels = useQuery(api.aristocracyAdmin.getAllAristocracyLevels) ?? [];
  const upsert = useMutation(api.aristocracyAdmin.upsertAristocracyLevel);
  const generateUploadUrl = useMutation(api.aristocracyAdmin.generateAristocracyUploadUrl);

  // Block non-super-admins
  if (myProfile !== undefined && !myProfile?.isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ background: "#0d0020" }}>
        <p className="text-red-400 text-lg font-bold">⛔ غير مصرح</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 rounded-xl text-white text-sm" style={{ background: "rgba(255,255,255,0.1)" }}>رجوع</button>
      </div>
    );
  }

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState<number | null>(null);

  const rank = ARISTOCRACY_RANKS.find((r) => r.level === selectedLevel)!;
  const dbLevel = allLevels.find((l) => l.level === selectedLevel);

  const [name, setName] = useState(rank?.nameAr ?? "");
  const [price30, setPrice30] = useState(String(rank?.price30 ?? ""));
  const [price90, setPrice90] = useState(String(rank?.price90 ?? ""));
  const [price365, setPrice365] = useState(String(rank?.price365 ?? ""));
  const [dailyCoins, setDailyCoins] = useState(String(rank?.dailyCoins ?? ""));
  const [features, setFeatures] = useState<{ icon: string; title: string; desc: string }[]>(rank?.features ?? []);
  const [entryEffectType, setEntryEffectType] = useState("mp4");

  const badgeRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLInputElement>(null);
  const bubbleRef = useRef<HTMLInputElement>(null);
  const entryRef = useRef<HTMLInputElement>(null);
  const heartRef = useRef<HTMLInputElement>(null);

  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [bubblePreview, setBubblePreview] = useState<string | null>(null);
  const [entryPreview, setEntryPreview] = useState<string | null>(null);
  const [heartPreview, setHeartPreview] = useState<string | null>(null);

  const [badgeFile, setBadgeFile] = useState<File | null>(null);
  const [frameFile, setFrameFile] = useState<File | null>(null);
  const [bubbleFile, setBubbleFile] = useState<File | null>(null);
  const [entryFile, setEntryFile] = useState<File | null>(null);
  const [heartFile, setHeartFile] = useState<File | null>(null);

  const loadLevel = (level: number) => {
    setSelectedLevel(level);
    const db = allLevels.find((l) => l.level === level);
    const r = ARISTOCRACY_RANKS.find((r) => r.level === level)!;
    setName(db?.name ?? r.nameAr);
    setPrice30(String(db?.price30 ?? r.price30));
    setPrice90(String(db?.price90 ?? r.price90));
    setPrice365(String(db?.price365 ?? r.price365));
    setDailyCoins(String(db?.dailyCoins ?? r.dailyCoins));
    setFeatures(db?.features ?? r.features ?? []);
    setEntryEffectType(db?.entryEffectType ?? "mp4");
    setBadgePreview(null);
    setFramePreview(null);
    setBubblePreview(null);
    setEntryPreview(null);
    setHeartPreview(null);
    setBadgeFile(null);
    setFrameFile(null);
    setBubbleFile(null);
    setEntryFile(null);
    setHeartFile(null);
  };

  // Reload when DB data arrives
  useEffect(() => {
    if (allLevels.length > 0) {
      const db = allLevels.find((l) => l.level === selectedLevel);
      const r = ARISTOCRACY_RANKS.find((r) => r.level === selectedLevel)!;
      if (!name) setName(db?.name ?? r.nameAr);
    }
  }, [allLevels.length]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const uploadFile = async (file: File): Promise<string> => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await res.json();
    return storageId;
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const args: any = {
        level: selectedLevel,
        name: name || rank.nameAr,
        price30: Number(price30) || rank.price30,
        price90: Number(price90) || rank.price90,
        price365: Number(price365) || rank.price365,
        dailyCoins: Number(dailyCoins) || rank.dailyCoins,
        features,
        entryEffectType,
      };
      if (badgeFile) args.badgeStorageId = await uploadFile(badgeFile);
      if (frameFile) args.frameStorageId = await uploadFile(frameFile);
      if (bubbleFile) args.chatBubbleStorageId = await uploadFile(bubbleFile);
      if (entryFile) args.entryEffectStorageId = await uploadFile(entryFile);
      if (heartFile) args.heartStorageId = await uploadFile(heartFile);
      await upsert(args);
      toast.success("✅ تم حفظ إعدادات الرتبة بنجاح");
      setBadgeFile(null);
      setFrameFile(null);
      setBubbleFile(null);
      setEntryFile(null);
      setHeartFile(null);
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () =>
    setFeatures([...features, { icon: "✨", title: "", desc: "" }]);

  const removeFeature = (i: number) =>
    setFeatures(features.filter((_, idx) => idx !== i));

  const updateFeature = (i: number, key: string, val: string) =>
    setFeatures(features.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));

  const currentDbLevel = allLevels.find((l) => l.level === selectedLevel);

  return (
    <div
      className="flex flex-col"
      dir="rtl"
      style={{
        background: "linear-gradient(180deg,#0d0020 0%,#1a0035 100%)",
        fontFamily: "'Tajawal',sans-serif",
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-base">إدارة الأرستقراطية</h1>
          <p className="text-xs" style={{ color: "#a78bfa" }}>
            تخصيص كل رتبة بالكامل
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-black active:scale-95 transition-all disabled:opacity-50"
          style={{
            background: saving
              ? "rgba(108,92,231,0.3)"
              : "linear-gradient(135deg,#6c5ce7,#a78bfa)",
            color: "white",
          }}
        >
          {saving ? (
            <span className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري...
            </span>
          ) : (
            "💾 حفظ"
          )}
        </button>
      </div>

      {/* Level Tabs */}
      <div
        className="flex overflow-x-auto px-4 py-3 gap-2 sticky z-30"
        style={{ scrollbarWidth: "none", top: 73, background: "rgba(13,0,32,0.95)", backdropFilter: "blur(8px)" }}
      >
        {ARISTOCRACY_RANKS.map((r) => {
          const isActive = selectedLevel === r.level;
          const hasData = allLevels.some((l) => l.level === r.level);
          return (
            <button
              key={r.level}
              onClick={() => loadLevel(r.level)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 relative"
              style={
                isActive
                  ? {
                      background: `${r.color}25`,
                      border: `1.5px solid ${r.color}60`,
                      color: r.color,
                    }
                  : {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#888",
                    }
              }
            >
              <span>{r.icon}</span>
              <span>{r.nameAr}</span>
              {hasData && (
                <span
                  className="absolute -top-1 -left-1 w-2 h-2 rounded-full"
                  style={{ background: "#22c55e" }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-32 space-y-4">
        {/* Rank Preview Card */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: `${rank.color}15`,
            border: `1px solid ${rank.color}30`,
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `${rank.color}20` }}
          >
            {rank.icon}
          </div>
          <div>
            <p className="font-black text-base" style={{ color: rank.color }}>
              {name || rank.nameAr}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#888" }}>
              المستوى {rank.level} •{" "}
              {currentDbLevel ? "✅ محفوظ في قاعدة البيانات" : "⚠️ لم يُحفظ بعد"}
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 className="text-white font-black text-sm flex items-center gap-2">
            <span style={{ color: rank.color }}>{rank.icon}</span> المعلومات الأساسية
          </h2>

          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: "#aaa" }}>
              اسم الرتبة
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              placeholder={rank.nameAr}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "سعر 30 يوم", val: price30, set: setPrice30, def: rank.price30 },
              { label: "سعر 90 يوم", val: price90, set: setPrice90, def: rank.price90 },
              { label: "سعر 365 يوم", val: price365, set: setPrice365, def: rank.price365 },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-[10px] font-bold mb-1 block" style={{ color: "#aaa" }}>
                  {f.label}
                </label>
                <input
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  type="number"
                  className="w-full rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  placeholder={String(f.def)}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: "#aaa" }}>
              المكافأة اليومية (مرة واحدة) 🪙
            </label>
            <input
              value={dailyCoins}
              onChange={(e) => setDailyCoins(e.target.value)}
              type="number"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              placeholder={String(rank.dailyCoins)}
            />
            <p className="text-[10px] mt-1" style={{ color: "#666" }}>
              تُمنح مرة واحدة فقط عند الشراء (1 مليار كحد أقصى)
            </p>
          </div>
        </div>

        {/* Assets Upload */}
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 className="text-white font-black text-sm mb-3">🎨 الأصول المرئية</h2>

          <AssetUploadRow
            label="الوسام (Badge)"
            hint="صورة PNG/GIF تظهر بجانب الاسم"
            preview={badgePreview}
            currentUrl={currentDbLevel?.badgeUrl}
            inputRef={badgeRef}
            accept="image/*"
            onChange={(e) => handleFileChange(e, setBadgeFile, setBadgePreview)}
          />

          <AssetUploadRow
            label="الإطار (Frame)"
            hint="صورة PNG/GIF تحيط بالصورة الشخصية"
            preview={framePreview}
            currentUrl={currentDbLevel?.frameUrl}
            inputRef={frameRef}
            accept="image/*"
            onChange={(e) => handleFileChange(e, setFrameFile, setFramePreview)}
          />

          <AssetUploadRow
            label="فقاعة الدردشة (Bubble)"
            hint="صورة PNG تظهر خلف رسائل الدردشة"
            preview={bubblePreview}
            currentUrl={currentDbLevel?.chatBubbleUrl}
            inputRef={bubbleRef}
            accept="image/*"
            onChange={(e) => handleFileChange(e, setBubbleFile, setBubblePreview)}
          />

          <AssetUploadRow
            label="تأثير الدخول (Entry Effect)"
            hint="فيديو MP4/SVGA يظهر عند دخول الغرفة"
            preview={entryPreview}
            currentUrl={currentDbLevel?.entryEffectUrl}
            inputRef={entryRef}
            accept="video/*,image/*"
            onChange={(e) => handleFileChange(e, setEntryFile, setEntryPreview)}
          />

          <AssetUploadRow
            label="القلب (Heart)"
            hint="صورة PNG/GIF للقلب المخصص"
            preview={heartPreview}
            currentUrl={currentDbLevel?.heartUrl}
            inputRef={heartRef}
            accept="image/*"
            onChange={(e) => handleFileChange(e, setHeartFile, setHeartPreview)}
          />

          {/* Entry Effect Type */}
          <div className="pt-3">
            <label className="text-xs font-bold mb-2 block" style={{ color: "#aaa" }}>
              نوع تأثير الدخول
            </label>
            <div className="flex gap-2">
              {["mp4", "svga", "gif"].map((t) => (
                <button
                  key={t}
                  onClick={() => setEntryEffectType(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={
                    entryEffectType === t
                      ? {
                          background: "rgba(108,92,231,0.3)",
                          border: "1.5px solid rgba(108,92,231,0.6)",
                          color: "#a78bfa",
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#666",
                        }
                  }
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-sm">⭐ المميزات</h2>
            <button
              onClick={addFeature}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
              style={{
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "#4ade80",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              إضافة
            </button>
          </div>

          {features.length === 0 && (
            <p className="text-center text-xs py-4" style={{ color: "#555" }}>
              لا توجد مميزات. اضغط "إضافة" لإضافة ميزة جديدة.
            </p>
          )}

          {features.map((feat, i) => (
            <div
              key={i}
              className="rounded-xl p-3 space-y-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center gap-2">
                {/* Icon Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowIconPicker(showIconPicker === i ? null : i)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg active:scale-90 transition-all flex-shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {feat.icon}
                  </button>
                  {showIconPicker === i && (
                    <div
                      className="absolute top-10 right-0 z-50 rounded-2xl p-3 grid grid-cols-7 gap-1.5"
                      style={{
                        background: "#1a1a2e",
                        border: "1px solid rgba(255,255,255,0.15)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        width: "220px",
                      }}
                    >
                      {FEATURE_ICONS.map((ic) => (
                        <button
                          key={ic}
                          onClick={() => {
                            updateFeature(i, "icon", ic);
                            setShowIconPicker(null);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-base active:scale-90 transition-all hover:bg-white/10"
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  value={feat.title}
                  onChange={(e) => updateFeature(i, "title", e.target.value)}
                  className="flex-1 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  placeholder="عنوان الميزة"
                />

                <button
                  onClick={() => removeFeature(i)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <input
                value={feat.desc}
                onChange={(e) => updateFeature(i, "desc", e.target.value)}
                className="w-full rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#aaa",
                }}
                placeholder="وصف الميزة"
              />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: `${rank.color}10`,
            border: `1px solid ${rank.color}25`,
          }}
        >
          <h3 className="text-xs font-black mb-3" style={{ color: rank.color }}>
            📋 ملخص الرتبة الحالية
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "الاسم", val: name || rank.nameAr },
              { label: "المستوى", val: `${rank.level}` },
              { label: "سعر 30 يوم", val: `${Number(price30 || rank.price30).toLocaleString()} 🪙` },
              { label: "سعر 90 يوم", val: `${Number(price90 || rank.price90).toLocaleString()} 🪙` },
              { label: "سعر 365 يوم", val: `${Number(price365 || rank.price365).toLocaleString()} 🪙` },
              { label: "مكافأة يومية", val: `${Number(dailyCoins || rank.dailyCoins).toLocaleString()} 🪙` },
              { label: "عدد المميزات", val: `${features.length} ميزة` },
              { label: "نوع التأثير", val: entryEffectType.toUpperCase() },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-2"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                <p className="text-[10px]" style={{ color: "#666" }}>
                  {item.label}
                </p>
                <p className="font-bold mt-0.5" style={{ color: "#ddd" }}>
                  {item.val}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button (bottom) */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all disabled:opacity-50"
          style={{
            background: saving
              ? "rgba(108,92,231,0.3)"
              : `linear-gradient(135deg, ${rank.color}cc, ${rank.color})`,
            color: "white",
            boxShadow: saving ? "none" : `0 4px 20px ${rank.color}40`,
          }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري الحفظ...
            </span>
          ) : (
            `💾 حفظ إعدادات ${name || rank.nameAr}`
          )}
        </button>
      </div>

      {/* Overlay to close icon picker */}
      {showIconPicker !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowIconPicker(null)}
        />
      )}
    </div>
  );
}
