// Auto-generated level icons helper for Wealth & Charisma (Levels 1-100)

export function getLevelIconUrl(level: number, type: 'wealth' | 'charisma' = 'wealth'): string {
  const clamped = Math.max(1, Math.min(100, level || 1));
  return `/levels/level_${clamped}.png`;
}

export function LevelBadgeComponent({ level, type = 'wealth', size = 28, showNumber = true }: { level: number; type?: 'wealth' | 'charisma'; size?: number; showNumber?: boolean }) {
  const iconUrl = getLevelIconUrl(level, type);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <img src={iconUrl} alt={`Lv.${level}`} style={{ width: size, height: size, objectFit: 'contain' }} />
      {showNumber && <span style={{ fontWeight: 900, fontSize: '11px' }}>{level}</span>}
    </div>
  );
}
