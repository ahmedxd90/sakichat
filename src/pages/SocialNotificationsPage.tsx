// @ts-nocheck
import React, { useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useHardwareBack } from "../hooks/useHardwareBack";

interface Props {
  onBack: () => void;
}

const SOCIAL_ICONS: Record<string, string> = {
  like_moment: "❤️",
  comment_moment: "💬",
  like_reel: "❤️",
  comment_reel: "💬",
  follow: "👤",
};

const SOCIAL_COLORS: Record<string, string> = {
  like_moment: "#ef4444",
  comment_moment: "#3b82f6",
  like_reel: "#ef4444",
  comment_reel: "#3b82f6",
  follow: "#10b981",
};

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  if (hours < 24) return `منذ ${hours} س`;
  if (days < 7) return `منذ ${days} ي`;
  return new Date(timestamp).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

export default function SocialNotificationsPage({ onBack }: Props) {
  const notifications = useQuery(api.notifications.getMyNotifications);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const socialNotifs = notifications?.filter((n) =>
    ["like_moment", "comment_moment", "like_reel", "comment_reel", "follow"].includes(n.type)
  ) ?? [];

  useEffect(() => {
    markAllRead().catch(() => {});
  }, []);

  // زر الرجوع في الهاتف
  useHardwareBack(onBack, true);

  return (
    <div className="flex flex-col min-h-screen bg-white" dir="rtl">

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 pt-safe">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-gray-900 font-black text-lg">الإشعارات الاجتماعية</h2>
            {socialNotifs.length > 0 && (
              <p className="text-gray-400 text-xs">{socialNotifs.length} إشعار</p>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
            <span className="text-lg">❤️</span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {!notifications ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid #e5e7eb", borderTopColor: "#111" }} />
            <p className="text-gray-400 text-sm">جارٍ التحميل...</p>
          </div>
        ) : socialNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 px-8">
            <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <span className="text-3xl">❤️</span>
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-bold text-base">لا توجد إشعارات</p>
              <p className="text-gray-400 text-sm mt-1">ستظهر هنا إشعارات التفاعل الاجتماعي</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {socialNotifs.map((notif) => {
              const icon = SOCIAL_ICONS[notif.type] ?? "🔔";
              const color = SOCIAL_COLORS[notif.type] ?? "#6b7280";
              const actorAvatar = notif.actorProfile?.avatarUrl;
              const actorName = notif.actorProfile?.name;
              return (
                <div
                  key={notif._id}
                  className="px-4 py-3.5"
                  style={{ background: notif.isRead ? "#fff" : "#f8fff8" }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar / Icon */}
                    <div className="flex-shrink-0 relative">
                      {actorAvatar ? (
                        <img
                          src={actorAvatar}
                          alt={actorName}
                          className="w-11 h-11 rounded-full object-cover"
                          style={{ border: `2px solid ${color}30` }}
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-lg"
                          style={{ background: `${color}15`, border: `1.5px solid ${color}30` }}
                        >
                          {icon}
                        </div>
                      )}
                      {actorAvatar && (
                        <div
                          className="absolute -bottom-0.5 -left-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                          style={{ background: color, border: "1.5px solid white" }}
                        >
                          {icon}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {notif.title && (
                            <p className="text-gray-900 font-bold text-sm leading-snug">{notif.title}</p>
                          )}
                          {notif.body && (
                            <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{notif.body}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-gray-400 text-[10px] whitespace-nowrap">{formatTime(notif.createdAt)}</span>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
