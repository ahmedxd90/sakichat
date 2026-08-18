// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "../lib/toast";
import SVGADisplay from "../components/SVGADisplay";

// ── مكوّن معاينة SVGA حقيقي ──────────────────────────────────────────────
function SVGAPreviewBadge({ svgaUrl, glowColor, bgColor, size = 44 }: {
  svgaUrl: string; glowColor: string; bgColor: string; size?: number;
}) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 12,
      background: bgColor,
      border: `1px solid ${glowColor}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      boxShadow: `0 0 12px ${glowColor}40`,
    }}>
      <SVGADisplay
        src={svgaUrl}
        width={size - 4}
        height={size - 4}
        loop={true}
      />
    </div>
  );
}

export default function AdminCustomBadgesTab() {
  const badges = useQuery(api.customBadges.adminListBadges);
  const createBadge = useMutation(api.customBadges.adminCreateBadge);
  const updateBadge = useMutation(api.customBadges.adminUpdateBadge);
  const deleteBadge = useMutation(api.customBadges.adminDeleteBadge);
  const assignBadge = useMutation(api.customBadges.adminAssignBadge);
  const revokeBadge = useMutation(api.customBadges.adminRevokeBadge);
  const genUploadUrl = useMutation(api.customBadges.adminGenerateBadgeUploadUrl);

  const users = useQuery(api.admin.listAllUsers, { limit: 50 });

  const [tab, setTab] = useState<"badges" | "assign">("badges");
  const [showCreate, setShowCreate] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [userSearch, setUserSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingSvga, setUploadingSvga] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const svgaRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", description: "", imageUrl: "",
    glowColor: "#a855f7", bgColor: "rgba(168,85,247,0.2)", textColor: "#e9d5ff",
    imageStorageId: "" as any,
    svgaStorageId: "" as any,
    svgaPreviewUrl: "", // blob URL للمعاينة المحلية
    mediaType: "image" as "image" | "svga",
  });

  const resetForm = () => setForm({
    name: "", description: "", imageUrl: "",
    glowColor: "#a855f7", bgColor: "rgba(168,85,247,0.2)", textColor: "#e9d5ff",
    imageStorageId: "",
    svgaStorageId: "",
    svgaPreviewUrl: "",
    mediaType: "image",
  });

  // رفع صورة عادية
  const handleUploadImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await genUploadUrl();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      setForm(f => ({ ...f, imageStorageId: storageId, imageUrl: "", mediaType: "image" }));
      toast.success("✅ تم رفع الصورة");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  // رفع ملف SVGA
  const handleUploadSvga = async (file: File) => {
    setUploadingSvga(true);
    // إنشاء blob URL للمعاينة الفورية
    const blobUrl = URL.createObjectURL(file);
    setForm(f => ({ ...f, svgaPreviewUrl: blobUrl, mediaType: "svga" }));
    try {
      const url = await genUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });
      const { storageId } = await res.json();
      setForm(f => ({ ...f, svgaStorageId: storageId, mediaType: "svga" }));
      toast.success("✅ تم رفع ملف SVGA");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploadingSvga(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("أدخل اسم الوسام"); return; }
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        glowColor: form.glowColor,
        bgColor: form.bgColor,
        textColor: form.textColor,
        mediaType: form.mediaType,
      };
      if (form.mediaType === "svga") {
        if (form.svgaStorageId) payload.svgaStorageId = form.svgaStorageId;
      } else {
        if (form.imageUrl) payload.imageUrl = form.imageUrl;
        if (form.imageStorageId) payload.imageStorageId = form.imageStorageId;
      }

      if (editingBadge) {
        await updateBadge({ badgeId: editingBadge._id, ...payload });
        toast.success("✅ تم تحديث الوسام");
      } else {
        await createBadge(payload);
        toast.success("✅ تم إنشاء الوسام");
      }
      setShowCreate(false);
      setEditingBadge(null);
      resetForm();
    } catch (e: any) { toast.error(e.message); }
  };

  const filteredUsers = (users ?? []).filter((u: any) =>
    !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.sakiId?.includes(userSearch)
  ).slice(0, 20);

  const badgeUsers = useQuery(
    api.customBadges.adminGetBadgeUsers,
    selectedBadge ? { badgeId: selectedBadge._id } : "skip"
  );

  // دالة مساعدة لعرض الوسام (صورة أو SVGA)
  const renderBadgeMedia = (b: any, size = 40) => {
    const isSvga = b.mediaType === "svga" || b.svgaUrl || b.svgaStorageId;
    const svgaUrl = b.svgaUrl;
    if (isSvga && svgaUrl) {
      return (
        <SVGADisplay
          src={svgaUrl}
          width={size}
          height={size}
          loop={true}
          forceSvga={true}
          style={{ borderRadius: 8 }}
        />
      );
    }
    if (b.imageUrl) {
      return (
        <img src={b.imageUrl} alt={b.name}
          style={{ width: size, height: size, objectFit: "contain", filter: `drop-shadow(0 0 6px ${b.glowColor || "#a855f7"})` }} />
      );
    }
    return (
      <div className="flex items-center justify-center text-xl"
        style={{ width: size, height: size, borderRadius: 8, background: `${b.glowColor || "#a855f7"}20` }}>🏅</div>
    );
  };

  return (
    <div className="p-4 space-y-3" dir="rtl">
      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("badges")}
          className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95"
          style={{ background: tab === "badges" ? "linear-gradient(135deg,#a855f7,#7c3aed)" : "rgba(255,255,255,0.08)", color: tab === "badges" ? "white" : "#aaa" }}>
          🏅 الأوسمة
        </button>
        <button onClick={() => setTab("assign")}
          className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95"
          style={{ background: tab === "assign" ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" : "rgba(255,255,255,0.08)", color: tab === "assign" ? "white" : "#aaa" }}>
          🎖️ منح الأوسمة
        </button>
      </div>

      {/* BADGES TAB */}
      {tab === "badges" && (
        <>
          <button onClick={() => { setShowCreate(true); setEditingBadge(null); resetForm(); }}
            className="w-full py-3 rounded-2xl font-black text-sm active:scale-95"
            style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", color: "white" }}>
            ➕ إنشاء وسام جديد
          </button>

          {!badges ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : badges.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🏅</div>
              <p className="text-gray-400 text-sm">لا توجد أوسمة بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b: any) => (
                <div key={b._id} className="rounded-2xl p-3 space-y-2"
                  style={{ background: b.bgColor || "rgba(168,85,247,0.15)", border: `1px solid ${b.glowColor || "#a855f7"}40`, boxShadow: `0 0 12px ${b.glowColor || "#a855f7"}20` }}>
                  <div className="flex items-center gap-2">
                    <div style={{ filter: `drop-shadow(0 0 6px ${b.glowColor || "#a855f7"})` }}>
                      {renderBadgeMedia(b, 40)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate" style={{ color: b.textColor || "#e9d5ff" }}>{b.name}</p>
                      {b.description && <p className="text-gray-500 text-[10px] truncate">{b.description}</p>}
                      {(b.mediaType === "svga" || b.svgaUrl) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(139,92,246,0.3)", color: "#c084fc" }}>✨ SVGA</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => {
                      setEditingBadge(b);
                      setForm({
                        name: b.name,
                        description: b.description || "",
                        imageUrl: b.imageUrl || "",
                        glowColor: b.glowColor || "#a855f7",
                        bgColor: b.bgColor || "rgba(168,85,247,0.2)",
                        textColor: b.textColor || "#e9d5ff",
                        imageStorageId: b.imageStorageId || "",
                        svgaStorageId: b.svgaStorageId || "",
                        svgaPreviewUrl: b.svgaUrl || "",
                        mediaType: (b.mediaType === "svga" || b.svgaUrl) ? "svga" : "image",
                      });
                      setShowCreate(true);
                    }}
                      className="py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                      style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
                      ✏️ تعديل
                    </button>
                    <button onClick={async () => {
                      if (!confirm(`حذف وسام "${b.name}"؟`)) return;
                      try { await deleteBadge({ badgeId: b._id }); toast.success("تم الحذف"); }
                      catch (e: any) { toast.error(e.message); }
                    }}
                      className="py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ASSIGN TAB */}
      {tab === "assign" && (
        <>
          {/* Select badge */}
          <div className="rounded-2xl p-3 space-y-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white font-bold text-sm">1. اختر الوسام</p>
            <div className="flex gap-2 flex-wrap">
              {(badges ?? []).map((b: any) => (
                <button key={b._id} onClick={() => setSelectedBadge(b)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
                  style={{
                    background: selectedBadge?._id === b._id ? (b.bgColor || "rgba(168,85,247,0.3)") : "rgba(255,255,255,0.06)",
                    border: selectedBadge?._id === b._id ? `1.5px solid ${b.glowColor || "#a855f7"}` : "1px solid rgba(255,255,255,0.1)",
                    color: selectedBadge?._id === b._id ? (b.textColor || "#e9d5ff") : "#9ca3af",
                    boxShadow: selectedBadge?._id === b._id ? `0 0 10px ${b.glowColor || "#a855f7"}40` : "none",
                  }}>
                  {(b.mediaType === "svga" || b.svgaUrl) && b.svgaUrl ? (
                    <SVGADisplay src={b.svgaUrl} width={16} height={16} loop={true} forceSvga={true} />
                  ) : b.imageUrl ? (
                    <img src={b.imageUrl} style={{ width: 16, height: 16, objectFit: "contain" }} />
                  ) : null}
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {selectedBadge && (
            <>
              {badgeUsers && badgeUsers.length > 0 && (
                <div className="rounded-2xl p-3 space-y-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-gray-400 text-xs font-bold">المستخدمون الحاملون للوسام ({badgeUsers.length})</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {badgeUsers.map((u: any) => (
                      <div key={u.userId} className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{u.name?.[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold truncate">{u.name}</p>
                          <p className="text-gray-500 text-[9px] font-mono">#{u.sakiId}</p>
                        </div>
                        <button onClick={async () => {
                          try { await revokeBadge({ targetUserId: u.userId, badgeId: selectedBadge._id }); toast.success("تم سحب الوسام"); }
                          catch (e: any) { toast.error(e.message); }
                        }}
                          className="px-2 py-1 rounded-lg text-[9px] font-bold active:scale-95"
                          style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                          سحب
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl p-3 space-y-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-white font-bold text-sm">2. ابحث عن مستخدم وامنحه الوسام</p>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="🔍 ابحث بالاسم أو ID..."
                  className="w-full px-3 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {filteredUsers.map((u: any) => (
                    <div key={u._id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{u.name?.[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">{u.name}</p>
                        <p className="text-gray-500 text-[9px] font-mono">#{u.sakiId}</p>
                      </div>
                      <button onClick={async () => {
                        try {
                          await assignBadge({ targetUserId: u.userId, badgeId: selectedBadge._id });
                          toast.success(`✅ تم منح وسام "${selectedBadge.name}" لـ ${u.name}`);
                        } catch (e: any) { toast.error(e.message); }
                      }}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                        style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}>
                        منح
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto"
            style={{ background: "#0f0f1a", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-base">{editingBadge ? "✏️ تعديل الوسام" : "➕ وسام جديد"}</h3>
              <button onClick={() => { setShowCreate(false); setEditingBadge(null); resetForm(); }} className="text-gray-400 text-xl">✕</button>
            </div>

            {/* نوع الوسام: صورة أو SVGA */}
            <div className="flex gap-2">
              <button
                onClick={() => setForm(f => ({ ...f, mediaType: "image" }))}
                className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95"
                style={{
                  background: form.mediaType === "image" ? "linear-gradient(135deg,#a855f7,#7c3aed)" : "rgba(255,255,255,0.06)",
                  color: form.mediaType === "image" ? "white" : "#aaa",
                  border: form.mediaType === "image" ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}>
                🖼️ صورة (PNG/WebP)
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, mediaType: "svga" }))}
                className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95"
                style={{
                  background: form.mediaType === "svga" ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "rgba(255,255,255,0.06)",
                  color: form.mediaType === "svga" ? "white" : "#aaa",
                  border: form.mediaType === "svga" ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}>
                ✨ SVGA متحرك
              </button>
            </div>

            {/* رفع الصورة */}
            {form.mediaType === "image" && (
              <div className="space-y-2">
                <p className="text-gray-400 text-xs font-bold">صورة الوسام (PNG / WebP / SVG)</p>
                <div className="flex items-center gap-3">
                  {(form.imageUrl || form.imageStorageId) && (
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
                      style={{ background: form.bgColor, border: `1px solid ${form.glowColor}40`, boxShadow: `0 0 12px ${form.glowColor}30` }}>
                      <img src={form.imageUrl || ""} alt="" style={{ width: 44, height: 44, objectFit: "contain", filter: `drop-shadow(0 0 6px ${form.glowColor})` }} />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="w-full py-2.5 rounded-xl text-xs font-bold active:scale-95 disabled:opacity-50"
                      style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}>
                      {uploading ? "⏳ جارٍ الرفع..." : "📁 رفع صورة"}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*,.webp,.svg" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f); }} />
                    <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value, imageStorageId: "" }))}
                      placeholder="أو أدخل رابط الصورة..."
                      className="w-full px-3 py-2 rounded-xl text-white placeholder-gray-500 text-xs outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                </div>
              </div>
            )}

            {/* رفع SVGA */}
            {form.mediaType === "svga" && (
              <div className="space-y-2">
                <p className="text-gray-400 text-xs font-bold">ملف SVGA المتحرك</p>
                <div className="flex items-center gap-3">
                  {/* معاينة SVGA حقيقية */}
                  {form.svgaPreviewUrl && (
                    <div className="rounded-2xl overflow-hidden flex-shrink-0"
                      style={{
                        width: 72, height: 72,
                        background: form.bgColor,
                        border: `1px solid ${form.glowColor}50`,
                        boxShadow: `0 0 16px ${form.glowColor}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      <SVGADisplay
                        src={form.svgaPreviewUrl}
                        width={60}
                        height={60}
                        loop={true}
                        forceSvga={true}
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <button onClick={() => svgaRef.current?.click()} disabled={uploadingSvga}
                      className="w-full py-2.5 rounded-xl text-xs font-bold active:scale-95 disabled:opacity-50"
                      style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.4)" }}>
                      {uploadingSvga ? "⏳ جارٍ الرفع..." : "✨ رفع ملف SVGA"}
                    </button>
                    <input ref={svgaRef} type="file" accept=".svga,application/octet-stream" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadSvga(f); }} />
                    {form.svgaPreviewUrl && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                        style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-[10px] font-bold">
                          {form.svgaStorageId ? "✅ تم الرفع بنجاح" : "⏳ جارٍ الرفع..."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <p className="text-gray-400 text-xs font-bold mb-1">اسم الوسام *</p>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="اسم الوسام..."
                className="w-full px-3 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>

            {/* Description */}
            <div>
              <p className="text-gray-400 text-xs font-bold mb-1">الوصف (اختياري)</p>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="وصف الوسام..."
                className="w-full px-3 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "لون التوهج", key: "glowColor" },
                { label: "لون الخلفية", key: "bgColor" },
                { label: "لون النص", key: "textColor" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <p className="text-gray-400 text-[10px] font-bold mb-1">{label}</p>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={(form as any)[key].startsWith("#") ? (form as any)[key] : "#a855f7"}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                    <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="flex-1 px-2 py-1.5 rounded-lg text-white text-[9px] outline-none font-mono"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="rounded-2xl p-4"
              style={{ background: form.bgColor, border: `1px solid ${form.glowColor}50`, boxShadow: `0 0 16px ${form.glowColor}30` }}>
              <p className="text-gray-400 text-[10px] font-bold mb-3 text-center">معاينة الوسام</p>
              <div className="flex items-center gap-3">
                {/* معاينة الميديا */}
                <div style={{ filter: `drop-shadow(0 0 8px ${form.glowColor})` }}>
                  {form.mediaType === "svga" && form.svgaPreviewUrl ? (
                    <SVGADisplay
                      src={form.svgaPreviewUrl}
                      width={48}
                      height={48}
                      loop={true}
                      forceSvga={true}
                    />
                  ) : form.imageUrl || form.imageStorageId ? (
                    <img src={form.imageUrl || ""} style={{ width: 48, height: 48, objectFit: "contain" }} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: `${form.glowColor}20` }}>🏅</div>
                  )}
                </div>
                <div>
                  <p className="font-black text-sm" style={{ color: form.textColor, textShadow: `0 0 8px ${form.glowColor}` }}>
                    {form.name || "اسم الوسام"}
                  </p>
                  {form.description && <p className="text-xs mt-0.5" style={{ color: `${form.textColor}80` }}>{form.description}</p>}
                  {form.mediaType === "svga" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block"
                      style={{ background: "rgba(139,92,246,0.3)", color: "#c084fc" }}>✨ SVGA متحرك</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setShowCreate(false); setEditingBadge(null); resetForm(); }}
                className="py-3 rounded-2xl font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.08)", color: "#aaa" }}>
                إلغاء
              </button>
              <button onClick={handleSave}
                className="py-3 rounded-2xl font-black text-sm active:scale-95"
                style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", color: "white" }}>
                {editingBadge ? "حفظ التعديلات" : "إنشاء الوسام"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
