// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "../lib/toast";

interface RoomSettingsPageProps {
  roomId: Id<"rooms">;
  onBack: () => void;
}

const CATEGORIES = [
  { id: "music", label: "موسيقى", icon: "🎵", color: "bg-purple-50 text-purple-600" },
  { id: "rap", label: "راب", icon: "🎤", color: "bg-rose-50 text-rose-600" },
  { id: "poetry", label: "حفلة شعر", icon: "📖", color: "bg-amber-50 text-amber-600" },
  { id: "singing", label: "غناء", icon: "🔊", color: "bg-cyan-50 text-cyan-600" },
  { id: "competitions", label: "مسابقات", icon: "🏆", color: "bg-yellow-50 text-yellow-600" },
  { id: "acting", label: "تمثيل", icon: "🎭", color: "bg-indigo-50 text-indigo-600" },
];

const THEMES = [
  { key: "luxury_white", theme: "", label: "الافتراضي", gradient: "linear-gradient(135deg,#ffffff,#fff7ed)", isLuxury: true },
  { key: "karaoke", theme: "karaoke", label: "ثيم Karaoke", gradient: "linear-gradient(135deg,#12002b 0%,#4c1d95 45%,#c026d3 100%)", isLuxury: false, isKaraoke: true },
  { key: "cinema", theme: "cinema", label: "ثيم السينما", gradient: "linear-gradient(135deg,#1a0000,#3d0000)", isLuxury: false },
];

const BG_PRESETS = [
  { id: "luxury_gold", label: "ذهب ملكي", url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop" },
  { id: "clean_white", label: "أبيض نقي", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop" },
  { id: "night_city", label: "أضواء المدينة", url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1000&auto=format&fit=crop" },
  { id: "abstract_purple", label: "بنفسجي غامض", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop" },
  { id: "deep_red", label: "أحمر عميق", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop" },
];

const MIC_PERMISSIONS = [
  { value: "all", label: "الجميع" },
  { value: "members", label: "الأعضاء فقط" },
  { value: "admins", label: "المشرفون فقط" },
];

const SEAT_OPTIONS = [5, 10, 15, 20, 22];

type SubPage = null | "name" | "notice" | "category" | "theme" | "backgrounds" | "reward" | "admins" | "banned" | "logs" | "lock" | "seats";

export default function RoomSettingsPage({ roomId, onBack }: RoomSettingsPageProps) {
  const room = useQuery(api.rooms.getRoom, { roomId });
  const myProfile = useQuery(api.profiles.getMyProfile);
  const rewardStatus = useQuery(api.rooms.getRoomRewardStatus, { roomId });
  const logs = useQuery(api.roomLogs.getRoomLogs, { roomId });
  const members = useQuery(api.roomMembersHelper.getRoomMembersEnhanced, { roomId });
  const bans = useQuery(api.rooms.getRoomBans, { roomId });

  const updateRoom = useMutation(api.rooms.updateRoom);
  const updateRewardSettings = useMutation(api.rooms.updateRoomRewardSettings);
  const claimReward = useMutation(api.rooms.claimRoomReward);
  const setRoomLock = useMutation(api.rooms.setRoomLock);
  const unbanMember = useMutation(api.rooms.unbanMember);
  const setAdminRole = useMutation(api.rooms.setAdminRole);
  const generateUploadUrl = useMutation(api.rooms.generateUploadUrl);

  const [subPage, setSubPage] = useState<SubPage>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const [lockPassword, setLockPassword] = useState("");

  useEffect(() => {
    if (room) {
      setName(room.name);
      setNotice(room.description || "");
    }
  }, [room]);

  const handleUpdate = async (patch: any) => {
    setLoading(true);
    try {
      await updateRoom({ roomId, ...patch });
      toast.success("تم التحديث بنجاح");
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await result.json();
      await updateRoom({ roomId, coverStorageId: storageId });
      toast.success("تم التحديث بنجاح");
    } catch (e) { toast.error("فشل الرفع"); }
    finally { setUploading(false); }
  };

  const handleBgSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await result.json();
      await updateRoom({ roomId, bgStorageId: storageId });
      toast.success("تم تحديث الخلفية");
    } catch (e) { toast.error("فشل الرفع"); }
    finally { setUploadingBg(false); }
  };

  const handleBack = () => {
    if (subPage) setSubPage(null);
    else onBack();
  };

  if (!room) return null;

  const renderHeader = (title: string) => (
    <div className="bg-white px-4 py-3.5 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
      <button className="p-1" onClick={handleBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
      <span className="w-6"></span>
    </div>
  );

  // ── SUB-PAGES ──
  if (subPage === "theme") {
    return (
      <div className="flex flex-col h-screen bg-white text-right" dir="rtl">
        {renderHeader("الثيم")}
        <div className="p-5 space-y-4">
          {THEMES.map(t => (
            <div key={t.key} 
              onClick={() => handleUpdate({ roomTheme: t.theme })}
              className={`relative rounded-3xl overflow-hidden h-32 cursor-pointer border-4 transition-all ${room.roomTheme === t.theme ? "border-cyan-400 scale-[1.02]" : "border-transparent"}`}
            >
              <div className="absolute inset-0" style={{ background: t.gradient }} />
              <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center gap-2">
                {t.isKaraoke ? (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
                  </svg>
                ) : null}
                <span className="text-white font-black text-lg">{t.label}</span>
                {t.isKaraoke ? <span className="text-white/75 text-[10px] font-bold">مقعد رئيسي + 10 مغنين</span> : null}
              </div>
            </div>
          ))}
          <button onClick={handleBack} className="w-full mt-6 py-4 rounded-full bg-cyan-500 text-white font-bold shadow-lg">حفظ</button>
        </div>
      </div>
    );
  }

  if (subPage === "backgrounds") {
    return (
      <div className="flex flex-col h-screen bg-[#f7f7f9] text-right" dir="rtl">
        {renderHeader("خلفيات الغرفة")}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => bgInputRef.current?.click()} className="relative aspect-[9/16] rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-white active:scale-95 transition-all">
              {uploadingBg ? <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" /> : <div className="text-3xl text-gray-300">➕</div>}
              <span className="text-xs font-bold text-gray-400 mt-2">رفع خلفية</span>
              <input type="file" ref={bgInputRef} onChange={handleBgSelect} accept="image/*" className="hidden" />
            </div>
            {BG_PRESETS.map(bg => (
              <div key={bg.id} onClick={() => handleUpdate({ bgPresetKey: bg.url })} className={`relative aspect-[9/16] rounded-2xl overflow-hidden border-4 transition-all ${room.bgPresetKey === bg.url ? "border-cyan-400" : "border-transparent"}`}>
                <img src={bg.url} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/40 p-2 text-center">
                  <span className="text-[10px] text-white font-bold">{bg.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (subPage === "name") {
    return (
      <div className="flex flex-col h-screen bg-white text-right" dir="rtl">
        {renderHeader("اسم الغرفة")}
        <div className="p-5">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-800 font-bold" placeholder="أدخل اسم الغرفة" />
          <button onClick={() => handleUpdate({ name })} className="w-full mt-10 py-4 rounded-full bg-cyan-500 text-white font-bold shadow-lg">حفظ التغييرات</button>
        </div>
      </div>
    );
  }

  if (subPage === "notice") {
    return (
      <div className="flex flex-col h-screen bg-white text-right" dir="rtl">
        {renderHeader("إشعار عام")}
        <div className="p-5">
          <textarea value={notice} onChange={(e) => setNotice(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-800 font-medium h-40 resize-none" placeholder="أدخل إشعار الغرفة..." />
          <button onClick={() => handleUpdate({ description: notice })} className="w-full mt-10 py-4 rounded-full bg-cyan-500 text-white font-bold shadow-lg">حفظ التغييرات</button>
        </div>
      </div>
    );
  }

  if (subPage === "category") {
    return (
      <div className="flex flex-col h-screen bg-white text-right" dir="rtl">
        {renderHeader("التصنيف")}
        <div className="p-4 grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => handleUpdate({ roomCategory: cat.id })} className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${room.roomCategory === cat.id ? "border-cyan-400 bg-cyan-50/50" : "border-gray-50 bg-gray-50/50"}`}>
              <span className="text-3xl mb-2">{cat.icon}</span>
              <span className={`text-sm font-bold ${room.roomCategory === cat.id ? "text-cyan-600" : "text-gray-600"}`}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (subPage === "seats") {
    return (
      <div className="flex flex-col h-screen bg-white text-right" dir="rtl">
        {renderHeader("عدد المقاعد")}
        <div className="p-6">
          <div className="mb-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-[#28121f] to-[#120c1c] p-5 text-white shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-amber-200">التخطيط الملكي</p>
                <p className="mt-1 text-xs leading-5 text-white/70">مقعد المالك في الأعلى، ومقاعد المضيفين ثم أزواج متجاورة.</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-amber-300/60 bg-amber-200/10"><img src="/manus-storage/royal-seat-icon_7df7cdad.png" alt="مقعد ملكي" className="h-10 w-10 object-contain" /></span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => handleUpdate({ seatLayoutStyle: "royal_pairs" })} className={`rounded-2xl border px-3 py-3 text-xs font-black ${room.seatLayoutStyle !== "legacy" ? "border-amber-300 bg-amber-300/20 text-amber-100" : "border-white/15 bg-white/5 text-white/60"}`}>أزواج ملكية</button>
              <button onClick={() => handleUpdate({ seatLayoutStyle: "legacy" })} className={`rounded-2xl border px-3 py-3 text-xs font-black ${room.seatLayoutStyle === "legacy" ? "border-white/60 bg-white/15 text-white" : "border-white/15 bg-white/5 text-white/60"}`}>التخطيط القديم</button>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3">
              <span className="text-xs font-bold text-white/75">مقاعد المضيفين</span>
              <div className="flex gap-2">
                {[0, 1, 2].map(count => <button key={count} onClick={() => handleUpdate({ hostSeatCount: count })} className={`h-8 min-w-8 rounded-xl text-xs font-black ${Number(room.hostSeatCount ?? 2) === count ? "bg-amber-300 text-[#291522]" : "bg-white/10 text-white/70"}`}>{count}</button>)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {SEAT_OPTIONS.map(num => (
              <button key={num} onClick={() => handleUpdate({ maxSeats: num })} className={`py-8 rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${room.maxSeats === num ? "border-cyan-400 bg-cyan-50" : "border-gray-100 bg-gray-50"}`}>
                <span className={`text-3xl font-black ${room.maxSeats === num ? "text-cyan-600" : "text-gray-400"}`}>{num}</span>
                <span className={`text-sm font-bold mt-1 ${room.maxSeats === num ? "text-cyan-500" : "text-gray-400"}`}>مقاعد</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (subPage === "reward") {
    const s = rewardStatus;
    if (!s) return null;
    return (
      <div className="flex flex-col h-screen bg-[#f7f7f9] text-right" dir="rtl">
        {renderHeader("المكافأة")}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">💰</div>
              <div className="text-left">
                <p className="text-xs text-gray-400 font-bold">رصيدك الحالي</p>
                <p className="text-xl font-black text-amber-500">{s.goldCoins?.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] text-gray-400 font-bold mb-1">نقاط اليوم</p>
                <p className="text-lg font-black text-gray-800">{s.today.points.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] text-gray-400 font-bold mb-1">نقاط الأمس</p>
                <p className="text-lg font-black text-gray-800">{s.yesterday.points.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-800 mb-4">مكافأة الأمس القابلة للاستلام</h3>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-3xl font-black text-cyan-500">{s.yesterday.amount.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 font-bold">عملة ذهبية</p>
              </div>
              <button disabled={s.yesterday.claimed || s.yesterday.amount <= 0 || loading} onClick={async () => { setLoading(true); try { await claimReward({ roomId }); toast.success("تم استلام المكافأة"); } catch (e) { toast.error(e.message); } finally { setLoading(false); } }} className={`px-6 py-3 rounded-full font-bold text-sm ${s.yesterday.claimed ? "bg-gray-100 text-gray-400" : "bg-amber-400 text-white shadow-lg shadow-amber-100"}`}>{s.yesterday.claimed ? "تم الاستلام" : "استلام الآن"}</button>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-800 mb-6">إعدادات النسب</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2"><span className="text-xs font-bold text-gray-600">نسبة الهدايا</span><span className="text-xs font-black text-cyan-500">{Math.round(s.settings.giftRate * 100)}%</span></div>
                <input type="range" min="0" max="1" step="0.05" value={s.settings.giftRate} onChange={(e) => updateRewardSettings({ roomId, giftRate: parseFloat(e.target.value) })} className="w-full h-1.5 bg-gray-100 rounded-full appearance-none accent-cyan-500" />
              </div>
              <div>
                <div className="flex justify-between mb-2"><span className="text-xs font-bold text-gray-600">نسبة العضوية</span><span className="text-xs font-black text-cyan-500">{Math.round(s.settings.membershipRate * 100)}%</span></div>
                <input type="range" min="0" max="1" step="0.05" value={s.settings.membershipRate} onChange={(e) => updateRewardSettings({ roomId, membershipRate: parseFloat(e.target.value) })} className="w-full h-1.5 bg-gray-100 rounded-full appearance-none accent-cyan-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subPage === "admins") {
    const admins = members?.filter(m => m.role === "admin");
    return (
      <div className="flex flex-col h-screen bg-white text-right" dir="rtl">
        {renderHeader("المشرفين")}
        <div className="flex-1 overflow-y-auto">
          {!admins || admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
              <div className="text-5xl mb-4">👥</div>
              <p className="font-bold">لا يوجد مشرفين حالياً</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {admins.map(admin => (
                <div key={admin._id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <img src={admin.avatarUrl || "/icon.svg"} className="w-12 h-12 rounded-full border border-gray-100" />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{admin.name}</p>
                      <p className="text-[10px] text-gray-400">ID: {admin.sakiId}</p>
                    </div>
                  </div>
                  <button onClick={() => setAdminRole({ roomId, targetUserId: admin.userId, role: "member" })} className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-full">إزالة</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (subPage === "banned") {
    return (
      <div className="flex flex-col h-screen bg-white text-right" dir="rtl">
        {renderHeader("المحظورين")}
        <div className="flex-1 overflow-y-auto">
          {!bans || bans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
              <div className="text-5xl mb-4">🚫</div>
              <p className="font-bold">قائمة الحظر فارغة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {bans.map(ban => (
                <div key={ban._id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">👤</div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">مستخدم محظور</p>
                      <p className="text-[10px] text-gray-400">بواسطة: {ban.bannedByName || "مشرف"}</p>
                    </div>
                  </div>
                  <button onClick={() => unbanMember({ roomId, targetUserId: ban.userId })} className="text-xs font-bold text-cyan-500 bg-cyan-50 px-4 py-2 rounded-full">فك الحظر</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (subPage === "logs") {
    const filteredLogs = logs?.filter(l => logFilter === "all" || l.action === logFilter);
    return (
      <div className="flex flex-col h-screen bg-[#f7f7f9] text-right" dir="rtl">
        {renderHeader("سجلات العمل")}
        <div className="bg-white px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-50">
          {["all", "kick", "ban", "mute", "seat_lock", "update_room"].map(f => (
            <button key={f} onClick={() => setLogFilter(f)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${logFilter === f ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-400"}`}>
              {f === "all" ? "الكل" : f === "kick" ? "طرد" : f === "ban" ? "حظر" : f === "mute" ? "كتم" : f === "seat_lock" ? "قفل مقعد" : "تحديث"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs?.map(log => (
            <div key={log._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
              <div className="flex items-center gap-3 mb-2">
                <img src={log.actorAvatar || "/icon.svg"} className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <p className="text-xs font-black text-gray-800">
                    {log.actorName} <span className="mx-1 font-medium text-gray-400">قام بـ</span>
                    <span className="text-cyan-500">{log.actionLabel}</span>
                  </p>
                  <p className="text-[9px] text-gray-300 font-bold">{new Date(log.createdAt).toLocaleString("ar-EG")}</p>
                </div>
              </div>
              {log.targetName && (
                <div className="bg-gray-50 rounded-xl p-2 flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold">الهدف:</span>
                  <span className="text-[10px] text-gray-700 font-black">{log.targetName}</span>
                </div>
              )}
              {log.details && <p className="text-[10px] text-gray-400 mt-2 bg-gray-50/50 p-2 rounded-lg italic">"{log.details}"</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPage === "lock") {
    return (
      <div className="flex flex-col h-screen bg-white text-right" dir="rtl">
        {renderHeader("قفل الغرفة")}
        <div className="flex-1 p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-cyan-50 border border-cyan-100">{room.isLocked ? "🔒" : "🔓"}</div>
            <div>
              <h3 className="text-gray-800 font-bold text-base">{room.isLocked ? "الغرفة مقفلة" : "قفل الغرفة"}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{room.isLocked ? "يمكنك فتح الغرفة أو تغيير كلمة المرور" : "ضع كلمة مرور من 4 أرقام"}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center mb-4">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${lockPassword[i] ? "bg-cyan-50 border-cyan-400 text-gray-800" : "bg-gray-50 border-gray-200 text-gray-300"} border-2`}>
                {lockPassword[i] ? "●" : ""}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, idx) => (
              <button key={idx} onClick={() => { if (k === "⌫") setLockPassword(p => p.slice(0,-1)); else if (k !== "" && lockPassword.length < 4) setLockPassword(p => p + String(k)); }} disabled={k === ""} className={`h-12 rounded-2xl text-lg font-bold transition-all active:scale-95 border ${k === "" ? "opacity-0 pointer-events-none" : k === "⌫" ? "text-red-500 border-red-100 bg-red-50" : "text-gray-800 border-gray-200 bg-white"}`}>
                {k}
              </button>
            ))}
          </div>
          <button onClick={async () => { try { await setRoomLock({ roomId, password: lockPassword }); toast.success("تم الحفظ"); handleBack(); } catch (e) { toast.error(e.message); } }} disabled={lockPassword.length !== 4 && room.isLocked && lockPassword.length !== 0} className="w-full py-4 rounded-full bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-100 disabled:opacity-50">
            {room.isLocked && lockPassword.length === 0 ? "فتح الغرفة" : "تأكيد القفل"}
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN LIST ──
  return (
    <div className="flex flex-col h-screen bg-[#f7f7f9] text-right" dir="rtl">
      <div className="bg-white px-4 py-3.5 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <span className="w-6"></span>
        <h1 className="text-lg font-bold text-gray-800">الإعدادات</h1>
        <button className="p-1" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-10">
        <div className="bg-white">
          <div onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                <img src={room.coverUrl || "/icon.svg"} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-800">صورة الغرفة</span>
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
          </div>

          <div onClick={() => setSubPage("name")} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <span className="text-sm text-gray-500 font-medium truncate max-w-[180px]">{room.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-800">اسم الغرفة</span>
          </div>

          <div onClick={() => setSubPage("notice")} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <span className="text-sm text-gray-500 font-medium truncate max-w-[180px]">{room.description || "لا يوجد إشعار"}</span>
            </div>
            <span className="text-sm font-medium text-gray-800">إشعار عام</span>
          </div>

          <div onClick={() => setSubPage("category")} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <span className="text-sm text-gray-500 font-medium">{CATEGORIES.find(c => c.id === (room.roomCategory || "music"))?.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-800">التصنيف</span>
          </div>

          <div onClick={() => setSubPage("theme")} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <span className={`text-sm font-medium ${room.roomTheme === "karaoke" ? "text-fuchsia-600" : "text-gray-500"}`}>{THEMES.find(t => t.theme === (room.roomTheme || ""))?.label || "الافتراضي"}</span>
            </div>
            <span className="flex items-center gap-2 text-sm font-medium text-gray-800">الثيم {room.roomTheme !== "karaoke" ? <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[9px] font-black text-fuchsia-600">KARAOKE متاح</span> : null}</span>
          </div>

          <div onClick={() => setSubPage("backgrounds")} className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <div className="w-8 h-8 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                {room.bgImageUrl ? <img src={room.bgImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />}
              </div>
            </div>
            <span className="text-sm font-medium text-gray-800">خلفيات الغرفة</span>
          </div>
        </div>

        <div className="bg-white">
          <div onClick={() => setSubPage("reward")} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <span className="text-xs text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-full">نسب مكافآت</span>
            </div>
            <span className="text-sm font-medium text-gray-800">المكافأة</span>
          </div>
          
          <div onClick={() => setSubPage("seats")} className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <span className="text-sm text-gray-500 font-medium">{room.maxSeats || 8} مقاعد</span>
            </div>
            <span className="text-sm font-medium text-gray-800">عدد المقاعد</span>
          </div>
        </div>

        <div className="bg-white">
          <div onClick={() => setSubPage("admins")} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <span className="text-sm text-gray-400 font-normal">{members?.filter(m => m.role === "admin").length || 0} مشرفين</span>
            </div>
            <span className="text-sm font-medium text-gray-800">المشرفين</span>
          </div>

          <div onClick={() => setSubPage("banned")} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <span className="text-sm text-gray-400 font-normal">{bans?.length || 0}</span>
            </div>
            <span className="text-sm font-medium text-gray-800">المحظورين</span>
          </div>

          <div onClick={() => setSubPage("logs")} className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-300 text-xs">◀</span>
              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">جديد</span>
            </div>
            <span className="text-sm font-medium text-gray-800">سجلات العمل</span>
          </div>
        </div>
      </div>
    </div>
  );
}
