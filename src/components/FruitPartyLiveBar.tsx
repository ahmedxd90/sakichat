// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const FRUITS = [
  { key: "watermelon", label: "بطيخ",    color: "#22c55e", emoji: "🍉" },
  { key: "apple",      label: "تفاح",    color: "#ef4444", emoji: "🍎" },
  { key: "grape",      label: "عنب",     color: "#a855f7", emoji: "🍇" },
  { key: "orange",     label: "برتقال",  color: "#f97316", emoji: "🍊" },
  { key: "strawberry", label: "فراولة",  color: "#f43f5e", emoji: "🍓" },
  { key: "pineapple",  label: "أناناس",  color: "#eab308", emoji: "🍍" },
  { key: "mango",      label: "مانجو",   color: "#fb923c", emoji: "🥭" },
  { key: "cherry",     label: "كرز",     color: "#e11d48", emoji: "🍒" },
  { key: "coconut",    label: "جوز هند", color: "#a8a29e", emoji: "🥥" },
];

export default function FruitPartyLiveBar({ roomId }: { roomId?: any }) {
  const [lastRounds, setLastRounds] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!roomId) return;
    const fetchData = async () => {
      const { data: rounds } = await supabase.from('fruit_party_rounds').select('*').eq('room_id', roomId).eq('status', 'finished').order('created_at', { ascending: false }).limit(10);
      setLastRounds(rounds || []);
      
      const { data: current } = await supabase.from('fruit_party_rounds').select('*').eq('room_id', roomId).eq('status', 'active').single();
      setCurrentRound(current);
    };
    fetchData();
  }, [roomId]);

  useEffect(() => {
    if (!currentRound) return;
    const t = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((new Date(currentRound.ends_at).getTime() - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(t);
  }, [currentRound?.ends_at]);

  const recent = lastRounds;
  const timerColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f97316" : "#4ade80";

  return (
    <div className="px-4 mt-3" dir="rtl">
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#0d0020,#1a0040)",
          border: "1px solid rgba(243,212,111,0.3)",
          boxShadow: "0 4px 20px rgba(90,32,176,0.3)",
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🎪</span>
            <span className="text-yellow-300 font-black text-xs">حفلة الفواكه</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${timerColor}44` }}>
            <span className="font-black text-xs" style={{ color: timerColor }}>
              {timeLeft > 0 ? `${timeLeft}ث` : "⏳"}
            </span>
            <span className="text-gray-500 text-[9px]">الجولة #{currentRound?.roundNumber ?? "—"}</span>
          </div>
        </div>

        {/* Results scroll */}
        <div className="flex gap-2 px-3 py-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {recent.length === 0 && (
            <span className="text-gray-600 text-xs py-1 w-full text-center">لا توجد نتائج بعد</span>
          )}
          {recent.map((r: any, i: number) => {
            const fruit = FRUITS.find(f => f.key === r.winnerFruit);
            const isLatest = i === 0;
            return (
              <div key={r._id} className="flex-shrink-0 flex flex-col items-center gap-0.5">
                <div className="rounded-xl flex items-center justify-center"
                  style={{
                    width: isLatest ? 44 : 36,
                    height: isLatest ? 44 : 36,
                    background: fruit ? `${fruit.color}22` : "rgba(255,255,255,0.05)",
                    border: `${isLatest ? 2 : 1.5}px solid ${fruit?.color ?? "#ffffff33"}`,
                    boxShadow: isLatest ? `0 0 12px ${fruit?.color ?? "#fff"}66` : "none",
                    fontSize: isLatest ? 26 : 20,
                    transition: "all 0.2s",
                  }}>
                  {fruit ? fruit.emoji : "❓"}
                </div>
                <span className="font-bold"
                  style={{ fontSize: isLatest ? 9 : 8, color: fruit?.color ?? "#888" }}>
                  {fruit?.label ?? "؟"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
