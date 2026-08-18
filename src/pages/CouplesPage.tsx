// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "../lib/toast";

interface CouplesPageProps {
  onBack: () => void;
  onViewProfile?: (userId: Id<"users">) => void;
}

// ── عرض الارتباط المتحرك ──
function CpLoveDisplay({ userAvatarUrl, userName, partnerAvatarUrl, partnerName, startedAt }: any) {
  const days = startedAt ? Math.floor((Date.now() - startedAt) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="flex items-center gap-4">
        {/* صورة المستخدم */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="rounded-full p-[3px]"
            style={{ background: "linear-gradient(135deg,#ff4d6d,#ff85a1)", boxShadow: "0 0 18px rgba(255,77,109,0.5)" }}
          >
            <div className="rounded-full overflow-hidden bg-gray-800" style={{ width: 64, height: 64 }}>
              {userAvatarUrl ? (
                <img src={userAvatarUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
              )}
            </div>
          </div>
          <span className="text-xs text-white font-bold truncate max-w-[70px] text-center">{userName}</span>
        </div>

        {/* قلب متحرك */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl animate-pulse">💑</div>
          <span className="text-[10px] text-pink-300">{days} يوم</span>
        </div>

        {/* صورة الشريك */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="rounded-full p-[3px]"
            style={{ background: "linear-gradient(135deg,#ff4d6d,#ff85a1)", boxShadow: "0 0 18px rgba(255,77,109,0.5)" }}
          >
            <div className="rounded-full overflow-hidden bg-gray-800" style={{ width: 64, height: 64 }}>
              {partnerAvatarUrl ? (
                <img src={partnerAvatarUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
              )}
            </div>
          </div>
          <span className="text-xs text-white font-bold truncate max-w-[70px] text-center">{partnerName}</span>
        </div>
      </div>

      {/* خط الارتباط */}
      <div className="flex items-center gap-2 mt-1">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-pink-500" />
        <span className="text-pink-400 text-xs font-bold">مرتبطان 💕</span>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-pink-500" />
      </div>
    </div>
  );
}

// ── بطاقة طلب ارتباط وارد ──
function PendingRequestCard({ request, onAccept, onReject }: any) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-pink-500/20">
      <div className="rounded-full overflow-hidden bg-gray-700 flex-shrink-0" style={{ width: 48, height: 48 }}>
        {request.senderProfile?.avatarUrl ? (
          <img src={request.senderProfile.avatarUrl} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{request.senderProfile?.name ?? "مستخدم"}</p>
        <p className="text-pink-300 text-xs">يريد الارتباط بك 💑</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            setLoading(true);
            try { await onAccept(request._id); }
            finally { setLoading(false); }
          }}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg,#ec4899,#f43f5e)" }}
        >
          قبول
        </button>
        <button
          onClick={async () => {
            setLoading(true);
            try { await onReject(request._id); }
            finally { setLoading(false); }
          }}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-300 bg-white/10"
        >
          رفض
        </button>
      </div>
    </div>
  );
}

export default function CouplesPage({ onBack, onViewProfile }: CouplesPageProps) {
  const myCouple = useQuery(api.couples.getMyCouple);
  const pendingRequests = useQuery(api.couples.getPendingCoupleRequests);
  const profile = useQuery(api.profiles.getMyProfile);

  const sendRequest = useMutation(api.couples.sendCoupleRequest);
  const respondRequest = useMutation(api.couples.respondCoupleRequest);
  const breakCouple = useMutation(api.couples.breakCouple);

  const [searchSakiId, setSearchSakiId] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showBreakConfirm, setShowBreakConfirm] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [tab, setTab] = useState<"couple" | "requests">("couple");

  const searchProfile = useQuery(
    api.profiles.getProfileBySakiId,
    searchSakiId.trim().length >= 3 ? { sakiId: searchSakiId.trim() } : "skip"
  );

  const handleSearch = () => {
    if (!searchSakiId.trim()) return;
    setSearchResult(searchProfile ?? null);
  };

  const handleSendRequest = async (targetUserId: Id<"users">) => {
    setSendingRequest(true);
    try {
      await sendRequest({ targetUserId });
      toast.success("تم إرسال طلب الارتباط 💑");
      setSearchSakiId("");
      setSearchResult(null);
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAccept = async (coupleId: Id<"couples">) => {
    try {
      await respondRequest({ coupleId, accept: true });
      toast.success("تم قبول طلب الارتباط 💑");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    }
  };

  const handleReject = async (coupleId: Id<"couples">) => {
    try {
      await respondRequest({ coupleId, accept: false });
      toast.success("تم رفض الطلب");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    }
  };

  const handleBreak = async () => {
    setBreaking(true);
    try {
      await breakCouple({});
      toast.success("تم إنهاء الارتباط 💔");
      setShowBreakConfirm(false);
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setBreaking(false);
    }
  };

  const pendingCount = pendingRequests?.length ?? 0;

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a]" dir="rtl">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-safe pb-3 border-b border-white/8"
        style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.15),rgba(244,63,94,0.1))" }}
      >
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-lg">الارتباط 💑</h1>
          <p className="text-pink-300 text-xs">ارتبط بشريك حياتك</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-3">
        <button
          onClick={() => setTab("couple")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === "couple" ? "text-white" : "text-gray-400 bg-white/5"}`}
          style={tab === "couple" ? { background: "linear-gradient(135deg,#ec4899,#f43f5e)" } : {}}
        >
          💑 الارتباط
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all relative ${tab === "requests" ? "text-white" : "text-gray-400 bg-white/5"}`}
          style={tab === "requests" ? { background: "linear-gradient(135deg,#ec4899,#f43f5e)" } : {}}
        >
          📩 الطلبات
          {pendingCount > 0 && (
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {tab === "couple" && (
          <>
            {/* حالة الارتباط الحالية */}
            {myCouple ? (
              <div
                className="rounded-2xl p-4 border border-pink-500/30"
                style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.1),rgba(244,63,94,0.08))" }}
              >
                <CpLoveDisplay
                  userAvatarUrl={profile?.avatarUrl}
                  userName={profile?.name ?? "أنت"}
                  partnerAvatarUrl={myCouple.partnerProfile?.avatarUrl}
                  partnerName={myCouple.partnerProfile?.name ?? "الشريك"}
                  startedAt={myCouple.startedAt}
                />

                {/* معلومات الشريك */}
                {myCouple.partnerProfile && (
                  <div className="mt-3 bg-white/5 rounded-xl p-3 flex items-center gap-3">
                    <div className="rounded-full overflow-hidden bg-gray-700 flex-shrink-0" style={{ width: 40, height: 40 }}>
                      {myCouple.partnerProfile.avatarUrl ? (
                        <img src={myCouple.partnerProfile.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">👤</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{myCouple.partnerProfile.name}</p>
                      <p className="text-gray-400 text-xs">#{myCouple.partnerProfile.sakiId}</p>
                    </div>
                    {onViewProfile && (
                      <button
                        onClick={() => onViewProfile(myCouple.partnerProfile.userId)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/10"
                      >
                        الملف
                      </button>
                    )}
                  </div>
                )}

                {/* تاريخ الارتباط */}
                {myCouple.startedAt && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-pink-300 text-xs">
                    <span>💕</span>
                    <span>
                      معاً منذ {new Date(myCouple.startedAt).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                )}

                {/* زر إنهاء الارتباط */}
                <button
                  onClick={() => setShowBreakConfirm(true)}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20"
                >
                  💔 إنهاء الارتباط
                </button>
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 border border-pink-500/20 text-center"
                style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.08),rgba(244,63,94,0.05))" }}
              >
                <div className="text-5xl mb-3">💑</div>
                <p className="text-white font-bold text-base mb-1">لا يوجد ارتباط حالياً</p>
                <p className="text-gray-400 text-sm">ابحث عن شريكك وأرسل طلب ارتباط</p>
              </div>
            )}

            {/* البحث عن مستخدم */}
            {!myCouple && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/8">
                <h3 className="text-white font-bold text-sm mb-3">🔍 ابحث بـ Saki ID</h3>
                <div className="flex gap-2">
                  <input
                    value={searchSakiId}
                    onChange={(e) => {
                      setSearchSakiId(e.target.value);
                      setSearchResult(null);
                    }}
                    placeholder="أدخل Saki ID..."
                    className="flex-1 bg-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-pink-500/50"
                    dir="ltr"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#ec4899,#f43f5e)" }}
                  >
                    بحث
                  </button>
                </div>

                {/* نتيجة البحث */}
                {searchProfile && (
                  <div className="mt-3 bg-white/5 rounded-xl p-3 flex items-center gap-3">
                    <div className="rounded-full overflow-hidden bg-gray-700 flex-shrink-0" style={{ width: 44, height: 44 }}>
                      {searchProfile.avatarUrl ? (
                        <img src={searchProfile.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{searchProfile.name}</p>
                      <p className="text-gray-400 text-xs">#{searchProfile.sakiId}</p>
                    </div>
                    {searchProfile.userId !== profile?.userId && (
                      <button
                        onClick={() => handleSendRequest(searchProfile.userId)}
                        disabled={sendingRequest}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#ec4899,#f43f5e)" }}
                      >
                        {sendingRequest ? "..." : "💑 ارتباط"}
                      </button>
                    )}
                  </div>
                )}
                {searchSakiId.trim().length >= 3 && searchProfile === null && (
                  <p className="mt-2 text-gray-400 text-xs text-center">لم يتم العثور على مستخدم</p>
                )}
              </div>
            )}

            {/* معلومات عن الارتباط */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/8">
              <h3 className="text-pink-300 font-bold text-sm mb-3">💡 عن الارتباط</h3>
              <div className="space-y-2">
                {[
                  { icon: "💑", text: "ارتبط بشريك واحد فقط في نفس الوقت" },
                  { icon: "💕", text: "يظهر اسم شريكك في ملفك الشخصي" },
                  { icon: "🎁", text: "احصل على مزايا خاصة للأزواج" },
                  { icon: "💔", text: "يمكنك إنهاء الارتباط في أي وقت" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300 text-xs">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "requests" && (
          <>
            {pendingRequests === undefined ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📩</div>
                <p className="text-gray-400 text-sm">لا توجد طلبات ارتباط</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-xs">
                  {pendingRequests.length} طلب ارتباط وارد
                </p>
                {pendingRequests.map((req) => (
                  <PendingRequestCard
                    key={req._id}
                    request={req}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* تأكيد إنهاء الارتباط */}
      {showBreakConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-6">
          <div className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-sm border border-red-500/30">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">💔</div>
              <h3 className="text-white font-black text-lg">إنهاء الارتباط</h3>
              <p className="text-gray-400 text-sm mt-1">هل أنت متأكد من إنهاء الارتباط؟ لا يمكن التراجع عن هذا القرار.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBreakConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-300 bg-white/10"
              >
                إلغاء
              </button>
              <button
                onClick={handleBreak}
                disabled={breaking}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500"
              >
                {breaking ? "..." : "إنهاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
