// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "../../lib/toast";
import { VipFrame } from "../VipBadge";
import { GIFT_QUANTITIES } from "../../types/room";
import { formatNumber } from "../../lib/formatNumber";
import SVGAPlayer, { isSvgaUrl } from "../SVGAPlayer";

// فئات الهدايا الثابتة في غرفة الدردشة: ترتيبها يطابق تجربة صندوق الهدايا المطلوبة.
const TOP_GIFT_TABS = [
  { id: "general", label: "العامة" },
  { id: "luck", label: "الحظ" },
  { id: "celebrities", label: "المشاهير" },
  { id: "events", label: "الفعاليات" },
  { id: "cp", label: "CP" },
  { id: "countries", label: "الدول" },
  { id: "astrology", label: "الأبراج" },
  { id: "comedy", label: "فكاهة" },
];

const SHEET_CATEGORIES = TOP_GIFT_TABS;

interface RoomGiftsSheetProps {
  roomId: any;
  isCp: boolean;
  isSuperAdmin: boolean;
  coins: number;
  seatedMembers: any[];
  myProfile: any;
  customGifts: any[];
  giftsCategory: string;
  giftTarget: any;
  giftTargets: any[];
  selectedCustomGift: any;
  giftQuantity: number;
  showQuantityMenu: boolean;
  activeWeeklyEvent: any | null;
  onClose: () => void;
  onCategoryChange: (cat: string) => void;
  onSelectTarget: (member: any) => void;
  onSelectAll: (members: any[]) => void;
  onSelectGift: (gift: any) => void;
  onSendGift: () => void;
  onQuantityChange: (qty: number) => void;
  onToggleQuantityMenu: () => void;
  onUploadGift: () => void;
}

/** مكوّن صغير لعرض صورة الهدية في الشبكة — يدعم SVGA */
function GiftThumbnail({ gift, size = 65 }: { gift: any; size?: number }) {
  const displayUrl = gift.thumbnailUrl || gift.videoUrl;
  const isSvga = isSvgaUrl(gift.videoUrl) && !gift.thumbnailUrl;

  if (isSvga) {
    return (
      <SVGAPlayer
        src={gift.videoUrl}
        style={{ width: size, height: size, borderRadius: 10 }}
        loop={true}
      />
    );
  }

  if (displayUrl) {
    if (gift.thumbnailUrl || (gift.mediaType ?? "video") !== "video") {
      return (
        <img
          src={displayUrl}
          alt={gift.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ borderRadius: 10 }}
        />
      );
    }
    return (
      <video
        src={gift.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        preload="metadata"
        style={{ borderRadius: 10 }}
      />
    );
  }

  return <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>;
}

export default function RoomGiftsSheet({
  roomId, isCp, isSuperAdmin, coins, seatedMembers, myProfile, customGifts,
  giftsCategory, giftTarget, giftTargets, selectedCustomGift, giftQuantity, showQuantityMenu,
  activeWeeklyEvent,
  onClose, onCategoryChange, onSelectTarget, onSelectAll, onSelectGift, onSendGift,
  onQuantityChange, onToggleQuantityMenu, onUploadGift,
}: RoomGiftsSheetProps) {
  const [sendLoading, setSendLoading] = useState(false);
  const [floatingBtnVisible, setFloatingBtnVisible] = useState(false);
  const [floatingBtnTimer, setFloatingBtnTimer] = useState(10);
  const timerRef = useRef<any>(null);
  const giftInventory = useQuery(api.giftInventory.getMyGiftInventory);
  const sendGiftFromInventory = useMutation(api.giftInventory.sendGiftFromInventory);
  const [selectedInventoryId, setSelectedInventoryId] = useState<any>(null);
  const bagMode = false;
  const countdownRef = useRef<any>(null);

  const othersSeated = seatedMembers.filter((m) => m.profile?.userId !== myProfile?.userId);
  const allSeated = seatedMembers;
  const isTargetSelected = (m: any) => giftTargets.some((t) => t._id === m._id);
  const allSelected = othersSeated.length > 0 && othersSeated.every((m) => isTargetSelected(m));
  const activeTargets = giftTargets.length > 0 ? giftTargets : (giftTarget ? [giftTarget] : []);
  const totalCost = selectedCustomGift ? selectedCustomGift.price * giftQuantity * Math.max(1, activeTargets.length) : 0;
  const displayGifts = customGifts;

  useEffect(() => {
    if (selectedCustomGift) {
      setFloatingBtnVisible(true);
      setFloatingBtnTimer(10);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setFloatingBtnTimer((prev) => {
          if (prev <= 1) { clearInterval(countdownRef.current); setFloatingBtnVisible(false); return 0; }
          return prev - 1;
        });
      }, 1000);
      timerRef.current = setTimeout(() => setFloatingBtnVisible(false), 10000);
    } else {
      setFloatingBtnVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [selectedCustomGift?._id]);

  const handleSend = async () => {
    setSendLoading(true);
    setFloatingBtnTimer(10);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setFloatingBtnTimer((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current); setFloatingBtnVisible(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    timerRef.current = setTimeout(() => setFloatingBtnVisible(false), 10000);
    try { await onSendGift(); } finally { setSendLoading(false); }
  };

  const isLuckTab = false;
  const isComedyTab = false;
  const handleSendInventory = async () => {
    const target = activeTargets[0];
    if (!selectedInventoryId || !target) { toast.error("حدد مستخدمًا وهدية من الحقيبة أولًا"); return; }
    try {
      setSendLoading(true);
      await sendGiftFromInventory({ inventoryId: selectedInventoryId, receiverId: target.profile?.userId ?? target.userId ?? target._id, roomId, quantity: Math.min(giftQuantity, giftInventory?.find((i: any) => i._id === selectedInventoryId)?.quantity ?? 1) });
      toast.success("تم إرسال الهدية من الحقيبة مجانًا");
      setSelectedInventoryId(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setSendLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative flex flex-col animate-slide-up-sheet"
        style={{
          background: "linear-gradient(180deg, #17140e 0%, #111111 34%, #111111 100%)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(251,191,36,.18)",
          boxShadow: "0 -18px 45px rgba(0,0,0,0.82)",
          maxHeight: "92vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* ── 1. RECIPIENTS ROW ── */}
        <div
          className="flex items-center gap-3 px-4 pb-3 flex-shrink-0"
          style={{ borderBottom: "0" }}
        >
          {/* All selector */}
          {othersSeated.length > 1 && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                onClick={() => allSelected ? onSelectAll([]) : onSelectAll(othersSeated)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all active:scale-90"
                style={{
                  background: allSelected ? "#00bfa5" : "#ffcc00",
                  border: "2px solid #fff",
                  color: "#000",
                  boxShadow: allSelected ? "0 0 12px rgba(0,191,165,0.5)" : "0 0 12px rgba(255,204,0,0.4)",
                }}
              >
                {allSelected ? "✓" : "👥"}
              </button>
              <span className="text-white text-[10px] font-medium">كل</span>
            </div>
          )}

          {/* Seated avatars */}
          <div className="flex gap-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {allSeated.map((m) => {
              const isMe = m.profile?.userId === myProfile?.userId;
              const selected = isTargetSelected(m);
              return (
                <button
                  key={m._id}
                  onClick={() => onSelectTarget(m)}
                  className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-90 transition-transform"
                >
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden"
                      style={{
                        border: selected ? "2px solid #00bfa5" : isMe ? "2px solid #ffcc00" : "1.5px solid #444",
                        boxShadow: selected ? "0 0 8px rgba(0,191,165,0.5)" : "none",
                      }}
                    >
                      {m.profile?.avatarUrl
                        ? <img src={m.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                            {m.profile?.name?.[0]}
                          </div>
                      }
                    </div>
                    {selected && (
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "#00bfa5", border: "1.5px solid #1a1a1a" }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                    {isMe && (
                      <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "#ffcc00", border: "1.5px solid #1a1a1a" }}>
                        <span className="text-[6px] text-black font-black">أنا</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] truncate max-w-[40px]"
                    style={{ color: selected ? "#00bfa5" : isMe ? "#ffcc00" : "#a0a0a0" }}>
                    {isMe ? "أنا" : m.profile?.name}
                  </span>
                </button>
              );
            })}
            {allSeated.length === 0 && (
              <p className="text-[11px] py-1" style={{ color: "#555" }}>لا يوجد أحد على المقاعد</p>
            )}
          </div>
        </div>

        {/* تبويب الفعاليات فقط حسب إعدادات الغرفة الحالية. */}
        <div className="flex items-center gap-1 px-4 pt-1 pb-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: "none", borderBottom: "0" }}>
          {TOP_GIFT_TABS.map((tab) => {
            const active = tab.id === giftsCategory;
            return <button key={tab.id} onClick={() => onCategoryChange("events")} className="relative shrink-0 px-3 py-2 text-[12px] font-black transition-colors active:scale-95" style={{ color: active ? "#fbbf24" : "#8b8b8b" }}>
              {tab.label}{active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber-400" />}
            </button>;
          })}
        </div>

        {/* ── 2. CATEGORY TABS ── */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: "none" }}>
          {SHEET_CATEGORIES.map((cat) => {
            const isActive = giftsCategory === cat.id;
            const isLuck = cat.id === "luck";
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className="flex-shrink-0 flex items-center gap-1 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all active:scale-95"
                style={
                  isActive
                    ? {
                        background: isLuck ? "#22c55e" : "#00bfa5",
                        color: "#fff",
                        fontWeight: "bold",
                        boxShadow: isLuck ? "0 2px 10px rgba(34,197,94,0.4)" : "0 2px 10px rgba(0,191,165,0.4)",
                      }
                    : {
                        background: "#2c2c2c",
                        color: "#a0a0a0",
                      }
                }
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
          {isSuperAdmin && (
            <button
              onClick={onUploadGift}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium"
              style={{ background: "#2c2c2c", color: "#a855f7" }}
            >
              <span>+</span><span>رفع</span>
            </button>
          )}
        </div>

        {/* Luck banner */}
        {isLuckTab && (
          <div className="mx-4 mb-2 flex-shrink-0 rounded-xl px-3 py-2 flex items-center gap-2"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <span className="text-lg">🍀</span>
            <div>
              <p className="text-[10px] font-bold text-green-400">هدايا الحظ</p>
              <p className="text-[10px]" style={{ color: "rgba(34,197,94,0.7)" }}>اختر هدية وسيظهر زر الإرسال السريع!</p>
            </div>
          </div>
        )}

        {/* ── 3. GIFTS GRID ── */}
        <div
          className="overflow-y-auto px-4 flex-1"
          style={{ minHeight: 0, maxHeight: 260, scrollbarWidth: "none" }}
        >
          {bagMode ? (
            <div className="grid grid-cols-4 pb-3 pt-1" style={{ gap: "15px 10px" }}>
              {!giftInventory || giftInventory.length === 0 ? <div className="col-span-4 flex flex-col items-center justify-center py-8 gap-2"><span className="text-4xl">🎒</span><p className="text-[12px] text-gray-400">الحقيبة فارغة</p></div> : giftInventory.map((inv: any) => {
                const selected = selectedInventoryId === inv._id;
                const image = inv.gift?.thumbnailUrl || inv.gift?.imageUrl || inv.giftImageUrl;
                return <button key={inv._id} onClick={() => setSelectedInventoryId(selected ? null : inv._id)} className="flex flex-col items-center relative active:scale-95 transition-transform">
                  <div className="relative w-[65px] h-[65px] rounded-xl overflow-hidden mb-1.5" style={{ background: selected ? "rgba(0,191,165,.2)" : "#262626", border: selected ? "2px solid #00bfa5" : "2px solid transparent" }}>{image ? <img src={image} alt={inv.gift?.name || inv.giftName} className="w-full h-full object-contain" /> : <span className="w-full h-full flex items-center justify-center text-2xl">🎁</span>}{selected && <span className="absolute inset-0 flex items-center justify-center bg-teal-500/30 text-white text-2xl">✓</span>}</div>
                  <span className="text-[10px] text-white truncate w-full">{inv.gift?.name || inv.giftName || "هدية"}</span><span className="text-[10px] text-teal-300">×{inv.quantity}</span>
                </button>;
              })}
            </div>
          ) : (!displayGifts || displayGifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-4xl">{isLuckTab ? "🍀" : "🎁"}</span>
              <p className="text-[12px]" style={{ color: "#555" }}>لا توجد هدايا في هذه الفئة</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 pb-3 pt-1" style={{ gap: "15px 10px" }}>
              {displayGifts.map((gift) => {
                const isSel = selectedCustomGift?._id === gift._id;
                const isLuck = gift.category === "luck";
                const isEvent = gift.category === "events";
                const isComedy = gift.category === "comedy";
                const isSvga = isSvgaUrl(gift.videoUrl) && !gift.thumbnailUrl;
                return (
                  <button
                    key={gift._id}
                    onClick={() => onSelectGift(isSel ? null : gift)}
                    className="flex flex-col items-center relative active:scale-95 transition-transform"
                  >
                    {/* Hot / event tag */}
                    {(isEvent || isComedy) && (
                      <div
                        className="absolute top-0 right-1 text-white text-[8px] px-1 py-0.5 rounded z-10"
                        style={{ background: "linear-gradient(to right,#ff416c,#ff4b2b)", lineHeight: 1.2 }}
                      >
                        {isEvent ? "حدث" : "😂"}
                      </div>
                    )}
                    {isLuck && (
                      <div
                        className="absolute top-0 right-1 text-white text-[8px] px-1 py-0.5 rounded z-10"
                        style={{ background: "linear-gradient(to right,#22c55e,#16a34a)", lineHeight: 1.2 }}
                      >
                        🍀
                      </div>
                    )}
                    {/* SVGA badge */}
                    {isSvga && (
                      <div
                        className="absolute top-0 left-1 text-white text-[7px] px-1 py-0.5 rounded z-10 font-black"
                        style={{ background: "linear-gradient(to right,#ec4899,#a855f7)", lineHeight: 1.2 }}
                      >
                        ✨
                      </div>
                    )}

                    {/* Image wrapper */}
                    <div
                      className="relative overflow-hidden mb-1.5"
                      style={{
                        width: 65,
                        height: 65,
                        background: isSel
                          ? (isLuck ? "rgba(34,197,94,0.15)" : "rgba(0,191,165,0.15)")
                          : "#262626",
                        borderRadius: 12,
                        border: isSel
                          ? `2px solid ${isLuck ? "#22c55e" : "#00bfa5"}`
                          : "2px solid transparent",
                        boxShadow: isSel
                          ? (isLuck ? "0 0 12px rgba(34,197,94,0.5)" : "0 0 12px rgba(0,191,165,0.5)")
                          : "none",
                      }}
                    >
                      {isSvga ? (
                        // SVGA: render directly without absolute positioning
                        <SVGAPlayer
                          src={gift.videoUrl}
                          style={{ width: 65, height: 65, borderRadius: 10 }}
                          loop={true}
                        />
                      ) : gift.thumbnailUrl || gift.videoUrl ? (
                        gift.thumbnailUrl || (gift.mediaType ?? "video") !== "video"
                          ? <img src={gift.thumbnailUrl || gift.videoUrl} alt={gift.name} className="absolute inset-0 w-full h-full object-cover" style={{ borderRadius: 10 }} />
                          : <video src={gift.videoUrl} className="absolute inset-0 w-full h-full object-cover" muted playsInline preload="metadata" style={{ borderRadius: 10 }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
                      )}
                      {isSel && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-[10px]"
                          style={{ background: isLuck ? "rgba(34,197,94,0.25)" : "rgba(0,191,165,0.25)" }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: isLuck ? "#22c55e" : "#00bfa5" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        </div>
                      )}
                      {gift.showFullScreen && (
                        <div className="absolute bottom-0.5 left-0.5 text-[6px] rounded-full px-0.5"
                          style={{ background: "rgba(168,85,247,0.9)", color: "#fff", lineHeight: "14px" }}>📺</div>
                      )}
                    </div>

                    {/* Name */}
                    <span
                      className="text-[10px] text-center truncate w-full leading-tight"
                      style={{ color: isSel ? "#fff" : "#e5e7eb", maxWidth: 65 }}
                    >
                      {gift.name}
                    </span>

                    {/* Price */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span style={{ color: "#ffcc00", fontSize: 9 }}>★</span>
                      <span className="text-[10px]" style={{ color: "#888" }}>
                        {gift.price >= 1_000_000_000 ? `${(gift.price / 1e9).toFixed(1)}B`
                          : gift.price >= 1_000_000 ? `${(gift.price / 1e6).toFixed(1)}M`
                          : gift.price >= 1_000 ? `${(gift.price / 1e3).toFixed(1)}k`
                          : gift.price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── 4. FOOTER CONTROLS ── */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            background: "#121212",
            borderTop: "0",
          }}
        >
          {/* Recipient selector, kept at the bottom like the reference flow. */}
          <div className="min-w-0 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: activeTargets.length ? "#fbbf24" : "#2c2c2c", color: "#111" }}>👤</div>
            <div className="min-w-0">
              <p className="text-[9px] text-gray-500">إرسال إلى</p>
              <p className="max-w-[92px] truncate text-[11px] font-bold" style={{ color: activeTargets.length ? "#fbbf24" : "#aaa" }}>{activeTargets.length === 0 ? "حدد مستخدمًا" : activeTargets.length === 1 ? (activeTargets[0]?.profile?.name ?? activeTargets[0]?.name ?? "مستخدم") : `${activeTargets.length} مستخدمين`}</p>
            </div>
          </div>

          {/* Recharge / balance */}
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: "#00bfa5" }}>الشحن</span>
            <span className="text-[13px] font-bold" style={{ color: "#ffcc00" }}>{formatNumber(coins)}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00bfa5" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {selectedCustomGift && activeTargets.length > 0 && (
              <span className="text-[10px] ml-1" style={{ color: "#555" }}>
                · <span style={{ color: "#ffcc00" }}>{formatNumber(totalCost)}</span>🪙
              </span>
            )}
          </div>

          {/* Quantity + Send */}
          <div className="flex items-center rounded-full overflow-visible relative" style={{ background: "#00bfa5" }}>
            {/* Quantity picker */}
            <button
              onClick={onToggleQuantityMenu}
              className="flex items-center gap-1 px-3 py-2 font-bold text-white text-[13px]"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.25)" }}
            >
              <span>{giftQuantity}</span>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d={showQuantityMenu ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>

            {/* Quantity dropdown */}
            {showQuantityMenu && (
              <div
                className="absolute bottom-full mb-2 right-0 rounded-xl p-1.5 flex flex-col gap-0.5 shadow-2xl z-20"
                style={{ background: "#2c2c2c", border: "1px solid rgba(255,255,255,0.1)", minWidth: 52 }}
              >
                {GIFT_QUANTITIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => onQuantityChange(q)}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                    style={giftQuantity === q
                      ? { background: "#00bfa5", color: "#fff" }
                      : { background: "rgba(255,255,255,0.05)", color: "#e5e7eb" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Send button */}
            <button
              onClick={bagMode ? handleSendInventory : handleSend}
              disabled={bagMode ? (!selectedInventoryId || activeTargets.length === 0 || sendLoading) : (!selectedCustomGift || activeTargets.length === 0 || sendLoading)}
              className="px-5 py-2 font-bold text-white text-[14px] disabled:opacity-50 active:opacity-80 transition-opacity"
            >
              {sendLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : bagMode ? "إرسال من الحقيبة" : "إرسال"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
