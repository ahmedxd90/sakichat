
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";
import { 
  PRO1_BADGE_URL,
  PRO2_BADGE_URL,
  PRO3_BADGE_URL,
  PRO4_BADGE_URL,
  PRO5_BADGE_URL
} from "../components/VipBadge";
import { 
  Crown, 
  ShieldCheck, 
  Type, 
  MessageSquare, 
  UserCheck, 
  Smile, 
  Zap, 
  Gift, 
  Volume2, 
  Frame, 
  TrendingUp, 
  Star, 
  Headset, 
  Palette, 
  Wand2, 
  Mic2, 
  Gem, 
  Settings2, 
  Award,
  HelpCircle,
  Coins,
  Check,
  ShoppingCart,
  ChevronLeft
} from "lucide-react";

interface ProMembershipPageProps {
  onBack: () => void;
  onOpenSettings: () => void;
}

const PRO_ICONS = [null, PRO1_BADGE_URL, PRO2_BADGE_URL, PRO3_BADGE_URL, PRO4_BADGE_URL, PRO5_BADGE_URL];

const LEVELS_DATA = [
  {
    id: 1,
    name: "PRO 1",
    desc: "الباقة الأولى للاستخدام الأساسي لمدة 30 يوم",
    price: 2000000,
    priceShort: "2M عملة",
    icon: PRO1_BADGE_URL,
    features: [
      { icon: ShieldCheck, title: "شارة برونزية PRO", desc: "شارة تميز خاصة بجانب اسمك" },
      { icon: Type, title: "لون اسم مميز", desc: "إمكانية تغيير لون الاسم إلى التدرج البرونزي" },
      { icon: MessageSquare, title: "فقاعة محادثة", desc: "تصميم فريد لرسائل الدردشة الخاصة بك" },
      { icon: UserCheck, title: "حماية الحساب", desc: "أولوية أعلى في حماية الحساب من البلاغات" },
      { icon: Smile, title: "إيموجي مخصصة", desc: "فتح حزمة إيموجي PRO الحصرية الأولى" },
      { icon: Zap, title: "سرعة تصفح", desc: "تصفح أسرع وتجربة خالية من الإعلانات" },
      { icon: Gift, title: "هدية يومية", desc: "استلام صندوق هدايا صغير يومياً" },
      { icon: Crown, title: "لقب ترحيبي", desc: "رسالة ترحيب خاصة عند دخولك الغرف" }
    ]
  },
  {
    id: 2,
    name: "PRO 2",
    desc: "الباقة الفضية المتقدمة لمدة 30 يوم",
    price: 4000000,
    priceShort: "4M عملة",
    icon: PRO2_BADGE_URL,
    features: [
      { icon: ShieldCheck, title: "شارة فضية PRO", desc: "شارة متطورة بلون فضي لامع" },
      { icon: Palette, title: "ألوان اسم متعددة", desc: "خيارات ألوان إضافية ومضيئة للأسماء" },
      { icon: Frame, title: "إطار بروفايل فضي", desc: "إطار متحرك يحيط بصورة ملفك الشخصي" },
      { icon: Volume2, title: "صوت دخول مميز", desc: "مؤثر صوتي فريد عند دخولك للبثوث" },
      { icon: UserCheck, title: "بطاقة تعريفية", desc: "خلفية بطاقة بروفايل قابلة للتخصيص" },
      { icon: TrendingUp, title: "مضاعف نقاط", desc: "الحصول على نقاط تفاعل بنسبة 1.5x" },
      { icon: Star, title: "صناديق حظ", desc: "فتح صندوق حظ إضافي أسبوعياً" },
      { icon: Headset, title: "دعم فني سريع", desc: "أولوية في الرد من فريق الدعم الفني" }
    ]
  },
  {
    id: 3,
    name: "PRO 3",
    desc: "الباقة الذهبية المميزة لمدة 30 يوم",
    price: 7000000,
    priceShort: "7M عملة",
    icon: PRO3_BADGE_URL,
    features: [
      { icon: Crown, title: "شارة ذهبية ملكية", desc: "شارة ذهبية فاخرة تظهر في قوائم المتصدرين" },
      { icon: Wand2, title: "تدرجات لونية ذهبية", desc: "أسماء متدرجة باللون الذهبي البراق" },
      { icon: Frame, title: "إطار ذهبي متوهج", desc: "إطار بروفايل ذهبي تفاعلي ومتحرك" },
      { icon: Zap, title: "تأثير دخول خاص", desc: "تأثير مرئي مبهر عند دخولك الغرف" },
      { icon: Mic2, title: "مايك مميز", desc: "شكل مايكروفون ذهبي مميز في الغرف الصوتية" },
      { icon: Gem, title: "هدايا حصرية", desc: "إرسال هدايا PRO الحصرية مجاناً أسبوعياً" },
      { icon: Settings2, title: "تثبيت تعليق", desc: "إمكانية تثبيت تعليقك في الدردشة العامة" },
      { icon: ShieldCheck, title: "درع حماية متقدم", desc: "حماية مضاعفة ضد الحظر المطلق" }
    ]
  },
  {
    id: 4,
    name: "PRO 4",
    desc: "الباقة الماسية الفائقة لمدة 30 يوم",
    price: 12000000,
    priceShort: "12M عملة",
    icon: PRO4_BADGE_URL,
    features: [
      { icon: Gem, title: "شارة الماس الفاخرة", desc: "شارة ماسية براقة تعكس تميزك المطلق" },
      { icon: Palette, title: "اسم متحرك وملون", desc: "تدرجات ألوان متحركة لاسمك المستعار" },
      { icon: Frame, title: "إطار ماسي متطور", desc: "إطار بروفايل ماسي فريد من نوعه" },
      { icon: Zap, title: "مركبة دخول فاخرة", desc: "مركبة دخول متحركة فريدة عند دخولك" },
      { icon: Zap, title: "تأثير تفاعلي خاص", desc: "تأثير ناري أو ماسي يظهر حول رسائلك" },
      { icon: Coins, title: "استرجاع عملات", desc: "استرجاع 5% من أرباح الهدايا المرسلة" },
      { icon: Settings2, title: "إدارة الغرف", desc: "صلاحيات إضافية لإدارة الغرف الصوتية" },
      { icon: Award, title: "وسام الشرف الماسي", desc: "وسام خاص يظهر في أعلى صفحة ملفك" }
    ]
  },
  {
    id: 5,
    name: "PRO 5",
    desc: "الباقة الملكية القصوى لمدة 30 يوم",
    price: 20000000,
    priceShort: "20M عملة",
    icon: PRO5_BADGE_URL,
    features: [
      { icon: Crown, title: "شارة الملك المطلق", desc: "أرقى شارة ملكية متوفرة في النظام" },
      { icon: Wand2, title: "ألوان ملكية مخصصة", desc: "تخصيص كامل لألوان الاسم والتعليقات" },
      { icon: Frame, title: "إطار ملكي أسطوري", desc: "إطار بروفايل أسطوري مع هالة ضوئية" },
      { icon: Zap, title: "تأثير دخول أسطوري", desc: "تأثير دخول أسطوري ضخم يملأ الشاشة" },
      { icon: Crown, title: "مقعد VIP الملك", desc: "مقعد خاص وثابت في جميع الغرف الصوتية" },
      { icon: Zap, title: "مزايا غير محدودة", desc: "استخدام غير محدود لكافة إيموجيات ومميزات التطبيق" },
      { icon: Coins, title: "عائدات مضاعفة", desc: "مضاعفة أرباح الهدايا والمكافآت بنسبة 2x" },
      { icon: Headset, title: "مدير حساب خاص", desc: "خدمة عملاء ومساعد خاص متاح على مدار الساعة" }
    ]
  }
];

export default function ProMembershipPage({ onBack, onOpenSettings }: ProMembershipPageProps) {
  const proStatus = useQuery(api.proMembership.getMyProStatus);
  const myProfile = useQuery(api.profiles.getMyProfile);
  const purchasePro = useMutation(api.proMembership.purchasePro);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const currentLevel = LEVELS_DATA[currentIndex];
  const purchasedMaxLevel = proStatus?.isPro ? proStatus.proLevel : 0;

  const handleConfirmPurchase = async () => {
    if (isPurchasing) return;
    
    const balance = myProfile?.goldCoins ?? 0;
    if (balance < currentLevel.price) {
      toast.error("رصيد العملات غير كافٍ لشراء هذا المستوى");
      setShowCheckout(false);
      return;
    }

    try {
      setIsPurchasing(true);
      await purchasePro({ level: currentLevel.id });
      setShowCheckout(false);
      setShowSuccess(true);
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء الشراء");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d0c11] text-white font-['Cairo'] flex flex-col z-50 overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#0d0c11]/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-stone-300 hover:text-white transition active:scale-90">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-sm font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent uppercase tracking-widest">PRO SAKI STORE</h1>
        <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-stone-300 hover:text-white transition active:scale-90">
          <Settings2 size={18} />
        </button>
      </header>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
        {/* Levels Nav */}
        <nav className="px-4 mt-6 mb-8">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1">
            {LEVELS_DATA.map((lvl, idx) => {
              const isSelected = idx === currentIndex;
              const isPurchased = lvl.id <= purchasedMaxLevel;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-2 border flex-shrink-0 active:scale-95 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#f59e0b] text-white border-purple-400 shadow-lg shadow-purple-900/40 scale-105' 
                      : isPurchased
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                      : 'bg-white/5 text-stone-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  <img src={lvl.icon} alt="" className="w-5 h-5 object-contain" />
                  <span>{lvl.name}</span>
                  {isPurchased && <Check size={12} className="text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="max-w-md mx-auto px-4 space-y-8">
          {/* Badge Display Section */}
          <div className="text-center relative py-6">
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
              <div className="w-56 h-56 rounded-full blur-[100px] bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#f59e0b]"></div>
            </div>
            
            <div className="relative inline-block">
              <div className="absolute -inset-4 rounded-full blur-2xl opacity-50 bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#f59e0b] animate-pulse"></div>
              <div className="relative w-40 h-40 mx-auto bg-black/40 rounded-full border-2 border-white/10 flex items-center justify-center shadow-2xl overflow-hidden backdrop-blur-sm">
                <img 
                  src={currentLevel.icon} 
                  alt={currentLevel.name} 
                  className="w-32 h-32 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-bounce-in" 
                />
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                {currentLevel.name}
              </h2>
              <div className="h-1 w-16 mx-auto mt-2 bg-gradient-to-r from-purple-500 to-amber-500 rounded-full"></div>
              <p className="text-sm text-stone-400 mt-3 font-medium px-6">{currentLevel.desc}</p>
            </div>
          </div>

          {/* Features Grid */}
          <section className="pb-8">
            <h3 className="text-sm font-black text-stone-200 mb-5 px-1 flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400" /> مميزات العضوية الملكية
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {currentLevel.features.map((feat, i) => (
                <div key={i} className="flex flex-col gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-900/60 to-black border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <feat.icon size={22} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-stone-100">{feat.title}</h4>
                    <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer / Purchase Bar */}
      <footer className="flex-shrink-0 bg-[#0d0c11]/95 backdrop-blur-xl border-t border-white/10 px-6 py-5 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">سعر التفعيل</span>
            <div className="text-xl font-black text-amber-400 flex items-center gap-2 mt-0.5">
              <Coins size={22} className="text-amber-500" /> {currentLevel.price.toLocaleString()}
            </div>
          </div>
          
          {currentLevel.id <= purchasedMaxLevel ? (
            <button disabled className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-sm px-8 py-4 rounded-2xl opacity-90 cursor-not-allowed flex items-center gap-2">
              <Check size={20} /> مفعّل
            </button>
          ) : (
            <button 
              onClick={() => setShowCheckout(true)}
              className="flex-1 bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#f59e0b] text-white font-black text-sm px-8 py-4 rounded-2xl shadow-xl shadow-purple-900/40 hover:brightness-110 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} /> تفعيل الآن
            </button>
          )}
        </div>
      </footer>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center px-6 animate-fade-in">
          <div className="bg-[#191724] w-full max-w-sm rounded-[40px] p-8 border border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.3)] animate-slide-up-sheet">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#8b5cf6] via-[#ec4899] to-[#f59e0b] rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl mb-6 rotate-6">
                <img src={currentLevel.icon} alt="" className="w-14 h-14 object-contain" />
              </div>
              <h3 className="text-xl font-black text-white">تأكيد طلب التفعيل</h3>
              <p className="text-xs text-stone-400 mt-2 font-medium">سيتم تفعيل {currentLevel.name} لمدة 30 يوماً</p>
            </div>

            <div className="my-8 bg-white/5 rounded-[30px] p-5 border border-white/10 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-bold">نوع الباقة</span>
                <span className="font-black text-purple-300">{currentLevel.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-bold">تكلفة الشراء</span>
                <span className="font-black text-amber-400">{currentLevel.priceShort}</span>
              </div>
              <div className="h-px bg-white/10"></div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-bold">رصيدك الحالي</span>
                <span className="font-black text-emerald-400">{(myProfile?.goldCoins ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowCheckout(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-stone-400 text-xs font-black py-4 rounded-2xl transition border border-white/10"
              >
                إلغاء
              </button>
              <button 
                onClick={handleConfirmPurchase}
                disabled={isPurchasing}
                className="w-full bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#f59e0b] text-white text-xs font-black py-4 rounded-2xl shadow-lg transition disabled:opacity-50"
              >
                {isPurchasing ? "جاري..." : "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex items-center justify-center px-6 animate-fade-in">
          <div className="bg-[#191724] w-full max-w-sm rounded-[40px] p-8 border border-emerald-500/30 text-center shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-bounce-in">
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-3xl mx-auto flex items-center justify-center mb-6">
              <Check size={40} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-white">تهانينا الملكية!</h3>
            <p className="text-sm text-stone-300 mt-4 leading-relaxed font-medium">
              تم ترقية حسابك إلى <span className="text-purple-400 font-black">{currentLevel.name}</span> بنجاح. استمتع بمميزاتك الجديدة الآن!
            </p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="mt-8 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black py-4 rounded-2xl shadow-lg shadow-emerald-900/40 transition active:scale-95"
            >
              دخول عالم PRO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
