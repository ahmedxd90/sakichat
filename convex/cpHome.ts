// @ts-nocheck
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const LEVEL_THRESHOLDS = [0, 5000000, 10000000, 15000000, 20000000, 30000000];
const LEVEL_NAMES = ["بيت صغير", "بيت مريح", "بيت جميل", "قصر صغير", "قصر فاخر"];

function calcLevel(totalGifts: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 1; i--) {
    if (totalGifts >= LEVEL_THRESHOLDS[i]) { level = i; break; }
  }
  return Math.min(level, 5);
}

function getGiftName(type: string): string {
  const names: Record<string, string> = {
    rose: "وردة 🌹", diamond: "ماسة 💎", crown: "تاج 👑",
    cake: "كعكة 🎂", ring: "خاتم 💍", star: "نجمة ⭐",
  };
  return names[type] ?? "هدية";
}

export const getCpHome = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const home = await ctx.db.query("cpHomes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!home) return null;

    const cpItems = await ctx.db.query("userStoreItems")
      .withIndex("by_user_and_type", (q) => q.eq("userId", args.userId).eq("type", "cp"))
      .collect();
    const now = Date.now();
    const activeCp = cpItems.find(
      (i) => i.cpStatus === "accepted" && i.isActive && (!i.expiresAt || i.expiresAt > now)
    );
    const legacyPartner = home.user1Id === args.userId ? home.user2Id : home.user2Id === args.userId ? home.user1Id : null;
    const partnerUserId = activeCp?.sentToUserId ?? activeCp?.receivedFromUserId ?? home.partnerUserId ?? legacyPartner ?? null;
    if (!partnerUserId) return null;

    let partnerProfile = null;
    if (partnerUserId) {
      partnerProfile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", partnerUserId))
        .unique();
      if (partnerProfile?.avatarStorageId) {
        const url = await ctx.storage.getUrl(partnerProfile.avatarStorageId);
        if (url) partnerProfile = { ...partnerProfile, avatarUrl: url };
      }
    }

    const ownerProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    let ownerAvatarUrl = ownerProfile?.avatarUrl;
    if (ownerProfile?.avatarStorageId) {
      const freshOwnerAvatarUrl = await ctx.storage.getUrl(ownerProfile.avatarStorageId);
      if (freshOwnerAvatarUrl) ownerAvatarUrl = freshOwnerAvatarUrl;
    }

    const recentGifts = await ctx.db.query("cpHomeGifts")
      .withIndex("by_home", (q) => q.eq("homeId", home._id))
      .order("desc")
      .take(20);

    const level = calcLevel(home.totalGiftsReceived ?? 0);
    const nextThreshold = LEVEL_THRESHOLDS[level] ?? null;
    const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;

    return {
      ...home,
      level,
      levelName: LEVEL_NAMES[level - 1],
      nextThreshold,
      currentThreshold,
      ownerName: ownerProfile?.name ?? "مجهول",
      ownerAvatarUrl,
      partnerUserId,
      partnerName: partnerProfile?.name ?? null,
      partnerAvatarUrl: partnerProfile?.avatarUrl ?? null,
      recentGifts,
    };
  },
});

export const ensureCpHome = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const existing = await ctx.db.query("cpHomes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("cpHomes", {
      userId,
      totalGiftsReceived: 0,
      hasCat: false,
      hasDog: false,
      catName: "ميمي",
      dogName: "بوبي",
      marriageDayStart: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const recordRoomGiftForCp = internalMutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
    coins: v.number(),
    giftName: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.senderId === args.receiverId || args.coins <= 0) return { updated: false };
    const senderHome = await ctx.db.query("cpHomes").withIndex("by_userId", (q) => q.eq("userId", args.senderId)).unique();
    const receiverHome = await ctx.db.query("cpHomes").withIndex("by_userId", (q) => q.eq("userId", args.receiverId)).unique();
    const isCpPair = Boolean(
      (senderHome?.partnerUserId === args.receiverId) ||
      (receiverHome?.partnerUserId === args.senderId) ||
      (senderHome?.user1Id === args.receiverId) ||
      (senderHome?.user2Id === args.receiverId)
    );
    if (!isCpPair) return { updated: false };
    const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.senderId)).unique();
    const senderName = senderProfile?.name ?? "مستخدم";
    const now = Date.now();
    for (const home of [senderHome, receiverHome]) {
      if (!home) continue;
      await ctx.db.patch(home._id, { totalGiftsReceived: (home.totalGiftsReceived ?? 0) + args.coins });
      await ctx.db.insert("cpHomeGifts", { homeId: home._id, senderId: args.senderId, senderName, giftType: args.giftName, coins: args.coins, createdAt: now });
    }
    return { updated: true, coins: args.coins };
  },
});

export const sendGiftToHome = mutation({
  args: {
    homeUserId: v.id("users"),
    giftType: v.union(
      v.literal("rose"), v.literal("diamond"), v.literal("crown"),
      v.literal("cake"), v.literal("ring"), v.literal("star")
    ),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (userId === args.homeUserId) throw new Error("لا يمكنك إرسال هدية لنفسك");

    const GIFT_COSTS: Record<string, number> = {
      rose: 50, diamond: 200, crown: 500, cake: 100, ring: 300, star: 150,
    };
    const cost = GIFT_COSTS[args.giftType] ?? 50;

    const senderProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!senderProfile) throw new Error("ملف شخصي غير موجود");
    if ((senderProfile.goldCoins ?? 0) < cost) throw new Error(`تحتاج ${cost} عملة`);

    await ctx.db.patch(senderProfile._id, { goldCoins: (senderProfile.goldCoins ?? 0) - cost });

    let home = await ctx.db.query("cpHomes")
      .withIndex("by_userId", (q) => q.eq("userId", args.homeUserId))
      .unique();
    if (!home) {
      const homeId = await ctx.db.insert("cpHomes", {
        userId: args.homeUserId,
        totalGiftsReceived: 0,
        hasCat: false,
        hasDog: false,
        catName: "ميمي",
        dogName: "بوبي",
        marriageDayStart: Date.now(),
        createdAt: Date.now(),
      });
      home = await ctx.db.get(homeId);
    }
    if (!home) throw new Error("فشل إنشاء المنزل");

    const newTotal = (home.totalGiftsReceived ?? 0) + cost;
    await ctx.db.patch(home._id, { totalGiftsReceived: newTotal });

    await ctx.db.insert("cpHomeGifts", {
      homeId: home._id,
      senderId: userId,
      senderName: senderProfile.name,
      giftType: args.giftType,
      coins: cost,
      message: args.message,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: args.homeUserId,
      type: "cp_home_gift",
      title: "🏠 هدية لمنزلك!",
      body: `${senderProfile.name} أرسل لك ${getGiftName(args.giftType)} 🎁`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });

    return { newTotal, level: calcLevel(newTotal) };
  },
});

export const setPetName = mutation({
  args: {
    petType: v.union(v.literal("cat"), v.literal("dog")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const home = await ctx.db.query("cpHomes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!home) throw new Error("المنزل غير موجود");
    if (args.petType === "cat") {
      await ctx.db.patch(home._id, { catName: args.name, hasCat: true });
    } else {
      await ctx.db.patch(home._id, { dogName: args.name, hasDog: true });
    }
  },
});

export const updateMarriageStart = mutation({
  args: { startDate: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const home = await ctx.db.query("cpHomes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!home) throw new Error("المنزل غير موجود");
    await ctx.db.patch(home._id, { marriageDayStart: args.startDate });
  },
});


const MARRIAGE_COST = 300000;

async function profileWithAvatar(ctx: any, userId: any) {
  const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!profile) return null;
  let avatarUrl = profile.avatarUrl;
  if (profile.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
  return { ...profile, avatarUrl };
}

export const getPendingMarriageRequest = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const request = await ctx.db.query("cpMarriageRequests")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (!request) return null;
    const sender = await profileWithAvatar(ctx, request.senderId);
    return sender ? { ...request, sender } : null;
  },
});

export const sendMarriageRequest = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (userId === args.targetUserId) throw new Error("لا يمكنك الارتباط بنفسك");
    const sender = await profileWithAvatar(ctx, userId);
    const receiver = await profileWithAvatar(ctx, args.targetUserId);
    if (!sender || !receiver) throw new Error("المستخدم غير موجود");
    if ((sender.goldCoins ?? 0) < MARRIAGE_COST) throw new Error("تحتاج إلى 300,000 عملة ذهبية لإرسال طلب الزواج");

    const existingCp = await ctx.db.query("cpHomes").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (existingCp?.partnerUserId) throw new Error("أنت مرتبط بالفعل");
    const targetCp = await ctx.db.query("cpHomes").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (targetCp?.partnerUserId) throw new Error("هذا المستخدم مرتبط بالفعل");

    const duplicate = await ctx.db.query("cpMarriageRequests")
      .withIndex("by_sender_receiver", (q) => q.eq("senderId", userId).eq("receiverId", args.targetUserId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (duplicate) throw new Error("تم إرسال طلب زواج مسبقًا");

    const requestId = await ctx.db.insert("cpMarriageRequests", {
      senderId: userId,
      receiverId: args.targetUserId,
      status: "pending",
      createdAt: Date.now(),
    });
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "cp_marriage_request",
      title: "💍 طلب زواج CP",
      body: `${sender.name} يريد الزواج منك. هل أنت موافق؟`,
      isRead: false,
      actorUserId: userId,
      refId: requestId,
      fromUserId: userId,
      fromUserName: sender.name,
      fromUserAvatar: sender.avatarUrl,
      createdAt: Date.now(),
    });
    await ctx.db.patch(requestId, { notificationId });
    return { requestId, cost: MARRIAGE_COST };
  },
});

export const acceptMarriageRequest = mutation({
  args: { requestId: v.id("cpMarriageRequests") },
  handler: async (ctx, args) => {
    const receiverId = await getAuthUserId(ctx);
    if (!receiverId) throw new Error("غير مصرح");
    const request = await ctx.db.get(args.requestId);
    if (!request || request.receiverId !== receiverId || request.status !== "pending") throw new Error("طلب الزواج غير متاح");

    const sender = await profileWithAvatar(ctx, request.senderId);
    const receiver = await profileWithAvatar(ctx, receiverId);
    if (!sender || !receiver) throw new Error("الملف الشخصي غير موجود");
    const senderCp = await ctx.db.query("cpHomes").withIndex("by_userId", (q) => q.eq("userId", request.senderId)).unique();
    const receiverCp = await ctx.db.query("cpHomes").withIndex("by_userId", (q) => q.eq("userId", receiverId)).unique();
    if (senderCp?.partnerUserId || receiverCp?.partnerUserId) throw new Error("أحد الطرفين مرتبط بالفعل");

    if ((sender.goldCoins ?? 0) < MARRIAGE_COST) throw new Error("لم يعد لدى المرسل رصيد كافٍ لإتمام الزواج");
    await ctx.db.patch(sender._id, { goldCoins: (sender.goldCoins ?? 0) - MARRIAGE_COST });
    const now = Date.now();
    const homeFields = { partnerUserId: receiverId, totalGiftsReceived: 0, hasCat: false, hasDog: false, catName: "ميمي", dogName: "بوبي", marriageDayStart: now, createdAt: now };
    if (senderCp) await ctx.db.patch(senderCp._id, homeFields);
    else await ctx.db.insert("cpHomes", { userId: request.senderId, ...homeFields });
    const receiverFields = { partnerUserId: request.senderId, totalGiftsReceived: 0, hasCat: false, hasDog: false, catName: "ميمي", dogName: "بوبي", marriageDayStart: now, createdAt: now };
    if (receiverCp) await ctx.db.patch(receiverCp._id, receiverFields);
    else await ctx.db.insert("cpHomes", { userId: receiverId, ...receiverFields });
    await ctx.db.patch(args.requestId, { status: "accepted", respondedAt: now });
    if (request.notificationId) await ctx.db.patch(request.notificationId, { isRead: true });
    await ctx.db.insert("notifications", {
      userId: request.senderId,
      type: "cp_marriage_accepted",
      title: "💍 تم قبول الزواج!",
      body: `${receiver.name} وافق على الزواج منك. مبروك لكما!`,
      isRead: false,
      actorUserId: receiverId,
      refId: args.requestId,
      fromUserId: receiverId,
      fromUserName: receiver.name,
      fromUserAvatar: receiver.avatarUrl,
      createdAt: now,
    });
    await ctx.db.insert("notifications", {
      userId: receiverId,
      type: "cp_marriage_accepted",
      title: "💍 تم الزواج!",
      body: `أصبحت مرتبطًا بـ ${sender.name}. مبروك لكما!`,
      isRead: false,
      actorUserId: request.senderId,
      refId: args.requestId,
      fromUserId: request.senderId,
      fromUserName: sender.name,
      fromUserAvatar: sender.avatarUrl,
      createdAt: now,
    });
    return { success: true, cost: MARRIAGE_COST, sender, receiver };
  },
});

export const rejectMarriageRequest = mutation({
  args: { requestId: v.id("cpMarriageRequests") },
  handler: async (ctx, args) => {
    const receiverId = await getAuthUserId(ctx);
    if (!receiverId) throw new Error("غير مصرح");
    const request = await ctx.db.get(args.requestId);
    if (!request || request.receiverId !== receiverId || request.status !== "pending") throw new Error("طلب الزواج غير متاح");
    await ctx.db.patch(args.requestId, { status: "rejected", respondedAt: Date.now() });
    if (request.notificationId) await ctx.db.patch(request.notificationId, { isRead: true });
    return { success: true };
  },
});

export const getRecentMarriageAnnouncement = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const notification = await ctx.db.query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .order("desc")
      .filter((q) => q.eq(q.field("type"), "cp_marriage_accepted"))
      .first();
    if (!notification) return null;
    const otherId = notification.fromUserId ?? notification.actorUserId;
    const other = otherId ? await profileWithAvatar(ctx, otherId) : null;
    return { ...notification, other };
  },
});

export const dismissMarriageAnnouncement = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId || notification.type !== "cp_marriage_accepted") throw new Error("غير مصرح");
    await ctx.db.patch(args.notificationId, { isRead: true });
    return { success: true };
  },
});

export const getMarriageCost = query({
  args: {},
  handler: async () => ({ cost: MARRIAGE_COST }),
});

export { MARRIAGE_COST };



const DIVORCE_COST = 150000;

export const divorceCp = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const home = await ctx.db.query("cpHomes").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    const partnerId = home?.partnerUserId ?? (home?.user1Id === userId ? home.user2Id : home?.user2Id === userId ? home.user1Id : null);
    if (!partnerId) throw new Error("لا يوجد ارتباط CP نشط");
    const profile = await profileWithAvatar(ctx, userId);
    const partner = await profileWithAvatar(ctx, partnerId);
    if (!profile || !partner) throw new Error("الملف الشخصي غير موجود");
    if ((profile.goldCoins ?? 0) < DIVORCE_COST) throw new Error("تحتاج إلى 150,000 عملة ذهبية للانفصال");

    const now = Date.now();
    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) - DIVORCE_COST, isDivorced: true, divorcedAt: now, divorcedFromUserId: partnerId });
    await ctx.db.patch(partner._id, { isDivorced: true, divorcedAt: now, divorcedFromUserId: userId });

    const myItems = await ctx.db.query("userStoreItems").withIndex("by_user_and_type", (q) => q.eq("userId", userId).eq("type", "cp")).collect();
    const partnerItems = await ctx.db.query("userStoreItems").withIndex("by_user_and_type", (q) => q.eq("userId", partnerId).eq("type", "cp")).collect();
    for (const item of myItems) {
      if (item.sentToUserId === partnerId || item.receivedFromUserId === partnerId) await ctx.db.patch(item._id, { isActive: false, cpStatus: "rejected" });
    }
    for (const item of partnerItems) {
      if (item.sentToUserId === userId || item.receivedFromUserId === userId) await ctx.db.patch(item._id, { isActive: false, cpStatus: "rejected" });
    }
    if (home) await ctx.db.delete(home._id);
    const partnerHome = await ctx.db.query("cpHomes").withIndex("by_userId", (q) => q.eq("userId", partnerId)).unique();
    if (partnerHome) await ctx.db.delete(partnerHome._id);

    await ctx.db.insert("notifications", {
      userId: partnerId,
      type: "cp_divorced",
      title: "💔 تم فك ارتباط CP",
      body: `${profile.name} قام بإنهاء ارتباط CP. يظهر لكما الآن لقب مطلق.`,
      isRead: false,
      actorUserId: userId,
      fromUserId: userId,
      fromUserName: profile.name,
      fromUserAvatar: profile.avatarUrl,
      createdAt: now,
    });
    return { success: true, cost: DIVORCE_COST, partnerId };
  },
});

export { DIVORCE_COST };


export const cleanupLegacyCp = mutation({
  args: { confirmation: v.literal("REMOVE_LEGACY_CP_2026") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول لتنفيذ تنظيف CP");
    const key = "legacy_cp_cleanup_v1";
    const alreadyRun = await ctx.db.query("cpCleanupRuns").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (alreadyRun) return { alreadyRun: true, deleted: 0 };

    let deleted = 0;
    for (const home of await ctx.db.query("cpHomes").collect()) { await ctx.db.delete(home._id); deleted++; }
    for (const gift of await ctx.db.query("cpHomeGifts").collect()) { await ctx.db.delete(gift._id); }
    for (const request of await ctx.db.query("cpMarriageRequests").collect()) { await ctx.db.delete(request._id); }
    for (const couple of await ctx.db.query("couples").collect()) { await ctx.db.delete(couple._id); }
    for (const item of await ctx.db.query("userStoreItems").collect()) {
      if (item.type === "cp") await ctx.db.patch(item._id, { isActive: false, cpStatus: "rejected" });
    }
    for (const notification of await ctx.db.query("notifications").collect()) {
      if (["cp_ring", "cp_marriage_request", "cp_marriage_accepted", "cp_home_gift"].includes(notification.type)) await ctx.db.patch(notification._id, { isRead: true });
    }
    await ctx.db.insert("cpCleanupRuns", { key, executedAt: Date.now(), executedBy: userId });
    return { alreadyRun: false, deleted };
  },
});
