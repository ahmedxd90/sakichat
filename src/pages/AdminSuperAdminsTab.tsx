// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useRef, useEffect } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";
import { SuperAdminBadge } from "../components/VipBadge";
import { CustomerServiceBadge } from "../components/CustomerServiceBadge";
import { ContentCreatorBadge } from "../components/ContentCreatorBadge";
import CCSection from "./CCSection";
import AdminProfileCoversTab from "./AdminProfileCoversTab";
import AdminPermissionsModal from "./AdminPermissionsModal";
import AdminTitleBadge from "../components/AdminTitleBadge";

const DEFAULT_BADGE_URL = "https://c.top4top.io/p_375029up61.jpg";
const DEFAULT_FRAME_URL = "https://h.top4top.io/p_3750wsw2o1.jpg";

export default function AdminSuperAdminsTab() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [csLoading, setCsLoading] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [uploadingBadge, setUploadingBadge] = useState(false);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [activeSection, setActiveSection] = useState<"superadmin" | "cs" | "cc" | "covers">("superadmin");
  const [ccLoading, setCcLoading] = useState<string | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<any>(null);
  const [assigningUser, setAssigningUser] = useState<any>(null); // for new assignment flow
  const badgeInputRef = useRef<HTMLInputElement>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from('profiles').select('*').limit(50);
      if (search) {
        query = query.or(`name.ilike.%${search}%,saki_id.ilike.%${search}%`);
      }
      const { data: u } = await query;
      setUsers(u || []);

      const { data: a } = await supabase.from('super_admin_assets').select('*').single();
      setAssets(a);
    };
    fetchData();
  }, [search]);

  const setSuperAdmin = async (args: any) => {};
  const setCustomerService = async (args: any) => {};
  const setContentCreator = async (args: any) => {};
  const generateUploadUrl = async (args: any) => "";
  const updateAssets = async (args: any) => {};

  const superAdmins = (users ?? []).filter((u: any) => u.is_super_admin);
  const csUsers = (users ?? []).filter((u: any) => u.is_customer_service);
  const ccUsers = (users ?? []).filter((u: any) => u.is_content_creator);
  const others = (users ?? []).filter((u: any) => !u.is_super_admin);
  const csOthers = (users ?? []).filter((u: any) => !u.is_customer_service);
  const ccOthers = (users ?? []).filter((u: any) => !u.is_content_creator);

  const handleToggle = async (userId: string, isSuperAdmin: boolean) => {
    const user = (users ?? []).find((u: any) => u.user_id === userId);
    const name = user?.name ?? "";
    if (isSuperAdmin) {
      // Removing super admin
      if (!confirm(`إزالة سوبر أدمن من ${name}؟`)) return;
      setLoading(userId);
      try {
        await setSuperAdmin({ targetUserId: userId, isSuperAdmin: false });
        toast.success("✅ تم إزالة الصلاحيات");
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(null); }
    } else {
      // Assigning new super admin — open permissions modal
      setAssigningUser(user);
    }
  };

  const handleToggleCC = async (userId: string, isCC: boolean) => {
    const name = (users ?? []).find((u: any) => u.user_id === userId)?.name ?? "";
    if (!confirm(isCC ? `إزالة لقب صانع محتوى من ${name}؟` : `تعيين ${name} صانع محتوى؟`)) return;
    setCcLoading(userId);
    try {
      await setContentCreator({ targetUserId: userId, isContentCreator: !isCC });
      toast.success(isCC ? "✅ تم إزالة اللقب" : "🎬 تم التعيين بنجاح!");
    } catch (e: any) { toast.error(e.message); }
    finally { setCcLoading(null); }
  };

  const handleToggleCS = async (userId: string, isCS: boolean) => {
    const name = (users ?? []).find((u: any) => u.user_id === userId)?.name ?? "";
    if (!confirm(isCS ? `إزالة لقب خدمة العملاء من ${name}؟` : `تعيين ${name} خدمة عملاء؟`)) return;
    setCsLoading(userId);
    try {
      await setCustomerService({ targetUserId: userId, isCustomerService: !isCS });
      toast.success(isCS ? "✅ تم إزالة اللقب" : "🎧 تم التعيين بنجاح!");
    } catch (e: any) { toast.error(e.message); }
    finally { setCsLoading(null); }
  };

  const handleUpload = async (file: File, type: "badge" | "frame") => {
    if (type === "badge") setUploadingBadge(true);
    else setUploadingFrame(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      await updateAssets(type === "badge" ? { badgeStorageId: storageId } : { frameStorageId: storageId });
      toast.success(type === "badge" ? "✅ تم تحديث الوسام" : "✅ تم تحديث الإطار");
    } catch (e: any) { toast.error(e.message); }
    finally {
      if (type === "badge") setUploadingBadge(false);
      else setUploadingFrame(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!title.trim()) return;
    setSavingTitle(true);
    try {
      await updateAssets({ title: title.trim() });
      toast.success("✅ تم تحديث اللقب");
      setTitle("");
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingTitle(false); }
  };

  const goldStyle: React.CSSProperties = {
    background: "linear-gradient(90deg,#ffd700,#ff8c00,#ffd700,#ff4500,#ffd700)",
    backgroundSize: "300% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "sa-gold 2s linear infinite",
    filter: "drop-shadow(0 0 8px rgba(255,215,0,0.6))",
  };

  const currentBadgeUrl = assets?.badgeUrl ?? DEFAULT_BADGE_URL;
  const currentFrameUrl = assets?.frameUrl ?? DEFAULT_FRAME_URL;
  const currentTitle = assets?.title ?? "سوبر أدمن";

  return (
    <div className="p-4 space-y-4" dir="rtl">
      {/* Section Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection("superadmin")}
          className="flex-1 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95"
          style={activeSection === "superadmin"
            ? { background: "linear-gradient(135deg,rgba(255,71,87,0.25),rgba(192,57,43,0.15))", border: "1px solid rgba(255,71,87,0.5)", color: "#ff4757" }
            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}
        >
          🔴 سوبر أدمن ({superAdmins.length})
        </button>
        <button
          onClick={() => setActiveSection("cs")}
          className="flex-1 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95"
          style={activeSection === "cs"
            ? { background: "linear-gradient(135deg,rgba(168,85,247,0.25),rgba(124,58,237,0.15))", border: "1px solid rgba(168,85,247,0.5)", color: "#a855f7" }
            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}
        >
          🎧 خدمة العملاء ({csUsers.length})
        </button>
        <button
          onClick={() => setActiveSection("cc")}
          className="flex-1 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95"
          style={activeSection === "cc"
            ? { background: "linear-gradient(135deg,rgba(59,130,246,0.25),rgba(29,78,216,0.15))", border: "1px solid rgba(59,130,246,0.5)", color: "#3b82f6" }
            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
          🎬 صانع محتوى ({ccUsers.length})
        </button>
      </div>
      {/* زر غلاف الملف منفصل */}
      <button
        onClick={() => setActiveSection("covers")}
        className="w-full py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95"
        style={activeSection === "covers"
          ? { background: "linear-gradient(135deg,rgba(236,72,153,0.25),rgba(219,39,119,0.15))", border: "1px solid rgba(236,72,153,0.5)", color: "#ec4899" }
          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
        🖼️ غلاف الملف الشخصي
      </button>

      {/* ── SUPER ADMIN SECTION ── */}
      {activeSection === "superadmin" && (
        <>
          {/* Header */}
          <div className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,rgba(255,71,87,0.15),rgba(192,57,43,0.1))", border: "1px solid rgba(255,71,87,0.3)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,215,0,0.06) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "sa-shimmer 2.5s ease-in-out infinite" }} />
            <div className="flex items-center gap-3">
              <img src={currentBadgeUrl} alt="" className="w-14 h-14 rounded-2xl object-contain"
                style={{ filter: "drop-shadow(0 0 12px rgba(255,71,87,0.9))", border: "2px solid rgba(255,71,87,0.4)" }} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-2xl" style={goldStyle}>{currentTitle}</span>
                  <SuperAdminBadge size="md" title={currentTitle} badgeUrl={currentBadgeUrl} />
                </div>
                <p className="text-gray-400 text-xs">الإطار والوسام يُمنحان تلقائياً عند التعيين</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl p-2 text-center" style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.2)" }}>
                <p className="text-red-400 font-black text-xl">{superAdmins.length}</p>
                <p className="text-gray-500 text-[10px]">سوبر أدمن</p>
              </div>
              <div className="rounded-xl p-2 flex flex-col items-center gap-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <img src={currentFrameUrl} alt="" className="w-8 h-8 object-contain" />
                <p className="text-gray-500 text-[10px]">إطار حصري</p>
              </div>
              <div className="rounded-xl p-2 flex flex-col items-center gap-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <img src={currentBadgeUrl} alt="" className="w-8 h-8 object-contain rounded-full" />
                <p className="text-gray-500 text-[10px]">وسام حصري</p>
              </div>
            </div>
          </div>

          {/* Customize assets */}
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,71,87,0.2)" }}>
            <p className="text-red-400 font-black text-sm flex items-center gap-2">
              <span>⚙️</span> تخصيص أصول سوبر أدمن
            </p>
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2">🏅 وسام سوبر أدمن</p>
              <div className="flex items-center gap-3">
                <img src={currentBadgeUrl} alt="" className="w-12 h-12 rounded-xl object-contain flex-shrink-0"
                  style={{ border: "1px solid rgba(255,71,87,0.3)", background: "rgba(255,71,87,0.05)" }} />
                <input ref={badgeInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "badge"); }} />
                <button onClick={() => badgeInputRef.current?.click()} disabled={uploadingBadge}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,71,87,0.15)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.35)" }}>
                  {uploadingBadge ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : "📁"}
                  {uploadingBadge ? "جاري الرفع..." : "رفع وسام جديد"}
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2">🖼️ إطار سوبر أدمن</p>
              <div className="flex items-center gap-3">
                <img src={currentFrameUrl} alt="" className="w-12 h-12 rounded-xl object-contain flex-shrink-0"
                  style={{ border: "1px solid rgba(255,71,87,0.3)", background: "rgba(255,71,87,0.05)" }} />
                <input ref={frameInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "frame"); }} />
                <button onClick={() => frameInputRef.current?.click()} disabled={uploadingFrame}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,71,87,0.15)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.35)" }}>
                  {uploadingFrame ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : "📁"}
                  {uploadingFrame ? "جاري الرفع..." : "رفع إطار جديد"}
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2">✏️ لقب سوبر أدمن</p>
              <div className="flex gap-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={`الحالي: ${currentTitle}`}
                  className="flex-1 px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,71,87,0.3)" }} />
                <button onClick={handleSaveTitle} disabled={!title.trim() || savingTitle}
                  className="px-4 py-2.5 rounded-xl text-xs font-black active:scale-95 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#ff4757,#c0392b)", color: "white" }}>
                  {savingTitle ? "..." : "حفظ"}
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو ID..."
            className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />

          {/* Current Super Admins */}
          {superAdmins.length > 0 && (
            <div>
              <p className="text-red-400 font-black text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
                سوبر أدمن الحاليون ({superAdmins.length})
              </p>
              <div className="space-y-2">
                {superAdmins.map((u: any) => (
                  <div key={u.id} className="rounded-2xl p-3 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg,rgba(255,71,87,0.12),rgba(192,57,43,0.08))", border: "1px solid rgba(255,71,87,0.35)" }}>
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,215,0,0.04) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "sa-shimmer 3s ease-in-out infinite" }} />
                    <div className="flex items-center gap-3">
                      <UserAvatar userId={u.user_id} avatarUrl={u.avatarUrl} name={u.name} size={48} isSuperAdmin={true} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-black text-sm" style={{ ...goldStyle, fontSize: 14 }}>{u.name}</span>
                          <SuperAdminBadge size="sm" title={currentTitle} badgeUrl={currentBadgeUrl} adminTitle={u.adminTitle} adminTitleColor1={u.adminTitleColor1} adminTitleColor2={u.adminTitleColor2} adminTitleIconUrl={u.adminTitleIconUrl} adminTitleBg={u.adminTitleBg} />
                        </div>
                        <p className="text-gray-500 text-xs font-mono">#{u.sakiId}</p>
                        {u.adminTitle && (
                          <div className="mt-0.5">
                            <AdminTitleBadge
                              title={u.adminTitle}
                              color1={u.adminTitleColor1}
                              color2={u.adminTitleColor2}
                              iconUrl={u.adminTitleIconUrl}
                              bgPresetId={u.adminTitleBg}
                              size="xs"
                            />
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleToggle(u.user_id, true)} disabled={loading === u.user_id}
                        className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50 flex items-center gap-1"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" }}>
                        {loading === u.user_id ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : "❌ إزالة"}
                      </button>
                      <button onClick={() => setPermissionsUser(u)}
                        className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 flex items-center gap-1"
                        style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.35)" }}>
                        🔐 صلاحيات
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
              <span className="text-red-400">🔴</span> تعيين سوبر أدمن جديد
            </p>
            {!users ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : others.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">لا يوجد مستخدمون</p>
            ) : (
              <div className="space-y-2">
                {others.map((u: any) => (
                  <div key={u.id} className="rounded-2xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-3">
                      <UserAvatar userId={u.user_id} avatarUrl={u.avatarUrl} name={u.name} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{u.name}</p>
                        <p className="text-gray-500 text-xs font-mono">#{u.sakiId} · {(u.goldCoins ?? 0).toLocaleString()} 🪙</p>
                        {u.isVip && <span className="text-[9px] text-yellow-400">PRO{u.proLevel ?? u.vipLevel}</span>}
                      </div>
                      <button onClick={() => handleToggle(u.user_id, false)} disabled={loading === u.user_id}
                        className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50 flex items-center gap-1"
                        style={{ background: "rgba(255,71,87,0.15)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.35)" }}>
                        {loading === u.user_id ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : "🔴 تعيين"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── PERMISSIONS MODALS ── */}
      {permissionsUser && (
        <AdminPermissionsModal
          user={permissionsUser}
          onClose={() => setPermissionsUser(null)}
          onSaved={() => setPermissionsUser(null)}
        />
      )}
      {assigningUser && (
        <AdminPermissionsModal
          user={{ ...assigningUser, adminPermissions: [] }}
          onClose={() => setAssigningUser(null)}
          isNewAssignment
          onAssign={async (permissions) => {
            setLoading(assigningUser.user_id);
            try {
              await setSuperAdmin({ targetUserId: assigningUser.user_id, isSuperAdmin: true, adminPermissions: permissions });
              toast.success("🔴 تم التعيين بنجاح!");
              setAssigningUser(null);
            } catch (e: any) { toast.error(e.message); }
            finally { setLoading(null); }
          }}
        />
      )}

      {/* ── CUSTOMER SERVICE SECTION ── */}
      {activeSection === "cs" && (
        <>
          {/* CS Header */}
          <div className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.15),rgba(124,58,237,0.1))", border: "1px solid rgba(168,85,247,0.35)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(105deg,transparent 40%,rgba(192,132,252,0.08) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "sa-shimmer 2.5s ease-in-out infinite" }} />
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 20px rgba(168,85,247,0.6)", border: "2px solid rgba(192,132,252,0.5)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M3 18v-6a9 9 0 0118 0v6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CustomerServiceBadge size="md" />
                </div>
                <p className="text-gray-400 text-xs">لقب بنفسجي لامع متحرك يظهر في الملف الشخصي</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl p-2 text-center" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <p className="text-purple-400 font-black text-xl">{csUsers.length}</p>
              <p className="text-gray-500 text-[10px]">خدمة عملاء حالياً</p>
            </div>
          </div>

          {/* Search */}
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو ID..."
            className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />

          {/* Current CS users */}
          {csUsers.length > 0 && (
            <div>
              <p className="text-purple-400 font-black text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse inline-block" />
                خدمة العملاء الحاليون ({csUsers.length})
              </p>
              <div className="space-y-2">
                {csUsers.map((u: any) => (
                  <div key={u.id} className="rounded-2xl p-3 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.12),rgba(124,58,237,0.08))", border: "1px solid rgba(168,85,247,0.35)" }}>
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(105deg,transparent 40%,rgba(192,132,252,0.05) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "sa-shimmer 3s ease-in-out infinite" }} />
                    <div className="flex items-center gap-3">
                      <UserAvatar userId={u.user_id} avatarUrl={u.avatarUrl} name={u.name} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-black text-sm text-white">{u.name}</span>
                          <CustomerServiceBadge size="xs" />
                        </div>
                        <p className="text-gray-500 text-xs font-mono">#{u.sakiId}</p>
                      </div>
                      <button onClick={() => handleToggleCS(u.user_id, true)} disabled={csLoading === u.user_id}
                        className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50 flex items-center gap-1"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" }}>
                        {csLoading === u.user_id ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : "❌ إزالة"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assign new CS */}
          <div>
            <p className="text-gray-400 font-bold text-sm mb-2 flex items-center gap-2">
              <span className="text-purple-400">🎧</span> تعيين خدمة عملاء جديد
            </p>
            {!users ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : csOthers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">لا يوجد مستخدمون</p>
            ) : (
              <div className="space-y-2">
                {csOthers.map((u: any) => (
                  <div key={u.id} className="rounded-2xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-3">
                      <UserAvatar userId={u.user_id} avatarUrl={u.avatarUrl} name={u.name} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{u.name}</p>
                        <p className="text-gray-500 text-xs font-mono">#{u.sakiId}</p>
                        {u.isVip && <span className="text-[9px] text-yellow-400">PRO{u.proLevel ?? u.vipLevel}</span>}
                      </div>
                      <button onClick={() => handleToggleCS(u.user_id, false)} disabled={csLoading === u.user_id}
                        className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50 flex items-center gap-1"
                        style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.35)" }}>
                        {csLoading === u.user_id ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> : "🎧 تعيين"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeSection === "cc" && (
        <CCSection
          ccUsers={ccUsers}
          ccOthers={ccOthers}
          users={users}
          search={search}
          setSearch={setSearch}
          ccLoading={ccLoading}
          handleToggleCC={handleToggleCC}
        />
      )}

      {activeSection === "covers" && <AdminProfileCoversTab />}

      <style>{`
        @keyframes sa-gold { 0%{background-position:0% center} 100%{background-position:300% center} }
        @keyframes sa-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
    </div>
  );
}
