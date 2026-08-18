// @ts-nocheck
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActiveLivestreams = query({
  args: {},
  handler: async (ctx) => {
    const streams = await ctx.db
      .query("livestreams")
      .withIndex("by_isLive", (q) => q.eq("isLive", true))
      .order("desc")
      .collect();
    return Promise.all(
      streams.map(async (stream) => {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", stream.hostId)).unique();
        const room = stream.roomId ? await ctx.db.get(stream.roomId) : null;
        const viewerPreview = await ctx.db.query("liveViewers").withIndex("by_livestream", (q) => q.eq("livestreamId", stream._id)).order("desc").take(5);
        let avatarUrl = profile?.avatarUrl;
        if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
        return { ...stream, hostProfile: { ...profile, avatarUrl }, roomCoverUrl: room?.coverUrl ?? null, roomName: room?.name ?? null, roomNumericId: room?.roomNumericId ?? null, viewerPreview };
      })
    );
  },
});

export const getMyLivestream = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.query("livestreams").withIndex("by_host", (q) => q.eq("hostId", userId)).filter((q) => q.eq(q.field("isLive"), true)).unique();
  },
});

export const getLivestream = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", stream.hostId)).unique();
    let avatarUrl = profile?.avatarUrl;
    if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
    const room = stream.roomId ? await ctx.db.get(stream.roomId) : null;
    return { ...stream, hostProfile: { ...profile, avatarUrl }, roomCoverUrl: room?.coverUrl ?? null, roomName: room?.name ?? null, roomNumericId: room?.roomNumericId ?? null };
  },
});

export const startLivestream = mutation({
  args: { title: v.string(), roomId: v.optional(v.id("rooms")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.query("livestreams").withIndex("by_host", (q) => q.eq("hostId", userId)).filter((q) => q.eq(q.field("isLive"), true)).unique();
    if (existing) await ctx.db.patch(existing._id, { isLive: false, endedAt: Date.now() });
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    const channelName = `live${userId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20)}${Date.now()}`;
    const id = await ctx.db.insert("livestreams", {
      hostId: userId, title: args.title, channelName, roomId: args.roomId,
      isLive: true, isActive: true, viewerCount: 0, likeCount: 0, totalCoins: 0,
      country: profile?.country ?? "SA", sakiId: profile?.sakiId ?? "",
      startedAt: Date.now(), createdAt: Date.now(),
    });
    return { id, channelName };
  },
});

export const endLivestream = mutation({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || stream.hostId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(args.livestreamId, { isLive: false, isActive: false, endedAt: Date.now() });
    const viewers = await ctx.db.query("liveViewers").withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId)).collect();
    for (const v of viewers) await ctx.db.delete(v._id);
    return null;
  },
});

export const joinLivestream = mutation({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || !stream.isLive) return null;
    await ctx.db.patch(args.livestreamId, { viewerCount: (stream.viewerCount ?? 0) + 1 });
    return null;
  },
});

export const leaveLivestream = mutation({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || !stream.isLive) return null;
    await ctx.db.patch(args.livestreamId, { viewerCount: Math.max(0, (stream.viewerCount ?? 1) - 1) });
    return null;
  },
});

export const joinLivestreamViewer = mutation({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || !stream.isLive) return null;
    const existing = await ctx.db.query("liveViewers").withIndex("by_livestream_and_user", (q) => q.eq("livestreamId", args.livestreamId).eq("userId", userId)).unique();
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    let avatarUrl = profile?.avatarUrl;
    if (profile?.avatarStorageId && !avatarUrl) avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: Date.now() });
    } else {
      await ctx.db.insert("liveViewers", {
        livestreamId: args.livestreamId, userId,
        userName: profile?.name, userAvatarUrl: avatarUrl,
        isVip: profile?.isVip, vipLevel: profile?.vipLevel,
        aristocracyLevel: profile?.aristocracyLevel,
        wealthLevel: profile?.wealthLevel, charismaLevel: profile?.charismaLevel,
        joinedAt: Date.now(), lastSeen: Date.now(),
      });
      await ctx.db.patch(args.livestreamId, { viewerCount: (stream.viewerCount ?? 0) + 1 });
    }
    return null;
  },
});

export const leaveLivestreamViewer = mutation({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const existing = await ctx.db.query("liveViewers").withIndex("by_livestream_and_user", (q) => q.eq("livestreamId", args.livestreamId).eq("userId", userId)).unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      const stream = await ctx.db.get(args.livestreamId);
      if (stream?.isLive) await ctx.db.patch(args.livestreamId, { viewerCount: Math.max(0, (stream.viewerCount ?? 1) - 1) });
    }
    return null;
  },
});

export const getLiveViewers = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    return await ctx.db.query("liveViewers").withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId)).order("desc").take(100);
  },
});

export const banLiveViewer = mutation({
  args: { livestreamId: v.id("livestreams"), targetUserId: v.id("users"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || stream.hostId !== userId) throw new Error("Not authorized");
    const existing = await ctx.db.query("liveBans").withIndex("by_livestream_and_user", (q) => q.eq("livestreamId", args.livestreamId).eq("userId", args.targetUserId)).unique();
    if (!existing) await ctx.db.insert("liveBans", { livestreamId: args.livestreamId, userId: args.targetUserId, bannedBy: userId, reason: args.reason, createdAt: Date.now() });
    const viewer = await ctx.db.query("liveViewers").withIndex("by_livestream_and_user", (q) => q.eq("livestreamId", args.livestreamId).eq("userId", args.targetUserId)).unique();
    if (viewer) await ctx.db.delete(viewer._id);
    return null;
  },
});

export const unbanLiveViewer = mutation({
  args: { livestreamId: v.id("livestreams"), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || stream.hostId !== userId) throw new Error("Not authorized");
    const ban = await ctx.db.query("liveBans").withIndex("by_livestream_and_user", (q) => q.eq("livestreamId", args.livestreamId).eq("userId", args.targetUserId)).unique();
    if (ban) await ctx.db.delete(ban._id);
    return null;
  },
});

export const muteLiveChat = mutation({
  args: { livestreamId: v.id("livestreams"), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || stream.hostId !== userId) throw new Error("Not authorized");
    const existing = await ctx.db.query("liveChatMutes").withIndex("by_livestream_and_user", (q) => q.eq("livestreamId", args.livestreamId).eq("userId", args.targetUserId)).unique();
    if (!existing) await ctx.db.insert("liveChatMutes", { livestreamId: args.livestreamId, userId: args.targetUserId, mutedBy: userId, createdAt: Date.now() });
    return null;
  },
});

export const unmuteLiveChat = mutation({
  args: { livestreamId: v.id("livestreams"), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || stream.hostId !== userId) throw new Error("Not authorized");
    const mute = await ctx.db.query("liveChatMutes").withIndex("by_livestream_and_user", (q) => q.eq("livestreamId", args.livestreamId).eq("userId", args.targetUserId)).unique();
    if (mute) await ctx.db.delete(mute._id);
    return null;
  },
});

export const getLiveBans = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    return await ctx.db.query("liveBans").withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId)).collect();
  },
});

export const getLiveChatMutes = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    return await ctx.db.query("liveChatMutes").withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId)).collect();
  },
});

export const kickLiveViewer = mutation({
  args: { livestreamId: v.id("livestreams"), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || stream.hostId !== userId) throw new Error("Not authorized");
    const viewer = await ctx.db.query("liveViewers").withIndex("by_livestream_and_user", (q) => q.eq("livestreamId", args.livestreamId).eq("userId", args.targetUserId)).unique();
    if (viewer) await ctx.db.delete(viewer._id);
    return null;
  },
});

export const sendLike = mutation({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || !stream.isLive) return null;
    await ctx.db.patch(args.livestreamId, { likeCount: (stream.likeCount ?? 0) + 1 });
    return null;
  },
});

export const sendLiveMessage = mutation({
  args: { livestreamId: v.id("livestreams"), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const mute = await ctx.db.query("liveChatMutes").withIndex("by_livestream_and_user", (q) => q.eq("livestreamId", args.livestreamId).eq("userId", userId)).unique();
    if (mute) throw new Error("أنت مكتوم في هذا البث");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.db.insert("liveMessages", {
      livestreamId: args.livestreamId, userId, content: args.content,
      senderName: profile?.name ?? "مجهول", senderAvatarUrl: profile?.avatarUrl,
      isVip: profile?.isVip ?? false, vipLevel: profile?.vipLevel,
      aristocracyLevel: profile?.aristocracyLevel, type: "chat", createdAt: Date.now(),
    });
    return null;
  },
});

export const sendLiveGift = mutation({
  args: { livestreamId: v.id("livestreams"), giftName: v.string(), giftEmoji: v.string(), giftCoins: v.number(), quantity: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("Profile not found");
    const qty = args.quantity ?? 1;
    const totalCost = args.giftCoins * qty;
    if ((profile.goldCoins ?? 0) < totalCost) throw new Error("رصيد غير كافٍ");
    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) - totalCost });
    const stream = await ctx.db.get(args.livestreamId);
    const hostProfile = stream ? await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", stream.hostId)).unique() : null;
    const pkA = await ctx.db.query("livePkSessions").withIndex("by_streamA", (q) => q.eq("streamAId", args.livestreamId)).filter((q) => q.eq(q.field("status"), "active")).unique();
    const pkSession = pkA ?? await ctx.db.query("livePkSessions").withIndex("by_streamB", (q) => q.eq("streamBId", args.livestreamId)).filter((q) => q.eq(q.field("status"), "active")).unique();
    await ctx.db.insert("liveGiftEvents", { livestreamId: args.livestreamId, senderId: userId, senderName: profile.name, senderAvatarUrl: profile.avatarUrl, receiverName: hostProfile?.name, receiverAvatarUrl: hostProfile?.avatarUrl, giftName: args.giftName, giftEmoji: args.giftEmoji, giftCoins: args.giftCoins, pkSessionId: pkSession?._id, quantity: qty, createdAt: Date.now() });
    await ctx.db.insert("liveMessages", { livestreamId: args.livestreamId, userId, content: `أرسل ${args.giftEmoji} ${args.giftName} × ${qty}`, senderName: profile.name, senderAvatarUrl: profile.avatarUrl, isVip: profile.isVip ?? false, vipLevel: profile.vipLevel, type: "gift", giftName: args.giftName, giftEmoji: args.giftEmoji, giftCoins: totalCost, createdAt: Date.now() });
    if (stream) {
      await ctx.db.patch(args.livestreamId, { totalCoins: (stream.totalCoins ?? 0) + totalCost });
      const hostProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", stream.hostId)).unique();
      if (hostProfile && stream.hostId !== userId) await ctx.db.patch(hostProfile._id, { goldCoins: (hostProfile.goldCoins ?? 0) + Math.floor(totalCost * 0.7), diamonds: (hostProfile.diamonds ?? 0) + Math.floor(totalCost * 0.3) });
      if (pkSession) await ctx.db.patch(pkSession._id, stream._id === pkSession.streamAId ? { scoreA: pkSession.scoreA + totalCost } : { scoreB: pkSession.scoreB + totalCost });
    }
    return null;
  },
});

export const sendLiveCustomGift = mutation({
  args: { livestreamId: v.id("livestreams"), customGiftId: v.id("customGifts"), quantity: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("Profile not found");
    const gift = await ctx.db.get(args.customGiftId);
    if (!gift) throw new Error("الهدية غير موجودة");
    const qty = args.quantity ?? 1;
    const totalCost = gift.price * qty;
    if ((profile.goldCoins ?? 0) < totalCost) throw new Error("رصيد غير كافٍ");
    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) - totalCost });
    const stream = await ctx.db.get(args.livestreamId);
    const hostProfile = stream ? await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", stream.hostId)).unique() : null;
    const pkA = await ctx.db.query("livePkSessions").withIndex("by_streamA", (q) => q.eq("streamAId", args.livestreamId)).filter((q) => q.eq(q.field("status"), "active")).unique();
    const pkSession = pkA ?? await ctx.db.query("livePkSessions").withIndex("by_streamB", (q) => q.eq("streamBId", args.livestreamId)).filter((q) => q.eq(q.field("status"), "active")).unique();
    const videoUrl = (gift as any).videoUrl ?? ((gift as any).videoStorageId ? await ctx.storage.getUrl((gift as any).videoStorageId) ?? undefined : undefined);
    const thumbnailUrl = (gift as any).thumbnailUrl ?? ((gift as any).thumbnailStorageId ? await ctx.storage.getUrl((gift as any).thumbnailStorageId) ?? undefined : undefined);
    await ctx.db.insert("liveGiftEvents", { livestreamId: args.livestreamId, senderId: userId, senderName: profile.name, senderAvatarUrl: profile.avatarUrl, receiverName: hostProfile?.name, receiverAvatarUrl: hostProfile?.avatarUrl, giftName: gift.name, giftEmoji: "🎁", giftCoins: gift.price, giftImageUrl: thumbnailUrl ?? videoUrl, giftVideoUrl: videoUrl, pkSessionId: pkSession?._id, quantity: qty, createdAt: Date.now() });
    await ctx.db.insert("liveMessages", { livestreamId: args.livestreamId, userId, content: `أرسل هدية ${gift.name} × ${qty}`, senderName: profile.name, senderAvatarUrl: profile.avatarUrl, isVip: profile.isVip ?? false, vipLevel: profile.vipLevel, type: "gift", giftName: gift.name, giftEmoji: "🎁", giftCoins: totalCost, createdAt: Date.now() });
    if (stream) {
      await ctx.db.patch(args.livestreamId, { totalCoins: (stream.totalCoins ?? 0) + totalCost });
      const hostProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", stream.hostId)).unique();
      if (hostProfile && stream.hostId !== userId) await ctx.db.patch(hostProfile._id, { goldCoins: (hostProfile.goldCoins ?? 0) + Math.floor(totalCost * 0.7), diamonds: (hostProfile.diamonds ?? 0) + Math.floor(totalCost * 0.3) });
      if (pkSession) await ctx.db.patch(pkSession._id, stream._id === pkSession.streamAId ? { scoreA: pkSession.scoreA + totalCost } : { scoreB: pkSession.scoreB + totalCost });
    }
    return null;
  },
});

export const getLiveMessages = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    return await ctx.db.query("liveMessages").withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId)).order("desc").take(60);
  },
});

export const getLiveGiftEvents = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    return await ctx.db.query("liveGiftEvents").withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId)).order("desc").take(20);
  },
});

export const getRecentGlobalLiveEvents = query({
  args: {},
  handler: async (ctx) => {
    const gifts = await ctx.db.query("liveGiftEvents").withIndex("by_createdAt").order("desc").take(20);
    const joins = await ctx.db.query("liveViewers").withIndex("by_joinedAt").order("desc").take(20);
    const activeGifts = [] as any[];
    for (const gift of gifts) {
      const stream = await ctx.db.get(gift.livestreamId);
      if (stream?.isLive) activeGifts.push({ ...gift, streamTitle: stream.title, hostId: stream.hostId });
    }
    const activeJoins = [] as any[];
    for (const join of joins) {
      const stream = await ctx.db.get(join.livestreamId);
      if (stream?.isLive) activeJoins.push({ ...join, streamTitle: stream.title, hostId: stream.hostId });
    }
    return { gifts: activeGifts.slice(0, 10), joins: activeJoins.slice(0, 10) };
  },
});
