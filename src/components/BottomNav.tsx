import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import { useLang } from "../hooks/useLang";

// Style reminder: Saki bottom navigation uses a clean white surface, cobalt-blue active state, real SVG icons, and restrained motion.
type IconProps = { active: boolean };

function IconHome({ active }: IconProps) {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10.8 9-7.3 9 7.3" /><path d="M5.5 9.5V20h13V9.5" /><path d="M9.5 20v-5.3h5V20" /></svg>;
}

function IconMoments({ active }: IconProps) {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 1.45 4.45L18 9l-4.55 1.55L12 15l-1.45-4.45L6 9l4.55-1.55L12 3Z" fill={active ? "currentColor" : "none"} /><path d="m19 14 .65 2.35L22 17l-2.35.65L19 20l-.65-2.35L16 17l2.35-.65L19 14Z" fill={active ? "currentColor" : "none"} /><path d="M5 14v4M3 16h4" /></svg>;
}

function IconMessages({ active }: IconProps) {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 11.5c0 4.1-3.8 7.5-8.5 7.5-1 0-2-.15-2.9-.45L5 20l.95-3.1C4.72 15.55 4 13.65 4 11.5 4 7.35 7.8 4 12.5 4s8.5 3.35 8.5 7.5Z" /><path d="M8 11.5h.01M12.5 11.5h.01M17 11.5h.01" strokeWidth="2.5" /></svg>;
}

function IconProfile({ active }: IconProps) {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.4" /><path d="M4.8 20c.65-3.2 3.25-5.1 7.2-5.1s6.55 1.9 7.2 5.1" /></svg>;
}

export default function BottomNav({ currentPage, setCurrentPage }: {
  currentPage: Page;
  setCurrentPage: (p: Page) => void;
}) {
  const friendsCount = useQuery(api.friends.getPendingRequestsCount) ?? 0;
  const msgUnread = useQuery(api.messages.getTotalUnreadCount) ?? 0;
  const totalMsgBadge = msgUnread + friendsCount;
  const { tr } = useLang();

  const tabs = [
    { id: "home" as Page, label: tr("nav_home"), Icon: IconHome },
    { id: "moments" as Page, label: tr("nav_moments"), Icon: IconMoments },
    { id: "messages" as Page, label: tr("nav_messages"), Icon: IconMessages },
    { id: "me" as Page, label: tr("nav_me"), Icon: IconProfile },
  ];

  return (
    <nav aria-label="التنقل الرئيسي" className="saki-bottom-nav">
      <style>{`
        .saki-bottom-nav{position:fixed;bottom:0;right:0;left:0;height:78px;background:rgba(255,255,255,.97);display:flex;flex-direction:row;justify-content:space-around;align-items:center;border-top:1px solid rgba(226,232,240,.92);box-shadow:0 -10px 30px rgba(15,23,42,.08);backdrop-filter:blur(18px);z-index:150;padding-bottom:env(safe-area-inset-bottom);font-family:'Cairo',sans-serif}
        .saki-bottom-nav__button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:68px;color:#94a3b8;cursor:pointer;transition:color 180ms ease,transform 160ms ease;background:none;border:0;padding:6px 12px 5px;gap:4px;border-radius:18px;outline:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
        .saki-bottom-nav__button:focus-visible{box-shadow:0 0 0 3px rgba(37,99,235,.24)}
        .saki-bottom-nav__button:active{transform:scale(.94)}
        .saki-bottom-nav__button.is-active{color:#1d4ed8;transform:translateY(-2px)}
        .saki-bottom-nav__icon{display:flex;align-items:center;justify-content:center;width:42px;height:32px;border-radius:15px;transition:background 180ms ease,transform 180ms cubic-bezier(.23,1,.32,1),box-shadow 180ms ease}
        .saki-bottom-nav__button.is-active .saki-bottom-nav__icon{background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;transform:scale(1.05);box-shadow:0 7px 18px rgba(37,99,235,.25);animation:sakiNavPop 320ms cubic-bezier(.23,1,.32,1)}
        .saki-bottom-nav__label{font-size:11px;font-weight:700;line-height:1;white-space:nowrap}
        .saki-bottom-nav__button.is-active .saki-bottom-nav__label{font-weight:900}
        @keyframes sakiNavPop{0%{opacity:.65;transform:translateY(3px) scale(.88)}70%{opacity:1;transform:translateY(-1px) scale(1.08)}100%{opacity:1;transform:translateY(0) scale(1.05)}}
        @media(prefers-reduced-motion:reduce){.saki-bottom-nav__button,.saki-bottom-nav__icon{transition:none!important}.saki-bottom-nav__button.is-active .saki-bottom-nav__icon{animation:none!important}}
      `}</style>
      {tabs.map((tab) => {
        const active = currentPage === tab.id;
        const showBadge = tab.id === "messages";
        return (
          <button key={tab.id} className={`saki-bottom-nav__button${active ? " is-active" : ""}`} onClick={() => setCurrentPage(tab.id)} aria-current={active ? "page" : undefined} aria-label={tab.label}>
            <span className="saki-bottom-nav__icon"><tab.Icon active={active} /></span>
            <span className="saki-bottom-nav__label">{tab.label}</span>
            {showBadge && totalMsgBadge > 0 && <span style={{ position: "absolute", top: 0, right: 7, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 999, background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900 }}>{totalMsgBadge > 9 ? "9+" : totalMsgBadge}</span>}
          </button>
        );
      })}
    </nav>
  );
}
