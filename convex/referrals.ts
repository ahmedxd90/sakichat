import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const REFERRAL_BONUS_COINS = 100000;
const REFERRAL_MILESTONE = 10;
const REFERRAL_CHARGE_PERCENT = 0.30;

function generateReferralCode(sakiId: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SK";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code + sakiId.slice(-2);
}

export const applyReferralCode = mutation({
  args: { referralCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile) throw new Error("الملف الشخصي غير موجود");

    if (myProfile.referredByCode) {
      throw new Error("تم استخدام كود دعوة مسبقاً");
    }

    const referrerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode.toUpperCase()))
      .unique();

    if (!referrerProfile) throw new Error("كود الدعوة غير صحيح");
    if (referrerProfile.userId === userId) throw new Error("لا يمكنك استخدام كودك الخاص");

    await ctx.db.patch(myProfile._id, {
      referredByCode: args.referralCode.toUpperCase(),
      referredByUserId: referrerProfile.userId,
    });

    await ctx.db.insert("referrals", {
      referrerId: referrerProfile.userId,
      referredId: userId,
      code: args.referralCode.toUpperCase(),
      referralCode: args.referralCode.toUpperCase(),
      status: "active",
      chargeEarnings: 0,
      createdAt: Date.now(),
    });

    const currentCount = referrerProfile.referralCount ?? 0;
    const newCount = currentCount + 1;
    await ctx.db.patch(referrerProfile._id, {
      referralCount: newCount,
    });

    // إشعار للداعي عند كل دعوة
    await ctx.db.insert("notifications", {
      userId: referrerProfile.userId,
      type: "referral_new",
      title: "🎉 دعوة جديدة!",
      body: `انضم ${myProfile.name} عبر كودك! لديك الآن ${newCount}/10 دعوات`,
      isRead: false,
      createdAt: Date.now(),
    });

    // عند الوصول لـ 10 دعوات - إشعار بالمكافأة الجاهزة
    if (newCount >= REFERRAL_MILESTONE && !referrerProfile.isSakiAmbassador) {
      await ctx.db.insert("notifications", {
        userId: referrerProfile.userId,
        type: "ambassador_ready",
        title: "🌟 مكافأة السفير جاهزة!",
        body: `وصلت إلى ${REFERRAL_MILESTONE} دعوات! اذهب لصفحة الدعوة لاستلام مكافأتك`,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { success: true, referrerName: referrerProfile.name };
  },
});

// استلام مكافأة السفير يدوياً
export const claimAmbassadorReward = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    const referralCount = profile.referralCount ?? 0;
    if (referralCount < REFERRAL_MILESTONE) {
      throw new Error(`تحتاج إلى ${REFERRAL_MILESTONE - referralCount} دعوة إضافية`);
    }

    if (profile.isSakiAmbassador) {
      throw new Error("لقد استلمت مكافأة السفير مسبقاً");
    }

    await ctx.db.patch(profile._id, {
      isSakiAmbassador: true,
      ambassadorSince: Date.now(),
      goldCoins: (profile.goldCoins ?? 0) + REFERRAL_BONUS_COINS,
    });

    await ctx.db.insert("userStoreItems", {
      userId,
      storeItemId: userId as any, // placeholder
      type: "frame",
      isActive: false,
      purchasedAt: Date.now(),
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId,
      type: "ambassador",
      title: "🌟 مبروك! أصبحت سفير ساكي",
      body: `حصلت على ${REFERRAL_BONUS_COINS.toLocaleString()} عملة ذهبية + لقب سفير ساكي + إطار حصري`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const getMyReferralInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return null;

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", userId))
      .order("desc")
      .take(50);

    const referralsWithNames = await Promise.all(
      referrals.map(async (r) => {
        const rp = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", r.referredId))
          .unique();
        return {
          ...r,
          referredName: rp?.name ?? "مستخدم",
          referredSakiId: rp?.sakiId ?? "",
        };
      })
    );

    return {
      referralCode: profile.referralCode ?? null,
      referralCount: profile.referralCount ?? 0,
      totalChargeEarnings: profile.referralChargeEarnings ?? 0,
      isSakiAmbassador: profile.isSakiAmbassador ?? false,
      ambassadorSince: profile.ambassadorSince ?? null,
      referrals: referralsWithNames,
      referredByCode: profile.referredByCode ?? null,
      canClaimAmbassador: (profile.referralCount ?? 0) >= REFERRAL_MILESTONE && !profile.isSakiAmbassador,
    };
  },
});

export const generateMyReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    if (profile.referralCode) return profile.referralCode;

    let code = generateReferralCode(profile.sakiId);
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", code))
        .unique();
      if (!existing) break;
      code = generateReferralCode(profile.sakiId) + attempts;
      attempts++;
    }

    await ctx.db.patch(profile._id, { referralCode: code });
    return code;
  },
});

export const addReferralChargeEarning = mutation({
  args: {
    referredUserId: v.id("users"),
    chargeAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const referredProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.referredUserId))
      .unique();
    if (!referredProfile?.referredByUserId) return null;

    const earning = Math.floor(args.chargeAmount * REFERRAL_CHARGE_PERCENT);
    if (earning <= 0) return null;

    const referrerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", referredProfile.referredByUserId!))
      .unique();
    if (!referrerProfile) return null;

    await ctx.db.patch(referrerProfile._id, {
      goldCoins: (referrerProfile.goldCoins ?? 0) + earning,
      referralChargeEarnings: (referrerProfile.referralChargeEarnings ?? 0) + earning,
    });

    const referralRecord = await ctx.db
      .query("referrals")
      .withIndex("by_referrer_and_referred", (q) =>
        q.eq("referrerId", referredProfile.referredByUserId!).eq("referredId", args.referredUserId)
      )
      .unique();
    if (referralRecord) {
      await ctx.db.patch(referralRecord._id, {
        chargeEarnings: (referralRecord.chargeEarnings ?? 0) + earning,
      });
    }

    await ctx.db.insert("notifications", {
      userId: referredProfile.referredByUserId!,
      type: "referral_earning",
      title: "💰 أرباح دعوة",
      body: `حصلت على ${earning.toLocaleString()} عملة ذهبية (30%) من شحن ${referredProfile.name}`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { earning };
  },
});

export const validateReferralCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    if (!args.code || args.code.length < 4) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.code.toUpperCase()))
      .unique();
    if (!profile) return null;
    return { valid: true, referrerName: profile.name, referrerSakiId: profile.sakiId };
  },
});
