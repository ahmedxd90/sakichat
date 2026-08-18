// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateEmojiUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة متاحة لمدير التطبيق فقط");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createRoomEmoji = mutation({
  args: {
    name: v.string(),
    imageStorageId: v.id("_storage"),
    isVipOnly: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة متاحة لمدير التطبيق فقط");
    const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
    return await ctx.db.insert("roomEmojis", {
      name: args.name,
      imageStorageId: args.imageStorageId,
      imageUrl: imageUrl ?? undefined,
      isVipOnly: args.isVipOnly,
      emojiType: "normal",
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

export const createVipEmoji = mutation({
  args: {
    name: v.string(),
    svgaStorageId: v.id("_storage"),
    thumbnailStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة متاحة لمدير التطبيق فقط");
    const svgaUrl = await ctx.storage.getUrl(args.svgaStorageId);
    const thumbnailUrl = await ctx.storage.getUrl(args.thumbnailStorageId);
    return await ctx.db.insert("roomEmojis", {
      name: args.name,
      imageStorageId: args.thumbnailStorageId,
      imageUrl: thumbnailUrl ?? undefined,
      svgaStorageId: args.svgaStorageId,
      svgaUrl: svgaUrl ?? undefined,
      thumbnailStorageId: args.thumbnailStorageId,
      thumbnailUrl: thumbnailUrl ?? undefined,
      isVipOnly: true,
      emojiType: "vip",
      isAnimated: true,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

export const deleteRoomEmoji = mutation({
  args: { emojiId: v.id("roomEmojis") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة متاحة لمدير التطبيق فقط");
    const emoji = await ctx.db.get(args.emojiId);
    if (!emoji) throw new Error("الإيموجي غير موجود");
    await ctx.storage.delete(emoji.imageStorageId);
    if (emoji.svgaStorageId) await ctx.storage.delete(emoji.svgaStorageId);
    await ctx.db.delete(args.emojiId);
  },
});

export const getRoomEmojis = query({
  args: {},
  handler: async (ctx) => {
    const emojis = await ctx.db
      .query("roomEmojis")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return await Promise.all(
      emojis.map(async (e) => {
        let imageUrl = e.imageUrl;
        if (!imageUrl) imageUrl = (await ctx.storage.getUrl(e.imageStorageId)) ?? undefined;
        let svgaUrl = e.svgaUrl;
        if (!svgaUrl && e.svgaStorageId) svgaUrl = (await ctx.storage.getUrl(e.svgaStorageId)) ?? undefined;
        let thumbnailUrl = e.thumbnailUrl;
        if (!thumbnailUrl && e.thumbnailStorageId) thumbnailUrl = (await ctx.storage.getUrl(e.thumbnailStorageId)) ?? undefined;
        return { ...e, imageUrl, svgaUrl, thumbnailUrl };
      })
    );
  },
});

export const sendSeatEmoji = mutation({
  args: {
    roomId: v.id("rooms"),
    seatIndex: v.number(),
    emojiId: v.id("roomEmojis"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");

    const emoji = await ctx.db.get(args.emojiId);
    if (!emoji || !emoji.isActive) throw new Error("الإيموجي غير متاح");

    if (emoji.emojiType === "vip") {
      if (!profile.isVip || (profile.vipLevel ?? 0) < 1) {
        throw new Error("إيموجي VIP متاح لـ VIP1 وأعلى فقط 👑");
      }
    } else if (emoji.isVipOnly) {
      if (!profile.isVip || (profile.vipLevel ?? 0) < 5) {
        throw new Error("هذا الإيموجي متاح لـ VIP5 وأعلى فقط 👑");
      }
    }

    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    if (!member || member.seatIndex !== args.seatIndex) {
      throw new Error("يجب أن تكون على هذا المقعد");
    }

    let imageUrl = emoji.imageUrl;
    if (!imageUrl) imageUrl = (await ctx.storage.getUrl(emoji.imageStorageId)) ?? "";

    let svgaUrl = emoji.svgaUrl;
    if (!svgaUrl && emoji.svgaStorageId) svgaUrl = (await ctx.storage.getUrl(emoji.svgaStorageId)) ?? undefined;

    await ctx.db.insert("roomEmojiEvents", {
      roomId: args.roomId,
      seatIndex: args.seatIndex,
      emojiId: args.emojiId,
      imageUrl: imageUrl ?? "",
      svgaUrl: svgaUrl ?? undefined,
      isAnimated: emoji.isAnimated ?? false,
      emojiType: emoji.emojiType ?? "normal",
      senderName: profile.name,
      createdAt: Date.now(),
    });
  },
});

export const getLatestRoomEmojiEvent = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roomEmojiEvents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .first();
  },
});
