// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMySeatSkins = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];
    const result: any[] = [];
    const now = Date.now();

    // purchased skins
    const owned = await ctx.db
      .query("userStoreItems")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("type", "seat_skin")
      )
      .collect();
    for (const ui of owned) {
      const s = ui.storeItemId ? await ctx.db.get(ui.storeItemId) : null;
      if (!s) continue;
      const mUrl =
        s.mediaUrl ??
        (s.mediaStorageId
          ? (await ctx.storage.getUrl(s.mediaStorageId)) ?? undefined
          : undefined);
      const tUrl =
        s.thumbnailUrl ??
        (s.thumbnailStorageId
          ? (await ctx.storage.getUrl(s.thumbnailStorageId)) ?? undefined
          : undefined);
      result.push({
        ...ui,
        storeItem: { ...s, mediaUrl: mUrl, thumbnailUrl: tUrl },
        isExpired: ui.expiresAt ? ui.expiresAt < now : false,
        isActive: profile.activeSeatSkinId === ui.storeItemId,
      });
    }

    // VIP auto-added skins (VIP 8+)
    if (profile.isVip && (profile.vipLevel ?? 0) >= 8) {
      const skins = await ctx.db
        .query("storeItems")
        .withIndex("by_type", (q) => q.eq("type", "seat_skin"))
        .collect();
      for (const s of skins.filter(
        (s: any) =>
          s.isVipSeatSkin &&
          s.isActive &&
          (s.vipSeatSkinMinLevel ?? 8) <= (profile.vipLevel ?? 0)
      )) {
        if (result.some((r: any) => r.storeItemId === s._id)) continue;
        const mUrl =
          s.mediaUrl ??
          (s.mediaStorageId
            ? (await ctx.storage.getUrl(s.mediaStorageId)) ?? undefined
            : undefined);
        const tUrl =
          s.thumbnailUrl ??
          (s.thumbnailStorageId
            ? (await ctx.storage.getUrl(s.thumbnailStorageId)) ?? undefined
            : undefined);
        result.push({
          _id: `vip_seat_${s._id}`,
          _creationTime: s._creationTime,
          userId,
          storeItemId: s._id,
          type: "seat_skin",
          isActive: profile.activeSeatSkinId === s._id,
          purchasedAt: 0,
          isExpired: false,
          isVipAutoAdded: true,
          storeItem: { ...s, mediaUrl: mUrl, thumbnailUrl: tUrl },
        });
      }
    }

    return result;
  },
});

export const setActiveSeatSkin = mutation({
  args: {
    storeItemId: v.optional(v.id("storeItems")),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");

    if (args.active && args.storeItemId) {
      const item = await ctx.db.get(args.storeItemId);
      if (item?.isVipSeatSkin) {
        const minLevel = (item as any).vipSeatSkinMinLevel ?? 8;
        if (!profile.isVip || (profile.vipLevel ?? 0) < minLevel) {
          throw new Error(`ستايل المقعد حصري لـ VIP ${minLevel}+`);
        }
      }
      await ctx.db.patch(profile._id, { activeSeatSkinId: args.storeItemId });
    } else {
      await ctx.db.patch(profile._id, { activeSeatSkinId: undefined });
    }
  },
});

export const getActiveSeatSkin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile?.activeSeatSkinId) return null;
    const skinId = profile.activeSeatSkinId;
    const skinIdStr = String(skinId);
    // Try to get from storeItems
    try {
      const item = await ctx.db.get(skinId as any);
      if (item) {
        const mediaUrl =
          item.mediaUrl ??
          (item.mediaStorageId
            ? (await ctx.storage.getUrl(item.mediaStorageId)) ?? undefined
            : undefined);
        return { ...item, mediaUrl };
      }
    } catch (_) {}
    return null;
  },
});
