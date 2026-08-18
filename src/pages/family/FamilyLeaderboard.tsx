// @ts-nocheck
import { ARAB_COUNTRIES } from "../../data/countries";
import { getLvl } from "./familyUtils";

interface Props {
  allFamilies: any[];
  myFamily: any;
  onBack: () => void;
}

export default function FamilyLeaderboard({ allFamilies, myFamily, onBack }: Props) {
  const sorted = [...allFamilies].sort((a, b) => (b.totalDiamonds ?? 0) - (a.totalDiamonds ?? 0));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
      <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <h2 className="text-white font-bold text-base">🏆 ترتيب العائلات</h2>
          <div className="w-9"/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-10">
        {top3.length > 0 && (
          <div className="relative px-4 pt-8 pb-2" style={{background:"linear-gradient(180deg,rgba(168,85,247,0.15),transparent)"}}>
            <div className="flex items-end justify-center gap-2">
              {top3[1] && (
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-400 mx-auto" style={{background:"rgba(192,192,192,0.15)"}}>
                      {top3[1].avatarUrl ? <img src={top3[1].avatarUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">👨‍👩‍👧‍👦</div>}
                    </div>
                    <div className="absolute -top-3 right-0 text-xl">🥈</div>
                  </div>
                  <div className="w-full rounded-t-2xl py-3 text-center" style={{background:"linear-gradient(180deg,rgba(192,192,192,0.2),rgba(192,192,192,0.05))",minHeight:64}}>
                    <p className="text-gray-300 text-[10px] font-bold truncate px-1">{top3[1].name}</p>
                    <p className="text-gray-400 text-[9px] mt-0.5">{(top3[1].totalDiamonds??0).toLocaleString()} 💎</p>
                    <span className="text-[9px] font-bold" style={{color:getLvl(top3[1].totalDiamonds??0).color}}>{getLvl(top3[1].totalDiamonds??0).emoji} {getLvl(top3[1].totalDiamonds??0).name}</span>
                  </div>
                </div>
              )}
              {top3[0] && (
                <div className="flex flex-col items-center gap-1 flex-1 -mt-8">
                  <div className="relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-yellow-400 mx-auto mt-4" style={{background:"rgba(251,191,36,0.15)",boxShadow:"0 0 20px rgba(251,191,36,0.3)"}}>
                      {top3[0].avatarUrl ? <img src={top3[0].avatarUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-3xl">👨‍👩‍👧‍👦</div>}
                    </div>
                  </div>
                  <div className="w-full rounded-t-2xl py-3 text-center" style={{background:"linear-gradient(180deg,rgba(251,191,36,0.25),rgba(251,191,36,0.05))",minHeight:80}}>
                    <p className="text-yellow-300 text-[11px] font-black truncate px-1">{top3[0].name}</p>
                    <p className="text-yellow-400 text-[10px] mt-0.5 font-bold">{(top3[0].totalDiamonds??0).toLocaleString()} 💎</p>
                    <p className="text-yellow-600 text-[9px]">👥 {top3[0].memberCount}</p>
                    <span className="text-[9px] font-bold" style={{color:getLvl(top3[0].totalDiamonds??0).color}}>{getLvl(top3[0].totalDiamonds??0).emoji} {getLvl(top3[0].totalDiamonds??0).name}</span>
                  </div>
                </div>
              )}
              {top3[2] && (
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-400 mx-auto" style={{background:"rgba(205,127,50,0.15)"}}>
                      {top3[2].avatarUrl ? <img src={top3[2].avatarUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">👨‍👩‍👧‍👦</div>}
                    </div>
                    <div className="absolute -top-3 right-0 text-xl">🥉</div>
                  </div>
                  <div className="w-full rounded-t-2xl py-3 text-center" style={{background:"linear-gradient(180deg,rgba(205,127,50,0.2),rgba(205,127,50,0.05))",minHeight:64}}>
                    <p className="text-orange-300 text-[10px] font-bold truncate px-1">{top3[2].name}</p>
                    <p className="text-orange-400 text-[9px] mt-0.5">{(top3[2].totalDiamonds??0).toLocaleString()} 💎</p>
                    <span className="text-[9px] font-bold" style={{color:getLvl(top3[2].totalDiamonds??0).color}}>{getLvl(top3[2].totalDiamonds??0).emoji} {getLvl(top3[2].totalDiamonds??0).name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="p-4 space-y-2">
          {rest.map((f, i) => {
            const lvl = getLvl(f.totalDiamonds ?? 0);
            const fc = ARAB_COUNTRIES.find(c => c.code === f.country);
            return (
              <div key={f._id} className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 font-black text-sm flex-shrink-0">#{i+4}</div>
                <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center flex-shrink-0">
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-xl">👨‍👩‍👧‍👦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><p className="text-white text-sm font-bold truncate">{f.name}</p>{fc && <span className="text-sm">{fc.flag}</span>}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold" style={{color:lvl.color}}>{lvl.emoji} {lvl.name}</span>
                    <span className="text-gray-500 text-[10px]">👥 {f.memberCount}</span>
                  </div>
                </div>
                <p className="text-purple-400 text-xs font-bold flex-shrink-0">{(f.totalDiamonds??0).toLocaleString()} 💎</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
