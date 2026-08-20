// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "../lib/toast";
import SVGAPlayer, { isSvgaUrl } from "../components/SVGAPlayer";
import { getAristocracyConfig } from "../components/AristocracyBadge";

type BagTab = "frame" | "entry" | "bubble" | "seat_skin";

const PRIMARY = "#00d4c5";
const SEAT_PRIMARY = "#8b5cf6";
const TAB_CONFIG: { id: BagTab; label: string; icon: string }[] = [
  { id: "entry", label: "دخولية", icon: "entry" },
  { id: "frame", label: "إطار", icon: "frame" },
  { id: "bubble", label: "فقاعة", icon: "bubble" },
  { id: "seat_skin", label: "المقاعد", icon: "seat" },
];

function BagTypeIcon({ type, size = 18, color = "#00a99d" }: { type: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "entry") return <svg {...p}><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 11h5M10 15h5" /></svg>;
  if (type === "frame") return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="12" cy="12" r="4" /><path d="M8 4v3M16 4v3M4 8h3M17 8h3M4 16h3M17 16h3M8 20v-3M16 20v-3" /></svg>;
  if (type === "bag") return <svg {...p}><path d="M5 8h14l1 12H4z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /><path d="M9 12h6" /></svg>;
  if (type === "seat") return <svg {...p}><path d="M5 5h14v8H5z" /><path d="M7 13v5M17 13v5M4 18h16" /></svg>;
  return <svg {...p}><path d="M4 6h16M4 12h11M4 18h7" /><circle cx="18" cy="17" r="3" /><path d="M18 15.5v1.7l1.2.8" /></svg>;
}

interface MyBagPageProps {
  onBack: () => void;
}

export default function MyBagPage({ onBack }: MyBagPageProps) {
  const [activeTab, setActiveTab] = useState<BagTab>("seat_skin");
  const inventory = useQuery(
    api.store.getMyInventory,
    activeTab !== "gifts" && activeTab !== "seat_skin" ? { type: activeTab as any } : "skip"
  );
  const seatSkins = useQuery(
    api.seatSkins.getMySeatSkins,
    activeTab === "seat_skin" ? {} : "skip"
  );
  const giftInventory = useQuery(
    api.giftInventory.getMyGiftInventory,
    activeTab === "gifts" ? {} : "skip"
  );
  const setActiveItem = useMutation(api.store.setActiveUserItem);
  const setActiveSpecialFrame = useMutation(api.store.setActiveSpecialFrame);
  const setActiveSpecialEntry = useMutation(api.store.setActiveSpecialEntry);
  const setActiveAristocracyAsset = useMutation(api.store.setActiveAristocracyAsset);
  const setActiveSeatSkin = useMutation(api.seatSkins.setActiveSeatSkin);
  const respondToCp = useMutation(api.store.respondToCpRing);
  const sendGift = useMutation(api.giftInventory.sendGiftFromInventoryBySakiId);
  const [loading, setLoading] = useState<string | null>(null);
  const [sendingGift, setSendingGift] = useState<any>(null);

  const myProfile = useQuery(api.profiles.getMyProfile);
  const isVip8Plus = Boolean(myProfile?.isSuperAdmin || (myProfile?.isVip && (myProfile?.vipLevel ?? 0) >= 8));

  const handleToggle = async (ui: any) => {
    const isSpecial = ui.isVipAutoAdded || ui.isSuperAdminAutoAdded;
    const isAristocracy = ui.isAristocracyAutoAdded;
    const isSeatSkinItem = ui.type === "seat_skin";
    setLoading(ui._id);
    try {
      if (isSeatSkinItem) {
        await setActiveSeatSkin({
          storeItemId: !ui.isActive ? ui.storeItemId : undefined,
          active: !ui.isActive,
        });
        toast.success(!ui.isActive ? "تم تفعيل ستايل المقعد ✅" : "تم إلغاء التفعيل");
      } else if (isAristocracy) {
        await setActiveAristocracyAsset({
          assetType: ui.type as "frame" | "entry" | "bubble",
          active: !ui.isActive,
          aristocracyLevel: ui.aristocracyLevel,
        });
        toast.success(!ui.isActive ? "تم تفعيل أصل الأرستقراطية ✅" : "تم إلغاء التفعيل");
      } else if (isSpecial) {
        if (ui.type === "entry") {
          await setActiveSpecialEntry({ storeItemId: ui.storeItemId, active: !ui.isActive });
          toast.success(!ui.isActive ? "تم تفعيل الدخولية ✅" : "تم إلغاء التفعيل");
        } else {
          await setActiveSpecialFrame({ storeItemId: ui.storeItemId, active: !ui.isActive });
          toast.success(!ui.isActive ? "تم تفعيل الإطار ✅" : "تم إلغاء التفعيل");
        }
      } else {
        await setActiveItem({ userItemId: ui._id as Id<"userStoreItems">, active: !ui.isActive });
        toast.success(!ui.isActive ? "تم التفعيل ✅" : "تم الإلغاء");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const handleCpRespond = async (userItemId: Id<"userStoreItems">, accept: boolean) => {
    setLoading(userItemId);
    try {
      await respondToCp({ userItemId, accept });
      toast.success(accept ? "قبلت الخاتم 💍" : "رفضت الخاتم");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const now = Date.now();

  // Determine which data to show
  const currentInventory = activeTab === "seat_skin" ? seatSkins : inventory;

  return (
    <div className="flex flex-col h-full" style={{ background: "#ffffff" }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)", borderBottom: "1px solid #eef2f7" }}>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button onClick={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ background: "#f2f7fc", border: "1px solid #e8eef5" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <BagTypeIcon type="bag" size={20} color={PRIMARY} /><h2 className="font-black text-lg" style={{ color: "#222" }}>حقيبة المتجر</h2>
          <button onClick={() => setActiveTab("seat_skin")} className="mr-auto px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: `${SEAT_PRIMARY}18`, color: SEAT_PRIMARY, border: `1px solid ${SEAT_PRIMARY}40` }}>المقاعد</button>
        </div>

        {/* Tabs */}
        <div className="px-3 pb-3 gap-1.5" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", scrollbarWidth: "none" }}>
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="min-w-0 flex items-center justify-center gap-1 px-1.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
              style={activeTab === tab.id
                ? { background: tab.id === "seat_skin" ? `${SEAT_PRIMARY}20` : "#f0f0f0", color: tab.id === "seat_skin" ? SEAT_PRIMARY : "#222", border: tab.id === "seat_skin" ? `1px solid ${SEAT_PRIMARY}40` : "none" }
                : { background: "transparent", color: "#888" }
              }
            >
              <BagTypeIcon type={tab.icon} size={17} color={activeTab === tab.id ? PRIMARY : "#888"} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: "#f2f7fc" }}>
        {/* Seat Skin Tab */}
        {activeTab === "seat_skin" && (
          <>
            {!isVip8Plus && (
              <div className="mx-4 mt-4 p-4 rounded-2xl flex items-center gap-3" style={{ background: "linear-gradient(135deg,#a855f715,#8b5cf615)", border: "1px solid #a855f730" }}>
                <span className="text-2xl">👑</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#7c3aed" }}>حصري لـ VIP 8+</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>ستايلات المقاعد متاحة فقط لمستخدمي VIP المستوى 8 وأعلى</p>
                </div>
              </div>
            )}
            {!seatSkins ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${SEAT_PRIMARY} transparent transparent transparent` }} />
              </div>
            ) : seatSkins.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-24">
                <span className="text-5xl opacity-30">🪑</span>
                <p className="font-bold text-base" style={{ color: "#888" }}>لا توجد ستايلات مقاعد</p>
                <p className="text-sm text-center px-8" style={{ color: "#bbb" }}>
                  {isVip8Plus ? "لم يتم إضافة ستايلات مقاعد بعد" : "احصل على VIP 8+ للوصول لستايلات المقاعد"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3 pb-8">
                {seatSkins.map((ui: any) => {
                  const item = ui.storeItem;
                  if (!item) return null;
                  const isExpired = ui.isExpired ?? false;
                  const displayUrl = item.thumbnailUrl ?? item.mediaUrl;
                  const isVipSkin = ui.isVipAutoAdded;
                  return (
                    <div
                      key={ui._id}
                      className="rounded-2xl overflow-hidden flex flex-col"
                      style={{
                        background: "white",
                        boxShadow: ui.isActive ? `0 2px 12px ${SEAT_PRIMARY}30` : "0 1px 6px rgba(0,0,0,0.06)",
                        border: ui.isActive ? `1.5px solid ${SEAT_PRIMARY}60` : "1.5px solid transparent",
                        opacity: isExpired ? 0.5 : 1,
                      }}
                    >
                      {/* Preview */}
                      <div className="relative overflow-hidden flex items-center justify-center" style={{ height: 110, background: "#f2f7fc" }}>
                        {displayUrl ? (
                          <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
                            <div className="absolute inset-0 rounded-full" style={{
                              background: "linear-gradient(145deg, rgba(20,10,40,0.85), rgba(10,5,20,0.9))",
                              border: `2px solid ${ui.isActive ? SEAT_PRIMARY : "rgba(139,92,246,0.4)"}`,
                              boxShadow: ui.isActive ? `0 0 12px ${SEAT_PRIMARY}60` : "none",
                            }} />
                            <img src={displayUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover rounded-full" style={{ zIndex: 5 }} />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🪑</div>
                        )}
                        {ui.isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: SEAT_PRIMARY }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                        {isVipSkin && (
                          <div className="absolute top-2 left-2 rounded-lg px-2 py-0.5" style={{ background: "linear-gradient(135deg,#a855f7,#8b5cf6)" }}>
                            <span className="text-white text-[9px] font-bold">✦ PRO</span>
                          </div>
                        )}
                        {isExpired && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                            <span className="text-red-400 text-xs font-bold">منتهي</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col gap-2">
                        <p className="font-bold text-xs truncate" style={{ color: "#222" }}>{item.name}</p>
                        {isVipSkin ? (
                          <p className="text-[10px]" style={{ color: "#a855f7" }}>👑 حصري PRO ♾️</p>
                        ) : (
                          <>
                            {ui.expiresAt && !isExpired && (
                              <p className="text-[10px]" style={{ color: "#888" }}>ينتهي: {new Date(ui.expiresAt).toLocaleDateString("ar-SA")}</p>
                            )}
                            {!ui.expiresAt && <p className="text-[10px]" style={{ color: SEAT_PRIMARY }}>دائم ♾️</p>}
                          </>
                        )}
                        {!isExpired && (
                          <button
                            onClick={() => handleToggle(ui)}
                            disabled={loading === ui._id}
                            className="w-full py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                            style={ui.isActive
                              ? { background: "#f2f7fc", color: "#888", border: "1px solid #e8eef5" }
                              : { background: `linear-gradient(135deg,${SEAT_PRIMARY},#7c3aed)`, color: "white" }
                            }
                          >
                            {loading === ui._id ? (
                              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                                style={{ borderColor: ui.isActive ? "#888 transparent transparent transparent" : "white transparent transparent transparent" }} />
                            ) : ui.isActive ? "إلغاء التفعيل" : "تفعيل 🪑"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Other tabs */}
        {activeTab !== "seat_skin" && activeTab !== "gifts" && (
          <>
            {!inventory ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${PRIMARY} transparent transparent transparent` }} />
              </div>
            ) : inventory.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-24">
                <BagTypeIcon type={activeTab} size={48} color="#9aa8b5" />
                <p className="font-bold text-base" style={{ color: "#888" }}>حقيبتك فارغة</p>
                <p className="text-sm" style={{ color: "#bbb" }}>
                  {activeTab === "frame" ? "اشترِ من المتجر أو احصل على PRO لتحصل على إطارات حصرية" : "اشترِ من المتجر لتملأ حقيبتك"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3 pb-8">
                {inventory.map((ui: any) => {
                  const item = ui.storeItem;
                  if (!item) return null;
                  const isExpired = ui.isExpired ?? false;
                  const isEntry = item.type === "entry";
                  const isFrame = item.type === "frame";
                  const isSvgaItem = item.mediaType === "svga" || isSvgaUrl(item.mediaUrl);
                  const displayUrl = (isFrame && isSvgaItem) ? item.mediaUrl : (item.thumbnailUrl ? item.thumbnailUrl : item.mediaUrl);
                  const isVideo = !isEntry && !isSvgaItem && displayUrl && (displayUrl.includes(".mp4") || displayUrl.includes("video") || item.mediaType === "mp4");
                  const isPending = ui.cpStatus === "pending" && ui.receivedFromUserId;
                  const isVipFrame = ui.isVipAutoAdded;
                  const isAdminFrame = ui.isSuperAdminAutoAdded;
                  const isAristocracy = ui.isAristocracyAutoAdded;
                  const isSpecial = isVipFrame || isAdminFrame;

                  const aristoConfig = getAristocracyConfig(ui.aristocracyLevel ?? 0);
                  const aristoColor = aristoConfig?.color ?? "#a78bfa";

                  return (
                    <div
                      key={ui._id}
                      className="rounded-2xl overflow-hidden flex flex-col"
                      style={{
                        background: "white",
                        boxShadow: ui.isActive
                          ? isAristocracy ? `0 2px 12px ${aristoColor}40`
                          : isAdminFrame ? "0 2px 12px #f59e0b30"
                          : isVipFrame ? "0 2px 12px #a855f730"
                          : `0 2px 12px ${PRIMARY}30`
                          : "0 1px 6px rgba(0,0,0,0.06)",
                        border: ui.isActive
                          ? isAristocracy ? `1.5px solid ${aristoColor}60`
                          : isAdminFrame ? "1.5px solid #f59e0b60"
                          : isVipFrame ? "1.5px solid #a855f760"
                          : `1.5px solid ${PRIMARY}60`
                          : "1.5px solid transparent",
                        opacity: isExpired ? 0.5 : 1,
                      }}
                    >
                      {/* Preview */}
                      <div className="relative overflow-hidden flex items-center justify-center" style={{ height: 110, background: "#f2f7fc" }}>
                        {displayUrl ? (
                          isFrame && isSvgaItem ? (
                            <div style={{ position: "relative", width: 80, height: 80 }}>
                              <div className="rounded-full overflow-hidden flex items-center justify-center"
                                style={{ width: 60, height: 60, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1, background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                                <span className="text-white font-bold text-xl">أ</span>
                              </div>
                              <SVGAPlayer src={displayUrl} width={80} height={80} loop={true}
                                style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10, pointerEvents: "none", background: "transparent" }} />
                            </div>
                          ) : isVideo ? (
                            <video src={displayUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                          ) : (
                            <img src={displayUrl} alt={item.name} className="w-full h-full object-contain p-2" />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
                            {activeTab === "cp" ? "💍" : activeTab === "frame" ? "🖼️" : activeTab === "entry" ? "🎬" : "💬"}
                          </div>
                        )}
                        {ui.isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: isAristocracy ? aristoColor : isAdminFrame ? "#f59e0b" : isVipFrame ? "#a855f7" : PRIMARY }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                        {isExpired && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                            <span className="text-red-400 text-xs font-bold">منتهي</span>
                          </div>
                        )}
                        {isPending && (
                          <div className="absolute top-2 left-2 rounded-lg px-2 py-0.5" style={{ background: "#ff6b9d" }}>
                            <span className="text-white text-[9px] font-bold">طلب جديد</span>
                          </div>
                        )}
                        {isSvgaItem && !isPending && (
                          <div className="absolute bottom-2 left-2 rounded-lg px-2 py-0.5" style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>
                            <span className="text-white text-[9px] font-bold">✨ SVGA</span>
                          </div>
                        )}
                        {isAristocracy && (
                          <div className="absolute top-2 left-2 rounded-lg px-2 py-0.5"
                            style={{ background: `linear-gradient(135deg,${aristoColor},${aristoColor}cc)` }}>
                            <span className="text-white text-[9px] font-bold">👑 أرستقراطية</span>
                          </div>
                        )}
                        {isVipFrame && !isAristocracy && (
                          <div className="absolute top-2 left-2 rounded-lg px-2 py-0.5" style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                            <span className="text-white text-[9px] font-bold">✦ PRO</span>
                          </div>
                        )}
                        {isAdminFrame && !isAristocracy && (
                          <div className="absolute top-2 left-2 rounded-lg px-2 py-0.5" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                            <span className="text-white text-[9px] font-bold">⭐ مشرف</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col gap-2">
                        <p className="font-bold text-xs truncate" style={{ color: "#222" }}>{item.name}</p>
                        {isAristocracy ? (
                          <p className="text-[10px]" style={{ color: aristoColor }}>👑 حصري للأرستقراطية ♾️</p>
                        ) : isSpecial ? (
                          <p className="text-[10px]" style={{ color: isAdminFrame ? "#f59e0b" : "#a855f7" }}>
                            {isAdminFrame ? "⭐ حصري للمشرفين" : "👑 حصري لـ VIP"} ♾️
                          </p>
                        ) : (
                          <>
                            {ui.expiresAt && !isExpired && (
                              <p className="text-[10px]" style={{ color: "#888" }}>ينتهي: {new Date(ui.expiresAt).toLocaleDateString("ar-SA")}</p>
                            )}
                            {!ui.expiresAt && <p className="text-[10px]" style={{ color: PRIMARY }}>دائم ♾️</p>}
                          </>
                        )}

                        {activeTab === "cp" && isPending ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleCpRespond(ui._id as Id<"userStoreItems">, true)} disabled={loading === ui._id}
                              className="flex-1 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all"
                              style={{ background: "#d1fae5", color: "#059669", border: "1px solid #6ee7b7" }}>
                              قبول 💍
                            </button>
                            <button onClick={() => handleCpRespond(ui._id as Id<"userStoreItems">, false)} disabled={loading === ui._id}
                              className="flex-1 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all"
                              style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                              رفض
                            </button>
                          </div>
                        ) : activeTab === "cp" && ui.cpStatus === "accepted" ? (
                          <div className="py-1.5 rounded-full text-center" style={{ background: "#fff0f6", border: "1px solid #ffd6e7" }}>
                            <span className="text-xs font-bold" style={{ color: "#ff6b9d" }}>مقبول 💍</span>
                          </div>
                        ) : activeTab === "cp" && ui.cpStatus === "rejected" ? (
                          <div className="py-1.5 rounded-full text-center" style={{ background: "#f3f4f6", border: "1px solid #e5e7eb" }}>
                            <span className="text-xs font-bold" style={{ color: "#9ca3af" }}>مرفوض</span>
                          </div>
                        ) : activeTab !== "cp" && !isExpired ? (
                          <button
                            onClick={() => handleToggle(ui)}
                            disabled={loading === ui._id}
                            className="w-full py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                            style={ui.isActive
                              ? { background: "#f2f7fc", color: "#888", border: "1px solid #e8eef5" }
                              : {
                                background: isAristocracy
                                  ? `linear-gradient(135deg,${aristoColor},${aristoColor}cc)`
                                  : isAdminFrame
                                    ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                                    : isVipFrame
                                      ? "linear-gradient(135deg,#a855f7,#ec4899)"
                                      : PRIMARY,
                                color: "white"
                              }
                            }
                          >
                            {loading === ui._id ? (
                              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                                style={{ borderColor: ui.isActive ? "#888 transparent transparent transparent" : "white transparent transparent transparent" }} />
                            ) : ui.isActive ? "إلغاء التفعيل" : "تفعيل"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "gifts" && (
          <GiftsTab giftInventory={giftInventory} onSend={(item: any) => setSendingGift(item)} loading={loading} />
        )}
      </div>

      {/* Send Gift Modal */}
      {sendingGift && (
        <SendGiftModal
          gift={sendingGift}
          onClose={() => setSendingGift(null)}
          onSend={sendGift}
        />
      )}
    </div>
  );
}

function GiftsTab({ giftInventory, onSend, loading }: any) {
  if (!giftInventory) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${PRIMARY} transparent transparent transparent` }} />
      </div>
    );
  }
  if (giftInventory.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <span className="text-5xl opacity-30">🎁</span>
        <p className="font-bold text-base" style={{ color: "#888" }}>لا توجد هدايا</p>
        <p className="text-sm" style={{ color: "#bbb" }}>احصل على هدايا من الغرف</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 p-3 pb-8">
      {giftInventory.map((item: any) => (
        <div key={item._id} className="rounded-2xl overflow-hidden flex flex-col bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div className="relative overflow-hidden flex items-center justify-center" style={{ height: 110, background: "#f2f7fc" }}>
            {item.giftImageUrl ? (
              <img src={item.giftImageUrl} alt={item.giftName} className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-4xl">{item.giftEmoji ?? "🎁"}</span>
            )}
            <div className="absolute top-2 right-2 rounded-full px-2 py-0.5" style={{ background: "rgba(0,0,0,0.5)" }}>
              <span className="text-white text-[10px] font-bold">×{item.quantity}</span>
            </div>
          </div>
          <div className="p-3 flex flex-col gap-2">
            <p className="font-bold text-xs truncate" style={{ color: "#222" }}>{item.giftName}</p>
            <button onClick={() => onSend(item)} disabled={loading === item._id}
              className="w-full py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
              إرسال 🎁
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SendGiftModal({ gift, onClose, onSend }: any) {
  const [sakiId, setSakiId] = useState("");
  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (!sakiId.trim()) { toast.error("أدخل معرف المستخدم"); return; }
    setSending(true);
    try {
      await onSend({ inventoryId: gift._id, receiverSakiId: sakiId.trim() });
      toast.success("تم إرسال الهدية ✅");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl p-6 space-y-4" style={{ background: "white" }} onClick={(e) => e.stopPropagation()}>
        <h3 className="font-black text-lg text-center" style={{ color: "#222" }}>إرسال هدية 🎁</h3>
        <p className="text-sm text-center" style={{ color: "#888" }}>{gift.giftName}</p>
        <input value={sakiId} onChange={(e) => setSakiId(e.target.value)} placeholder="أدخل معرف المستخدم (Saki ID)"
          className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: "#f2f7fc", border: "1px solid #e8eef5" }} />
        <button onClick={handleSend} disabled={sending || !sakiId.trim()}
          className="w-full py-3 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
          {sending ? "جاري الإرسال..." : "إرسال"}
        </button>
      </div>
    </div>
  );
}
