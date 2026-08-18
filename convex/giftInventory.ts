// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyGiftInventory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const items = await ctx.db
      .query("giftInventory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const result = [];
    for (const inv of items) {
      const giftId = inv.giftId ?? (inv as any).customGiftId;
      if (!giftId) continue;
      const gift = await ctx.db.get(giftId);
      if (!gift) continue;
      const videoUrl = gift.videoStorageId
        ? (await ctx.storage.getUrl(gift.videoStorageId) ?? undefined)
        : undefined;
      const thumbnailUrl = gift.thumbnailStorageId
        ? (await ctx.storage.getUrl(gift.thumbnailStorageId) ?? undefined)
        : undefined;
      result.push({ ...inv, giftId, gift: { ...gift, videoUrl, thumbnailUrl } });
    }
    return result;
  },
});

export const addGiftToInventory = mutation({
  args: { customGiftId: v.id("customGifts"), quantity: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const existing = await ctx.db
      .query("giftInventory")
      .withIndex("by_user_and_gift", (q) =>
        q.eq("userId", userId).eq("giftId", args.customGiftId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { quantity: existing.quantity + args.quantity });
    } else {
      const gift = await ctx.db.get(args.customGiftId);
      await ctx.db.insert("giftInventory", {
        userId,
        giftId: args.customGiftId,
        giftName: gift?.name ?? "",
        giftImageUrl: gift?.imageUrl,
        quantity: args.quantity,
        createdAt: Date.now(),
      });
    }
  },
});

// إرسال هدية من الحقيبة داخل الغرفة
export const sendGiftFromInventory = mutation({
  args: {
    inventoryId: v.id("giftInventory"),
    receiverId: v.id("users"),
    roomId: v.id("rooms"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const inv = await ctx.db.get(args.inventoryId);
    if (!inv || inv.userId !== userId) throw new Error("غير مصرح");
    if (inv.quantity < args.quantity) throw new Error("الكمية غير كافية في صندوق الهدايا");
    const giftId = inv.giftId ?? (inv as any).customGiftId;
    if (!giftId) throw new Error("الهدية غير موجودة");
    const gift = await ctx.db.get(giftId);
    if (!gift) throw new Error("الهدية غير موجودة");
    const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    const receiverProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.receiverId)).unique();
    const newQty = inv.quantity - args.quantity;
    if (newQty <= 0) {
      await ctx.db.delete(inv._id);
    } else {
      await ctx.db.patch(inv._id, { quantity: newQty });
    }
    const videoUrl = gift.videoStorageId ? (await ctx.storage.getUrl(gift.videoStorageId) ?? undefined) : undefined;
    const svgaUrl = (gift as any).svgaStorageId ? (await ctx.storage.getUrl((gift as any).svgaStorageId) ?? undefined) : undefined;
    const soundUrl = (gift as any).soundStorageId ? (await ctx.storage.getUrl((gift as any).soundStorageId) ?? undefined) : undefined;
    const thumbnailUrl = gift.thumbnailStorageId ? (await ctx.storage.getUrl(gift.thumbnailStorageId) ?? undefined) : undefined;
    await ctx.db.insert("giftEvents", {
      roomId: args.roomId,
      senderId: userId,
      receiverId: args.receiverId,
      senderName: senderProfile?.name ?? "مجهول",
      receiverName: receiverProfile?.name ?? "مجهول",
      senderAvatarUrl: senderProfile?.avatarUrl,
      receiverAvatarUrl: receiverProfile?.avatarUrl,
      giftName: gift.name,
      giftEmoji: "🎁",
      giftImageUrl: thumbnailUrl ?? gift.imageUrl,
      customGiftId: giftId,
      videoUrl,
      svgaUrl,
      soundUrl,
      mediaType: (gift as any).mediaType ?? (svgaUrl ? "svga" : "video"),
      showFullScreen: true,
      price: gift.price * args.quantity,
      quantity: args.quantity,
      createdAt: Date.now(),
    });
    if (receiverProfile) {
      const coinsToAdd = Math.floor(gift.price * args.quantity * 0.5);
      await ctx.db.patch(receiverProfile._id, {
        goldCoins: (receiverProfile.goldCoins ?? 0) + coinsToAdd,
        coinsReceivedInRoom: (receiverProfile.coinsReceivedInRoom ?? 0) + coinsToAdd,
        totalCoinsReceived: (receiverProfile.totalCoinsReceived ?? 0) + coinsToAdd,
      });
    }
    return { success: true, giftName: gift.name };
  },
});

// إرسال هدية من الحقيبة بمعرف SAKU (بدون غرفة)
export const sendGiftFromInventoryBySakiId = mutation({
  args: {
    inventoryId: v.id("giftInventory"),
    targetSakiId: v.string(),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const inv = await ctx.db.get(args.inventoryId);
    if (!inv || inv.userId !== userId) throw new Error("غير مصرح");
    const qty = args.quantity ?? 1;
    if (inv.quantity < qty) throw new Error("الكمية غير كافية");
    const giftId = inv.giftId ?? (inv as any).customGiftId;
    if (!giftId) throw new Error("الهدية غير موجودة");
    const gift = await ctx.db.get(giftId);
    if (!gift) throw new Error("الهدية غير موجودة");
    const receiverProfile = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId)).unique();
    if (!receiverProfile) throw new Error("المستخدم غير موجود");
    const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    const newQty = inv.quantity - qty;
    if (newQty <= 0) {
      await ctx.db.delete(inv._id);
    } else {
      await ctx.db.patch(inv._id, { quantity: newQty });
    }
    // إشعار للمستلم
    await ctx.db.insert("notifications", {
      userId: receiverProfile.userId,
      type: "gift",
      title: `🎁 هدية من ${senderProfile?.name ?? "مجهول"}`,
      body: `أرسل لك ${senderProfile?.name ?? "مجهول"} هدية "${gift.name}" ×${qty}`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });
    // إضافة للمخزون
    const existingInv = await ctx.db.query("giftInventory")
      .withIndex("by_user_and_gift", (q) => q.eq("userId", receiverProfile.userId).eq("giftId", giftId))
      .unique();
    if (existingInv) {
      await ctx.db.patch(existingInv._id, { quantity: existingInv.quantity + qty });
    } else {
      await ctx.db.insert("giftInventory", {
        userId: receiverProfile.userId,
        giftId,
        giftName: gift.name,
        giftImageUrl: gift.imageUrl,
        quantity: qty,
        createdAt: Date.now(),
      });
    }
    return { success: true, giftName: gift.name, receiverName: receiverProfile.name };
  },
});

// جلب الهدايا المستقبَلة لمستخدم معين مجمّعة بدون تكرار
export const getReceivedGiftsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("giftEvents")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();
    // تجميع حسب customGiftId أو giftName
    const map: Record<string, { giftName: string; giftImageUrl: string | undefined; count: number; customGiftId: string | null }> = {};
    for (const ev of events) {
      const key = ev.customGiftId ? String(ev.customGiftId) : ev.giftName;
      if (!map[key]) {
        map[key] = {
          giftName: ev.giftName,
          giftImageUrl: ev.giftImageUrl,
          count: 0,
          customGiftId: ev.customGiftId ? String(ev.customGiftId) : null,
        };
      }
      map[key].count += (ev.quantity ?? 1);
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  },
});

// أكبر 3 داعمين لمستخدم معين
export const getTopSupporters = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("giftEvents")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();
    const map: Record<string, { senderId: string; senderName: string; senderAvatarUrl: string | undefined; total: number }> = {};
    for (const ev of events) {
      if (!ev.senderId) continue;
      const k = String(ev.senderId);
      if (!map[k]) map[k] = { senderId: k, senderName: ev.senderName ?? "مجهول", senderAvatarUrl: ev.senderAvatarUrl, total: 0 };
      map[k].total += (ev.quantity ?? 1);
    }
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 3);
  },
});

export const adminGrantGiftToUser = mutation({
  args: {
    targetUserId: v.id("users"),
    customGiftId: v.id("customGifts"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
    const existing = await ctx.db
      .query("giftInventory")
      .withIndex("by_user_and_gift", (q) =>
        q.eq("userId", args.targetUserId).eq("giftId", args.customGiftId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { quantity: existing.quantity + args.quantity });
    } else {
      const gift = await ctx.db.get(args.customGiftId);
      await ctx.db.insert("giftInventory", {
        userId: args.targetUserId,
        giftId: args.customGiftId,
        giftName: gift?.name ?? "",
        giftImageUrl: gift?.imageUrl,
        quantity: args.quantity,
        createdAt: Date.now(),
      });
    }
    return { success: true };
  },
});
