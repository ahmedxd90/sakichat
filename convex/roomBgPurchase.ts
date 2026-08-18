// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const purchaseCustomBg = mutation({
  args: { roomId: v.id("rooms"), bgStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("unauth");
    const room = await ctx.db.get(args.roomId);
    if (!room || room.ownerId !== userId) throw new Error("no permission");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("profile not found");
    if ((profile.goldCoins ?? 0) < 30000) {
      throw new Error("need 30000 coins");
    }
    await ctx.db.patch(profile._id, {
      goldCoins: (profile.goldCoins ?? 0) - 30000,
    });
    const bgUrl = await ctx.storage.getUrl(args.bgStorageId);
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await ctx.db.patch(args.roomId, {
      bgStorageId: args.bgStorageId,
      bgImageUrl: bgUrl ?? undefined,
      bgCustomExpiresAt: expiresAt,
    });
    return { expiresAt };
  },
});
