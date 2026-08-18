interface Props {
  myDiamonds: number;
}

const TIERS = [
  { d: 120000, l: "120k", val: "$10" },
  { d: 240000, l: "240k", val: "$20" },
  { d: 360000, l: "360k", val: "$30" },
  { d: 480000, l: "480k", val: "$40" },
  { d: 600000, l: "600k", val: "$50" },
  { d: 720000, l: "720k", val: "$60" },
];

export default function AgentSystemBadge({ myDiamonds }: Props) {
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0d2818,#0a1f2e)", border: "1px solid rgba(16,185,129,0.3)" }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <p className="text-green-400 font-black text-sm">نظام وكيل الشحن</p>
            <p className="text-gray-500 text-xs">كيف تسحب ماسك؟</p>
          </div>
        </div>
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2"><span className="text-sm">💎</span><p className="text-gray-400 text-xs">70% من الهدايا المستقبَلة تتحول لماس</p></div>
          <div className="flex items-center gap-2"><span className="text-sm">🎰</span><p className="text-gray-400 text-xs">10% من هدايا الحظ تصلك كماس</p></div>
          <div className="flex items-center gap-2"><span className="text-sm">📊</span><p className="text-gray-400 text-xs">كل 120,000 ماسة = 10 دولار</p></div>
          <div className="flex items-center gap-2"><span className="text-sm">💸</span><p className="text-gray-400 text-xs">تواصل مع وكيل شحن لسحب ماسك</p></div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {TIERS.map((tier) => {
            const active = myDiamonds >= tier.d;
            return (
              <div key={tier.d} className={`rounded-xl p-2 text-center ${active ? "bg-green-500/20 border border-green-500/30" : "bg-white/5 border border-white/10"}`}>
                <p className={`text-[10px] font-bold ${active ? "text-green-400" : "text-gray-500"}`}>{tier.l} 💎</p>
                <p className={`text-[11px] font-black ${active ? "text-green-300" : "text-gray-600"}`}>{tier.val}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
