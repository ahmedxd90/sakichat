// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendCoupleRequest = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (userId === args.targetUserId) throw new Error("لا يمكنك إرسال طلب لنفسك");

    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile) throw new Error("الملف الشخصي غير موجود");

    // Check if already in a couple
    const existingCouple = await ctx.db.query("couples")
      .withIndex("by_user1", (q) => q.eq("user1Id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    const existingCouple2 = await ctx.db.query("couples")
      .withIndex("by_user2", (q) => q.eq("user2Id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (existingCouple || existingCouple2) throw new Error("أنت مرتبط بشخص آخر بالفعل");

    // Check target not already in couple
    const targetCouple1 = await ctx.db.query("couples")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.targetUserId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    const targetCouple2 = await ctx.db.query("couples")
      .withIndex("by_user2", (q) => q.eq("user2Id", args.targetUserId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (targetCouple1 || targetCouple2) throw new Error("هذا المستخدم مرتبط بشخص آخر");

    // Check pending request
    const pending = await ctx.db.query("couples")
      .withIndex("by_user1_and_user2", (q) => q.eq("user1Id", userId).eq("user2Id", args.targetUserId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (pending) throw new Error("طلب الارتباط مرسل بالفعل");

    const targetProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!targetProfile) throw new Error("المستخدم غير موجود");

    await ctx.db.insert("couples", {
      user1Id: userId,
      user2Id: args.targetUserId,
      user1Name: myProfile.name,
      user2Name: targetProfile.name,
      user1AvatarUrl: myProfile.avatarUrl,
      user2AvatarUrl: targetProfile.avatarUrl,
      status: "pending",
      createdAt: Date.now(),
    });

    // Send notification
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "couple_request",
      title: "طلب ارتباط 💑",
      body: `${myProfile.name} يريد الارتباط بك`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });
  },
});

export const respondCoupleRequest = mutation({
  args: { coupleId: v.id("couples"), accept: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const couple = await ctx.db.get(args.coupleId);
    if (!couple) throw new Error("الطلب غير موجود");
    if (couple.user2Id !== userId) throw new Error("غير مصرح");
    if (couple.status !== "pending") throw new Error("الطلب منتهي");

    if (args.accept) {
      await ctx.db.patch(args.coupleId, {
        status: "active",
        startedAt: Date.now(),
      });
      // Notify requester
      await ctx.db.insert("notifications", {
        userId: couple.user1Id,
        type: "couple_accepted",
        title: "تم قبول طلب الارتباط 💑",
        body: `${couple.user2Name} قبل طلب ارتباطك`,
        isRead: false,
        actorUserId: userId,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.coupleId, { status: "rejected" });
    }
  },
});

export const breakCouple = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const couple1 = await ctx.db.query("couples")
      .withIndex("by_user1", (q) => q.eq("user1Id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    const couple2 = await ctx.db.query("couples")
      .withIndex("by_user2", (q) => q.eq("user2Id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    const couple = couple1 ?? couple2;
    if (!couple) throw new Error("لا يوجد ارتباط نشط");

    await ctx.db.patch(couple._id, { status: "ended", endedAt: Date.now() });

    const otherId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.db.insert("notifications", {
      userId: otherId,
      type: "couple_ended",
      title: "انتهى الارتباط 💔",
      body: `${myProfile?.name ?? "شخص ما"} أنهى الارتباط`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });
  },
});

export const getMyCouple = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const couple1 = await ctx.db.query("couples")
      .withIndex("by_user1", (q) => q.eq("user1Id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    const couple2 = await ctx.db.query("couples")
      .withIndex("by_user2", (q) => q.eq("user2Id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    const couple = couple1 ?? couple2;
    if (!couple) return null;

    const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
    const partnerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", partnerId)).unique();
    let partnerAvatarUrl = partnerProfile?.avatarUrl;
    if (partnerProfile?.avatarStorageId && !partnerAvatarUrl) {
      partnerAvatarUrl = await ctx.storage.getUrl(partnerProfile.avatarStorageId) ?? undefined;
    }

    return {
      ...couple,
      partnerProfile: partnerProfile ? { ...partnerProfile, avatarUrl: partnerAvatarUrl } : null,
    };
  },
});

export const getCoupleByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const couple1 = await ctx.db.query("couples")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    const couple2 = await ctx.db.query("couples")
      .withIndex("by_user2", (q) => q.eq("user2Id", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    const couple = couple1 ?? couple2;
    if (!couple) return null;

    const partnerId = couple.user1Id === args.userId ? couple.user2Id : couple.user1Id;
    const partnerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", partnerId)).unique();
    let partnerAvatarUrl = partnerProfile?.avatarUrl;
    if (partnerProfile?.avatarStorageId && !partnerAvatarUrl) {
      partnerAvatarUrl = await ctx.storage.getUrl(partnerProfile.avatarStorageId) ?? undefined;
    }

    return {
      ...couple,
      partnerProfile: partnerProfile ? { ...partnerProfile, avatarUrl: partnerAvatarUrl } : null,
    };
  },
});

export const getPendingCoupleRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db.query("couples")
      .withIndex("by_user2", (q) => q.eq("user2Id", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return await Promise.all(requests.map(async (r) => {
      const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.user1Id)).unique();
      let avatarUrl = senderProfile?.avatarUrl;
      if (senderProfile?.avatarStorageId && !avatarUrl) {
        avatarUrl = await ctx.storage.getUrl(senderProfile.avatarStorageId) ?? undefined;
      }
      return { ...r, senderProfile: senderProfile ? { ...senderProfile, avatarUrl } : null };
    }));
  },
});
