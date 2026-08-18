// @ts-nocheck
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get the current week's Monday 00:00 UTC
function getWeekStartSunday(now: number): number {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.getTime();
}

function getWeekEndSunday(weekStart: number): number {
  return weekStart + 7 * 24 * 60 * 60 * 1000 - 1;
}

// Legacy alias retained for older admin event creation paths.
function getWeekStart(now: number): number { return getWeekStartSunday(now); }
function getWeekEnd(weekStart: number): number { return getWeekEndSunday(weekStart); }

export const getActiveEvent = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const weekStart = getWeekStartSunday(now);
    const events = await ctx.db.query("weeklyStarEvents").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    const event: any = events.find((item: any) => item.weekStart === weekStart && (!item.weekEnd || item.weekEnd > now)) ?? null;
    if (!event) return null;
    let gift: any = event.giftId ? await ctx.db.get(event.giftId) : null;
    const imageUrl = event.giftImageUrl ?? gift?.thumbnailUrl ?? gift?.imageUrl ?? (gift?.thumbnailStorageId ? await ctx.storage.getUrl(gift.thumbnailStorageId) : null);
    return { ...event, weekEnd: event.weekEnd ?? getWeekEndSunday(weekStart), giftName: event.giftName ?? gift?.name ?? null, giftImageUrl: imageUrl ?? null, giftPrice: event.giftPrice ?? gift?.price ?? gift?.coinPrice ?? 0 };
  },
});

export const getLeaderboard = query({
  args: { eventId: v.id("weeklyStarEvents") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("weeklyStarEntries")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    return entries.sort((a, b) => b.totalCoins - a.totalCoins);
  },
});

export const getMyEntry = query({
  args: { eventId: v.id("weeklyStarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("weeklyStarEntries")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", userId)
      )
      .first();
  },
});

export const getEventGifts = query({
  args: {},
  handler: async (ctx) => {
    const gifts = await ctx.db
      .query("customGifts")
      .withIndex("by_category", (q) => q.eq("category", "events"))
      .collect();
    return await Promise.all(
      gifts.map(async (g) => {
        let imageUrl = g.thumbnailStorageId
          ? await ctx.storage.getUrl(g.thumbnailStorageId)
          : null;
        if (!imageUrl && g.videoStorageId) {
          imageUrl = await ctx.storage.getUrl(g.videoStorageId);
        }
        return { ...g, resolvedImageUrl: imageUrl };
      })
    );
  },
});

export const getPastEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("weeklyStarEvents")
      .withIndex("by_active", (q) => q.eq("isActive", false))
      .order("desc")
      .take(10);
    return events;
  },
});

// Admin: create or update the active weekly star event
export const adminSetEvent = mutation({
  args: {
    giftId: v.optional(v.id("customGifts")),
    giftName: v.optional(v.string()),
    giftImageUrl: v.optional(v.string()),
    giftPrice: v.optional(v.number()),
    rewardCoins: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile?.isSuperAdmin) throw new Error("غير مصرح");

    const now = Date.now();
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(weekStart);

    // Deactivate old events
    const oldEvents = await ctx.db
      .query("weeklyStarEvents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    for (const e of oldEvents) {
      await ctx.db.patch(e._id, { isActive: false });
    }

    await ctx.db.insert("weeklyStarEvents", {
      weekStart,
      weekEnd,
      giftId: args.giftId,
      giftName: args.giftName,
      giftImageUrl: args.giftImageUrl,
      giftPrice: args.giftPrice,
      isActive: true,
      rewardCoins: args.rewardCoins ?? 50000,
      createdAt: now,
    });
    return null;
  },
});

// Called when a gift is sent in a room - records contribution
export const recordGiftContribution = mutation({
  args: {
    eventId: v.id("weeklyStarEvents"),
    receiverId: v.id("users"),
    receiverName: v.string(),
    receiverAvatarUrl: v.optional(v.string()),
    giftCount: v.number(),
    coins: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weeklyStarEntries")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", args.receiverId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        giftCount: existing.giftCount + args.giftCount,
        totalCoins: existing.totalCoins + args.coins,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("weeklyStarEntries", {
        eventId: args.eventId,
        userId: args.receiverId,
        userName: args.receiverName,
        userAvatarUrl: args.receiverAvatarUrl,
        giftCount: args.giftCount,
        totalCoins: args.coins,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

// Internal: called from sendCustomGift when category === "events"
export const internalRecordEventGift = internalMutation({
  args: {
    senderId: v.id("users"),
    senderName: v.string(),
    senderAvatarUrl: v.optional(v.string()),
    giftId: v.id("customGifts"),
    qty: v.number(),
    totalPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekStart = getWeekStartSunday(now);
    const activeEvents = await ctx.db.query("weeklyStarEvents").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    let activeEvent: any = activeEvents.find((item: any) => item.weekStart === weekStart && (!item.weekEnd || item.weekEnd > now)) ?? null;
    if (!activeEvent) {
      const settings: any = await ctx.db.query("weeklyStarSettings").order("desc").first();
      if (!settings?.currentGiftId || settings.currentGiftId !== args.giftId) return null;
      for (const old of activeEvents) await ctx.db.patch(old._id, { isActive: false });
      const gift: any = await ctx.db.get(args.giftId);
      activeEvent = { _id: await ctx.db.insert("weeklyStarEvents", { weekStart, weekEnd: getWeekEndSunday(weekStart), endsAt: getWeekEndSunday(weekStart), giftId: args.giftId, giftName: gift?.name, giftImageUrl: gift?.thumbnailUrl ?? gift?.imageUrl ?? (gift?.thumbnailStorageId ? await ctx.storage.getUrl(gift.thumbnailStorageId) : undefined), giftPrice: gift?.price ?? gift?.coinPrice ?? 0, isActive: true, rewardCoins: settings.firstGold ?? 0, createdAt: now }), weekStart, weekEnd: getWeekEndSunday(weekStart), giftId: args.giftId };
    }
    if (!activeEvent || !activeEvent.giftId || activeEvent.giftId !== args.giftId) return null;
    const existing = await ctx.db
      .query("weeklyStarEntries")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", activeEvent._id).eq("userId", args.senderId)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        giftCount: existing.giftCount + args.qty,
        totalCoins: existing.totalCoins + args.totalPrice,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("weeklyStarEntries", {
        eventId: activeEvent._id,
        userId: args.senderId,
        userName: args.senderName,
        userAvatarUrl: args.senderAvatarUrl,
        giftCount: args.qty,
        totalCoins: args.totalPrice,
        updatedAt: Date.now(),
      });
    }
    return activeEvent._id;
  },
});

// Send weekly star gift from room gift box
export const sendWeeklyStarGift = mutation({
  args: {
    eventId: v.id("weeklyStarEvents"),
    receiverId: v.id("users"),
    receiverName: v.string(),
    receiverAvatarUrl: v.optional(v.string()),
    giftCount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const event = await ctx.db.get(args.eventId);
    if (!event || !event.isActive) throw new Error("الفعالية غير نشطة");

    const giftPrice = event.giftPrice ?? 0;
    const totalCost = giftPrice * args.giftCount;

    const senderProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!senderProfile) throw new Error("الملف الشخصي غير موجود");
    if ((senderProfile.goldCoins ?? 0) < totalCost) throw new Error("رصيدك غير كافٍ");

    // Deduct coins from sender
    await ctx.db.patch(senderProfile._id, {
      goldCoins: (senderProfile.goldCoins ?? 0) - totalCost,
      totalCoinsSent: (senderProfile.totalCoinsSent ?? 0) + totalCost,
    });

    // Credit receiver
    const receiverProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.receiverId))
      .first();
    if (receiverProfile) {
      await ctx.db.patch(receiverProfile._id, {
        totalCoinsReceived: (receiverProfile.totalCoinsReceived ?? 0) + totalCost,
        coinsReceivedInRoom: (receiverProfile.coinsReceivedInRoom ?? 0) + totalCost,
      });
    }

    // Record in leaderboard
    const existing = await ctx.db
      .query("weeklyStarEntries")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", args.receiverId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        giftCount: existing.giftCount + args.giftCount,
        totalCoins: existing.totalCoins + totalCost,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("weeklyStarEntries", {
        eventId: args.eventId,
        userId: args.receiverId,
        userName: args.receiverName,
        userAvatarUrl: args.receiverAvatarUrl,
        giftCount: args.giftCount,
        totalCoins: totalCost,
        updatedAt: Date.now(),
      });
    }

    return { success: true, coinsSpent: totalCost };
  },
});


// Saki weekly-star configuration and reward flow.
export const getWeeklyStarSettings = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const current = await ctx.db.query("weeklyStarSettings").order("desc").first();
    if (!current) return null;
    const resolveGift = async (id: any) => {
      if (!id) return null;
      const g: any = await ctx.db.get(id);
      if (!g) return null;
      return { ...g, resolvedImageUrl: g.thumbnailUrl ?? g.imageUrl ?? (g.thumbnailStorageId ? await ctx.storage.getUrl(g.thumbnailStorageId) : null) };
    };
    const resolveStore = async (id: any) => {
      if (!id) return null;
      const item: any = await ctx.db.get(id);
      if (!item) return null;
      return { ...item, resolvedImageUrl: item.thumbnailUrl ?? item.imageUrl ?? item.mediaUrl ?? (item.thumbnailStorageId ? await ctx.storage.getUrl(item.thumbnailStorageId) : null) };
    };
    const resolvedBannerUrl = current.bannerUrl ?? (current.bannerStorageId ? await ctx.storage.getUrl(current.bannerStorageId) : null);
    return { ...current, bannerUrl: resolvedBannerUrl, currentGift: await resolveGift(current.currentGiftId), nextGift: await resolveGift(current.nextGiftId), frame: await resolveStore(current.frameItemId), entry: await resolveStore(current.entryItemId), checkedAt: now };
  },
});

export const getWeeklyStarAdminCatalog = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const p: any = userId ? await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique() : null;
    if (!p?.isSuperAdmin) return { allowed: false, gifts: [], frames: [], entries: [] };
    const gifts = await ctx.db.query("customGifts").collect();
    const stores = await ctx.db.query("storeItems").collect();
    const resolve = async (item: any) => item ? { _id: item._id, name: item.name, resolvedImageUrl: item.thumbnailUrl ?? item.imageUrl ?? item.mediaUrl ?? item.videoUrl ?? (item.thumbnailStorageId ? await ctx.storage.getUrl(item.thumbnailStorageId) : null) } : null;
    return { allowed: true, gifts: (await Promise.all(gifts.filter((x: any) => x.isActive !== false && x.category === "events").map(resolve))).filter(Boolean), frames: (await Promise.all(stores.filter((x: any) => x.type === "frame" && x.isActive !== false).map(resolve))).filter(Boolean), entries: (await Promise.all(stores.filter((x: any) => x.type === "entry" && x.isActive !== false).map(resolve))).filter(Boolean) };
  },
});

export const generateWeeklyStarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const p: any = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
    if (!p?.isSuperAdmin) throw new Error("هذه الإدارة للسوبر أدمن فقط");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveWeeklyStarSettings = mutation({
  args: {
    currentGiftId: v.optional(v.id("customGifts")), nextGiftId: v.optional(v.id("customGifts")), title: v.string(), titleIconUrl: v.optional(v.string()), frameItemId: v.optional(v.id("storeItems")), entryItemId: v.optional(v.id("storeItems")), aristocracyLevel: v.optional(v.number()), aristocracyDays: v.optional(v.number()), firstGold: v.number(), secondGold: v.number(), thirdGold: v.number(), titleDays: v.number(), bannerStorageId: v.optional(v.id("_storage")), bannerUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx); if (!userId) throw new Error("غير مصرح");
    const p: any = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique(); if (!p?.isSuperAdmin) throw new Error("هذه الإدارة للسوبر أدمن فقط");
    const now = Date.now();
    const weekKey = new Date(getWeekStartSunday(now)).toISOString().slice(0, 10);
    const old = await ctx.db.query("weeklyStarSettings").withIndex("by_week", (q: any) => q.eq("weekKey", weekKey)).unique();
    const data = { ...args, weekKey, updatedBy: userId, updatedAt: now };
    const settingsId = old ? (await ctx.db.patch(old._id, data), old._id) : await ctx.db.insert("weeklyStarSettings", data);
    if (args.currentGiftId) {
      const gift: any = await ctx.db.get(args.currentGiftId);
      const weekStart = getWeekStartSunday(now); const weekEnd = getWeekEndSunday(weekStart);
      const activeEvents = await ctx.db.query("weeklyStarEvents").withIndex("by_active", (q: any) => q.eq("isActive", true)).collect();
      let event: any = activeEvents.find((item: any) => item.weekStart === weekStart);
      for (const item of activeEvents) if (!event || item._id !== event._id) await ctx.db.patch(item._id, { isActive: false });
      const giftImageUrl = gift?.thumbnailUrl ?? gift?.imageUrl ?? (gift?.thumbnailStorageId ? await ctx.storage.getUrl(gift.thumbnailStorageId) : undefined);
      if (event) await ctx.db.patch(event._id, { isActive: true, weekEnd, endsAt: weekEnd, giftId: args.currentGiftId, giftName: gift?.name, giftImageUrl, giftPrice: gift?.price ?? gift?.coinPrice ?? 0 });
      else await ctx.db.insert("weeklyStarEvents", { weekStart, weekEnd, endsAt: weekEnd, giftId: args.currentGiftId, giftName: gift?.name, giftImageUrl, giftPrice: gift?.price ?? gift?.coinPrice ?? 0, isActive: true, rewardCoins: args.firstGold, createdAt: now });
    }
    return settingsId;
  },
});

export const publishWeeklyStarAwards = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx); if (!userId) throw new Error("غير مصرح");
    const p: any = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique(); if (!p?.isSuperAdmin) throw new Error("هذه الإدارة للسوبر أدمن فقط");
    const weekKey = new Date().toISOString().slice(0, 10); const settings: any = await ctx.db.query("weeklyStarSettings").withIndex("by_week", (q: any) => q.eq("weekKey", weekKey)).unique(); if (!settings) throw new Error("احفظ إعدادات الأسبوع أولًا");
    const event: any = await ctx.db.query("weeklyStarEvents").withIndex("by_active", (q: any) => q.eq("isActive", true)).first(); if (!event) throw new Error("أنشئ فعالية النجم الأسبوعي أولًا");
    const entries: any[] = await ctx.db.query("weeklyStarEntries").withIndex("by_event", (q: any) => q.eq("eventId", event._id)).collect(); entries.sort((a, b) => b.totalCoins - a.totalCoins);
    const gold = [settings.firstGold, settings.secondGold, settings.thirdGold];
    for (let i = 0; i < Math.min(3, entries.length); i++) { const row: any = entries[i]; const existing = await ctx.db.query("weeklyStarAwards").withIndex("by_week_user", (q: any) => q.eq("weekKey", weekKey).eq("userId", row.userId)).unique(); if (existing) continue; await ctx.db.insert("weeklyStarAwards", { weekKey, userId: row.userId, rank: i + 1, goldCoins: gold[i] ?? 0, giftId: settings.currentGiftId, giftQuantity: 1, frameItemId: settings.frameItemId, entryItemId: settings.entryItemId, aristocracyLevel: settings.aristocracyLevel, aristocracyDays: settings.aristocracyDays, title: settings.title, titleIconUrl: settings.titleIconUrl, createdAt: Date.now() }); }
    return { success: true, count: Math.min(3, entries.length), weekKey };
  },
});

export const getMyWeeklyStarAward = query({
  args: {}, handler: async (ctx) => { const userId = await getAuthUserId(ctx); if (!userId) return null; const weekKey = new Date().toISOString().slice(0, 10); return await ctx.db.query("weeklyStarAwards").withIndex("by_week_user", (q: any) => q.eq("weekKey", weekKey).eq("userId", userId)).unique(); },
});

export const claimMyWeeklyStarAward = mutation({
  args: {}, handler: async (ctx) => {
    const userId = await getAuthUserId(ctx); if (!userId) throw new Error("غير مصرح"); const p: any = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique(); const weekKey = new Date().toISOString().slice(0, 10); const award: any = await ctx.db.query("weeklyStarAwards").withIndex("by_week_user", (q: any) => q.eq("weekKey", weekKey).eq("userId", userId)).unique(); if (!award) throw new Error("لا توجد مكافأة مستحقة"); if (award.claimedAt) throw new Error("تم استلام المكافأة مسبقًا"); const now = Date.now();
    if (award.goldCoins > 0) await ctx.db.patch(p._id, { goldCoins: (p.goldCoins ?? 0) + award.goldCoins });
    if (award.giftId) { const old: any = await ctx.db.query("giftInventory").withIndex("by_user_and_gift", (q: any) => q.eq("userId", userId).eq("giftId", award.giftId)).unique(); if (old) await ctx.db.patch(old._id, { quantity: (old.quantity ?? 0) + 1, updatedAt: now }); else await ctx.db.insert("giftInventory", { userId, giftId: award.giftId, quantity: 1, giftName: (await ctx.db.get(award.giftId))?.name, createdAt: now, updatedAt: now }); }
    for (const [itemId, type] of [[award.frameItemId, "frame"], [award.entryItemId, "entry"]] as any) if (itemId) { const item: any = await ctx.db.get(itemId); if (item) await ctx.db.insert("userStoreItems", { userId, storeItemId: itemId, type, isActive: false, purchasedAt: now, createdAt: now, name: item.name, imageUrl: item.thumbnailUrl ?? item.imageUrl ?? item.mediaUrl }); }
    if (award.aristocracyLevel) await ctx.db.insert("aristocracyInventory", { ownerUserId: userId, level: award.aristocracyLevel, durationDays: Math.max(1, award.aristocracyDays ?? 3), source: "weekly_star", price: 0, status: "available", createdAt: now });
    if (award.title) await ctx.db.patch(p._id, { weeklyStarTitle: { title: award.title, iconUrl: award.titleIconUrl, expiresAt: now + 14 * 86400000 } });
    await ctx.db.patch(award._id, { claimedAt: now }); return { success: true };
  },
});
