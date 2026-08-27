// @ts-nocheck
import { useEffect, useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { Smile } from "lucide-react";

interface RoomBottomBarProps {
  isCp: boolean;
  isMusic: boolean;
  isAstronomy: boolean;
  isDesert: boolean;
  isOnSeat: boolean;
  isMuted: boolean;
  isChatMuted?: boolean;
  isSpeakerOff: boolean;
  messageText: string;
  inputRef: React.RefObject<HTMLInputElement>;
  roomId: Id<"rooms">;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onShowEmojiPicker: () => void;
  onMessageChange: (text: string) => void;
  onSend: () => void;
  onShowGifts: () => void;
  onShowActivities: () => void;
  onShowMenu: () => void;
  onShowBomb: () => void;
  onShowMessages: () => void;
  unreadMessagesCount?: number;
  mentionText?: string;
  onMentionConsumed?: () => void;
}

export default function RoomBottomBar({
  isCp, isMusic, isAstronomy, isDesert,
  isOnSeat, isMuted, isSpeakerOff, isChatMuted = false,
  messageText, inputRef, roomId,
  onToggleMute, onToggleSpeaker, onShowEmojiPicker,
  onMessageChange, onSend, onShowGifts, onShowActivities, onShowMenu, onShowBomb,
  onShowMessages, unreadMessagesCount = 0,
  mentionText, onMentionConsumed,
}: RoomBottomBarProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [showTextEmoji, setShowTextEmoji] = useState(false);
  const [micBusy, setMicBusy] = useState(false);
  const TEXT_EMOJIS = ["😀","😂","😍","🥰","😎","😭","😡","🤔","👍","👏","❤️","🔥","🎉","✨","😊","🙏","😢","🤣","💪","💯","🙌","😘","😇","🤍"];

  useEffect(() => {
    if (mentionText && inputRef.current) {
      onMessageChange(mentionText);
      inputRef.current.focus();
      onMentionConsumed?.();
      setIsTyping(true);
    }
  }, [mentionText]);

  const handleMuteToggle = async () => {
    if (!isOnSeat || micBusy) return;
    setMicBusy(true);
    try {
      await Promise.resolve(onToggleMute());
    } finally {
      // Allow the voice state update to reach the button before another tap.
      window.setTimeout(() => setMicBusy(false), 350);
    }
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSend();
    setIsTyping(false);
    setShowTextEmoji(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
    if (e.key === "Escape") {
      setIsTyping(false);
      setShowTextEmoji(false);
      onMessageChange("");
      inputRef.current?.blur();
    }
  };

  const openTyping = () => {
    if (isChatMuted) return;
    setIsTyping(true);
    setShowTextEmoji(false);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const closeTyping = () => {
    setIsTyping(false);
    setShowTextEmoji(false);
    onMessageChange("");
    inputRef.current?.blur();
  };



  return (
    <div
      className="flex-shrink-0 px-3 py-2"
      style={{
        background: "rgba(0,0,0,0.05)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      {isTyping ? (
        /* ── وضع الكتابة ── */
        <div className="space-y-2">
          {showTextEmoji && (
            <div className="rounded-2xl p-2.5" style={{ background: "rgba(20,20,30,0.98)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="flex items-center justify-between mb-2 px-1"><span className="text-white/60 text-[10px]">الإيموجي</span><button onClick={() => { setShowTextEmoji(false); setTimeout(() => inputRef.current?.focus(), 30); }} className="text-white/60 text-xs px-2 py-1">⌄</button></div>
              <div className="grid grid-cols-8 gap-1">{TEXT_EMOJIS.map((emoji) => <button key={emoji} onClick={() => { onMessageChange(`${messageText}${emoji}`); setTimeout(() => inputRef.current?.focus(), 20); }} className="h-8 rounded-lg text-lg active:scale-90">{emoji}</button>)}</div>
            </div>
          )}
          <div className="flex items-center gap-2">
          <button
            onClick={closeTyping}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.15)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <button
            onClick={() => { setShowTextEmoji((v) => !v); inputRef.current?.blur(); }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
            style={{ background: showTextEmoji ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.07)", border: showTextEmoji ? "1.5px solid rgba(245,158,11,0.7)" : "1.5px solid rgba(255,255,255,0.15)" }}
            aria-label="فتح الإيموجي"
          ><Smile size={18} strokeWidth={1.8} className="text-white/75" /></button>

          <input
            ref={inputRef}
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={isChatMuted ? "أنت مكتوم في الدردشة" : "اكتب رسالة..."}
            disabled={isChatMuted}
            className="flex-1 h-9 rounded-2xl px-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(168,85,247,0.55)",
              direction: "rtl",
            }}
          />

          <button
            onClick={handleSend}
            disabled={isChatMuted || !messageText.trim()}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
            style={{
              background: messageText.trim()
                ? "linear-gradient(135deg,#f59e0b,#facc15)"
                : "rgba(255,255,255,0.07)",
              border: "1.5px solid rgba(245,158,11,0.55)",
              opacity: messageText.trim() ? 1 : 0.4,
              boxShadow: messageText.trim() ? "0 4px 14px rgba(245,158,11,0.4)" : "none",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
          </div>
        </div>
      ) : (
        /* ── الوضع العادي ── */
        <div className="flex items-center justify-between gap-1.5">

          {/* ── Speaker ── */}
          <button
            onClick={onToggleSpeaker}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
            style={
              isSpeakerOff
                ? { background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.5)", boxShadow: "0 0 12px rgba(239,68,68,0.2)" }
                : { background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.12)" }
            }
          >
            {isSpeakerOff ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 010 7.07" /><path d="M19.07 4.93a10 10 0 010 14.14" />
              </svg>
            )}
          </button>

          {/* ── Mic ── */}
          <button
            onClick={handleMuteToggle}
            disabled={!isOnSeat || micBusy || isChatMuted && false}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0 ${!isOnSeat ? "opacity-30" : ""}`}
            style={
              !isOnSeat
                ? { background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.08)" }
                : isMuted
                  ? { background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.5)", boxShadow: "0 0 12px rgba(239,68,68,0.2)" }
                  : { background: "rgba(34,197,94,0.15)", border: "1.5px solid rgba(34,197,94,0.5)", boxShadow: "0 0 12px rgba(34,197,94,0.25)" }
            }
          >
            {isMuted || !isOnSeat ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={!isOnSeat ? "rgba(255,255,255,0.3)" : "#ef4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              </svg>
            )}
          </button>

          {/* ── Emoji ── */}
          <button
            onClick={onShowEmojiPicker}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.1)" }}
          >
            <Smile size={18} strokeWidth={1.8} className="text-white/75" aria-hidden="true" />
          </button>

          {/* ── زر كتابة رسالة (يمتد) ── */}
          <button
            onClick={openTyping}
            className="flex-1 h-9 rounded-2xl flex items-center gap-2 px-3 active:opacity-75 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.1)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span className={`text-xs ${isChatMuted ? "text-red-300/80" : "text-white/35"}`}>{isChatMuted ? "أنت مكتوم في الدردشة" : "كتابة رسالة..."}</span>
          </button>

          {/* ── Gift ── */}
          <button
            onClick={onShowGifts}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #e11d48, #f43f5e)", boxShadow: "0 4px 14px rgba(225,29,72,0.4)", border: "1.5px solid rgba(255,100,130,0.3)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
            </svg>
          </button>

          {/* ── Messages ── */}
          <button
            onClick={onShowMessages}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0 relative"
            style={{ background: "rgba(168,85,247,0.12)", border: "1.5px solid rgba(168,85,247,0.35)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {unreadMessagesCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1" style={{ background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.8)" }}>
                <span className="text-white text-[9px] font-black leading-none">{unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}</span>
              </div>
            )}
          </button>

          {/* ── Menu + games shortcut above-left ── */}
          <div className="relative flex-shrink-0">
            <button
              onClick={onShowActivities}
              aria-label="فتح الألعاب"
              title="الألعاب"
              className="absolute bottom-[44px] left-0 w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
              style={{
                background: "linear-gradient(145deg,#7c3aed,#ec4899)",
                border: "1.5px solid rgba(255,255,255,0.38)",
                boxShadow: "0 4px 18px rgba(124,58,237,0.46)",
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 8.5h10a4.5 4.5 0 0 1 4.3 5.8l-.8 2.7a2.8 2.8 0 0 1-5.1.7l-1.1-1.7H9.7l-1.1 1.7a2.8 2.8 0 0 1-5.1-.7l-.8-2.7A4.5 4.5 0 0 1 7 8.5Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.4" />
                <circle cx="8" cy="12.6" r="1.1" fill="white" />
                <circle cx="6.9" cy="12.6" r="1.1" fill="white" />
                <circle cx="17.2" cy="11.7" r="1" fill="#fde68a" />
                <circle cx="19.1" cy="13.4" r="1" fill="#fde68a" />
              </svg>
              <span className="absolute -top-2 -right-1 text-[8px] leading-none">✨</span>
            </button>
            <button
              onClick={onShowMenu}
              aria-label="المزيد"
              className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.1)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="5" r="1.5" fill="rgba(255,255,255,0.8)" />
                <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.8)" />
                <circle cx="12" cy="19" r="1.5" fill="rgba(255,255,255,0.8)" />
              </svg>
            </button>
          </div>

          {/* hidden input */}
          <input
            ref={inputRef}
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
          />
        </div>
      )}
    </div>
  );
}
