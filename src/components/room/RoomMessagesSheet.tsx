// @ts-nocheck
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { VipName, VipBadge } from "../VipBadge";
import UserAvatar from "../UserAvatar";
import LevelBadgeInline from "../LevelBadgeInline";

interface RoomMessagesSheetProps {
  onClose: () => void;
  onOpenChat: (userId: Id<"users">) => void;
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes}د`;
  if (hours < 24) return `${hours}س`;
  if (days < 7) return `${days}ي`;
  return new Date(timestamp).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

export default function RoomMessagesSheet({ onClose, onOpenChat }: RoomMessagesSheetProps) {
  const conversations = useQuery(api.messages.getConversations);
  const unreadCount = useQuery(api.messages.getTotalUnreadCount) ?? 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  const handleOpenChat = (userId: Id<"users">) => {
    setVisible(false);
    setTimeout(() => onOpenChat(userId), 200);
  };

  return (
    <div
      className="fixed inset-0 z-[250]"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg,#0f0a1e 0%,#0a0515 100%)",
          border: "1px solid rgba(168,85,247,0.2)",
          borderBottom: "none",
          maxHeight: "80vh",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(168,85,247,0.4)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-base">الرسائل الخاصة</h3>
            {unreadCount > 0 && (
              <div className="min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5" style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                <span className="text-white text-[10px] font-black">{unreadCount > 99 ? "99+" : unreadCount}</span>
              </div>
            )}
          </div>
          <div className="w-8" />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto py-2 px-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
          {!conversations ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-semibold">لا توجد رسائل بعد</p>
              <p className="text-gray-600 text-xs text-center">يمكنك إرسال رسالة لأي عضو في الغرفة</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {conversations.map((conv) => {
                const isPrivate = Boolean(conv.otherProfile?.isPrivateProfile);
                const displayName = isPrivate ? "شخصي" : (conv.otherProfile?.name ?? "مجهول");
                const isVip = !isPrivate && (conv.otherProfile?.isVip ?? false);
                const timeStr = formatTime(conv.createdAt);
                const preview =
                  conv.type === "image" ? "📷 صورة" :
                  conv.type === "voice" ? "🎤 رسالة صوتية" :
                  conv.type === "gift" ? "🎁 هدية" :
                  conv.type === "video" ? "🎥 فيديو" :
                  (conv.content?.length > 35 ? conv.content.slice(0, 35) + "..." : conv.content);

                return (
                  <button
                    key={conv.otherId}
                    onClick={() => handleOpenChat(conv.otherId as Id<"users">)}
                    className="w-full flex items-center gap-3 rounded-2xl p-3 active:scale-[0.98] transition-all text-right"
                    style={{
                      background: conv.unreadCount > 0 ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.04)",
                      border: conv.unreadCount > 0 ? "1px solid rgba(168,85,247,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      <UserAvatar
                        userId={conv.otherId as Id<"users">}
                        avatarUrl={conv.otherProfile?.avatarUrl}
                        name={conv.otherProfile?.name}
                        size={46}
                        showFrame={!isPrivate}
                        showVipFrame={!isPrivate}
                        vipLevel={conv.otherProfile?.vipLevel}
                      />
                      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "#0a0515", background: "#4ade80" }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          {isVip ? (
                            <VipName name={displayName} level={conv.otherProfile?.vipLevel} />
                          ) : (
                            <p className="text-white font-bold text-sm truncate">{displayName}</p>
                          )}
                          {!isPrivate && isVip && <VipBadge size="sm" level={conv.otherProfile?.vipLevel} />}
                        </div>
                        <p className="text-gray-500 text-[10px] flex-shrink-0">{timeStr}</p>
                      </div>
                      <p className="text-gray-400 text-xs truncate">{preview}</p>
                    </div>

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                        <span className="text-white text-[9px] font-black">{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
