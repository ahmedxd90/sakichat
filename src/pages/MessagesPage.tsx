import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ChatPage from "./ChatPage";
import { VipName, VipBadge } from "../components/VipBadge";
import SystemNotificationsPage from "./SystemNotificationsPage";
import SocialNotificationsPage from "./SocialNotificationsPage";
import UserAvatar from "../components/UserAvatar";
import FriendsPage from "./FriendsPage";
import LevelBadgeInline from "../components/LevelBadgeInline";
import { useLang } from "../hooks/useLang";

type TabType = "messages" | "friends";
type SubPageType = "system" | "social" | "requests" | null;

interface MessagesPageProps {
  onUserSelect?: (userId: Id<"users">) => void;
}

function LineIcon({ name, className = "w-6 h-6" }: { name: string; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactNode> = {
    "user-plus": <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></>,
    "compass": <><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>,
    "message-square": <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    "search": <><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></>,
    "user-check": <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></>,
    "system": <path d="M12 2C8.69 2 6 4.69 6 8c0 3.31 2.69 8 6 14 3.31-6 6-10.69 6-14 0-3.31-2.69-6-6-6zm0 8.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 5.5 12 5.5s2.5 1.12 2.5 2.5S13.38 10.5 12 10.5z" fill="currentColor" stroke="none" />,
  };
  return <svg {...common}>{icons[name] || null}</svg>;
}

export default function MessagesPage({ onUserSelect }: MessagesPageProps) {
  const { lang } = useLang();
  const conversations = useQuery(api.messages.getConversations);
  const [openChat, setOpenChat] = useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [subPage, setSubPage] = useState<SubPageType>(null);
  const [searchQuery, setSearchBar] = useState("");

  const unreadCount = useQuery(api.messages.getTotalUnreadCount) ?? 0;
  const systemUnreadCount = useQuery(api.notifications.getUnreadCount) ?? 0;
  const requestsCount = useQuery(api.friends.getPendingRequestsCount) ?? 0;
  const friends = useQuery(api.friends.getFriends) ?? [];
  const onlineFriendsCount = friends.filter(f => f.isOnline).length;

  if (openChat) {
    return (
      <div className="fixed inset-0 z-[200] bg-white animate-slide-up-sheet">
        <ChatPage
          otherUserId={openChat}
          onBack={() => setOpenChat(null)}
          onViewProfile={(uid) => { setOpenChat(null); onUserSelect?.(uid); }}
        />
      </div>
    );
  }

  if (subPage === "system") return <div className="fixed inset-0 z-[300] bg-white"><SystemNotificationsPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "social") return <div className="fixed inset-0 z-[300] bg-white"><SocialNotificationsPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "requests") return <div className="fixed inset-0 z-[300] bg-white"><FriendsPage onBack={() => setSubPage(null)} onViewProfile={onUserSelect} onMessage={setOpenChat} /></div>;

  const filteredFriends = searchQuery.trim() 
    ? friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.sakiId?.includes(searchQuery))
    : friends;

  return (
    <div className="messages-container" dir="rtl">
      {/* ==================== MAIN HEADER ==================== */}
      <header className="messages-header">
        <div className="header-tabs">
          <button 
            onClick={() => setActiveTab("messages")} 
            className={`tab-btn ${activeTab === "messages" ? "active" : ""}`}
          >
            {lang === "en" ? "Messages" : "الرسائل"}
          </button>
          <button 
            onClick={() => setActiveTab("friends")} 
            className={`tab-btn ${activeTab === "friends" ? "active" : ""}`}
          >
            {lang === "en" ? "Friends" : "الأصدقاء"}
          </button>
        </div>
      </header>

      {/* ==================== MESSAGES TAB ==================== */}
      {activeTab === "messages" && (
        <main className="messages-main space-y-6">
          {/* Action Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* 1. Friend Requests */}
            <div onClick={() => setSubPage("requests")} className="action-card">
              <div className="action-icon icon-grad-blue">
                <LineIcon name="user-plus" className="w-8 h-8 text-white" />
                {requestsCount > 0 && (
                  <span className="badge-red">{requestsCount > 99 ? "99+" : requestsCount}</span>
                )}
              </div>
              <span className="action-label">{lang === "en" ? "Requests" : "طلبات الصداقة"}</span>
            </div>

            {/* 2. System */}
            <div onClick={() => setSubPage("system")} className="action-card">
              <div className="action-icon icon-grad-pink">
                <LineIcon name="system" className="w-8 h-8 text-white" />
                {systemUnreadCount > 0 && (
                  <span className="badge-red">{systemUnreadCount > 99 ? "99+" : systemUnreadCount}</span>
                )}
              </div>
              <span className="action-label">{lang === "en" ? "System" : "النظام"}</span>
            </div>

            {/* 3. Social */}
            <div onClick={() => setSubPage("social")} className="action-card">
              <div className="action-icon icon-grad-orange">
                <LineIcon name="compass" className="w-8 h-8 text-white" />
              </div>
              <span className="action-label">{lang === "en" ? "Social" : "الاجتماعية"}</span>
            </div>
          </div>

          {/* Conversations List */}
          <div className="conversations-list">
            {!conversations ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <LineIcon name="message-square" className="w-8 h-8" />
                </div>
                <p className="empty-text-main">{lang === "en" ? "No current chats" : "لا يوجد دردشات حالية"}</p>
                <p className="empty-text-sub">{lang === "en" ? "Message friends from the Friends tab" : "يمكنك مراسلة أصدقائك من تبويب الأصدقاء"}</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isVip = conv.otherProfile?.isVip ?? false;
                return (
                  <div 
                    key={conv.otherId}
                    onClick={() => setOpenChat(conv.otherId as Id<"users">)}
                    className="conversation-item item-press"
                  >
                    <div className="relative">
                      <UserAvatar
                        userId={conv.otherId as Id<"users">}
                        avatarUrl={conv.otherProfile?.avatarUrl}
                        name={conv.otherProfile?.name}
                        size={52}
                      />
                      {conv.otherProfile?.isOnline && (
                        <span className="online-indicator"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 min-w-0">
                          {isVip ? (
                            <VipName name={conv.otherProfile?.name ?? "مجهول"} className="text-sm font-bold truncate" />
                          ) : (
                            <h4 className="text-sm font-bold text-gray-800 truncate">{conv.otherProfile?.name ?? "مجهول"}</h4>
                          )}
                          <LevelBadgeInline wealthLevel={conv.otherProfile?.wealthLevel} charismaLevel={conv.otherProfile?.charismaLevel} size="xs" />
                        </div>
                        <span className="text-[10px] font-medium text-gray-400">{formatTime(conv.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.content}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="unread-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* ==================== FRIENDS TAB ==================== */}
      {activeTab === "friends" && (
        <main className="messages-main space-y-4 pt-4">
          {/* Search Bar */}
          <div className="search-bar-container">
            <LineIcon name="search" className="search-icon" />
            <input 
              type="text" 
              placeholder={lang === "en" ? "Search by name or ID..." : "البحث عن صديق بالاسم أو ID..."} 
              value={searchQuery}
              onChange={(e) => setSearchBar(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="friends-stats">
            <span>{lang === "en" ? `Friends (${friends.length})` : `قائمة الأصدقاء (${friends.length})`}</span>
            <span className="online-count">
              <LineIcon name="user-check" className="w-3.5 h-3.5" /> 
              {lang === "en" ? `Online (${onlineFriendsCount})` : `متصل الآن (${onlineFriendsCount})`}
            </span>
          </div>

          <div className="friends-list space-y-2">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs font-bold">
                {lang === "en" ? "No friends found" : "لا يوجد أصدقاء"}
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div key={friend.userId} className="friend-item">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <UserAvatar
                        userId={friend.userId}
                        avatarUrl={friend.avatarUrl}
                        name={friend.name}
                        size={48}
                      />
                      {friend.isOnline && <span className="online-indicator"></span>}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">{friend.name}</h4>
                      <p className={`text-[11px] font-medium ${friend.isOnline ? "text-emerald-600" : "text-gray-400"}`}>
                        {friend.isOnline ? (lang === "en" ? "Online" : "متصل الآن") : (lang === "en" ? "Offline" : "غير متصل")}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setOpenChat(friend.userId)}
                    className="message-btn"
                  >
                    {lang === "en" ? "Message" : "مراسلة"}
                  </button>
                </div>
              ))
            )}
          </div>
        </main>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        
        .messages-container {
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #EBF5FF 0%, #F5F9FF 30%, #FFFFFF 100%);
          display: flex;
          flex-direction: column;
          font-family: 'Tajawal', sans-serif;
        }

        .messages-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          padding: 16px 24px 12px;
          display: flex;
          justify-content: center;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-tabs {
          display: flex;
          align-items: center;
          gap: 48px;
        }

        .tab-btn {
          position: relative;
          transition: all 0.3s ease;
          background: none;
          border: none;
          outline: none;
          cursor: pointer;
          color: #94A3B8;
          font-weight: 600;
          font-size: 1.15rem;
        }

        .tab-btn.active {
          color: #1E293B;
          font-weight: 800;
          font-size: 1.35rem;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 4px;
          background: linear-gradient(90deg, #3B82F6, #60A5FA);
          border-radius: 4px;
        }

        .messages-main {
          flex: 1;
          padding: 20px 16px 100px;
          overflow-y: auto;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .action-card:active {
          transform: scale(0.95);
        }

        .action-icon {
          width: 64px;
          height: 64px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .icon-grad-blue {
          background: linear-gradient(135deg, #4FA8FF 0%, #2575FC 100%);
          box-shadow: 0 6px 16px rgba(37, 117, 252, 0.25);
        }

        .icon-grad-pink {
          background: linear-gradient(135deg, #FF758C 0%, #FF7EB3 100%);
          box-shadow: 0 6px 16px rgba(255, 117, 140, 0.25);
        }

        .icon-grad-orange {
          background: linear-gradient(135deg, #FFB347 0%, #FFCC33 100%);
          box-shadow: 0 6px 16px rgba(255, 179, 71, 0.25);
        }

        .badge-red {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 800;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .action-label {
          font-size: 12px;
          font-weight: 700;
          color: #374151;
        }

        .empty-state {
          padding-top: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 999px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d1d5db;
        }

        .empty-text-main {
          font-size: 12px;
          font-weight: 700;
          color: #9ca3af;
        }

        .empty-text-sub {
          font-size: 11px;
          color: #d1d5db;
        }

        .conversation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: white;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .conversation-item:active {
          transform: scale(0.98);
          background: #f8fafc;
        }

        .online-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 12px;
          height: 12px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 999px;
        }

        .unread-badge {
          width: 20px;
          height: 20px;
          background: #10b981;
          color: white;
          font-size: 10px;
          font-weight: 800;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Friends Styles */
        .search-bar-container {
          position: relative;
        }

        .search-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          background: rgba(243, 244, 246, 0.8);
          border-radius: 16px;
          padding: 10px 44px 10px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          outline: none;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          background: white;
          border-color: #60A5FA;
          box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.1);
        }

        .friends-stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
        }

        .online-count {
          color: #2563eb;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .friend-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: white;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .message-btn {
          padding: 6px 14px;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .message-btn:hover {
          background: #dbeafe;
        }

        .item-press:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes}د`;
  if (hours < 24) return `${hours}س`;
  if (days < 7) return `${days}ي`;
  return new Date(timestamp).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}
