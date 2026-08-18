// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMySubAgents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isAgent && !me?.isSuperAdmin) return [];
    // الوكيل الفرعي لا يمكنه إدارة وكلاء فرعيين
    const amISubAgent = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_sub", (q) => q.eq("subAgentId", userId))
      .unique();
    if (amISubAgent && !me?.isSuperAdmin) return [];
    const subAgents = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_parent", (q) => q.eq("parentAgentId", userId))
      .collect();
    const result = [];
    for (const rel of subAgents) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", rel.subAgentId))
        .unique();
      if (!profile) continue;
      const wallet = await ctx.db
        .query("agentSakiWallets")
        .withIndex("by_agent", (q) => q.eq("agentUserId", rel.subAgentId))
        .unique();
      result.push({
        _id: rel._id,
        subAgentId: rel.subAgentId,
        name: profile.name,
        sakiId: profile.sakiId,
        avatarUrl: profile.avatarUrl,
        sakiBalance: wallet?.sakiBalance ?? 0,
        totalSakiUsed: wallet?.totalSakiUsed ?? 0,
        totalSakiAdded: wallet?.totalSakiAdded ?? 0,
        addedAt: rel.createdAt,
      });
    }
    return result;
  },
});

export const addSubAgent = mutation({
  args: { targetSakiId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isAgent && !me?.isSuperAdmin) throw new Error("غير مصرح - يجب أن تكون وكيلاً");
    // الوكيل الفرعي لا يمكنه تعيين وكلاء فرعيين
    const amISubAgent = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_sub", (q) => q.eq("subAgentId", userId))
      .unique();
    if (amISubAgent && !me?.isSuperAdmin) throw new Error("الوكيل الفرعي لا يمكنه تعيين وكلاء فرعيين");
    const target = await ctx.db
      .query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId))
      .unique();
    if (!target) throw new Error("المستخدم غير موجود");
    if (target.userId === userId) throw new Error("لا يمكنك إضافة نفسك");
    // التحقق أن الهدف ليس وكيلاً فرعياً لأي وكيل آخر
    const alreadySubAgent = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_sub", (q) => q.eq("subAgentId", target.userId))
      .unique();
    if (alreadySubAgent) throw new Error("هذا المستخدم مضاف مسبقاً كوكيل فرعي لوكيل آخر");
    const existing = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_parent_and_sub", (q) =>
        q.eq("parentAgentId", userId).eq("subAgentId", target.userId)
      )
      .unique();
    if (existing) throw new Error("هذا المستخدم مضاف مسبقاً كوكيل فرعي");
    await ctx.db.insert("subAgentRelations", {
      parentAgentId: userId,
      subAgentId: target.userId,
      createdAt: Date.now(),
    });
    if (!target.isAgent) {
      await ctx.db.patch(target._id, { isAgent: true });
    }
    await ctx.db.insert("notifications", {
      userId: target.userId,
      type: "system",
      title: "تمت إضافتك كوكيل فرعي",
      body: `قام الوكيل ${me.name} بإضافتك كوكيل فرعي في منظومته`,
      isRead: false,
      createdAt: Date.now(),
    });
    return { success: true, targetName: target.name };
  },
});

export const removeSubAgent = mutation({
  args: { subAgentUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isAgent && !me?.isSuperAdmin) throw new Error("غير مصرح");
    const rel = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_parent_and_sub", (q) =>
        q.eq("parentAgentId", userId).eq("subAgentId", args.subAgentUserId)
      )
      .unique();
    if (!rel) throw new Error("الوكيل الفرعي غير موجود");
    await ctx.db.delete(rel._id);
    return { success: true };
  },
});

export const transferSakiToSubAgent = mutation({
  args: {
    subAgentUserId: v.id("users"),
    sakiAmount: v.number(),
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
    if (args.sakiAmount <= 0) throw new Error("الكمية يجب أن تكون أكبر من صفر");
    const rel = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_parent_and_sub", (q) =>
        q.eq("parentAgentId", userId).eq("subAgentId", args.subAgentUserId)
      )
      .unique();
    if (!rel) throw new Error("هذا المستخدم ليس وكيلاً فرعياً لك");
    const myWallet = await ctx.db
      .query("agentSakiWallets")
      .withIndex("by_agent", (q) => q.eq("agentUserId", userId))
      .unique();
    if (!myWallet || myWallet.sakiBalance < args.sakiAmount) {
      throw new Error(`رصيد ساكي غير كافٍ. لديك ${myWallet?.sakiBalance ?? 0} ساكي`);
    }
    let subWallet = await ctx.db
      .query("agentSakiWallets")
      .withIndex("by_agent", (q) => q.eq("agentUserId", args.subAgentUserId))
      .unique();
    if (!subWallet) {
      const id = await ctx.db.insert("agentSakiWallets", {
        agentUserId: args.subAgentUserId,
        sakiBalance: 0,
        totalSakiAdded: 0,
        totalSakiUsed: 0,
        commissionRate: 0,
        updatedAt: Date.now(),
        createdAt: Date.now(),
      });
      subWallet = await ctx.db.get(id);
    }
    await ctx.db.patch(myWallet._id, {
      sakiBalance: myWallet.sakiBalance - args.sakiAmount,
      totalSakiUsed: (myWallet.totalSakiUsed ?? 0) + args.sakiAmount,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(subWallet._id, {
      sakiBalance: subWallet.sakiBalance + args.sakiAmount,
      totalSakiAdded: (subWallet.totalSakiAdded ?? 0) + args.sakiAmount,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("sakiTransactions", {
      agentUserId: userId,
      targetUserId: args.subAgentUserId,
      type: "admin_deduct",
      sakiAmount: args.sakiAmount,
      note: args.note ?? "تحويل لوكيل فرعي",
      createdAt: Date.now(),
    });
    await ctx.db.insert("sakiTransactions", {
      agentUserId: args.subAgentUserId,
      type: "admin_add",
      sakiAmount: args.sakiAmount,
      note: args.note ?? `تحويل من الوكيل ${me.name}`,
      adminUserId: userId,
      createdAt: Date.now(),
    });
    const subProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.subAgentUserId))
      .unique();
    await ctx.db.insert("notifications", {
      userId: args.subAgentUserId,
      type: "saki_credit",
      title: "تم استلام رصيد ساكي",
      body: `حوّل إليك الوكيل ${me.name} مبلغ ${args.sakiAmount.toLocaleString()} ساكي`,
      isRead: false,
      createdAt: Date.now(),
    });
    return {
      success: true,
      targetName: subProfile?.name ?? "—",
      newMyBalance: myWallet.sakiBalance - args.sakiAmount,
    };
  },
});

export const getMyParentAgent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const rel = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_sub", (q) => q.eq("subAgentId", userId))
      .unique();
    if (!rel) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", rel.parentAgentId))
      .unique();
    return profile
      ? { name: profile.name, sakiId: profile.sakiId, avatarUrl: profile.avatarUrl }
      : null;
  },
});

export const adminGetAllSubAgentRelations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isSuperAdmin) return [];
    const rels = await ctx.db.query("subAgentRelations").collect();
    const result = [];
    for (const rel of rels) {
      const parent = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", rel.parentAgentId))
        .unique();
      const sub = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", rel.subAgentId))
        .unique();
      result.push({
        _id: rel._id,
        parentName: parent?.name ?? "—",
        parentSakiId: parent?.sakiId ?? "—",
        subName: sub?.name ?? "—",
        subSakiId: sub?.sakiId ?? "—",
        createdAt: rel.createdAt,
      });
    }
    return result;
  },
});

export const getParentAgentForUser = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const rel = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_sub", (q) => q.eq("subAgentId", args.targetUserId))
      .unique();
    if (!rel) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", rel.parentAgentId))
      .unique();
    return profile
      ? { name: profile.name, sakiId: profile.sakiId, avatarUrl: profile.avatarUrl }
      : null;
  },
});

export const amISubAgent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const rel = await ctx.db
      .query("subAgentRelations")
      .withIndex("by_sub", (q) => q.eq("subAgentId", userId))
      .unique();
    return !!rel;
  },
});
