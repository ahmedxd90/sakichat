// @ts-nocheck
interface Gift {
  giftName: string;
  giftImageUrl?: string;
  count: number;
}

interface Props {
  gifts: Gift[] | undefined | null;
  canViewFull: boolean;
  accentColor: string;
}

export default function GiftsReceivedTab({ gifts, canViewFull, accentColor }: Props) {
  if (!canViewFull) return (
    <div className="px-4 py-4">
      <div className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
        style={{ background: "linear-gradient(135deg,#f5f0ff,#fdf4ff)", border: "1px solid #e9d5ff" }}>
        <span className="text-4xl">🔒</span>
        <p className="font-black text-base" style={{ color: "#555" }}>ملف شخصي خاص</p>
      </div>
    </div>
  );

  if (!gifts) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: `${accentColor} transparent transparent transparent` }} />
    </div>
  );

  if (gifts.length === 0) return (
    <div className="text-center py-16 flex flex-col items-center gap-3">
      <span className="text-5xl opacity-30">🎁</span>
      <p className="font-bold text-base" style={{ color: "#888" }}>لم يستقبل أي هدايا بعد</p>
    </div>
  );

  const total = gifts.reduce((s, g) => s + g.count, 0);

  return (
    <div className="px-4 py-4">
      <p className="text-xs font-bold mb-3" style={{ color: "#aaa" }}>
        إجمالي الهدايا المستقبَلة:{" "}
        <span style={{ color: accentColor }}>{total.toLocaleString()}</span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        {gifts.map((gift, i) => (
          <div key={i} className="rounded-2xl flex flex-col items-center p-3 gap-2"
            style={{ background: "#f8f4ff", border: "1px solid #ede9fe", boxShadow: "0 1px 6px rgba(168,85,247,0.07)" }}>
            <div className="relative w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#f0e8ff,#fdf4ff)" }}>
              {gift.giftImageUrl
                ? <img src={gift.giftImageUrl} alt={gift.giftName} className="w-full h-full object-contain p-1 rounded-xl" />
                : <span className="text-3xl">🎁</span>
              }
              <div
                className="absolute -top-1.5 -left-1.5 min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-1"
                style={{ background: `linear-gradient(135deg,${accentColor},#ec4899)` }}>
                <span className="text-white text-[10px] font-black">×{gift.count.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs font-bold text-center leading-tight line-clamp-2" style={{ color: "#333" }}>
              {gift.giftName}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
