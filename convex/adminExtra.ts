// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db.query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
  return { userId, profile };
}

// ── Set Room Official ─────────────────────────────────────────────────────
export const adminSetRoomOfficial = mutation({
  args: { roomId: v.id("rooms"), isOfficial: v.boolean() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    await ctx.db.patch(args.roomId, { isOfficial: args.isOfficial });
    await ctx.db.insert("notifications", {
      userId: room.ownerId,
      type: "system",
      title: args.isOfficial ? "🏅 غرفتك أصبحت رسمية!" : "ℹ️ تغيير حالة الغرفة",
      body: args.isOfficial
        ? `تهانينا! تم تعيين غرفة "${room.name}" كغرفة رسمية 🎉`
        : `تم إلغاء الحالة الرسمية لغرفة "${room.name}"`,
      isRead: false,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

// ── Edit User Profile ─────────────────────────────────────────────────────
export const adminEditUserProfile = mutation({
  args: {
    targetUserId: v.id("users"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    country: v.optional(v.string()),
    goldCoins: v.optional(v.number()),
    diamonds: v.optional(v.number()),
    isVip: v.optional(v.boolean()),
    vipLevel: v.optional(v.number()),
    isPro: v.optional(v.boolean()),
    proLevel: v.optional(v.number()),
    isAgent: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    hideRoomPresence: v.optional(v.boolean()),
    isPrivateProfile: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const target = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!target) throw new Error("المستخدم غير موجود");
    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.bio !== undefined) patch.bio = args.bio;
    if (args.country !== undefined) patch.country = args.country;
    if (args.goldCoins !== undefined) patch.goldCoins = args.goldCoins;
    if (args.diamonds !== undefined) patch.diamonds = args.diamonds;
    if (args.isVip !== undefined) patch.isVip = args.isVip;
    if (args.vipLevel !== undefined) patch.vipLevel = args.vipLevel;
    if (args.isPro !== undefined) {
      patch.isPro = args.isPro;
      if (args.isPro) { patch.isVip = false; patch.vipLevel = 0; }
    }
    if (args.proLevel !== undefined) patch.proLevel = args.proLevel;
    if (args.isAgent !== undefined) patch.isAgent = args.isAgent;
    if (args.isActive !== undefined) patch.isActive = args.isActive;
    if ((args as any).hideRoomPresence !== undefined) patch.hideRoomPresence = (args as any).hideRoomPresence;
    if ((args as any).isPrivateProfile !== undefined) patch.isPrivateProfile = (args as any).isPrivateProfile;
    await ctx.db.patch(target._id, patch);
    return { success: true, targetName: target.name };
  },
});

// ── Edit Room ─────────────────────────────────────────────────────────────
export const adminEditRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    country: v.optional(v.string()),
    maxSeats: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    isOfficial: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.country !== undefined) patch.country = args.country;
    if (args.maxSeats !== undefined) patch.maxSeats = args.maxSeats;
    if (args.isFeatured !== undefined) patch.isFeatured = args.isFeatured;
    if (args.isOfficial !== undefined) patch.isOfficial = args.isOfficial;
    await ctx.db.patch(args.roomId, patch);
    return { success: true };
  },
});

// ── Send Report Decision ──────────────────────────────────────────────────
export const adminSendReportDecision = mutation({
  args: {
    reportId: v.id("userReports"),
    decision: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireSuperAdmin(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("البلاغ غير موجود");
    await ctx.db.patch(args.reportId, { status: args.decision });
    await ctx.db.insert("notifications", {
      userId: report.reporterId,
      type: "system",
      title: "📋 تحديث بلاغك",
      body: args.message ?? (args.decision === "resolved"
        ? "شكراً لإبلاغك! تم مراجعة بلاغك واتخاذ الإجراء المناسب ✅"
        : "تم مراجعة بلاغك من قِبل فريق الإدارة"),
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

// ── Admin: Change User Saki ID ────────────────────────────────────────────
export const adminChangeUserSakiId = mutation({
  args: {
    targetUserId: v.id("users"),
    newSakiId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    if (!args.newSakiId.trim()) throw new Error("المعرف لا يمكن أن يكون فارغاً");
    // Check uniqueness
    const existing = await ctx.db.query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", args.newSakiId.trim())).unique();
    if (existing && existing.userId !== args.targetUserId) throw new Error("هذا المعرف مستخدم بالفعل");
    const target = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!target) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(target._id, { sakiId: args.newSakiId.trim() });
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "system",
      title: "🆔 تم تغيير معرفك",
      body: `تم تغيير معرفك إلى #${args.newSakiId.trim()} من قِبل الإدارة`,
      isRead: false,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

// ── Admin: Change Room Numeric ID ─────────────────────────────────────────
export const adminChangeRoomId = mutation({
  args: {
    roomId: v.id("rooms"),
    newRoomNumericId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    if (!args.newRoomNumericId.trim()) throw new Error("معرف الغرفة لا يمكن أن يكون فارغاً");
    // Check uniqueness
    const allRooms = await ctx.db.query("rooms").collect();
    const existing = allRooms.find((r: any) => r.roomNumericId === args.newRoomNumericId.trim() && r._id !== args.roomId);
    if (existing) throw new Error("هذا المعرف مستخدم بالفعل");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    await ctx.db.patch(args.roomId, { roomNumericId: args.newRoomNumericId.trim() });
    return { success: true };
  },
});

// ── Admin: Pin / Unpin Room ───────────────────────────────────────────────
export const adminPinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    isPinned: v.boolean(),
    pinnedOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    await ctx.db.patch(args.roomId, {
      isPinned: args.isPinned,
      pinnedOrder: args.isPinned ? (args.pinnedOrder ?? 1) : undefined,
    });
    return { success: true };
  },
});

const PRO_COST = 2000000;

export const assignRole = mutation({
  args: {
    targetUserId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("bd"), v.literal("superadmin")),
    action: v.union(v.literal("assign"), v.literal("remove")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireSuperAdmin(ctx);
    
    const targetProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!targetProfile) throw new Error("الملف الشخصي للمستخدم غير موجود");

    const patch: any = {};
    const isAssign = args.action === "assign";

    if (args.role === "admin") {
      patch.isAdmin = isAssign;
      if (isAssign) {
        patch.adminTitle = "ADMIN";
        patch.adminTitleColor1 = "#f59e0b";
        patch.adminTitleColor2 = "#f97316";
      } else {
        patch.adminTitle = undefined;
        patch.adminTitleColor1 = undefined;
        patch.adminTitleColor2 = undefined;
      }
    } else if (args.role === "bd") {
      patch.isBd = isAssign;
      if (isAssign) {
        patch.bdAssignedAt = Date.now();
        patch.adminTitle = "BD";
        patch.adminTitleColor1 = "#06b6d4";
        patch.adminTitleColor2 = "#2563eb";
      } else {
        patch.adminTitle = undefined;
        patch.adminTitleColor1 = undefined;
        patch.adminTitleColor2 = undefined;
      }
    } else if (args.role === "superadmin") {
      patch.isSuperAdmin = isAssign;
      if (isAssign) {
        patch.adminTitle = "SUPER ADMIN";
        patch.adminTitleColor1 = "#fbbf24";
        patch.adminTitleColor2 = "#a855f7";
      } else {
        patch.adminTitle = undefined;
        patch.adminTitleColor1 = undefined;
        patch.adminTitleColor2 = undefined;
      }
    }

    await ctx.db.patch(targetProfile._id, patch);

    // إضافة سجل في لوحة التحكم
    await ctx.db.insert("securityLogs", {
      userId,
      eventType: `role_${args.action}`,
      details: `${args.action} ${args.role} to user ${targetProfile.name} (${targetProfile.sakiId})`,
      severity: "medium",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const purchasePro = mutation({
  args: {
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    if ((profile.goldCoins ?? 0) < PRO_COST) {
      throw new Error("رصيد غير كافٍ. سعر اشتراك PRO هو 2,000,000 عملة");
    }

    const currentProExpiresAt = profile.proExpiresAt ?? Date.now();
    const newExpiresAt = Math.max(currentProExpiresAt, Date.now()) + (args.durationDays * 24 * 60 * 60 * 1000);

    await ctx.db.patch(profile._id, {
      goldCoins: profile.goldCoins! - PRO_COST,
      isPro: true,
      proLevel: profile.proLevel ?? 1,
      proExpiresAt: newExpiresAt,
      isVip: true,
      vipLevel: profile.proLevel ?? 1,
      vipExpiresAt: newExpiresAt,
      proSettings: profile.proSettings ?? { glowingName: true, lionEntry: true, antiKick: true, privateProfile: false, hideRoomPresence: false },
      activeFrameId: "pro_saki_frame",
      activeBubbleId: "pro_saki_bubble",
      activeEntryId: "pro_saki_lion_entry",
    });

    await ctx.db.insert("notifications", {
      userId,
      type: "pro_upgrade",
      title: "🚀 مبروك! أصبحت مستخدم PRO",
      body: "لقد حصلت على مميزات PRO الحصرية: اسم لامع، إطار PRO SAKI، فقاعة دردشة فاخرة، ودخولية الأسد المرعبة!",
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true, expiresAt: newExpiresAt };
  },
});

export const configureWelcomePackage = mutation({
  args: {
    giftIds: v.array(v.id("customGifts")),
    frameId: v.optional(v.union(v.id("storeItems"), v.string())),
    goldCoins: v.number(),
    aristocracyLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireSuperAdmin(ctx);
    
    const existing = await ctx.db.query("welcomePackages").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    } else {
      await ctx.db.insert("welcomePackages", {
        name: "Default Welcome Package",
        ...args,
        isActive: true,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }

    return { success: true };
  },
});

export const getWelcomePackage = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("welcomePackages").first();
  },
});
