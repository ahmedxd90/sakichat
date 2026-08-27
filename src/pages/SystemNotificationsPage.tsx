// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";
import { useHardwareBack } from "../hooks/useHardwareBack";

interface Props {
  onBack: () => void;
}

const NOTIF_ICONS: Record<string, string> = {
  charge: "💰",
  diamond_received: "💎",
  family_invite: "👨‍👩‍👧‍👦",
  gift_received: "🎁",
  cp_ring: "💍",
  system: "🔔",
  follow: "👤",
  like: "❤️",
  comment: "💬",
  mention: "📢",
};

const NOTIF_COLORS: Record<string, string> = {
  charge: "#f59e0b",
  diamond_received: "#3b82f6",
  family_invite: "#8b5cf6",
  gift_received: "#ec4899",
  cp_ring: "#ef4444",
  system: "#6b7280",
  follow: "#10b981",
  like: "#ef4444",
  comment: "#3b82f6",
  mention: "#f59e0b",
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

export default function SystemNotificationsPage({ onBack }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cpLoading, setCpLoading] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('notifications').select('*, actor_profile:profiles(*)').order('created_at', { ascending: false });
      setNotifications(data || []);
      // Mark all read
      if (data && data.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      }
    };
    fetchData();
  }, []);

  const systemNotifs = notifications?.filter((n) =>
    ["charge", "system", "diamond_received", "family_invite", "gift_received", "cp_ring",
     "follow", "like", "comment", "mention"].includes(n.type)
  ) ?? [];

  const respondToCp = async (args: any) => {};

  // زر الرجوع في الهاتف
  useHardwareBack(onBack, true);

  const handleCpRespond = useCallback(async (refId: string, accept: boolean) => {
    setCpLoading(refId);
    try {
      await respondToCp({ userItemId: refId as string, accept });
      toast.success(accept ? "قبلت الخاتم 💍" : "رفضت الخاتم");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCpLoading(null);
    }
  }, [respondToCp]);

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
            <h2 className="text-gray-900 font-black text-lg">إشعارات النظام</h2>
            {systemNotifs.length > 0 && (
              <p className="text-gray-400 text-xs">{systemNotifs.length} إشعار</p>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
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
        ) : systemNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 px-8">
            <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-bold text-base">لا توجد إشعارات</p>
              <p className="text-gray-400 text-sm mt-1">ستظهر هنا إشعارات النظام والتنبيهات</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {systemNotifs.map((notif) => (
              <NotifItem
                key={notif.id}
                notif={notif}
                cpLoading={cpLoading}
                onCpRespond={handleCpRespond}
                onImageClick={setFullscreenImage}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Fullscreen Image ── */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90"
            onClick={() => setFullscreenImage(null)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <img
            src={fullscreenImage}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function NotifItem({ notif, cpLoading, onCpRespond, onImageClick }: {
  notif: any;
  cpLoading: string | null;
  onCpRespond: (refId: string, accept: boolean) => void;
  onImageClick: (url: string) => void;
}) {
  const icon = NOTIF_ICONS[notif.type] ?? "🔔";
  const color = NOTIF_COLORS[notif.type] ?? "#6b7280";
  const timeStr = formatTime(notif.createdAt);
  const actorAvatar = notif.actorProfile?.avatarUrl;
  const actorName = notif.actorProfile?.name;

  return (
    <div
      className="px-4 py-3.5 transition-colors"
      style={{ background: notif.isRead ? "#fff" : "#f8f9ff" }}
    >
      <div className="flex items-start gap-3">
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
              <span className="text-gray-400 text-[10px] whitespace-nowrap">{timeStr}</span>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              )}
            </div>
          </div>

          {notif.imageUrl && (
            <button
              onClick={() => onImageClick(notif.imageUrl)}
              className="mt-2 rounded-xl overflow-hidden active:opacity-80 transition-opacity block"
              style={{ maxWidth: 200 }}
            >
              <img
                src={notif.imageUrl}
                alt="صورة الإشعار"
                className="w-full object-cover rounded-xl"
                style={{ maxHeight: 140 }}
                loading="lazy"
              />
            </button>
          )}

          {notif.type === "cp_ring" && notif.refId && (
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => onCpRespond(notif.refId, true)}
                disabled={cpLoading === notif.refId}
                className="flex-1 py-2 rounded-xl text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)" }}
              >
                {cpLoading === notif.refId ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : "💍 قبول"}
              </button>
              <button
                onClick={() => onCpRespond(notif.refId, false)}
                disabled={cpLoading === notif.refId}
                className="flex-1 py-2 rounded-xl text-gray-600 text-xs font-bold active:scale-95 transition-all disabled:opacity-50 border border-gray-200 bg-gray-50"
              >
                رفض
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
