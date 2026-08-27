// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useProfile } from "../components/ProfileManager";
import { useEffect } from "react";
import { useState } from "react";
import { toast } from "../lib/toast";
import UploadStoreItemPage from "./UploadStoreItemPage";
import MyBagPage from "./MyBagPage";

interface StorePageProps {
  onBack: () => void;
}

type StoreTab = "entry" | "frame" | "bubble" | "seat_skin";

const PRIMARY = "#00d4c5";
const SEAT_PRIMARY = "#8b5cf6";
const STORE_TABS: { id: StoreTab; label: string }[] = [
  { id: "entry", label: "الدخولية" },
  { id: "frame", label: "الإطارات" },
  { id: "bubble", label: "فقاعات الدردشة" },
  { id: "seat_skin", label: "المقاعد" },
];

function StoreTypeIcon({ type, size = 24, color = "#00a99d" }: { type: string; size?: number; color?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "entry") return <svg {...common}><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 11h5M10 15h5" /><path d="M3 8v11a2 2 0 0 0 2 2" /></svg>;
  if (type === "frame") return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="12" cy="12" r="4" /><path d="M8 4v3M16 4v3M4 8h3M17 8h3M4 16h3M17 16h3M8 20v-3M16 20v-3" /></svg>;
  if (type === "coin") return <svg {...common}><circle cx="12" cy="12" r="8" fill={`${color}20`} /><path d="M9 9.5c.7-.7 1.6-1 2.7-1 1.5 0 2.5.7 2.5 1.7 0 2.5-5 1.1-5 3.6 0 1 1 1.7 2.6 1.7 1.1 0 2-.4 2.7-1.1" /><path d="M12 7v10" /></svg>;
  return <svg {...common}><path d="M4 6h16M4 12h11M4 18h7" /><circle cx="18" cy="17" r="3" /><path d="M18 15.5v1.7l1.2.8" /></svg>;
}

export default function StorePage({ onBack }: StorePageProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [storeTab, setStoreTab] = useState<StoreTab>("seat_skin");
  const [buying, setBuying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { profile, refreshProfile } = useProfile();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('store_items').select('*').eq('type', storeTab);
      setItems(data || []);
    };
    fetchData();
  }, [storeTab]);

  const purchaseItem = async ({ storeItemId }: any) => {};
  const deleteItem = async ({ itemId }: any) => {};

  const isSuperAdmin = profile?.is_super_admin ?? false;
  const accentColor = PRIMARY;

  if (showUpload) return <UploadStoreItemPage onBack={() => setShowUpload(false)} />;
  if (showBag) return <MyBagPage onBack={() => setShowBag(false)} />;

  const handleBuy = async (itemId: string) => {
    setBuying(itemId);
    try {
      await purchaseItem({ storeItemId: itemId });
      toast.success("تم الشراء بنجاح! ✅ تحقق من حقيبتك 🎒");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setBuying(null);
    }
  };

  const handleDelete = async (itemId: string, itemName: string) => {
    if (!confirm(`هل تريد حذف "${itemName}" نهائياً؟`)) return;
    setDeleting(itemId);
    try {
      await deleteItem({ itemId });
      toast.success("تم الحذف ✅");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setDeleting(null);
    }
  };

  const currentTabs = STORE_TABS;

  return (
    <div className="flex flex-col h-full" style={{ background: "#ffffff" }} dir="rtl">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40" style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #eef2f7",
      }}>
        {/* Top row */}
        <div className="flex items-center justify-between px-4 py-3.5">
          {/* Upload button */}
          <button
            onClick={() => isSuperAdmin ? setShowUpload(true) : null}
            className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: isSuperAdmin ? `${accentColor}15` : "#f2f7fc", border: `1px solid ${isSuperAdmin ? accentColor + "40" : "#e8eef5"}` }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isSuperAdmin ? accentColor : "#aab"} strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>

          {/* Main tabs */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-base font-black relative pb-1 text-[#222]">المتجر<span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: PRIMARY }} /></span>
            <button onClick={() => setStoreTab("seat_skin")} className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: `${SEAT_PRIMARY}18`, color: SEAT_PRIMARY, border: `1px solid ${SEAT_PRIMARY}40` }}>المقاعد</button>
          </div>

          {/* Bag button */}
          <button
            onClick={() => setShowBag(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}40` }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </button>
        </div>

        {/* Balance */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <StoreTypeIcon type="coin" size={18} color="#f59e0b" />
            <span className="font-bold text-sm" style={{ color: "#d97706" }}>{(profile?.gold_coins ?? 0).toLocaleString()}</span>
            <span className="text-xs" style={{ color: "#92400e" }}>عملة ذهبية</span>
          </div>
        </div>

        {/* Sub tabs */}
        <div className="px-3 pb-3 gap-1.5" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", scrollbarWidth: "none" }}>
          {currentTabs.map((tab) => {
            const isActive = storeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStoreTab(tab.id as StoreTab)}
                className="min-w-0 px-1.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                style={isActive
                  ? { background: "#f0f0f0", color: "#222" }
                  : { background: "transparent", color: "#888" }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Items Grid ── */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#f2f7fc" }}>
                        {!items ? (

          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accentColor} transparent transparent transparent` }} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <StoreTypeIcon type={storeTab} size={52} color="#9aa8b5" />
            <p className="font-bold text-base" style={{ color: "#888" }}>لا توجد عناصر بعد</p>
            <p className="text-sm" style={{ color: "#bbb" }}>قريباً سيتم إضافة عناصر جديدة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3 pb-8">
            {items.map((item: any) => (
              <StoreItemCard
                key={item.id}
                item={item}
                accentColor={accentColor}
                isCp={false}
                isSuperAdmin={isSuperAdmin}
                onBuy={() => handleBuy(item.id as string)}
                onSend={async () => {
                  setBuying(item.id);
                  try {
                    await purchaseItem({ storeItemId: item.id });
                    toast.success("تم الإرسال بنجاح! ✅");
                  } catch (e: any) {
                    toast.error(e.message ?? "حدث خطأ");
                  } finally {
                    setBuying(null);
                  }
                }}
                onDelete={() => handleDelete(item.id as string, item.name)}
                buying={buying === item.id}
                deleting={deleting === item.id}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function StoreItemCard({
  item,
  accentColor,
  isCp,
  isSuperAdmin,
  onBuy,
  onSend,
  onDelete,
  buying,
  deleting,
}: {
  item: any;
  accentColor: string;
  isCp: boolean;
  isSuperAdmin: boolean;
  onBuy: () => void;
  onSend: () => void;
  onDelete: () => void;
  buying: boolean;
  deleting: boolean;
}) {
  const isVideo = item.mediaUrl && (item.mediaUrl.includes(".mp4") || item.mediaUrl.includes("video") || item.mediaType === "mp4");
  const isEntry = item.type === "entry";
  const isFrame = item.type === "frame";
  const isSeat = item.type === "seat_skin";
  // للمقاعد والإطارات والدخولية: استخدم الصورة المصغرة إن وجدت
  const displayUrl = item.thumbnailUrl ? item.thumbnailUrl : (isSeat ? (item.seatOpenUrl ?? item.mediaUrl) : item.mediaUrl);
  const displayIsImage = item.thumbnailUrl ? true : !isVideo;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "#ffffff", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
      {/* Card header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${accentColor}18`, color: accentColor }}>
          جرب القيادة
        </span>
        <div className="flex items-center gap-1.5">
          {/* Delete button — super admin only */}
          {isSuperAdmin && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
              style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}
              title="حذف"
            >
              {deleting ? (
                <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              )}
            </button>
          )}
          <span className="text-xs flex items-center gap-1" style={{ color: "#888" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {item.durationDays ? `${item.durationDays} أيام` : "دائم"}
          </span>
        </div>
      </div>

      {/* Preview */}
      <div className="mx-3 rounded-xl overflow-hidden" style={{ height: 120, background: "#f2f7fc" }}>
        {displayUrl ? (
          !displayIsImage ? (
            <video src={displayUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
          ) : (
            <img src={displayUrl} alt={item.name} className="w-full h-full object-contain p-2" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
            <StoreTypeIcon type={item.type} size={46} color={accentColor} />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-3 pt-2 pb-1">
        <p className="font-bold text-sm truncate" style={{ color: "#222" }}>{item.name}</p>
        {isSeat && item.seatRequiredRank && item.seatRequiredRank !== "normal" && <p className="text-[10px] mt-1" style={{ color: "#8b5cf6" }}>👑 حصري لـ {item.seatRequiredRank}</p>}
        {isSeat && (!item.seatRequiredRank || item.seatRequiredRank === "normal") && <p className="text-[10px] mt-1" style={{ color: "#10b981" }}>🛍️ متاح للشراء للجميع</p>}
      </div>

      {/* Price */}
      <div className="px-3 pb-2 flex items-center gap-1">
        <span className="text-lg font-black" style={{ color: "#222" }}>{item.price.toLocaleString()}</span>
        <StoreTypeIcon type="coin" size={16} color="#f59e0b" />
      </div>

      {/* Buttons */}
      <div className="px-3 pb-3 flex flex-col gap-2">
        <button
          onClick={onBuy}
          disabled={buying || deleting}
          className="w-full py-2 rounded-full text-sm font-bold transition-all active:scale-97 disabled:opacity-50"
          style={{ background: accentColor, color: "white" }}
        >
          {buying ? <span className="flex items-center justify-center gap-1"><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /></span> : "شراء"}
        </button>
        <button
          onClick={onSend}
          disabled={buying || deleting}
          className="w-full py-2 rounded-full text-sm font-bold transition-all active:scale-97 disabled:opacity-50"
          style={{ background: "white", color: accentColor, border: `1px solid ${accentColor}` }}
        >
          إرسال
        </button>
      </div>
    </div>
  );
}

// ── Send CP Ring page ─────────────────────────────────────────────────────────
function SendCpPage({ storeItemId, onBack }: { storeItemId: string; onBack: () => void }) {
  const [sakiId, setSakiId] = useState("");
  const [sending, setSending] = useState(false);
  const [searchProfile, setSearchProfile] = useState<any>(null);

  useEffect(() => {
    if (sakiId.trim().length >= 3) {
      supabase.from('profiles').select('*').eq('saki_id', sakiId.trim()).single().then(({ data }) => setSearchProfile(data));
    } else {
      setSearchProfile(null);
    }
  }, [sakiId]);

  const sendCpRing = async (args: any) => {};

  const handleSend = async () => {
    if (!searchProfile) return;
    setSending(true);
    try {
      await sendCpRing({ storeItemId, targetUserId: searchProfile.userId as string });
      toast.success("تم إرسال الخاتم! 💍");
      onBack();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#ffffff" }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)", borderBottom: "1px solid #eef2f7" }}>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button onClick={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ background: "#f2f7fc", border: "1px solid #e8eef5" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <h2 className="font-black text-lg" style={{ color: "#222" }}>إرسال خاتم CP 💍</h2>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-5">
        {/* Icon */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl" style={{ background: "#fff0f6", border: "1px solid #ffd6e7" }}>
            💍
          </div>
          <p className="font-black text-xl" style={{ color: "#222" }}>أرسل خاتماً سحرياً</p>
          <p className="text-sm" style={{ color: "#888" }}>سيصل للمستخدم في رسائله الخاصة</p>
        </div>

        {/* Search */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "#f2f7fc", border: "1px solid #e8eef5" }}>
          <label className="text-xs font-bold" style={{ color: "#555" }}>ابحث بـ ID المستخدم</label>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "white", border: "1px solid #e8eef5" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <input
              value={sakiId}
              onChange={(e) => setSakiId(e.target.value)}
              placeholder="أدخل ID المستخدم..."
              className="flex-1 bg-transparent text-sm outline-none text-right"
              style={{ color: "#222" }}
            />
          </div>
        </div>

        {/* Found user */}
        {searchProfile && (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#fff0f6", border: "1px solid #ffd6e7" }}>
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: "2px solid #ff6b9d" }}>
              {searchProfile.avatarUrl
                ? <img src={searchProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#ff6b9d,#a855f7)" }}><span className="text-white font-bold text-xl">{searchProfile.name[0]}</span></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate" style={{ color: "#222" }}>{searchProfile.name}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "#ff6b9d" }}>#{searchProfile.sakiId}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#d1fae5", border: "1px solid #6ee7b7" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          </div>
        )}

        {sakiId.trim().length >= 3 && searchProfile === null && (
          <div className="text-center py-4 flex flex-col items-center gap-2">
            <span className="text-3xl opacity-30">🔍</span>
            <p className="text-sm" style={{ color: "#888" }}>لم يتم العثور على مستخدم</p>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!searchProfile || sending}
          className="w-full py-4 rounded-full font-bold text-base disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2 text-white"
          style={{ background: "linear-gradient(135deg,#ff6b9d,#a855f7)", boxShadow: "0 4px 20px rgba(255,107,157,0.3)" }}
        >
          {sending ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>جاري الإرسال...</span></>
          ) : (
            <><span>💍</span><span>إرسال الخاتم</span></>
          )}
        </button>
      </div>
    </div>
  );
}
