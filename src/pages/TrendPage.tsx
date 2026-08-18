// @ts-nocheck
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Page } from "../App";
import UserAvatar from "../components/UserAvatar";
import { VipName, getVipConfig } from "../components/VipBadge";

interface TrendPageProps {
  setCurrentPage: (p: Page) => void;
  onUserSelect: (userId: Id<"users">) => void;
  onRoomSelect?: (roomId: Id<"rooms">) => void;
}

type TrendTab = "discover" | "trending" | "rooms" | "people";

export default function TrendPage({ setCurrentPage, onUserSelect, onRoomSelect }: TrendPageProps) {
  const [tab, setTab] = useState<TrendTab>("discover");
  const moments = useQuery(api.moments.getMoments);
  const rooms = useQuery(api.rooms.listRooms, {});
  const myProfile = useQuery(api.profiles.getMyProfile);

  const tabs = [
    { id: "discover" as TrendTab, label: "اكتشف", emoji: "🔭" },
    { id: "trending" as TrendTab, label: "الترند", emoji: "🔥" },
    { id: "rooms" as TrendTab, label: "الغرف", emoji: "🎙️" },
    { id: "people" as TrendTab, label: "أشخاص", emoji: "👥" },
  ];

  // Top moments by likes
  const trendingMoments = [...(moments ?? [])]
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, 20);

  // Top rooms by members
  const topRooms = [...(rooms ?? [])]
    .sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0))
    .slice(0, 12);

  // Discover: mix of moments with images
  const discoverItems = (moments ?? []).filter(m => m.imageUrl).slice(0, 30);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "linear-gradient(180deg,#080812 0%,#0a0a16 100%)" }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl" style={{ background: "rgba(8,8,18,0.92)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", boxShadow: "0 0 20px rgba(249,115,22,0.5)" }}>
              <span className="text-lg">🔥</span>
            </div>
            <div>
              <h2 className="text-white font-black text-lg leading-none">الترند</h2>
              <p className="text-gray-500 text-[10px] mt-0.5">اكتشف الأحدث والأكثر تفاعلاً</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black transition-all ${tab === t.id ? "text-white" : "text-gray-500 bg-white/5"}`}
              style={tab === t.id ? { background: "linear-gradient(135deg,#f97316,#ef4444)", boxShadow: "0 4px 15px rgba(249,115,22,0.4)" } : {}}>
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {tab === "discover" && <DiscoverTab items={discoverItems} onUserSelect={onUserSelect} myProfile={myProfile} />}
        {tab === "trending" && <TrendingTab moments={trendingMoments} onUserSelect={onUserSelect} myProfile={myProfile} />}
        {tab === "rooms" && <RoomsTab rooms={topRooms} onRoomSelect={onRoomSelect} />}
        {tab === "people" && <PeopleTab onUserSelect={onUserSelect} />}
      </div>
    </div>
  );
}

// ── Discover Tab (Grid) ──
function DiscoverTab({ items, onUserSelect, myProfile }: any) {
  const [selected, setSelected] = useState<any>(null);

  if (!items) return <LoadingSpinner />;
  if (items.length === 0) return <EmptyState emoji="🔭" text="لا يوجد محتوى للاكتشاف بعد" />;

  return (
    <div className="p-2">
      {selected && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="relative max-w-sm w-full rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={selected.imageUrl} alt="" className="w-full object-cover max-h-[70vh]" />
            <div className="absolute inset-x-0 bottom-0 p-4" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.9),transparent)" }}>
              <button onClick={() => onUserSelect(selected.userId)} className="flex items-center gap-2">
                <UserAvatar userId={selected.userId} avatarUrl={selected.profile?.avatarUrl} name={selected.profile?.name} size={32} showFrame showVipFrame vipLevel={selected.profile?.vipLevel} />
                <span className="text-white font-bold text-sm">{selected.profile?.name ?? "مجهول"}</span>
              </button>
              {selected.content && <p className="text-gray-300 text-xs mt-2 line-clamp-2">{selected.content}</p>}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-gray-400 text-xs">❤️ {selected.likes ?? 0}</span>
                <span className="text-gray-400 text-xs">💬 {selected.commentsCount ?? 0}</span>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1">
        {items.map((item: any, i: number) => (
          <button key={item._id} onClick={() => setSelected(item)}
            className="relative rounded-xl overflow-hidden active:scale-95 transition-transform"
            style={{ aspectRatio: i % 7 === 0 ? "1/2" : "1/1", gridRow: i % 7 === 0 ? "span 2" : "span 1" }}>
            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            {(item.likes ?? 0) > 10 && (
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 rounded-full px-1.5 py-0.5">
                <span className="text-[9px] text-red-400">❤️</span>
                <span className="text-[9px] text-white font-bold">{formatCount(item.likes)}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Trending Tab ──
function TrendingTab({ moments, onUserSelect, myProfile }: any) {
  if (!moments) return <LoadingSpinner />;
  if (moments.length === 0) return <EmptyState emoji="🔥" text="لا يوجد ترند بعد" />;

  return (
    <div className="p-4 space-y-3">
      {/* Banner */}
      <div className="rounded-3xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1a0500,#3d0f00,#1a0500)", border: "1px solid rgba(249,115,22,0.4)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 50%,rgba(249,115,22,0.8),transparent 60%)" }} />
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-4xl">🔥</span>
          <div>
            <p className="text-white font-black text-base">الأكثر تفاعلاً</p>
            <p className="text-orange-400/70 text-xs">المنشورات الأعلى إعجاباً اليوم</p>
          </div>
        </div>
      </div>

      {moments.map((moment: any, idx: number) => {
        const vipCfg = getVipConfig(moment.profile?.vipLevel);
        return (
          <div key={moment._id} className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-start gap-3 p-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm"
                style={{ background: idx < 3 ? "linear-gradient(135deg,#f97316,#ef4444)" : "rgba(255,255,255,0.1)", color: idx < 3 ? "#000" : "#6b7280" }}>
                {idx + 1}
              </div>
              <button onClick={() => onUserSelect(moment.userId)} className="flex-shrink-0">
                <UserAvatar userId={moment.userId} avatarUrl={moment.profile?.avatarUrl} name={moment.profile?.name} size={40} showFrame showVipFrame vipLevel={moment.profile?.vipLevel} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {moment.profile?.isVip
                    ? <VipName name={moment.profile?.name ?? "مجهول"} level={moment.profile?.vipLevel} />
                    : <span className="text-white font-bold text-sm">{moment.profile?.name ?? "مجهول"}</span>
                  }
                </div>
                {moment.content && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{moment.content}</p>}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-red-400 font-bold">❤️ {(moment.likes ?? 0).toLocaleString()}</span>
                  <span className="text-xs text-gray-500">💬 {moment.commentsCount ?? 0}</span>
                </div>
              </div>
              {moment.imageUrl && (
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={moment.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Rooms Tab ──
function RoomsTab({ rooms, onRoomSelect }: any) {
  if (!rooms) return <LoadingSpinner />;
  if (rooms.length === 0) return <EmptyState emoji="🎙️" text="لا توجد غرف نشطة" />;

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-3xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#000d1a,#001a33,#000d1a)", border: "1px solid rgba(6,182,212,0.4)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 70% 50%,rgba(6,182,212,0.8),transparent 60%)" }} />
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-4xl">🎙️</span>
          <div>
            <p className="text-white font-black text-base">الغرف الأكثر نشاطاً</p>
            <p className="text-cyan-400/70 text-xs">الغرف بأعلى عدد أعضاء الآن</p>
          </div>
        </div>
      </div>

      {rooms.map((room: any, idx: number) => (
        <button key={room._id} onClick={() => onRoomSelect?.(room._id)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl active:scale-[0.98] transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: idx < 3 ? "linear-gradient(135deg,#06b6d4,#0891b2)" : "rgba(255,255,255,0.1)", color: idx < 3 ? "#000" : "#6b7280" }}>
            {idx + 1}
          </div>
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            {room.coverUrl
              ? <img src={room.coverUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"><span className="text-xl">🎙️</span></div>
            }
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-white font-bold text-sm truncate">{room.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">👥 {room.memberCount ?? 0}</span>
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-400">مباشر</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── People Tab ──
function PeopleTab({ onUserSelect }: any) {
  const leaderboard = useQuery(api.leaderboards.getWealthLeaderboard);

  if (!leaderboard) return <LoadingSpinner />;

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-3xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0a0500,#1a0d00,#0a0500)", border: "1px solid rgba(251,191,36,0.4)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 50% 50%,rgba(251,191,36,0.8),transparent 60%)" }} />
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-4xl">💰</span>
          <div>
            <p className="text-white font-black text-base">أثرى المستخدمين</p>
            <p className="text-yellow-400/70 text-xs">الأعلى في قائمة الثروة</p>
          </div>
        </div>
      </div>

      {leaderboard.slice(0, 20).map((user: any, idx: number) => {
        const vipCfg = getVipConfig(user.vipLevel);
        return (
          <button key={user.userId} onClick={() => onUserSelect(user.userId)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl active:scale-[0.98] transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: idx < 3 ? "linear-gradient(135deg,#fbbf24,#d97706)" : "rgba(255,255,255,0.1)", color: idx < 3 ? "#000" : "#6b7280" }}>
              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
            </div>
            <UserAvatar userId={user.userId} avatarUrl={user.avatarUrl} name={user.name} size={44} showFrame showVipFrame vipLevel={user.vipLevel} />
            <div className="flex-1 min-w-0 text-right">
              {user.isVip
                ? <VipName name={user.name ?? "مجهول"} level={user.vipLevel} />
                : <p className="text-white font-bold text-sm truncate">{user.name ?? "مجهول"}</p>
              }
              <p className="text-yellow-400 text-xs mt-0.5 font-bold">💰 {formatCount(user.totalCoinsReceived ?? 0)}</p>
            </div>
            {user.vipLevel && (
              <div className="flex-shrink-0 px-2 py-1 rounded-xl text-[10px] font-black"
                style={{ background: vipCfg?.frameGradient ?? "rgba(168,85,247,0.2)", color: "#000" }}>
                VIP{user.vipLevel}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <span className="text-5xl">{emoji}</span>
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}
