// @ts-nocheck
import { query } from "./_generated/server";
import { v } from "convex/values";

const PERIODS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

// Top gift senders (Wealth)
export const getWealthLeaderboard = query({
  args: { period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")) },
  handler: async (ctx, args) => {
    const since = Date.now() - PERIODS[args.period];
    const gifts = (await ctx.db.query("giftEvents").order("desc").take(8000)).filter((g) => g.createdAt >= since);
    const map: Record<string, number> = {};
    for (const g of gifts) { const id = g.senderId as string; map[id] = (map[id] ?? 0) + g.price; }
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 100);
    return await Promise.all(sorted.map(async ([userId, total], i) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId as any)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { rank: i + 1, userId, name: profile?.name ?? "مجهول", avatarUrl, isVip: profile?.isVip ?? false, vipLevel: profile?.vipLevel, wealthLevel: profile?.wealthLevel ?? 0, charismaLevel: profile?.charismaLevel ?? 0, sakiId: profile?.sakiId ?? "", total };
    }));
  },
});
export const getCharismaLeaderboard = query({
  args: { period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")) },
  handler: async (ctx, args) => {
    const since = Date.now() - PERIODS[args.period];
    const gifts = (await ctx.db.query("giftEvents").order("desc").take(8000)).filter((g) => g.createdAt >= since);
    const map: Record<string, number> = {};
    for (const g of gifts) { const id = g.receiverId as string; map[id] = (map[id] ?? 0) + g.price; }
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 100);
    return await Promise.all(sorted.map(async ([userId, total], i) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId as any)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { rank: i + 1, userId, name: profile?.name ?? "مجهول", avatarUrl, isVip: profile?.isVip ?? false, vipLevel: profile?.vipLevel, wealthLevel: profile?.wealthLevel ?? 0, charismaLevel: profile?.charismaLevel ?? 0, sakiId: profile?.sakiId ?? "", total };
    }));
  },
});

// Top rooms by gifts received
export const getRoomsLeaderboard = query({
  args: { period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")) },
  handler: async (ctx, args) => {
    const since = Date.now() - PERIODS[args.period];
    const gifts = (await ctx.db.query("giftEvents").order("desc").take(8000)).filter((g) => g.createdAt >= since);
    const map: Record<string, number> = {};
    for (const g of gifts) { const id = g.roomId as string; map[id] = (map[id] ?? 0) + g.price; }
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 100);
    return await Promise.all(sorted.map(async ([roomId, total], i) => {
      const room = await ctx.db.get(roomId as any) as any;
      if (!room) return null;
      let coverUrl = room.coverUrl;
      if (room.coverStorageId && !coverUrl) coverUrl = await ctx.storage.getUrl(room.coverStorageId) ?? undefined;
      const ownerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", room.ownerId)).unique();
      return { rank: i + 1, roomId, name: room.name, coverUrl, ownerName: ownerProfile?.name ?? "مجهول", memberCount: room.memberCount, total };
    })).then((r) => r.filter(Boolean));
  },
});

// Top CP couples based on accepted CP rings (sorted by ring price desc)
export const getCpLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const allItems = await ctx.db.query("userStoreItems").collect();
    const cpItems = allItems.filter(
      (i) => i.type === "cp" && i.cpStatus === "accepted" && i.sentToUserId
    );

    const pairMap: Record<string, { senderId: string; receiverId: string; storeItemId: string; price: number; purchasedAt: number }> = {};
    for (const item of cpItems) {
      if (!item.sentToUserId) continue;
      const key = [item.userId as string, item.sentToUserId as string].sort().join("|");
      if (!pairMap[key]) {
        const storeItem = await ctx.db.get(item.storeItemId);
        pairMap[key] = {
          senderId: item.userId as string,
          receiverId: item.sentToUserId as string,
          storeItemId: item.storeItemId as string,
          price: storeItem?.price ?? 0,
          purchasedAt: item.purchasedAt ?? 0,
        };
      }
    }

    const sorted = Object.values(pairMap)
      .sort((a, b) => b.price - a.price || b.purchasedAt - a.purchasedAt)
      .slice(0, 100);

    return await Promise.all(sorted.map(async (pair, i) => {
      const p1 = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", pair.senderId as any)).unique();
      const p2 = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", pair.receiverId as any)).unique();
      let avatar1 = p1?.avatarUrl;
      if (p1?.avatarStorageId && !avatar1) avatar1 = await ctx.storage.getUrl(p1.avatarStorageId) ?? undefined;
      let avatar2 = p2?.avatarUrl;
      if (p2?.avatarStorageId && !avatar2) avatar2 = await ctx.storage.getUrl(p2.avatarStorageId) ?? undefined;
      const storeItem = await ctx.db.get(pair.storeItemId as any) as any;
      let ringMediaUrl = storeItem?.mediaUrl;
      if (storeItem?.mediaStorageId && !ringMediaUrl) ringMediaUrl = await ctx.storage.getUrl(storeItem.mediaStorageId) ?? undefined;
      return {
        rank: i + 1,
        user1Id: pair.senderId, user1Name: p1?.name ?? "مجهول", user1Avatar: avatar1,
        user1IsVip: p1?.isVip ?? false, user1VipLevel: p1?.vipLevel,
        user2Id: pair.receiverId, user2Name: p2?.name ?? "مجهول", user2Avatar: avatar2,
        user2IsVip: p2?.isVip ?? false, user2VipLevel: p2?.vipLevel,
        ringName: storeItem?.name ?? "خاتم CP",
        ringPrice: pair.price,
        ringMediaUrl,
      };
    }));
  },
});
