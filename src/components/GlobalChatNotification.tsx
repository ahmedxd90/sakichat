// @ts-nocheck
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";

export default function GlobalChatNotification() {
  const conversations = useQuery(api.messages.getConversations);
  const myProfile = useQuery(api.profiles.getMyProfile);
  const [notification, setNotification] = useState<any>(null);
  const lastMsgIdRef = useRef<string | null>(null);
  const initDoneRef = useRef(false);

  useEffect(() => {
    if (!conversations || !myProfile) return;
    if (!initDoneRef.current) {
      initDoneRef.current = true;
      if (conversations.length > 0) lastMsgIdRef.current = conversations[0]._id;
      return;
    }
    if (conversations.length === 0) return;
    const latest = conversations[0];
    if (latest._id === lastMsgIdRef.current) return;
    if (latest.senderId === myProfile.userId) {
      lastMsgIdRef.current = latest._id;
      return;
    }
    lastMsgIdRef.current = latest._id;
    setNotification({
      key: latest._id,
      senderName: latest.otherProfile?.name ?? "مجهول",
      senderAvatar: latest.otherProfile?.avatarUrl,
      content: latest.content ?? "",
      type: latest.type ?? "text",
    });
  }, [conversations?.[0]?._id]);

  if (!notification) return null;
  return (
    <NotifBar
      key={notification.key}
      senderName={notification.senderName}
      senderAvatar={notification.senderAvatar}
      content={notification.content}
      type={notification.type}
      onDismiss={() => setNotification(null)}
    />
  );
}

function NotifBar({ senderName, senderAvatar, content, type, onDismiss }: {
  senderName: string; senderAvatar?: string; content: string; type: string; onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 30);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400); }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const preview =
    type === "image" ? "📷 صورة" :
    type === "voice" ? "🎤 رسالة صوتية" :
    type === "call" ? "📹 مكالمة فيديو" :
    type === "gift" ? "🎁 هدية" :
    content?.length > 45 ? content.slice(0, 45) + "..." : content;

  return (
    <div style={{
      position: "fixed",
      top: "calc(env(safe-area-inset-top, 0px) + 8px)",
      left: 12, right: 12,
      zIndex: 99999,
      transform: visible ? "translateY(0) scale(1)" : "translateY(-115%) scale(0.95)",
      opacity: visible ? 1 : 0,
      transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease",
      willChange: "transform",
      pointerEvents: "auto",
    }}>
      <div style={{
        background: "linear-gradient(135deg,rgba(12,8,25,0.97),rgba(22,12,45,0.97))",
        border: "1px solid rgba(168,85,247,0.5)",
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(168,85,247,0.35),0 2px 8px rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px",
        backdropFilter: "blur(20px)",
        overflow: "hidden", position: "relative",
      }}>
        {/* Shimmer */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 20,
          background: "linear-gradient(105deg,transparent 35%,rgba(168,85,247,0.07) 50%,transparent 65%)",
          animation: "gcn-shimmer 2s linear infinite", pointerEvents: "none",
        }} />
        {/* Top glow line */}
        <div style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
          background: "linear-gradient(90deg,transparent,rgba(168,85,247,0.8),rgba(236,72,153,0.5),transparent)",
        }} />

        {/* App icon */}
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(135deg,#a855f7,#ec4899)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px rgba(168,85,247,0.6)",
          position: "relative", zIndex: 1,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>

        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          border: "2px solid rgba(168,85,247,0.65)",
          boxShadow: "0 0 10px rgba(168,85,247,0.45)",
          position: "relative", zIndex: 1,
          background: "linear-gradient(135deg,#7c3aed,#ec4899)",
        }}>
          {senderAvatar
            ? <img src={senderAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 15 }}>{senderName?.[0]}</div>
          }
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ color: "#e9d5ff", fontWeight: 900, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
              {senderName}
            </span>
            <span style={{ color: "rgba(168,85,247,0.75)", fontSize: 9, whiteSpace: "nowrap" }}>رسالة جديدة ✉️</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {preview}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          style={{
            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 1, cursor: "pointer",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <style>{`@keyframes gcn-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(220%)}}`}</style>
    </div>
  );
}
