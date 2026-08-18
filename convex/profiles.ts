// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateSakiId(base: number): string {
  return String(base).padStart(9, "0");
}

const VIP_COST = 2000000;

export const createProfile = mutation({
  args: {
    name: v.string(),
    country: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const existing = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (existing) return existing._id;
    const allProfiles = await ctx.db.query("profiles").collect();
    const baseId = 965478132 + allProfiles.length;
    const sakiId = generateSakiId(baseId);

    // توليد كود دعوة فريد
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let myCode = "SK";
    for (let i = 0; i < 6; i++) myCode += chars[Math.floor(Math.random() * chars.length)];
    myCode += sakiId.slice(-2);

    const profileId = await ctx.db.insert("profiles", {
      userId, name: args.name, sakiId, country: args.country, gender: args.gender,
      avatarUrl: args.avatarUrl,
      avatarStorageId: args.avatarStorageId,
      goldCoins: 5000, isActive: true, isVip: false,
      isSuperAdmin: false, isAgent: false, referralCode: myCode, createdAt: Date.now(),
    });

    // تطبيق كود الدعوة إذا أُدخل
    if (args.referralCode) {
      const referrerProfile = await ctx.db
        .query("profiles")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode!.toUpperCase()))
        .unique();

      if (referrerProfile && referrerProfile.userId !== userId) {
        // تسجيل الدعوة في الملف الشخصي
        await ctx.db.patch(profileId, {
          referredByCode: args.referralCode.toUpperCase(),
          referredByUserId: referrerProfile.userId,
        });

        // إضافة سجل الدعوة
        await ctx.db.insert("referrals", {
          referrerId: referrerProfile.userId,
          referredId: userId,
          referralCode: args.referralCode.toUpperCase(),
          status: "active",
          chargeEarnings: 0,
          createdAt: Date.now(),
        });

        // تحديث عداد الدعوات للداعي
        const currentCount = referrerProfile.referralCount ?? 0;
        const newCount = currentCount + 1;
        await ctx.db.patch(referrerProfile._id, { referralCount: newCount });

        const REFERRAL_BONUS_COINS = 100000;
        const REFERRAL_MILESTONE = 10;

        // التحقق من الوصول لـ 10 دعوات
        if (newCount === REFERRAL_MILESTONE) {
          // مكافأة الداعي
          await ctx.db.patch(referrerProfile._id, {
            goldCoins: (referrerProfile.goldCoins ?? 0) + REFERRAL_BONUS_COINS,
            isSakiAmbassador: true,
            ambassadorSince: Date.now(),
          });
          // إطار السفير في حقيبة الداعي
          await ctx.db.insert("userStoreItems", {
            userId: referrerProfile.userId,
            type: "frame",
            name: "إطار سفير ساكي",
            imageUrl: "ambassador_frame",
            isActive: false,
            purchasedAt: Date.now(),
          });
          // إشعار للداعي
          await ctx.db.insert("notifications", {
            userId: referrerProfile.userId,
            type: "ambassador",
            title: "🌟 مبروك! أصبحت سفير ساكي",
            body: `وصلت إلى ${REFERRAL_MILESTONE} دعوات! حصلت على ${REFERRAL_BONUS_COINS.toLocaleString()} عملة ذهبية + لقب سفير ساكي + إطار حصري`,
            isRead: false,
            createdAt: Date.now(),
          });
          // مكافأة المدعو أيضاً
          await ctx.db.patch(profileId, {
            goldCoins: (5000) + REFERRAL_BONUS_COINS,
          });
          await ctx.db.insert("notifications", {
            userId,
            type: "referral_bonus",
            title: "🎁 مكافأة الدعوة",
            body: `حصلت على ${REFERRAL_BONUS_COINS.toLocaleString()} عملة ذهبية كمكافأة دعوة!`,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    return profileId;
  },
});

export const getChatBubbleUrl = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.userId)).unique();
    if (!profile) return null;
    // 1. فقاعة مفعّلة من الحقيبة (أولوية قصوى)
    if (!profile.activeBubbleId) {
      // 2. فقاعة VIP تلقائية
      if (profile.isVip && profile.vipLevel) {
        const vl = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", profile.vipLevel!)).first();
        if (vl?.chatBubbleStorageId) {
          const f = await ctx.storage.getUrl(vl.chatBubbleStorageId);
          if (f) return f;
        }
        return vl?.chatBubbleUrl ?? null;
      }
      return null;
    }
    const bubbleIdStr = String(profile.activeBubbleId);
    if (bubbleIdStr.startsWith("aristo_")) {
      const level = parseInt(bubbleIdStr.split("_")[1]);
      if (level > 0) {
        const ac = await ctx.db.query("aristocracyLevels").withIndex("by_level", (q) => q.eq("level", level)).first();
        if (ac?.chatBubbleStorageId) {
          const fresh = await ctx.storage.getUrl(ac.chatBubbleStorageId);
          if (fresh) return fresh;
        }
        return ac?.chatBubbleUrl ?? null;
      }
    } else {
      try {
        const bi = await ctx.db.get(profile.activeBubbleId as any);
        if (bi) {
          if (bi.mediaStorageId) {
            const fresh = await ctx.storage.getUrl(bi.mediaStorageId);
            if (fresh) return fresh;
          }
          return bi.mediaUrl ?? null;
        }
      } catch (_) {}
    }
    return null;
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profileCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(1);
    const profile = profileCandidates[0];
    if (!profile) return null;
    let avatarUrl = profile.avatarUrl;
    if (profile.avatarStorageId) {
      const freshAvatarUrl = await ctx.storage.getUrl(profile.avatarStorageId);
      if (freshAvatarUrl) avatarUrl = freshAvatarUrl;
    }
    let coverUrl = profile.coverUrl;
    if (profile.coverStorageId) {
      const freshCoverUrl = await ctx.storage.getUrl(profile.coverStorageId);
      if (freshCoverUrl) coverUrl = freshCoverUrl;
    }
    const bgId = (profile as any).profileBgStorageId;
    const profileBgUrl = bgId ? (await ctx.storage.getUrl(bgId) ?? undefined) : (profile as any).profileBgUrl;
    let sakiIdIconUrl = (profile as any).sakiIdIconUrl;
    const iconStorageId = (profile as any).sakiIdIconStorageId;
    if (iconStorageId && !sakiIdIconUrl) sakiIdIconUrl = await ctx.storage.getUrl(iconStorageId) ?? undefined;
    // إعادة حساب adminTitleIconUrl من storage
    let adminTitleIconUrl = (profile as any).adminTitleIconUrl;
    const adminTitleIconStorageId = (profile as any).adminTitleIconStorageId;
    if (adminTitleIconStorageId) {
      const freshUrl = await ctx.storage.getUrl(adminTitleIconStorageId);
      if (freshUrl) adminTitleIconUrl = freshUrl;
    }
    return { ...profile, avatarUrl, coverUrl, profileBgUrl, sakiIdIconUrl, adminTitleIconUrl };
  },
});

export const getProfileByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profileCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.userId)).order("desc").take(1);
    const profile = profileCandidates[0];
    if (!profile) return null;
    const viewerId = await getAuthUserId(ctx);
    const isPrivateForViewer = Boolean((profile as any).isPrivateProfile && viewerId !== profile.userId);
    if (isPrivateForViewer) {
      return {
        ...profile,
        name: "شخصي",
        sakiId: "خاص",
        avatarUrl: "/assets/privacy/private-person-icon.svg",
        avatarStorageId: undefined,
        coverUrl: undefined,
        coverStorageId: undefined,
        profileBgUrl: undefined,
        profileBgStorageId: undefined,
        country: "",
        gender: "male",
        isVip: false,
        vipLevel: 0,
        isPro: false,
        proLevel: 0,
        aristocracyLevel: 0,
        aristocracyExpiresAt: undefined,
        wealthLevel: 0,
        charismaLevel: 0,
        isSuperAdmin: false,
        isAgent: false,
        adminTitle: undefined,
        adminTitleIconUrl: undefined,
        isPrivateProfile: true,
      } as any;
    }
    let avatarUrl = profile.avatarUrl;
    if (profile.avatarStorageId) {
      const freshAvatarUrl = await ctx.storage.getUrl(profile.avatarStorageId);
      if (freshAvatarUrl) avatarUrl = freshAvatarUrl;
    }
    let coverUrl = profile.coverUrl;
    if (profile.coverStorageId) {
      const freshCoverUrl = await ctx.storage.getUrl(profile.coverStorageId);
      if (freshCoverUrl) coverUrl = freshCoverUrl;
    }
    let sakiIdIconUrl = (profile as any).sakiIdIconUrl;
    const iconStorageId = (profile as any).sakiIdIconStorageId;
    if (iconStorageId && !sakiIdIconUrl) sakiIdIconUrl = await ctx.storage.getUrl(iconStorageId) ?? undefined;
    // إعادة حساب adminTitleIconUrl من storage إذا كان موجوداً
    let adminTitleIconUrl = (profile as any).adminTitleIconUrl;
    const adminTitleIconStorageId = (profile as any).adminTitleIconStorageId;
    if (adminTitleIconStorageId) {
      const freshUrl = await ctx.storage.getUrl(adminTitleIconStorageId);
      if (freshUrl) adminTitleIconUrl = freshUrl;
    }
    return { ...profile, avatarUrl, coverUrl, sakiIdIconUrl, adminTitleIconUrl };
  },
});

export const getProfileBySakiId = query({
  args: { sakiId: v.string() },
  handler: async (ctx, args) => {
    // البحث أولاً بالـ sakiId الأصلي
    let profile = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.sakiId)).unique();
    // إذا لم يوجد، ابحث بالمعرف المميز (premiumSakiId)
    if (!profile) {
      const allProfiles = await ctx.db.query("profiles").collect();
      profile = allProfiles.find((p) => (p as any).premiumSakiId === args.sakiId) ?? null;
    }
    if (!profile) return null;
    const viewerId = await getAuthUserId(ctx);
    if ((profile as any).isPrivateProfile && viewerId !== profile.userId) {
      return {
        ...profile,
        name: "شخصي",
        sakiId: "خاص",
        avatarUrl: "/assets/privacy/private-person-icon.svg",
        avatarStorageId: undefined,
        coverUrl: undefined,
        coverStorageId: undefined,
        profileBgUrl: undefined,
        profileBgStorageId: undefined,
        isVip: false,
        vipLevel: 0,
        isPro: false,
        proLevel: 0,
        aristocracyLevel: 0,
        wealthLevel: 0,
        charismaLevel: 0,
        isSuperAdmin: false,
        isAgent: false,
        isPrivateProfile: true,
      } as any;
    }
    let avatarUrl = profile.avatarUrl;
    if (profile.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
    let sakiIdIconUrl = (profile as any).sakiIdIconUrl;
    const iconStorageId = (profile as any).sakiIdIconStorageId;
    if (iconStorageId && !sakiIdIconUrl) sakiIdIconUrl = await ctx.storage.getUrl(iconStorageId) ?? undefined;
    return { ...profile, avatarUrl, sakiIdIconUrl };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    country: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    isPrivateProfile: v.optional(v.boolean()),
    hideRoomPresence: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    await ctx.db.patch(profile._id, args);
    return profile._id;
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateAvatar = mutation({
  args: { avatarStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const url = await ctx.storage.getUrl(args.avatarStorageId);
    await ctx.db.patch(profile._id, { avatarStorageId: args.avatarStorageId, avatarUrl: url ?? undefined });
    return profile._id;
  },
});

export const generateCoverUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateCover = mutation({
  args: { coverStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const url = await ctx.storage.getUrl(args.coverStorageId);
    await ctx.db.patch(profile._id, { coverStorageId: args.coverStorageId, coverUrl: url ?? undefined });
    return profile._id;
  },
});

export const generateProfileBgUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateProfileBg = mutation({
  args: { profileBgStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const url = await ctx.storage.getUrl(args.profileBgStorageId);
    await ctx.db.patch(profile._id, { profileBgStorageId: args.profileBgStorageId, profileBgUrl: url ?? undefined });
    return profile._id;
  },
});

export const setActiveFrame = mutation({
  args: { frameId: v.optional(v.id("storeItems")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    await ctx.db.patch(profile._id, { activeFrameId: args.frameId });
    return profile._id;
  },
});

export const setActiveEntry = mutation({
  args: { entryId: v.optional(v.id("storeItems")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    await ctx.db.patch(profile._id, { activeEntryId: args.entryId });
    return profile._id;
  },
});

export const setActiveBubble = mutation({
  args: { bubbleId: v.optional(v.id("storeItems")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    await ctx.db.patch(profile._id, { activeBubbleId: args.bubbleId });
    return profile._id;
  },
});

export const searchProfiles = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    const allProfiles = await ctx.db.query("profiles").collect();
    const q = args.query.toLowerCase();
    return allProfiles
      .filter((p) => p.name?.toLowerCase().includes(q) || p.sakiId?.includes(q))
      .slice(0, 20)
      .map((p) => ({ _id: p._id, userId: p.userId, name: p.name, sakiId: p.sakiId, avatarUrl: p.avatarUrl, isVip: p.isVip, vipLevel: p.vipLevel }));
  },
});

export const getTopProfiles = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    return profiles
      .sort((a, b) => (b.goldCoins ?? 0) - (a.goldCoins ?? 0))
      .slice(0, 50)
      .map((p) => ({ _id: p._id, userId: p.userId, name: p.name, sakiId: p.sakiId, avatarUrl: p.avatarUrl, goldCoins: p.goldCoins, isVip: p.isVip, vipLevel: p.vipLevel }));
  },
});

export const updateLastOnline = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) return null;
    await ctx.db.patch(profile._id, { lastOnline: Date.now() });
    return null;
  },
});

export const setAgentRole = mutation({
  args: { targetUserId: v.id("users"), isAgent: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح");
    const t = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!t) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(t._id, { isAgent: args.isAgent });
    return null;
  },
});
