// @ts-nocheck
interface Supporter {
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  total: number;
}

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function RankIcon({ rank, color }: { rank: number; color: string }) {
  if (rank === 0) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
  if (rank === 1) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}

export default function SupportersSection({ supporters }: { supporters: Supporter[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <p className="font-bold text-sm" style={{ color: "#444" }}>الداعمون</p>
      </div>
      <div className="flex gap-3 justify-center">
        {supporters.map((s, i) => (
          <div key={s.senderId} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="relative">
              <div className="rounded-full overflow-hidden border-2"
                style={{ width: 54, height: 54, borderColor: RANK_COLORS[i] }}>
                {s.senderAvatarUrl
                  ? <img src={s.senderAvatarUrl} alt={s.senderName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl font-black"
                      style={{ background: `${RANK_COLORS[i]}25`, color: RANK_COLORS[i] }}>
                      {s.senderName?.[0]}
                    </div>
                }
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: RANK_COLORS[i], boxShadow: `0 1px 4px ${RANK_COLORS[i]}80` }}>
                <span className="text-white text-[9px] font-black">{i + 1}</span>
              </div>
            </div>
            <p className="text-[10px] font-bold text-center truncate w-full" style={{ color: "#333" }}>
              {s.senderName}
            </p>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: `${RANK_COLORS[i]}15`, border: `1px solid ${RANK_COLORS[i]}40` }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill={RANK_COLORS[i]} stroke="none">
                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8L6 7h12l-2-4z"/>
              </svg>
              <span className="text-[9px] font-black" style={{ color: RANK_COLORS[i] }}>×{s.total}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
