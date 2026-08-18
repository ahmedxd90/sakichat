// @ts-nocheck
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";
import { VipBadge, VipName } from "../components/VipBadge";
import { useHardwareBack } from "../hooks/useHardwareBack";

interface FriendsPageProps {
  onViewProfile: (userId: Id<"users">) => void;
  onMessage: (userId: Id<"users">) => void;
  hideHeader?: boolean;
  onBack?: () => void;
}

type TabType = "friends" | "requests" | "sent";

export default function FriendsPage({ onViewProfile, onMessage, hideHeader, onBack }: FriendsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [search, setSearch] = useState("");

  const friends = useQuery(api.friends.getMyFriends);
  const pendingRequests = useQuery(api.friends.getPendingRequests);
  const pendingCount = useQuery(api.friends.getPendingRequestsCount) ?? 0;
  const sentRequests = useQuery(api.friends.getMySentRequests);

  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectRequest = useMutation(api.friends.rejectFriendRequest);
  const cancelRequest = useMutation(api.friends.cancelFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredFriends = (friends ?? []).filter((f: any) =>
    !search || f?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // زر الرجوع في الهاتف — فقط إذا كانت الصفحة مستقلة
  useHardwareBack(onBack ?? (() => {}), !!onBack && !hideHeader);

  const handleAccept = async (requestId: Id<"friendRequests">) => {
    setLoadingId(requestId);
    try {
      await acceptRequest({ requestId });
      toast.success("🎉 تمت قبول طلب الصداقة!");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingId(null); }
  };

  const handleReject = async (requestId: Id<"friendRequests">) => {
    setLoadingId(requestId);
    try {
      await rejectRequest({ requestId });
      toast.success("تم رفض الطلب");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingId(null); }
  };

  const handleCancel = async (targetUserId: Id<"users">) => {
    setLoadingId(targetUserId);
    try {
      await cancelRequest({ targetUserId });
      toast.success("تم إلغاء الطلب");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingId(null); }
  };

  const handleRemove = async (friendUserId: Id<"users">) => {
    setLoadingId(friendUserId);
    try {
      await removeFriend({ friendUserId });
      toast.success("تم إلغاء الصداقة");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingId(null); }
  };

  const tabsBar = (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[
          { id: "friends" as TabType, label: "أصدقائي", count: friends?.length ?? 0, color: "#a855f7" },
          { id: "requests" as TabType, label: "الطلبات", count: pendingCount, color: "#10b981" },
          { id: "sent" as TabType, label: "المرسلة", count: sentRequests?.length ?? 0, color: "#f59e0b" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative"
            style={activeTab === tab.id
              ? { background: `${tab.color}15`, border: `1.5px solid ${tab.color}40`, color: tab.color }
              : { background: "#f9fafb", border: "1.5px solid #e5e7eb", color: "#6b7280" }
            }>
            {tab.label}
            {tab.count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 text-[9px] font-black text-white"
                style={{ background: tab.color }}>
                {tab.count > 99 ? "99+" : tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {activeTab === "friends" && (
        <div className="relative">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن صديق..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-purple-300" />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white" dir="rtl">

      {/* ── Header — يظهر فقط إذا لم يكن hideHeader ── */}
      {!hideHeader && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3 pt-safe">
            {onBack && (
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <h2 className="text-gray-900 font-black text-lg">الأصدقاء</h2>
              {pendingCount > 0 && (
                <p className="text-green-600 text-xs">{pendingCount} طلب جديد</p>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
          </div>
          <div className="px-4 pb-3">{tabsBar}</div>
        </div>
      )}

      {hideHeader && (
        <div className="px-4 pt-3 pb-2">{tabsBar}</div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-2">

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <>
            {!friends ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid #e5e7eb", borderTopColor: "#a855f7" }} />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <span className="text-4xl">👥</span>
                </div>
                <div className="text-center">
                  <p className="text-gray-800 font-bold text-base">{search ? "لا نتائج" : "لا أصدقاء بعد"}</p>
                  <p className="text-gray-400 text-sm mt-1">{search ? "جرب بحثاً آخر" : "ابحث عن أشخاص وأضفهم كأصدقاء"}</p>
                </div>
              </div>
            ) : (
              filteredFriends.map((friend: any) => (
                <FriendCard key={friend._id} profile={friend}
                  onViewProfile={() => onViewProfile(friend.userId)}
                  onMessage={() => onMessage(friend.userId)}
                  onRemove={() => handleRemove(friend.userId)}
                  loading={loadingId === friend.userId} />
              ))
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <>
            {!pendingRequests ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid #e5e7eb", borderTopColor: "#10b981" }} />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <span className="text-4xl">📬</span>
                </div>
                <div className="text-center">
                  <p className="text-gray-800 font-bold text-base">لا طلبات واردة</p>
                  <p className="text-gray-400 text-sm mt-1">ستظهر هنا طلبات الصداقة الجديدة</p>
                </div>
              </div>
            ) : (
              pendingRequests.map((req: any) => (
                <div key={req._id} className="flex items-center gap-3 rounded-2xl p-3.5 bg-green-50 border border-green-100">
                  <button onClick={() => onViewProfile(req.senderId)} className="flex-shrink-0">
                    <UserAvatar userId={req.senderId} avatarUrl={req.senderProfile?.avatarUrl} name={req.senderProfile?.name} size={50} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {req.senderProfile?.isVip
                        ? <VipName name={req.senderProfile?.name ?? "مجهول"} level={req.senderProfile?.vipLevel} />
                        : <p className="text-gray-900 font-bold text-sm truncate">{req.senderProfile?.name ?? "مجهول"}</p>}
                      {req.senderProfile?.isVip && <VipBadge size="sm" level={req.senderProfile?.vipLevel} />}
                    </div>
                    <p className="text-gray-500 text-xs">يريد إضافتك كصديق</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => handleAccept(req._id)} disabled={loadingId === req._id}
                      className="px-3 py-2 rounded-xl text-xs font-black text-white disabled:opacity-50 active:scale-95"
                      style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                      {loadingId === req._id ? "..." : "قبول"}
                    </button>
                    <button onClick={() => handleReject(req._id)} disabled={loadingId === req._id}
                      className="px-3 py-2 rounded-xl text-xs font-black disabled:opacity-50 active:scale-95 bg-red-50 border border-red-200 text-red-500">
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Sent Tab */}
        {activeTab === "sent" && (
          <>
            {!sentRequests ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid #e5e7eb", borderTopColor: "#f59e0b" }} />
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <span className="text-4xl">📤</span>
                </div>
                <div className="text-center">
                  <p className="text-gray-800 font-bold text-base">لا طلبات مرسلة</p>
                  <p className="text-gray-400 text-sm mt-1">الطلبات التي أرسلتها ستظهر هنا</p>
                </div>
              </div>
            ) : (
              sentRequests.map((req: any) => (
                <div key={req._id} className="flex items-center gap-3 rounded-2xl p-3.5 bg-amber-50 border border-amber-100">
                  <button onClick={() => onViewProfile(req.receiverId)} className="flex-shrink-0">
                    <UserAvatar userId={req.receiverId} avatarUrl={req.receiverProfile?.avatarUrl} name={req.receiverProfile?.name} size={50} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {req.receiverProfile?.isVip
                        ? <VipName name={req.receiverProfile?.name ?? "مجهول"} level={req.receiverProfile?.vipLevel} />
                        : <p className="text-gray-900 font-bold text-sm truncate">{req.receiverProfile?.name ?? "مجهول"}</p>}
                      {req.receiverProfile?.isVip && <VipBadge size="sm" level={req.receiverProfile?.vipLevel} />}
                    </div>
                    <p className="text-amber-600 text-xs">⏳ بانتظار القبول</p>
                  </div>
                  <button onClick={() => handleCancel(req.receiverId)} disabled={loadingId === req.receiverId}
                    className="px-3 py-2 rounded-xl text-xs font-black disabled:opacity-50 active:scale-95 bg-gray-100 border border-gray-200 text-gray-600 flex-shrink-0">
                    {loadingId === req.receiverId ? "..." : "إلغاء"}
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FriendCard({ profile, onViewProfile, onMessage, onRemove, loading }: {
  profile: any; onViewProfile: () => void; onMessage: () => void; onRemove: () => void; loading: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3.5 relative bg-gray-50 border border-gray-100">
      <button onClick={onViewProfile} className="flex-shrink-0">
        <UserAvatar userId={profile.userId} avatarUrl={profile.avatarUrl} name={profile.name} size={50} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {profile.isVip
            ? <VipName name={profile.name ?? "مجهول"} level={profile.vipLevel} />
            : <p className="text-gray-900 font-bold text-sm truncate">{profile.name ?? "مجهول"}</p>}
          {profile.isVip && <VipBadge size="sm" level={profile.vipLevel} />}
        </div>
        <p className="text-gray-400 text-xs">#{profile.sakiId}</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <button onClick={onMessage}
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 bg-purple-50 border border-purple-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>
        <button onClick={() => setShowMenu(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 bg-gray-100 border border-gray-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="12" cy="5" r="1" fill="#9ca3af" />
            <circle cx="12" cy="12" r="1" fill="#9ca3af" />
            <circle cx="12" cy="19" r="1" fill="#9ca3af" />
          </svg>
        </button>
      </div>
      {showMenu && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-6" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-3xl p-6 bg-white shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-gray-900 font-black text-lg">إلغاء الصداقة</h3>
              <p className="text-gray-500 text-sm mt-1">هل تريد إلغاء الصداقة مع <span className="text-gray-900 font-bold">{profile.name}</span>؟</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowMenu(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200 active:scale-95">
                إلغاء
              </button>
              <button
                onClick={() => { setShowMenu(false); onRemove(); }}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                {loading ? "..." : "إلغاء الصداقة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
