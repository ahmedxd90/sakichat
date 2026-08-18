// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const SAKI_TO_COINS = 60000;

async function getOrCreateWallet(ctx: any, agentUserId: any) {
  let wallet = await ctx.db
    .query("agentSakiWallets")
    .withIndex("by_agent", (q: any) => q.eq("agentUserId", agentUserId))
    .unique();
  if (!wallet) {
    const id = await ctx.db.insert("agentSakiWallets", {
      agentUserId,
      sakiBalance: 0,
      totalSakiAdded: 0,
      totalSakiUsed: 0,
      commissionRate: 0,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    });
    wallet = await ctx.db.get(id);
  }
  return wallet;
}

export const getMyWallet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isAgent && !profile?.isSuperAdmin) return null;
    const wallet = await ctx.db
      .query("agentSakiWallets")
      .withIndex("by_agent", (q) => q.eq("agentUserId", userId))
      .unique();
    return wallet ?? {
      agentUserId: userId,
      sakiBalance: 0,
      totalSakiAdded: 0,
      totalSakiUsed: 0,
      commissionRate: 0,
    };
  },
});

export const getMyTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isAgent && !profile?.isSuperAdmin) return [];
    const txs = await ctx.db
      .query("sakiTransactions")
      .withIndex("by_agent", (q) => q.eq("agentUserId", userId))
      .order("desc")
      .take(100);
    return txs;
  },
});

export const chargeUserWithSaki = mutation({
  args: {
    targetSakiId: v.string(),
    sakiAmount: v.number(),
    dollars: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isAgent && !me?.isSuperAdmin) throw new Error("غير مصرح - يجب أن تكون وكيلاً");
    if (args.sakiAmount <= 0) throw new Error("الكمية يجب أن تكون أكبر من صفر");

    const wallet = await getOrCreateWallet(ctx, userId);
    if (wallet.sakiBalance < args.sakiAmount) {
      throw new Error(`رصيد ساكي غير كافٍ. لديك ${wallet.sakiBalance.toLocaleString()} ساكي`);
    }

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
    if (args.dollars !== undefined && args.dollars <= 0) throw new Error("قيمة الشحن بالدولار يجب أن تكون أكبر من صفر");

    const coinsToAdd = args.sakiAmount * SAKI_TO_COINS;

    await ctx.db.patch(wallet._id, {
      sakiBalance: wallet.sakiBalance - args.sakiAmount,
      totalSakiUsed: (wallet.totalSakiUsed ?? 0) + args.sakiAmount,
      updatedAt: Date.now(),
    });

    const newTargetCoins = (target.goldCoins ?? 0) + coinsToAdd;
    const newTotalCharged = (target.totalCoinsCharged ?? 0) + coinsToAdd;
    const MILLIONAIRE_THRESHOLD = 100_000_000;
    const wasMillionaire = target.isMillionaireTitle ?? false;
    const nowMillionaire = newTotalCharged >= MILLIONAIRE_THRESHOLD;

    await ctx.db.patch(target._id, {
      goldCoins: newTargetCoins,
      totalCoinsCharged: newTotalCharged,
      ...(nowMillionaire && !wasMillionaire ? { isMillionaireTitle: true } : {}),
    });

    if (nowMillionaire && !wasMillionaire) {
      await ctx.db.insert("notifications", {
        userId: target.userId,
        type: "title_unlocked",
        title: "مبروك! حصلت على لقب المليونير",
        body: "لقد شحنت 100 مليون عملة ذهبية! حصلت على لقب المليونير اللامع",
        isRead: false,
        createdAt: Date.now(),
      });
    }

    await ctx.db.insert("sakiTransactions", {
      agentUserId: userId,
      targetUserId: target.userId,
      targetSakiId: args.targetSakiId,
      targetName: target.name,
      type: "charge",
      sakiAmount: args.sakiAmount,
      coinsAmount: coinsToAdd,
      note: args.note,
      createdAt: Date.now(),
    });

    await ctx.db.insert("chargeRequests", {
      agentId: userId,
      targetSakiId: args.targetSakiId,
      targetUserId: target.userId,
      amount: coinsToAdd,
      status: "completed",
      note: args.note,
      createdAt: Date.now(),
    });

    if (args.dollars && args.dollars > 0) {
      await ctx.db.insert("rechargeGiftCredits", {
        userId: target.userId,
        source: "agent",
        dollars: args.dollars,
        externalReference: `saki:${args.sakiAmount}`,
        recordedBy: userId,
        createdAt: Date.now(),
      });
    }

    await ctx.db.insert("notifications", {
      userId: target.userId,
      type: "charge",
      title: "تم شحن حسابك",
      body: `قام الوكيل ${me.name} بشحن ${coinsToAdd.toLocaleString()} عملة ذهبية (${args.sakiAmount} ساكي) لحسابك${args.dollars ? ` بقيمة $${args.dollars}` : ""}`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true, targetName: target.name, coinsAdded: coinsToAdd };
  },
});

export const getAgentsLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const wallets = await ctx.db.query("agentSakiWallets").collect();
    const result = [];
    for (const w of wallets) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", w.agentUserId))
        .unique();
      if (!profile) continue;
      result.push({
        _id: w._id,
        agentUserId: w.agentUserId,
        name: profile.name,
        sakiId: profile.sakiId,
        avatarUrl: profile.avatarUrl,
        sakiBalance: w.sakiBalance,
        totalSakiUsed: w.totalSakiUsed ?? 0,
        totalSakiAdded: w.totalSakiAdded ?? 0,
      });
    }
    return result.sort((a, b) => (b.totalSakiUsed ?? 0) - (a.totalSakiUsed ?? 0));
  },
});

export const adminGetAllAgentsWithWallets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isSuperAdmin) return [];

    const allProfiles = await ctx.db.query("profiles").collect();
    const agents = allProfiles.filter((p) => p.isAgent || p.isSuperAdmin);
    const result = [];
    for (const agent of agents) {
      const wallet = await ctx.db
        .query("agentSakiWallets")
        .withIndex("by_agent", (q) => q.eq("agentUserId", agent.userId))
        .unique();
      result.push({
        _id: agent._id,
        userId: agent.userId,
        name: agent.name,
        sakiId: agent.sakiId,
        avatarUrl: agent.avatarUrl,
        isAgent: agent.isAgent,
        isSuperAdmin: agent.isSuperAdmin,
        sakiBalance: wallet?.sakiBalance ?? 0,
        totalSakiAdded: wallet?.totalSakiAdded ?? 0,
        totalSakiUsed: wallet?.totalSakiUsed ?? 0,
        commissionRate: wallet?.commissionRate ?? 0,
      });
    }
    return result;
  },
});

export const adminAddSakiBalance = mutation({
  args: {
    targetUserId: v.id("users"),
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
    if (!me?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");
    if (args.amount <= 0) throw new Error("الكمية يجب أن تكون أكبر من صفر");

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!targetProfile) throw new Error("المستخدم غير موجود");
    if (!targetProfile.isAgent && !targetProfile.isSuperAdmin) throw new Error("المستخدم ليس وكيلاً");

    const wallet = await getOrCreateWallet(ctx, args.targetUserId);
    await ctx.db.patch(wallet._id, {
      sakiBalance: wallet.sakiBalance + args.amount,
      totalSakiAdded: (wallet.totalSakiAdded ?? 0) + args.amount,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("sakiTransactions", {
      agentUserId: args.targetUserId,
      type: "admin_add",
      sakiAmount: args.amount,
      note: args.note,
      adminUserId: userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "saki_credit",
      title: "تم اضافة رصيد ساكي",
      body: `تم اضافة ${args.amount.toLocaleString()} ساكي لمحفظتك من قبل الادارة`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true, targetName: targetProfile.name, newBalance: wallet.sakiBalance + args.amount };
  },
});

export const adminDeductSakiBalance = mutation({
  args: {
    targetUserId: v.id("users"),
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
    if (!me?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");
    if (args.amount <= 0) throw new Error("الكمية يجب أن تكون أكبر من صفر");

    const wallet = await getOrCreateWallet(ctx, args.targetUserId);
    if (wallet.sakiBalance < args.amount) throw new Error("رصيد الوكيل غير كافٍ للخصم");

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();

    await ctx.db.patch(wallet._id, {
      sakiBalance: wallet.sakiBalance - args.amount,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("sakiTransactions", {
      agentUserId: args.targetUserId,
      type: "admin_deduct",
      sakiAmount: args.amount,
      note: args.note,
      adminUserId: userId,
      createdAt: Date.now(),
    });

    return { success: true, targetName: targetProfile?.name ?? "—", newBalance: wallet.sakiBalance - args.amount };
  },
});

export const adminGetAllSakiTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isSuperAdmin) return [];
    const txs = await ctx.db
      .query("sakiTransactions")
      .order("desc")
      .take(200);
    return txs;
  },
});
