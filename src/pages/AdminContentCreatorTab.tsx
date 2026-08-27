// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";
import { ContentCreatorBadge } from "../components/ContentCreatorBadge";

export default function AdminContentCreatorTab() {
  const [search, setSearch] = useState("");
  const [ccLoading, setCcLoading] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      let query = supabase.from('profiles').select('*').limit(50);
      if (search) {
        query = query.or(`name.ilike.%${search}%,saki_id.ilike.%${search}%`);
      }
      const { data } = await query;
      setUsers(data || []);
    };
    fetchUsers();
  }, [search]);

  const setContentCreator = async (args: any) => {};

  const ccUsers = (users ?? []).filter((u: any) => u.is_content_creator);
  const ccOthers = (users ?? []).filter((u: any) => !u.is_content_creator);

  const handleToggle = async (userId: string, isCC: boolean) => {
    const name = (users ?? []).find((u: any) => u.user_id === userId)?.name ?? "";
    if (!confirm(isCC ? `إزالة لقب صانع محتوى من ${name}؟` : `تعيين ${name} صانع محتوى؟`)) return;
    setCcLoading(userId);
    try {
      await setContentCreator({ targetUserId: userId, isContentCreator: !isCC });
      toast.success(isCC ? "✅ تم إزالة اللقب" : "🎬 تم التعيين بنجاح!");
    } catch (e: any) { toast.error(e.message); }
    finally { setCcLoading(null); }
  };

  return (
    <div className="p-4 space-y-4" dir="rtl">
      {/* Header */}
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.15),rgba(29,78,216,0.1))", border: "1px solid rgba(59,130,246,0.35)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg,transparent 40%,rgba(96,165,250,0.08) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "cc-shimmer 2.5s ease-in-out infinite" }} />
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 0 20px rgba(59,130,246,0.6)", border: "2px solid rgba(96,165,250,0.5)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
              <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.6" />
              <circle cx="12" cy="13" r="1.5" fill="white" />
            </svg>
          </div>
          <div className="flex-1">
            <ContentCreatorBadge size="md" />
            <p className="text-gray-400 text-xs mt-1">شارة زرقاء متوهجة + قلب أزرق في المقاعد</p>
          </div>
        </div>
        <div className="mt-3 rounded-xl p-2 text-center"
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <p className="text-blue-400 font-black text-xl">{ccUsers.length}</p>
          <p className="text-gray-500 text-[10px]">صانع محتوى حالياً</p>
        </div>
      </div>

      {/* Search */}
      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث بالاسم أو ID..."
        className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />

      {/* Current CC users */}
      {ccUsers.length > 0 && (
        <div>
          <p className="text-blue-400 font-black text-sm mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            صانعو المحتوى الحاليون ({ccUsers.length})
          </p>
          <div className="space-y-2">
            {ccUsers.map((u: any) => (
              <div key={u.id} className="rounded-2xl p-3 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.12),rgba(29,78,216,0.08))", border: "1px solid rgba(59,130,246,0.35)" }}>
                <div className="flex items-center gap-3">
                  <UserAvatar userId={u.user_id} avatarUrl={u.avatarUrl} name={u.name} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="font-black text-sm text-white">{u.name}</span>
                      <ContentCreatorBadge size="xs" />
                    </div>
                    <p className="text-gray-500 text-xs font-mono">#{u.sakiId}</p>
                  </div>
                  <button onClick={() => handleToggle(u.user_id, true)} disabled={ccLoading === u.user_id}
                    className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50 flex items-center gap-1"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" }}>
                    {ccLoading === u.user_id
                      ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : "❌ إزالة"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign new */}
      <div>
        <p className="text-gray-400 font-bold text-sm mb-2 flex items-center gap-2">
          <span className="text-blue-400">🎬</span> تعيين صانع محتوى جديد
        </p>
        {!users ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ccOthers.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">لا يوجد مستخدمون</p>
        ) : (
          <div className="space-y-2">
            {ccOthers.map((u: any) => (
              <div key={u.id} className="rounded-2xl p-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3">
                  <UserAvatar userId={u.user_id} avatarUrl={u.avatarUrl} name={u.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{u.name}</p>
                    <p className="text-gray-500 text-xs font-mono">#{u.sakiId}</p>
                    {u.is_vip && <span className="text-[9px] text-yellow-400">VIP{u.vip_level}</span>}
                  </div>
                  <button onClick={() => handleToggle(u.user_id, false)} disabled={ccLoading === u.user_id}
                    className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50 flex items-center gap-1"
                    style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.35)" }}>
                    {ccLoading === u.user_id
                      ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      : "🎬 تعيين"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes cc-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
    </div>
  );
}
