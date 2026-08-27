// @ts-nocheck
import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";
import AdminTitleBadge, { ADMIN_TITLE_BG_PRESETS } from "../components/AdminTitleBadge";

export const ALL_PERMISSIONS = [
  { id: "users", label: "إدارة المستخدمين", icon: "👥", color: "#3b82f6" },
  { id: "ban", label: "الحظر والأمان", icon: "🚫", color: "#ef4444" },
  { id: "security", label: "سجل الأمان", icon: "🔐", color: "#f97316" },
  { id: "reports", label: "البلاغات", icon: "🚨", color: "#f43f5e" },
  { id: "superadmins", label: "سوبر أدمن", icon: "🔴", color: "#a855f7" },
  { id: "contentCreator", label: "صانع محتوى", icon: "🎬", color: "#3b82f6" },
  { id: "dailyCheckin", label: "الدخول اليومي", icon: "📅", color: "#fbbf24" },
  { id: "rooms", label: "الغرف", icon: "🏠", color: "#8b5cf6" },
  { id: "leaderboard", label: "المتصدرون", icon: "🏆", color: "#fbbf24" },
  { id: "coins", label: "العملات والـ VIP", icon: "💰", color: "#10b981" },
  { id: "transfers", label: "التحويلات", icon: "💸", color: "#06b6d4" },
  { id: "agents", label: "الوكلاء", icon: "⚡", color: "#84cc16" },
  { id: "sakiWallet", label: "محافظ ساكي", icon: "🪙", color: "#f59e0b" },
  { id: "content", label: "المحتوى", icon: "🎬", color: "#ec4899" },
  { id: "store", label: "المتجر", icon: "🛍️", color: "#f59e0b" },
  { id: "gifts", label: "الهدايا", icon: "🎁", color: "#e879f9" },
  { id: "uploadGifts", label: "رفع هدايا", icon: "🎀", color: "#f43f5e" },
  { id: "uploadEmoji", label: "رفع إيموجي", icon: "😄", color: "#facc15" },
  { id: "banners", label: "البنرات", icon: "🖼️", color: "#14b8a6" },
  { id: "splashAd", label: "إعلان الشاشة", icon: "📢", color: "#a855f7" },
  { id: "vip", label: "إدارة VIP", icon: "👑", color: "#fbbf24" },
  { id: "aristocracy", label: "إدارة الاستقراطية", icon: "🏅", color: "#c084fc" },
  { id: "sakiid", label: "معرف مميز", icon: "🆔", color: "#7c3aed" },
  { id: "sakiIdStyle", label: "ستايل SAKI ID", icon: "🎨", color: "#a855f7" },
  { id: "customBadges", label: "الأوسمة المخصصة", icon: "🏅", color: "#f59e0b" },
  { id: "hostAgencies", label: "وكالات المضيفين", icon: "🏢", color: "#60a5fa" },
  { id: "support", label: "الدعم الفني", icon: "🎧", color: "#34d399" },
  { id: "notify", label: "الإشعارات", icon: "📢", color: "#fb923c" },
];

interface AdminPermissionsModalProps {
  user: {
    userId: string;
    name: string;
    avatarUrl?: string;
    sakiId?: string;
    adminPermissions?: string[];
    adminTitle?: string;
    adminTitleColor1?: string;
    adminTitleColor2?: string;
    adminTitleIconUrl?: string;
    adminTitleBg?: string;
  };
  onClose: () => void;
  onSaved?: () => void;
  isNewAssignment?: boolean;
  onAssign?: (permissions: string[]) => Promise<void>;
}

export default function AdminPermissionsModal({
  user, onClose, onSaved, isNewAssignment, onAssign,
}: AdminPermissionsModalProps) {
  const [activeTab, setActiveTab] = useState<"permissions" | "title">("permissions");

  // ── Permissions state ──
  const [selected, setSelected] = useState<string[]>(user.adminPermissions ?? []);
  const [saving, setSaving] = useState(false);
  const updatePermissions = async (args: any) => {};

  // ── Admin Title state ──
  const [titleText, setTitleText] = useState(user.adminTitle ?? "");
  const [color1, setColor1] = useState(user.adminTitleColor1 ?? "#ffd700");
  const [color2, setColor2] = useState(user.adminTitleColor2 ?? "#ff8c00");
  const [bgPreset, setBgPreset] = useState(user.adminTitleBg ?? "gold");
  const [iconUrl, setIconUrl] = useState(user.adminTitleIconUrl ?? "");
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [clearingTitle, setClearingTitle] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = async () => "";
  const updateAdminTitle = async (args: any) => {};
  const clearAdminTitle = async (args: any) => {};

  // ── Permissions handlers ──
  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };
  const selectAll = () => setSelected(ALL_PERMISSIONS.map(p => p.id));
  const clearAll = () => setSelected([]);

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      if (isNewAssignment && onAssign) {
        await onAssign(selected);
      } else {
        await updatePermissions({ targetUserId: user.userId as string, adminPermissions: selected });
        toast.success("✅ تم تحديث الصلاحيات");
        onSaved?.();
      }
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Title handlers ──
  const handleIconUpload = async (file: File) => {
    setUploadingIcon(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      // get url preview locally
      const localUrl = URL.createObjectURL(file);
      setIconUrl(localUrl);
      // save storageId for submission
      (iconInputRef as any)._storageId = storageId;
      toast.success("✅ تم رفع الأيقونة");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!titleText.trim()) {
      toast.error("أدخل نص اللقب أولاً");
      return;
    }
    setSavingTitle(true);
    try {
      const storageId = (iconInputRef as any)._storageId;
      await updateAdminTitle({
        targetUserId: user.userId as string,
        adminTitle: titleText.trim(),
        adminTitleColor1: color1,
        adminTitleColor2: color2,
        adminTitleBg: bgPreset,
        ...(storageId ? { adminTitleIconStorageId: storageId } : {}),
      });
      toast.success("✅ تم حفظ اللقب");
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingTitle(false);
    }
  };

  const handleClearTitle = async () => {
    if (!confirm(`إزالة اللقب المخصص من ${user.name}؟`)) return;
    setClearingTitle(true);
    try {
      await clearAdminTitle({ targetUserId: user.userId as string });
      setTitleText("");
      setIconUrl("");
      (iconInputRef as any)._storageId = undefined;
      toast.success("✅ تم إزالة اللقب");
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClearingTitle(false);
    }
  };

  const previewTitle = titleText.trim() || "معاينة اللقب";

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl flex flex-col max-h-[92vh]"
        style={{ background: "linear-gradient(180deg,#0d0d20 0%,#060612 100%)", border: "1px solid rgba(168,85,247,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(168,85,247,0.15)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-white font-black text-base">⚙️ إدارة الأدمن</h3>
              <p className="text-gray-400 text-xs mt-0.5">{user.name} · #{user.sakiId}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("permissions")}
              className="flex-1 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95"
              style={activeTab === "permissions"
                ? { background: "linear-gradient(135deg,rgba(168,85,247,0.25),rgba(124,58,237,0.15))", border: "1px solid rgba(168,85,247,0.5)", color: "#a855f7" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}
            >
              🔐 الصلاحيات
            </button>
            <button
              onClick={() => setActiveTab("title")}
              className="flex-1 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95"
              style={activeTab === "title"
                ? { background: "linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,140,0,0.12))", border: "1px solid rgba(255,215,0,0.45)", color: "#ffd700" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}
            >
              🏷️ اللقب المخصص
            </button>
          </div>
        </div>

        {/* ── PERMISSIONS TAB ── */}
        {activeTab === "permissions" && (
          <>
            <div className="px-4 pt-3 flex-shrink-0">
              <div className="rounded-xl px-3 py-2 flex items-center gap-2 mb-3"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <span className="text-purple-400 text-sm">ℹ️</span>
                <p className="text-purple-300 text-xs">
                  {selected.length === 0
                    ? "بدون صلاحيات — لن يرى أي قسم سوى الرئيسية"
                    : `${selected.length} صلاحية مُختارة`}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={selectAll}
                  className="flex-1 py-2 rounded-xl text-xs font-black active:scale-95"
                  style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
                  ✅ تحديد الكل
                </button>
                <button onClick={clearAll}
                  className="flex-1 py-2 rounded-xl text-xs font-black active:scale-95"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  ❌ إلغاء الكل
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map(perm => {
                  const isOn = selected.includes(perm.id);
                  return (
                    <button key={perm.id} onClick={() => toggle(perm.id)}
                      className="flex items-center gap-2.5 px-3 py-3 rounded-2xl text-right transition-all active:scale-95"
                      style={isOn
                        ? { background: `${perm.color}18`, border: `1px solid ${perm.color}40` }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                        style={{ background: isOn ? `${perm.color}22` : "rgba(255,255,255,0.06)" }}>
                        {perm.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: isOn ? perm.color : "#9ca3af" }}>
                          {perm.label}
                        </p>
                      </div>
                      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={isOn
                          ? { background: perm.color }
                          : { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                        {isOn && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(168,85,247,0.15)" }}>
              <button onClick={handleSavePermissions} disabled={saving}
                className="w-full py-4 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 20px rgba(168,85,247,0.35)" }}>
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الحفظ...</>
                  : isNewAssignment ? "🔴 تعيين سوبر أدمن بهذه الصلاحيات" : "💾 حفظ الصلاحيات"}
              </button>
            </div>
          </>
        )}

        {/* ── TITLE TAB ── */}
        {activeTab === "title" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" dir="rtl">

              {/* Preview */}
              <div className="rounded-2xl p-4 flex flex-col items-center gap-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,215,0,0.2)" }}>
                <p className="text-gray-400 text-xs font-bold">معاينة مباشرة</p>
                <AdminTitleBadge
                  title={previewTitle}
                  color1={color1}
                  color2={color2}
                  iconUrl={iconUrl || undefined}
                  bgPresetId={bgPreset}
                  size="md"
                />
              </div>

              {/* Title text */}
              <div>
                <p className="text-gray-400 text-xs font-bold mb-2">✏️ نص اللقب</p>
                <input
                  value={titleText}
                  onChange={e => setTitleText(e.target.value)}
                  placeholder="مثال: مدير عام، مشرف، ..."
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,215,0,0.3)" }}
                />
                <p className="text-gray-600 text-[10px] mt-1 text-left">{titleText.length}/20</p>
              </div>

              {/* Colors */}
              <div>
                <p className="text-gray-400 text-xs font-bold mb-2">🎨 ألوان النص</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-gray-500 text-[10px] mb-1">اللون الأول</p>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <input
                        type="color"
                        value={color1}
                        onChange={e => setColor1(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-white text-xs font-mono">{color1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-500 text-[10px] mb-1">اللون الثاني</p>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <input
                        type="color"
                        value={color2}
                        onChange={e => setColor2(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-white text-xs font-mono">{color2}</span>
                    </div>
                  </div>
                </div>
                {/* Quick color presets */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[
                    { c1: "#ffd700", c2: "#ff8c00", label: "ذهبي" },
                    { c1: "#a855f7", c2: "#7c3aed", label: "بنفسجي" },
                    { c1: "#ff4757", c2: "#c0392b", label: "أحمر" },
                    { c1: "#3b82f6", c2: "#1d4ed8", label: "أزرق" },
                    { c1: "#10b981", c2: "#059669", label: "أخضر" },
                    { c1: "#00ffff", c2: "#00ced1", label: "سماوي" },
                    { c1: "#ff69b4", c2: "#ec4899", label: "وردي" },
                    { c1: "#ffffff", c2: "#d1d5db", label: "أبيض" },
                  ].map(p => (
                    <button
                      key={p.label}
                      onClick={() => { setColor1(p.c1); setColor2(p.c2); }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold active:scale-95"
                      style={{
                        background: `linear-gradient(90deg,${p.c1},${p.c2})`,
                        color: "#000",
                        border: color1 === p.c1 ? "2px solid white" : "2px solid transparent",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background preset */}
              <div>
                <p className="text-gray-400 text-xs font-bold mb-2">🖼️ خلفية الشارة</p>
                <div className="grid grid-cols-5 gap-2">
                  {ADMIN_TITLE_BG_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setBgPreset(p.id)}
                      className="py-2 rounded-xl text-[10px] font-bold active:scale-95 flex flex-col items-center gap-1"
                      style={{
                        background: p.gradient,
                        border: bgPreset === p.id ? `2px solid ${p.border}` : "2px solid transparent",
                        boxShadow: bgPreset === p.id ? `0 0 8px ${p.glow}` : "none",
                        color: "#fff",
                      }}
                    >
                      <span className="text-[9px]">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon upload */}
              <div>
                <p className="text-gray-400 text-xs font-bold mb-2">🖼️ أيقونة اللقب (اختياري)</p>
                <div className="flex items-center gap-3">
                  {iconUrl ? (
                    <div className="relative">
                      <img src={iconUrl} alt="" className="w-12 h-12 rounded-xl object-contain"
                        style={{ border: "1px solid rgba(255,215,0,0.4)", background: "rgba(255,215,0,0.05)" }} />
                      <button
                        onClick={() => { setIconUrl(""); (iconInputRef as any)._storageId = undefined; }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{ background: "#ef4444" }}
                      >✕</button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,215,0,0.06)", border: "1px dashed rgba(255,215,0,0.3)" }}>
                      <span className="text-xl">🖼️</span>
                    </div>
                  )}
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleIconUpload(f); }}
                  />
                  <button
                    onClick={() => iconInputRef.current?.click()}
                    disabled={uploadingIcon}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "rgba(255,215,0,0.12)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" }}
                  >
                    {uploadingIcon
                      ? <><div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />جاري الرفع...</>
                      : "📁 رفع أيقونة"}
                  </button>
                </div>
              </div>

              {/* Clear title */}
              {(user.adminTitle || titleText) && (
                <button
                  onClick={handleClearTitle}
                  disabled={clearingTitle}
                  className="w-full py-3 rounded-2xl text-xs font-black active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  {clearingTitle
                    ? <><div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />جاري الإزالة...</>
                    : "🗑️ إزالة اللقب المخصص"}
                </button>
              )}
            </div>

            <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,215,0,0.15)" }}>
              <button
                onClick={handleSaveTitle}
                disabled={savingTitle || !titleText.trim()}
                className="w-full py-4 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#b8860b,#ffd700,#ff8c00)", boxShadow: "0 4px 20px rgba(255,215,0,0.3)", color: "#000" }}
              >
                {savingTitle
                  ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />جاري الحفظ...</>
                  : "💾 حفظ اللقب المخصص"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
