// @ts-nocheck
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const DEFAULT_VIP_PRICES: Record<number, number> = {
  1: 1_000_000, 2: 2_000_000, 3: 5_000_000, 4: 10_000_000,
  5: 13_000_000, 6: 20_000_000, 7: 30_000_000, 8: 50_000_000,
};

export const getVipLevels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vipLevels").order("asc").collect();
  },
});

export const getVipLevel = query({
  args: { level: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", args.level)).first();
  },
});

export const upsertVipLevel = mutation({
  args: {
    level: v.number(),
    name: v.string(),
    price: v.optional(v.number()),
    durationDays: v.optional(v.number()),
    badgeStorageId: v.optional(v.id("_storage")),
    frameStorageId: v.optional(v.id("_storage")),
    chatBubbleStorageId: v.optional(v.id("_storage")),
    titleStorageId: v.optional(v.id("_storage")),
    entryStorageId: v.optional(v.id("_storage")),
    entryThumbnailStorageId: v.optional(v.id("_storage")),
    badgeMediaType: v.optional(v.string()),
    frameMediaType: v.optional(v.string()),
    titleMediaType: v.optional(v.string()),
    entryMediaType: v.optional(v.string()),
    hasShinyName: v.boolean(),
    hasShinyFrame: v.boolean(),
    hasCustomSakiId: v.boolean(),
    hasGifAvatar: v.boolean(),
    hasCustomEntry: v.boolean(),
    hasCustomMomentCard: v.boolean(),
    canHideLastSeen: v.boolean(),
    hasVoiceEffects: v.boolean(),
    canHideRoomPresence: v.optional(v.boolean()),
    canPrivateProfile: v.optional(v.boolean()),
    dailyCoinsReward: v.number(),
    canOwnVipRoom: v.boolean(),
    maxVipRoomSeats: v.optional(v.number()),
    nameColor: v.string(),
    frameColor: v.string(),
    voiceWaveColor: v.string(),
    chatNameColor: v.optional(v.string()),
    hasRoyalSeat: v.optional(v.boolean()),
    canKickProtection: v.optional(v.boolean()),
    canBanProtection: v.optional(v.boolean()),
    canMuteProtection: v.optional(v.boolean()),
    seatOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile?.isSuperAdmin) throw new Error("يجب أن تكون مشرفًا");

    const existing = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", args.level)).first();

    let badgeUrl = existing?.badgeUrl;
    let frameUrl = existing?.frameUrl;
    let chatBubbleUrl = existing?.chatBubbleUrl;
    let titleUrl = existing?.titleUrl;
    let entryUrl = existing?.entryUrl;
    let entryThumbnailUrl = existing?.entryThumbnailUrl;

    if (args.badgeStorageId) badgeUrl = (await ctx.storage.getUrl(args.badgeStorageId)) ?? undefined;
    if (args.frameStorageId) frameUrl = (await ctx.storage.getUrl(args.frameStorageId)) ?? undefined;
    if (args.chatBubbleStorageId) chatBubbleUrl = (await ctx.storage.getUrl(args.chatBubbleStorageId)) ?? undefined;
    if (args.titleStorageId) titleUrl = (await ctx.storage.getUrl(args.titleStorageId)) ?? undefined;
    if (args.entryStorageId) entryUrl = (await ctx.storage.getUrl(args.entryStorageId)) ?? undefined;
    if (args.entryThumbnailStorageId) entryThumbnailUrl = (await ctx.storage.getUrl(args.entryThumbnailStorageId)) ?? undefined;

    const badgeMediaType = args.badgeMediaType ?? existing?.badgeMediaType;
    const frameMediaType = args.frameMediaType ?? existing?.frameMediaType;
    const entryMediaType = args.entryMediaType ?? existing?.entryMediaType;

    const data: any = {
      level: args.level, name: args.name, price: args.price, durationDays: args.durationDays,
      badgeStorageId: args.badgeStorageId ?? existing?.badgeStorageId, badgeUrl, badgeMediaType,
      frameStorageId: args.frameStorageId ?? existing?.frameStorageId, frameUrl, frameMediaType,
      chatBubbleStorageId: args.chatBubbleStorageId ?? existing?.chatBubbleStorageId, chatBubbleUrl,
      titleStorageId: args.titleStorageId ?? existing?.titleStorageId, titleUrl,
      titleMediaType: args.titleMediaType ?? existing?.titleMediaType,
      entryStorageId: args.entryStorageId ?? existing?.entryStorageId, entryUrl, entryMediaType,
      entryThumbnailStorageId: args.entryThumbnailStorageId ?? existing?.entryThumbnailStorageId, entryThumbnailUrl,
      hasShinyName: args.hasShinyName, hasShinyFrame: args.hasShinyFrame,
      hasCustomSakiId: args.hasCustomSakiId, hasGifAvatar: args.hasGifAvatar,
      hasCustomEntry: args.hasCustomEntry, hasCustomMomentCard: args.hasCustomMomentCard,
      canHideLastSeen: args.canHideLastSeen, hasVoiceEffects: args.hasVoiceEffects,
      canHideRoomPresence: args.canHideRoomPresence, canPrivateProfile: args.canPrivateProfile,
      dailyCoinsReward: args.dailyCoinsReward, canOwnVipRoom: args.canOwnVipRoom,
      maxVipRoomSeats: args.maxVipRoomSeats, nameColor: args.nameColor,
      frameColor: args.frameColor, voiceWaveColor: args.voiceWaveColor, chatNameColor: args.chatNameColor,
      hasRoyalSeat: args.hasRoyalSeat, canKickProtection: args.canKickProtection,
      canBanProtection: args.canBanProtection, canMuteProtection: args.canMuteProtection, seatOrder: args.seatOrder,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      if (frameUrl && frameUrl !== existing.frameUrl) await _syncVipFrame(ctx, args.level, frameUrl, frameMediaType, userId);
      if (entryUrl && entryUrl !== existing.entryUrl) await _syncVipEntry(ctx, args.level, entryUrl, entryMediaType, entryThumbnailUrl, userId);
      return existing._id;
    }
    const id = await ctx.db.insert("vipLevels", { ...data, createdAt: Date.now() });
    if (frameUrl) await _syncVipFrame(ctx, args.level, frameUrl, frameMediaType, userId);
    if (entryUrl) await _syncVipEntry(ctx, args.level, entryUrl, entryMediaType, entryThumbnailUrl, userId);
    return id;
  },
});

async function _syncVipFrame(ctx: any, level: number, frameUrl: string, mediaType: string | undefined, userId: any) {
  const all = await ctx.db.query("storeItems").withIndex("by_type", (q: any) => q.eq("type", "frame")).collect();
  const name = `إطار VIP${level}`;
  const ex = all.find((i: any) => i.name === name);
  if (ex) {
    await ctx.db.patch(ex._id, { mediaUrl: frameUrl, isVipFrame: true, vipFrameMinLevel: level, mediaType });
  } else {
    await ctx.db.insert("storeItems", {
      type: "frame", name, price: 0, mediaUrl: frameUrl, isActive: true,
      frameScale: 1.3, isVipFrame: true, vipFrameMinLevel: level, mediaType,
      createdBy: userId, createdAt: Date.now(),
    });
  }
}

async function _syncVipEntry(ctx: any, level: number, entryUrl: string, mediaType: string | undefined, thumbnailUrl: string | undefined, userId: any) {
  const all = await ctx.db.query("storeItems").withIndex("by_type", (q: any) => q.eq("type", "entry")).collect();
  const name = `دخولية VIP${level}`;
  const ex = all.find((i: any) => i.name === name);
  if (ex) {
    await ctx.db.patch(ex._id, { mediaUrl: entryUrl, isVipEntry: true, vipEntryMinLevel: level, mediaType, thumbnailUrl });
  } else {
    await ctx.db.insert("storeItems", {
      type: "entry", name, price: 0, mediaUrl: entryUrl, isActive: true,
      isVipEntry: true, vipEntryMinLevel: level, mediaType, thumbnailUrl,
      createdBy: userId, createdAt: Date.now(),
    });
  }
}

export const deleteVipLevel = mutation({
  args: { level: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile?.isSuperAdmin) throw new Error("يجب أن تكون مشرفًا");
    const existing = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", args.level)).first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const purchaseVip = mutation({
  args: { vipLevel: v.number(), durationDays: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    const currentLevel = profile.vipLevel ?? 0;
    if (profile.isVip && currentLevel > args.vipLevel)
      throw new Error(`لديك بالفعل VIP${currentLevel} وهو أعلى`);
    if (profile.isVip && currentLevel === args.vipLevel)
      throw new Error(`لديك بالفعل VIP${args.vipLevel}`);
    const vipLevelConfig = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", args.vipLevel)).first();
    if (!vipLevelConfig) throw new Error("مستوى VIP غير موجود");
    const price = vipLevelConfig?.price ?? DEFAULT_VIP_PRICES[args.vipLevel] ?? 0;
    const coins = profile.goldCoins ?? 0;
    if (coins < price) throw new Error(`رصيدك غير كافٍ. تحتاج ${price.toLocaleString()} عملة`);
    const now = Date.now();
    const expiresAt = now + args.durationDays * 24 * 60 * 60 * 1000;
    await ctx.db.patch(profile._id, {
      goldCoins: coins - price, isVip: true,
      vipLevel: args.vipLevel, vipExpiresAt: expiresAt,
    });

    if (vipLevelConfig.frameUrl) {
      await _addFrameToBag(ctx, userId, args.vipLevel, vipLevelConfig.frameUrl, vipLevelConfig.frameMediaType, expiresAt, now);
    }
    if (vipLevelConfig.entryUrl) {
      await _addEntryToBag(ctx, userId, args.vipLevel, vipLevelConfig.entryUrl, vipLevelConfig.entryMediaType, vipLevelConfig.entryThumbnailUrl, expiresAt, now);
    }

    await ctx.db.insert("notifications", {
      userId, type: "system",
      title: `🎉 مرحباً بك في ${vipLevelConfig.name}`,
      body: `تم تفعيل ${vipLevelConfig.name} لمدة ${args.durationDays} يوم`,
      isRead: false, createdAt: now,
    });
    return { success: true };
  },
});

async function _addFrameToBag(ctx: any, userId: any, level: number, frameUrl: string, mediaType: string | undefined, expiresAt: number, now: number) {
  const frameName = `إطار VIP${level}`;
  const allFrames = await ctx.db.query("storeItems").withIndex("by_type", (q: any) => q.eq("type", "frame")).collect();
  let frameItem = allFrames.find((i: any) => i.name === frameName);
  if (!frameItem) {
    const newId = await ctx.db.insert("storeItems", {
      type: "frame", name: frameName, price: 0,
      mediaUrl: frameUrl, isActive: true, frameScale: 1.3,
      isVipFrame: true, vipFrameMinLevel: level, mediaType,
      createdBy: userId, createdAt: now,
    });
    frameItem = await ctx.db.get(newId);
  }
  if (frameItem) {
    const userFrames = await ctx.db.query("userStoreItems")
      .withIndex("by_user_and_type", (q: any) => q.eq("userId", userId).eq("type", "frame"))
      .collect();
    const alreadyHas = userFrames.some((i: any) => i.storeItemId === frameItem._id);
    if (!alreadyHas) {
      await ctx.db.insert("userStoreItems", {
        userId, storeItemId: frameItem._id, type: "frame",
        purchasedAt: now, expiresAt, isActive: false,
      });
    }
  }
}

async function _addEntryToBag(ctx: any, userId: any, level: number, entryUrl: string, mediaType: string | undefined, thumbnailUrl: string | undefined, expiresAt: number, now: number) {
  const entryName = `دخولية VIP${level}`;
  const allEntries = await ctx.db.query("storeItems").withIndex("by_type", (q: any) => q.eq("type", "entry")).collect();
  let entryItem = allEntries.find((i: any) => i.name === entryName);
  if (!entryItem) {
    const newId = await ctx.db.insert("storeItems", {
      type: "entry", name: entryName, price: 0,
      mediaUrl: entryUrl, isActive: true,
      isVipEntry: true, vipEntryMinLevel: level, mediaType, thumbnailUrl,
      createdBy: userId, createdAt: now,
    });
    entryItem = await ctx.db.get(newId);
  }
  if (entryItem) {
    const userEntries = await ctx.db.query("userStoreItems")
      .withIndex("by_user_and_type", (q: any) => q.eq("userId", userId).eq("type", "entry"))
      .collect();
    const alreadyHas = userEntries.some((i: any) => i.storeItemId === entryItem._id);
    if (!alreadyHas) {
      await ctx.db.insert("userStoreItems", {
        userId, storeItemId: entryItem._id, type: "entry",
        purchasedAt: now, expiresAt, isActive: false,
      });
    }
  }
}

export const upgradeUserVip = mutation({
  args: { targetSakiId: v.string(), vipLevel: v.number(), durationDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const agentProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!agentProfile?.isAgent && !agentProfile?.isSuperAdmin) throw new Error("يجب أن تكون وكيلاً");
    const targetProfile = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId)).first();
    if (!targetProfile) throw new Error("المستخدم غير موجود");
    const vipLevel = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", args.vipLevel)).first();
    if (!vipLevel) throw new Error("مستوى VIP غير موجود");
    const now = Date.now();
    const expiresAt = args.durationDays ? now + args.durationDays * 24 * 60 * 60 * 1000 : null;
    await ctx.db.patch(targetProfile._id, { isVip: true, vipLevel: args.vipLevel, vipExpiresAt: expiresAt ?? undefined });

    const exp = expiresAt ?? now + 365 * 86400000;
    if (vipLevel.frameUrl) {
      await _addFrameToBag(ctx, targetProfile.userId, args.vipLevel, vipLevel.frameUrl, vipLevel.frameMediaType, exp, now);
    }
    if (vipLevel.entryUrl) {
      await _addEntryToBag(ctx, targetProfile.userId, args.vipLevel, vipLevel.entryUrl, vipLevel.entryMediaType, vipLevel.entryThumbnailUrl, exp, now);
    }

    await ctx.db.insert("notifications", {
      userId: targetProfile.userId, type: "system",
      title: `🎉 تم ترقيتك إلى ${vipLevel.name}`,
      body: `تهانينا! لقد تم ترقيتك إلى ${vipLevel.name}`,
      isRead: false, createdAt: now,
    });
    return { success: true };
  },
});

export const generateVipBadgeUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile?.isSuperAdmin) throw new Error("يجب أن تكون مشرفًا");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getMyVipInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile?.isVip || !profile.vipLevel) return null;
    const vipLevel = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", profile.vipLevel!)).first();
    return {
      level: profile.vipLevel,
      expiresAt: profile.vipExpiresAt,
      config: vipLevel,
      lastVipDailyClaim: (profile as any).lastVipDailyClaim ?? 0,
    };
  },
});

export const getVipConfigForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.userId)).unique();
    if (!profile?.isVip || !profile.vipLevel) return null;
    const vipLevel = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", profile.vipLevel!)).first();
    return vipLevel ?? null;
  },
});

export const claimDailyVipReward = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile?.isVip || !profile.vipLevel) throw new Error("يجب أن تكون عضو VIP");
    const now = Date.now();
    const lastClaim = (profile as any).lastVipDailyClaim ?? 0;
    const msIn24h = 24 * 60 * 60 * 1000;
    if (now - lastClaim < msIn24h) {
      const rem = lastClaim + msIn24h - now;
      const h = Math.floor(rem / 3600000);
      const m = Math.floor((rem % 3600000) / 60000);
      throw new Error(`مرة واحدة كل 24 ساعة. المتبقي: ${h}س ${m}د`);
    }
    const vipLevel = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", profile.vipLevel!)).first();
    if (!vipLevel) throw new Error("مستوى VIP غير موجود");
    const reward = vipLevel.dailyCoinsReward ?? 0;
    await ctx.db.patch(profile._id, {
      goldCoins: (profile.goldCoins ?? 0) + reward,
      lastVipDailyClaim: now,
    });
    return { reward, newBalance: (profile.goldCoins ?? 0) + reward };
  },
});

export const toggleHideRoomPresence = mutation({
  args: { hide: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    if (!profile.isVip || !profile.vipLevel) throw new Error("هذه الميزة تتطلب VIP");
    const vipLevel = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", profile.vipLevel!)).first();
    if (!vipLevel?.canHideRoomPresence) throw new Error("مستواك لا يدعم هذه الميزة");
    await ctx.db.patch(profile._id, { hideRoomPresence: args.hide });
  },
});

export const togglePrivateProfile = mutation({
  args: { isPrivate: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    if (!profile.isVip || !profile.vipLevel) throw new Error("هذه الميزة تتطلب VIP");
    const vipLevel = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", profile.vipLevel!)).first();
    if (!vipLevel?.canPrivateProfile) throw new Error("مستواك لا يدعم هذه الميزة");
    await ctx.db.patch(profile._id, { isPrivateProfile: args.isPrivate });
  },
});
