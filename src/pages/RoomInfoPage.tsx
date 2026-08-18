// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { ARAB_COUNTRIES } from "../data/countries";
import { VipFrame, VipName, VipBadge } from "./VipBadge";
import UserAvatar from "./UserAvatar";
import { toast } from "sonner";

interface RoomInfoPageProps {
  roomId: Id<"rooms">;
  isOwner: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
}

export default function RoomInfoPage({
  roomId,
  isOwner,
  onClose,
  onOpenSettings,
  onOpenLeaderboard,
}: RoomInfoPageProps) {
  const room = useQuery(api.rooms.getRoom, { roomId });
  const admins = useQuery(api.roomSocial.getRoomAdmins, { roomId });
  const likesData = useQuery(api.roomSocial.getRoomLikes, { roomId });
  const myProfile = useQuery(api.profiles.getMyProfile);
  const toggleLike = useMutation(api.roomSocial.toggleRoomLike);

  const [likeLoading, setLikeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "admins" | "likes">("info");

  const country = ARAB_COUNTRIES.find((c) => c.code === room?.country);
  const owners = admins?.filter((a) => a.role === "owner") ?? [];
  const adminList = admins?.filter((a) => a.role === "admin") ?? [];

  const handleToggleLike = async () => {
    if (!myProfile) { toast.error("يجب تسجيل الدخول"); return; }
    setLikeLoading(true);
    try {
      const result = await toggleLike({ roomId });
      toast.success(result ? "❤️ أعجبك هذه القاعة!" : "تم إلغاء الإعجاب");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLikeLoading(false);
    }
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: "#0a0a15" }} dir="rtl">
      {/* Cover Image */}
      <div className="relative h-52 flex-shrink-0">
        {room.coverUrl ? (
          <img src={room.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {isOwner && (
            <button
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          )}
        </div>

        {/* Room name + like */}
        <div className="absolute bottom-3 right-4 left-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-black text-xl truncate drop-shadow-lg">{room.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-white/50 text-xs font-mono bg-black/40 rounded-lg px-2 py-0.5">
                  #{room.roomNumericId ?? "—"}
                </span>
                <span className="text-white/60 text-xs">{country?.flag} {country?.name}</span>
              </div>
            </div>
            {/* Like button */}
            <button
              onClick={handleToggleLike}
              disabled={likeLoading}
              className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: likesData?.isLiked ? "rgba(239,68,68,0.3)" : "rgba(0,0,0,0.5)",
                  border: likesData?.isLiked ? "1.5px solid rgba(239,68,68,0.6)" : "1.5px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="text-xl">{likesData?.isLiked ? "❤️" : "🤍"}</span>
              </div>
              <span className="text-white/70 text-[10px] font-bold">{likesData?.count ?? 0}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3 border-b border-white/10 flex-shrink-0">
        {([
          { id: "info", label: "معلومات", emoji: "ℹ️" },
          { id: "admins", label: "المشرفون", emoji: "🛡️" },
          { id: "likes", label: "المعجبون", emoji: "❤️" },
        ] as { id: "info" | "admins" | "likes"; label: string; emoji: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.id
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-gray-400"
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── INFO TAB ── */}
        {activeTab === "info" && (
          <div className="p-4 space-y-3">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <p className="text-white font-black text-lg">{room.memberCount}</p>
                <p className="text-gray-500 text-[10px]">عضو</p>
              </div>
              <button
                onClick={onOpenLeaderboard}
                className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3 text-center active:scale-95 transition-transform"
              >
                <p className="text-yellow-400 font-black text-lg">
                  {(room.totalCoinsSpent ?? 0) >= 1000
                    ? `${((room.totalCoinsSpent ?? 0) / 1000).toFixed(1)}k`
                    : room.totalCoinsSpent ?? 0}
                </p>
                <p className="text-yellow-600 text-[10px]">🪙 عملات</p>
              </button>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <p className="text-white font-black text-lg">{adminList.length}</p>
                <p className="text-gray-500 text-[10px]">مشرف</p>
              </div>
            </div>

            {/* Description */}
            {room.description && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-gray-400 text-xs font-bold mb-1.5">📝 وصف الغرفة</p>
                <p className="text-white text-sm leading-relaxed">{room.description}</p>
              </div>
            )}

            {/* Country */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-gray-400 text-xs font-bold mb-2">🌍 الدولة</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{country?.flag}</span>
                <span className="text-white font-bold">{country?.name ?? room.country}</span>
              </div>
            </div>

            {/* Tags */}
            {room.tags && room.tags.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-gray-400 text-xs font-bold mb-2">🏷️ الوسوم</p>
                <div className="flex flex-wrap gap-2">
                  {room.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Room ID */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-gray-400 text-xs font-bold mb-1.5">🆔 معرّف الغرفة</p>
              <p className="text-white font-mono text-base font-bold">#{room.roomNumericId ?? "—"}</p>
            </div>
          </div>
        )}

        {/* ── ADMINS TAB ── */}
        {activeTab === "admins" && (
          <div className="p-4 space-y-4">
            {/* Owner section */}
            {owners.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">👑</span>
                  <p className="text-yellow-400 font-bold text-sm">المالك</p>
                </div>
                <div className="space-y-2">
                  {owners.map((m) => (
                    <StaffCard key={m._id} member={m} />
                  ))}
                </div>
              </div>
            )}

            {/* Admins section */}
            {adminList.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🛡️</span>
                  <p className="text-purple-400 font-bold text-sm">المشرفون ({adminList.length})</p>
                </div>
                <div className="space-y-2">
                  {adminList.map((m, idx) => (
                    <StaffCard key={m._id} member={m} rank={idx + 1} />
                  ))}
                </div>
              </div>
            )}

            {admins?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-5xl">🛡️</span>
                <p className="text-gray-400 text-sm">لا يوجد مشرفون بعد</p>
              </div>
            )}
          </div>
        )}

        {/* ── LIKES TAB ── */}
        {activeTab === "likes" && (
          <div className="p-4 space-y-4">
            <div className="flex flex-col items-center gap-2 py-4">
              <button
                onClick={handleToggleLike}
                disabled={likeLoading}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  likesData?.isLiked
                    ? "bg-red-500/30 border-2 border-red-500"
                    : "bg-white/5 border-2 border-white/20"
                }`}
              >
                <span className="text-4xl">{likesData?.isLiked ? "❤️" : "🤍"}</span>
              </button>
              <p className="text-white font-black text-3xl">{likesData?.count ?? 0}</p>
              <p className="text-gray-400 text-sm">إعجاب</p>
            </div>

            {likesData && likesData.likers.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs font-bold mb-3">من أعجبهم القاعة</p>
                <div className="grid grid-cols-4 gap-3">
                  {likesData.likers.map((liker) => (
                    <div key={liker.userId} className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
                        {liker.avatarUrl ? (
                          <img src={liker.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{liker.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-gray-300 text-[10px] truncate max-w-[52px] text-center">{liker.name}</span>
                      {liker.isVip && <span className="text-[8px] text-yellow-400">VIP</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {likesData?.likers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <p className="text-gray-500 text-sm">لا يوجد معجبون بعد</p>
                <p className="text-gray-600 text-xs">كن أول من يعجب بهذه القاعة!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StaffCard({ member, rank }: { member: any; rank?: number }) {
  const isOwner = member.role === "owner";
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
      style={{
        background: isOwner ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
        border: isOwner ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {rank && (
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <span className="text-gray-400 text-[10px] font-bold">{rank}</span>
        </div>
      )}
      <VipFrame isVip={member.profile?.isVip ?? false} level={member.profile?.vipLevel}>
        <UserAvatar
          userId={member.userId}
          avatarUrl={member.profile?.avatarUrl}
          name={member.profile?.name}
          size={40}
        />
      </VipFrame>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {member.profile?.isVip
            ? <VipName name={member.profile?.name ?? "مجهول"} level={member.profile?.vipLevel} />
            : <span className="text-white font-bold text-sm truncate">{member.profile?.name ?? "مجهول"}</span>
          }
          {member.profile?.isVip && <VipBadge size="sm" level={member.profile?.vipLevel} />}
        </div>
        <span className="text-gray-500 text-[10px]">
          {isOwner ? "👑 المالك" : "🛡️ مشرف"}
        </span>
      </div>
    </div>
  );
}
