// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
  if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
  return { userId, profile };
}

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isSuperAdmin) return null;

    const [allProfiles, allRooms, bannedProfiles, recentGifts] = await Promise.all([
      ctx.db.query("profiles").take(3000),
      ctx.db.query("rooms").take(1000),
      ctx.db.query("profiles").withIndex("by_banned", (q) => q.eq("isBanned", true)).take(500),
      ctx.db.query("gifts").order("desc").take(500),
    ]);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const newUsersToday = allProfiles.filter((p) => p.createdAt >= oneDayAgo).length;
    const newUsersWeek = allProfiles.filter((p) => p.createdAt >= oneWeekAgo).length;
    const proUsers = allProfiles.filter((p) => p.isPro && (p.proExpiresAt ?? 0) > now).length;
    const activeRooms = allRooms.filter((r) => r.isLive && (r.memberCount ?? 0) > 0).length;
    const totalCoinsSpent = recentGifts.reduce((sum: number, g: any) => sum + (g.price ?? 0), 0);
    const giftsToday = recentGifts.filter((g: any) => g.createdAt >= oneDayAgo).length;

    return {
      totalUsers: allProfiles.length,
      newUsersToday,
      newUsersWeek,
      proUsers,
      totalRooms: allRooms.length,
      activeRooms,
      totalGifts: recentGifts.length,
      giftsToday,
      totalCoinsSpent,
      bannedUsers: bannedProfiles.length,
      totalNotifications: 0,
    };
  },
});

export const listAllUsers = query({
  args: {
    search: v.optional(v.string()),
    filterVip: v.optional(v.boolean()),
    filterPro: v.optional(v.boolean()),
    filterBanned: v.optional(v.boolean()),
    filterAgent: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile?.isSuperAdmin) return [];

    // تقليل من 3000 إلى 500
    let profiles = await ctx.db.query("profiles").order("desc").take(500);

    if (args.filterBanned === true) profiles = profiles.filter((p) => p.isBanned === true);
    if (args.filterVip === true) profiles = profiles.filter((p) => p.isVip === true);
    if (args.filterPro === true) profiles = profiles.filter((p) => p.isPro === true && (p.proExpiresAt ?? 0) > Date.now());
    if (args.filterAgent === true) profiles = profiles.filter((p) => p.isAgent === true);
    if (args.search) {
      const s = args.search.toLowerCase();
      profiles = profiles.filter(
        (p) => p.name?.toLowerCase().includes(s) || p.sakiId?.includes(s) || p.country?.toLowerCase().includes(s)
      );
    }

    const limit = args.limit ?? 50;
    profiles = profiles.slice(0, limit);

    return await Promise.all(
      profiles.map(async (p) => {
        let avatarUrl = p.avatarUrl;
        if (p.avatarStorageId && !avatarUrl) avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        let adminTitleIconUrl = (p as any).adminTitleIconUrl;
        const adminTitleIconStorageId = (p as any).adminTitleIconStorageId;
        if (adminTitleIconStorageId && !adminTitleIconUrl) {
          const freshUrl = await ctx.storage.getUrl(adminTitleIconStorageId);
          if (freshUrl) adminTitleIconUrl = freshUrl;
        }
        return { ...p, avatarUrl, adminTitleIconUrl };
      })
    );
  },
});

export const getUserDetail = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile?.isSuperAdmin) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!profile) return null;

    let avatarUrl = profile.avatarUrl;
    if (profile.avatarStorageId && !avatarUrl) avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;

    const devices = await ctx.db
      .query("deviceRegistry")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();

    const gifts = await ctx.db
      .query("gifts")
      .withIndex("by_sender", (q) => q.eq("senderId", args.targetUserId))
      .order("desc")
      .take(10);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .order("desc")
      .take(10);

    return { ...profile, avatarUrl, devices, recentGifts: gifts, recentNotifications: notifications };
  },
});

export const adminAddCoins = mutation({
  args: { targetSakiId: v.string(), amount: v.number(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userId } = await requireSuperAdmin(ctx);
    if (args.amount <= 0) throw new Error("المبلغ يجب أن يكون أكبر من صفر");
    const target = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId)).unique();
    if (!target) throw new Error("لم يتم العثور على المستخدم");
    await ctx.db.patch(target._id, { goldCoins: (target.goldCoins ?? 0) + args.amount });
    await ctx.db.insert("notifications", {
      userId: target.userId, type: "charge", title: "💰 تم إضافة رصيد",
      body: `تم إضافة ${args.amount.toLocaleString()} عملة ذهبية لحسابك من قِبل الإدارة${args.note ? ` - ${args.note}` : ""}`,
      isRead: false, actorUserId: userId, createdAt: Date.now(),
    });
    return { success: true, targetName: target.name, newBalance: (target.goldCoins ?? 0) + args.amount };
  },
});

export const adminDeductCoins = mutation({
  args: { targetSakiId: v.string(), amount: v.number(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    if (args.amount <= 0) throw new Error("المبلغ يجب أن يكون أكبر من صفر");
    const target = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId)).unique();
    if (!target) throw new Error("لم يتم العثور على المستخدم");
    const current = target.goldCoins ?? 0;
    if (current < args.amount) throw new Error("رصيد المستخدم غير كافٍ");
    await ctx.db.patch(target._id, { goldCoins: current - args.amount });
    return { success: true, targetName: target.name, newBalance: current - args.amount };
  },
});

export const adminSetVip = mutation({
  args: { targetSakiId: v.string(), isVip: v.boolean(), vipLevel: v.optional(v.number()), durationDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { userId } = await requireSuperAdmin(ctx);
    const target = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId)).unique();
    if (!target) throw new Error("لم يتم العثور على المستخدم");
    const patch: any = { isVip: args.isVip };
    if (args.isVip) {
      if (args.vipLevel) patch.vipLevel = args.vipLevel;
      if (args.durationDays) patch.vipExpiresAt = Date.now() + args.durationDays * 24 * 60 * 60 * 1000;
    } else {
      patch.vipLevel = undefined;
      patch.vipExpiresAt = undefined;
    }
    await ctx.db.patch(target._id, patch);
    if (args.isVip) {
      await ctx.db.insert("notifications", {
        userId: target.userId, type: "system",
        title: `🎉 تم تفعيل VIP${args.vipLevel ?? ""}`,
        body: `تهانينا! تم تفعيل عضوية VIP${args.vipLevel ?? ""} لحسابك من قِبل الإدارة`,
        isRead: false, actorUserId: userId, createdAt: Date.now(),
      });
    }
    return { success: true, targetName: target.name };
  },
});

export const adminSetAccountActive = mutation({
  args: { targetUserId: v.id("users"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const target = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!target) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(target._id, { isActive: args.isActive });
    return { success: true };
  },
});

export const adminSendNotification = mutation({
  args: { targetUserId: v.optional(v.id("users")), sendToAll: v.optional(v.boolean()), title: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireSuperAdmin(ctx);
    const now = Date.now();
    if (args.sendToAll) {
      const allProfiles = await ctx.db.query("profiles").take(5000);
      for (const p of allProfiles) {
        await ctx.db.insert("notifications", {
          userId: p.userId, type: "system", title: args.title, body: args.body,
          isRead: false, actorUserId: userId, createdAt: now,
        });
      }
      return { success: true, count: allProfiles.length };
    }
    if (args.targetUserId) {
      await ctx.db.insert("notifications", {
        userId: args.targetUserId, type: "system", title: args.title, body: args.body,
        isRead: false, actorUserId: userId, createdAt: now,
      });
      return { success: true, count: 1 };
    }
    throw new Error("يجب تحديد مستخدم أو إرسال للجميع");
  },
});

export const adminSetRoomFeatured = mutation({
  args: { roomId: v.id("rooms"), isFeatured: v.boolean() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    await ctx.db.patch(args.roomId, { isFeatured: args.isFeatured });
    return { success: true };
  },
});

export const adminDeleteRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const members = await ctx.db.query("roomMembers").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
    for (const m of members) await ctx.db.delete(m._id);
    const messages = await ctx.db.query("messages").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
    for (const m of messages) await ctx.db.delete(m._id);
    await ctx.db.delete(args.roomId);
    return { success: true };
  },
});

export const adminListRooms = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin) return [];

    // تقليل من 2000 إلى 300
    let rooms = await ctx.db.query("rooms").order("desc").take(300);
    if (args.search) {
      const s = args.search.toLowerCase();
      rooms = rooms.filter((r) => r.name?.toLowerCase().includes(s));
    }
    const limit = args.limit ?? 50;
    rooms = rooms.slice(0, limit);

    return await Promise.all(
      rooms.map(async (room) => {
        let coverUrl = room.coverUrl;
        if (room.coverStorageId && !coverUrl) coverUrl = (await ctx.storage.getUrl(room.coverStorageId)) ?? undefined;
        const ownerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", room.ownerId)).unique();
        return { ...room, coverUrl, ownerName: ownerProfile?.name ?? "مجهول", ownerSakiId: ownerProfile?.sakiId ?? "" };
      })
    );
  },
});

export const adminGetReports = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin) return [];

    let reports = await ctx.db.query("userReports").order("desc").take(100);
    if (args.status) reports = reports.filter((r) => r.status === args.status);

    return await Promise.all(
      reports.map(async (r) => {
        const reporter = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.reporterId)).unique();
        const reported = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.reportedUserId)).unique();
        return {
          ...r,
          reporterName: reporter?.name ?? "مجهول", reporterSakiId: reporter?.sakiId ?? "",
          reportedName: reported?.name ?? "مجهول", reportedSakiId: reported?.sakiId ?? "",
          reportedIsBanned: reported?.isBanned ?? false,
        };
      })
    );
  },
});

export const adminUpdateReportStatus = mutation({
  args: { reportId: v.id("userReports"), status: v.string() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("البلاغ غير موجود");
    await ctx.db.patch(args.reportId, { status: args.status });
    return { success: true };
  },
});

export const adminGetChargeHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin) return [];

    const charges = await ctx.db.query("chargeRequests").order("desc").take(args.limit ?? 100);
    return await Promise.all(
      charges.map(async (c) => {
        const agentProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", c.agentId)).unique();
        return { ...c, agentName: agentProfile?.name ?? "مجهول", agentSakiId: agentProfile?.sakiId ?? "" };
      })
    );
  },
});

export const adminGetGiftStats = query({
  args: { period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("all")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin) return null;

    const PERIODS: Record<string, number> = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    };

    // تقليل من 5000 إلى 1000
    let gifts = await ctx.db.query("gifts").order("desc").take(1000);
    if (args.period !== "all") {
      const since = Date.now() - PERIODS[args.period];
      gifts = gifts.filter((g) => g.createdAt >= since);
    }

    const totalCoins = gifts.reduce((sum, g) => sum + (g.price ?? 0), 0);
    const uniqueSenders = new Set(gifts.map((g) => g.senderId as string)).size;
    const uniqueReceivers = new Set(gifts.map((g) => g.receiverId as string)).size;

    const typeMap: Record<string, number> = {};
    for (const g of gifts) typeMap[g.giftName] = (typeMap[g.giftName] ?? 0) + 1;
    const topGifts = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

    return { totalGifts: gifts.length, totalCoins, uniqueSenders, uniqueReceivers, topGifts };
  },
});

export const adminResetUserCoins = mutation({
  args: { targetUserId: v.id("users"), newBalance: v.number() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    if (args.newBalance < 0) throw new Error("الرصيد لا يمكن أن يكون سالباً");
    const target = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!target) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(target._id, { goldCoins: args.newBalance });
    return { success: true, targetName: target.name };
  },
});

export const adminGetSecurityLogs = query({
  args: {
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin) return [];

    let logs;
    if (args.severity) {
      logs = await ctx.db.query("securityLogs").withIndex("by_severity", (q) => q.eq("severity", args.severity!)).order("desc").take(args.limit ?? 100);
    } else {
      logs = await ctx.db.query("securityLogs").order("desc").take(args.limit ?? 100);
    }

    return await Promise.all(
      logs.map(async (log) => {
        let userName = "مجهول";
        if (log.userId) {
          const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", log.userId!)).unique();
          if (p) userName = p.name;
        }
        return { ...log, userName };
      })
    );
  },
});

export const adminGetAgents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin) return [];

    // تقليل من 5000 إلى 500
    const profiles = await ctx.db.query("profiles").take(500);
    const agents = profiles.filter((p) => p.isAgent || p.isSuperAdmin);

    return await Promise.all(
      agents.map(async (p) => {
        let avatarUrl = p.avatarUrl;
        if (p.avatarStorageId && !avatarUrl) avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        const chargeCount = await ctx.db.query("agentCharges").withIndex("by_agent", (q) => q.eq("agentId", p.userId)).collect();
        return {
          ...p, avatarUrl,
          totalCharges: chargeCount.length,
          totalCoinsCharged: chargeCount.reduce((sum, c) => sum + (c.goldCoins ?? 0), 0),
        };
      })
    );
  },
});

export const adminBroadcastMessage = mutation({
  args: {
    title: v.string(), body: v.string(),
    targetGroup: v.union(v.literal("all"), v.literal("vip"), v.literal("agents"), v.literal("active")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireSuperAdmin(ctx);
    const now = Date.now();
    let profiles = await ctx.db.query("profiles").take(5000);
    if (args.targetGroup === "vip") profiles = profiles.filter((p) => p.isVip);
    else if (args.targetGroup === "agents") profiles = profiles.filter((p) => p.isAgent);
    else if (args.targetGroup === "active") profiles = profiles.filter((p) => p.isActive);
    for (const p of profiles) {
      await ctx.db.insert("notifications", {
        userId: p.userId, type: "system", title: args.title, body: args.body,
        isRead: false, actorUserId: userId, createdAt: now,
      });
    }
    return { success: true, count: profiles.length };
  },
});

export const adminGetVipUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin) return [];

    // استخدام index by_vip بدلاً من جلب الكل
    const vipUsers = await ctx.db.query("profiles").withIndex("by_vip", (q) => q.eq("isVip", true)).take(500);

    return await Promise.all(
      vipUsers.map(async (p) => {
        let avatarUrl = p.avatarUrl;
        if (p.avatarStorageId && !avatarUrl) avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        return { ...p, avatarUrl };
      })
    );
  },
});

export const adminGetOverview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin && !myProfile?.isAgent) return null;

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // إضافة .take() لكل الاستعلامات بدلاً من .collect()
    const [allProfiles, allRooms, recentGifts, pendingReports] = await Promise.all([
      ctx.db.query("profiles").take(3000),
      ctx.db.query("rooms").take(500),
      ctx.db.query("gifts").order("desc").take(20),
      ctx.db.query("userReports").take(200),
    ]);

    const activeRooms = allRooms.filter((r) => r.isLive && (r.memberCount ?? 0) > 0);
    const totalOnline = activeRooms.reduce((sum, r) => sum + (r.memberCount ?? 0), 0);
    const newUsersToday = allProfiles.filter((p) => p.createdAt >= oneDayAgo).length;
    const pendingCount = pendingReports.filter((r) => !r.status || r.status === "pending").length;

    return {
      totalUsers: allProfiles.length,
      newUsersToday,
      totalRooms: allRooms.length,
      activeRooms: activeRooms.length,
      totalOnline,
      pendingReports: pendingCount,
      recentGiftsCount: recentGifts.length,
      isAgent: myProfile.isAgent ?? false,
      isSuperAdmin: myProfile.isSuperAdmin ?? false,
    };
  },
});

export const adminSetRoomOfficial = mutation({
  args: { roomId: v.id("rooms"), isOfficial: v.boolean() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    await ctx.db.patch(args.roomId, { isOfficial: args.isOfficial });
    await ctx.db.insert("notifications", {
      userId: room.ownerId, type: "system",
      title: args.isOfficial ? "🏅 غرفتك أصبحت رسمية!" : "ℹ️ تغيير حالة الغرفة",
      body: args.isOfficial
        ? `تهانينا! تم تعيين غرفة "${room.name}" كغرفة رسمية 🎉`
        : `تم إلغاء الحالة الرسمية لغرفة "${room.name}"`,
      isRead: false, createdAt: Date.now(),
    });
    return { success: true };
  },
});
