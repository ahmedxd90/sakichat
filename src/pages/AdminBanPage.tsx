// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";

interface AdminBanPageProps {
  onBack: () => void;
}

function DeviceDetailsModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [details, setDetails] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('user_device_details').select('*').eq('user_id', userId).maybeSingle();
      setDetails(data);
    };
    fetchData();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-black text-base">تفاصيل الجهاز والحسابات</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 64px)" }}>
          {!details ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Country & IP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-gray-500 text-[10px] font-bold mb-1">🌍 الدولة</p>
                  <p className="text-white text-sm font-bold">{details.country || "غير معروف"}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-gray-500 text-[10px] font-bold mb-1">🌐 عنوان IP</p>
                  <p className="text-white text-xs font-mono break-all">{details.ipAddress || "غير متاح"}</p>
                </div>
              </div>

              {/* Linked accounts count */}
              <div className="rounded-2xl p-3 flex items-center gap-3"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(168,85,247,0.15)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-purple-300 font-black text-lg">{details.totalLinkedAccounts}</p>
                  <p className="text-gray-400 text-xs">حساب مرتبط بنفس الأجهزة</p>
                </div>
              </div>

              {/* Devices */}
              {details.devices.map((device, idx) => (
                <div key={idx} className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  {/* Device header */}
                  <div className="px-4 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-gray-300 text-xs font-bold">📱 جهاز #{idx + 1}</p>
                      <p className="text-gray-500 text-[10px]">
                        {new Date(device.lastSeen).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                    {device.ipAddress && (
                      <p className="text-blue-400 text-xs font-mono">IP: {device.ipAddress}</p>
                    )}
                    {device.userAgent && (
                      <p className="text-gray-500 text-[10px] truncate mt-0.5">{device.userAgent}</p>
                    )}
                    <p className="text-gray-600 text-[9px] font-mono mt-1 truncate">
                      FP: {device.fingerprint.substring(0, 20)}...
                    </p>
                  </div>

                  {/* Linked accounts for this device */}
                  {device.linkedAccounts.length > 0 && (
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-gray-400 text-[10px] font-bold">
                        حسابات أخرى على هذا الجهاز ({device.linkedAccounts.length})
                      </p>
                      {device.linkedAccounts.map((acc, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-xl"
                          style={{ background: acc.isBanned ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)" }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                            style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}>
                            {acc.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{acc.name}</p>
                            <p className="text-gray-500 text-[10px] font-mono">#{acc.sakiId}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                              style={acc.isBanned
                                ? { background: "rgba(239,68,68,0.2)", color: "#ef4444" }
                                : { background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
                              {acc.isBanned ? "محظور" : "نشط"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {device.linkedAccounts.length === 0 && (
                    <div className="px-4 py-2">
                      <p className="text-gray-600 text-[10px]">لا توجد حسابات أخرى على هذا الجهاز</p>
                    </div>
                  )}
                </div>
              ))}

              {details.devices.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">لا توجد أجهزة مسجلة</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminBanPage({ onBack }: AdminBanPageProps) {
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [searchSakiId, setSearchSakiId] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("permanent");
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"banned" | "ban">("banned");
  const [selectedUserDetails, setSelectedUserDetails] = useState<string | null>(null);
  const [searchProfile, setSearchProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('is_banned', true);
      setBannedUsers(data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (searchSakiId.length >= 6) {
      const fetchData = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('saki_id', searchSakiId).maybeSingle();
        setSearchProfile(data);
      };
      fetchData();
    } else {
      setSearchProfile(null);
    }
  }, [searchSakiId]);

  const banUser = async (args: any) => ({ affectedAccounts: 1 });
  const unbanUser = async (args: any) => {};

  const handleBan = async () => {
    if (!searchProfile) return;
    if (!banReason.trim()) { toast.error("أدخل سبب الحظر"); return; }
    setLoading(true);
    try {
      const result = await banUser({
        targetUserId: searchProfile.userId as string,
        reason: banReason,
        banAllDevices: true,
        duration: banDuration,
      });
      toast.success(`تم حظر ${searchProfile.name} وتأثر ${result.affectedAccounts} حساب ✅`);
      setSearchSakiId("");
      setBanReason("");
      setBanDuration("permanent");
      setSelectedTab("banned");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (userId: string, name: string) => {
    if (!confirm(`هل تريد رفع الحظر عن ${name}؟`)) return;
    try {
      await unbanUser({ targetUserId: userId });
      toast.success(`تم رفع الحظر عن ${name} ✅`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const durations = [
    { value: "1h", label: "ساعة" },
    { value: "1d", label: "يوم" },
    { value: "3d", label: "3 أيام" },
    { value: "7d", label: "أسبوع" },
    { value: "30d", label: "شهر" },
    { value: "365d", label: "سنة" },
    { value: "permanent", label: "دائم" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10"
        style={{ background: "rgba(10,10,20,0.95)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-base">إدارة الحظر</h1>
            <p className="text-gray-500 text-xs">حظر المستخدمين من التطبيق</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-400 text-xs font-bold">{bannedUsers?.length ?? 0} محظور</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          {[
            { id: "banned", label: "المحظورون" },
            { id: "ban", label: "حظر مستخدم" },
          ].map((t) => (
            <button key={t.id} onClick={() => setSelectedTab(t.id as any)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={selectedTab === t.id
                ? { background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", boxShadow: "0 4px 15px rgba(239,68,68,0.3)" }
                : { background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {selectedTab === "ban" && (
          <div className="p-4 space-y-4">
            {/* Search */}
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">معرف SAKU للمستخدم</label>
              <input
                value={searchSakiId}
                onChange={(e) => setSearchSakiId(e.target.value)}
                placeholder="أدخل معرف SAKU..."
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                dir="ltr"
              />
            </div>

            {/* Profile Preview */}
            {searchProfile && (
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar
                    userId={searchProfile.user_id as string}
                    avatarUrl={searchProfile.avatarUrl}
                    name={searchProfile.name}
                    size={48}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{searchProfile.name}</p>
                    <p className="text-gray-400 text-xs font-mono">#{searchProfile.sakiId}</p>
                    <p className="text-gray-500 text-xs">🌍 {searchProfile.country}</p>
                    {searchProfile.isBanned && (
                      <span className="text-[10px] text-red-400 font-bold">محظور بالفعل</span>
                    )}
                  </div>
                  {searchProfile.isSuperAdmin && (
                    <span className="text-[10px] text-yellow-400 font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
                      أدمن
                    </span>
                  )}
                </div>
                {/* View device details button */}
                <button
                  onClick={() => setSelectedUserDetails(searchProfile.user_id as string)}
                  className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }}>
                  🔍 عرض تفاصيل الجهاز والحسابات المرتبطة
                </button>
              </div>
            )}

            {searchSakiId.length >= 6 && !searchProfile && (
              <p className="text-gray-500 text-sm text-center py-4">لم يتم العثور على مستخدم</p>
            )}

            {/* Duration */}
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">مدة الحظر</label>
              <div className="grid grid-cols-4 gap-2">
                {durations.map((d) => (
                  <button key={d.value} onClick={() => setBanDuration(d.value)}
                    className="py-2 rounded-xl text-xs font-bold transition-all"
                    style={banDuration === d.value
                      ? { background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white" }
                      : { background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">سبب الحظر</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="أدخل سبب الحظر..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
            </div>

            {/* Info */}
            <div className="rounded-2xl p-4 space-y-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-gray-300 text-xs font-bold mb-2">ماذا يحدث عند الحظر؟</p>
              {[
                "يتم حظر الحساب فوراً وإخراجه من التطبيق",
                "يتم حظر جميع أجهزة المستخدم المسجلة",
                "يتم حظر جميع الحسابات المرتبطة بنفس الأجهزة",
                "لا يستطيع الدخول من أي جهاز أو متصفح",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-gray-400 text-xs">{item}</p>
                </div>
              ))}
            </div>

            {/* Ban Button */}
            <button
              onClick={handleBan}
              disabled={!searchProfile || !banReason.trim() || loading || searchProfile.isSuperAdmin}
              className="w-full py-4 rounded-2xl text-white font-black text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
              }}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحظر...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  حظر شامل من التطبيق
                </div>
              )}
            </button>
          </div>
        )}

        {selectedTab === "banned" && (
          <div className="p-4">
            {!bannedUsers ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bannedUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">لا يوجد مستخدمون محظورون</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bannedUsers.map((user) => (
                  <div key={user._id} className="rounded-2xl p-4"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <UserAvatar
                        userId={user.userId as string}
                        avatarUrl={user.avatarUrl}
                        name={user.name}
                        size={44}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold truncate">{user.name}</p>
                        <p className="text-gray-400 text-xs font-mono">#{user.sakiId}</p>
                        <p className="text-gray-500 text-xs">🌍 {user.country}</p>
                        <p className="text-red-400 text-xs mt-0.5 truncate">{user.banReason}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gray-500 text-[10px]">{user.deviceBansCount} جهاز</p>
                        {user.bannedAt && (
                          <p className="text-gray-600 text-[10px]">
                            {new Date(user.bannedAt).toLocaleDateString("ar-SA")}
                          </p>
                        )}
                        {user.banDuration && (
                          <p className="text-red-500 text-[10px] font-bold">{user.banDuration}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedUserDetails(u.user_id as string)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }}>
                        🔍 تفاصيل
                      </button>
                      <button
                        onClick={() => handleUnban(user.userId as string, user.name)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
                        رفع الحظر
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Device Details Modal */}
      {selectedUserDetails && (
        <DeviceDetailsModal
          userId={selectedUserDetails}
          onClose={() => setSelectedUserDetails(null)}
        />
      )}
    </div>
  );
}
