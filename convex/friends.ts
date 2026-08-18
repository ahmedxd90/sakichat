// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// ── إرسال طلب صداقة ────────────────────────────────────────────
export const sendFriendRequest = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (userId === args.targetUserId) throw new Error("لا يمكنك إضافة نفسك");

    // تحقق من وجود صداقة مسبقة
    const existing = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) =>
        q.eq("userId1", userId < args.targetUserId ? userId : args.targetUserId)
          .eq("userId2", userId < args.targetUserId ? args.targetUserId : userId)
      )
      .unique();
    if (existing) throw new Error("أنتما أصدقاء بالفعل");

    // تحقق من وجود طلب مسبق
    const existingReq = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", userId).eq("receiverId", args.targetUserId)
      )
      .unique();
    if (existingReq) throw new Error("تم إرسال الطلب مسبقاً");

    // تحقق إذا الطرف الآخر أرسل طلباً بالفعل
    const reverseReq = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", args.targetUserId).eq("receiverId", userId)
      )
      .unique();
    if (reverseReq) {
      // قبول تلقائي
      await ctx.db.delete(reverseReq._id);
      const u1 = userId < args.targetUserId ? userId : args.targetUserId;
      const u2 = userId < args.targetUserId ? args.targetUserId : userId;
      await ctx.db.insert("friendships", { userId1: u1, userId2: u2, createdAt: Date.now() });
      // إشعار
      const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      await ctx.db.insert("notifications", {
        userId: args.targetUserId,
        type: "friend_accepted",
        title: "✅ قبول طلب الصداقة",
        body: `${myProfile?.name ?? "مستخدم"} قبل طلب صداقتك`,
        actorUserId: userId,
        isRead: false,
        createdAt: Date.now(),
      });
      return { status: "accepted" };
    }

    // إنشاء الطلب
    await ctx.db.insert("friendRequests", {
      senderId: userId,
      receiverId: args.targetUserId,
      status: "pending",
      createdAt: Date.now(),
    });

    // إشعار للمستلم
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "friend_request",
      title: "👥 طلب صداقة جديد",
      body: `${myProfile?.name ?? "مستخدم"} يريد إضافتك كصديق`,
      actorUserId: userId,
      isRead: false,
      createdAt: Date.now(),
    });

    // Daily task: add_friend
    await ctx.scheduler.runAfter(0, internal.dailyRewards.updateTaskProgress, { taskId: "add_friend", increment: 1, userId });
    return { status: "sent" };
  },
});

// ── قبول طلب صداقة ─────────────────────────────────────────────
export const acceptFriendRequest = mutation({
  args: { requestId: v.id("friendRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("الطلب غير موجود");
    if (req.receiverId !== userId) throw new Error("غير مصرح");
    if (req.status !== "pending") throw new Error("الطلب منتهٍ");

    await ctx.db.delete(args.requestId);

    const u1 = userId < req.senderId ? userId : req.senderId;
    const u2 = userId < req.senderId ? req.senderId : userId;
    await ctx.db.insert("friendships", { userId1: u1, userId2: u2, createdAt: Date.now() });

    // إشعار للمرسل
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.db.insert("notifications", {
      userId: req.senderId,
      type: "friend_accepted",
      title: "✅ قبول طلب الصداقة",
      body: `${myProfile?.name ?? "مستخدم"} قبل طلب صداقتك`,
      actorUserId: userId,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ── رفض طلب صداقة ──────────────────────────────────────────────
export const rejectFriendRequest = mutation({
  args: { requestId: v.id("friendRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("الطلب غير موجود");
    if (req.receiverId !== userId) throw new Error("غير مصرح");

    await ctx.db.delete(args.requestId);
    return { success: true };
  },
});

// ── إلغاء طلب صداقة مرسل ───────────────────────────────────────
export const cancelFriendRequest = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const req = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", userId).eq("receiverId", args.targetUserId)
      )
      .unique();
    if (req) await ctx.db.delete(req._id);
    return { success: true };
  },
});

// ── إلغاء صداقة ────────────────────────────────────────────────
export const removeFriend = mutation({
  args: { friendUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const u1 = userId < args.friendUserId ? userId : args.friendUserId;
    const u2 = userId < args.friendUserId ? args.friendUserId : userId;

    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) => q.eq("userId1", u1).eq("userId2", u2))
      .unique();
    if (friendship) await ctx.db.delete(friendship._id);
    return { success: true };
  },
});

// ── حالة الصداقة مع مستخدم معين ────────────────────────────────
export const getFriendshipStatus = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { status: "none" as const };

    // هل هم أصدقاء؟
    const u1 = userId < args.targetUserId ? userId : args.targetUserId;
    const u2 = userId < args.targetUserId ? args.targetUserId : userId;
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) => q.eq("userId1", u1).eq("userId2", u2))
      .unique();
    if (friendship) return { status: "friends" as const, friendshipId: friendship._id };

    // هل أرسلت طلباً؟
    const sentReq = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", userId).eq("receiverId", args.targetUserId)
      )
      .unique();
    if (sentReq) return { status: "sent" as const, requestId: sentReq._id };

    // هل استلمت طلباً؟
    const receivedReq = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", args.targetUserId).eq("receiverId", userId)
      )
      .unique();
    if (receivedReq) return { status: "received" as const, requestId: receivedReq._id };

    return { status: "none" as const };
  },
});

// ── هل هما صديقان؟ (للتحقق في الدردشة) ────────────────────────
export const areFriends = query({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const u1 = userId < args.otherUserId ? userId : args.otherUserId;
    const u2 = userId < args.otherUserId ? args.otherUserId : userId;
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) => q.eq("userId1", u1).eq("userId2", u2))
      .unique();
    return !!friendship;
  },
});

// ── قائمة الأصدقاء ──────────────────────────────────────────────
export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const asFriend1 = await ctx.db.query("friendships").withIndex("by_user1", (q) => q.eq("userId1", userId)).collect();
    const asFriend2 = await ctx.db.query("friendships").withIndex("by_user2", (q) => q.eq("userId2", userId)).collect();
    const friendUserIds = [...asFriend1.map((f) => f.userId2), ...asFriend2.map((f) => f.userId1)];
    return await Promise.all(friendUserIds.map(async (fid) => {
      const pCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", fid)).order("desc").take(1);
      const p = pCandidates[0];
      if (!p) return null;
      let avatarUrl = p.avatarUrl;
      if (p.avatarStorageId && !avatarUrl) avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
      return { ...p, avatarUrl, isOnline: (p.lastOnline ?? 0) > Date.now() - 300000 };
    })).then((r) => r.filter(Boolean));
  },
});

export const getMyFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const asFriend1 = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", userId))
      .collect();
    const asFriend2 = await ctx.db
      .query("friendships")
      .withIndex("by_user2", (q) => q.eq("userId2", userId))
      .collect();

    const friendUserIds = [
      ...asFriend1.map((f) => f.userId2),
      ...asFriend2.map((f) => f.userId1),
    ];

    return await Promise.all(
      friendUserIds.map(async (fid) => {
        const pCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", fid)).order("desc").take(1);
        const p = pCandidates[0];
        if (!p) return null;
        let avatarUrl = p.avatarUrl;
        if (p.avatarStorageId && !avatarUrl) avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        return { ...p, avatarUrl };
      })
    ).then((r) => r.filter(Boolean));
  },
});

// ── طلبات الصداقة الواردة ───────────────────────────────────────
export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const reqs = await ctx.db
      .query("friendRequests")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .order("desc")
      .take(30);

    return await Promise.all(
      reqs.map(async (req) => {
        const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", req.senderId)).unique();
        if (!p) return null;
        let avatarUrl = p.avatarUrl;
        if (p.avatarStorageId && !avatarUrl) avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        return { ...req, senderProfile: { ...p, avatarUrl } };
      })
    ).then((r) => r.filter(Boolean));
  },
});

// ── طلبات الصداقة المرسلة ───────────────────────────────────────
export const getMySentRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const reqs = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender", (q) => q.eq("senderId", userId))
      .order("desc")
      .take(30);

    return await Promise.all(
      reqs.map(async (req) => {
        const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", req.receiverId)).unique();
        if (!p) return null;
        let avatarUrl = p.avatarUrl;
        if (p.avatarStorageId && !avatarUrl) avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        return { ...req, receiverProfile: { ...p, avatarUrl } };
      })
    ).then((r) => r.filter(Boolean));
  },
});

// ── عدد طلبات الصداقة الواردة ───────────────────────────────────
export const getPendingRequestsCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const reqs = await ctx.db
      .query("friendRequests")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .collect();
    return reqs.length;
  },
});
