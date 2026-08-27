// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { formatNumber } from "../lib/formatNumber";
import UserAvatar from "../components/UserAvatar";
import { VipBadge } from "../components/VipBadge";

type Tab = "followers" | "following" | "visitors";

interface FollowersPageProps {
  initialTab?: Tab;
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IcFollowing({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20"
      stroke={active ? "#a855f7" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  );
}
function IcFollowers({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20"
      stroke={active ? "#a855f7" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function IcVisitors({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20"
      stroke={active ? "#a855f7" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function IcBack() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20"
      stroke="#555" strokeWidth="2.5" strokeLinecap="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}

export default function FollowersPage({ initialTab = "followers", onBack, onViewProfile }: FollowersPageProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [visitorsData, setVisitorsData] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: me } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setMyProfile(me);
        const { data: flwers } = await supabase.from('follows').select('*, profile:profiles!follows_follower_id_fkey(*)').eq('following_id', user.id);
        setFollowers(flwers || []);
        const { data: flwing } = await supabase.from('follows').select('*, profile:profiles!follows_following_id_fkey(*)').eq('follower_id', user.id);
        setFollowing(flwing || []);
        const { data: v } = await supabase.from('profile_visitors').select('*').eq('profile_id', user.id);
        setVisitorsData({ visitors: v || [], locked: (me?.vip_level || 0) < 4 });
      }
    };
    fetchData();
  }, []);

  const followUser = async (args: any) => {};

  const tabs = [
    { key: "following" as Tab, label: "متابَعة", Icon: IcFollowing },
    { key: "followers" as Tab, label: "المعجبون", Icon: IcFollowers },
    { key: "visitors" as Tab, label: "من زارني", Icon: IcVisitors },
  ];

  const renderList = () => {
    if (tab === "visitors") {
      if (!visitorsData) return <LoadingSpinner />;
      if (visitorsData.locked) {
        return (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
              <svg viewBox="0 0 24 24" fill="none" width="36" height="36" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h3 className="font-black text-xl mb-2" style={{ color: "#333" }}>ميزة VIP حصرية</h3>
            <p className="text-sm mb-1" style={{ color: "#666" }}>لرؤية من زار ملفك الشخصي</p>
            <p className="font-black text-base" style={{ color: "#f59e0b" }}>يجب أن تكون VIP 4 أو أعلى</p>
            <div className="mt-4 flex gap-2 flex-wrap justify-center">
              {[4, 5, 6, 7, 8].map((lvl) => (
                <span key={lvl} className="px-3 py-1 rounded-full text-xs font-black text-white"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                  VIP {lvl}
                </span>
              ))}
            </div>
          </div>
        );
      }
      if (visitorsData.visitors.length === 0) {
        return (
          <EmptyState
            icon={<IcVisitors />}
            text="لا يوجد زوار بعد"
            sub="سيظهر هنا من يزور ملفك الشخصي"
          />
        );
      }
      // مرتّب من الأحدث للأقدم
      const sorted = [...visitorsData.visitors].sort((a, b) => b.visitedAt - a.visitedAt);
      return (
        <div className="divide-y" style={{ borderColor: "#f5f5f5" }}>
          {sorted.map((v: any) => (
            <UserRow
              key={v.id}
              userId={v.visitorId}
              name={v.visitorName ?? "مستخدم"}
              avatarUrl={v.visitorAvatarUrl}
              isVip={v.visitorIsVip}
              vipLevel={v.visitorVipLevel}
              subtitle={timeAgo(v.visitedAt)}
              onPress={() => onViewProfile?.(v.visitorId)}
              actionButton={null}
            />
          ))}
        </div>
      );
    }

    const list = tab === "followers" ? followers : following;
    if (!list) return <LoadingSpinner />;
    if (list.length === 0) {
      return tab === "followers"
        ? <EmptyState icon={<IcFollowers />} text="لا يوجد معجبون بعد" sub="شارك ملفك لجذب المتابعين" />
        : <EmptyState icon={<IcFollowing />} text="لا تتابع أحداً بعد" sub="ابحث عن أشخاص لمتابعتهم" />;
    }

    return (
      <div className="divide-y" style={{ borderColor: "#f5f5f5" }}>
        {list.map((item: any) => {
          const p = item.profile;
          if (!p) return null;
          const isMe = p.userId === myProfile?.userId;
          return (
            <UserRow
              key={item.followId}
              userId={p.userId}
              name={p.name}
              avatarUrl={p.avatarUrl}
              isVip={p.isVip}
              vipLevel={p.vipLevel}
              subtitle={`ID: ${p.sakiId}`}
              onPress={() => onViewProfile?.(p.userId)}
              actionButton={
                !isMe ? (
                  <FollowButton targetUserId={p.userId} myUserId={myProfile?.userId} onFollow={followUser} />
                ) : null
              }
            />
          );
        })}
      </div>
    );
  };

  const count = tab === "followers"
    ? (followers?.length ?? 0)
    : tab === "following"
      ? (following?.length ?? 0)
      : (visitorsData?.visitors?.length ?? 0);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" dir="rtl"
      style={{ background: "#f8f9fa", fontFamily: "'Tajawal','Cairo',sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "#f5f5f5" }}>
          <IcBack />
        </button>
        <div className="flex-1">
          <h2 className="font-black text-lg" style={{ color: "#1a1a2e" }}>
            {tab === "followers" ? "المعجبون" : tab === "following" ? "متابَعة" : "من زارني"}
          </h2>
          <p className="text-xs font-semibold" style={{ color: "#aaa" }}>{formatNumber(count)} شخص</p>
        </div>
      </div>

      {/* Tabs — أيقونات SVG بدون إيموجي */}
      <div className="flex flex-shrink-0" style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        {tabs.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex flex-col items-center py-3 gap-1.5 transition-all active:scale-95"
              style={{
                borderBottom: isActive ? "2.5px solid #a855f7" : "2.5px solid transparent",
              }}
            >
              <t.Icon active={isActive} />
              <span className="text-[11px] font-bold" style={{ color: isActive ? "#a855f7" : "#aaa" }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#fff" }}>
        {renderList()}
      </div>
    </div>
  );
}

function UserRow({ userId, name, avatarUrl, isVip, vipLevel, subtitle, onPress, actionButton }: any) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <button onClick={onPress} className="flex-shrink-0 active:scale-95 transition-transform">
        <UserAvatar userId={userId} avatarUrl={avatarUrl} name={name} size={50} isVip={isVip} vipLevel={vipLevel} />
      </button>
      <button onClick={onPress} className="flex-1 min-w-0 text-right active:opacity-70 transition-opacity">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm truncate" style={{ color: "#1a1a2e" }}>{name}</span>
          {isVip && vipLevel && <VipBadge level={vipLevel} size="xs" />}
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: "#aaa" }}>{subtitle}</p>
      </button>
      {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
    </div>
  );
}

function FollowButton({ targetUserId, myUserId, onFollow }: any) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (targetUserId && myUserId) {
      supabase.from('follows').select('*').eq('follower_id', myUserId).eq('following_id', targetUserId).single().then(({ data }) => setIsFollowing(!!data));
    }
  }, [targetUserId, myUserId]);

  const handleFollow = async () => {
    if (loading) return;
    setLoading(true);
    try { await onFollow({ targetUserId }); } catch {}
    setLoading(false);
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className="px-4 py-1.5 rounded-full text-xs font-black active:scale-95 transition-all"
      style={{
        background: isFollowing ? "#f5f5f5" : "linear-gradient(135deg,#a855f7,#7c3aed)",
        color: isFollowing ? "#888" : "#fff",
        border: isFollowing ? "1px solid #e0e0e0" : "none",
        minWidth: 72,
      }}
    >
      {loading ? "..." : isFollowing ? "إلغاء" : "متابعة"}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "#f5f5f5" }}>
        <div style={{ transform: "scale(1.8)", opacity: 0.4 }}>{icon}</div>
      </div>
      <p className="font-bold text-base" style={{ color: "#555" }}>{text}</p>
      <p className="text-sm mt-1" style={{ color: "#aaa" }}>{sub}</p>
    </div>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return new Date(ts).toLocaleDateString("ar");
}
