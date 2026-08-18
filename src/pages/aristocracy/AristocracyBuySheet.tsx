// @ts-nocheck
import { Badge3D, RankName } from "./AristocracyBadge3D";

const DURATION_OPTIONS = [
  { days: 30, label: "30 يوم" },
  { days: 90, label: "90 يوم" },
  { days: 365, label: "365 يوم" },
];

function formatPrice(p: number) {
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K`;
  return p.toLocaleString();
}

interface BuySheetProps {
  rank: any;
  selectedDuration: number;
  setSelectedDuration: (d: number) => void;
  price: number;
  status: any;
  buying: boolean;
  onBuy: () => void;
  onClose: () => void;
}

export default function AristocracyBuySheet({
  rank, selectedDuration, setSelectedDuration, price, status, buying, onBuy, onClose,
}: BuySheetProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-5 space-y-4"
        style={{
          background: `linear-gradient(180deg, ${rank.bgGradient.split(",")[1] ?? "#111"}, #000)`,
          border: `1px solid ${rank.color}30`,
        }}
      >
        <div className="flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: "#333" }} />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-base">
            شراء رتبة <RankName rank={rank} size="base" />
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xl"
            style={{ background: "#1a1a1a" }}
          >×</button>
        </div>

        {/* Badge preview */}
        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: `${rank.color}12`, border: `1px solid ${rank.color}30` }}
        >
          <div style={{ width: 60, height: 60, filter: `drop-shadow(0 0 12px ${rank.glowColor})` }}>
            <Badge3D rank={rank} size={60} />
          </div>
          <div>
            <RankName rank={rank} size="lg" />
            <p className="text-xs mt-1" style={{ color: "#888" }}>+{rank.dailyCoins.toLocaleString()} 🪙 يومياً</p>
            <p className="text-xs" style={{ color: rank.color }}>{rank.features.length} ميزة حصرية</p>
          </div>
        </div>

        {/* Duration */}
        <div className="flex gap-2">
          {DURATION_OPTIONS.map((opt) => {
            const p = opt.days === 30 ? rank.price30 : opt.days === 90 ? rank.price90 : rank.price365;
            return (
              <button
                key={opt.days}
                onClick={() => setSelectedDuration(opt.days)}
                className="flex-1 py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={selectedDuration === opt.days
                  ? { background: `${rank.color}30`, color: rank.color, border: `1.5px solid ${rank.color}60` }
                  : { background: "#1a1a1a", color: "#555", border: "1px solid #333" }}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{formatPrice(p)} 🪙</div>
              </button>
            );
          })}
        </div>

        {/* Price + buy */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs" style={{ color: "#777" }}>السعر الإجمالي</div>
            <div className="flex items-center gap-1">
              <span className="text-white font-black text-2xl">{formatPrice(price)}</span>
              <span className="text-yellow-400 text-lg">🪙</span>
            </div>
            {status && (
              <div className="text-[10px] mt-0.5" style={{ color: (status.goldCoins ?? 0) >= price ? "#22c55e" : "#ef4444" }}>
                رصيدك: {formatPrice(status.goldCoins ?? 0)} {(status.goldCoins ?? 0) >= price ? "✓" : "✗"}
              </div>
            )}
          </div>
          <button
            onClick={onBuy}
            disabled={buying || (status ? (status.goldCoins ?? 0) < price : false)}
            className="flex-1 py-4 rounded-2xl text-sm font-black text-black disabled:opacity-40 active:scale-[0.98] transition-transform"
            style={{
              background: `linear-gradient(135deg, ${rank.color}, ${rank.color}cc)`,
              boxShadow: `0 4px 20px ${rank.glowColor}40`,
            }}
          >
            {buying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>جارٍ الشراء...</span>
              </div>
            ) : `شراء ${rank.nameAr}`}
          </button>
        </div>
      </div>
    </div>
  );
}
