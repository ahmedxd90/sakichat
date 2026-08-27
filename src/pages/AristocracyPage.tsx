// تصميم الأرستقراطية المتطور: مستوحى من Hiya مع رتب مركزية، بطاقات امتيازات شبكية، وربط حقيقي بـ Supabase.
// الرتب المتاحة: فارس، بارون، فيكونت، إيرل، ماركيز، دوق، ملك، إمبراطور.
import { supabase } from "../lib/supabaseClient";
import { useMemo, useRef, useState, useEffect } from "react";
import { toast } from "../lib/toast";
import { 
  BadgeCheck, Coins, Crown, DoorOpen, Gift, Headphones, Home, 
  Image as ImageIcon, Lock, MessageCircle, Palette, Shield, 
  Sparkles, Star, Trophy, UserRound, Gem, ChevronRight, ChevronLeft,
  Clock, CheckCircle2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AristocracyPageProps { 
  onBack: () => void; 
  onAdminAristocracy?: () => void; 
}

const durationOptions = [
  { days: 30, label: "30 يومًا", key: "price_30" },
  { days: 90, label: "90 يومًا", key: "price_90" },
  { days: 365, label: "365 يومًا", key: "price_365" },
];

const FEATURE_ICONS: Record<string, any> = { 
  "شارة": BadgeCheck, "مكافأة": Coins, "اسم": Palette, "دخول": DoorOpen, 
  "مركبة": DoorOpen, "فقاعة": MessageCircle, "إطار": ImageIcon, "أولوية": Star, 
  "لقب": Crown, "إهداء": Gift, "هدايا": Gift, "لوحة": Trophy, "وسام": Trophy, 
  "دعم": Headphones, "خدمة": Headphones, "غرفة": Home, "قصر": Home, 
  "حماية": Shield, "معرف": UserRound, "إيموجي": Sparkles, "تجربة": Gem, 
  "تسريع": Sparkles, "ترقية": Sparkles, "مؤثرات": Sparkles, "كل": Gem, "ظهور": Star 
};

function getFeatureIcon(title: string) {
  const found = Object.keys(FEATURE_ICONS).find((key) => title.includes(key));
  return FEATURE_ICONS[found ?? "شارة"] ?? BadgeCheck;
}

export default function AristocracyPage({ onBack }: AristocracyPageProps) {
  const [status, setStatus] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [durationDays, setDurationDays] = useState(30);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Parallel fetching
        const [profileRes, statusRes, ranksRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).single(),
          supabase.from('aristocracy_status').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('aristocracy_ranks').select('*').order('level', { ascending: true })
        ]);

        setProfile(profileRes.data);
        setStatus(statusRes.data || { level: 0, is_active: false });
        setRanks(ranksRes.data || []);
        
        // Find current rank index or default to 0
        if (statusRes.data?.is_active) {
          const idx = (ranksRes.data || []).findIndex(r => r.level === statusRes.data.level);
          if (idx !== -1) setSelectedIndex(idx);
        }
      } catch (err) {
        console.error("Error fetching aristocracy data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentRank = ranks[selectedIndex];
  const isActiveRank = status?.is_active && status?.level === currentRank?.level;

  const handlePurchase = async () => {
    if (!currentRank || busy) return;
    setBusy(true);
    try {
      const priceKey = durationOptions.find(d => d.days === durationDays)?.key as string;
      const price = currentRank[priceKey];

      if ((profile?.gold_coins || 0) < price) {
        throw new Error("رصيدك من العملات الذهبية غير كافٍ");
      }

      // 1. Deduct coins
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ gold_coins: profile.gold_coins - price })
        .eq('user_id', profile.user_id);
      
      if (deductError) throw deductError;

      // 2. Update aristocracy status
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { error: statusError } = await supabase
        .from('aristocracy_status')
        .upsert({
          user_id: profile.user_id,
          level: currentRank.level,
          is_active: true,
          expires_at: expiresAt.toISOString()
        });

      if (statusError) throw statusError;

      toast.success(`تم تفعيل رتبة ${currentRank.name_ar} بنجاح! 🎉`);
      
      // Refresh local state
      setStatus({ level: currentRank.level, is_active: true, expires_at: expiresAt.toISOString() });
      setProfile({ ...profile, gold_coins: profile.gold_coins - price });
    } catch (error: any) {
      toast.error(error.message || "فشل إتمام العملية");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 rounded-full border-2 border-amber-500 border-t-transparent" 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden" dir="rtl">
      {/* Background Glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 50% 30%, ${currentRank?.color || '#fff'}, transparent 70%)` 
          }}
        />
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ChevronRight size={24} />
        </button>
        <h1 className="text-lg font-bold">الأرستقراطية</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="pb-32">
        {/* Rank Selector Slider */}
        <div className="relative py-8 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-6 overflow-x-auto px-10 no-scrollbar w-full justify-start md:justify-center">
            {ranks.map((r, idx) => (
              <button
                key={r.level}
                onClick={() => setSelectedIndex(idx)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedIndex === idx 
                    ? 'bg-white text-black scale-110 shadow-lg' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {r.name_ar}
              </button>
            ))}
          </div>

          {/* Central Rank Card */}
          <div className="relative w-full max-w-sm px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-[4/5] rounded-[40px] overflow-hidden border border-white/10 flex flex-col items-center justify-center p-8 text-center"
                style={{ background: currentRank?.bg_gradient }}
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-[80px]" />
                  <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full blur-[80px]" />
                </div>

                <div className="relative z-10">
                  <div className="mb-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-[10px] font-bold tracking-wider uppercase text-white/60">
                    رتبة المستوى {currentRank?.level}
                  </div>
                  
                  <div className="relative w-40 h-44 mb-6 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        boxShadow: [`0 0 20px ${currentRank?.color}44`, `0 0 50px ${currentRank?.color}88`, `0 0 20px ${currentRank?.color}44`]
                      }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="absolute inset-4 rounded-full blur-2xl opacity-50"
                    />
                    <img 
                      src={currentRank?.icon_url || `/assets/aristocracy/rank_${currentRank?.level}.png`} 
                      alt={currentRank?.name_ar}
                      className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://img.icons8.com/fluency/240/crown.png';
                      }}
                    />
                  </div>

                  <h2 
                    className="text-4xl font-black mb-2 bg-clip-text text-transparent"
                    style={{ backgroundImage: currentRank?.gradient }}
                  >
                    {currentRank?.name_ar}
                  </h2>
                  
                  {isActiveRank ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold bg-emerald-400/10 px-4 py-2 rounded-2xl">
                      <CheckCircle2 size={16} />
                      رتبتك الحالية نشطة
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm font-medium">استمتع بـ {currentRank?.features?.length || 0} مزايا حصرية</p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation Arrows */}
            <button 
              onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/5 rounded-full disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setSelectedIndex(prev => Math.min(ranks.length - 1, prev + 1))}
              disabled={selectedIndex === ranks.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/5 rounded-full disabled:opacity-0 transition-opacity"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Privileges Grid */}
        <div className="px-6 mt-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">امتيازات الرتبة</h3>
            <span className="text-sm text-white/40">{currentRank?.features?.length || 0} ميزة</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {currentRank?.features?.map((feat: any, i: number) => {
              const Icon = getFeatureIcon(feat.title);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/5 border border-white/5 rounded-[24px] p-4 flex flex-col gap-3"
                >
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: `${currentRank?.color}22`, color: currentRank?.color }}
                  >
                    <Icon size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{feat.title}</h4>
                    <p className="text-[10px] text-white/40 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Balance & Info */}
        <div className="px-6 mt-10">
          <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-[32px] p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-500/60 font-bold mb-1">رصيدك الحالي</p>
              <div className="flex items-center gap-2">
                <Coins className="text-amber-500" size={20} />
                <span className="text-2xl font-black text-amber-500">
                  {profile?.gold_coins?.toLocaleString() || 0}
                </span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Saki Gold</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Purchase Bar */}
      <footer className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent z-50">
        <div className="max-w-md mx-auto">
          {/* Duration Selector */}
          <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-2xl border border-white/5">
            {durationOptions.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setDurationDays(opt.days)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  durationDays === opt.days 
                    ? 'bg-white/10 text-white shadow-inner' 
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handlePurchase}
            disabled={busy || isActiveRank}
            className={`w-full py-4 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${
              isActiveRank 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)]'
            }`}
          >
            {busy ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
            ) : isActiveRank ? (
              <>
                <CheckCircle2 size={22} />
                تم التفعيل
              </>
            ) : (
              <>
                تفعيل {currentRank?.name_ar} بـ {currentRank?.[durationOptions.find(d => d.days === durationDays)?.key as string]?.toLocaleString()}
                <Coins size={20} />
              </>
            )}
          </button>
          
          <p className="text-center mt-3 text-[10px] text-white/20">
            بالضغط على تفعيل، أنت توافق على شروط وأحكام العضوية الأرستقراطية.
          </p>
        </div>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
