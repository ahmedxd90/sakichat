// @ts-nocheck
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../lib/toast";
import { useEffect } from "react";
import { Badge3D, RankName } from "./AristocracyBadge3D";

interface GiftModalProps {
  rank: any;
  duration: number;
  price: number;
  onClose: () => void;
  onGift: (args: any) => Promise<any>;
}

export default function AristocracyGiftModal({ rank, duration, price, onClose, onGift }: GiftModalProps) {
  const [sakiId, setSakiId] = useState("");
  const [sending, setSending] = useState(false);
  const [searchProfile, setSearchProfile] = useState<any>(null);

  useEffect(() => {
    if (sakiId.length >= 4) {
      supabase.from('profiles').select('*').eq('saki_id', sakiId).single().then(({ data }) => setSearchProfile(data));
    } else {
      setSearchProfile(null);
    }
  }, [sakiId]);

  const handleGift = async () => {
    if (!searchProfile) return;
    setSending(true);
    try {
      const result = await onGift({ targetUserId: searchProfile.user_id, level: rank.level, durationDays: duration });
      toast.success(`🎁 تم إهداء ${result.targetName} رتبة ${result.rank.nameAr}!`);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-6 space-y-4"
        style={{ background: "linear-gradient(180deg,#18140a,#000)", border: `1px solid ${rank.color}30` }}
      >
        <div className="flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: "#333" }} />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-base">🎁 إهداء رتبة {rank.nameAr}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xl"
            style={{ background: "#1a1a1a" }}
          >×</button>
        </div>

        <div
          className="rounded-2xl p-3 flex items-center gap-3"
          style={{ background: `${rank.color}15`, border: `1px solid ${rank.color}30` }}
        >
          <div style={{ width: 48, height: 48 }}>
            <Badge3D rank={rank} size={48} />
          </div>
          <div>
            <RankName rank={rank} size="base" />
            <p className="text-yellow-400 text-xs font-black mt-0.5">{price.toLocaleString()} 🪙 · {duration} يوم</p>
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-xs mb-1.5 block">معرف المستخدم (ID)</label>
          <input
            value={sakiId}
            onChange={(e) => setSakiId(e.target.value)}
            placeholder="أدخل معرف المستخدم..."
            className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid #333" }}
          />
          {searchProfile && (
            <div
              className="mt-2 rounded-xl p-3 flex items-center gap-3"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {searchProfile.avatar_url
                  ? <img src={searchProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-purple-500/30 flex items-center justify-center text-sm">{searchProfile.name?.[0]}</div>
                }
              </div>
              <span className="text-green-400 font-bold text-sm">{searchProfile.name}</span>
              <span className="text-green-400 text-xs">✓ تم العثور عليه</span>
            </div>
          )}
          {sakiId.length >= 4 && !searchProfile && (
            <p className="text-red-400 text-xs mt-1.5">لم يتم العثور على المستخدم</p>
          )}
        </div>

        <button
          onClick={handleGift}
          disabled={!searchProfile || sending}
          className="w-full py-3.5 rounded-2xl text-black font-black text-sm disabled:opacity-40 active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${rank.color}, ${rank.color}cc)`,
            boxShadow: `0 4px 20px ${rank.glowColor}40`,
          }}
        >
          {sending ? "جارٍ الإرسال..." : `إهداء ${rank.nameAr} 🎁`}
        </button>
      </div>
    </div>
  );
}
