// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef } from "react";
import { toast } from "../lib/toast";
import { ARAB_COUNTRIES } from "../data/countries";
import AgentSystemBadge from "../components/AgentSystemBadge";
import FamilyLeaderboard from "./family/FamilyLeaderboard";
import FamilyWithdraw from "./family/FamilyWithdraw";
import { FamilyView } from "./family/familyUtils";

interface FamilyPageProps { onBack: () => void; }
type View = FamilyView;

export default function FamilyPage({ onBack }: FamilyPageProps) {
  const myFamily = useQuery(api.families.getMyFamily);
  const allFamilies = useQuery(api.families.listFamilies);
  const pendingRequests = useQuery(api.families.getPendingJoinRequests);
  const profitReport = useQuery(api.families.getOwnerProfitReport);
  const myMemberInfo = useQuery(api.families.getMyFamilyMemberInfo);
  const myProfile = useQuery(api.auth.loggedInUser);

  const myCreationRequest = useQuery(api.families.getMyFamilyCreationRequest);
  const createFamilyMutation = useMutation(api.families.createFamily);
  const generateUploadUrl = useMutation(api.families.generateUploadUrl);
  const inviteMember = useMutation(api.families.inviteToFamily);
  const removeMember = useMutation(api.families.removeMemberFromFamily);
  const respondToRequest = useMutation(api.families.respondToJoinRequest);
  const requestJoin = useMutation(api.families.requestJoinFamily);
  const setRole = useMutation(api.families.setFamilyMemberRole);
  const updateFamilyMutation = useMutation(api.families.updateFamily);
  const leaveFamilyMutation = useMutation(api.families.leaveFamily);

  const [view, setView] = useState<View>("list");
  const [viewInitialized, setViewInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createAvatarFile, setCreateAvatarFile] = useState<File|null>(null);
  const [createAvatarPreview, setCreateAvatarPreview] = useState("");
  const createAvatarRef = useRef<HTMLInputElement>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File|null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState("");
  const editAvatarRef = useRef<HTMLInputElement>(null);
  const [inviteSakiId, setInviteSakiId] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const isOwner = myFamily?.myRole === "owner";
  const isAdmin = myFamily?.myRole === "admin";
  const pendingCount = myFamily?.pendingCount ?? 0;

  if (!viewInitialized && myFamily !== undefined) {
    setViewInitialized(true);
    if (myFamily) setView("my_family");
  }

  const handleAvatarChange = (file: File, setter: (f: File|null)=>void, previewSetter: (s: string)=>void) => {
    setter(file);
    const reader = new FileReader();
    reader.onload = (e) => previewSetter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (file: File): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
    const { storageId } = await result.json();
    return storageId;
  };

  const handleCreate = async () => {
    if (!createName.trim()) { toast.error("أدخل اسم العائلة"); return; }
    setLoading(true);
    try {
      let storageId: Id<"_storage">|undefined;
      if (createAvatarFile) storageId = await uploadAvatar(createAvatarFile);
      await createFamilyMutation({ name: createName.trim(), description: createDesc||undefined, avatarStorageId: storageId });
      toast.success("✅ تم إرسال طلب إنشاء العائلة! بانتظار موافقة الإدارة.");
      setCreateName(""); setCreateDesc(""); setCreateAvatarFile(null); setCreateAvatarPreview("");
      setView("list");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleUpdateFamily = async () => {
    setLoading(true);
    try {
      let storageId: Id<"_storage">|undefined;
      if (editAvatarFile) storageId = await uploadAvatar(editAvatarFile);
      await updateFamilyMutation({ name: editName||undefined, description: editDesc||undefined, avatarStorageId: storageId });
      toast.success("✅ تم تحديث العائلة");
      setView("settings");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleInvite = async () => {
    if (!inviteSakiId.trim()) { toast.error("أدخل SAKI ID"); return; }
    setLoading(true);
    try {
      const result = await inviteMember({ targetSakiId: inviteSakiId.trim() });
      toast.success(`✅ تمت إضافة ${result.targetName} للعائلة!`);
      setShowInvite(false); setInviteSakiId("");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleRemoveMember = async (userId: Id<"users">) => {
    if (!confirm("هل تريد إزالة هذا العضو؟")) return;
    try { await removeMember({ targetUserId: userId }); toast.success("تم إزالة العضو"); setSelectedMember(null); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleRespond = async (requestId: Id<"familyJoinRequests">, approve: boolean) => {
    try { await respondToRequest({ requestId, approve }); toast.success(approve ? "✅ تم قبول الطلب" : "تم رفض الطلب"); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleRequestJoin = async (familyId: Id<"families">) => {
    try { await requestJoin({ familyId }); toast.success("✅ تم إرسال طلب الانضمام!"); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleSetRole = async (userId: Id<"users">, role: "admin"|"member") => {
    try {
      await setRole({ targetUserId: userId, role });
      toast.success(role === "admin" ? "✅ تم ترقية العضو لمشرف" : "تم تغيير الدور لعضو");
      setSelectedMember(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleLeaveFamily = async () => {
    if (!confirm("هل تريد مغادرة العائلة؟")) return;
    try {
      await leaveFamilyMutation({});
      toast.success("✅ غادرت العائلة");
      setView("list");
    } catch (e: any) { toast.error(e.message); }
  };

  const filteredFamilies = (allFamilies ?? []).filter(f =>
    !searchQuery || f.name.includes(searchQuery) || (f.aginsId && f.aginsId.includes(searchQuery))
  );

  const country = ARAB_COUNTRIES.find(c => c.code === myFamily?.country);
  const userCountry = ARAB_COUNTRIES.find(c => c.code === (myProfile as any)?.country);

  // ── CREATE ─────────────────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
        <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setView("list")} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <h2 className="text-white font-bold text-base">👨‍👩‍👧‍👦 إنشاء عائلة جديدة</h2>
            <div className="w-9"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-10">
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => createAvatarRef.current?.click()}
              className="relative w-28 h-28 rounded-3xl overflow-hidden active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.25),rgba(168,85,247,0.25))", border: "2px dashed rgba(236,72,153,0.5)" }}>
              {createAvatarPreview
                ? <img src={createAvatarPreview} alt="" className="w-full h-full object-cover"/>
                : <div className="flex flex-col items-center justify-center w-full h-full gap-1"><span className="text-4xl">📷</span><span className="text-pink-400 text-xs font-bold">اختر صورة</span></div>}
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              </div>
            </button>
            <input ref={createAvatarRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0], setCreateAvatarFile, setCreateAvatarPreview)}/>
            <p className="text-gray-500 text-xs">اضغط لاختيار صورة العائلة</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-gray-400 text-xs font-bold">اسم العائلة *</label>
            <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="أدخل اسم العائلة..." maxLength={30}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-pink-500"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-gray-400 text-xs font-bold">وصف العائلة (اختياري)</label>
            <textarea value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} placeholder="اكتب وصفاً للعائلة..." rows={3} maxLength={100}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-pink-500 resize-none"/>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <span className="text-2xl">{userCountry?.flag ?? "🌍"}</span>
            <div><p className="text-white text-sm font-bold">{userCountry?.name ?? "غير محدد"}</p><p className="text-gray-500 text-xs">دولة العائلة (تلقائي من حسابك)</p></div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div><p className="text-purple-400 font-black text-base">مجاناً</p><p className="text-gray-500 text-xs">يحتاج موافقة السوبر أدمن قبل الإنشاء</p></div>
          </div>
          <button onClick={handleCreate} disabled={loading || !createName.trim()}
            className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)", boxShadow: "0 8px 24px rgba(236,72,153,0.3)" }}>
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <span className="text-xl">📨</span>}
            <span>{loading ? "جارٍ الإرسال..." : "إرسال طلب الإنشاء"}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── EDIT FAMILY ────────────────────────────────────────────────────────────
  if (view === "edit_family" && myFamily) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
        <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setView("settings")} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <h2 className="text-white font-bold text-base">✏️ تعديل العائلة</h2>
            <div className="w-9"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-10">
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => editAvatarRef.current?.click()}
              className="relative w-28 h-28 rounded-3xl overflow-hidden active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.25),rgba(168,85,247,0.25))", border: "2px dashed rgba(236,72,153,0.5)" }}>
              {(editAvatarPreview || myFamily.avatarUrl)
                ? <img src={editAvatarPreview || myFamily.avatarUrl} alt="" className="w-full h-full object-cover"/>
                : <div className="flex flex-col items-center justify-center w-full h-full gap-1"><span className="text-4xl">📷</span></div>}
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              </div>
            </button>
            <input ref={editAvatarRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0], setEditAvatarFile, setEditAvatarPreview)}/>
          </div>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={myFamily.name}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-pink-500"/>
          <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder={myFamily.description || "وصف العائلة..."} rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-pink-500 resize-none"/>
          <button onClick={handleUpdateFamily} disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-black disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "💾 حفظ التغييرات"}
          </button>
        </div>
      </div>
    );
  }

  // ── SETTINGS ───────────────────────────────────────────────────────────────
  if (view === "settings" && myFamily) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
        <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setView("my_family")} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <h2 className="text-white font-bold text-base">⚙️ إعدادات العائلة</h2>
            <div className="w-9"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
          <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg,#1a0a2e,#0d1a2e)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.3),rgba(168,85,247,0.3))", border: "2px solid rgba(236,72,153,0.3)" }}>
                {myFamily.avatarUrl ? <img src={myFamily.avatarUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl">👨‍👩‍👧‍👦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-black text-xl truncate">{myFamily.name}</h3>
                {myFamily.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{myFamily.description}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs bg-pink-500/20 border border-pink-500/30 text-pink-400 px-2 py-0.5 rounded-full font-bold">#{myFamily.aginsId}</span>
                  {country && <span className="text-base">{country.flag}</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "الأعضاء", value: myFamily.members.length, icon: "👥" },
                { label: "ماس العائلة", value: (myFamily.totalDiamonds ?? 0).toLocaleString(), icon: "💎" },
                { label: "أرباحي", value: (myFamily.ownerDiamonds ?? 0).toLocaleString(), icon: "👑" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-2xl p-3 text-center">
                  <p className="text-lg">{s.icon}</p>
                  <p className="text-white font-black text-sm">{s.value}</p>
                  <p className="text-gray-500 text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div className="flex-1">
              <p className="text-purple-300 font-black text-lg">{(myMemberInfo?.diamonds ?? 0).toLocaleString()}</p>
              <p className="text-gray-500 text-xs">ماسي الكلي</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 text-sm font-bold">+{(myFamily.ownerDiamonds ?? 0).toLocaleString()}</p>
              <p className="text-gray-600 text-[10px]">من الأعضاء (10%)</p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold text-sm px-1">👥 قائمة الأعضاء ({myFamily.members.length})</h3>
            {myFamily.members.map((m, i) => (
              <div key={m._id}
                className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3 active:bg-white/10 transition-colors cursor-pointer"
                onClick={() => (isOwner || isAdmin) && m.role !== "owner" ? setSelectedMember(m) : null}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${i===0?"bg-yellow-500/20 text-yellow-400":i===1?"bg-gray-400/20 text-gray-300":i===2?"bg-orange-500/20 text-orange-400":"bg-white/5 text-gray-600"}`}>
                  {i === 0 ? "👑" : i + 1}
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {m.profile?.avatarUrl ? <img src={m.profile.avatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-white font-bold text-sm">{m.profile?.name?.[0] ?? "؟"}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white text-sm font-bold truncate">{m.profile?.name ?? "مجهول"}</p>
                    {m.role === "owner" && <span className="text-[9px] bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">👑 مالك</span>}
                    {m.role === "admin" && <span className="text-[9px] bg-purple-500/20 border border-purple-500/30 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">🛡️ مشرف</span>}
                  </div>
                  <p className="text-gray-500 text-xs font-mono">#{m.profile?.sakiId}</p>
                </div>
                <p className="text-purple-400 text-xs font-bold flex-shrink-0">{(m.diamonds ?? 0).toLocaleString()} 💎</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2">
            <button onClick={() => { setEditName(myFamily.name); setEditDesc(myFamily.description ?? ""); setEditAvatarPreview(myFamily.avatarUrl ?? ""); setView("edit_family"); }}
              className="w-full py-3.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98]">
              ✏️ تعديل معلومات العائلة
            </button>
            <button onClick={() => setView("revenue")}
              className="w-full py-3.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98]">
              💎 لوحة الإيرادات
            </button>
            <button onClick={() => setView("requests")}
              className="w-full py-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] relative">
              📋 طلبات الانضمام
              {pendingCount > 0 && <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">{pendingCount}</span>}
            </button>
          </div>
        </div>
        {selectedMember && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setSelectedMember(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <div className="relative bg-[#1a1a2e] rounded-t-3xl border-t border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-white/20 rounded-full"/></div>
              <div className="flex items-center gap-3 mb-5 p-3 bg-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {selectedMember.profile?.avatarUrl ? <img src={selectedMember.profile.avatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-white font-bold text-lg">{selectedMember.profile?.name?.[0] ?? "؟"}</span>}
                </div>
                <div>
                  <p className="text-white font-bold">{selectedMember.profile?.name ?? "مجهول"}</p>
                  <p className="text-gray-500 text-xs font-mono">#{selectedMember.profile?.sakiId}</p>
                  <p className="text-purple-400 text-xs mt-0.5">{(selectedMember.diamonds ?? 0).toLocaleString()} 💎</p>
                </div>
              </div>
              <div className="space-y-2">
                {isOwner && selectedMember.role === "member" && (
                  <button onClick={() => handleSetRole(selectedMember.userId, "admin")} className="w-full py-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold text-sm flex items-center justify-center gap-2">🛡️ ترقية لمشرف</button>
                )}
                {isOwner && selectedMember.role === "admin" && (
                  <button onClick={() => handleSetRole(selectedMember.userId, "member")} className="w-full py-3 rounded-2xl bg-gray-500/15 border border-gray-500/30 text-gray-400 font-bold text-sm flex items-center justify-center gap-2">👤 تخفيض لعضو</button>
                )}
                <button onClick={() => handleRemoveMember(selectedMember.userId)} className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2">🚫 إزالة من العائلة</button>
                <button onClick={() => setSelectedMember(null)} className="w-full py-3 rounded-2xl bg-white/5 text-gray-400 font-medium text-sm">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── REQUESTS ───────────────────────────────────────────────────────────────
  if (view === "requests") {
    return (
      <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
        <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setView(isOwner ? "settings" : "my_family")} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <h2 className="text-white font-bold text-base">📋 طلبات الانضمام</h2>
            <div className="w-9"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-10">
          {!pendingRequests || pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3"><span className="text-6xl">📭</span><p className="text-gray-400 text-sm">لا توجد طلبات انضمام معلقة</p></div>
          ) : pendingRequests.map((req) => (
            <div key={req._id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                {req.profile?.avatarUrl ? <img src={req.profile.avatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-white font-bold text-lg">{req.profile?.name?.[0] ?? "؟"}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">{req.profile?.name ?? "مجهول"}</p>
                <p className="text-gray-500 text-xs font-mono">#{req.profile?.sakiId}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRespond(req._id, true)} className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center active:scale-95">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </button>
                <button onClick={() => handleRespond(req._id, false)} className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center active:scale-95">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── REVENUE ────────────────────────────────────────────────────────────────
  if (view === "revenue") {
    return (
      <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
        <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setView("settings")} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <h2 className="text-white font-bold text-base">💎 لوحة الإيرادات</h2>
            <div className="w-9"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
          {!profitReport ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-4 text-center">
                  <p className="text-3xl mb-1">💎</p>
                  <p className="text-white font-black text-xl">{(profitReport.totalFamilyDiamonds ?? 0).toLocaleString()}</p>
                  <p className="text-gray-400 text-xs mt-0.5">إجمالي ماس العائلة</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 rounded-2xl p-4 text-center">
                  <p className="text-3xl mb-1">👑</p>
                  <p className="text-white font-black text-xl">{(profitReport.ownerTotalDiamonds ?? 0).toLocaleString()}</p>
                  <p className="text-gray-400 text-xs mt-0.5">ماسك الكلي</p>
                </div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-green-400 font-bold text-base">{(profitReport.ownerDiamondsFromMembers ?? 0).toLocaleString()} 💎</p>
                  <p className="text-gray-400 text-xs">أرباحك من الأعضاء (10%)</p>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <p className="text-blue-400 font-bold text-sm mb-2">📊 سياسة السحب</p>
                <p className="text-gray-400 text-xs mb-3">كل 120,000 ماسة = 10 دولار</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[120000,240000,360000,480000,600000,720000].map((tier, i) => (
                    <div key={tier} className={`rounded-xl p-2 text-center ${(profitReport.ownerTotalDiamonds ?? 0) >= tier ? "bg-green-500/20 border border-green-500/30" : "bg-white/5 border border-white/10"}`}>
                      <p className={`text-xs font-bold ${(profitReport.ownerTotalDiamonds ?? 0) >= tier ? "text-green-400" : "text-gray-500"}`}>{(tier/1000).toFixed(0)}k 💎</p>
                      <p className={`text-[10px] font-bold mt-0.5 ${(profitReport.ownerTotalDiamonds ?? 0) >= tier ? "text-green-300" : "text-gray-600"}`}>${(i+1)*10}</p>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="text-white font-bold text-sm">🏆 ترتيب الأعضاء</h3>
              <div className="space-y-2">
                {profitReport.members.map((m, i) => (
                  <div key={m.sakiId} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${i===0?"bg-yellow-500/20 text-yellow-400":i===1?"bg-gray-400/20 text-gray-300":i===2?"bg-orange-500/20 text-orange-400":"bg-white/5 text-gray-500"}`}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{m.name}</p>
                      <p className="text-gray-500 text-xs font-mono">#{m.sakiId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-400 text-sm font-bold">{m.diamonds.toLocaleString()} 💎</p>
                      <p className="text-green-400 text-xs">+{m.ownerShare.toLocaleString()} لك</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if (view === "leaderboard") {
    return (
      <FamilyLeaderboard
        allFamilies={allFamilies ?? []}
        myFamily={myFamily}
        onBack={() => setView("list")}
      />
    );
  }

  // ── WITHDRAW ───────────────────────────────────────────────────────────────
  if (view === "withdraw") {
    const myDiamonds = myMemberInfo?.diamonds ?? 0;
    return (
      <FamilyWithdraw
        myDiamonds={myDiamonds}
        onBack={() => setView("my_info")}
      />
    );
  }

  // ── MY INFO (محسّن - بدون زر السحب) ───────────────────────────────────────
  if (view === "my_info") {
    const myDiamonds = myMemberInfo?.diamonds ?? 0;
    const tiers = [120000,240000,360000,480000,600000,720000];
    const maxTierIndex = tiers.filter(t => myDiamonds >= t).length;
    const currentTierValue = maxTierIndex * 10;
    const seatHours = myMemberInfo?.seatHours ?? 0;
    const activeDays = myMemberInfo?.activeDays ?? 0;
    const joinedAt = myMemberInfo?.joinedAt ?? 0;
    const role = myMemberInfo?.role ?? "member";
    const daysInFamily = joinedAt ? Math.floor((Date.now() - joinedAt) / (1000*60*60*24)) : 0;

    return (
      <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
        <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setView("my_family")} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <h2 className="text-white font-bold text-base">📊 معلوماتي في العائلة</h2>
            <div className="w-9"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
          {/* بطاقة الماس */}
          <div className="rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg,#4c1d95,#831843,#1e1b4b)" }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle,white,transparent)", transform: "translate(30%,-30%)" }}/>
            <div className="relative z-10 p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-4xl border border-white/20">💎</div>
                <div>
                  <p className="text-white/70 text-sm">ماسي الكلي</p>
                  <p className="text-white font-black text-3xl">{myDiamonds.toLocaleString()}</p>
                  <span className="text-[10px] bg-white/15 text-white/80 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">
                    {role === "owner" ? "👑 مالك" : role === "admin" ? "🛡️ مشرف" : "👤 عضو"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                  <p className="text-xl mb-1">⏱️</p>
                  <p className="text-white font-black text-base">{seatHours.toLocaleString()}</p>
                  <p className="text-white/60 text-[10px]">ساعات المقعد</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                  <p className="text-xl mb-1">📅</p>
                  <p className="text-white font-black text-base">{activeDays.toLocaleString()}</p>
                  <p className="text-white/60 text-[10px]">أيام الفعالية</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                  <p className="text-xl mb-1">🗓️</p>
                  <p className="text-white font-black text-base">{daysInFamily}</p>
                  <p className="text-white/60 text-[10px]">يوم في العائلة</p>
                </div>
              </div>
            </div>
          </div>

          {/* كيف يُحسب الماس */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.1),rgba(236,72,153,0.08))", border: "1px solid rgba(168,85,247,0.2)" }}>
            <div className="p-4">
              <p className="text-purple-300 font-bold text-sm mb-3">💡 كيف يُحسب الماس؟</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0"><span className="text-base">🎁</span></div>
                  <div className="flex-1"><p className="text-white text-xs font-bold">هدايا عادية</p><p className="text-gray-400 text-[11px]">70% من قيمة الهدايا المستقبَلة</p></div>
                  <span className="text-purple-400 font-black text-sm">70%</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0"><span className="text-base">🎰</span></div>
                  <div className="flex-1"><p className="text-white text-xs font-bold">هدايا الحظ</p><p className="text-gray-400 text-[11px]">10% من هدايا الحظ فقط</p></div>
                  <span className="text-pink-400 font-black text-sm">10%</span>
                </div>
                {role === "owner" && (
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5">
                    <div className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0"><span className="text-base">👑</span></div>
                    <div className="flex-1"><p className="text-white text-xs font-bold">مكافأة المالك</p><p className="text-gray-400 text-[11px]">10% من ماس كل عضو</p></div>
                    <span className="text-yellow-400 font-black text-sm">+10%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* سياسة السحب */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.05))", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3"><span className="text-lg">📊</span><p className="text-green-400 font-bold text-sm">سياسة السحب عبر وكيل الشحن</p></div>
              <p className="text-gray-400 text-xs mb-3">كل 120,000 ماسة = 10 دولار · اذهب للرسائل ← تحويل</p>
              <div className="grid grid-cols-3 gap-1.5">
                {tiers.map((tier, i) => (
                  <div key={tier} className={`rounded-xl p-2.5 text-center ${myDiamonds >= tier ? "bg-green-500/20 border border-green-500/30" : "bg-white/5 border border-white/8"}`}>
                    <p className={`text-xs font-black ${myDiamonds >= tier ? "text-green-400" : "text-gray-500"}`}>{(tier/1000).toFixed(0)}k 💎</p>
                    <p className={`text-[11px] font-bold mt-0.5 ${myDiamonds >= tier ? "text-green-300" : "text-gray-600"}`}>${(i+1)*10}</p>
                  </div>
                ))}
              </div>
              {currentTierValue > 0 ? (
                <div className="mt-3 bg-green-500/15 border border-green-500/25 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div><p className="text-green-400 font-black text-base">يمكنك سحب ${currentTierValue}</p><p className="text-gray-500 text-xs">اذهب للرسائل ← تحويل ← تحويل ماس</p></div>
                </div>
              ) : (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div><p className="text-gray-400 text-sm font-bold">تحتاج {Math.max(0, 120000 - myDiamonds).toLocaleString()} ماسة إضافية</p><p className="text-gray-600 text-xs">للوصول لأول مستوى سحب (120k)</p></div>
                </div>
              )}
            </div>
          </div>

          <AgentSystemBadge myDiamonds={myDiamonds}/>

          {currentTierValue > 0 && (
            <button onClick={() => setView("withdraw")}
              className="w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2 active:scale-[0.98]"
              style={{background:"linear-gradient(135deg,#a855f7,#ec4899)",boxShadow:"0 8px 24px rgba(168,85,247,0.3)"}}>
              💸 سحب الماس لوكيل الشحن
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── MY FAMILY ──────────────────────────────────────────────────────────────
  if (view === "my_family" && myFamily) {
    const topSenders = [...myFamily.members].sort((a,b) => (b.profile?.totalCoinsSent??0)-(a.profile?.totalCoinsSent??0)).slice(0,3);
    const topReceivers = [...myFamily.members].sort((a,b) => (b.diamonds??0)-(a.diamonds??0)).slice(0,3);

    return (
      <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
        <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <h2 className="text-white font-bold text-base truncate max-w-[160px]">👨‍👩‍👧‍👦 {myFamily.name}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setView("my_info")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>
                📊 معلوماتي
              </button>
              {isOwner && (
                <button onClick={() => setView("settings")}
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-10">
          {/* بطاقة العائلة */}
          <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#be185d 0%,#7c3aed 60%,#1e1b4b 100%)", minHeight: 200 }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle,white,transparent)", transform: "translate(-30%,-30%)" }}/>
              <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle,white,transparent)", transform: "translate(30%,30%)" }}/>
            </div>
            <div className="relative z-10 p-5">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                  {myFamily.avatarUrl ? <img src={myFamily.avatarUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl">👨‍👩‍👧‍👦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black text-2xl truncate">{myFamily.name}</h3>
                  {myFamily.description && <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{myFamily.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold backdrop-blur-sm">
                      {myFamily.myRole === "owner" ? "👑 مالك" : myFamily.myRole === "admin" ? "🛡️ مشرف" : "👤 عضو"}
                    </span>
                    <span className="text-white/70 text-xs font-mono">#{myFamily.aginsId}</span>
                    {country && <span className="text-base">{country.flag}</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: "الأعضاء", value: myFamily.members.length, icon: "👥" },
                  { label: "ماس العائلة", value: (myFamily.totalDiamonds ?? 0).toLocaleString(), icon: "💎" },
                  { label: "ماسي", value: (myFamily.myDiamonds ?? 0).toLocaleString(), icon: "✨" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-2.5 text-center">
                    <p className="text-base">{s.icon}</p>
                    <p className="text-white font-black text-sm">{s.value}</p>
                    <p className="text-white/60 text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* أزرار سريعة - للمالك والمشرف فقط */}
            {(isOwner || isAdmin) && (
              <div className="flex gap-2">
                <button onClick={() => setShowInvite(true)}
                  className="flex-1 py-3 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-95">
                  ➕ دعوة عضو
                </button>
                {pendingCount > 0 && (
                  <button onClick={() => setView("requests")}
                    className="flex-1 py-3 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 relative">
                    📋 الطلبات
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">{pendingCount}</span>
                  </button>
                )}
              </div>
            )}

            {/* توب 3 المرسلين */}
            <div>
              <h3 className="text-white font-bold text-sm mb-3">🏆 أكثر المرسلين هدايا</h3>
              <div className="flex gap-3 justify-center">
                {topSenders.map((m, i) => (
                  <div key={m._id} className="flex flex-col items-center gap-1.5">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${i===0?"border-yellow-400":i===1?"border-gray-400":"border-orange-400"}`}>
                        {m.profile?.avatarUrl ? <img src={m.profile.avatarUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center"><span className="text-white font-bold">{m.profile?.name?.[0] ?? "؟"}</span></div>}
                      </div>
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${i===0?"bg-yellow-400 text-black":i===1?"bg-gray-400 text-black":"bg-orange-400 text-black"}`}>
                        {i===0?"🥇":i===1?"🥈":"🥉"}
                      </div>
                    </div>
                    <p className="text-white text-[10px] font-bold truncate max-w-[56px] text-center">{m.profile?.name ?? "؟"}</p>
                    <p className="text-yellow-400 text-[10px] font-bold">{((m.profile?.totalCoinsSent??0)/1000).toFixed(0)}k 🪙</p>
                  </div>
                ))}
                {topSenders.length === 0 && <p className="text-gray-500 text-xs py-4">لا توجد بيانات بعد</p>}
              </div>
            </div>

            {/* توب 3 المستقبلين */}
            <div>
              <h3 className="text-white font-bold text-sm mb-3">💎 أكثر المستقبلين هدايا</h3>
              <div className="flex gap-3 justify-center">
                {topReceivers.map((m, i) => (
                  <div key={m._id} className="flex flex-col items-center gap-1.5">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${i===0?"border-purple-400":i===1?"border-gray-400":"border-pink-400"}`}>
                        {m.profile?.avatarUrl ? <img src={m.profile.avatarUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"><span className="text-white font-bold">{m.profile?.name?.[0] ?? "؟"}</span></div>}
                      </div>
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${i===0?"bg-purple-400 text-white":i===1?"bg-gray-400 text-black":"bg-pink-400 text-white"}`}>
                        {i===0?"🥇":i===1?"🥈":"🥉"}
                      </div>
                    </div>
                    <p className="text-white text-[10px] font-bold truncate max-w-[56px] text-center">{m.profile?.name ?? "؟"}</p>
                    <p className="text-purple-400 text-[10px] font-bold">{(m.diamonds??0).toLocaleString()} 💎</p>
                  </div>
                ))}
                {topReceivers.length === 0 && <p className="text-gray-500 text-xs py-4">لا توجد بيانات بعد</p>}
              </div>
            </div>

            {/* قائمة الأعضاء */}
            <div>
              <h3 className="text-white font-bold text-sm mb-3">👥 الأعضاء ({myFamily.members.length})</h3>
              <div className="space-y-2">
                {myFamily.members.map((member, idx) => (
                  <div key={member._id}
                    className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3 active:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => (isOwner || isAdmin) && member.role !== "owner" ? setSelectedMember(member) : null}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${idx===0?"bg-yellow-500/20 text-yellow-400":idx===1?"bg-gray-400/20 text-gray-300":idx===2?"bg-orange-500/20 text-orange-400":"bg-white/5 text-gray-600"}`}>
                      {idx === 0 ? "👑" : idx + 1}
                    </div>
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {member.profile?.avatarUrl ? <img src={member.profile.avatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-white font-bold">{member.profile?.name?.[0] ?? "؟"}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-white text-sm font-bold truncate">{member.profile?.name ?? "مجهول"}</p>
                        {member.role === "owner" && <span className="text-[9px] bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">👑 مالك</span>}
                        {member.role === "admin" && <span className="text-[9px] bg-purple-500/20 border border-purple-500/30 text-purple-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">🛡️ مشرف</span>}
                      </div>
                      <p className="text-gray-500 text-xs font-mono">#{member.profile?.sakiId}</p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-purple-400 text-xs font-bold">{(member.diamonds??0).toLocaleString()}</p>
                      <p className="text-gray-600 text-[10px]">💎</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* زر مغادرة العائلة للأعضاء فقط */}
            {!isOwner && (
              <button onClick={handleLeaveFamily}
                className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] mt-2">
                🚪 مغادرة العائلة
              </button>
            )}
          </div>
        </div>

        {/* Member Action Sheet */}
        {selectedMember && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setSelectedMember(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <div className="relative bg-[#1a1a2e] rounded-t-3xl border-t border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-white/20 rounded-full"/></div>
              <div className="flex items-center gap-3 mb-5 p-3 bg-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {selectedMember.profile?.avatarUrl ? <img src={selectedMember.profile.avatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-white font-bold text-lg">{selectedMember.profile?.name?.[0] ?? "؟"}</span>}
                </div>
                <div>
                  <p className="text-white font-bold">{selectedMember.profile?.name ?? "مجهول"}</p>
                  <p className="text-gray-500 text-xs font-mono">#{selectedMember.profile?.sakiId}</p>
                  <p className="text-purple-400 text-xs mt-0.5">{(selectedMember.diamonds??0).toLocaleString()} 💎</p>
                </div>
              </div>
              <div className="space-y-2">
                {isOwner && selectedMember.role === "member" && (
                  <button onClick={() => handleSetRole(selectedMember.userId, "admin")} className="w-full py-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold text-sm flex items-center justify-center gap-2">🛡️ ترقية لمشرف</button>
                )}
                {isOwner && selectedMember.role === "admin" && (
                  <button onClick={() => handleSetRole(selectedMember.userId, "member")} className="w-full py-3 rounded-2xl bg-gray-500/15 border border-gray-500/30 text-gray-400 font-bold text-sm flex items-center justify-center gap-2">👤 تخفيض لعضو</button>
                )}
                <button onClick={() => handleRemoveMember(selectedMember.userId)} className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2">🚫 إزالة من العائلة</button>
                <button onClick={() => setSelectedMember(null)} className="w-full py-3 rounded-2xl bg-white/5 text-gray-400 font-medium text-sm">إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Sheet */}
        {showInvite && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowInvite(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <div className="relative bg-[#1a1a2e] rounded-t-3xl border-t border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-white/20 rounded-full"/></div>
              <h3 className="text-white font-bold text-base text-center mb-4">➕ دعوة عضو جديد</h3>
              <div className="space-y-3">
                <input value={inviteSakiId} onChange={(e) => setInviteSakiId(e.target.value)} placeholder="أدخل SAKI ID للعضو..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 font-mono"/>
                <button onClick={handleInvite} disabled={loading || !inviteSakiId.trim()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "➕ إضافة للعائلة"}
                </button>
                <button onClick={() => setShowInvite(false)} className="w-full py-3 rounded-2xl bg-white/5 text-gray-400 font-medium text-sm">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
      <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <h2 className="text-white font-bold text-lg">👨‍👩‍👧‍👦 العائلات</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setView("leaderboard")} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
              <span className="text-base">🏆</span>
            </button>
            <button onClick={() => setShowSearch(!showSearch)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
            <button
              onClick={() => myCreationRequest?.status === "pending" ? toast.info("طلبك قيد المراجعة من الإدارة") : setView("create")}
              className="px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 flex items-center gap-1"
              style={myCreationRequest?.status === "pending"
                ? { background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }
                : { background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "white" }}>
              {myCreationRequest?.status === "pending" ? "⏳ معلق" : <><span>+</span> إنشاء</>}
            </button>
          </div>
        </div>
        {showSearch && (
          <div className="px-4 pb-3">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث باسم العائلة أو رقم AGINS..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500"/>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-10">
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <div>
            <p className="text-white text-sm font-bold">العائلات المسجلة</p>
            <p className="text-gray-400 text-xs">{allFamilies?.length ?? 0} عائلة في المجتمع</p>
          </div>
        </div>

        {!allFamilies ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : (<>
          <FamilyRequestBanner req={myCreationRequest} />
          {filteredFamilies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-6xl">👨‍👩‍👧‍👦</span>
            <p className="text-gray-400 text-sm">{searchQuery ? "لا توجد نتائج" : "لا توجد عائلات بعد"}</p>
            {!searchQuery && <p className="text-gray-600 text-xs">كن أول من ينشئ عائلة!</p>}
          </div>
        ) : (
          filteredFamilies.map((family, idx) => {
            const fCountry = ARAB_COUNTRIES.find(c => c.code === family.country);
            return (
              <div key={family._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden active:bg-white/8 transition-colors">
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${idx===0?"bg-yellow-500/20 text-yellow-400":idx===1?"bg-gray-400/20 text-gray-300":idx===2?"bg-orange-500/20 text-orange-400":"bg-white/5 text-gray-500"}`}>
                    {idx===0?"🥇":idx===1?"🥈":idx===2?"🥉":`#${idx+1}`}
                  </div>
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center flex-shrink-0">
                    {family.avatarUrl ? <img src={family.avatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-2xl">👨‍👩‍👧‍👦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-white text-sm font-bold truncate">{family.name}</p>
                      {fCountry && <span className="text-sm flex-shrink-0">{fCountry.flag}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-gray-500 text-xs font-mono">#{family.aginsId}</span>
                      <span className="text-gray-500 text-xs">👥 {family.memberCount}</span>
                      <span className="text-gray-500 text-xs">💎 {(family.totalDiamonds??0).toLocaleString()}</span>
                    </div>
                  </div>
                  {!myFamily && (
                    <button onClick={() => handleRequestJoin(family._id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 active:scale-95"
                      style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "white" }}>
                      انضمام
                    </button>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    {family.ownerAvatarUrl ? <img src={family.ownerAvatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-white text-[8px] font-bold">{family.ownerName?.[0]}</span>}
                  </div>
                  <p className="text-gray-500 text-xs">المالك: <span className="text-gray-400">{family.ownerName}</span></p>
                </div>
              </div>
            );
          })
        )}</>
        )}
      </div>
    </div>
  );
}

function FamilyRequestBanner({ req }: { req: any }) {
  if (!req || req.status === "approved") return null;
  const isPending = req.status === "pending";
  return (
    <div className={`border rounded-2xl px-4 py-3 flex items-center gap-3 ${isPending ? "bg-yellow-500/10 border-yellow-500/25" : "bg-red-500/10 border-red-500/25"}`}>
      <span className="text-2xl">{isPending ? "⏳" : "❌"}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${isPending ? "text-yellow-400" : "text-red-400"}`}>
          {isPending ? "طلبك قيد المراجعة" : "تم رفض طلبك"}
        </p>
        <p className="text-gray-500 text-xs truncate">
          {isPending ? `"${req.name}"` : (req.reviewNote || "يمكنك إرسال طلب جديد")}
        </p>
      </div>
    </div>
  );
}
