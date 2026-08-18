// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";

const Spin = ({ color = "purple" }: { color?: string }) => (
  <div className="flex justify-center py-8">
    <div className={`w-6 h-6 border-2 border-${color}-500 border-t-transparent rounded-full animate-spin`} />
  </div>
);

const durationLabels: Record<string, string> = {
  "1h": "ساعة",
  "1d": "يوم",
  "3d": "3 أيام",
  "7d": "7 أيام",
  "30d": "30 يوم",
  "365d": "سنة",
  "permanent": "دائم",
};

function formatBanExpiry(expiresAt?: number | null, duration?: string | null): string {
  if (!expiresAt || duration === "permanent") return "دائم 🔒";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "منتهي ✅";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days} يوم متبقي`;
  return `${hours} ساعة متبقية`;
}

function ContentTab() {
  const [ct, setCt] = useState<"moments" | "reels">("moments");
  const moments = useQuery(api.adminLock.adminListMoments, { limit: 30 });
  const reels = useQuery(api.adminLock.adminListReels, { limit: 30 });
  const delMoment = useMutation(api.adminLock.adminDeleteMoment);
  const delReel = useMutation(api.adminLock.adminDeleteReel);

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        {[{ id: "moments", l: "📸 اللحظات" }, { id: "reels", l: "🎬 الريلز" }].map((t) => (
          <button key={t.id} onClick={() => setCt(t.id as any)}
            className="flex-1 py-2 rounded-xl text-xs font-bold"
            style={ct === t.id ? { background: "linear-gradient(135deg,#a855f7,#7c3aed)", color: "white" } : { background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
            {t.l}
          </button>
        ))}
      </div>

      {ct === "moments" && (!moments ? <Spin /> : moments.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">لا توجد لحظات</p>
      ) : (
        <div className="space-y-2">
          {moments.map((m) => (
            <div key={m._id} className="rounded-2xl p-3 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {m.imageUrl && <img src={m.imageUrl} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-xs truncate">{m.authorName}</p>
                <p className="text-gray-400 text-xs truncate">{m.content}</p>
                <p className="text-gray-600 text-[10px]">❤️ {m.likesCount ?? 0} · 💬 {m.commentsCount ?? 0}</p>
              </div>
              <button onClick={async () => {
                if (!confirm("حذف هذه اللحظة؟")) return;
                try { await delMoment({ momentId: m._id }); toast.success("تم الحذف"); }
                catch (e: any) { toast.error(e.message); }
              }}
                className="px-2 py-1 rounded-lg text-[10px] font-bold active:scale-95"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                حذف
              </button>
            </div>
          ))}
        </div>
      ))}

      {ct === "reels" && (!reels ? <Spin /> : reels.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">لا توجد ريلز</p>
      ) : (
        <div className="space-y-2">
          {reels.map((r) => (
            <div key={r._id} className="rounded-2xl p-3 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: "rgba(168,85,247,0.15)" }}>🎬</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-xs truncate">{r.authorName}</p>
                <p className="text-gray-400 text-xs truncate">{r.caption ?? "بدون وصف"}</p>
                <p className="text-gray-600 text-[10px]">❤️ {r.likesCount ?? 0} · 👁️ {r.views ?? 0}</p>
              </div>
              <button onClick={async () => {
                if (!confirm("حذف هذا الريل؟")) return;
                try { await delReel({ reelId: r._id }); toast.success("تم الحذف"); }
                catch (e: any) { toast.error(e.message); }
              }}
                className="px-2 py-1 rounded-lg text-[10px] font-bold active:scale-95"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                حذف
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function BanTab() {
  const bannedUsers = useQuery(api.appBan.getBannedUsers);
  const banUser = useMutation(api.appBan.banUserFromApp);
  const unbanUser = useMutation(api.appBan.unbanUserFromApp);
  const [sakiId, setSakiId] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("permanent");
  const [loading, setLoading] = useState(false);
  const [sub, setSub] = useState<"list" | "ban">("list");
  const sp = useQuery(api.profiles.getProfileBySakiId, sakiId.length >= 6 ? { sakiId } : "skip");

  const durations = [
    { id: "1h", label: "ساعة" },
    { id: "1d", label: "يوم" },
    { id: "3d", label: "3 أيام" },
    { id: "7d", label: "7 أيام" },
    { id: "30d", label: "30 يوم" },
    { id: "365d", label: "سنة" },
    { id: "permanent", label: "دائم 🔒" },
  ];

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        {[
          { id: "list", l: `المحظورون (${bannedUsers?.length ?? 0})` },
          { id: "ban", l: "حظر مستخدم" },
        ].map((t) => (
          <button key={t.id} onClick={() => setSub(t.id as any)}
            className="flex-1 py-2 rounded-xl text-xs font-bold"
            style={sub === t.id ? { background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white" } : { background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
            {t.l}
          </button>
        ))}
      </div>

      {sub === "ban" && (
        <div className="space-y-3">
          <input value={sakiId} onChange={(e) => setSakiId(e.target.value)}
            placeholder="معرف SAKU..." dir="ltr"
            className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />

          {sp && (
            <div className="rounded-2xl p-3 flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <UserAvatar userId={sp.userId as Id<"users">} avatarUrl={sp.avatarUrl} name={sp.name} size={40} />
              <div>
                <p className="text-white font-bold text-sm">{sp.name}</p>
                <p className="text-gray-400 text-xs">#{sp.sakiId}</p>
                {sp.isBanned && <span className="text-[9px] text-red-400 font-bold">محظور بالفعل</span>}
              </div>
            </div>
          )}

          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="سبب الحظر التفصيلي..." rows={3}
            className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />

          {/* Duration Selector */}
          <div>
            <label className="text-gray-400 text-xs font-bold mb-2 block">⏱️ مدة الحظر</label>
            <div className="grid grid-cols-4 gap-1.5">
              {durations.map((d) => (
                <button key={d.id} onClick={() => setDuration(d.id)}
                  className="py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                  style={duration === d.id
                    ? {
                      background: d.id === "permanent"
                        ? "linear-gradient(135deg,#ef4444,#dc2626)"
                        : "linear-gradient(135deg,#f97316,#ea580c)",
                      color: "white",
                      boxShadow: "0 2px 8px rgba(239,68,68,0.3)"
                    }
                    : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-2xl p-3 space-y-1"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-red-400 text-[10px] font-bold">⚠️ ما يحدث عند الحظر:</p>
            <div className="space-y-0.5">
              {[
                "يتم تسجيل خروجه فوراً",
                "يتم حظر جميع أجهزته المسجلة",
                "لا يمكنه إنشاء حساب جديد من نفس الجهاز",
                "يظهر له شاشة حظر مع السبب والمدة",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-gray-500 text-[10px]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={async () => {
              if (!sp || !reason.trim()) return;
              setLoading(true);
              try {
                await banUser({ targetUserId: sp.userId as Id<"users">, reason, banAllDevices: true, duration });
                toast.success(`🚫 تم حظر ${sp.name} (${durationLabels[duration]}) ✅`);
                setSakiId(""); setReason(""); setDuration("permanent"); setSub("list");
              } catch (e: any) { toast.error(e.message); }
              finally { setLoading(false); }
            }}
            disabled={!sp || !reason.trim() || loading}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحظر...
              </div>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                حظر ({durationLabels[duration]})
              </>
            )}
          </button>
        </div>
      )}

      {sub === "list" && (!bannedUsers ? <Spin color="red" /> : bannedUsers.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">لا يوجد محظورون</p>
      ) : (
        <div className="space-y-2">
          {bannedUsers.map((u) => (
            <div key={u._id} className="rounded-2xl p-3"
              style={{
                background: (u as any).isExpired ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)",
                border: (u as any).isExpired ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(239,68,68,0.2)"
              }}>
              <div className="flex items-center gap-3 mb-2">
                <UserAvatar userId={u.userId as Id<"users">} avatarUrl={u.avatarUrl} name={u.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-bold text-sm truncate">{u.name}</p>
                    {(u as any).isExpired && (
                      <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">منتهي</span>
                    )}
                  </div>
                  <p className="text-red-400 text-xs truncate">{u.banReason}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-gray-500">
                      {formatBanExpiry((u as any).banExpiresAt, (u as any).banDuration)}
                    </span>
                    <span className="text-[9px] text-gray-600">·</span>
                    <span className="text-[9px] text-gray-500">{u.deviceBansCount} جهاز</span>
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  try { await unbanUser({ targetUserId: u.userId as Id<"users"> }); toast.success("تم رفع الحظر ✅"); }
                  catch (e: any) { toast.error(e.message); }
                }}
                className="w-full py-1.5 rounded-xl text-xs font-bold active:scale-95"
                style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}>
                رفع الحظر
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function BannersTab() {
  const banners = useQuery(api.banners.getAllBannersAdmin);
  const deleteBanner = useMutation(api.banners.deleteBanner);
  const generateUrl = useMutation(api.banners.generateUploadUrl);
  const addBanner = useMutation(api.banners.addBanner);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await generateUrl();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      await addBanner({ storageId, title: title || undefined });
      toast.success("✅ تم رفع البنر");
      setTitle("");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-white font-bold text-sm">رفع بنر جديد</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان البنر (اختياري)"
          className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
        <label className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl cursor-pointer active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm font-bold">جاري الرفع...</span>
            </div>
          ) : (
            <span className="text-white text-sm font-bold">🖼️ اختر صورة للبنر</span>
          )}
        </label>
      </div>

      {!banners ? <Spin /> : banners.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">لا توجد بنرات</p>
      ) : (
        <div className="space-y-2">
          {banners.map((b) => (
            <div key={b._id} className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {b.imageUrl && <img src={b.imageUrl} className="w-full h-28 object-cover" />}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-bold">{b.title ?? "بدون عنوان"}</p>
                  <p className="text-gray-500 text-[10px]">{b.isActive ? "✅ نشط" : "❌ معطل"}</p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("حذف هذا البنر؟")) return;
                    try { await deleteBanner({ bannerId: b._id }); toast.success("تم الحذف"); }
                    catch (e: any) { toast.error(e.message); }
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold active:scale-95"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const AdminExtraTabs = { ContentTab, BanTab, BannersTab };
export default AdminExtraTabs;
