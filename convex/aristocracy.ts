// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// نظام الاستقراطية الجديد: لا توجد رتبة سلطان، والإمبراطور هنا هو الرتبة الإمبراطورية الجديدة.
export const ARISTOCRACY_RANKS = [
  {
    level: 1, name: "لواء", nameAr: "لواء", icon: "🛡️", badge: "🛡️", iconUrl: "/assets/aristocracy/general.png",
    color: "#34d399", gradient: "linear-gradient(135deg,#064e3b,#10b981,#a7f3d0,#064e3b)", glowColor: "rgba(52,211,153,.8)", bgGradient: "linear-gradient(160deg,#031c19,#063c35 52%,#021511)", animationType: "emerald", price30: 500_000, price90: 1_200_000, price365: 4_000_000, dailyCoins: 1_000,
    features: [
      { icon: "🛡️", title: "شارة اللواء", desc: "شارة لامعة بجانب اسمك" }, { icon: "🪙", title: "مكافأة يومية 1,000", desc: "احصل على 1,000 عملة ذهبية يوميًا" }, { icon: "🎨", title: "اسم زمردي", desc: "لون اسمك بتدرج زمردي" }, { icon: "🚪", title: "دخول مميز", desc: "أثر دخول خاص باللواء" }, { icon: "💬", title: "فقاعة دردشة", desc: "فقاعة دردشة بلون الرتبة" }, { icon: "🏅", title: "لوحة الاستقراطية", desc: "ظهور في لوحة الاستقراطية" },
    ],
  },
  {
    level: 2, name: "أرشيدوق", nameAr: "أرشيدوق", icon: "🔷", badge: "🔷", iconUrl: "/assets/aristocracy/archduke.png",
    color: "#38bdf8", gradient: "linear-gradient(135deg,#082f6b,#2563eb,#38bdf8,#172554)", glowColor: "rgba(56,189,248,.85)", bgGradient: "linear-gradient(160deg,#03152e,#09285c 52%,#020b1b)", animationType: "sapphire", price30: 1_200_000, price90: 3_000_000, price365: 10_000_000, dailyCoins: 2_500,
    features: [
      { icon: "🔷", title: "شارة الأرشيدوق", desc: "شارة زرقاء ملكية" }, { icon: "🪙", title: "مكافأة يومية 2,500", desc: "احصل على 2,500 عملة ذهبية يوميًا" }, { icon: "🎨", title: "اسم أزرق ملكي", desc: "اسمك يتوهج بالأزرق الملكي" }, { icon: "🚪", title: "مركبة دخول", desc: "دخولية خاصة بالرتبة" }, { icon: "💬", title: "فقاعة زرقاء", desc: "فقاعة دردشة زرقاء متحركة" }, { icon: "🎭", title: "إيموجي استقراطي", desc: "إيموجيات حصرية للدردشة" }, { icon: "⬆️", title: "أولوية الغرفة", desc: "ظهور أعلى في قائمة الحضور" }, { icon: "🎧", title: "دعم سريع", desc: "أولوية في خدمة العملاء" },
    ],
  },
  {
    level: 3, name: "ماركيز", nameAr: "ماركيز", icon: "💠", badge: "💠", iconUrl: "/assets/aristocracy/marquis.png",
    color: "#e879f9", gradient: "linear-gradient(135deg,#581c87,#a21caf,#e879f9,#f5d0fe,#581c87)", glowColor: "rgba(232,121,249,.9)", bgGradient: "linear-gradient(160deg,#21052f,#4a0b58 52%,#17021e)", animationType: "amethyst", price30: 2_500_000, price90: 6_500_000, price365: 22_000_000, dailyCoins: 5_000,
    features:
      [
      { icon: "💠", title: "شارة الماركيز", desc: "شعار أرجواني مرصع" }, { icon: "🪙", title: "مكافأة يومية 5,000", desc: "احصل على 5,000 عملة ذهبية يوميًا" }, { icon: "🎨", title: "اسم أرجواني متحرك", desc: "تدرج متحرك حسب الرتبة" }, { icon: "🚪", title: "دخولية فاخرة", desc: "تأثير دخول ماركيز" }, { icon: "💬", title: "فقاعة أرجوانية", desc: "فقاعة رسائل فاخرة" }, { icon: "🖼️", title: "إطار ملف شخصي", desc: "إطار خاص يظهر حول صورتك" }, { icon: "🔍", title: "أولوية البحث", desc: "ظهور مميز في نتائج البحث" }, { icon: "👑", title: "لقب بارز", desc: "ألقاب خاصة بالماركيز" }, { icon: "🎁", title: "إرسال الرتبة", desc: "إهداء الاستقراطية لأصدقائك" }, { icon: "🏆", title: "شارة الشرف", desc: "شارة في لوحة الشرف" }, { icon: "⚡", title: "تسريع الترقية", desc: "تقدم أسرع في المزايا" },
    ],
  },
  {
    level: 4, name: "دوق", nameAr: "دوق", icon: "🪽", badge: "🪽", iconUrl: "/assets/aristocracy/duke.png",
    color: "#fbbf24", gradient: "linear-gradient(135deg,#713f12,#d97706,#fbbf24,#60a5fa,#713f12)", glowColor: "rgba(251,191,36,.95)", bgGradient: "linear-gradient(160deg,#281400,#5c2e05 52%,#170b01)", animationType: "royal", price30: 5_000_000, price90: 13_000_000, price365: 45_000_000, dailyCoins: 10_000,
    features: [
      { icon: "🪽", title: "شارة الدوق المجنحة", desc: "رمز ذهبي بأجنحة ملكية" }, { icon: "🪙", title: "مكافأة يومية 10,000", desc: "احصل على 10,000 عملة ذهبية يوميًا" }, { icon: "🎨", title: "اسم ذهبي أزرق", desc: "اسم متحرك بلون الدوق" }, { icon: "🚪", title: "مركبة فاخرة", desc: "دخولية دوقية مبهرة" }, { icon: "💬", title: "فقاعة ملكية", desc: "فقاعة ذهبية مزخرفة" }, { icon: "🖼️", title: "إطار دوقي", desc: "إطار متحرك للملف الشخصي" }, { icon: "🎭", title: "إيموجي ملكي", desc: "مجموعة إيموجيات خاصة" }, { icon: "📌", title: "أعلى في الغرفة", desc: "أولوية ظهور في الغرفة" }, { icon: "👑", title: "ألقاب الوزراء", desc: "فتح ألقاب بارزة" }, { icon: "🎧", title: "خدمة حصرية", desc: "دعم أولوية للعضو" }, { icon: "🏠", title: "غرفة دوقية", desc: "زخرفة خاصة للغرفة" }, { icon: "🛡️", title: "حماية من الطرد", desc: "حماية وفق صلاحيات الغرفة" }, { icon: "🆔", title: "معرف مميز", desc: "مظهر مخصص للمعرف" }, { icon: "🎁", title: "هدايا رتبة", desc: "إرسال الرتبة للأصدقاء" }, { icon: "🏆", title: "لوحة شرف دوقية", desc: "ترتيب بارز في اللوحة" },
    ],
  },
  {
    level: 5, name: "الملك", nameAr: "الملك", icon: "👑", badge: "👑", iconUrl: "/assets/aristocracy/king.png",
    color: "#fb7185", gradient: "linear-gradient(135deg,#7f1d1d,#dc2626,#fbbf24,#fef08a,#7f1d1d)", glowColor: "rgba(251,113,133,1)", bgGradient: "linear-gradient(160deg,#2a070b,#64111b 52%,#1b0708)", animationType: "king", price30: 10_000_000, price90: 26_000_000, price365: 90_000_000, dailyCoins: 20_000,
    features: [
      { icon: "👑", title: "تاج الملك", desc: "تاج ملكي ذهبي وأحمر" }, { icon: "🪙", title: "مكافأة يومية 20,000", desc: "احصل على 20,000 عملة ذهبية يوميًا" }, { icon: "🎨", title: "اسم ملكي ناري", desc: "لون متحرك ذهبي وأحمر" }, { icon: "🚪", title: "دخول ملكي", desc: "تأثير دخول بتاج وأجنحة" }, { icon: "💬", title: "فقاعة الملك", desc: "فقاعة حمراء ذهبية" }, { icon: "🖼️", title: "إطار ملكي", desc: "إطار فاخر للصورة" }, { icon: "🎭", title: "إيموجي الملك", desc: "إيموجيات ملكية حصرية" }, { icon: "📌", title: "صدارة الغرفة", desc: "أولوية في الحضور" }, { icon: "👑", title: "ألقاب بارزة", desc: "فتح ألقاب اجتماعية ووزارية" }, { icon: "🏠", title: "غرفة ملكية", desc: "تصميم ملكي للغرفة" }, { icon: "🛡️", title: "حماية ملكية", desc: "حماية وفق قواعد الإدارة" }, { icon: "🎧", title: "دعم مباشر", desc: "خدمة عملاء أولوية" }, { icon: "🏆", title: "لوحة الشرف", desc: "ظهور ملكي في اللوحة" }, { icon: "🎁", title: "هدايا ملكية", desc: "إهداء الرتبة للمستخدمين" }, { icon: "⚡", title: "ترقية سريعة", desc: "مضاعف تقدم المميزات" }, { icon: "🆔", title: "معرف ملكي", desc: "مظهر مميز للمعرف" }, { icon: "✨", title: "مؤثرات بطاقات", desc: "تأثيرات متحركة للبطاقات" },
    ],
  },
  {
    level: 6, name: "الإمبراطور", nameAr: "الإمبراطور", icon: "🦁", badge: "🦁", iconUrl: "/assets/aristocracy/emperor.png",
    color: "#facc15", gradient: "linear-gradient(135deg,#451a03,#b45309,#facc15,#fff7ae,#ef4444,#451a03)", glowColor: "rgba(250,204,21,1)", bgGradient: "linear-gradient(160deg,#211000,#5b2b04 34%,#2b0c02 68%,#120800)", animationType: "emperor", price30: 20_000_000, price90: 52_000_000, price365: 180_000_000, dailyCoins: 40_000,
    features: [
      { icon: "🦁", title: "شعار الإمبراطور", desc: "أسد ذهبي بهالة إمبراطورية" }, { icon: "🪙", title: "مكافأة يومية 40,000", desc: "احصل على 40,000 عملة ذهبية يوميًا" }, { icon: "🎨", title: "اسم إمبراطوري", desc: "لون ذهبي ناري متحرك" }, { icon: "🚪", title: "دخول إمبراطوري", desc: "أفخم تأثير دخول في Saki" }, { icon: "💬", title: "فقاعة إمبراطورية", desc: "فقاعة ذهبية أسطورية" }, { icon: "🖼️", title: "إطار الإمبراطور", desc: "إطار أسد ملكي للصورة" }, { icon: "🎭", title: "كل إيموجيات الاستقراطية", desc: "الوصول إلى مجموعة الرتب" }, { icon: "📌", title: "الظهور الأول", desc: "أولوية قصوى في الغرف" }, { icon: "👑", title: "كل الألقاب البارزة", desc: "فتح ألقاب الوزراء والألقاب الاجتماعية" }, { icon: "🏠", title: "القصر الإمبراطوري", desc: "تصميم غرفة إمبراطورية" }, { icon: "🛡️", title: "حماية إمبراطورية", desc: "وفق ضوابط الإدارة" }, { icon: "🎧", title: "خدمة إمبراطورية", desc: "دعم مباشر مخصص" }, { icon: "🏆", title: "صدارة لوحة الشرف", desc: "ظهور دائم أثناء النشاط" }, { icon: "🎁", title: "إهداء إمبراطوري", desc: "إهداء الرتبة للمستخدمين" }, { icon: "⚡", title: "تسريع كامل", desc: "رفع أولوية المميزات" }, { icon: "🆔", title: "معرف إمبراطوري", desc: "مظهر حصري للمعرف" }, { icon: "✨", title: "مؤثرات ملكية", desc: "بطاقات وأيقونات متحركة" }, { icon: "🌟", title: "شارة أسطورية", desc: "شارة إمبراطور بجانب الاسم" }, { icon: "🔓", title: "تجربة كاملة", desc: "فتح كل مميزات النظام المتاحة" }, { icon: "🎖️", title: "وسام الإمبراطور", desc: "لقب مصور قابل للعرض" },
    ],
  },
] as const;

export const getAristocracyStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = (await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(1))[0];
    if (!profile) return null;
    const level = profile.aristocracyLevel ?? 0;
    const expiresAt = profile.aristocracyExpiresAt ?? null;
    const isActive = level > 0 && !!expiresAt && expiresAt > Date.now();
    const daysLeft = isActive ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000)) : 0;
    return { level, expiresAt, isActive, daysLeft, rank: ARISTOCRACY_RANKS.find((r) => r.level === level) ?? null, ranks: ARISTOCRACY_RANKS, goldCoins: profile.goldCoins ?? 0 };
  },
});

function getPrice(rank: any, durationDays: number) {
  if (durationDays === 30) return rank.price30;
  if (durationDays === 90) return rank.price90;
  if (durationDays === 365) return rank.price365;
  throw new Error("Invalid duration");
}

export const purchaseAristocracy = mutation({
  args: { level: v.number(), durationDays: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx); if (!userId) throw new Error("Not authorized");
    const rank = ARISTOCRACY_RANKS.find((r) => r.level === args.level); if (!rank) throw new Error("Rank not found");
    const price = getPrice(rank, args.durationDays);
    const profile = (await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(1))[0];
    if (!profile) throw new Error("Profile not found");
    if ((profile.aristocracyLevel ?? 0) >= args.level && profile.aristocracyExpiresAt && profile.aristocracyExpiresAt > Date.now()) throw new Error("لا يمكن شراء رتبة مساوية أو أقل من رتبتك المفعلة");
    const coins = profile.goldCoins ?? 0; if (coins < price) throw new Error(`Insufficient coins. Need ${price.toLocaleString()}`);
    await ctx.db.patch(profile._id, { goldCoins: coins - price });
    const now = Date.now();
    await ctx.db.insert("aristocracyInventory", { ownerUserId: userId, level: args.level, durationDays: args.durationDays, source: "purchase", price, status: "available", createdAt: now });
    return { success: true, rank, addedToInventory: true, price };
  },
});

export const giftAristocracy = mutation({
  args: { targetSakiId: v.string(), level: v.number(), durationDays: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authorized");
    const sender = (await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(1))[0];
    if (!sender?.isSuperAdmin) throw new Error("إهداء الأرستقراطية متاح للسوبر أدمن فقط");
    if (![3, 5, 14, 30].includes(args.durationDays)) throw new Error("المدة يجب أن تكون 3 أو 5 أو 14 أو 30 يومًا");
    const rank = ARISTOCRACY_RANKS.find((r) => r.level === args.level);
    if (!rank) throw new Error("Rank not found");
    const target = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId)).first();
    if (!target || target.userId === userId) throw new Error("المستخدم المستهدف غير صالح");
    if ((target.aristocracyLevel ?? 0) >= args.level && target.aristocracyExpiresAt && target.aristocracyExpiresAt > Date.now()) throw new Error("لا يمكن إهداء رتبة مساوية أو أقل من الرتبة المفعلة لدى المستخدم");
    const now = Date.now();
    await ctx.db.insert("aristocracyInventory", { ownerUserId: target.userId, level: args.level, durationDays: args.durationDays, source: "super_admin_gift", price: 0, status: "available", giftedToSakiId: args.targetSakiId, createdAt: now });
    return { success: true, rank, targetName: target.name, days: args.durationDays, price: 0, addedToInventory: true };
  },
});

export const claimDailyAristocracyCoins = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx); if (!userId) throw new Error("Not authorized");
    const profile = (await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(1))[0];
    if (!profile) throw new Error("Profile not found");
    const rank = ARISTOCRACY_RANKS.find((r) => r.level === profile.aristocracyLevel); if (!rank || !profile.aristocracyExpiresAt || profile.aristocracyExpiresAt <= Date.now()) throw new Error("No active aristocracy");
    const now = Date.now(); if (now - (profile.aristocracyLastDailyClaim ?? 0) < 86400000) throw new Error("تم استلام المكافأة اليومية مسبقًا");
    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + rank.dailyCoins, aristocracyLastDailyClaim: now });
    return { success: true, coinsEarned: rank.dailyCoins };
  },
});

export const getAristocracyInventory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("aristocracyInventory").withIndex("by_owner", (q) => q.eq("ownerUserId", userId)).order("desc").collect();
  },
});

export const activateAristocracyInventory = mutation({
  args: { inventoryId: v.id("aristocracyInventory") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authorized");
    const item = await ctx.db.get(args.inventoryId);
    if (!item || item.ownerUserId !== userId || item.status !== "available") throw new Error("العنصر غير متاح للتفعيل");
    const profile = (await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(1))[0];
    if (!profile) throw new Error("Profile not found");
    if ((profile.aristocracyLevel ?? 0) >= item.level && profile.aristocracyExpiresAt && profile.aristocracyExpiresAt > Date.now()) throw new Error("لا يمكن تفعيل رتبة أقل أو مساوية للرتبة المفعلة");
    const now = Date.now();
    await ctx.db.patch(profile._id, {
      aristocracyLevel: item.level,
      aristocracyExpiresAt: now + item.durationDays * 86400000,
      activeEntryId: `aristo_${item.level}_entry`,
    });
    await ctx.db.patch(item._id, { status: "activated", activatedAt: now });
    return { success: true, level: item.level, expiresAt: now + item.durationDays * 86400000 };
  },
});

export const giftAristocracyFromInventory = mutation({
  args: { inventoryId: v.id("aristocracyInventory"), targetSakiId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authorized");
    const item = await ctx.db.get(args.inventoryId);
    if (!item || item.ownerUserId !== userId || item.status !== "available") throw new Error("العنصر غير متاح للإهداء");
    const target = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId)).first();
    if (!target || target.userId === userId) throw new Error("المستخدم المستهدف غير صالح");
    if ((target.aristocracyLevel ?? 0) >= item.level && target.aristocracyExpiresAt && target.aristocracyExpiresAt > Date.now()) throw new Error("لا يمكن إهداء رتبة أقل أو مساوية للرتبة المفعلة لدى المستخدم");
    const now = Date.now();
    await ctx.db.insert("aristocracyInventory", { ownerUserId: target.userId, level: item.level, durationDays: item.durationDays, source: "inventory_gift", price: 0, status: "available", giftedToSakiId: args.targetSakiId, createdAt: now });
    await ctx.db.patch(item._id, { status: "gifted", giftedToSakiId: args.targetSakiId });
    return { success: true, targetName: target.name, level: item.level, days: item.durationDays };
  },
});

export const getAristocracyRank = query({
  args: { level: v.number() },
  handler: async (_ctx, args) => ARISTOCRACY_RANKS.find((rank) => rank.level === args.level) ?? null,
});
