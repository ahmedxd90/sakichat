import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function GlobalLiveEventBanner() {
  const events = useQuery(api.livestreams.getRecentGlobalLiveEvents);
  const [item, setItem] = useState<any>(null);
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    const gift = events?.gifts?.[0];
    const join = events?.joins?.[0];
    const next = gift && (!join || gift.createdAt >= join.joinedAt) ? { ...gift, kind: "gift" } : join ? { ...join, kind: "join" } : null;
    if (!next) return;
    const key = `${next.kind}:${next._id}`;
    if (lastRef.current === null) { lastRef.current = key; return; }
    if (lastRef.current === key) return;
    lastRef.current = key;
    setItem(next);
    const timer = window.setTimeout(() => setItem(null), next.kind === "gift" ? 5200 : 3600);
    return () => window.clearTimeout(timer);
  }, [events?.gifts?.[0]?._id, events?.joins?.[0]?._id]);

  if (!item) return null;
  const isGift = item.kind === "gift";
  return (
    <div className="fixed top-[calc(env(safe-area-inset-top,0px)+12px)] left-3 right-3 z-[500] pointer-events-none flex justify-center" dir="rtl">
      <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-md animate-[globalLiveIn_450ms_ease-out]">
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-500 bg-blue-50 flex-shrink-0">
          {item.senderAvatarUrl || item.userAvatarUrl ? <img src={item.senderAvatarUrl || item.userAvatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-blue-700 font-black">{(item.senderName || item.userName || "م").slice(0, 1)}</span>}
        </div>
        <div className="min-w-0 text-right">
          {isGift ? (
            <>
              <p className="text-slate-900 text-[11px] font-black truncate">{item.senderName} أرسل هدية إلى {item.receiverName || "المضيف"}</p>
              <p className="text-blue-600 text-[10px] font-bold truncate">{item.giftName} × {item.quantity ?? 1} · {Math.round((item.giftCoins * (item.quantity ?? 1)) / 1000)}K</p>
            </>
          ) : <p className="text-slate-900 text-[11px] font-black truncate">{item.userName || "مستخدم"} انضم إلى بث مباشر</p>}
        </div>
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-lg">{isGift ? "🎁" : "LIVE"}</div>
      </div>
      <style>{`@keyframes globalLiveIn{0%{opacity:0;transform:translateY(-18px) scale(.94)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}

// Style reminder: this banner follows Saki Live's white/blue live-event language and remains non-blocking above rooms.
