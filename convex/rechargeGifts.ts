import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const sourceValidator = v.union(v.literal("google_play"), v.literal("agent"));

async function currentProfile(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!profile) throw new Error("الملف الشخصي غير موجود");
  return { userId, profile };
}

async function resolveStoreItem(ctx: any, item: any) {
  if (!item) return null;
  const mediaUrl = item.thumbnailUrl ?? item.imageUrl ?? item.mediaUrl ?? (item.thumbnailStorageId ? await ctx.storage.getUrl(item.thumbnailStorageId) : null) ?? (item.mediaStorageId ? await ctx.storage.getUrl(item.mediaStorageId) : null);
  return { _id: item._id, name: item.name, type: item.type, imageUrl: mediaUrl };
}

async function resolveGift(ctx: any, gift: any) {
  if (!gift) return null;
  const imageUrl = gift.thumbnailUrl ?? gift.imageUrl ?? gift.videoUrl ?? (gift.thumbnailStorageId ? await ctx.storage.getUrl(gift.thumbnailStorageId) : null) ?? (gift.imageStorageId ? await ctx.storage.getUrl(gift.imageStorageId) : null);
  return { _id: gift._id, name: gift.name, imageUrl };
}

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("rechargeGiftSettings").order("desc").first();
    if (!settings) return null;
    const bannerUrl = settings.bannerUrl ?? (settings.bannerStorageId ? await ctx.storage.getUrl(settings.bannerStorageId) : null);
    return { ...settings, bannerUrl };
  },
});

export const generateBannerUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const { profile } = await currentProfile(ctx);
    if (!profile.isSuperAdmin) throw new Error("هذه الميزة للسوبر أدمن فقط");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveBanner = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const { userId, profile } = await currentProfile(ctx);
    if (!profile.isSuperAdmin) throw new Error("هذه الميزة للسوبر أدمن فقط");
    const bannerUrl = await ctx.storage.getUrl(args.storageId);
    if (!bannerUrl) throw new Error("تعذر حفظ صورة البنر");
    const existing = await ctx.db.query("rechargeGiftSettings").order("desc").first();
    const patch = { bannerStorageId: args.storageId, bannerUrl, updatedBy: userId, updatedAt: Date.now() };
    if (existing) { await ctx.db.patch(existing._id, patch); return existing._id; }
    return await ctx.db.insert("rechargeGiftSettings", patch);
  },
});

export const getAdminCatalog = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await currentProfile(ctx);
    if (!profile.isSuperAdmin) return { allowed: false, frames: [], entries: [], gifts: [], ranks: [] };
    const storeItems = (await ctx.db.query("storeItems").collect()).filter((item: any) => item.isActive);
    const gifts = (await ctx.db.query("customGifts").collect()).filter((gift: any) => gift.isActive !== false);
    const frames = await Promise.all(storeItems.filter((item: any) => item.type === "frame").map((item: any) => resolveStoreItem(ctx, item)));
    const entries = await Promise.all(storeItems.filter((item: any) => item.type === "entry").map((item: any) => resolveStoreItem(ctx, item)));
    const resolvedGifts = await Promise.all(gifts.map((gift: any) => resolveGift(ctx, gift)));
    const ranks = (await ctx.db.query("aristocracyLevels").collect()).sort((a: any, b: any) => a.level - b.level).map((rank: any) => ({ level: rank.level, name: rank.nameAr ?? rank.name ?? `رتبة ${rank.level}`, iconUrl: rank.iconUrl ?? rank.icon ?? null }));
    return { allowed: true, frames: frames.filter(Boolean), entries: entries.filter(Boolean), gifts: resolvedGifts.filter(Boolean), ranks };
  },
});

export const listPackages = query({
  args: {},
  handler: async (ctx) => {
    const packages = await ctx.db.query("rechargeGiftPackages").withIndex("by_active", (q: any) => q.eq("isActive", true)).collect();
    return await Promise.all(packages.sort((a: any, b: any) => a.minimumDollars - b.minimumDollars).map(async (pkg: any) => ({
      ...pkg,
      frame: await resolveStoreItem(ctx, pkg.frameItemId ? await ctx.db.get(pkg.frameItemId) : null),
      entry: await resolveStoreItem(ctx, pkg.entryItemId ? await ctx.db.get(pkg.entryItemId) : null),
      gift: await resolveGift(ctx, pkg.giftId ? await ctx.db.get(pkg.giftId) : null),
    })));
  },
});

export const listAdminPackages = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await currentProfile(ctx);
    if (!profile.isSuperAdmin) return [];
    const packages = await ctx.db.query("rechargeGiftPackages").order("desc").collect();
    return await Promise.all(packages.map(async (pkg: any) => ({
      ...pkg,
      frame: await resolveStoreItem(ctx, pkg.frameItemId ? await ctx.db.get(pkg.frameItemId) : null),
      entry: await resolveStoreItem(ctx, pkg.entryItemId ? await ctx.db.get(pkg.entryItemId) : null),
      gift: await resolveGift(ctx, pkg.giftId ? await ctx.db.get(pkg.giftId) : null),
    })));
  },
});

export const getMyEligibility = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await currentProfile(ctx);
    const googlePlay = await ctx.db.query("googlePlayPurchases").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    const credits = await ctx.db.query("rechargeGiftCredits").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    const googlePlayDollars = googlePlay.reduce((sum: number, item: any) => sum + Math.max(0, item.dollars ?? 0), 0);
    const agentDollars = credits.filter((credit: any) => credit.source === "agent").reduce((sum: number, item: any) => sum + Math.max(0, item.dollars ?? 0), 0);
    const claims = await ctx.db.query("rechargeGiftClaims").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    return { googlePlayDollars, agentDollars, claimedPackageIds: claims.map((claim: any) => claim.packageId) };
  },
});

export const getUserRechargeTitle = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", args.userId)).unique();
    if (!profile || profile.isPrivateProfile) return null;
    const claims = await ctx.db.query("rechargeGiftClaims").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).order("desc").collect();
    for (const claim of claims) {
      const pkg: any = await ctx.db.get(claim.packageId);
      const title = pkg?.customTitle?.trim();
      if (!pkg || !title) continue;
      const frame = pkg.frameItemId ? await ctx.db.get(pkg.frameItemId) : null;
      const entry = pkg.entryItemId ? await ctx.db.get(pkg.entryItemId) : null;
      const gift = pkg.giftId ? await ctx.db.get(pkg.giftId) : null;
      const iconSource: any = frame ?? entry ?? gift;
      const iconUrl = iconSource ? (iconSource.thumbnailUrl ?? iconSource.imageUrl ?? iconSource.mediaUrl ?? (iconSource.thumbnailStorageId ? await ctx.storage.getUrl(iconSource.thumbnailStorageId) : null) ?? (iconSource.imageStorageId ? await ctx.storage.getUrl(iconSource.imageStorageId) : null)) : null;
      return { title, iconUrl, packageName: pkg.name, claimedAt: claim.claimedAt };
    }
    return null;
  },
});

export const savePackage = mutation({
  args: {
    packageId: v.optional(v.id("rechargeGiftPackages")), name: v.string(), minimumDollars: v.number(), acceptedSources: v.array(sourceValidator),
    frameItemId: v.optional(v.id("storeItems")), entryItemId: v.optional(v.id("storeItems")), giftId: v.optional(v.id("customGifts")), giftQuantity: v.optional(v.number()),
    aristocracyLevel: v.optional(v.number()), aristocracyDays: v.optional(v.number()), proLevel: v.optional(v.number()), proDays: v.optional(v.number()), customTitle: v.optional(v.string()), isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, profile } = await currentProfile(ctx);
    if (!profile.isSuperAdmin) throw new Error("هذه الإدارة للسوبر أدمن فقط");
    if (args.minimumDollars <= 0) throw new Error("قيمة الشحن بالدولار يجب أن تكون أكبر من صفر");
    if (!args.acceptedSources.length) throw new Error("اختر مصدر شحن واحدًا على الأقل");
    const now = Date.now();
    const data = { name: args.name.trim() || `هدية شحن $${args.minimumDollars}`, minimumDollars: args.minimumDollars, acceptedSources: args.acceptedSources, frameItemId: args.frameItemId, entryItemId: args.entryItemId, giftId: args.giftId, giftQuantity: args.giftQuantity ?? 1, aristocracyLevel: args.aristocracyLevel, aristocracyDays: args.aristocracyDays, proLevel: args.proLevel, proDays: args.proDays, customTitle: args.customTitle?.trim() || undefined, isActive: args.isActive, updatedAt: now };
    if (args.packageId) { await ctx.db.patch(args.packageId, data); return args.packageId; }
    return await ctx.db.insert("rechargeGiftPackages", { ...data, createdBy: userId, createdAt: now });
  },
});

export const recordAgentCredit = mutation({
  args: { targetSakiId: v.string(), dollars: v.number(), reference: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userId, profile } = await currentProfile(ctx);
    if (!profile.isAgent && !profile.isSuperAdmin) throw new Error("فقط وكيل شحن معتمد أو سوبر أدمن يمكنه تسجيل الشحن");
    if (args.dollars <= 0) throw new Error("قيمة الشحن بالدولار يجب أن تكون أكبر من صفر");
    const target = await ctx.db.query("profiles").withIndex("by_sakiId", (q: any) => q.eq("sakiId", args.targetSakiId)).unique();
    if (!target) throw new Error("المستخدم غير موجود");
    await ctx.db.insert("rechargeGiftCredits", { userId: target.userId, source: "agent", dollars: args.dollars, externalReference: args.reference, recordedBy: userId, createdAt: Date.now() });
    return { success: true, targetName: target.name };
  },
});

export const claimPackage = mutation({
  args: { packageId: v.id("rechargeGiftPackages") },
  handler: async (ctx, args) => {
    const { userId, profile } = await currentProfile(ctx);
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg?.isActive) throw new Error("حزمة الشحن غير متاحة");
    const prior = await ctx.db.query("rechargeGiftClaims").withIndex("by_package_and_user", (q: any) => q.eq("packageId", args.packageId).eq("userId", userId)).unique();
    if (prior) throw new Error("تم استلام هذه المكافأة مسبقًا");
    let verifiedDollars = 0;
    if (pkg.acceptedSources.includes("google_play")) {
      const purchases = await ctx.db.query("googlePlayPurchases").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      verifiedDollars += purchases.reduce((sum: number, item: any) => sum + Math.max(0, item.dollars ?? 0), 0);
    }
    if (pkg.acceptedSources.includes("agent")) {
      const credits = await ctx.db.query("rechargeGiftCredits").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      verifiedDollars += credits.filter((credit: any) => credit.source === "agent").reduce((sum: number, credit: any) => sum + Math.max(0, credit.dollars ?? 0), 0);
    }
    if (verifiedDollars < pkg.minimumDollars) throw new Error(`أكمل شحن $${pkg.minimumDollars} أولاً`);
    const now = Date.now();
    const duration = (days?: number) => days && days > 0 ? now + days * 86400000 : undefined;
    for (const [itemId, type, days] of [[pkg.frameItemId, "frame", pkg.proDays], [pkg.entryItemId, "entry", pkg.proDays]] as const) {
      if (itemId) {
        const item = await ctx.db.get(itemId);
        if (item) await ctx.db.insert("userStoreItems", { userId, storeItemId: itemId, type, isActive: false, expiresAt: duration(days), purchasedAt: now, createdAt: now, name: item.name, imageUrl: item.thumbnailUrl ?? item.imageUrl ?? item.mediaUrl });
      }
    }
    if (pkg.giftId) {
      const gift = await ctx.db.get(pkg.giftId);
      const existing = await ctx.db.query("giftInventory").withIndex("by_user_and_gift", (q: any) => q.eq("userId", userId).eq("giftId", pkg.giftId)).unique();
      if (existing) await ctx.db.patch(existing._id, { quantity: existing.quantity + (pkg.giftQuantity ?? 1), updatedAt: now });
      else await ctx.db.insert("giftInventory", { userId, giftId: pkg.giftId, giftName: gift?.name, quantity: pkg.giftQuantity ?? 1, createdAt: now, updatedAt: now });
    }
    const profilePatch: any = {};
    if (pkg.proLevel) { profilePatch.isPro = true; profilePatch.proLevel = Math.max(profile.proLevel ?? 0, pkg.proLevel); profilePatch.proExpiresAt = Math.max(profile.proExpiresAt ?? 0, duration(pkg.proDays) ?? 0); }
    if (pkg.aristocracyLevel) {
      await ctx.db.insert("aristocracyInventory", {
        ownerUserId: userId,
        level: pkg.aristocracyLevel,
        durationDays: Math.max(1, pkg.aristocracyDays ?? 3),
        source: "recharge_gift",
        price: 0,
        status: "available",
        createdAt: now,
      });
    }
    if (Object.keys(profilePatch).length) await ctx.db.patch(profile._id, profilePatch);
    await ctx.db.insert("rechargeGiftClaims", { packageId: args.packageId, userId, claimedAt: now, verifiedDollars });
    await ctx.db.insert("notifications", { userId, type: "gift", title: "تم استلام هدية الشحن", body: `تمت إضافة مكافآت ${pkg.name} إلى حسابك.`, isRead: false, createdAt: now });
    return { success: true, customTitle: pkg.customTitle };
  },
});
