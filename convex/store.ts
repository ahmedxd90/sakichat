// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createStoreItem = mutation({
  args: {
    type: v.union(v.literal("frame"), v.literal("entry"), v.literal("cp"), v.literal("bubble"), v.literal("seat_skin")),
    name: v.string(),
    price: v.number(),
    durationDays: v.optional(v.number()),
    mediaStorageId: v.id("_storage"),
    thumbnailStorageId: v.optional(v.id("_storage")),
    frameScale: v.optional(v.number()),
    mediaType: v.optional(v.string()),
    isVipFrame: v.optional(v.boolean()),
    vipFrameMinLevel: v.optional(v.number()),
    isSuperAdminFrame: v.optional(v.boolean()),
    isVipEntry: v.optional(v.boolean()),
    vipEntryMinLevel: v.optional(v.number()),
    isAristocracyFrame: v.optional(v.boolean()),
    aristocracyFrameMinLevel: v.optional(v.number()),
    isAristocracyEntry: v.optional(v.boolean()),
    aristocracyEntryMinLevel: v.optional(v.number()),
    isVipSeatSkin: v.optional(v.boolean()),
    vipSeatSkinMinLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
    const mediaUrl = await ctx.storage.getUrl(args.mediaStorageId);
    const thumbnailUrl = args.thumbnailStorageId
      ? (await ctx.storage.getUrl(args.thumbnailStorageId)) ?? undefined
      : undefined;
    return await ctx.db.insert("storeItems", {
      type: args.type,
      name: args.name,
      price: args.price,
      durationDays: args.durationDays,
      mediaStorageId: args.mediaStorageId,
      mediaUrl: mediaUrl ?? undefined,
      thumbnailStorageId: args.thumbnailStorageId,
      thumbnailUrl,
      isActive: true,
      frameScale: args.frameScale,
      mediaType: args.mediaType,
      isVipFrame: args.isVipFrame,
      vipFrameMinLevel: args.vipFrameMinLevel,
      isSuperAdminFrame: args.isSuperAdminFrame,
      isVipEntry: args.isVipEntry,
      vipEntryMinLevel: args.vipEntryMinLevel,
      isAristocracyFrame: args.isAristocracyFrame,
      aristocracyFrameMinLevel: args.aristocracyFrameMinLevel,
      isAristocracyEntry: args.isAristocracyEntry,
      aristocracyEntryMinLevel: args.aristocracyEntryMinLevel,
      isVipSeatSkin: args.isVipSeatSkin,
      vipSeatSkinMinLevel: args.vipSeatSkinMinLevel,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

export const deleteStoreItem = mutation({
  args: { itemId: v.id("storeItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("العنصر غير موجود");
    if (item.mediaStorageId) await ctx.storage.delete(item.mediaStorageId);
    await ctx.db.delete(args.itemId);
  },
});

export const toggleStoreItemActive = mutation({
  args: { itemId: v.id("storeItems"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
    await ctx.db.patch(args.itemId, { isActive: args.isActive });
  },
});

export const listStoreItems = query({
  args: {
    type: v.optional(v.union(v.literal("frame"), v.literal("entry"), v.literal("cp"), v.literal("bubble"), v.literal("seat_skin"))),
  },
  handler: async (ctx, args) => {
    let items;
    if (args.type) {
      items = await ctx.db.query("storeItems").withIndex("by_type", (q) => q.eq("type", args.type!)).collect();
    } else {
      items = await ctx.db.query("storeItems").collect();
    }
    // For seat_skin: show all active seat skins (VIP ones shown to all, purchased in store)
    if (args.type === "seat_skin") {
      items = items.filter((i: any) => i.isActive);
    } else {
      items = items.filter((i: any) => i.isActive && !i.isVipFrame && !i.isSuperAdminFrame && !i.isVipEntry && !i.isAristocracyFrame && !i.isAristocracyEntry && !i.isVipSeatSkin);
    }
    return await Promise.all(items.map(async (item) => {
      const mediaUrl = item.mediaUrl ?? await ctx.storage.getUrl(item.mediaStorageId) ?? undefined;
      const thumbnailUrl = item.thumbnailUrl ?? (item.thumbnailStorageId ? await ctx.storage.getUrl(item.thumbnailStorageId) ?? undefined : undefined);
      return { ...item, mediaUrl, thumbnailUrl };
    }));
  },
});

export const getCustomGifts = query({
  args: {},
  handler: async (ctx) => {
    const gifts = (await ctx.db.query("customGifts").collect()).filter((gift) => gift.isActive !== false);
    return await Promise.all(gifts.map(async (gift) => {
      const videoUrl = gift.videoUrl ?? await ctx.storage.getUrl(gift.videoStorageId) ?? undefined;
      const thumbnailUrl = gift.thumbnailUrl ?? (gift.thumbnailStorageId ? await ctx.storage.getUrl(gift.thumbnailStorageId) ?? undefined : undefined);
      return { ...gift, videoUrl, thumbnailUrl };
    }));
  },
});

export const listAllStoreItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const items = await ctx.db.query("storeItems").order("desc").collect();
    return await Promise.all(items.map(async (item) => {
      const mediaUrl = item.mediaUrl ?? await ctx.storage.getUrl(item.mediaStorageId) ?? undefined;
      const thumbnailUrl = item.thumbnailUrl ?? (item.thumbnailStorageId ? await ctx.storage.getUrl(item.thumbnailStorageId) ?? undefined : undefined);
      return { ...item, mediaUrl, thumbnailUrl };
    }));
  },
});

export const purchaseStoreItem = mutation({
  args: { storeItemId: v.id("storeItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    const item = await ctx.db.get(args.storeItemId);
    if (!item || !item.isActive) throw new Error("العنصر غير متاح");
    if (item.type === "cp") throw new Error("الخاتم يُرسل مباشرة لمستخدم آخر");
    if (item.isVipFrame) throw new Error("هذا الإطار حصري لمستخدمي VIP ويُضاف تلقائياً");
    if (item.isSuperAdminFrame) throw new Error("هذا الإطار حصري للمشرفين فقط");
    if ((item as any).isVipEntry) throw new Error("هذه الدخولية حصرية لمستخدمي VIP وتُضاف تلقائياً");
    if ((item as any).isAristocracyFrame) throw new Error("هذا الإطار حصري لمستخدمي الأرستقراطية ويُضاف تلقائياً");
    if ((item as any).isAristocracyEntry) throw new Error("هذه الدخولية حصرية لمستخدمي الأرستقراطية وتُضاف تلقائياً");
    if ((item as any).isVipSeatSkin) {
      const minLevel = (item as any).vipSeatSkinMinLevel ?? 8;
      if (!profile.isVip || (profile.vipLevel ?? 0) < minLevel) throw new Error(`ستايل المقعد هذا حصري لـ VIP ${minLevel}+ ويُضاف تلقائياً`);
    }
    const coins = profile.goldCoins ?? 0;
    if (coins < item.price) throw new Error(`رصيدك غير كافٍ. تحتاج ${item.price.toLocaleString()} عملة`);
    await ctx.db.patch(profile._id, { goldCoins: coins - item.price });
    const durationMs = item.durationDays ? item.durationDays * 24 * 60 * 60 * 1000 : undefined;
    const now = Date.now();
    if (durationMs) {
      const existing = await ctx.db
        .query("userStoreItems")
        .withIndex("by_user_and_type", (q) => q.eq("userId", userId).eq("type", item.type))
        .collect();
      const sameItem = existing.find((i) => i.storeItemId === args.storeItemId);
      if (sameItem) {
        const base = sameItem.expiresAt && sameItem.expiresAt > now ? sameItem.expiresAt : now;
        await ctx.db.patch(sameItem._id, { expiresAt: base + durationMs });
        return sameItem._id;
      }
    }
    const expiresAt = durationMs ? now + durationMs : undefined;
    const userItemId = await ctx.db.insert("userStoreItems", {
      userId, storeItemId: args.storeItemId, type: item.type,
      purchasedAt: now, expiresAt, isActive: false,
    });
    return userItemId;
  },
});

export const sendCpRing = mutation({
  args: { storeItemId: v.id("storeItems"), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (userId === args.targetUserId) throw new Error("لا يمكنك إرسال الخاتم لنفسك");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    const item = await ctx.db.get(args.storeItemId);
    if (!item || !item.isActive || item.type !== "cp") throw new Error("الخاتم غير متاح");
    const coins = profile.goldCoins ?? 0;
    if (coins < item.price) throw new Error(`رصيدك غير كافٍ. تحتاج ${item.price.toLocaleString()} عملة`);
    await ctx.db.patch(profile._id, { goldCoins: coins - item.price });
    const expiresAt = item.durationDays ? Date.now() + item.durationDays * 24 * 60 * 60 * 1000 : undefined;
    await ctx.db.insert("userStoreItems", {
      userId,
      storeItemId: args.storeItemId,
      type: "cp",
      purchasedAt: Date.now(),
      expiresAt,
      isActive: true,
      sentToUserId: args.targetUserId,
      cpStatus: "pending",
    });
    const receiverItemId = await ctx.db.insert("userStoreItems", {
      userId: args.targetUserId,
      storeItemId: args.storeItemId,
      type: "cp",
      purchasedAt: Date.now(),
      expiresAt,
      isActive: false,
      receivedFromUserId: userId,
      cpStatus: "pending",
    });
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "cp_ring",
      title: "💍 خاتم سحري!",
      body: `${profile.name} أرسل لك خاتم "${item.name}" 💍`,
      isRead: false,
      actorUserId: userId,
      cpRingId: args.storeItemId,
      refId: receiverItemId,
      createdAt: Date.now(),
    });
    return receiverItemId;
  },
});

export const respondToCpRing = mutation({
  args: { userItemId: v.id("userStoreItems"), accept: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const userItem = await ctx.db.get(args.userItemId);
    if (!userItem || userItem.userId !== userId) throw new Error("غير مصرح");
    if (userItem.cpStatus !== "pending") throw new Error("تم الرد على هذا الخاتم مسبقاً");
    await ctx.db.patch(args.userItemId, {
      cpStatus: args.accept ? "accepted" : "rejected",
      isActive: args.accept,
    });
    if (userItem.receivedFromUserId) {
      if (args.accept) {
        const senderItems = await ctx.db.query("userStoreItems")
          .withIndex("by_user_and_type", (q) =>
            q.eq("userId", userItem.receivedFromUserId!).eq("type", "cp"))
          .collect();
        const senderItem = senderItems.find(
          (i) => i.sentToUserId === userId && i.cpStatus === "pending"
        );
        if (senderItem) {
          await ctx.db.patch(senderItem._id, { cpStatus: "accepted", isActive: true });
        }
      }
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      await ctx.db.insert("notifications", {
        userId: userItem.receivedFromUserId,
        type: "cp_ring",
        title: args.accept ? "💍 قبل الخاتم!" : "💔 رفض الخاتم",
        body: args.accept
          ? `${profile?.name ?? "المستخدم"} قبل خاتمك السحري 💍`
          : `${profile?.name ?? "المستخدم"} رفض خاتمك السحري`,
        isRead: false,
        actorUserId: userId,
        createdAt: Date.now(),
      });
    }
  },
});

export const setActiveUserItem = mutation({
  args: { userItemId: v.id("userStoreItems"), active: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const userItem = await ctx.db.get(args.userItemId);
    if (!userItem || userItem.userId !== userId) throw new Error("غير مصرح");
    if (args.active) {
      const sameType = await ctx.db.query("userStoreItems")
        .withIndex("by_user_and_type", (q) => q.eq("userId", userId).eq("type", userItem.type))
        .collect();
      for (const si of sameType) {
        if (si._id !== args.userItemId && si.isActive) {
          await ctx.db.patch(si._id, { isActive: false });
        }
      }
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      if (profile) {
        const patch: any = {};
        if (userItem.type === "frame") patch.activeFrameId = userItem.storeItemId;
        if (userItem.type === "entry") patch.activeEntryId = userItem.storeItemId;
        if (userItem.type === "bubble") patch.activeBubbleId = userItem.storeItemId;
        if (userItem.type === "seat_skin") patch.activeSeatSkinId = userItem.storeItemId;
        await ctx.db.patch(profile._id, patch);
      }
    } else {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      if (profile) {
        const patch: any = {};
        if (userItem.type === "frame") patch.activeFrameId = undefined;
        if (userItem.type === "entry") patch.activeEntryId = undefined;
        if (userItem.type === "bubble") patch.activeBubbleId = undefined;
        if (userItem.type === "seat_skin") patch.activeSeatSkinId = undefined;
        await ctx.db.patch(profile._id, patch);
      }
    }
    await ctx.db.patch(args.userItemId, { isActive: args.active });
  },
});

export const setActiveAristocracyAsset = mutation({
  args: {
    assetType: v.union(v.literal("frame"), v.literal("entry"), v.literal("bubble")),
    active: v.boolean(),
    aristocracyLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    const aristoLevel = profile.aristocracyLevel ?? 0;
    const aristoExpiry = profile.aristocracyExpiresAt ?? 0;
    if (aristoLevel !== args.aristocracyLevel || aristoExpiry < Date.now()) {
      throw new Error("الأرستقراطية غير نشطة");
    }
    const markerKey = `aristo_${args.aristocracyLevel}_${args.assetType}`;
    if (args.active) {
      const sameType = await ctx.db.query("userStoreItems")
        .withIndex("by_user_and_type", (q) => q.eq("userId", userId).eq("type", args.assetType))
        .collect();
      for (const si of sameType) {
        if (si.isActive) await ctx.db.patch(si._id, { isActive: false });
      }
      const patch: any = {};
      if (args.assetType === "frame") patch.activeFrameId = markerKey;
      if (args.assetType === "entry") patch.activeEntryId = markerKey;
      if (args.assetType === "bubble") patch.activeBubbleId = markerKey;
      await ctx.db.patch(profile._id, patch);
    } else {
      const patch: any = {};
      if (args.assetType === "frame" && String(profile.activeFrameId) === markerKey) patch.activeFrameId = undefined;
      if (args.assetType === "entry" && String(profile.activeEntryId) === markerKey) patch.activeEntryId = undefined;
      if (args.assetType === "bubble" && String(profile.activeBubbleId) === markerKey) patch.activeBubbleId = undefined;
      await ctx.db.patch(profile._id, patch);
    }
  },
});

export const setActiveSpecialEntry = mutation({
  args: { storeItemId: v.id("storeItems"), active: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    const item = await ctx.db.get(args.storeItemId);
    if (!item) throw new Error("الدخولية غير موجودة");
    if (item.isVipEntry && !profile.isVip) throw new Error("هذه الدخولية حصرية لمستخدمي VIP");
    if (args.active) {
      await ctx.db.patch(profile._id, { activeEntryId: args.storeItemId });
    } else {
      if (String(profile.activeEntryId) === String(args.storeItemId)) {
        await ctx.db.patch(profile._id, { activeEntryId: undefined });
      }
    }
  },
});

export const setActiveSpecialFrame = mutation({
  args: { storeItemId: v.id("storeItems"), active: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    const item = await ctx.db.get(args.storeItemId);
    if (!item) throw new Error("الإطار غير موجود");
    if (item.isVipFrame && !profile.isVip) throw new Error("هذا الإطار حصري لمستخدمي VIP");
    if (item.isSuperAdminFrame && !profile.isSuperAdmin) throw new Error("هذا الإطار حصري للمشرفين");
    if (args.active) {
      const existingFrames = await ctx.db.query("userStoreItems")
        .withIndex("by_user_and_type", (q) => q.eq("userId", userId).eq("type", "frame"))
        .collect();
      for (const f of existingFrames) {
        if (f.isActive) await ctx.db.patch(f._id, { isActive: false });
      }
      await ctx.db.patch(profile._id, { activeFrameId: args.storeItemId });
    } else {
      if (profile.activeFrameId === args.storeItemId) {
        await ctx.db.patch(profile._id, { activeFrameId: undefined });
      }
    }
  },
});

// تفعيل/إلغاء عنصر أرستقراطية من المتجر (isAristocracyFrame / isAristocracyEntry)
export const setActiveAristocracyStoreItem = mutation({
  args: { storeItemId: v.id("storeItems"), assetType: v.union(v.literal("frame"), v.literal("entry")), active: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    const item = await ctx.db.get(args.storeItemId);
    if (!item) throw new Error("العنصر غير موجود");
    const aristoLevel = profile.aristocracyLevel ?? 0;
    const aristoExpiry = profile.aristocracyExpiresAt ?? 0;
    if (aristoLevel === 0 || aristoExpiry < Date.now()) throw new Error("الأرستقراطية غير نشطة");
    const minLevel = args.assetType === "frame" ? (item.aristocracyFrameMinLevel ?? 1) : (item.aristocracyEntryMinLevel ?? 1);
    if (aristoLevel < minLevel) throw new Error("مستوى الأرستقراطية غير كافٍ");
    if (args.active) {
      const sameType = await ctx.db.query("userStoreItems")
        .withIndex("by_user_and_type", (q) => q.eq("userId", userId).eq("type", args.assetType))
        .collect();
      for (const si of sameType) {
        if (si.isActive) await ctx.db.patch(si._id, { isActive: false });
      }
      const patch: any = {};
      if (args.assetType === "frame") patch.activeFrameId = args.storeItemId;
      if (args.assetType === "entry") patch.activeEntryId = args.storeItemId;
      await ctx.db.patch(profile._id, patch);
    } else {
      const patch: any = {};
      if (args.assetType === "frame" && profile.activeFrameId === args.storeItemId) patch.activeFrameId = undefined;
      if (args.assetType === "entry" && profile.activeEntryId === args.storeItemId) patch.activeEntryId = undefined;
      await ctx.db.patch(profile._id, patch);
    }
  },
});

export const getMyInventory = query({
  args: {
    type: v.optional(v.union(v.literal("frame"), v.literal("entry"), v.literal("cp"), v.literal("bubble"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();

    let items;
    if (args.type) {
      items = await ctx.db.query("userStoreItems")
        .withIndex("by_user_and_type", (q) => q.eq("userId", userId).eq("type", args.type!))
        .collect();
    } else {
      items = await ctx.db.query("userStoreItems")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }
    const now = Date.now();
    const result: any[] = await Promise.all(items.map(async (ui) => {
      const storeItem = ui.storeItemId ? await ctx.db.get(ui.storeItemId) : null;
      const mediaUrl = storeItem?.mediaUrl ?? (storeItem ? await ctx.storage.getUrl(storeItem.mediaStorageId) ?? undefined : undefined);
      const thumbnailUrl = storeItem?.thumbnailUrl ?? (storeItem?.thumbnailStorageId ? await ctx.storage.getUrl(storeItem.thumbnailStorageId) ?? undefined : undefined);
      const isExpired = ui.expiresAt ? ui.expiresAt < now : false;
      return { ...ui, storeItem: storeItem ? { ...storeItem, mediaUrl, thumbnailUrl } : null, isExpired };
    }));

    // ── إضافة أصول الأرستقراطية تلقائياً (إطار + دخولية + فقاعة) من aristocracyLevels ──
    const aristoLevel = profile?.aristocracyLevel ?? 0;
    const aristoExpiry = profile?.aristocracyExpiresAt ?? 0;
    const aristoActive = aristoLevel > 0 && aristoExpiry > now;
    if (aristoActive) {
      const aristoConfig = await ctx.db
        .query("aristocracyLevels")
        .withIndex("by_level", (q) => q.eq("level", aristoLevel))
        .first();
      if (aristoConfig) {
        const assetDefs = [
          { assetType: "frame" as const, url: aristoConfig.frameUrl, storageId: aristoConfig.frameStorageId, label: "إطار" },
          { assetType: "entry" as const, url: aristoConfig.entryEffectUrl, storageId: aristoConfig.entryEffectStorageId, label: "دخولية" },
          { assetType: "bubble" as const, url: aristoConfig.chatBubbleUrl, storageId: aristoConfig.chatBubbleStorageId, label: "فقاعة" },
        ];
        for (const asset of assetDefs) {
          if (!asset.url && !asset.storageId) continue;
          if (args.type && args.type !== asset.assetType) continue;
          const mediaUrl = asset.url ?? (asset.storageId ? await ctx.storage.getUrl(asset.storageId) ?? undefined : undefined);
          if (!mediaUrl) continue;
          const markerKey = `aristo_${aristoLevel}_${asset.assetType}`;
          let isActiveItem = false;
          if (asset.assetType === "frame") isActiveItem = String(profile?.activeFrameId) === markerKey;
          if (asset.assetType === "entry") isActiveItem = String(profile?.activeEntryId) === markerKey;
          if (asset.assetType === "bubble") isActiveItem = String(profile?.activeBubbleId) === markerKey;
          result.push({
            _id: markerKey,
            _creationTime: now,
            userId,
            storeItemId: null,
            type: asset.assetType,
            isActive: isActiveItem,
            purchasedAt: 0,
            isExpired: false,
            isAristocracyAutoAdded: true,
            aristocracyLevel: aristoLevel,
            expiresAt: aristoExpiry,
            storeItem: {
              _id: markerKey,
              name: `${aristoConfig.name} - ${asset.label}`,
              mediaUrl,
              type: asset.assetType,
              mediaType: asset.assetType === "entry" ? (aristoConfig.entryEffectType ?? "mp4") : "image",
            },
          });
        }
      }
    }

    // إضافة إطارات VIP تلقائياً إذا كان المستخدم VIP
    if ((!args.type || args.type === "frame") && profile?.isVip && profile.vipLevel) {
      const vipFrames = await ctx.db.query("storeItems")
        .withIndex("by_type", (q) => q.eq("type", "frame"))
        .collect();
      const eligibleVipFrames = vipFrames.filter(
        (f) => f.isVipFrame && f.isActive && (f.vipFrameMinLevel ?? 1) <= (profile.vipLevel ?? 0)
      );
      for (const frame of eligibleVipFrames) {
        const alreadyOwned = result.some((r) => r.storeItemId === frame._id);
        if (!alreadyOwned) {
          const mediaUrl = frame.mediaUrl ?? await ctx.storage.getUrl(frame.mediaStorageId) ?? undefined;
          const isActiveFrame = profile.activeFrameId === frame._id;
          result.push({
            _id: `vip_frame_${frame._id}`,
            _creationTime: frame._creationTime,
            userId,
            storeItemId: frame._id,
            type: "frame",
            isActive: isActiveFrame,
            purchasedAt: 0,
            isExpired: false,
            isVipAutoAdded: true,
            storeItem: { ...frame, mediaUrl },
          });
        }
      }
    }

    // إضافة إطارات سوبر ادمن تلقائياً
    if ((!args.type || args.type === "frame") && profile?.isSuperAdmin) {
      const adminFrames = await ctx.db.query("storeItems")
        .withIndex("by_type", (q) => q.eq("type", "frame"))
        .collect();
      const eligibleAdminFrames = adminFrames.filter((f) => f.isSuperAdminFrame && f.isActive);
      for (const frame of eligibleAdminFrames) {
        const alreadyOwned = result.some((r) => r.storeItemId === frame._id);
        if (!alreadyOwned) {
          const mediaUrl = frame.mediaUrl ?? await ctx.storage.getUrl(frame.mediaStorageId) ?? undefined;
          const isActiveFrame = profile.activeFrameId === frame._id;
          result.push({
            _id: `admin_frame_${frame._id}`,
            _creationTime: frame._creationTime,
            userId,
            storeItemId: frame._id,
            type: "frame",
            isActive: isActiveFrame,
            purchasedAt: 0,
            isExpired: false,
            isSuperAdminAutoAdded: true,
            storeItem: { ...frame, mediaUrl },
          });
        }
      }
    }

    // دخوليات VIP تلقائياً حسب المستوى
    if ((!args.type || args.type === "entry") && profile?.isVip && profile.vipLevel) {
      const vipEntries = await ctx.db.query("storeItems")
        .withIndex("by_type", (q) => q.eq("type", "entry")).collect();
      const eligible = vipEntries.filter(
        (e: any) => e.isVipEntry && e.isActive && (e.vipEntryMinLevel ?? 1) <= (profile.vipLevel ?? 0)
      );
      for (const entry of eligible) {
        if (result.some((r) => r.storeItemId === entry._id)) continue;
        const mUrl = entry.mediaUrl ?? (entry.mediaStorageId ? await ctx.storage.getUrl(entry.mediaStorageId) ?? undefined : undefined);
        const tUrl = entry.thumbnailUrl ?? (entry.thumbnailStorageId ? await ctx.storage.getUrl(entry.thumbnailStorageId) ?? undefined : undefined);
        result.push({
          _id: `vip_entry_${entry._id}`, _creationTime: entry._creationTime,
          userId, storeItemId: entry._id, type: "entry",
          isActive: profile.activeEntryId === entry._id,
          purchasedAt: 0, isExpired: false, isVipAutoAdded: true,
          storeItem: { ...entry, mediaUrl: mUrl, thumbnailUrl: tUrl },
        });
      }
    }

    // ── إطارات الأرستقراطية من المتجر (isAristocracyFrame) تلقائياً ──
    if ((!args.type || args.type === "frame") && aristoActive) {
      const aFrames = await ctx.db.query("storeItems")
        .withIndex("by_type", (q) => q.eq("type", "frame")).collect();
      for (const f of aFrames.filter((f: any) => f.isAristocracyFrame && f.isActive && (f.aristocracyFrameMinLevel ?? 1) <= aristoLevel)) {
        if (result.some((r: any) => r.storeItemId === f._id)) continue;
        const mUrl = f.mediaUrl ?? (f.mediaStorageId ? await ctx.storage.getUrl(f.mediaStorageId) ?? undefined : undefined);
        const tUrl = f.thumbnailUrl ?? (f.thumbnailStorageId ? await ctx.storage.getUrl(f.thumbnailStorageId) ?? undefined : undefined);
        result.push({
          _id: `aristo_store_frame_${f._id}`, _creationTime: f._creationTime,
          userId, storeItemId: f._id, type: "frame",
          isActive: profile?.activeFrameId === f._id,
          purchasedAt: 0, isExpired: false, isAristocracyAutoAdded: true,
          storeItem: { ...f, mediaUrl: mUrl, thumbnailUrl: tUrl },
        });
      }
    }

    // ── دخوليات الأرستقراطية من المتجر (isAristocracyEntry) تلقائياً ──
    if ((!args.type || args.type === "entry") && aristoActive) {
      const aEntries = await ctx.db.query("storeItems")
        .withIndex("by_type", (q) => q.eq("type", "entry")).collect();
      for (const e of aEntries.filter((e: any) => e.isAristocracyEntry && e.isActive && (e.aristocracyEntryMinLevel ?? 1) <= aristoLevel)) {
        if (result.some((r: any) => r.storeItemId === e._id)) continue;
        const mUrl = e.mediaUrl ?? (e.mediaStorageId ? await ctx.storage.getUrl(e.mediaStorageId) ?? undefined : undefined);
        const tUrl = e.thumbnailUrl ?? (e.thumbnailStorageId ? await ctx.storage.getUrl(e.thumbnailStorageId) ?? undefined : undefined);
        result.push({
          _id: `aristo_store_entry_${e._id}`, _creationTime: e._creationTime,
          userId, storeItemId: e._id, type: "entry",
          isActive: profile?.activeEntryId === e._id,
          purchasedAt: 0, isExpired: false, isAristocracyAutoAdded: true,
          storeItem: { ...e, mediaUrl: mUrl, thumbnailUrl: tUrl },
        });
      }
    }

    return result;
  },
});

export const getUserActiveItems = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("userStoreItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const now = Date.now();
    const activeItems = items.filter((i) => i.isActive && (!i.expiresAt || i.expiresAt > now));
    const result: Record<string, any> = {};
    // بعض الحسابات القديمة تحتوي معرفات متجر رقمية/مبتورة وليست Convex IDs.
    // لا نسمح لهذه القيم بإسقاط الاستعلام أو صفحة المستخدم.
    const safeGetStoreItem = async (rawId: unknown) => {
      if (typeof rawId !== "string" || rawId.length === 0) return null;
      try {
        return await ctx.db.get(rawId as any);
      } catch {
        return null;
      }
    };
    for (const ui of activeItems) {
      const storeItem = await safeGetStoreItem(ui.storeItemId);
      if (!storeItem) continue;
      const mediaUrl = storeItem.mediaUrl ?? await ctx.storage.getUrl(storeItem.mediaStorageId) ?? undefined;
      result[ui.type] = { ...storeItem, mediaUrl, frameScale: storeItem.frameScale ?? 1.3 };
    }
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.userId)).unique();
    if (!result["frame"] && profile?.activeFrameId) {
      const activeFrameIdStr = String(profile.activeFrameId);
      if (activeFrameIdStr.startsWith("aristo_")) {
        const parts = activeFrameIdStr.split("_");
        const level = parseInt(parts[1]);
        if (level > 0) {
          const aristoConfig = await ctx.db
            .query("aristocracyLevels")
            .withIndex("by_level", (q) => q.eq("level", level))
            .first();
          if (aristoConfig?.frameUrl) {
            result["frame"] = {
              _id: activeFrameIdStr,
              name: `${aristoConfig.name} - إطار`,
              mediaUrl: aristoConfig.frameUrl,
              type: "frame",
              frameScale: 1.3,
            };
          }
        }
      } else {
        const storeItem = await safeGetStoreItem(profile.activeFrameId);
        if (storeItem) {
          const mediaUrl = storeItem.mediaUrl ?? await ctx.storage.getUrl(storeItem.mediaStorageId) ?? undefined;
          result["frame"] = { ...storeItem, mediaUrl, frameScale: storeItem.frameScale ?? 1.3 };
        }
      }
    }
    if (!result["entry"] && profile?.activeEntryId) {
      const activeEntryIdStr = String(profile.activeEntryId);
      if (activeEntryIdStr.startsWith("aristo_")) {
        const parts = activeEntryIdStr.split("_");
        const level = parseInt(parts[1]);
        if (level > 0) {
          const aristoConfig = await ctx.db
            .query("aristocracyLevels")
            .withIndex("by_level", (q) => q.eq("level", level))
            .first();
          if (aristoConfig?.entryEffectUrl) {
            result["entry"] = {
              _id: activeEntryIdStr,
              name: `${aristoConfig.name} - دخولية`,
              mediaUrl: aristoConfig.entryEffectUrl,
              type: "entry",
              mediaType: aristoConfig.entryEffectType ?? "mp4",
            };
          }
        }
      } else {
        // دخولية أرستقراطية من المتجر
        const storeItem = await safeGetStoreItem(profile.activeEntryId);
        if (storeItem) {
          const mediaUrl = storeItem.mediaUrl ?? await ctx.storage.getUrl(storeItem.mediaStorageId) ?? undefined;
          result["entry"] = { ...storeItem, mediaUrl };
        }
      }
    }
    if (!result["bubble"] && profile?.activeBubbleId) {
      const activeBubbleIdStr = String(profile.activeBubbleId);
      if (activeBubbleIdStr.startsWith("aristo_")) {
        const parts = activeBubbleIdStr.split("_");
        const level = parseInt(parts[1]);
        if (level > 0) {
          const aristoConfig = await ctx.db
            .query("aristocracyLevels")
            .withIndex("by_level", (q) => q.eq("level", level))
            .first();
          if (aristoConfig?.chatBubbleUrl) {
            result["bubble"] = {
              _id: activeBubbleIdStr,
              name: `${aristoConfig.name} - فقاعة`,
              mediaUrl: aristoConfig.chatBubbleUrl,
              type: "bubble",
            };
          }
        }
      }
    }
    return result;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUserStoreItems = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("userStoreItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const now = Date.now();
    return await Promise.all(items.map(async (ui) => {
      const storeItem = ui.storeItemId ? await ctx.db.get(ui.storeItemId) : null;
      const mediaUrl = storeItem?.mediaUrl ?? (storeItem?.mediaStorageId ? await ctx.storage.getUrl(storeItem.mediaStorageId) ?? undefined : undefined);
      const isExpired = ui.expiresAt ? ui.expiresAt < now : false;
      return { ...ui, storeItem: storeItem ? { ...storeItem, mediaUrl } : null, isExpired };
    }));
  },
});

export const getActiveCpPartner = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cpItems = await ctx.db.query("userStoreItems")
      .withIndex("by_user_and_type", (q) => q.eq("userId", args.userId).eq("type", "cp"))
      .collect();
    const activeCp = cpItems.find(
      (i) => i.cpStatus === "accepted" && i.isActive && (!i.expiresAt || i.expiresAt > now)
    );
    const cpHome = await ctx.db.query("cpHomes").withIndex("by_userId", (q) => q.eq("userId", args.userId)).unique();
    const legacyPartnerId = cpHome?.user1Id === args.userId ? cpHome.user2Id : cpHome?.user2Id === args.userId ? cpHome.user1Id : null;
    const partnerUserId = activeCp?.sentToUserId ?? activeCp?.receivedFromUserId ?? cpHome?.partnerUserId ?? legacyPartnerId;
    if (!partnerUserId) return null;
    const partnerProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", partnerUserId))
      .unique();
    const storeItem = activeCp ? await ctx.db.get(activeCp.storeItemId) : null;
    let mediaUrl = storeItem?.mediaUrl;
    if (storeItem?.mediaStorageId) {
      const freshMediaUrl = await ctx.storage.getUrl(storeItem.mediaStorageId);
      if (freshMediaUrl) mediaUrl = freshMediaUrl;
    }
    let partnerAvatarUrl = partnerProfile?.avatarUrl ?? null;
    if (partnerProfile?.avatarStorageId) {
      const freshPartnerAvatarUrl = await ctx.storage.getUrl(partnerProfile.avatarStorageId);
      if (freshPartnerAvatarUrl) partnerAvatarUrl = freshPartnerAvatarUrl;
    }
    return {
      partnerUserId,
      partnerName: partnerProfile?.name ?? "مجهول",
      partnerAvatarUrl,
      ringName: storeItem?.name ?? "خاتم",
      ringMediaUrl: mediaUrl,
      expiresAt: activeCp?.expiresAt ?? null,
      startedAt: activeCp?.purchasedAt ?? cpHome?.marriageDayStart ?? cpHome?.createdAt ?? Date.now(),
    };
  },
});
