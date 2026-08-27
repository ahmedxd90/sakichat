import { supabase } from "../lib/supabaseClient";
import { useProfile } from "../components/ProfileManager";
import { useEffect, useState } from "react";
import { toast } from "../lib/toast";
import { NativePurchases } from "@capgo/native-purchases";

interface WalletPageProps {
  onBack: () => void;
  onOpenAgent: () => void;
  onMessage?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const PACKAGES = [
  { id: "sakinew60k", productId: "sakinew60k", dollars: 0.99, coins: 60_000 },
  { id: "sakinew300k", productId: "sakinew300k", dollars: 4.99, coins: 300_000 },
  { id: "sakinew600k", productId: "sakinew600k", dollars: 9.99, coins: 600_000 },
  { id: "sakinew3m", productId: "sakinew3m", dollars: 49.99, coins: 3_000_000 },
];

const DIAMOND_TIERS = [1_200_000, 2_400_000, 3_600_000, 4_800_000, 6_000_000, 12_000_000];
const AGENCY_DIAMOND_TO_COINS = 0.1;

function GoldCoinIcon({ size = 34 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" aria-label="عملة ذهبية" role="img"><defs><linearGradient id="goldCoinGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3a3"/><stop offset=".35" stopColor="#facc15"/><stop offset=".7" stopColor="#f59e0b"/><stop offset="1" stopColor="#b45309"/></linearGradient></defs><circle cx="20" cy="20" r="17" fill="url(#goldCoinGradient)" stroke="#fef3c7" strokeWidth="2"/><circle cx="20" cy="20" r="12" fill="none" stroke="#b45309" strokeOpacity=".55" strokeWidth="1.4"/><path d="M20 10l2.2 6.1 6.3.2-5 3.8 1.8 6-5.3-3.5-5.3 3.5 1.8-6-5-3.8 6.3-.2L20 10z" fill="#fff7c2" opacity=".9"/></svg>;
}

function DiamondIcon({ size = 30 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" aria-label="الماس" role="img"><path d="M8 13l6-6h12l6 6-12 20L8 13z" fill="#60a5fa" stroke="#2563eb" strokeWidth="1.5"/><path d="M8 13h24M14 7l6 26 6-26M12 13l8 20 8-20" fill="none" stroke="#dbeafe" strokeWidth="1.4" opacity=".9"/><path d="M14 9h12l3 3H11l3-3z" fill="#eff6ff" opacity=".7"/></svg>;
}

export default function WalletPage({ onBack, onOpenAgent, onMessage, onViewProfile }: WalletPageProps) {
  const { profile, refreshProfile } = useProfile();
  const [agents, setAgents] = useState<any[]>([]);
  const [agencyDiamonds, setAgencyDiamonds] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: ags } = await supabase.from('agents').select('*');
      setAgents(ags || []);
    };
    fetchData();
  }, []);

  const sendDirectMessage = async ({ receiverId, content }: any) => {};
  const convertDiamonds = async ({ diamonds }: any) => ({ coinsReceived: 0 });
  const convertAgencyDiamonds = async ({ diamonds }: any) => ({ coins: 0 });
  const verifyAndCredit = async ({ productId, purchaseToken, transactionId }: any) => {};

  const [activeTab, setActiveTab] = useState<"coins" | "agency">("coins");
  const [showAgentsSheet, setShowAgentsSheet] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof PACKAGES[0] | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [availableProductIds, setAvailableProductIds] = useState<Set<string>>(new Set());
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [sendingMsg, setSendingMsg] = useState<string | null>(null);

  const [diamondAmount, setDiamondAmount] = useState<number>(0);
  const [converting, setConverting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [agencyConvertAmount, setAgencyConvertAmount] = useState<string>("");
  const [convertingAgency, setConvertingAgency] = useState(false);
  const [showAgencyConfirm, setShowAgencyConfirm] = useState(false);

  const coins = profile?.gold_coins ?? 0;
  const diamonds = profile?.diamonds ?? 0;
  const isAgent = profile?.is_agent ?? false;
  const isSuperAdmin = profile?.is_super_admin ?? false;
  const canCharge = isAgent || isSuperAdmin;

  const agencyPending = agencyDiamonds?.pending_diamonds ?? 0;
  const agencyTotal = agencyDiamonds?.total_diamonds ?? 0;
  const agencyWithdrawn = agencyDiamonds?.withdrawn_diamonds ?? 0;

  useEffect(() => {
    let cancelled = false;
    const loadGoogleProducts = async () => {
      try {
        const support = await NativePurchases.isBillingSupported();
        if (!support?.isBillingSupported) {
          if (!cancelled) setBillingMessage("Google Play Billing غير متاح على هذا الجهاز");
          return;
        }
        const result = await NativePurchases.getProducts({
          productIdentifiers: PACKAGES.map((item) => item.productId),
          productType: "inapp",
        });
        const ids = new Set((result?.products ?? []).map((product: any) => product.identifier).filter(Boolean));
        if (!cancelled) {
          setAvailableProductIds(ids);
          setBillingMessage(ids.size === 0 ? "لم تُرجع Google Play أي منتجات. ثبّت التطبيق من Internal testing بالحساب المختبر." : null);
        }
      } catch (error) {
        console.warn("Google Play products query failed", error);
        if (!cancelled) setBillingMessage("تعذر الاتصال بمنتجات Google Play. تأكد من تثبيت التطبيق من Google Play.");
      }
    };
    void loadGoogleProducts();
    return () => { cancelled = true; };
  }, []);

  const handlePackageClick = async (pkg: typeof PACKAGES[0]) => {
    setPurchasingId(pkg.id);
    let purchaseStarted = false;
    try {
      let productIds = availableProductIds;
      if (!productIds.has(pkg.productId)) {
        const refreshed = await NativePurchases.getProducts({ productIdentifiers: [pkg.productId], productType: "inapp" });
        productIds = new Set((refreshed?.products ?? []).map((product: any) => product.identifier).filter(Boolean));
        setAvailableProductIds((current) => new Set([...current, ...productIds]));
      }
      if (!productIds.has(pkg.productId)) {
        throw new Error(`منتج ${pkg.productId} غير متاح في Google Play لهذا التطبيق أو الحساب. ثبّت نسخة Internal testing من متجر Google Play.`);
      }
      purchaseStarted = true;
      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: pkg.productId,
        isConsumable: true,
        autoAcknowledgePurchases: true,
      });
      if (transaction?.purchaseToken) {
        await verifyAndCredit({
          productId: pkg.productId,
          purchaseToken: transaction.purchaseToken,
          transactionId: transaction.transactionId,
        });
        toast.success(`🎉 تم شحن ${pkg.coins.toLocaleString()} عملة بنجاح عبر Google Play!`);
      } else {
        throw new Error("لم يتم إرجاع رمز الشراء من Google Play");
      }
    } catch (err: any) {
      console.error("Google Play purchase error:", err);
      const message = String(err?.message || err || "");
      if (message.includes("غير متاح") || message.toLowerCase().includes("item") || message.toLowerCase().includes("product")) {
        toast.error(message || "منتج Google Play غير متاح. استخدم نسخة Internal testing.");
      }
      // بعد بدء Google Play لا نفتح مسارًا بديلًا؛ فشل التحقق يجب أن يبقى فشلًا.
      if (!purchaseStarted) {
        setSelectedPackage(pkg);
        setShowAgentsSheet(true);
      } else {
        toast.error("تعذر التحقق من عملية Google Play. لم تتم إضافة العملات.");
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const handleSendMessageToAgent = async (agent: any, pkg?: typeof PACKAGES[0]) => {
    if (!agent?.userId) return;
    const pkgInfo = pkg || selectedPackage;
    const msgText = pkgInfo
      ? `مرحبا ${agent.name}، أريد شراء عملات ذهبية ${pkgInfo.coins.toLocaleString()} عملة (${pkgInfo.productId}) بسعر ${pkgInfo.dollars}$`
      : `مرحبا ${agent.name}، أريد شراء عملات ذهبية`;
    setSendingMsg(agent.id);
    try {
      await sendDirectMessage({ receiverId: agent.user_id, content: msgText });
      toast.success("تم إرسال الطلب لوكيل الشحن");
      setShowAgentsSheet(false);
    } catch (e: any) {
      toast.error(e.message || "فشل إرسال الرسالة");
    } finally {
      setSendingMsg(null);
    }
  };

  const handleConvert = async () => {
    if (!diamondAmount || diamondAmount <= 0) {
      toast.error("اختر كمية الماس أولاً");
      return;
    }
    setShowConfirm(true);
  };

  const confirmConvert = async () => {
    setShowConfirm(false);
    setConverting(true);
    try {
      const result = await convertDiamonds({ diamonds: diamondAmount });
      toast.success(`تم تحويل ${diamondAmount.toLocaleString()} ماسة وحصلت على ${result.coinsReceived.toLocaleString()} عملة ذهبية`);
      setDiamondAmount(0);
    } catch (e: any) {
      toast.error(e.message || "فشل التحويل");
    } finally {
      setConverting(false);
    }
  };

  const handleAgencyConvert = async () => {
    const amount = parseInt(agencyConvertAmount);
    if (!amount || amount <= 0) { toast.error("أدخل كمية صحيحة"); return; }
    if (amount > agencyPending) { toast.error(`ماس الوكالة غير كافٍ. لديك ${agencyPending.toLocaleString()} ماسة`); return; }
    await confirmAgencyConvert(amount);
  };

  const confirmAgencyConvert = async (requestedAmount?: number) => {
    setShowAgencyConfirm(false);
    setConvertingAgency(true);
    const amount = requestedAmount ?? parseInt(agencyConvertAmount);
    try {
      const result = await convertAgencyDiamonds({ diamonds: amount });
      toast.success(`✅ تم تحويل ${amount.toLocaleString()} ماسة وكالة → ${result.coins.toLocaleString()} عملة ذهبية`);
      setAgencyConvertAmount("");
    } catch (e: any) {
      toast.error(e.message || "فشل التحويل");
    } finally {
      setConvertingAgency(false);
    }
  };

  const coinsFromDiamonds = Math.floor(diamondAmount * 0.5);
  const agencyConvertNum = parseInt(agencyConvertAmount) || 0;
  const coinsFromAgencyDiamonds = Math.floor(agencyConvertNum * AGENCY_DIAMOND_TO_COINS);

  const tabs = [
    { id: "coins" as const, label: "المحفظة", icon: <GoldCoinIcon size={20} /> },
    { id: "agency" as const, label: "الماس", icon: <DiamondIcon size={20} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl border-b border-white/6" style={{ background: "rgba(255,255,255,0.96)" }}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <button onClick={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <h2 className="text-gray-900 font-black text-lg tracking-wide">المحفظة</h2>
          <button
            onClick={() => { setSelectedPackage(null); setShowAgentsSheet(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-90 transition-transform"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span className="text-green-400 text-xs font-bold">وكلاء</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl transition-all active:scale-95 text-xs font-bold"
              style={activeTab === t.id
                ? t.id === "coins"
                  ? { background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24" }
                  : t.id === "diamonds"
                  ? { background: "linear-gradient(135deg, rgba(96,165,250,0.2), rgba(59,130,246,0.1))", border: "1px solid rgba(96,165,250,0.4)", color: "#60a5fa" }
                  : { background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(219,39,119,0.1))", border: "1px solid rgba(236,72,153,0.4)", color: "#ec4899" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#6b7280" }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* COINS TAB */}
        {activeTab === "coins" && (
          <div className="px-4 pt-5 space-y-4">
            {/* Balance card */}
            <div className="relative rounded-3xl p-5 overflow-hidden" style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7, #fde68a)", border: "1px solid rgba(245,158,11,0.35)" }}>
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />
              <div className="relative z-10">
                <p className="text-amber-700/70 text-xs font-medium mb-3">رصيدك الحالي</p>
                <div className="flex items-end gap-3">
                  <GoldCoinIcon size={42} />
                  <span className="text-amber-800 font-black text-4xl leading-none">{coins.toLocaleString()}</span>
                </div>
                <p className="text-yellow-700/70 text-xs mt-2">عملات ذهبية</p>
              </div>
            </div>

            {/* Google Play info */}
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.5 1.5 0 0 1-.86-1.354V3.168a1.5 1.5 0 0 1 .86-1.354zM15.207 13.414l2.293 2.293-11.5 6.646a1.5 1.5 0 0 1-2.293-1.293v-1.5l11.5-6.146zM15.207 10.586L3.707 4.44v-1.5a1.5 1.5 0 0 1 2.293-1.293l11.5 6.646-2.293 2.293z" />
              </svg>
              <div>
                <p className="text-blue-400 text-xs font-bold">شحن Google Play الرسمي</p>
                <p className="text-gray-500 text-[11px]">اضغط على أي باقة للشحن الفوري عبر متجر جوجل</p>
              </div>
            </div>

            {billingMessage && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-right text-[11px] font-bold leading-5 text-amber-800">
                {billingMessage}
              </div>
            )}

            {/* Packages */}
            <div className="space-y-2.5">
              {PACKAGES.map((pkg) => {
                const isBusy = purchasingId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => handlePackageClick(pkg)}
                    disabled={isBusy}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60"
                    style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 4px 14px rgba(15,23,42,.05)" }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}><GoldCoinIcon size={30} /></div>
                    <div className="flex-1 text-right">
                      <p className="text-gray-800 font-black text-base">{pkg.coins.toLocaleString()} عملة</p>
                      <p className="text-yellow-500 text-xs font-bold mt-0.5">{pkg.dollars} $ ({pkg.productId})</p>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl flex-shrink-0" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 2px 10px rgba(59,130,246,0.3)" }}>
                      {isBusy ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-white text-xs font-black">شحن</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {canCharge && (
              <button
                onClick={onOpenAgent}
                className="w-full py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 20px rgba(16,185,129,0.25)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>شحن مستخدم (وكالة الشحن)</span>
              </button>
            )}

            {/* SAKI ID */}
            <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)" }}>
              <div>
                <p className="text-gray-500 text-xs">رقم SAKI ID الخاص بك</p>
                <p className="text-purple-400 font-mono font-black text-lg">#{profile?.sakiId}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard?.writeText(profile?.sakiId ?? ""); toast.success("تم نسخ الـ ID"); }}
                className="px-3 py-2 rounded-xl text-xs font-bold active:scale-90 transition-transform"
                style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.22)", color: "#a855f7" }}
              >
                نسخ
              </button>
            </div>
          </div>
        )}

        {/* الماس العادي أزيل؛ يعرض تبويب الماس رصيد الوكالة للجميع */}
        {false && activeTab === "diamonds" && (
          <div className="px-4 pt-5 space-y-4">
            <div className="relative rounded-3xl p-5 overflow-hidden" style={{ background: "linear-gradient(135deg, #0c1a3a, #1e3a5f, #1d4ed8)", border: "1px solid rgba(96,165,250,0.25)" }}>
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }} />
              <div className="relative z-10">
                <p className="text-blue-200/60 text-xs font-medium mb-3">رصيدك الحالي من الماس</p>
                <div className="flex items-end gap-3">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 9l10 13L22 9z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.2" />
                  </svg>
                  <span className="text-white font-black text-4xl leading-none">{diamonds.toLocaleString()}</span>
                </div>
                <p className="text-blue-200/50 text-xs mt-2">ماسة</p>
              </div>
            </div>

            <div className="rounded-3xl p-4 space-y-4" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 4px 14px rgba(15,23,42,.05)" }}>
              <p className="text-gray-800 font-bold text-sm">تحويل الماس إلى عملات ذهبية</p>
              <div className="grid grid-cols-3 gap-2">
                {DIAMOND_TIERS.map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setDiamondAmount(tier)}
                    disabled={tier > diamonds}
                    className="py-3 rounded-2xl text-xs font-bold active:scale-95 transition-all disabled:opacity-25 flex flex-col items-center gap-1"
                    style={diamondAmount === tier
                      ? { background: "linear-gradient(135deg, rgba(96,165,250,0.3), rgba(59,130,246,0.2))", border: "1px solid rgba(96,165,250,0.6)", color: "#60a5fa" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                  >
                    {tier >= 1000 ? `${tier / 1000}k` : tier}
                  </button>
                ))}
              </div>

              {diamondAmount > 0 && (
                <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.15)" }}>
                  <span className="text-blue-400 text-sm font-bold">💎 {diamondAmount.toLocaleString()}</span>
                  <span className="text-yellow-400 text-sm font-bold">🪙 {coinsFromDiamonds.toLocaleString()} عملة</span>
                </div>
              )}

              <button
                onClick={handleConvert}
                disabled={converting || diamondAmount <= 0}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white" }}
              >
                {converting ? "جارٍ التحويل..." : "تحويل الآن"}
              </button>
            </div>
          </div>
        )}

        {/* AGENCY DIAMONDS TAB — متاح لجميع المستخدمين */}
        {activeTab === "agency" && agencyDiamonds && (
          <div className="px-4 pt-5 space-y-4">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)" }}>
              <DiamondIcon size={34} />
              <div>
                <p className="text-pink-400 text-xs font-bold">الماس</p>
                <p className="text-gray-500 text-[11px]">الرصيد القابل للتحويل: 💎 {agencyPending.toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-3xl p-4 space-y-4" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 4px 14px rgba(15,23,42,.05)" }}>
              <div className="flex items-center justify-between gap-2"><p className="text-gray-600 text-xs font-bold">اختر كمية التحويل</p><button type="button" onClick={() => setAgencyConvertAmount(String(agencyPending))} className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 border border-emerald-200">تحويل الكل</button></div>
              <input
                type="number"
                value={agencyConvertAmount}
                onChange={e => setAgencyConvertAmount(e.target.value)}
                placeholder="أدخل كمية الماس للتحويل..."
                className="w-full px-4 py-3 rounded-2xl text-gray-800 text-sm outline-none"
                style={{ background: "#f8fafc", border: "1px solid #d1d5db" }}
              />
              <button
                onClick={handleAgencyConvert}
                disabled={convertingAgency || !agencyConvertAmount}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white active:scale-98 transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #db2777, #ec4899)" }}
              >
                {convertingAgency ? "جارٍ التحويل..." : "تحويل الماس إلى عملات ذهبية"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AGENTS / FALLBACK SHEET */}
      {showAgentsSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAgentsSheet(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto" style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-800 font-black text-base">وكلاء الشحن المعتمدون</h3>
                <p className="text-gray-500 text-xs">اختر وكيل شحن لتنفيذ طلبك فوراً</p>
              </div>
              <button onClick={() => setShowAgentsSheet(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 font-bold">✕</button>
            </div>

            {selectedPackage && (
              <div className="rounded-2xl p-3 flex items-center justify-between" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                <div>
                  <p className="text-yellow-400 text-xs font-bold">الباقة المحددة</p>
                  <p className="text-white font-black text-sm">{selectedPackage.coins.toLocaleString()} عملة</p>
                </div>
                <span className="text-yellow-400 font-bold text-sm">{selectedPackage.dollars} $</span>
              </div>
            )}

            <div className="space-y-2.5">
              {!agents || agents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">لا يوجد وكلاء شحن متاحون حالياً</div>
              ) : (
                agents.map((agent: any) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black text-sm">
                        {agent.name?.[0] || "و"}
                      </div>
                      <div>
                        <p className="text-gray-800 font-bold text-sm">{agent.name}</p>
                        <p className="text-gray-500 text-[11px]">معرف الوكيل: #{agent.sakiId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendMessageToAgent(agent, selectedPackage || undefined)}
                      disabled={sendingMsg === agent.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                      style={{ background: "#FFD400", color: "#000" }}
                    >
                      {sendingMsg === agent.id ? "جارٍ الإرسال..." : "تواصل للشحن"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CONVERT DIALOG */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-xs rounded-3xl p-5 space-y-4 text-center" style={{ background: "#ffffff", border: "1px solid #bfdbfe", boxShadow: "0 14px 40px rgba(15,23,42,.16)" }}>
            <h3 className="text-gray-800 font-black text-base">تأكيد تحويل الماس</h3>
            <p className="text-gray-600 text-xs">هل تريد تحويل {diamondAmount.toLocaleString()} ماسة والحصول على {coinsFromDiamonds.toLocaleString()} عملة ذهبية؟</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-bold text-xs">إلغاء</button>
              <button onClick={confirmConvert} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs">تأكيد التحويل</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
