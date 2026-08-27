// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";

interface EmojiPickerSheetProps {
  roomId: string;
  mySeatIndex: number | null;
  myVipLevel?: number;
  isVip?: boolean;
  isSuperAdmin?: boolean;
  onClose: () => void;
  onUploadEmoji: () => void;
}

export default function EmojiPickerSheet({
  roomId,
  mySeatIndex,
  isSuperAdmin,
  onClose,
  onUploadEmoji,
}: EmojiPickerSheetProps) {
  const [emojis, setEmojis] = useState<any[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('room_emojis').select('*').order('created_at', { ascending: false });
      setEmojis(data || []);
    };
    fetchData();
  }, []);

  const sendSeatEmoji = async (args: any) => {};

  // صفحة الإيموجي العادي فقط؛ إيموجيات VIP وVIP5 لا تظهر للمستخدمين.
  const normalEmojis = emojis?.filter((e) => e.emojiType !== "vip" && !e.isVipOnly) ?? [];

  const handleSend = async (emojiId: string) => {
    if (mySeatIndex === null || mySeatIndex === undefined) {
      toast.error("يجب أن تكون على مقعد لإرسال الإيموجي");
      return;
    }
    setSending(emojiId);
    try {
      await sendSeatEmoji({ roomId, seatIndex: mySeatIndex, emojiId });
      // تبقى الصفحة مفتوحة كما في الفيديو لإرسال أكثر من إيموجي متتابع.
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر إرسال الإيموجي");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <div
        className="relative rounded-t-[26px] border-t border-white/15 emoji-sheet-in flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(25,27,42,0.98) 0%, rgba(9,12,23,0.99) 100%)",
          maxHeight: "50vh",
          minHeight: "300px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-11 h-1 rounded-full bg-white/25" />
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">😄</span>
            <div>
              <div className="text-white font-black text-sm">الإيموجي</div>
              <div className="text-white/45 text-[10px]">اختر إيموجيًا ليظهر فوق مقعدك</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={() => { onClose(); onUploadEmoji(); }}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-purple-200 bg-purple-500/15 border border-purple-400/30"
              >
                رفع إيموجي
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 py-2 flex-shrink-0">
          {mySeatIndex === null || mySeatIndex === undefined ? (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <span>⚠️</span><span className="text-orange-300 text-xs">يجب أن تكون على مقعد لإرسال الإيموجي</span>
            </div>
          ) : (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
              <span className="text-purple-200 text-xs">سيظهر الإيموجي فوق مقعدك رقم {mySeatIndex + 1}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {!emojis ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : normalEmojis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2"><span className="text-4xl">😶</span><p className="text-white/50 text-sm">لا توجد إيموجيات عادية بعد</p></div>
          ) : (
            <div className="grid grid-cols-4 gap-3 pb-3">
              {normalEmojis.map((emoji) => (
                <EmojiButton
                  key={emoji.id}
                  emoji={emoji}
                  isSending={sending === emoji.id}
                  disabled={!!sending || mySeatIndex === null || mySeatIndex === undefined}
                  onSend={() => handleSend(emoji.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-8 px-4 py-2.5 border-t border-white/10 bg-black/20 flex-shrink-0">
          <div className="flex flex-col items-center gap-1 text-yellow-300">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/20 border border-yellow-300/40 flex items-center justify-center text-lg">😄</div>
            <span className="text-[10px] font-bold">عادي</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmojiButton({ emoji, isSending, disabled, onSend }: { emoji: any; isSending: boolean; disabled: boolean; onSend: () => void }) {
  const previewUrl = emoji.thumbnailUrl || emoji.imageUrl;
  return (
    <button
      onClick={onSend}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all active:scale-90 relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(168,85,247,0.22)",
        opacity: disabled && !isSending ? 0.55 : 1,
      }}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden relative bg-black/30" style={{ boxShadow: "0 0 12px rgba(168,85,247,0.25)" }}>
        {previewUrl ? <img src={previewUrl} alt={emoji.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">😄</div>}
        {isSending && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" /></div>}
      </div>
      <span className="text-[10px] font-bold text-center leading-tight truncate w-full text-gray-200">{emoji.name}</span>
    </button>
  );
}
