// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useRef, useEffect } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";

export default function AdminProfileCoversTab() {
  const [sakiId, setSakiId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [covers, setCovers] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('profile_covers').select('*');
      setCovers(data || []);
    };
    fetchData();
  }, []);

  const generateUploadUrl = async () => "";
  const assignCover = async (args: any) => ({ targetName: "User" });
  const removeCover = async (args: any) => {};

  const handleAssign = async () => {
    if (!sakiId.trim()) { toast.error("أدخل معرف المستخدم (Saki ID)"); return; }
    if (!selectedFile) { toast.error("اختر ملف SVGA"); return; }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type || "application/octet-stream" },
        body: selectedFile,
      });
      const { storageId } = await res.json();
      const result = await assignCover({
        targetSakiId: sakiId.trim(),
        svgaStorageId: storageId,
      });
      toast.success(`✅ تم إرسال الغلاف لـ ${result.targetName}`);
      setSakiId("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`إزالة غلاف ${name}؟`)) return;
    setRemoving(userId);
    try {
      await removeCover({ targetUserId: userId });
      toast.success("✅ تم إزالة الغلاف");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.15),rgba(219,39,119,0.1))", border: "1px solid rgba(236,72,153,0.35)" }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#ec4899,#db2777)", boxShadow: "0 0 20px rgba(236,72,153,0.5)" }}>
            🖼️
          </div>
          <div>
            <p className="text-white font-black text-sm">غلاف الملف الشخصي</p>
            <p className="text-gray-400 text-xs mt-0.5">إرسال غلاف SVGA متحرك لأي مستخدم</p>
          </div>
        </div>
        <div className="mt-3 rounded-xl p-2 text-center"
          style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)" }}>
          <p className="text-pink-400 font-black text-xl">{covers?.length ?? 0}</p>
          <p className="text-gray-500 text-[10px]">غلاف نشط</p>
        </div>
      </div>

      {/* إرسال غلاف جديد */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(236,72,153,0.25)" }}>
        <p className="text-pink-400 font-black text-sm flex items-center gap-2">
          <span>✨</span> إرسال غلاف جديد
        </p>

        {/* Saki ID */}
        <div>
          <p className="text-gray-400 text-xs font-bold mb-1.5">معرف المستخدم (Saki ID)</p>
          <input
            value={sakiId}
            onChange={(e) => setSakiId(e.target.value)}
            placeholder="أدخل Saki ID..."
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(236,72,153,0.3)" }}
          />
        </div>

        {/* ملف SVGA */}
        <div>
          <p className="text-gray-400 text-xs font-bold mb-1.5">ملف الغلاف (SVGA فقط)</p>
          <input
            ref={fileRef}
            type="file"
            accept=".svga,application/octet-stream"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: "rgba(236,72,153,0.1)", border: "1px dashed rgba(236,72,153,0.5)", color: "#ec4899" }}>
            {selectedFile ? (
              <>
                <span>✅</span>
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
              </>
            ) : (
              <>
                <span>📁</span>
                <span>اختر ملف SVGA</span>
              </>
            )}
          </button>
        </div>

        {/* زر الإرسال */}
        <button
          onClick={handleAssign}
          disabled={uploading || !sakiId.trim() || !selectedFile}
          className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#ec4899,#db2777)", boxShadow: "0 4px 15px rgba(236,72,153,0.35)" }}>
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري الرفع والإرسال...
            </>
          ) : (
            <>
              <span>🚀</span>
              إرسال الغلاف
            </>
          )}
        </button>
      </div>

      {/* قائمة الغلافات الحالية */}
      <div>
        <p className="text-gray-400 font-black text-sm mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse inline-block" />
          الغلافات النشطة ({covers?.length ?? 0})
        </p>
        {!covers ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : covers.length === 0 ? (
          <div className="rounded-2xl p-6 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-4xl mb-2">🖼️</p>
            <p className="text-gray-500 text-sm">لا توجد غلافات مُعيّنة بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {covers.map((c: any) => (
              <div key={c.id} className="rounded-2xl p-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(236,72,153,0.2)" }}>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    userId={c.user_id as string}
                    avatarUrl={c.userAvatarUrl}
                    name={c.userName}
                    size={44}
                    showFrame={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{c.userName}</p>
                    <p className="text-gray-500 text-xs font-mono">#{c.userSakiId}</p>
                    <p className="text-pink-400 text-[10px] mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString("ar")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                      style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)" }}>
                      <img src={c.svgaUrl} alt="" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as any).style.display = "none"; }} />
                    </div>
                    <button
                      onClick={() => handleRemove(c.user_id as string, c.userName)}
                      disabled={removing === c.user_id}
                      className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50 flex items-center gap-1"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" }}>
                      {removing === c.user_id
                        ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : "❌ إزالة"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
