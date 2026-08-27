import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/** High-value gift banner: shown globally only for server-marked gifts >= 100K. */
export default function GlobalGiftBanner() {
  const [latestGlobal, setLatestGlobal] = useState<any>(null);
  const [banner, setBanner] = useState<any>(null);
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const lastIdRef = useRef<string | null>(null);
  const timerRef = useRef<number[]>([]);
  const channelNameRef = useRef(`global_gifts_${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    const channel = supabase
      .channel(channelNameRef.current)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gift_logs', filter: 'price=gte.100000' }, (payload) => {
        setLatestGlobal(payload.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!latestGlobal || latestGlobal.price < 100000) return;
    if (lastIdRef.current === null) {
      lastIdRef.current = latestGlobal.id;
      return;
    }
    if (latestGlobal.id === lastIdRef.current) return;
    lastIdRef.current = latestGlobal.id;

    timerRef.current.forEach((timer) => window.clearTimeout(timer));
    setBanner(latestGlobal);
    setPhase("enter");
    timerRef.current = [
      window.setTimeout(() => setPhase("show"), 50),
      window.setTimeout(() => setPhase("exit"), 4200),
      window.setTimeout(() => setBanner(null), 5000),
    ];
  }, [latestGlobal?.id, latestGlobal?.price]);

  useEffect(() => () => timerRef.current.forEach((timer) => window.clearTimeout(timer)), []);

  if (!banner || banner.price < 100000) return null;

  const translateX = phase === "enter" ? "translateX(110vw)" : phase === "show" ? "translateX(0)" : "translateX(-110vw)";
  const transition = phase === "enter" ? "none" : phase === "show" ? "transform .55s cubic-bezier(.22,1,.36,1)" : "transform .6s cubic-bezier(.55,0,1,.45)";

  return (
    <div className="fixed z-[300] pointer-events-none top-[calc(env(safe-area-inset-top,0px)+8px)] left-0 right-0 flex justify-center" dir="rtl">
      <div className="pointer-events-none" style={{ transform: translateX, transition, willChange: "transform" }}>
        <div className="flex items-center gap-2 rounded-full px-2 py-1.5 max-w-[calc(100vw-32px)] overflow-hidden" style={{ background: "linear-gradient(90deg,#1a0030,#2d0050,#1a0030)", border: "1.5px solid rgba(204,0,255,.34)", boxShadow: "0 3px 24px rgba(204,0,255,.28)" }}>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-fuchsia-400/70 bg-fuchsia-950 shrink-0">
            {banner.senderAvatarUrl ? <img src={banner.senderAvatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-white font-black">{banner.senderName?.[0] ?? "م"}</span>}
          </div>
          <div className="min-w-0 text-right">
            <p className="text-white text-[11px] font-black truncate max-w-[120px]">{banner.senderName ?? "مستخدم"}</p>
            <p className="text-fuchsia-300 text-[10px] font-bold whitespace-nowrap">أرسل هدية إلى</p>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-fuchsia-400/60 bg-fuchsia-950 shrink-0">
            {banner.receiverAvatarUrl ? <img src={banner.receiverAvatarUrl} alt="المستلم" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-fuchsia-200 text-xs font-black">●</span>}
          </div>
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-black/30 shrink-0 flex items-center justify-center">
            {banner.giftImageUrl ? <img src={banner.giftImageUrl} alt={banner.giftName} className="w-full h-full object-cover" /> : <span className="text-lg">🎁</span>}
          </div>
          <span className="text-fuchsia-300 text-[10px] font-black shrink-0">{banner.price >= 1000000 ? `${(banner.price / 1000000).toFixed(1)}M` : `${Math.round(banner.price / 1000)}K`}</span>
        </div>
      </div>
    </div>
  );
}
