// @ts-nocheck
import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { PRIVATE_AVATAR_URL, PRIVATE_DISPLAY_NAME } from "../../lib/privateUser";
import UserAvatar from "../UserAvatar";
import { toast } from "../../lib/toast";
import LuckyBagChatBubble from "../LuckyBagChatBubble";
import { LevelPillBadge } from "../LevelBadgeInline";
import { VipBadge, VipTitle, SuperAdminBadge } from "../VipBadge";
import { AristocracyBadge } from "../AristocracyBadge";
import { ContentCreatorBadgeIf } from "../ContentCreatorBadge";

type Tab = "all" | "chat" | "gifts";

interface RoomChatAreaProps {
  messages: any[];
  myProfile: any;
  members: any[];
  isCp: boolean;
  isMusic: boolean;
  roomId: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSelectUser: (member: any) => void;
}

// ── لون الاسم: استقراطية أولاً ──
const ARISTO_COLORS: Record<number, string> = {
  1: "#60a5fa", 2: "#34d399", 3: "#a78bfa",
  4: "#f472b6", 5: "#fb923c", 6: "#f97316",
  7: "#ffd700", 8: "#e879f9",
};
function getNameStyle(profile: any, vipConfig?: any): React.CSSProperties {
  const al = profile?.aristocracyLevel ?? 0;
  const ae = profile?.aristocracyExpiresAt ?? null;
  if (al > 0 && ae && ae > Date.now()) {
    const c = ARISTO_COLORS[al] ?? "#60a5fa";
    return { color: c, textShadow: `0 0 10px ${c}80` };
  }
  if (vipConfig?.nameColor) return { color: vipConfig.nameColor, textShadow: `0 0 8px ${vipConfig.nameColor}70` };
  if (profile?.isSuperAdmin) return { color: "#ffd700", textShadow: "0 0 8px rgba(255,215,0,0.7)" };
  if (profile?.isVip) return { color: "#fbbf24" };
  return { color: "#e2e8f0" };
}

// ── دالة مساعدة لبناء style الفقاعة ──
function buildBubbleStyle(bubbleUrl: string | null | undefined, aristocracyLevel = 0): React.CSSProperties {
  const base: React.CSSProperties = {
    color: "#fff",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
    borderRadius: "16px 16px 4px 16px",
  };
  if (bubbleUrl) {
    return {
      ...base,
      backgroundImage: `url(${bubbleUrl})`,
      backgroundSize: "100% 100%",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      border: "1px solid rgba(255,255,255,0.18)",
    };
  }
  const royalBubbles: Record<number, { background: string; border: string; shadow: string }> = {
    1: { background: "linear-gradient(135deg,rgba(37,99,235,.78),rgba(14,165,233,.42))", border: "rgba(125,211,252,.72)", shadow: "rgba(56,189,248,.24)" },
    2: { background: "linear-gradient(135deg,rgba(5,150,105,.82),rgba(16,185,129,.42))", border: "rgba(110,231,183,.72)", shadow: "rgba(16,185,129,.24)" },
    3: { background: "linear-gradient(135deg,rgba(109,40,217,.82),rgba(168,85,247,.44))", border: "rgba(216,180,254,.75)", shadow: "rgba(168,85,247,.28)" },
    4: { background: "linear-gradient(135deg,rgba(190,24,93,.84),rgba(244,114,182,.44))", border: "rgba(251,182,206,.78)", shadow: "rgba(244,114,182,.28)" },
    5: { background: "linear-gradient(135deg,rgba(194,65,12,.86),rgba(251,146,60,.46))", border: "rgba(253,186,116,.8)", shadow: "rgba(251,146,60,.3)" },
    6: { background: "linear-gradient(135deg,rgba(154,52,18,.9),rgba(249,115,22,.48),rgba(250,204,21,.25))", border: "rgba(253,186,116,.85)", shadow: "rgba(249,115,22,.32)" },
    7: { background: "linear-gradient(135deg,rgba(120,53,15,.9),rgba(234,179,8,.55),rgba(255,247,174,.2))", border: "rgba(253,224,71,.9)", shadow: "rgba(250,204,21,.38)" },
    8: { background: "linear-gradient(135deg,rgba(88,28,135,.92),rgba(192,132,252,.5),rgba(250,204,21,.24))", border: "rgba(233,213,255,.9)", shadow: "rgba(192,132,252,.4)" },
  };
  const royal = royalBubbles[Math.max(0, Math.min(8, Number(aristocracyLevel) || 0))];
  if (royal) return { ...base, background: royal.background, border: `1px solid ${royal.border}`, boxShadow: `0 0 14px ${royal.shadow}, inset 0 1px rgba(255,255,255,.18)` };
  return { ...base, background: "linear-gradient(135deg,rgba(3,7,18,.88),rgba(15,23,42,.66))", border: "1px solid rgba(148,163,184,.24)", boxShadow: "0 6px 18px rgba(0,0,0,.22), inset 0 1px rgba(255,255,255,.06)" };
}

// ── Gift Bubble ──
const GiftBubble = memo(function GiftBubble({ m, onAvatarClick }: { m: any; onAvatarClick: (m: any) => void }) {
  const qty = m.giftQuantity ?? 1;
  const mult = m.luckMultiplier;
  const isLuckGift = m.content?.includes("حظ") || m.giftEmoji === "🍀";
  const hasWin = mult && mult > 0;
  const isMaxLuck = mult === 1000;
  const isBigLuck = mult && mult >= 500 && mult < 1000;
  const winAmount = hasWin ? (m.luckWinAmount ?? 0) : 0;
  const displayName = m.senderIsPrivate ? PRIVATE_DISPLAY_NAME : (m.senderName ?? "مجهول");

  const borderColor = hasWin
    ? (isMaxLuck ? "#ffd700" : isBigLuck ? "#cc00ff" : "#00ff88")
    : isLuckGift ? "#4ade80" : "#f44336";
  const bgColor = hasWin
    ? (isMaxLuck ? "rgba(255,215,0,0.12)" : isBigLuck ? "rgba(204,0,255,0.1)" : "rgba(0,255,136,0.08)")
    : isLuckGift ? "rgba(74,222,128,0.06)" : "rgba(244,67,54,0.1)";

  return (
    <div className="flex gap-1.5 items-end">
      <button onClick={() => onAvatarClick(m)} className="flex-shrink-0 self-end">
        <UserAvatar userId={m.sender_id as string} avatarUrl={m.senderIsPrivate ? PRIVATE_AVATAR_URL : m.senderAvatar} name={m.senderIsPrivate ? PRIVATE_DISPLAY_NAME : m.senderName} size={30} showFrame={false} />
      </button>
      <div className="max-w-[88%] flex flex-col gap-0.5 items-start">
        <span className="text-[9px] font-bold text-yellow-400 truncate max-w-[80px]">{displayName}</span>
        <div className="rounded-2xl rounded-bl-sm overflow-hidden"
          style={{ background: bgColor, border: `1px solid ${borderColor}50`, boxShadow: hasWin ? `0 0 10px ${borderColor}25` : "none" }}>
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            {m.giftImageUrl
              ? <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border border-white/10"><img src={m.giftImageUrl} alt={m.giftName} className="w-full h-full object-cover" /></div>
              : <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ background: "rgba(0,0,0,0.3)" }}>{isLuckGift ? "🍀" : "🎁"}</div>
            }
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white/50 text-[9px]">→</span>
                <span className="text-white text-[9px] font-bold truncate max-w-[55px]">{m.receiverName}</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[9px] font-bold" style={{ color: borderColor }}>{m.giftName}</span>
                <span className="text-[8px] font-black px-1 py-0.5 rounded-full" style={{ background: `${borderColor}25`, color: borderColor }}>×{qty}</span>
                {hasWin && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isMaxLuck ? "linear-gradient(135deg,#ffd700,#ff8c00)" : isBigLuck ? "linear-gradient(135deg,#cc00ff,#7700cc)" : "rgba(0,255,136,0.2)",
                      color: isMaxLuck ? "#000" : "#fff",
                      boxShadow: isMaxLuck ? "0 0 8px rgba(255,215,0,0.7)" : isBigLuck ? "0 0 8px rgba(204,0,255,0.5)" : "none",
                      animation: isMaxLuck ? "pulse 1s infinite" : "none",
                    }}>
                    {isMaxLuck ? "🎉 مبروك ×1000" : `×${mult}🍀`}
                  </span>
                )}
                {isLuckGift && !hasWin && (
                  <span className="text-[8px] px-1 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
                    🍀 بدون حظ
                  </span>
                )}
              </div>
              {hasWin && winAmount > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-[8px]">🪙</span>
                  <span className="text-[8px] font-black" style={{ color: isMaxLuck ? "#ffd700" : isBigLuck ? "#cc00ff" : "#00ff88" }}>
                    +{winAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── صف بيانات المرسل: الاسم ثم الصلاحية والألقاب ثم أيقونات المستويات ──
function RoomRoleIcon({ role }: { role?: string }) {
  if (role !== "owner" && role !== "admin") return null;
  const isOwner = role === "owner";
  return (
    <span
      title={isOwner ? "مالك الغرفة" : "مشرف الغرفة"}
      aria-label={isOwner ? "مالك الغرفة" : "مشرف الغرفة"}
      className="inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full"
      style={{
        color: isOwner ? "#fde68a" : "#93c5fd",
        background: isOwner ? "linear-gradient(135deg,#78350f,#f59e0b)" : "linear-gradient(135deg,#172554,#3b82f6)",
        boxShadow: isOwner ? "0 0 8px rgba(245,158,11,.55)" : "0 0 8px rgba(59,130,246,.45)",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {isOwner ? <><path d="m3 7 4 4 5-7 5 7 4-4-2 13H5L3 7Z" /><path d="M5 17h14" /></> : <><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>}
      </svg>
    </span>
  );
}

const SenderNameRow = memo(function SenderNameRow({ m, senderMember }: { m: any; senderMember: any }) {
  const profile = senderMember?.profile;
  const isPrivate = Boolean(profile?.isPrivateProfile);
  const displayName = isPrivate ? PRIVATE_DISPLAY_NAME : (m.senderName ?? "مجهول");
  const vipConfig = senderMember?.vipConfig;
  const isSuperAdmin = !isPrivate && Boolean(profile?.isSuperAdmin);
  const isVip = !isPrivate && Boolean(profile?.isVip);
  const aristocracyLevel = isPrivate ? 0 : Number(profile?.aristocracyLevel ?? 0);
  const wealthLevel = isPrivate ? 0 : Number(profile?.wealthLevel ?? 0);
  const charismaLevel = isPrivate ? 0 : Number(profile?.charismaLevel ?? 0);
  const nameStyle = getNameStyle(profile, vipConfig);

  return (
    <div className="flex max-w-[250px] flex-col items-start gap-0.5 mb-0.5">
      <div className="flex max-w-full items-center gap-1 flex-wrap" dir="rtl">
        <RoomRoleIcon role={isPrivate ? undefined : senderMember?.role} />
        <span className="max-w-[150px] truncate text-[11px] font-black" style={nameStyle}>{displayName}</span>
      </div>
      {!isPrivate && (
        <div className="flex max-w-full items-center gap-1 flex-wrap" dir="rtl">
          {aristocracyLevel > 0 && <AristocracyBadge level={aristocracyLevel} size="xs" />}
          {isVip && <VipTitle level={profile?.vipLevel} vipConfig={vipConfig} size="sm" />}
          {isSuperAdmin && <SuperAdminBadge size="sm" badgeUrl={profile?.superAdminBadgeUrl} title="سوبر أدمن" adminTitle={profile?.adminTitle} adminTitleColor1={profile?.adminTitleColor1} adminTitleColor2={profile?.adminTitleColor2} adminTitleIconUrl={profile?.adminTitleIconUrl} adminTitleBg={profile?.adminTitleBg} />}
          <ContentCreatorBadgeIf profile={profile} size="xs" />
          {wealthLevel > 0 && <LevelPillBadge level={wealthLevel} type="wealth" size="xs" />}
          {charismaLevel > 0 && <LevelPillBadge level={charismaLevel} type="charisma" size="xs" />}
        </div>
      )}
    </div>
  );
});

// ── رسالة واحدة ──
const MessageItem = memo(function MessageItem({ m, isMe, members, membersMap, onAvatarClick, onWelcome }: {
  m: any; isMe: boolean; members: any[]; membersMap?: Map<string, any>;
  onAvatarClick: (m: any) => void;
  onWelcome: (name: string) => void;
}) {
  const senderMember = membersMap?.get(m.sender_id) ?? members?.find((x: any) => x.profile?.user_id === m.sender_id);
  const isPrivate = Boolean(senderMember?.profile?.isPrivateProfile || m.isPrivateProfile || m.senderIsPrivate);
  if (m.type === "system") return (
    <div className="flex justify-center">
      <div className="rounded-xl px-3 py-1.5 max-w-[95%] w-full"
        style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,64,129,0.2)", borderRight: "3px solid #ff4081" }}>
        <p className="text-[10px] leading-relaxed" style={{ color: "#ffccbc" }}>{m.content}</p>
      </div>
    </div>
  );

  if (m.type === "join") return (
    <div className="flex items-end gap-1.5">
      <div className="flex-shrink-0 self-end w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#16a34a,#0f766e)", border: "2px solid rgba(134,239,172,0.75)", boxShadow: "0 0 12px rgba(34,197,94,0.35)" }}>
        <img src="/saki-icon.png" alt="نظام ساكي" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col gap-0.5 items-start max-w-[86%]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black" style={{ color: "#86efac" }}>نظام ساكي</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ color: "#bbf7d0", background: "rgba(34,197,94,0.18)", border: "1px solid rgba(134,239,172,0.3)" }}>رسالة النظام</span>
        </div>
        <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-[10px] leading-relaxed"
          style={{ background: "linear-gradient(135deg,rgba(22,163,74,0.28),rgba(15,118,110,0.24))", color: "#f0fdf4", border: "1px solid rgba(134,239,172,0.35)" }}>
          <span className="font-black" style={{ color: "#fde68a" }}>{isPrivate ? PRIVATE_DISPLAY_NAME : m.senderName}</span> انضم إلى الغرفة 👋
          <div className="mt-1.5 pt-1.5" style={{ borderTop: "1px solid rgba(187,247,208,0.18)" }}>
            مرحباً بكم في ساكي، نود إعلامكم أنه سيتم حظر أي محتوى غير لائق. نرجو أن يحترم كل منا الآخر والاستمتاع!
          </div>
        </div>
        <button onClick={() => onWelcome(m.senderName)}
          className="mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold active:scale-95 transition-transform"
          style={{ background: "rgba(255,64,129,0.15)", border: "1px solid rgba(255,64,129,0.35)", color: "#ff4081" }}>
          👋 ترحيب
        </button>
      </div>
    </div>
  );

  if (m.type === "leave") return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-0.5 max-w-[90%]"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {m.senderAvatar
          ? <img src={m.senderAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0" />
          : <div className="w-3.5 h-3.5 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><span className="text-white text-[6px] font-bold">{m.senderName?.[0]}</span></div>
        }
        <span className="text-gray-500 text-[9px]">{m.content}</span>
      </div>
    </div>
  );

  if (m.type === "gift") return <GiftBubble m={m} onAvatarClick={onAvatarClick} />;
  if (m.type === "lucky_bag") return <LuckyBagChatBubble m={m} />;

  if (m.type === "image") {
    return (
      <div className="flex gap-1.5 items-end">
        <button onClick={() => onAvatarClick(m)} className="flex-shrink-0 self-end">
          <UserAvatar userId={m.sender_id as string} avatarUrl={m.senderIsPrivate ? PRIVATE_AVATAR_URL : m.senderAvatar} name={m.senderIsPrivate ? PRIVATE_DISPLAY_NAME : m.senderName} size={32} showFrame={false}
            isVip={senderMember?.profile?.isVip} vipLevel={senderMember?.profile?.vipLevel} isSuperAdmin={senderMember?.profile?.isSuperAdmin} />
        </button>
        <div className="max-w-[72%] flex flex-col gap-0.5 items-start">
          <SenderNameRow m={m} senderMember={senderMember} />
          <div className="rounded-2xl overflow-hidden border border-white/10 p-0.5"
            style={isMe ? { background: "linear-gradient(135deg,#c9184a,#ff4081)" } : { background: "rgba(255,255,255,0.07)" }}>
            {(m.imageUrl || m.content) && <img src={m.imageUrl || m.content} alt="صورة" className="max-w-[180px] max-h-[180px] object-cover rounded-xl" />}
          </div>
        </div>
      </div>
    );
  }

  // ── رسالة نصية عادية ──
  // الأولوية: فقاعة مفعّلة من الحقيبة > فقاعة VIP التلقائية
  const chatBubbleUrl = senderMember?.activeChatBubbleUrl || null;
  const aristocracyLevel = senderMember?.profile?.isPrivateProfile ? 0 : Number(senderMember?.profile?.aristocracyLevel ?? 0);
  const bubbleStyle = buildBubbleStyle(chatBubbleUrl, aristocracyLevel);

  return (
    <div className="flex gap-1.5 items-end">
      <button onClick={() => onAvatarClick(m)} className="flex-shrink-0 self-end">
        <UserAvatar
          userId={m.sender_id as string}
          avatarUrl={senderMember?.profile?.isPrivateProfile ? PRIVATE_AVATAR_URL : m.senderAvatar}
          name={senderMember?.profile?.isPrivateProfile ? PRIVATE_DISPLAY_NAME : m.senderName}
          size={34}
          showFrame={false}
          isVip={senderMember?.profile?.isVip}
          vipLevel={senderMember?.profile?.vipLevel}
          isSuperAdmin={senderMember?.profile?.isSuperAdmin}
        />
      </button>
      <div className="flex flex-col gap-0.5 items-start" style={{ maxWidth: "75%" }}>
        <SenderNameRow m={m} senderMember={senderMember} />
        <div
          className="px-3 py-2 text-[11px] leading-relaxed rounded-2xl rounded-bl-sm"
          style={bubbleStyle}
        >
          {m.content}
        </div>
      </div>
    </div>
  );
});

export default function RoomChatArea({
  messages, myProfile, members, isCp, isMusic, roomId, messagesEndRef, onSelectUser,
}: RoomChatAreaProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const sendMessage = async ({ roomId, content }: { roomId: string, content: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('room_messages').insert({
      room_id: roomId,
      sender_id: user.id,
      content,
      type: 'chat'
    });
    if (error) throw error;
  };

  // Build a fast lookup map: userId -> member (avoids O(n) find on every message)
  const membersMap = useMemo(() => {
    const map = new Map<string, any>();
    (members ?? []).forEach((m) => { if (m.profile?.user_id) map.set(m.profile.userId, m); });
    return map;
  }, [members]);

  const allEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const giftsEndRef = useRef<HTMLDivElement>(null);

  const handleWelcome = useCallback(async (senderName: string) => {
    try {
      await sendMessage({ roomId, content: `مرحباً بك ${senderName} في غرفتنا 🎉 نورتنا 💜` });
    } catch (e: any) { toast.error(e); }
  }, [sendMessage, roomId]);

  const handleAvatarClick = useCallback((msg: any) => {
    const mb = membersMap.get(msg.senderId) ?? members?.find((x) => x.profile?.user_id === msg.senderId);
    if (mb) onSelectUser(mb);
  }, [membersMap, members, onSelectUser]);

  const giftTypes = new Set(["gift", "lucky_bag"]);
  const allMessages = messages ?? [];
  const chatMessages = allMessages.filter((m) => !giftTypes.has(m.type));
  const giftMessages = allMessages.filter((m) => giftTypes.has(m.type));

  useEffect(() => { allEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [allMessages.length]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages.length]);
  useEffect(() => { giftsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [giftMessages.length]);

  const accentColor = isCp ? "#ff4d6d" : "#a855f7";

  const ChatIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
  const AllIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
  const GiftIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );

  const tabs = [
    { key: "all" as Tab, label: "الكل", Icon: AllIcon },
    { key: "chat" as Tab, label: "الدردشة", Icon: ChatIcon },
    { key: "gifts" as Tab, label: "الهدايا", Icon: GiftIcon },
  ];

  const renderList = (list: any[], endRef: React.RefObject<HTMLDivElement>, isAll = false) => (
    <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2 min-h-0">
      {list.map((m) => (
        <MessageItem
          key={m.id}
          m={m}
          isMe={m.sender_id === myProfile?.user_id}
          members={members}
          membersMap={membersMap}
          onAvatarClick={handleAvatarClick}
          onWelcome={handleWelcome}
        />
      ))}
      <div ref={endRef} />
      {isAll && <div ref={messagesEndRef} />}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: "rgba(0,0,0,0.15)" }}>

      {/* ── Tab Bar ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 pt-1.5 pb-1">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full transition-all active:scale-95"
              style={{
                background: isActive ? accentColor : "rgba(255,255,255,0.07)",
                color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                border: isActive ? `1px solid ${accentColor}` : "1px solid rgba(255,255,255,0.1)",
                fontSize: 10, fontWeight: isActive ? 700 : 500,
              }}>
              <Icon /><span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {activeTab === "all" && renderList(allMessages, allEndRef, true)}
      {activeTab === "chat" && renderList(chatMessages, chatEndRef)}
      {activeTab === "gifts" && renderList(giftMessages, giftsEndRef)}
    </div>
  );
}
