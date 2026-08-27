import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

interface RoomMenuSheetProps {
  roomId: string;
  isOwner: boolean;
  isAdmin: boolean;
  isVip: boolean;
  isEmperor: boolean;
  squirrelVoiceEnabled: boolean;
  onToggleSquirrelVoice: (enabled: boolean) => Promise<void>;
  childVoiceEnabled: boolean;
  onToggleChildVoice: (enabled: boolean) => Promise<void>;
  myCoins: number;
  onClose: () => void;
  onShowMusic: () => void;
  onShowLuckyBag: () => void;
  onShowActivities: () => void;
  onShowPK: () => void;
  onShowEffects?: () => void;
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const LUCKY_NUMBERS = [3, 7, 11, 13, 17, 21, 33, 42, 77, 88, 99, 100];

export default function RoomMenuSheet({ roomId, isOwner, isAdmin, isVip, isEmperor, squirrelVoiceEnabled, onToggleSquirrelVoice, childVoiceEnabled, onToggleChildVoice, myCoins, onClose, onShowMusic, onShowLuckyBag, onShowActivities, onShowPK, onShowEffects }: RoomMenuSheetProps) {
  const [uploading, setUploading] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [luckyResult, setLuckyResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [luckyPicking, setLuckyPicking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار صورة"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("حجم الصورة يجب أن يكون أقل من 10 ميجابايت"); return; }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage.from('chat_images').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('chat_images').getPublicUrl(data.path);
      
      await supabase.from('messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content: publicUrl,
        type: 'image'
      });
      
      toast.success("تم إرسال الصورة 📸");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearChat = async () => {
    try {
      await supabase.from('messages').delete().eq('room_id', roomId);
      toast.success("تم مسح سجل الدردشة 🗑️");
      setShowClearConfirm(false);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRollDice = () => {
    if (rolling) return;
    setRolling(true);
    setDiceResult(null);
    setLuckyResult(null);
    let count = 0;
    const interval = setInterval(async () => {
      setDiceResult(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        const final = Math.floor(Math.random() * 6) + 1;
        setDiceResult(final);
        setRolling(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          supabase.from('messages').insert({
            room_id: roomId,
            sender_id: user.id,
            content: `🎲 رمى النرد وحصل على: ${DICE_FACES[final - 1]} (${final})`,
            type: 'text'
          }).then();
        }
      }
    }, 80);
  };

  const handleLuckyNumber = () => {
    if (luckyPicking) return;
    setLuckyPicking(true);
    setDiceResult(null);
    setLuckyResult(null);
    let count = 0;
    const interval = setInterval(async () => {
      setLuckyResult(LUCKY_NUMBERS[Math.floor(Math.random() * LUCKY_NUMBERS.length)]);
      count++;
      if (count >= 12) {
        clearInterval(interval);
        const final = LUCKY_NUMBERS[Math.floor(Math.random() * LUCKY_NUMBERS.length)];
        setLuckyResult(final);
        setLuckyPicking(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          supabase.from('messages').insert({
            room_id: roomId,
            sender_id: user.id,
            content: `🍀 رقم الحظ هو: ${final} ✨`,
            type: 'text'
          }).then();
        }
      }
    }, 80);
  };

  return (
    <>
      {/* Main Sheet */}
      <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative bg-[#1a1a2e] rounded-t-3xl border-t border-white/10 animate-slide-up-sheet px-5 pt-4 pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center mb-5">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          <div className="grid grid-cols-5 gap-2">
            {/* 1. Music - owner/admin only */}
            <button
              onClick={() => {
                if (!isOwner && !isAdmin) { toast.error("فقط مالك الغرفة والمشرف يمكنهم تشغيل الموسيقى 🎵"); return; }
                onClose(); onShowMusic();
              }}
              className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
              style={{ opacity: (isOwner || isAdmin) ? 1 : 0.4 }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(168,85,247,0.15)", border: "1.5px solid rgba(168,85,247,0.4)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.8">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <span className="text-[10px] font-medium text-purple-300">موسيقى</span>
            </button>

            {/* Squirrel voice — Emperor only */}
            <button
              onClick={async () => {
                if (!isEmperor) { toast.error("تأثير صوت السنجاب متاح لرتبة الإمبراطور فقط"); return; }
                try { await onToggleSquirrelVoice(!squirrelVoiceEnabled); toast.success(!squirrelVoiceEnabled ? "تم تفعيل صوت السنجاب" : "تم إيقاف صوت السنجاب"); }
                catch (e: any) { toast.error(e?.message || "تعذر تغيير الصوت"); }
              }}
              className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
              style={{ opacity: isEmperor ? 1 : 0.35 }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: squirrelVoiceEnabled ? "rgba(251,146,60,0.25)" : "rgba(251,146,60,0.12)", border: `1.5px solid ${squirrelVoiceEnabled ? "rgba(251,146,60,0.8)" : "rgba(251,146,60,0.35)"}`, boxShadow: squirrelVoiceEnabled ? "0 0 16px rgba(251,146,60,0.45)" : "none" }}>
                <span className="text-2xl leading-none select-none">🐿️</span>
              </div>
              <span className="text-[10px] font-bold" style={{ color: isEmperor ? "#fb923c" : "#6b7280" }}>صوت سنجاب</span>
            </button>

            {/* Emperor child voice */}
            <button
              onClick={async () => {
                if (!isEmperor) { toast.error("تأثير صوت الطفل متاح لرتبة الإمبراطور فقط"); return; }
                try { await onToggleChildVoice(!childVoiceEnabled); toast.success(!childVoiceEnabled ? "تم تفعيل صوت طفل الإمبراطور" : "تم إيقاف صوت الطفل"); }
                catch (e: any) { toast.error(e?.message || "تعذر تغيير الصوت"); }
              }}
              className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
              style={{ opacity: isEmperor ? 1 : 0.35 }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: childVoiceEnabled ? "rgba(96,165,250,0.25)" : "rgba(96,165,250,0.12)", border: `1.5px solid ${childVoiceEnabled ? "rgba(96,165,250,0.85)" : "rgba(96,165,250,0.35)"}`, boxShadow: childVoiceEnabled ? "0 0 16px rgba(96,165,250,0.45)" : "none" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={isEmperor ? "#60a5fa" : "#6b7280"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11a3 3 0 1 0 6 0"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/><circle cx="8" cy="5" r="1"/><circle cx="16" cy="5" r="1"/></svg>
              </div>
              <span className="text-[10px] font-bold" style={{ color: isEmperor ? "#60a5fa" : "#6b7280" }}>صوت طفل</span>
            </button>

            {/* 2. Send Image */}
            <button
              onClick={() => { if (!isVip) { toast.error("إرسال الصور متاح لأعضاء PRO فقط ✦"); return; } fileInputRef.current?.click(); }}
              disabled={uploading}
              className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
              style={{ opacity: isVip ? 1 : 0.45 }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: isVip ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)", border: `1.5px solid ${isVip ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.1)"}` }}>
                {uploading
                  ? <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isVip ? "#fbbf24" : "#6b7280"} strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                }
              </div>
              <span className="text-[10px] font-medium" style={{ color: isVip ? "#fbbf24" : "#6b7280" }}>صورة</span>
            </button>

            {/* 3. Clear Chat */}
            <button
              onClick={() => { if (!isOwner && !isAdmin) { toast.error("متاح للمالك والمشرفين فقط"); return; } setShowClearConfirm(true); }}
              className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
              style={{ opacity: (isOwner || isAdmin) ? 1 : 0.35 }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.35)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </div>
              <span className="text-[10px] font-medium text-red-400">مسح</span>
            </button>

            {/* 4. Dice */}
            <button onClick={handleRollDice} disabled={rolling} className="flex flex-col items-center gap-2 active:scale-90 transition-transform">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: rolling ? "rgba(167,139,250,0.25)" : "rgba(167,139,250,0.12)", border: "1.5px solid rgba(167,139,250,0.4)", boxShadow: rolling ? "0 0 16px rgba(167,139,250,0.4)" : "none" }}>
                <span className="text-2xl leading-none select-none" style={{ filter: rolling ? "drop-shadow(0 0 8px #a78bfa)" : "none", animation: rolling ? "spin 0.15s linear infinite" : "none" }}>
                  {diceResult ? DICE_FACES[diceResult - 1] : "🎲"}
                </span>
              </div>
              <span className="text-[10px] font-medium text-purple-300">نرد</span>
            </button>

            {/* 5. Lucky Number */}
            <button onClick={handleLuckyNumber} disabled={luckyPicking} className="flex flex-col items-center gap-2 active:scale-90 transition-transform">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: luckyPicking ? "rgba(52,211,153,0.25)" : "rgba(52,211,153,0.12)", border: "1.5px solid rgba(52,211,153,0.4)", boxShadow: luckyPicking ? "0 0 16px rgba(52,211,153,0.4)" : "none" }}>
                {luckyResult && !luckyPicking
                  ? <span className="text-green-300 font-black text-lg leading-none">{luckyResult}</span>
                  : <span className="text-2xl leading-none select-none" style={{ filter: luckyPicking ? "drop-shadow(0 0 8px #34d399)" : "none" }}>
                      {luckyPicking && luckyResult ? luckyResult : "🍀"}
                    </span>
                }
              </div>
              <span className="text-[10px] font-medium text-green-400">حظ</span>
            </button>

            {/* 6. Lucky Bag ← NEW */}
            <button
              onClick={() => { onClose(); onShowLuckyBag(); }}
              className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,rgba(251,191,36,0.25),rgba(245,158,11,0.15))",
                  border: "1.5px solid rgba(251,191,36,0.5)",
                  boxShadow: "0 0 12px rgba(251,191,36,0.3)",
                }}>
                {/* Bag SVG */}
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="12" width="24" height="17" rx="4" fill="#fbbf24" opacity="0.9"/>
                  <rect x="4" y="12" width="24" height="17" rx="4" fill="url(#bagGrad)"/>
                  <path d="M11 12 Q11 6 16 6 Q21 6 21 12" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <circle cx="16" cy="20" r="3" fill="#92400e" opacity="0.7"/>
                  <path d="M14 20 Q16 22 18 20" stroke="#fde68a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="bagGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.2)"/>
                      <stop offset="100%" stopColor="rgba(0,0,0,0.15)"/>
                    </linearGradient>
                  </defs>
                </svg>
                {/* Sparkle */}
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-300 animate-ping opacity-70" />
              </div>
              <span className="text-[10px] font-bold text-yellow-400">حقيبة</span>
            </button>

            {/* Effects */}
            <button onClick={() => { onClose(); onShowEffects?.(); }} className="flex flex-col items-center gap-2 active:scale-90 transition-transform">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(0,191,165,0.25),rgba(0,137,123,0.15))", border: "1.5px solid rgba(0,191,165,0.5)", boxShadow: "0 0 12px rgba(0,191,165,0.3)" }}>
                <span className="text-2xl leading-none select-none">✨</span>
              </div>
              <span className="text-[10px] font-bold" style={{ color: "#00bfa5" }}>تأثيرات</span>
            </button>
          </div>



          {(diceResult !== null || luckyResult !== null) && (
            <div className="mt-4 rounded-2xl py-3 px-4 text-center"
              style={{ background: diceResult !== null ? "rgba(167,139,250,0.1)" : "rgba(52,211,153,0.1)", border: `1px solid ${diceResult !== null ? "rgba(167,139,250,0.25)" : "rgba(52,211,153,0.25)"}` }}>
              {diceResult !== null && (
                <p className="text-purple-300 font-black text-lg">{DICE_FACES[diceResult - 1]}{" "}<span className="text-gray-400 font-normal text-sm">النتيجة:</span>{" "}<span className="text-white">{diceResult}</span></p>
              )}
              {luckyResult !== null && diceResult === null && (
                <p className="text-green-300 font-black text-lg">🍀{" "}<span className="text-gray-400 font-normal text-sm">رقم الحظ:</span>{" "}<span className="text-white text-2xl">{luckyResult}</span></p>
              )}
            </div>
          )}

          <button onClick={onClose} className="w-full py-3 mt-4 rounded-2xl bg-white/5 text-gray-400 font-medium text-sm">إغلاق</button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        </div>
      </div>

      {/* Clear Chat Confirm Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6" onClick={() => setShowClearConfirm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-3xl p-6 animate-scale-in"
            style={{ background: "#1a1a2e", border: "1px solid rgba(239,68,68,0.3)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-white font-black text-lg mb-1">مسح الدردشة؟</h3>
              <p className="text-gray-400 text-sm">سيتم حذف جميع رسائل الغرفة. لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold text-sm active:scale-95 transition-transform">
                لا، إلغاء
              </button>
              <button onClick={handleClearChat}
                className="flex-1 py-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-sm active:scale-95 transition-transform">
                نعم، امسح
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
