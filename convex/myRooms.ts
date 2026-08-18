// @ts-nocheck
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Dashboard data for the Home > My Rooms section.
 * "recent" is driven by roomMembers.joinedAt, which is refreshed whenever
 * joinRoom is called, so a room re-entered today moves to the front.
 */
export const getMyRoomsDashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { mine: [], followed: [], recent: [], managed: [] };

    const rawRooms = await ctx.db.query("rooms").collect();
    const allRooms = await Promise.all(rawRooms.map(async (room) => ({
      ...room,
      coverUrl: room.coverUrl ?? (room.coverStorageId ? ((await ctx.storage.getUrl(room.coverStorageId)) ?? undefined) : undefined),
      bgImageUrl: room.bgImageUrl ?? (room.bgStorageId ? ((await ctx.storage.getUrl(room.bgStorageId)) ?? undefined) : undefined),
    })));
    const roomById = new Map(allRooms.map((room) => [String(room._id), room]));

    const owned = allRooms.find((room) => room.ownerId === userId) ?? null;

    const memberRows = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(80);

    const recent = memberRows
      .slice()
      .sort((a, b) => (b.joinedAt ?? 0) - (a.joinedAt ?? 0))
      .map((member) => roomById.get(String(member.roomId)))
      .filter(Boolean)
      .filter((room, index, list) => list.findIndex((item) => String(item._id) === String(room._id)) === index)
      .slice(0, 30);

    const managedIds = new Set(
      memberRows
        .filter((member) => member.role === "owner" || member.role === "admin")
        .map((member) => String(member.roomId)),
    );
    if (owned) managedIds.add(String(owned._id));
    const managed = allRooms
      .filter((room) => managedIds.has(String(room._id)))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    const followedRows = await ctx.db
      .query("roomFollowers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    const followed = followedRows
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .map((follow) => roomById.get(String(follow.roomId)))
      .filter(Boolean)
      .filter((room, index, list) => list.findIndex((item) => String(item._id) === String(room._id)) === index)
      .slice(0, 30);

    return {
      mine: owned ? [owned] : [],
      followed,
      recent,
      managed,
    };
  },
});
