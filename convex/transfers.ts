// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const VALID_DIAMOND_TIERS = [120000, 240000, 360000, 480000, 600000, 720000];
const DIAMONDS_TO_COINS_RATE = 0.5;

// معدل تحويل ماس الوكالة إلى عملات (1 ماسة وكالة = 0.1 عملة)
const AGENCY_DIAMOND_TO_COINS_RATE = 0.1;

function formatNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// تحويل ماس إلى عملات ذهبية مباشرة في حساب المستخدم (بدون وكيل)
export const convertDiamondsToCoins = mutation({
  args: {
    diamonds: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    if (!Number.isFinite(args.diamonds) || args.diamonds <= 0 || !Number.isInteger(args.diamonds)) {
      throw new Error("أدخل كمية ماس صحيحة أكبر من صفر");
    }

    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile) throw new Error("الملف الشخصي غير موجود");

    const myDiamonds = myProfile.diamonds ?? 0;
    if (myDiamonds < args.diamonds) throw new Error(`ليس لديك كافٍ من الماس. لديك ${formatNum(myDiamonds)} ماسة`);

    const coinsToReceive = Math.floor(args.diamonds * DIAMONDS_TO_COINS_RATE);

    await ctx.db.patch(myProfile._id, {
      diamonds: myDiamonds - args.diamonds,
      goldCoins: (myProfile.goldCoins ?? 0) + coinsToReceive,
    });

    if (myProfile.familyId) {
      const membership = await ctx.db.query("familyMembers")
        .withIndex("by_family_and_user", (q) => q.eq("familyId", myProfile.familyId!).eq("userId", userId))
        .unique();
      if (membership) {
        await ctx.db.patch(membership._id, { diamonds: Math.max(0, (membership.diamonds ?? 0) - args.diamonds) });
      }
    }

    await ctx.db.insert("notifications", {
      userId,
      type: "diamond_received",
      title: "تم تحويل الماس",
      body: `تم تحويل ${formatNum(args.diamonds)} ماسة وحصلت على ${formatNum(coinsToReceive)} عملة ذهبية`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true, coinsReceived: coinsToReceive };
  },
});

// تحويل ماس لوكيل شحن (للتوافق مع الكود القديم)
export const transferDiamondsToAgent = mutation({
  args: {
    agentSakiId: v.string(),
    diamonds: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    if (!Number.isFinite(args.diamonds) || args.diamonds <= 0 || !Number.isInteger(args.diamonds)) {
      throw new Error("أدخل كمية ماس صحيحة أكبر من صفر");
    }

    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile) throw new Error("الملف الشخصي غير موجود");

    const myDiamonds = myProfile.diamonds ?? 0;
    if (myDiamonds < args.diamonds) throw new Error(`ليس لديك كافٍ من الماس. لديك ${formatNum(myDiamonds)} ماسة`);

    const agentProfile = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.agentSakiId)).unique();
    if (!agentProfile) throw new Error("الوكيل غير موجود");
    if (!agentProfile.isAgent && !agentProfile.isSuperAdmin) throw new Error("هذا المستخدم ليس وكيل شحن");

    const coinsToReceive = Math.floor(args.diamonds * DIAMONDS_TO_COINS_RATE);

    await ctx.db.patch(myProfile._id, { diamonds: myDiamonds - args.diamonds });

    if (myProfile.familyId) {
      const membership = await ctx.db.query("familyMembers")
        .withIndex("by_family_and_user", (q) => q.eq("familyId", myProfile.familyId!).eq("userId", userId))
        .unique();
      if (membership) {
        await ctx.db.patch(membership._id, { diamonds: Math.max(0, (membership.diamonds ?? 0) - args.diamonds) });
      }
    }

    await ctx.db.patch(myProfile._id, { goldCoins: (myProfile.goldCoins ?? 0) + coinsToReceive });

    await ctx.db.insert("diamondSales", {
      sellerId: userId,
      agentId: agentProfile.userId,
      diamonds: args.diamonds,
      coinsReceived: coinsToReceive,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: agentProfile.userId,
      type: "diamond_received",
      title: "استقبلت ماساً",
      body: `أرسل لك ${myProfile.name} ${formatNum(args.diamonds)} ماسة وحصلت على ${formatNum(coinsToReceive)} عملة`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId,
      type: "diamond_received",
      title: "تم تحويل الماس",
      body: `تم تحويل ${formatNum(args.diamonds)} ماسة للوكيل وحصلت على ${formatNum(coinsToReceive)} عملة`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true, coinsReceived: coinsToReceive };
  },
});

// تحويل عملات ذهبية لوكيل شحن
export const transferCoinsToAgent = mutation({
  args: {
    agentSakiId: v.string(),
    coins: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    if (args.coins <= 0) throw new Error("الكمية يجب أن تكون أكبر من صفر");

    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile) throw new Error("الملف الشخصي غير موجود");

    const myCoins = myProfile.goldCoins ?? 0;
    if (myCoins < args.coins) throw new Error(`رصيدك غير كافٍ. لديك ${formatNum(myCoins)} عملة`);

    const agentProfile = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.agentSakiId)).unique();
    if (!agentProfile) throw new Error("الوكيل غير موجود");
    if (!agentProfile.isAgent && !agentProfile.isSuperAdmin) throw new Error("هذا المستخدم ليس وكيل شحن");

    await ctx.db.patch(myProfile._id, { goldCoins: myCoins - args.coins });
    await ctx.db.patch(agentProfile._id, { goldCoins: (agentProfile.goldCoins ?? 0) + args.coins });

    await ctx.db.insert("notifications", {
      userId: agentProfile.userId,
      type: "charge",
      title: "استقبلت عملات ذهبية",
      body: `أرسل لك ${myProfile.name} ${formatNum(args.coins)} عملة ذهبية`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// جلب سجل التحويلات
export const getMyTransferHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const sales = await ctx.db.query("diamondSales")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc")
      .take(30);
    return await Promise.all(sales.map(async (s) => {
      const agentProfile = s.agentId
        ? await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", s.agentId!)).unique()
        : null;
      return { ...s, agentName: agentProfile?.name ?? "مجهول", agentSakiId: agentProfile?.sakiId ?? "" };
    }));
  },
});

// جلب سجل استقبال الوكيل
export const getAgentReceivedTransfers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isAgent && !profile?.isSuperAdmin) return [];
    const sales = await ctx.db.query("diamondSales").collect();
    const mySales = sales.filter(s => s.agentId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
    return await Promise.all(mySales.map(async (s) => {
      const sellerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", s.sellerId)).unique();
      return { ...s, sellerName: sellerProfile?.name ?? "مجهول", sellerSakiId: sellerProfile?.sakiId ?? "" };
    }));
  },
});
