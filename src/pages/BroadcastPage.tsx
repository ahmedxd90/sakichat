// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "../lib/toast";

interface BroadcastPageProps {
  onBack: () => void;
}

const VIP_COLORS: Record<number, string> = {
  1: "#60a5fa",
  2: "#ec4899",
  3: "#a855f7",
  4: "#fbbf24",
  5: "#f97316",
  6: "#ef4444",
  7: "#8b5cf6",
  8: "#06b6d4",
  9: "#10b981",
  10: "#f0abfc",
  11: "#fde68a",
  12: "#ffd700",
};

function getVipColor(level: number): string {
  return VIP_COLORS[level] ?? "#9ca3af";
}

export default function BroadcastPage({ onBack }: BroadcastPageProps) {
  const messages = useQuery(api.broadcast.getMessages) ?? [];
  const sendMessage = useMutation(api.broadcast.sendMessage);
  const profile = useQuery(api.profiles.getMyProfile);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const vipLevel = profile?.vipLevel ?? 0;
  const isVip = profile?.isVip ?? false;
  const isSuperAdmin = profile?.isSuperAdmin ?? false;
  const canSend = isSuperAdmin || (isVip && vipLevel >= 6);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await sendMessage({ content });
      setText("");
      inputRef.current?.focus();
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الإرسال");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        height: "100%",
        background: "#f4f6f9",
        fontFamily: "'Cairo', sans-serif",
      }}
      dir="rtl"
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{
          background: "#fff",
          borderBottom: "1px solid #eee",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "#f0f0f5" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#9333ea,#c084fc)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <h1 className="font-black text-lg" style={{ color: "#1a1a1a" }}>الإذاعة</h1>
        </div>

        {/* VIP badge */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black"
          style={{ background: "rgba(147,51,234,0.1)", color: "#9333ea" }}
        >
          <span>VIP6+</span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
              style={{ background: "rgba(147,51,234,0.1)" }}
            >
              📢
            </div>
            <p className="text-gray-500 text-sm font-bold">لا توجد رسائل بعد</p>
            <p className="text-gray-400 text-xs">كن أول من يرسل رسالة إذاعة</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg: any) => (
              <BroadcastCard key={msg._id} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Footer ── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{
          background: "#fff",
          borderTop: "1px solid #eee",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || !canSend}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all disabled:opacity-40"
          style={{
            background: "#ffca28",
            boxShadow: "0 4px 10px rgba(255,202,40,0.4)",
          }}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>

        {/* Input */}
        <div
          className="flex-1 flex items-center gap-2 px-4 rounded-3xl"
          style={{ background: "#f0f0f0", height: 45 }}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={canSend ? "اكتب رسالتك هنا..." : `متاح لـ VIP6 وأعلى فقط`}
            disabled={!canSend}
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-right"
            style={{ color: "#444", direction: "rtl" }}
            maxLength={200}
          />
          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: "#aaa" }}>
            {canSend ? "50 ذهبية" : "🔒"}
          </span>
        </div>
      </div>

      {/* VIP lock notice */}
      {!canSend && profile && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 mx-4 mb-3 rounded-2xl"
          style={{ background: "rgba(147,51,234,0.08)", border: "1px solid rgba(147,51,234,0.2)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <p className="text-xs font-bold" style={{ color: "#9333ea" }}>
            ميزة الإذاعة متاحة لـ VIP6 وأعلى فقط — تكلفة الإرسال 50 ذهبية
          </p>
        </div>
      )}
    </div>
  );
}

// ── Broadcast Card ────────────────────────────────────────────────────────────
function BroadcastCard({ msg }: { msg: any }) {
  const vipLevel = msg.senderVipLevel ?? 0;
  const vipColor = getVipColor(vipLevel);

  return (
    <div
      className="flex gap-3 p-3 rounded-2xl"
      style={{
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        border: "1px solid #f0f0f0",
      }}
    >
      {/* Message content (right side in RTL) */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* User info row */}
        <div className="flex items-center flex-wrap gap-1.5">
          {vipLevel > 0 && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-black text-white flex-shrink-0"
              style={{ background: `linear-gradient(90deg, #8e2de2, #4a00e0)` }}
            >
              VIP{vipLevel}
            </span>
          )}
          {msg.senderSakiId && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-black text-white flex-shrink-0 flex items-center gap-0.5"
              style={{ background: "#3b82f6" }}
            >
              <svg width="7" height="7" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
              {msg.senderSakiId}
            </span>
          )}
          <span
            className="font-black text-sm truncate"
            style={{ color: vipLevel >= 6 ? vipColor : "#ff9800" }}
          >
            {msg.senderName}
          </span>
        </div>

        {/* Message text */}
        <p className="text-sm font-semibold leading-relaxed" style={{ color: "#555" }}>
          {msg.content}
        </p>

        {/* Time */}
        <span className="text-[10px]" style={{ color: "#bbb" }}>
          {new Date(msg.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Avatar (left side in RTL = appears on left) */}
      <div className="flex-shrink-0 relative">
        {msg.senderAvatarUrl ? (
          <img
            src={msg.senderAvatarUrl}
            alt=""
            className="w-14 h-14 rounded-full object-cover"
            style={{
              border: vipLevel >= 6 ? `2px solid ${vipColor}` : "2px solid #f0f0f0",
              boxShadow: vipLevel >= 6 ? `0 0 8px ${vipColor}60` : "none",
            }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black text-white"
            style={{
              background: `linear-gradient(135deg, ${vipLevel >= 6 ? vipColor : "#9333ea"}, #c084fc)`,
              border: vipLevel >= 6 ? `2px solid ${vipColor}` : "2px solid #f0f0f0",
            }}
          >
            {msg.senderName?.[0] ?? "؟"}
          </div>
        )}
      </div>
    </div>
  );
}
