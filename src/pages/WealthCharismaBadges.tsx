// @ts-nocheck
import { getLevelColor } from "../lib/levelSystem";

export function WealthCharismaBadges({ wealthLevel, charismaLevel }: { wealthLevel: number; charismaLevel: number }) {
  if (wealthLevel === 0 && charismaLevel === 0) return null;
  const wc = wealthLevel > 0 ? getLevelColor(wealthLevel) : null;
  const cc = charismaLevel > 0 ? getLevelColor(charismaLevel) : null;

  return (
    <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
      {wc && (
        <span
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-black"
          style={{
            background: `linear-gradient(135deg,${wc.primary}25,${wc.secondary}15)`,
            color: wc.primary,
            border: `1px solid ${wc.primary}45`,
            boxShadow: `0 0 8px ${wc.glow}`,
          }}>
          🪙 ثروة {wealthLevel} · {wc.tier}
        </span>
      )}
      {cc && (
        <span
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-black"
          style={{
            background: `linear-gradient(135deg,${cc.primary}25,${cc.secondary}15)`,
            color: cc.primary,
            border: `1px solid ${cc.primary}45`,
            boxShadow: `0 0 8px ${cc.glow}`,
          }}>
          ✨ كاريزما {charismaLevel} · {cc.tier}
        </span>
      )}
    </div>
  );
}
