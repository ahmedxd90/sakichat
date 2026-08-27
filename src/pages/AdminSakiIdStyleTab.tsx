// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useEffect } from "react";
import { useState, useRef } from "react";
import { toast } from "../lib/toast";
import { SAKI_GRADIENTS } from "../components/SakiIdDisplay";

export default function AdminSakiIdStyleTab() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [gradient, setGradient] = useState("gold");
  const [customColor1, setCustomColor1] = useState("#ff6b9d");
  const [customColor2, setCustomColor2] = useState("#60efff");
  const [iconUrl, setIconUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('profiles').select('*').limit(30);
      setUsers(data || []);
    };
    fetchData();
  }, [search]);

  const setStyle = async (args: any) => {};
  const resetStyle = async (args: any) => {};
  const genUploadUrl = async () => "";

  const handleUploadIcon = async (file: File) => {
    setUploading(true);
    try {
      const uploadUrl = await genUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      // get url from storage
      if (selectedUser) {
        await setStyle({
          targetUserId: selectedUser.userId,
          sakiIdIconStorageId: storageId,
          sakiIdGradient: gradient === "none" ? undefined : gradient,
          sakiIdCustomColor1: gradient === "custom" ? customColor1 : undefined,
          sakiIdCustomColor2: gradient === "custom" ? customColor2 : undefined,
        });
        toast.success("✅ تم رفع الأيقونة وتطبيق الستايل");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedUser) { toast.error("اختر مستخدماً أولاً"); return; }
    try {
      await setStyle({
        targetUserId: selectedUser.userId,
        sakiIdIconUrl: iconUrl || undefined,
        sakiIdGradient: gradient === "none" ? undefined : gradient,
        sakiIdCustomColor1: gradient === "custom" ? customColor1 : undefined,
        sakiIdCustomColor2: gradient === "custom" ? customColor2 : undefined,
      });
      toast.success(`✅ تم تطبيق ستايل SAKI ID على ${selectedUser.name}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReset = async () => {
    if (!selectedUser) return;
    try {
      await resetStyle({ targetUserId: selectedUser.userId });
      toast.success("تم إعادة تعيين الستايل");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Preview gradient
  const previewGrad = gradient === "custom"
    ? `linear-gradient(90deg, ${customColor1}, ${customColor2}, ${customColor1})`
    : gradient !== "none" && SAKI_GRADIENTS[gradient]
      ? `linear-gradient(90deg, ${SAKI_GRADIENTS[gradient].colors.join(", ")}, ${SAKI_GRADIENTS[gradient].colors[0]})`
      : "";

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="rounded-2xl p-3 text-xs text-purple-300 font-bold"
        style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
        🎨 تخصيص ستايل SAKI ID — أيقونة لامعة + لون متحرك
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 ابحث عن مستخدم..."
        className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(168,85,247,0.2)" }}
      />

      {/* User list */}
      {users && users.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {users.map((u: any) => (
            <button key={u.id}
              onClick={() => setSelectedUser(u)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-95"
              style={{
                background: selectedUser?.id === u.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                border: selectedUser?.id === u.id ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.08)",
              }}>
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                {u.avatarUrl
                  ? <img src={u.avatarUrl} className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-sm">{u.name?.[0]}</span>}
              </div>
              <div className="flex-1 text-right min-w-0">
                <p className="text-white font-bold text-sm truncate">{u.name}</p>
                <p className="text-gray-500 text-xs font-mono">#{u.sakiId}</p>
              </div>
              {selectedUser?.id === u.id && (
                <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {selectedUser && (
        <>
          {/* Selected user */}
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              {selectedUser.avatarUrl
                ? <img src={selectedUser.avatarUrl} className="w-full h-full object-cover" />
                : <span className="text-white font-bold">{selectedUser.name?.[0]}</span>}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{selectedUser.name}</p>
              <p className="text-purple-300 text-xs font-mono">#{selectedUser.sakiId}</p>
            </div>
          </div>

          {/* Gradient picker */}
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white font-bold text-sm">🎨 لون SAKI ID</p>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setGradient("none")}
                className="py-2 rounded-xl text-xs font-bold border transition-all"
                style={{
                  background: gradient === "none" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                  border: gradient === "none" ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  color: gradient === "none" ? "white" : "#6b7280",
                }}>
                بدون
              </button>
              {Object.entries(SAKI_GRADIENTS).map(([key, val]) => {
                const grad = `linear-gradient(90deg, ${val.colors.join(", ")})`;
                return (
                  <button key={key} onClick={() => setGradient(key)}
                    className="py-2 rounded-xl text-xs font-bold border transition-all relative overflow-hidden"
                    style={{
                      background: grad,
                      border: gradient === key ? "2px solid white" : "1px solid transparent",
                      color: "white",
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    }}>
                    {val.label}
                  </button>
                );
              })}
              <button onClick={() => setGradient("custom")}
                className="py-2 rounded-xl text-xs font-bold border transition-all"
                style={{
                  background: gradient === "custom" ? `linear-gradient(90deg, ${customColor1}, ${customColor2})` : "rgba(255,255,255,0.05)",
                  border: gradient === "custom" ? "2px solid white" : "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}>
                مخصص
              </button>
            </div>

            {gradient === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-xs mb-1">اللون الأول</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={customColor1} onChange={e => setCustomColor1(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent" />
                    <span className="text-white text-xs font-mono">{customColor1}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">اللون الثاني</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={customColor2} onChange={e => setCustomColor2(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent" />
                    <span className="text-white text-xs font-mono">{customColor2}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            {previewGrad && (
              <div className="rounded-xl p-3 flex items-center gap-2"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="text-gray-400 text-xs">معاينة:</span>
                <style>{`
                  @keyframes previewShimmer {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                  }
                  .preview-grad-text {
                    background-size: 200% auto;
                    animation: previewShimmer 2s ease infinite;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                  }
                `}</style>
                <span className="preview-grad-text font-mono font-bold text-sm"
                  style={{ backgroundImage: previewGrad }}>
                  #{selectedUser.sakiId}
                </span>
              </div>
            )}
          </div>

          {/* Icon section */}
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white font-bold text-sm">🖼️ أيقونة ID (اختياري)</p>
            <p className="text-gray-500 text-xs">ارفع أيقونة PNG/SVG صغيرة (16×16 أو 24×24 px)</p>

            <input
              value={iconUrl}
              onChange={e => setIconUrl(e.target.value)}
              placeholder="رابط الأيقونة (URL)..."
              className="w-full px-3 py-2.5 rounded-xl text-white placeholder-gray-500 text-xs outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />

            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">أو</span>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold active:scale-95 disabled:opacity-50"
                style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}>
                {uploading ? "⏳ جارٍ الرفع..." : "📁 رفع ملف أيقونة"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadIcon(f);
                }}
              />
            </div>

            {iconUrl && (
              <div className="flex items-center gap-2 p-2 rounded-xl"
                style={{ background: "rgba(0,0,0,0.3)" }}>
                <img src={iconUrl} alt="preview" className="w-6 h-6 object-contain" />
                <span className="text-gray-400 text-xs truncate">{iconUrl}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleApply}
              className="py-3 rounded-2xl font-black text-sm active:scale-95"
              style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", color: "white" }}>
              ✅ تطبيق الستايل
            </button>
            <button onClick={handleReset}
              className="py-3 rounded-2xl font-black text-sm active:scale-95"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
              🔄 إعادة تعيين
            </button>
          </div>
        </>
      )}
    </div>
  );
}
