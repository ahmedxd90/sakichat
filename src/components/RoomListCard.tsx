// @ts-nocheck
import { ARAB_COUNTRIES } from "../data/countries";

export default function RoomListCard({ room, onSelect, rank }: { room: any; onSelect: () => void; rank: number }) {
  const country = ARAB_COUNTRIES.find((c) => c.code === room.country);
  const isOfficial = room.isOfficial || room.isOfficialRoom;
  const onlineCount = room.memberCount ?? 0;
  const description = room.description || (isOfficial ? "مرحباً بكم في الغرفة الرسمية، استمتعوا بالهدايا والأنشطة اليومية." : "حياكم الله في غرفتنا، دردشة ووناسة طوال اليوم!");
  
  // Ranking logic
  let rankClass = "";
  let rankBadgeIcon = "fa-medal";
  let rankGradient = "from-slate-400 to-slate-500 text-white";
  let rankText = `TOP ${rank}`;

  if (rank === 1) {
    rankClass = "rank-top-1 shimmer";
    rankBadgeIcon = "fa-crown";
    rankGradient = "from-amber-400 to-yellow-500 text-slate-950";
  } else if (rank === 2) {
    rankClass = "rank-top-2";
    rankBadgeIcon = "fa-award";
    rankGradient = "from-slate-300 to-slate-400 text-slate-900";
  } else if (rank === 3) {
    rankClass = "rank-top-3";
    rankBadgeIcon = "fa-medal";
    rankGradient = "from-amber-600 to-amber-700 text-white";
  }

  return (
    <button
      onClick={onSelect}
      className={`relative w-full bg-white rounded-2xl p-3 text-right active:scale-[0.98] transition-all duration-200 border border-slate-100 shadow-sm ${rankClass}`}
      style={{
        boxShadow: rank <= 3 ? "0 4px 15px rgba(0,0,0,0.05)" : "0 2px 8px rgba(0,0,0,0.02)"
      }}
    >
      <div className="flex items-start gap-3">
        {/* Left Thumbnail */}
        <div className="relative flex-shrink-0">
          <img
            src={room.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80"}
            alt=""
            className="w-20 h-20 rounded-xl object-cover shadow-sm border border-slate-200"
          />
          {/* Live Wave Tag */}
          <div className="absolute bottom-1 right-1 left-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center justify-between text-[10px] shadow-sm">
            <div className="sound-wave flex items-end gap-[2px] h-3">
              <div className="bar w-[2.5px] bg-pink-500 rounded-full animate-wave-1"></div>
              <div className="bar w-[2.5px] bg-pink-500 rounded-full animate-wave-2"></div>
              <div className="bar w-[2.5px] bg-pink-500 rounded-full animate-wave-3"></div>
            </div>
            <span className="text-pink-600 font-black">مباشر</span>
          </div>
        </div>

        {/* Right Info */}
        <div className="flex-1 min-w-0">
          {/* Header: Title & Flag */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <h3 className="font-black text-[13px] text-slate-800 truncate leading-tight">
                {room.name}
              </h3>
              {isOfficial && (
                <i className="fa-solid fa-circle-check text-blue-500 text-[10px] flex-shrink-0"></i>
              )}
            </div>
            <span className="text-sm flex-shrink-0">{country?.flag ?? "🌍"}</span>
          </div>

          {/* Official Badge */}
          {isOfficial && (
            <div className="mb-1.5 flex">
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black px-2 py-0.5 rounded-full">
                <i className="fa-solid fa-shield-halved text-blue-500"></i>
                <span>غرفة رسمية</span>
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-[10px] text-slate-500 truncate mb-2 leading-relaxed">
            {description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[11px]">
                <i className="fa-solid fa-compact-disc text-emerald-500 text-xs animate-spin-slow"></i>
                <i className="fa-solid fa-users text-[10px] text-emerald-600"></i>
                <span>{onlineCount}</span>
              </div>
            </div>

            {/* Rank Badge */}
            <div className={`bg-gradient-to-r ${rankGradient} px-2.5 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1 shadow-sm`}>
              <i className={`fa-solid ${rankBadgeIcon}`}></i>
              <span>{rankText}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .rank-top-1 { border: 2px solid #f59e0b !important; }
        .rank-top-2 { border: 2px solid #94a3b8 !important; }
        .rank-top-3 { border: 2px solid #d97706 !important; }
        
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after {
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(254, 243, 199, 0.4) 20%,
            rgba(254, 243, 199, 0.7) 60%,
            rgba(255, 255, 255, 0)
          );
          animation: rlc-shimmer 3s infinite;
          content: '';
        }
        @keyframes rlc-shimmer { 100% { transform: translateX(100%); } }
        
        @keyframes wave-grow { 0%, 100% { height: 30%; } 50% { height: 100%; } }
        .animate-wave-1 { animation: wave-grow 1.2s infinite ease-in-out; animation-delay: 0.1s; }
        .animate-wave-2 { animation: wave-grow 1.2s infinite ease-in-out; animation-delay: 0.3s; }
        .animate-wave-3 { animation: wave-grow 1.2s infinite ease-in-out; animation-delay: 0.2s; }
        
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </button>
  );
}
