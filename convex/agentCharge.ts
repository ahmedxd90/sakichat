// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listAgents = query({
  args: {},
  handler: async (ctx) => {
    const allProfiles = await ctx.db.query("profiles").collect();
    const agents = allProfiles.filter((p) => p.isAgent || p.isSuperAdmin);
    return agents.map((p) => ({
      _id: p._id,
      userId: p.userId,
      name: p.name,
      sakiId: p.sakiId,
      avatarUrl: p.avatarUrl,
      isAgent: p.isAgent,
      isSuperAdmin: p.isSuperAdmin,
    }));
  },
});

export const agentChargeUser = mutation({
  args: {
    targetSakiId: v.string(),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isAgent && !me?.isSuperAdmin) throw new Error("غير مصرح");
    if (args.amount <= 0) throw new Error("المبلغ يجب أن يكون أكبر من صفر");
    const myCoins = me.goldCoins ?? 0;
    if (myCoins < args.amount)
      throw new Error(`رصيدك غير كافٍ. لديك ${myCoins.toLocaleString()} عملة`);
    let target = await ctx.db
      .query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId))
      .unique();
    // إذا لم يوجد، ابحث بالمعرف المميز (premiumSakiId)
    if (!target) {
      const allProfiles = await ctx.db.query("profiles").collect();
      target = allProfiles.find((p: any) => p.premiumSakiId === args.targetSakiId) ?? null;
    }
    if (!target) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(me._id, { goldCoins: myCoins - args.amount });
    const newTargetCoins = (target.goldCoins ?? 0) + args.amount;
    const newTotalCharged = (target.totalCoinsCharged ?? 0) + args.amount;
    const MILLIONAIRE_THRESHOLD = 100_000_000;
    const wasMillionaire = target.isMillionaireTitle ?? false;
    const nowMillionaire = newTotalCharged >= MILLIONAIRE_THRESHOLD;
    await ctx.db.patch(target._id, {
      goldCoins: newTargetCoins,
      totalCoinsCharged: newTotalCharged,
      ...(nowMillionaire && !wasMillionaire ? { isMillionaireTitle: true } : {}),
    });
    // إشعار بلقب المليونير
    if (nowMillionaire && !wasMillionaire) {
      await ctx.db.insert("notifications", {
        userId: target.userId,
        type: "title_unlocked",
        title: "💰 مبروك! حصلت على لقب المليونير",
        body: "لقد شحنت 100 مليون عملة ذهبية! حصلت على لقب المليونير اللامع 🎉",
        isRead: false,
        createdAt: Date.now(),
      });
    }
    await ctx.db.insert("chargeRequests", {
      agentId: userId,
      targetSakiId: args.targetSakiId,
      targetUserId: target.userId,
      amount: args.amount,
      status: "completed",
      note: args.note,
      createdAt: Date.now(),
    });
    await ctx.db.insert("notifications", {
      userId: target.userId,
      type: "charge",
      title: "تم شحن حسابك",
      body: `قام الوكيل ${me.name} بشحن ${args.amount.toLocaleString()} عملة ذهبية لحسابك`,
      isRead: false,
      createdAt: Date.now(),
    });
    return { success: true, targetName: target.name };
  },
});

export const getMyChargeHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isAgent && !profile?.isSuperAdmin) return [];
    const charges = await ctx.db
      .query("chargeRequests")
      .withIndex("by_agent", (q) => q.eq("agentId", userId))
      .order("desc")
      .take(50);
    return charges;
  },
});
