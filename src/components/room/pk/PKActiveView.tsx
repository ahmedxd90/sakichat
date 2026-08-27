// @ts-nocheck
import { formatNumber } from "../../../lib/formatNumber";

function GiftSVG({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  );
}

function ClockSVG({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function MedalSVG({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="15" r="6"/>
      <path d="M8.56 2.9A7 7 0 0 1 16 2.9"/>
      <path d="M8.56 2.9L6 8"/>
      <path d="M16 2.9L18 8"/>
    </svg>
  );
}

interface PKActiveViewProps {
  activePK: any;
  roomId: string;
  canManage: boolean;
  myCoins: number;
  loading: boolean;
  minutes: number;
  seconds: number;
  room1Contribs: any[] | undefined;
  room2Contribs: any[] | undefined;
  onContribute?: (amount: number) => void;
  onEndEarly: () => void;
}

export default function PKActiveView({
  activePK,
  roomId,
  canManage,
  myCoins,
  loading,
  minutes,
  seconds,
  room1Contribs,
  room2Contribs,
  onEndEarly,
}: PKActiveViewProps) {
  const isRoom1 = activePK.room1Id === roomId;
  const isRoom2 = activePK.room2Id === roomId;

  const totalCoins = (activePK.room1Coins ?? 0) + (activePK.room2Coins ?? 0);
  const room1Pct = totalCoins > 0 ? ((activePK.room1Coins ?? 0) / totalCoins) * 100 : 50;
  const room2Pct = 100 - room1Pct;

  const blueColor = "#3b82f6";
  const redColor = "#ef4444";

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="rounded-2xl p-3 text-center"
        style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <ClockSVG color="#fb923c" size={14} />
          <p className="text-orange-400 text-xs">الوقت المتبقي</p>
        </div>
        <p className="text-white font-black text-2xl tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>

      {/* Score */}
      <div className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-center flex-1">
            <p className="text-xs font-black truncate" style={{ color: blueColor }}>{activePK.room1Name}</p>
            <p className="text-[9px] font-bold mb-1" style={{ color: blueColor }}>🐯 النمور</p>
            <div className="flex items-center justify-center gap-1">
              <GiftSVG color="#fbbf24" size={12} />
              <p className="text-yellow-400 font-bold text-base">{formatNumber(activePK.room1Coins ?? 0)}</p>
            </div>
          </div>
          <div className="text-orange-400 font-black text-xl px-3">VS</div>
          <div className="text-center flex-1">
            <p className="text-xs font-black truncate" style={{ color: redColor }}>{activePK.room2Name}</p>
            <p className="text-[9px] font-bold mb-1" style={{ color: redColor }}>🦁 الأسود</p>
            <div className="flex items-center justify-center gap-1">
              <GiftSVG color="#fbbf24" size={12} />
              <p className="text-yellow-400 font-bold text-base">{formatNumber(activePK.room2Coins ?? 0)}</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full overflow-hidden flex relative" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full transition-all duration-700 ease-out"
            style={{ width: `${room1Pct}%`, background: `linear-gradient(90deg,${blueColor},#60a5fa)`, borderRadius: "9999px 0 0 9999px" }} />
          <div className="h-full transition-all duration-700 ease-out"
            style={{ width: `${room2Pct}%`, background: "linear-gradient(90deg,#dc2626,#ef4444)", borderRadius: "0 9999px 9999px 0" }} />
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/30" style={{ left: `${room1Pct}%`, transform: "translateX(-50%)" }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs font-black" style={{ color: blueColor }}>{room1Pct.toFixed(0)}%</span>
          <span className="text-xs font-black" style={{ color: redColor }}>{room2Pct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Gift support info - NO coins, gifts only */}
      <div className="rounded-2xl p-4"
        style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
        <div className="flex items-center gap-2 mb-2">
          <GiftSVG color="#fbbf24" size={16} />
          <p className="text-yellow-400 font-bold text-sm">ادعم غرفتك بالهدايا</p>
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">
          أرسل هدايا لأعضاء غرفتك الجالسين على المقاعد لزيادة نقاط غرفتك في المعركة.
          كل هدية ترسلها لشخص على مقعد تُحسب تلقائياً لغرفتك.
        </p>
      </div>

      {/* Top contributors */}
      {((room1Contribs?.length ?? 0) > 0 || (room2Contribs?.length ?? 0) > 0) && (
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-3">
            <MedalSVG color="#fbbf24" size={14} />
            <p className="text-white font-bold text-sm">أكثر مرسلي الهدايا</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold mb-2 truncate" style={{ color: blueColor }}>🐯 {activePK.room1Name}</p>
              {(room1Contribs ?? []).slice(0, 3).map((c, i) => (
                <div key={c._id} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                  <span className="text-white text-xs truncate flex-1">{c.userName}</span>
                  <div className="flex items-center gap-0.5">
                    <GiftSVG color="#fbbf24" size={9} />
                    <span className="text-yellow-400 text-xs font-bold">{formatNumber(c.coins)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold mb-2 truncate" style={{ color: redColor }}>🦁 {activePK.room2Name}</p>
              {(room2Contribs ?? []).slice(0, 3).map((c, i) => (
                <div key={c._id} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                  <span className="text-white text-xs truncate flex-1">{c.userName}</span>
                  <div className="flex items-center gap-0.5">
                    <GiftSVG color="#fbbf24" size={9} />
                    <span className="text-yellow-400 text-xs font-bold">{formatNumber(c.coins)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {canManage && (isRoom1 || isRoom2) && (
        <button onClick={onEndEarly} disabled={loading}
          className="w-full py-3 rounded-2xl font-bold text-sm bg-red-500/10 border border-red-500/25 text-red-400 disabled:opacity-50">
          إنهاء المعركة مبكراً
        </button>
      )}
    </div>
  );
}
