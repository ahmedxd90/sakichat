// DJ Spin — واجهة DJ/Rave أصلية، مرحلة تجريبية آمنة بلا خصم عملات حقيقية حتى يكتمل ربط Convex.
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type SymbolKey = "headphones" | "glasses" | "vinyl" | "deck" | "A" | "K" | "Q" | "J" | "wild" | "scatter";

const SYMBOLS: { key: SymbolKey; label: string; art: string; color: string; weight: number }[] = [
  { key: "headphones", label: "سماعات", art: "◉", color: "#f8d14f", weight: 7 },
  { key: "glasses", label: "نظارات", art: "⌁", color: "#33e7ff", weight: 7 },
  { key: "vinyl", label: "أسطوانة", art: "●", color: "#ff5be7", weight: 6 },
  { key: "deck", label: "DJ", art: "▦", color: "#ff9f43", weight: 5 },
  { key: "A", label: "A", art: "A", color: "#8df7ff", weight: 9 },
  { key: "K", label: "K", art: "K", color: "#b69cff", weight: 9 },
  { key: "Q", label: "Q", art: "Q", color: "#ff89cc", weight: 9 },
  { key: "J", label: "J", art: "J", color: "#f5f1ff", weight: 9 },
  { key: "wild", label: "Wild", art: "★", color: "#ffe66d", weight: 2 },
  { key: "scatter", label: "RAVE", art: "✦", color: "#ff58c8", weight: 2 },
];
const BETS = [50, 500, 5000, 50000];
const PAYLINES = ["A A A", "K K K", "Q Q Q", "J J J", "★ ★ ★"];

function pickSymbol(seed: number) {
  const total = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let cursor = (Math.abs(seed) % total) + 1;
  for (const symbol of SYMBOLS) {
    cursor -= symbol.weight;
    if (cursor <= 0) return symbol;
  }
  return SYMBOLS[0];
}

function makeReels(round: number) {
  return Array.from({ length: 15 }, (_, index) => pickSymbol(round * 17 + index * 31 + 11));
}

export default function DJSpinGame({ onBack }: { roomId?: string; onBack: () => void }) {
  const [bet, setBet] = useState(500);
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolKey>("headphones");
  const [reels, setReels] = useState(() => makeReels(1));
  const [spinning, setSpinning] = useState(false);
  const [round, setRound] = useState(1);
  const [seconds, setSeconds] = useState(22);
  const [win, setWin] = useState(0);
  const [message, setMessage] = useState("اختر الرهان واضغط Spin");
  const [tab, setTab] = useState<"game" | "rules" | "history">("game");
  const timerRef = useRef<number | null>(null);
  const currentRound = useQuery(api.djSpin.getCurrentRound, roomId ? { roomId: roomId as any } : "skip");
  const startRound = useMutation(api.djSpin.startRound);
  const placeBet = useMutation(api.djSpin.placeBet);
  const resolveExpiredRound = useMutation(api.djSpin.resolveExpiredRound);

  useEffect(() => {
    if (!roomId) return;
    startRound({ roomId: roomId as any }).catch(() => undefined);
  }, [roomId]);

  useEffect(() => {
    if (!currentRound) return;
    const tick = () => setSeconds(Math.max(0, Math.ceil((currentRound.bettingEndsAt - Date.now()) / 1000)));
    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [currentRound?.bettingEndsAt]);

  const winningLine = useMemo(() => {
    const row = [reels[0], reels[1], reels[2], reels[3], reels[4]];
    const first = row[0]?.key;
    const count = row.filter((symbol) => symbol.key === first || symbol.key === "wild").length;
    return count >= 3 ? count : 0;
  }, [reels]);

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  const spin = async () => {
    if (spinning) return;
    if (currentRound) {
      try {
        await placeBet({ roomId: roomId as any, roundId: currentRound._id, amount: bet, symbolKey: selectedSymbol });
      } catch (error: any) {
        setMessage(error?.message ?? "تعذر تسجيل الرهان");
        return;
      }
    }
    setSpinning(true);
    setWin(0);
    setMessage("الإيقاع يرتفع... انتظر النتيجة");
    const started = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setReels(makeReels(round + Math.floor(elapsed / 90)));
      if (elapsed > 1150) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        const finalReels = makeReels(round + 100);
        setReels(finalReels);
        const first = finalReels[0].key;
        const count = finalReels.slice(0, 5).filter((symbol) => symbol.key === first || symbol.key === "wild").length;
        const payout = count >= 5 ? bet * 45 : count === 4 ? bet * 10 : count === 3 ? bet * 5 : 0;
        setWin(payout);
        setMessage(payout > 0 ? `فوز DJ! +${payout.toLocaleString()} تجريبي` : "لا يوجد تطابق هذه المرة");
        setSeconds(22);
        setRound((value) => value + 1);
        setSpinning(false);
      }
    }, 85);
  };

  return (
    <div className="h-full overflow-y-auto text-white" dir="rtl" style={{ background: "#11001d" }}>
      <div className="relative min-h-full p-3" style={{ backgroundImage: "linear-gradient(180deg,rgba(17,0,29,.82),rgba(5,8,25,.98)), url('/manus-storage/dj-spin-bg_271a4f55.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(circle at 50% 18%,rgba(255,35,225,.35),transparent 35%),radial-gradient(circle at 10% 60%,rgba(0,229,255,.18),transparent 28%)" }} />
        <div className="relative z-10 mx-auto max-w-md">
          <header className="mb-3 flex items-center justify-between rounded-2xl border border-fuchsia-300/20 bg-black/45 px-3 py-2 backdrop-blur-xl">
            <button onClick={onBack} className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 text-lg active:scale-95">‹</button>
            <div className="text-center">
              <div className="text-[9px] font-black tracking-[.35em] text-cyan-200">SAKI NIGHT STAGE</div>
              <h1 className="text-lg font-black text-fuchsia-100">DJ SPIN</h1>
            </div>
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-center"><div className="text-[9px] text-cyan-200">الرصيد</div><div className="text-xs font-black">تجريبي</div></div>
          </header>

          <div className="mb-3 flex gap-2 rounded-2xl border border-white/10 bg-black/35 p-1">
            {([['game','اللعبة'],['rules','القواعد'],['history','السجل']] as const).map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`flex-1 rounded-xl py-2 text-xs font-black ${tab === key ? "bg-fuchsia-500/80 text-white" : "text-white/45"}`}>{label}</button>)}
          </div>

          {tab === "game" ? <>
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-fuchsia-200/15 bg-black/45 px-3 py-2 text-xs">
              <span className="text-fuchsia-100">الجولة <b className="text-cyan-200">#{round}</b></span><span className="text-white/45">إغلاق تلقائي بعد {seconds}s</span><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-300">تجريبي</span>
            </div>
            <section className="relative overflow-hidden rounded-[26px] border border-fuchsia-200/30 bg-[#16052e]/90 p-3 shadow-[0_0_40px_rgba(217,70,239,.2)]">
              <div className="mb-3 flex items-center justify-between"><div><div className="text-[10px] font-black text-cyan-200">RAVE ON</div><div className="text-[9px] text-white/45">خمسة أعمدة · خطوط فوز نيون</div></div><div className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-2 py-1 text-[10px] font-black text-fuchsia-100">{spinning ? "SPINNING" : "READY"}</div></div>
              <div className="grid grid-cols-5 gap-1 rounded-2xl border-2 border-cyan-300/30 bg-black/65 p-2 shadow-[inset_0_0_28px_rgba(0,229,255,.12)]">
                {reels.map((symbol, index) => <div key={`${round}-${index}`} className={`flex aspect-[.78] items-center justify-center rounded-xl border bg-gradient-to-b from-white/10 to-black/35 ${spinning ? "animate-pulse" : ""}`} style={{ borderColor: `${symbol.color}70`, boxShadow: `0 0 14px ${symbol.color}22` }}><div className="text-center" style={{ color: symbol.color, textShadow: `0 0 12px ${symbol.color}` }}><div className="text-3xl font-black leading-none">{symbol.art}</div><div className="mt-1 text-[7px] font-black tracking-wider">{symbol.label}</div></div></div>)}
              </div>
              <div className="mt-3 flex items-center justify-between text-[9px] text-white/45"><span>خطوط الدفع: {PAYLINES.join(" · ")}</span><span className="text-cyan-200">{winningLine >= 3 ? `${winningLine} متطابقة` : ""}</span></div>
              {win > 0 && <div className="mt-3 rounded-xl border border-yellow-300/40 bg-yellow-300/10 py-2 text-center text-sm font-black text-yellow-200 animate-pulse">فوز تجريبي +{win.toLocaleString()} 🪙</div>}
            </section>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{SYMBOLS.slice(0, 8).map((symbol) => <button key={symbol.key} onClick={() => setSelectedSymbol(symbol.key)} className={`min-w-14 rounded-xl border px-2 py-2 text-[9px] font-black ${selectedSymbol === symbol.key ? "border-cyan-200 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-black/35 text-white/55"}`} style={{ color: selectedSymbol === symbol.key ? symbol.color : undefined }}>{symbol.art} {symbol.label}</button>)}</div>
            <div className="mt-2 grid grid-cols-4 gap-2">{BETS.map((amount) => <button key={amount} onClick={() => setBet(amount)} className={`rounded-xl border py-2 text-[10px] font-black ${bet === amount ? "border-fuchsia-300 bg-fuchsia-500/30 text-white" : "border-white/10 bg-black/35 text-white/55"}`}>{amount >= 1000 ? `${amount / 1000}K` : amount}</button>)}</div>
            <button onClick={spin} disabled={spinning || seconds === 0} className="mt-3 w-full rounded-2xl border border-yellow-200/60 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 py-3 text-sm font-black shadow-[0_0_28px_rgba(217,70,239,.4)] active:scale-[.98] disabled:opacity-50">{spinning ? "يتم تدوير الأعمدة..." : `SPIN · ${bet.toLocaleString()} تجريبي`}</button>
            <p className="mt-2 text-center text-[10px] text-white/45">{message}</p>
          </> : tab === "rules" ? <div className="rounded-2xl border border-white/10 bg-black/45 p-4 text-right text-sm leading-7 text-white/75"><h2 className="mb-2 font-black text-fuchsia-200">قواعد DJ Spin</h2><p>اختر مبلغ الرهان ثم اضغط Spin. تُحسب خطوط الفوز من الرموز المتطابقة، وتُعرض النتيجة في نهاية الدوران. هذه المرحلة تجريبية ولا تخصم عملات حقيقية.</p><p className="mt-3 text-cyan-200">عند تفعيل الربط الخادمي سيحدد Convex النتيجة ويسجل الخصم والربح لكل غرفة وجولة.</p></div> : <div className="rounded-2xl border border-white/10 bg-black/45 p-4 text-center text-sm text-white/60">سيظهر سجل الجولات بعد تفعيل الربط الخادمي.</div>}
        </div>
      </div>
    </div>
  );
}
