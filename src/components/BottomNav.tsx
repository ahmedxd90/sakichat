// @ts-nocheck
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import { useLang } from "../hooks/useLang";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 576 512" fill="currentColor">
      {active ? (
        <path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/>
      ) : (
        <path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"/>
      )}
    </svg>
  );
}

function IconStar({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 576 512" fill="currentColor">
      {active ? (
        <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/>
      ) : (
        <path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0z"/>
      )}
    </svg>
  );
}

function IconPlay({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 512 512" fill="currentColor">
      {active ? (
        <path d="M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM188.3 147.1c-7.6 4.2-12.3 12.3-12.3 20.9l0 176c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88c-7.4-4.5-16.7-4.7-24.3-.5z"/>
      ) : (
        <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM188.3 147.1c7.6-4.2 16.8-4.1 24.3 .5l144 88c7.1 4.4 11.5 12.1 11.5 20.5s-4.4 16.1-11.5 20.5l-144 88c-7.4 4.5-16.7 4.7-24.3 .5s-12.3-12.3-12.3-20.9l0-176c0-8.7 4.7-16.7 12.3-20.9z"/>
      )}
    </svg>
  );
}

function IconLive({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3V9Z" fill={active ? "currentColor" : "none"} />
      <path d="M7 3v2M17 3v2" />
    </svg>
  );
}

function IconComment({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 512 512" fill="currentColor">
      {active ? (
        <path d="M256 448c141.4 0 256-93.1 256-208S397.4 32 256 32S0 125.1 0 240c0 45.1 17.7 86.8 47.7 120.9c-1.9 24.5-11.4 46.3-21.4 62.9c-5.5 9.2-11.1 16.6-15.2 21.6c-2.1 2.5-3.7 4.4-4.9 5.7c-.6 .6-1 1.1-1.3 1.4l-.3 .3c0 0 0 0 0 0c0 0 0 0 0 0s0 0 0 0s0 0 0 0c-4.6 4.6-5.9 11.4-3.4 17.4c2.5 6 8.3 9.9 14.8 9.9c28.7 0 57.6-8.9 81.6-19.3c22.9-10 42.4-21.9 54.3-30.6c31.8 11.5 67 17.9 104.1 17.9z"/>
      ) : (
        <path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4c26.5 9.6 56.2 15.1 87.8 15.1c124.9 0 208-80.5 208-160s-83.1-160-208-160S48 160.5 48 240c0 32 12.4 62.8 35.7 89.2c8.6 9.7 12.8 22.5 11.8 35.5c-1.4 18.1-5.7 34.7-11.3 49.4c17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208s-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4l.3-.3c.3-.3 .7-.7 1.3-1.4c1.2-1.3 2.9-3.3 5-5.9c4.1-5.1 9.6-12.4 15.2-21.6z"/>
      )}
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 448 512" fill="currentColor">
      {active ? (
        <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/>
      ) : (
        <path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464l349.5 0c-8.9-63.3-63.3-112-129-112l-91.4 0c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3z"/>
      )}
    </svg>
  );
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
    { id: "moments" as Page, label: tr("nav_moments"), Icon: IconStar },
    { id: "live" as Page, label: "بث مباشر", Icon: IconLive },
    { id: "messages" as Page, label: tr("nav_messages"), Icon: IconComment },
    { id: "me" as Page, label: tr("nav_me"), Icon: IconUser },
  ];

  return (
    <nav
      aria-label="التنقل الرئيسي"
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        left: 0,
        height: 78,
        background: "rgba(255,255,255,0.96)",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTop: "1px solid rgba(226,232,240,0.9)",
        boxShadow: "0 -10px 30px rgba(15,23,42,0.08)",
        backdropFilter: "blur(18px)",
        zIndex: 150,
        paddingBottom: "env(safe-area-inset-bottom)",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <style>{`\n        @keyframes sakiNavPop {\n          0% { transform: translateY(4px) scale(.88); opacity: .65; }\n          65% { transform: translateY(-2px) scale(1.08); opacity: 1; }\n          100% { transform: translateY(0) scale(1); opacity: 1; }\n        }\n        @keyframes sakiNavGlow {\n          0%, 100% { box-shadow: 0 5px 14px rgba(59,77,46,.10); }\n          50% { box-shadow: 0 7px 20px rgba(59,77,46,.24); }\n        }\n        @media (prefers-reduced-motion: reduce) {\n          .saki-nav-motion { animation: none !important; transition: none !important; }\n        }\n      `}</style>
      {tabs.map((tab) => {
        const active = currentPage === tab.id;
        const showBadge = tab.id === "messages";
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentPage(tab.id)}
            aria-current={active ? "page" : undefined}
            aria-label={tab.label}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: 11,
              color: active ? "#30452a" : "#94a3b8",
              cursor: "pointer",
              transition: "color 220ms ease, transform 160ms ease",
              transform: active ? "translateY(-2px)" : "translateY(0)",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              background: "none",
              border: "none",
              padding: "6px 14px 5px",
              gap: 4,
              borderRadius: 18,
              outline: "none",
            }}
            onPointerDown={(event) => { event.currentTarget.style.transform = "translateY(0) scale(.94)"; }}
            onPointerUp={(event) => { event.currentTarget.style.transform = active ? "translateY(-2px)" : "translateY(0)"; }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 42,
                height: 30,
                borderRadius: 15,
                marginBottom: 1,
                color: active ? "#ffffff" : "inherit",
                background: active ? "linear-gradient(135deg,#526b40,#30452a)" : "transparent",
                transition: "transform 220ms cubic-bezier(.23,1,.32,1), background 220ms ease, color 220ms ease",
                transform: active ? "scale(1.04)" : "scale(1)",
                animation: active ? "sakiNavPop 360ms cubic-bezier(.23,1,.32,1), sakiNavGlow 2.4s ease-in-out infinite" : "none",
              }}
              className="saki-nav-motion"
            >
              <tab.Icon active={active} />
            </div>
            <span style={{ fontWeight: active ? 900 : 700, fontSize: 11, transition: "color 220ms ease" }}>{tab.label}</span>
            {showBadge && totalMsgBadge > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  right: 4,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#fff", fontSize: 8, fontWeight: 900 }}>
                  {totalMsgBadge > 9 ? "9+" : totalMsgBadge}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
}
