// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyRelatedRooms = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { recent: [], liked: [], admin: [] };

    const memberships = await ctx.db.query("roomPresence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc").take(10);

    const recentRooms = (await Promise.all(memberships.map(async (m) => {
      const room = await ctx.db.get(m.roomId);
      if (!room || room.memberCount === 0) return null;
      let coverUrl = room.coverUrl;
      if (room.coverStorageId && !coverUrl) {
        coverUrl = await ctx.storage.getUrl(room.coverStorageId) ?? undefined;
      }
      const ownerProfile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", room.ownerId)).unique();
      return { ...room, coverUrl, ownerIsVip: ownerProfile?.isVip ?? false, ownerVipLevel: ownerProfile?.vipLevel ?? 0 };
    }))).filter(Boolean).slice(0, 5);

    const allLikes = await ctx.db.query("roomLikes").collect();
    const myLikes = allLikes.filter(l => l.userId === userId).slice(0, 5);
    const likedRooms = (await Promise.all(myLikes.map(async (l) => {
      const room = await ctx.db.get(l.roomId);
      if (!room || room.memberCount === 0) return null;
      let coverUrl = room.coverUrl;
      if (room.coverStorageId && !coverUrl) {
        coverUrl = await ctx.storage.getUrl(room.coverStorageId) ?? undefined;
      }
      const ownerProfile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", room.ownerId)).unique();
      return { ...room, coverUrl, ownerIsVip: ownerProfile?.isVip ?? false, ownerVipLevel: ownerProfile?.vipLevel ?? 0 };
    }))).filter(Boolean);

    const allAdmins = await ctx.db.query("roomAdmins").collect();
    const myAdmin = allAdmins.filter(a => a.userId === userId).slice(0, 5);
    const adminRooms = (await Promise.all(myAdmin.map(async (a) => {
      const room = await ctx.db.get(a.roomId);
      if (!room || room.memberCount === 0) return null;
      let coverUrl = room.coverUrl;
      if (room.coverStorageId && !coverUrl) {
        coverUrl = await ctx.storage.getUrl(room.coverStorageId) ?? undefined;
      }
      const ownerProfile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", room.ownerId)).unique();
      return { ...room, coverUrl, ownerIsVip: ownerProfile?.isVip ?? false, ownerVipLevel: ownerProfile?.vipLevel ?? 0 };
    }))).filter(Boolean);

    return { recent: recentRooms, liked: likedRooms, admin: adminRooms };
  },
});
