// @ts-nocheck
import React, { Fragment, useState, useEffect, useRef } from "react";
import { ARAB_COUNTRIES } from "../data/countries";
import { Page } from "../App";
import SearchPage from "./SearchPage";
import WealthPage from "./WealthPage";
import LeaderboardPage from "./LeaderboardPage";
import CharismaPage from "./CharismaPage";
import RoomListCard from "../components/RoomListCard";
import RoomsLeaderboardPage from "./RoomsLeaderboardPage";
import CpLeaderboardPage from "./CpLeaderboardPage";
import DailyRewardsPage from "./DailyRewardsPage";
import LiveStreamPage from "./LiveStreamPage";
import BroadcastPage from "./BroadcastPage";
import CreateRoomPage from "./CreateRoomPage";
import RechargeGiftPage from "./RechargeGiftPage";
import WeeklyStarPage from "./WeeklyStarPage";
import { useLang } from "../hooks/useLang";
const AHLEEN_PALETTE = { 
  primary: "#00bfa5",
  ink: "#0f172a",
  border: "#f1f5f9",
  gold: "#f59e0b",
  silver: "#94a3b8",
  bronze: "#d97706",
  slate: "#64748b",
  emerald: "#10b981",
  pink: "#ec4899"
};
const AHLEEN_UI = { 
  bg: "#ffffff",
  goldButton: { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" },
  panel: { background: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }
};

interface HomePageProps {
  onRoomSelect: (id: string) => void;
  setCurrentPage: (p: Page) => void;
  onUserSelect: (id: string) => void;
  onSubPageChange?: (active: boolean, backFn?: () => void, pageName?: string) => void;
}

type SubPage = "home" | "leaderboard" | "wealth" | "charisma" | "rooms-lb" | "cp" | "daily" | "live" | "broadcast" | "createRoom" | "recharge" | "weekly-star";
type RoomTab = "all" | "mine";
type MyRoomTab = "recent" | "followed" | "managed";

function MyRoomRow({ room, badge, onSelect }: { room: any; badge?: string; onSelect: () => void }) {
  return (
    <div className="relative">
      {badge && <span className="absolute right-3 top-3 z-10 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-slate-950 shadow-sm">{badge}</span>}
      <RoomListCard room={room} onSelect={onSelect} rank={1} />
    </div>
  );
}

function BroadcastTicker({ onOpen }: { onOpen: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { lang } = useLang();

  useEffect(() => {
    const fetchBroadcasts = async () => {
      const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(6);
      if (data) setMessages(data);
      setIsLoading(false);
    };
    fetchBroadcasts();
  }, []);

  const displayMsgs = messages;
  const loopMsgs = displayMsgs.length > 0 ? [...displayMsgs, ...displayMsgs] : [];
  const emptyText = isLoading ? (lang === "en" ? "Loading broadcast..." : "جارٍ تحميل الإذاعة...") : (lang === "en" ? "No live broadcast now" : "لا توجد إذاعة حالية");

  return (
    <button onClick={onOpen} aria-label="فتح الإذاعة" className="mx-4 mb-3 active:scale-[0.98] transition-transform overflow-hidden rounded-2xl flex items-center"
      style={{ height: 48, background: "linear-gradient(135deg,#fffaf0,#fff7dc)", border: `1px solid ${AHLEEN_PALETTE.gold}66`, width: "calc(100% - 32px)", boxShadow: "0 5px 16px rgba(180,120,20,0.12)" }}>
      <div className="flex items-center justify-center h-full px-3 text-xs font-black flex-shrink-0"
        style={{ background: AHLEEN_PALETTE.gold, color: "#fff" }}>
        {lang === "en" ? "Live" : "إذاعة عاجلة"}
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center px-3" style={{ minWidth: 0 }}>
        <div className="flex items-center whitespace-nowrap" style={{ animation: "bc-fly 24s linear infinite", gap: 32 }}>
          {loopMsgs.length > 0 ? loopMsgs.map((item: any, i: number) => (
            <div key={`${item.id ?? "broadcast"}-${i}`} className="flex items-center flex-shrink-0 gap-2">
              <span className="text-xs font-bold text-amber-600">{item.sender_name ?? "Saki Chat"}:</span>
              <span className="text-xs text-slate-600">{item.content}</span>
            </div>
          )) : (
            <span className="text-xs font-bold text-slate-500">{emptyText}</span>
          )}
        </div>
      </div>
    </button>
  );
}

import { supabase } from "../lib/supabaseClient";
import { useProfile } from "../components/ProfileManager";

export default function HomePage({ onRoomSelect, setCurrentPage, onUserSelect, onSubPageChange }: HomePageProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [rechargeGiftSettings, setRechargeGiftSettings] = useState<any>(null);
  const { profile } = useProfile();
  const [myRoom, setMyRoom] = useState<any>(null);
  const [myRooms, setMyRooms] = useState<any>({ recent: [], followed: [], managed: [] });
  const { lang, tr, isRtl } = useLang();

  const seedBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .limit(6);

      if (error || !data) {
        setBanners([]);
        return;
      }

      const normalizedBanners = data
        .map((banner: any) => ({
          ...banner,
          imageUrl: banner.imageUrl ?? banner.image_url ?? banner.url ?? "",
        }))
        .filter((banner: any) => Boolean(banner.imageUrl));

      setBanners(normalizedBanners);
    } catch {
      // The home screen remains usable with local fallback banners when the
      // optional banners table is unavailable or blocked by RLS.
      setBanners([]);
    }
  };

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
      if (data) {
        setRooms(data);
        if (profile) {
          const owned = data.find(r => r.owner_id === profile.user_id);
          if (owned) setMyRoom(owned);
        }
      }
    };
    fetchRooms();
  }, [profile]);

  const [selectedCountry, setSelectedCountry] = useState("all");
  const [currentBanner, setCurrentBanner] = useState(0);
  const [rechargeBanner, setRechargeBanner] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [subPage, setSubPage] = useState<SubPage>("home");
  const [roomTab, setRoomTab] = useState<RoomTab>("all");
  const [myRoomTab, setMyRoomTab] = useState<MyRoomTab>("recent");

  const goToSubPage = (p: SubPage) => {
    setSubPage(p);
    onSubPageChange?.(true, () => { setSubPage("home"); onSubPageChange?.(false, undefined, "home"); }, p);
  };
  const openSearch = () => {
    setShowSearch(true);
    onSubPageChange?.(true, () => { setShowSearch(false); onSubPageChange?.(false, undefined, "home"); }, "search");
  };
  const closeSearch = () => { setShowSearch(false); onSubPageChange?.(false, undefined, "home"); };
  const backToHome = () => { setSubPage("home"); onSubPageChange?.(false, undefined, "home"); };

  useEffect(() => { seedBanners(); }, []);

  useEffect(() => {
    let mounted = true;
    const loadRechargeSettings = async () => {
      const { data } = await supabase
        .from("recharge_settings")
        .select("banner_url")
        .maybeSingle();
      if (mounted) setRechargeGiftSettings(data ?? null);
    };
    void loadRechargeSettings();
    return () => { mounted = false; };
  }, []);

  // Change banner every 3 seconds as requested
  useEffect(() => {
    if (!banners || banners.length === 0) return;
    const t = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(t);
  }, [banners]);
  useEffect(() => {
    const t = setInterval(() => setRechargeBanner((prev) => (prev + 1) % 2), 4000);
    return () => clearInterval(t);
  }, []);

  if (showSearch) return <SearchPage onBack={closeSearch} onRoomSelect={(id) => { closeSearch(); onRoomSelect(id); }} onUserSelect={(id) => { closeSearch(); onUserSelect(id); }} />;
  if (subPage === "leaderboard") return <LeaderboardPage onBack={backToHome} onRoomSelect={onRoomSelect} onUserSelect={onUserSelect} />;
  if (subPage === "wealth") return <WealthPage onBack={backToHome} />;
  if (subPage === "charisma") return <CharismaPage onBack={backToHome} />;
  if (subPage === "rooms-lb") return <RoomsLeaderboardPage onBack={backToHome} onRoomSelect={onRoomSelect} onUserSelect={onUserSelect} />;
  if (subPage === "cp") return <CpLeaderboardPage onBack={backToHome} onUserSelect={onUserSelect} />;
  if (subPage === "daily") return <DailyRewardsPage onBack={backToHome} />;
  if (subPage === "live") return <LiveStreamPage onBack={backToHome} onRoomSelect={onRoomSelect} />;
  if (subPage === "broadcast") return <BroadcastPage onBack={backToHome} />;
  if (subPage === "createRoom") return <CreateRoomPage onBack={backToHome} onSuccess={(roomId) => { backToHome(); onRoomSelect(roomId); }} />;
  if (subPage === "recharge") return <RechargeGiftPage onBack={backToHome} />;
  if (subPage === "weekly-star") return <WeeklyStarPage onBack={backToHome} />;

  const listRooms = rooms ?? [];
  const fallbackBannerUrl = "https://l.top4top.io/p_38848efnl0.png";
  const activeBanners = banners && banners.length > 0 ? banners : [
    { imageUrl: fallbackBannerUrl },
    { imageUrl: "/assets/icons/bg_week_star_elongated.webp" },
    { imageUrl: fallbackBannerUrl }
  ];
  const rechargeBannerUrl = rechargeGiftSettings?.banner_url ?? rechargeGiftSettings?.bannerUrl ?? fallbackBannerUrl;
  const countriesWithRooms = Array.from(new Set(listRooms.map((r: any) => r.country).filter(Boolean))) as string[];

  const filteredRooms = listRooms.filter((r: any) => {
    if (selectedCountry !== "all" && r.country !== selectedCountry) return false;
    return true;
  });
  const myRoomLists: Record<MyRoomTab, any[]> = {
    recent: myRooms?.recent ?? [],
    followed: myRooms?.followed ?? [],
    managed: myRooms?.managed ?? [],
  };
  const activeMyRooms = myRoomLists[myRoomTab];

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-y-auto pb-28 bg-white"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <style>{`
        @keyframes bc-fly { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
      `}</style>

      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-30 px-4 pt-4 pb-2.5 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${AHLEEN_PALETTE.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Left: Leaderboard & Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => goToSubPage("leaderboard")}
            className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <img src="/assets/icons/icon_main_ranking.webp" alt="" className="w-7 h-7 object-contain" />
          </button>
          <button
            onClick={openSearch}
            className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <img src="/assets/icons/icon_main_search.webp" alt="" className="w-7 h-7 object-contain" />
          </button>
        </div>

        {/* Center: Tabs */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setRoomTab("all")}
            className={`text-lg font-black transition-all ${roomTab === "all" ? "text-slate-900 border-b-2 border-amber-500 pb-0.5" : "text-slate-400"}`}
          >
            الغرف
          </button>
          <button
            onClick={() => setRoomTab("mine")}
            className={`text-lg font-black transition-all ${roomTab === "mine" ? "text-slate-900 border-b-2 border-amber-500 pb-0.5" : "text-slate-400"}`}
          >
            غرفتي
          </button>
        </div>

        {/* Right: Create Room */}
        <div className="flex items-center">
          <button
            onClick={() => {
              if (myRoom) {
                onRoomSelect(myRoom.id || myRoom._id);
              } else {
                goToSubPage("createRoom");
              }
            }}
            className="px-4 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-transform font-black text-xs shadow-md"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" }}
          >
            <span className="text-sm">🎙️</span>
            <span>{myRoom ? "غرفتي" : "إنشاء"}</span>
          </button>
        </div>
      </header>

      {roomTab === "mine" && (
        <section className="px-4 pt-3" dir="rtl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400">مساحتك الصوتية</p>
              <h1 className="mt-0.5 text-lg font-black text-slate-900">الخاصة بي</h1>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700">{activeMyRooms.length} غرفة</span>
          </div>

          <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {([
              ["recent", "مؤخراً", "🕘"],
              ["followed", "متابعة", "♡"],
              ["managed", "مدارة", "♛"],
            ] as const).map(([key, label, icon]) => (
              <button key={key} type="button" onClick={() => setMyRoomTab(key)} className="relative flex-shrink-0 px-3 pb-2 pt-1 text-xs font-black transition-colors active:scale-95" style={{ color: myRoomTab === key ? "#0f172a" : "#94a3b8" }}>
                <span className="ml-1">{icon}</span>{label}
                {myRoomTab === key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber-400" />}
              </button>
            ))}
          </div>

          {myRoomTab === "recent" && myRoom && !activeMyRooms.some((room: any) => String(room._id) === String(myRoom._id)) && (
            <MyRoomRow room={myRoom} badge="غرفتي" onSelect={() => onRoomSelect(myRoom._id)} />
          )}

          {activeMyRooms.length === 0 ? (
            <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-5 py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">{myRoomTab === "followed" ? "♡" : "🎙️"}</div>
              <p className="text-sm font-black text-slate-700">{myRoomTab === "recent" ? "لا توجد غرف زرتها مؤخرًا" : myRoomTab === "followed" ? "لم تتابع أي غرفة بعد" : "لا توجد غرف مدارة"}</p>
              <p className="mt-1 text-[11px] text-slate-400">ستظهر الغرف هنا تلقائيًا بعد الدخول أو المتابعة</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeMyRooms.map((room: any, index: number) => (
                <MyRoomRow key={room._id} room={room} badge={myRoomTab === "recent" && index === 0 ? "الأخيرة" : undefined} onSelect={() => onRoomSelect(room._id)} />
              ))}
            </div>
          )}
        </section>
      )}

      {roomTab === "all" && <>
      {/* ── BANNERS CAROUSEL (Rotates every 3 seconds) ── */}
      <div className="px-4 my-3">
        <div className="relative overflow-hidden rounded-[24px]" style={{ height: 140, border: `1px solid ${AHLEEN_PALETTE.gold}44`, boxShadow: `0 8px 30px rgba(0,0,0,.35)` }}>
          {activeBanners.map((b: any, index: number) => (
            <div key={index} className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: currentBanner === index ? 1 : 0, pointerEvents: currentBanner === index ? "auto" : "none" }}>
              <img src={b.imageUrl || fallbackBannerUrl} alt="" className="w-full h-full object-cover" onError={(event) => { const image = event.currentTarget; image.onerror = null; image.src = fallbackBannerUrl; }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(22,5,13,.8) 0%, transparent 60%)" }} />
              <div className="absolute bottom-3 right-4 left-4 flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{ background: AHLEEN_PALETTE.ruby, border: `1px solid ${AHLEEN_PALETTE.gold}66` }}>
                  فعالية Ahleen الملكية
                </span>
                <div className="flex gap-1">
                  {activeBanners.map((_, i) => (
                    <div key={i} className="h-1.5 rounded-full transition-all" style={{ width: currentBanner === i ? 18 : 6, background: currentBanner === i ? AHLEEN_PALETTE.gold : "rgba(255,255,255,.4)" }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COUNTRY FILTER BAR ── */}
      <section className="px-4 mt-5 mb-4 flex items-center gap-2 overflow-x-auto pb-2 min-h-[48px] w-full relative z-20" aria-label="فلترة الغرف حسب الدولة" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch", background: "#f8fafc", borderTop: `1px solid ${AHLEEN_PALETTE.border}`, borderBottom: `1px solid ${AHLEEN_PALETTE.border}` }}>
        <button
          onClick={() => setSelectedCountry("all")}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all"
          style={selectedCountry === "all" ? AHLEEN_UI.goldButton : { background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }}
        >
          🌍 الكل
        </button>
        {ARAB_COUNTRIES.filter((c) => countriesWithRooms.includes(c.code)).map((c) => {
          const active = selectedCountry === c.code;
          return (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c.code)}
              className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 flex items-center gap-1.5 transition-all"
              style={active ? AHLEEN_UI.goldButton : { background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          );
        })}
      </section>
      </>}

      {roomTab === "all" && <>
      {/* ── ROOMS GRID ── */}
      <div className="px-4 mt-4">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-16 rounded-[26px]" style={AHLEEN_UI.panel}>
            <p className="text-3xl mb-2">🎙️</p>
            <p className="font-bold text-white text-sm">لا توجد غرف نشطة حالياً</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,.45)" }}>أنشئ غرفتك الخاصة وابدأ الدردشة الآن</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRooms.map((room: any, idx: number) => (
              <Fragment key={room._id}>
                <RoomListCard room={room} onSelect={() => onRoomSelect(room._id)} rank={idx + 1} />
                {idx === 0 && (
                  <button type="button" onClick={() => goToSubPage(rechargeBanner === 0 ? "recharge" : "weekly-star")} className="group relative mt-0.5 overflow-hidden rounded-2xl border border-amber-300/60 bg-[#3b0712] shadow-[0_8px_24px_rgba(87,11,24,.18)] active:scale-[.99]">
                    {rechargeBanner === 0 ? <><img src={rechargeBannerUrl} alt="هدية إعادة الشحن" className="h-[124px] w-full object-cover transition duration-500 group-hover:scale-[1.02]" onError={(event) => { const image = event.currentTarget; image.onerror = null; image.src = fallbackBannerUrl; }} /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#26040c]/90 to-transparent px-3 pb-2 pt-7 text-right text-[11px] font-black text-amber-100">هدايا إعادة الشحن</span></> : <><div className="flex h-[124px] items-center gap-4 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,.35),transparent_35%),linear-gradient(135deg,#160a2d,#3b1157,#120718)] px-5"><img src="/assets/icons/bg_week_star_elongated.webp" alt="النجم الأسبوعي" className="h-24 w-24 object-contain drop-shadow-[0_0_18px_rgba(251,191,36,.8)]" /><div className="text-right"><p className="text-xs font-bold text-amber-200/70">هذا الأسبوع</p><p className="text-2xl font-black text-amber-100">النجم الأسبوعي</p><p className="text-[11px] text-white/60">اضغط لمعرفة الترتيب والمكافآت</p></div></div><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#160a2d]/90 to-transparent px-3 pb-2 pt-7 text-right text-[11px] font-black text-amber-100">النجم الأسبوعي</span></>}
                  </button>
                )}
              </Fragment>
            ))}
          </div>
        )}
      </div>
      </>}
    </div>
  );
}
