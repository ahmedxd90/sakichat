// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const followAll = mutation({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    let followed = 0;
    for (const targetId of args.userIds) {
      if (targetId === userId) continue;
      const existing = await ctx.db
        .query("follows")
        .withIndex("by_follower_and_following", (q) =>
          q.eq("followerId", userId).eq("followingId", targetId)
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("follows", {
          followerId: userId,
          followingId: targetId,
          createdAt: Date.now(),
        });
        if (myProfile)
          await ctx.db.patch(myProfile._id, {
            followingCount: (myProfile.followingCount ?? 0) + 1,
          });
        const tp = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", targetId))
          .unique();
        if (tp)
          await ctx.db.patch(tp._id, {
            followersCount: (tp.followersCount ?? 0) + 1,
          });
        await ctx.db.insert("notifications", {
          userId: targetId,
          type: "follow",
          title: "👤 متابع جديد",
          body: `قام ${myProfile?.name ?? "مستخدم"} بمتابعتك`,
          isRead: false,
          actorUserId: userId,
          createdAt: Date.now(),
        });
        followed++;
      }
    }
    return followed;
  },
});
