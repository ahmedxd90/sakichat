// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "../lib/toast";

export default function AdminWeeklyStarTab() {
  const activeEvent = useQuery(api.weeklyStar.getActiveEvent);
  const eventGifts = useQuery(api.weeklyStar.getEventGifts);
  const adminSetEvent = useMutation(api.weeklyStar.adminSetEvent);
  const leaderboard = useQuery(
    api.weeklyStar.getLeaderboard,
    activeEvent ? { eventId: activeEvent._id } : "skip"
  );

  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [rewardCoins, setRewardCoins] = useState("50000");
  const [loading, setLoading] = useState(false);

  const selectedGift = eventGifts?.find((g) => g._id === selectedGiftId);

  const handleCreate = async () => {
    if (!selectedGiftId || !selectedGift) {
      toast.error("اختر هدية الفعالية أولاً");
      return;
    }
    setLoading(true);
    try {
      await adminSetEvent({
        giftId: selectedGiftId as Id<"customGifts">,
        giftName: selectedGift.name,
        giftImageUrl: selectedGift.resolvedImageUrl ?? undefined,
        giftPrice: selectedGift.price,
        rewardCoins: parseInt(rewardCoins) || 50000,
      });
      toast.success("تم إنشاء الفعالية الأسبوعية ✅");
      setSelectedGiftId(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4" dir="rtl">

      {/* ── ACTIVE EVENT CARD ── */}
      {activeEvent && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: "linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,140,0,0.08))", border: "1px solid rgba(255,215,0,0.35)" }}>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-black text-sm">⭐ الفعالية النشطة حالياً</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            {activeEvent.giftImageUrl ? (
              <img src={activeEvent.giftImageUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-yellow-500/30" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center text-2xl">⭐</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm">{activeEvent.giftName ?? "هدية النجمة"}</p>
              <p className="text-yellow-400 text-xs">🪙 {(activeEvent.giftPrice ?? 0).toLocaleString()} للهدية</p>
              <p className="text-gray-400 text-xs">مكافأة الفائز: 🪙 {(activeEvent.rewardCoins ?? 0).toLocaleString()}</p>
              <p className="text-gray-500 text-[10px]">
                تنتهي: {new Date(activeEvent.weekEnd).toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>

          {/* Leaderboard preview */}
          {leaderboard && leaderboard.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-gray-400 text-xs font-bold">🏆 أعلى المتسابقين</p>
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div key={entry._id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-[10px] font-black w-4 text-center"
                    style={{ color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#6b7280" }}>
                    {i + 1}
                  </span>
                  <p className="flex-1 text-white text-xs font-bold truncate">{entry.userName}</p>
                  <p className="text-yellow-400 text-[10px] font-bold">🪙 {entry.totalCoins.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / UPDATE EVENT ── */}
      <div className="rounded-2xl p-4 space-y-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-white font-black text-sm">
          {activeEvent ? "🔄 تحديث الفعالية" : "➕ إنشاء فعالية جديدة"}
        </p>

        {/* Gift picker */}
        <div>
          <p className="text-gray-400 text-xs font-bold mb-2">اختر هدية الفعالية (فئة events)</p>
          {!eventGifts ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : eventGifts.length === 0 ? (
            <div className="rounded-xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-gray-500 text-xs">لا توجد هدايا في فئة الفعاليات</p>
              <p className="text-gray-600 text-[10px] mt-1">ارفع هدايا بفئة "events" من صفحة رفع الهدايا</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {eventGifts.map((gift) => {
                const isSel = selectedGiftId === gift._id;
                return (
                  <button key={gift._id}
                    onClick={() => setSelectedGiftId(isSel ? null : gift._id)}
                    className="flex flex-col rounded-xl border overflow-hidden transition-all active:scale-95"
                    style={isSel
                      ? { borderColor: "#ffd700", boxShadow: "0 0 12px rgba(255,215,0,0.5)", background: "#2a2a1a" }
                      : { borderColor: "rgba(255,255,255,0.1)", background: "#1e1e2a" }}>
                    <div className="aspect-square relative overflow-hidden bg-black">
                      {gift.resolvedImageUrl ? (
                        <img src={gift.resolvedImageUrl} alt={gift.name}
                          className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">⭐</div>
                      )}
                      {isSel && (
                        <div className="absolute inset-0 bg-yellow-500/25 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 py-1"
                      style={{ background: isSel ? "rgba(255,215,0,0.08)" : "#1e1e2a" }}>
                      <p className="text-white text-[9px] font-bold truncate">{gift.name}</p>
                      <p className="text-yellow-400 text-[9px] font-bold">🪙 {gift.price.toLocaleString()}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reward coins input */}
        <div>
          <label className="text-gray-400 text-xs font-bold mb-2 block">مكافأة الفائز الأول (عملات)</label>
          <input
            type="number"
            value={rewardCoins}
            onChange={(e) => setRewardCoins(e.target.value)}
            placeholder="50000"
            className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
          />
        </div>

        {/* Selected gift preview */}
        {selectedGift && (
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.25)" }}>
            {selectedGift.resolvedImageUrl && (
              <img src={selectedGift.resolvedImageUrl} alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            )}
            <div>
              <p className="text-yellow-400 font-black text-xs">✅ الهدية المختارة: {selectedGift.name}</p>
              <p className="text-gray-400 text-[10px]">السعر: 🪙 {selectedGift.price.toLocaleString()}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={!selectedGiftId || loading}
          className="w-full py-3.5 rounded-2xl text-black font-black text-sm transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#ffd700,#ff9c00)", boxShadow: "0 4px 20px rgba(255,215,0,0.35)" }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              جاري الإنشاء...
            </div>
          ) : activeEvent ? "🔄 تحديث الفعالية الأسبوعية" : "⭐ إنشاء الفعالية الأسبوعية"}
        </button>
      </div>
    </div>
  );
}
