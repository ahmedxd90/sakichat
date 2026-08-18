// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// تحويل ملكية الوكالة لعضو آخر
export const transferAgencyOwnership = mutation({
  args: { newOwnerUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMembership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!myMembership || myMembership.role !== "owner") throw new Error("فقط المالك يمكنه تحويل الوكالة");
    if (args.newOwnerUserId === userId) throw new Error("لا يمكنك تحويل الوكالة لنفسك");
    const targetMembership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_agency_and_user", (q) =>
        q.eq("agencyId", myMembership.agencyId).eq("userId", args.newOwnerUserId)
      ).unique();
    if (!targetMembership) throw new Error("العضو غير موجود في الوكالة");
    await ctx.db.patch(myMembership._id, { role: "admin" });
    await ctx.db.patch(targetMembership._id, { role: "owner" });
    await ctx.db.patch(myMembership.agencyId, { ownerId: args.newOwnerUserId });
    await ctx.db.insert("notifications", {
      userId: args.newOwnerUserId,
      type: "agency_transfer",
      title: "تم تحويل ملكية الوكالة إليك",
      body: "أصبحت الآن مالك الوكالة",
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// البحث عن وكيل شحن بـ saki_id
export const findChargeAgent = query({
  args: { sakiId: v.string() },
  handler: async (ctx, args) => {
    if (!args.sakiId.trim()) return null;
    const profile = await ctx.db.query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", args.sakiId.trim())).unique();
    if (!profile) return null;
    if (!profile.isAgent && !profile.isSuperAdmin) return null;
    let avatarUrl = profile.avatarUrl;
    if (profile.avatarStorageId && !avatarUrl) {
      avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
    }
    return {
      userId: profile.userId,
      name: profile.name,
      sakiId: profile.sakiId,
      avatarUrl,
      isAgent: profile.isAgent,
      isSuperAdmin: profile.isSuperAdmin,
    };
  },
});

// قائمة وكلاء الشحن المعتمدين لاستخدامها في مسار سحب المضيف
export const listApprovedChargeAgents = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    const agents = profiles.filter((profile) =>
      (profile.isAgent === true || profile.isSuperAdmin === true) && profile.isBanned !== true
    );
    return await Promise.all(
      agents
        .sort((a, b) => (a.isSuperAdmin === b.isSuperAdmin ? a.name.localeCompare(b.name) : a.isSuperAdmin ? -1 : 1))
        .map(async (profile) => {
          let avatarUrl = profile.avatarUrl;
          if (profile.avatarStorageId && !avatarUrl) {
            avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
          }
          return {
            agentId: profile.userId,
            userId: profile.userId,
            name: profile.name,
            sakiId: profile.sakiId,
            avatarUrl,
            isAgent: profile.isAgent === true,
            isSuperAdmin: profile.isSuperAdmin === true,
            isAvailable: profile.isActive !== false,
          };
        })
    );
  },
});

// إرسال ألماس الوكالة لوكيل شحن
export const sellAgencyDiamondsToAgent = mutation({
  args: {
    agentSakiId: v.string(),
    diamonds: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (args.diamonds <= 0) throw new Error("الكمية غير صحيحة");

    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership) throw new Error("لست عضواً في أي وكالة");
    if ((membership.pendingDiamonds ?? 0) < args.diamonds) {
      throw new Error("الماس غير كافٍ. لديك " + (membership.pendingDiamonds ?? 0) + " الماس");
    }

    const agentProfile = await ctx.db.query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", args.agentSakiId.trim())).unique();
    if (!agentProfile) throw new Error("الوكيل غير موجود");
    if (!agentProfile.isAgent && !agentProfile.isSuperAdmin) throw new Error("هذا المستخدم ليس وكيل شحن معتمد");
    if (agentProfile.isBanned === true || agentProfile.isActive === false) throw new Error("وكيل الشحن غير متاح حالياً");
    if (agentProfile.userId === userId) throw new Error("لا يمكنك إرسال الألماس إلى نفسك");

    const myProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId)).unique();

    await ctx.db.patch(membership._id, {
      pendingDiamonds: (membership.pendingDiamonds ?? 0) - args.diamonds,
      withdrawnDiamonds: (membership.withdrawnDiamonds ?? 0) + args.diamonds,
    });

    // تحويل الألماس إلى عملات ذهبية وإضافتها لحساب الوكيل (1 ألماس = 1 كوين)
    const coinsToAdd = args.diamonds;
    const agentProfileDoc = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", agentProfile.userId)).unique();
    if (agentProfileDoc) {
      await ctx.db.patch(agentProfileDoc._id, {
        goldCoins: (agentProfileDoc.goldCoins ?? 0) + coinsToAdd,
      });
    }

    const saleId = await ctx.db.insert("diamondSales", {
      sellerId: userId,
      agentId: agentProfile.userId,
      diamonds: args.diamonds,
      coinsReceived: coinsToAdd,
      status: "sent_to_agent",
      note: "تحويل ألماس مضيف إلى وكيل شحن معتمد",
      createdAt: Date.now(),
    });

    const agentAvatarUrl = agentProfile.avatarUrl ?? undefined;
    await ctx.db.insert("hostWithdrawals", {
      userId,
      agencyId: membership.agencyId,
      agentId: agentProfile.userId,
      agentSakiId: agentProfile.sakiId,
      agentName: agentProfile.name,
      agentAvatarUrl,
      diamonds: args.diamonds,
      usdAmount: Math.round((args.diamonds / 120000) * 100) / 100,
      method: "وكيل الشحن",
      accountInfo: agentProfile.sakiId,
      status: "sent_to_agent",
      note: `تم تسجيل التحويل ${saleId}`,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: agentProfile.userId,
      type: "diamond_received",
      title: "استقبلت الماس وكالة",
      body: "ارسل لك " + (myProfile?.name ?? "مضيف") + " " + args.diamonds + " الماس من وكالته وتم إضافة " + coinsToAdd + " كوين لحسابك",
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId,
      type: "diamond_sent",
      title: "تم ارسال الالماس",
      body: "تم ارسال " + args.diamonds + " الماس الى الوكيل " + agentProfile.name,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// جلب سجل مبيعات الألماس الخاصة بي
export const getMyDiamondSales = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const sales = await ctx.db.query("diamondSales")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc").take(20);
    return await Promise.all(sales.map(async (s) => {
      let agentName = "وكيل";
      if (s.agentId) {
        const ap = await ctx.db.query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", s.agentId)).unique();
        agentName = ap?.name ?? "وكيل";
      }
      return { ...s, agentName };
    }));
  },
});
