// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const DIAMOND_TO_COINS_RATE = 100;
const DIAMOND_WITHDRAWAL_RATE = 120000;
const VALID_DIAMOND_TIERS = [120000, 240000, 360000, 480000, 600000, 720000];

function calcFamilyLevel(totalDiamonds: number): number {
  if (totalDiamonds < 5000) return 0;
  const thresholds = [5000,15000,35000,75000,155000,315000,635000,1275000,2555000,5115000];
  let level = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (totalDiamonds >= thresholds[i]) level = i + 1;
    else break;
  }
  return level;
}

function getFamilyLevelName(level: number): string {
  const names = ["مبتدئ","برونزي","فضي","ذهبي","بلاتيني","ماسي","ملكي","أسطوري","خرافي","إلهي","أبدي"];
  return names[level] ?? "أبدي";
}

function getFamilyLevelThresholds(): number[] {
  return [0, 5000, 15000, 35000, 75000, 155000, 315000, 635000, 1275000, 2555000, 5115000];
}

async function generateAginsId(ctx: any): Promise<string> {
  const allFamilies = await ctx.db.query("families").collect();
  const usedIds = new Set(allFamilies.map((f: any) => f.aginsId).filter(Boolean));
  let id = 6816 + allFamilies.length;
  while (usedIds.has(String(id))) { id++; }
  return String(id);
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ── إنشاء طلب عائلة (يحتاج موافقة السوبر أدمن) ──────────────────────────────
export const createFamily = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    if (!profile.isActive) throw new Error("حسابك غير مفعّل");
    const existing = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (existing) throw new Error("أنت بالفعل عضو في عائلة");
    const existingReq = await ctx.db.query("familyCreationRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc").first();
    if (existingReq && existingReq.status === "pending") {
      throw new Error("لديك طلب إنشاء عائلة معلق بانتظار موافقة الإدارة");
    }
    let avatarUrl = args.avatarUrl;
    if (args.avatarStorageId) {
      avatarUrl = await ctx.storage.getUrl(args.avatarStorageId) ?? undefined;
    }
    await ctx.db.insert("familyCreationRequests", {
      userId,
      name: args.name,
      description: args.description,
      avatarStorageId: args.avatarStorageId,
      avatarUrl,
      country: profile.country,
      status: "pending",
      createdAt: Date.now(),
    });
    return { pending: true };
  },
});

// ── جلب طلب إنشاء العائلة الخاص بالمستخدم ──────────────────────────────────
export const getMyFamilyCreationRequest = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.query("familyCreationRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc").first();
  },
});

// ── جلب طلبات إنشاء العائلات للأدمن ─────────────────────────────────────────
export const adminGetFamilyCreationRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const requests = await ctx.db.query("familyCreationRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return await Promise.all(requests.map(async (r) => {
      const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.userId)).unique();
      return { ...r, requesterName: p?.name ?? "مجهول", requesterSakiId: p?.sakiId ?? "" };
    }));
  },
});

// ── موافقة/رفض طلب إنشاء عائلة (سوبر أدمن فقط) ─────────────────────────────
export const adminRespondFamilyRequest = mutation({
  args: {
    requestId: v.id("familyCreationRequests"),
    approve: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("فقط السوبر أدمن يمكنه الموافقة");
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") throw new Error("الطلب غير موجود أو تمت معالجته");
    if (args.approve) {
      const existing = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", request.userId)).unique();
      if (existing) throw new Error("المستخدم بالفعل عضو في عائلة");
      const requesterProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", request.userId)).unique();
      const aginsId = await generateAginsId(ctx);
      const familyId = await ctx.db.insert("families", {
        name: request.name,
        ownerId: request.userId,
        description: request.description,
        avatarUrl: request.avatarUrl,
        avatarStorageId: request.avatarStorageId,
        totalDiamonds: 0,
        ownerDiamonds: 0,
        aginsId,
        country: request.country ?? requesterProfile?.country,
        createdAt: Date.now(),
      });
      await ctx.db.insert("familyMembers", {
        familyId,
        userId: request.userId,
        role: "owner",
        diamonds: 0,
        joinedAt: Date.now(),
      });
      if (requesterProfile) await ctx.db.patch(requesterProfile._id, { familyId });
      await ctx.db.insert("notifications", {
        userId: request.userId,
        type: "family_invite",
        title: "✅ تمت الموافقة على إنشاء عائلتك",
        body: `تمت الموافقة على إنشاء عائلة "${request.name}" بنجاح! يمكنك الآن إدارة عائلتك.`,
        isRead: false,
        actorUserId: userId,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert("notifications", {
        userId: request.userId,
        type: "family_invite",
        title: "❌ تم رفض طلب إنشاء العائلة",
        body: args.note
          ? `تم رفض طلب إنشاء عائلة "${request.name}". السبب: ${args.note}`
          : `تم رفض طلب إنشاء عائلة "${request.name}"`,
        isRead: false,
        actorUserId: userId,
        createdAt: Date.now(),
      });
    }
    await ctx.db.patch(args.requestId, {
      status: args.approve ? "approved" : "rejected",
      reviewedBy: userId,
      reviewNote: args.note,
    });
  },
});

export const getMyFamily = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership) return null;
    const family = await ctx.db.get(membership.familyId);
    if (!family) return null;
    const members = await ctx.db.query("familyMembers").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect();
    const membersWithProfiles = await Promise.all(members.map(async (m) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", m.userId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { ...m, profile: profile ? { ...profile, avatarUrl } : null };
    }));
    membersWithProfiles.sort((a, b) => {
      if (a.role === "owner") return -1;
      if (b.role === "owner") return 1;
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (b.role === "admin" && a.role !== "admin") return 1;
      return (b.diamonds ?? 0) - (a.diamonds ?? 0);
    });
    const pendingRequests = await ctx.db.query("familyJoinRequests")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))
      .collect();
    const pendingCount = pendingRequests.filter(r => r.status === "pending").length;

    const totalDiamonds = family.totalDiamonds ?? 0;
    const familyLevel = calcFamilyLevel(totalDiamonds);
    const thresholds = getFamilyLevelThresholds();
    const currentThreshold = thresholds[familyLevel] ?? 0;
    const nextThreshold = thresholds[familyLevel + 1] ?? thresholds[thresholds.length - 1];
    const levelProgress = nextThreshold > currentThreshold
      ? Math.min(100, Math.floor(((totalDiamonds - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
      : 100;

    const ownerRoom = await ctx.db.query("rooms").withIndex("by_owner", (q) => q.eq("ownerId", family.ownerId)).order("desc").first();
    let ownerRoomCoverUrl = ownerRoom?.coverUrl;
    if (ownerRoom?.coverStorageId && !ownerRoomCoverUrl) {
      ownerRoomCoverUrl = await ctx.storage.getUrl(ownerRoom.coverStorageId) ?? undefined;
    }

    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentGifts = await ctx.db.query("gifts")
      .withIndex("by_receiver", (q) => q.eq("receiverId", family.ownerId))
      .collect();
    const monthlyIncome = recentGifts
      .filter(g => g.createdAt >= oneMonthAgo)
      .reduce((sum, g) => sum + Math.floor(g.price * 0.7), 0);

    return {
      ...family,
      members: membersWithProfiles,
      myRole: membership.role,
      myDiamonds: membership.diamonds ?? 0,
      pendingCount,
      familyLevel,
      levelProgress,
      levelName: getFamilyLevelName(familyLevel),
      nextLevelDiamonds: nextThreshold,
      ownerRoom: ownerRoom ? { ...ownerRoom, coverUrl: ownerRoomCoverUrl } : null,
      monthlyIncome,
    };
  },
});

export const getFamilyByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", args.userId)).unique();
    if (!membership) return null;
    const family = await ctx.db.get(membership.familyId);
    if (!family) return null;
    return { ...family, role: membership.role };
  },
});

export const getFamilyById = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) return null;
    const members = await ctx.db.query("familyMembers").withIndex("by_family", (q) => q.eq("familyId", args.familyId)).collect();
    const membersWithProfiles = await Promise.all(members.map(async (m) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", m.userId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { ...m, profile: profile ? { ...profile, avatarUrl } : null };
    }));
    return { ...family, members: membersWithProfiles };
  },
});

export const listFamilies = query({
  args: {},
  handler: async (ctx) => {
    const families = await ctx.db.query("families").collect();
    const result = await Promise.all(families.map(async (f) => {
      const memberCount = (await ctx.db.query("familyMembers").withIndex("by_family", (q) => q.eq("familyId", f._id)).collect()).length;
      const ownerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", f.ownerId)).unique();
      let avatarUrl = ownerProfile?.avatarUrl;
      if (ownerProfile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(ownerProfile.avatarStorageId) ?? undefined;
      let familyAvatarUrl = f.avatarUrl;
      if (f.avatarStorageId && !familyAvatarUrl) familyAvatarUrl = await ctx.storage.getUrl(f.avatarStorageId) ?? undefined;
      const totalDiamonds = f.totalDiamonds ?? 0;
      const familyLevel = calcFamilyLevel(totalDiamonds);
      return { ...f, avatarUrl: familyAvatarUrl, memberCount, ownerName: ownerProfile?.name ?? "مجهول", ownerAvatarUrl: avatarUrl, familyLevel, levelName: getFamilyLevelName(familyLevel) };
    }));
    result.sort((a, b) => (b.totalDiamonds ?? 0) - (a.totalDiamonds ?? 0));
    return result;
  },
});

export const requestJoinFamily = mutation({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const existingMembership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (existingMembership) throw new Error("أنت بالفعل عضو في عائلة");
    const existingRequest = await ctx.db.query("familyJoinRequests")
      .withIndex("by_family_and_user", (q) => q.eq("familyId", args.familyId).eq("userId", userId))
      .unique();
    if (existingRequest && existingRequest.status === "pending") throw new Error("لديك طلب انضمام معلق بالفعل");
    if (existingRequest) {
      await ctx.db.patch(existingRequest._id, { status: "pending", createdAt: Date.now() });
    } else {
      await ctx.db.insert("familyJoinRequests", {
        familyId: args.familyId,
        userId,
        status: "pending",
        createdAt: Date.now(),
      });
    }
    return { success: true };
  },
});

export const getPendingJoinRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) return [];
    const requests = await ctx.db.query("familyJoinRequests")
      .withIndex("by_family", (q) => q.eq("familyId", membership.familyId))
      .collect();
    const pending = requests.filter(r => r.status === "pending");
    return await Promise.all(pending.map(async (r) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.userId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { ...r, profile: profile ? { ...profile, avatarUrl } : null };
    }));
  },
});

export const respondToJoinRequest = mutation({
  args: { requestId: v.id("familyJoinRequests"), approve: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) throw new Error("فقط المالك والمشرف يمكنهم قبول/رفض الطلبات");
    const request = await ctx.db.get(args.requestId);
    if (!request || request.familyId !== membership.familyId) throw new Error("الطلب غير موجود");
    if (request.status !== "pending") throw new Error("تم معالجة هذا الطلب مسبقاً");
    const family = await ctx.db.get(membership.familyId);
    if (args.approve) {
      const existingMembership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", request.userId)).unique();
      if (existingMembership) {
        await ctx.db.patch(request._id, { status: "rejected" });
        throw new Error("هذا المستخدم بالفعل عضو في عائلة أخرى");
      }
      await ctx.db.insert("familyMembers", {
        familyId: membership.familyId,
        userId: request.userId,
        role: "member",
        diamonds: 0,
        joinedAt: Date.now(),
      });
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", request.userId)).unique();
      if (profile) await ctx.db.patch(profile._id, { familyId: membership.familyId });
      await ctx.db.patch(request._id, { status: "approved" });
      await ctx.db.insert("notifications", {
        userId: request.userId,
        type: "family_invite",
        title: "✅ تم قبولك في العائلة",
        body: `تم قبول طلبك للانضمام إلى عائلة "${family?.name ?? ""}"`,
        isRead: false,
        actorUserId: userId,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.patch(request._id, { status: "rejected" });
      await ctx.db.insert("notifications", {
        userId: request.userId,
        type: "family_invite",
        title: "❌ تم رفض طلبك",
        body: `تم رفض طلبك للانضمام إلى عائلة "${family?.name ?? ""}"`,
        isRead: false,
        actorUserId: userId,
        createdAt: Date.now(),
      });
    }
  },
});

export const inviteToFamily = mutation({
  args: { targetSakiId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMembership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!myMembership) throw new Error("أنت لست عضواً في أي عائلة");
    if (myMembership.role !== "owner" && myMembership.role !== "admin") throw new Error("فقط المالك والمشرف يمكنهم دعوة أعضاء");
    const target = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId)).unique();
    if (!target) throw new Error("المستخدم غير موجود");
    const existingMembership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", target.userId)).unique();
    if (existingMembership) throw new Error("هذا المستخدم بالفعل عضو في عائلة");
    const family = await ctx.db.get(myMembership.familyId);
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.db.insert("familyMembers", {
      familyId: myMembership.familyId,
      userId: target.userId,
      role: "member",
      diamonds: 0,
      joinedAt: Date.now(),
    });
    await ctx.db.patch(target._id, { familyId: myMembership.familyId });
    await ctx.db.insert("notifications", {
      userId: target.userId,
      type: "family_invite",
      title: "👨‍👩‍👧‍👦 تمت إضافتك لعائلة",
      body: `قام ${myProfile?.name ?? "مستخدم"} بإضافتك إلى عائلة "${family?.name ?? ""}"`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });
    return { success: true, targetName: target.name };
  },
});

export const leaveFamily = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership) throw new Error("أنت لست عضواً في أي عائلة");
    if (membership.role === "owner") throw new Error("المالك لا يمكنه مغادرة العائلة. يمكنك حذف العائلة بدلاً من ذلك");
    await ctx.db.delete(membership._id);
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (profile) await ctx.db.patch(profile._id, { familyId: undefined });
  },
});

export const removeMemberFromFamily = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMembership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!myMembership || (myMembership.role !== "owner" && myMembership.role !== "admin")) throw new Error("غير مصرح");
    const targetMembership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!targetMembership || targetMembership.familyId !== myMembership.familyId) throw new Error("العضو غير موجود في عائلتك");
    if (targetMembership.role === "owner") throw new Error("لا يمكن إزالة المالك");
    await ctx.db.delete(targetMembership._id);
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (profile) await ctx.db.patch(profile._id, { familyId: undefined });
  },
});

export const deleteFamily = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership || membership.role !== "owner") throw new Error("فقط المالك يمكنه حذف العائلة");
    const allMembers = await ctx.db.query("familyMembers").withIndex("by_family", (q) => q.eq("familyId", membership.familyId)).collect();
    for (const m of allMembers) {
      await ctx.db.delete(m._id);
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", m.userId)).unique();
      if (profile) await ctx.db.patch(profile._id, { familyId: undefined });
    }
    const requests = await ctx.db.query("familyJoinRequests").withIndex("by_family", (q) => q.eq("familyId", membership.familyId)).collect();
    for (const r of requests) await ctx.db.delete(r._id);
    await ctx.db.delete(membership.familyId);
  },
});

export const updateFamily = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership || membership.role !== "owner") throw new Error("فقط المالك يمكنه تعديل العائلة");
    let avatarUrl = args.avatarUrl;
    if (args.avatarStorageId) {
      avatarUrl = await ctx.storage.getUrl(args.avatarStorageId) ?? undefined;
    }
    await ctx.db.patch(membership.familyId, {
      ...(args.name && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(args.avatarStorageId !== undefined && { avatarStorageId: args.avatarStorageId }),
    });
  },
});

export const setFamilyMemberRole = mutation({
  args: { targetUserId: v.id("users"), role: v.union(v.literal("admin"), v.literal("member")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMembership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!myMembership || myMembership.role !== "owner") throw new Error("فقط المالك يمكنه تغيير الأدوار");
    const targetMembership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!targetMembership || targetMembership.familyId !== myMembership.familyId) throw new Error("العضو غير موجود في عائلتك");
    if (targetMembership.role === "owner") throw new Error("لا يمكن تغيير دور المالك");
    await ctx.db.patch(targetMembership._id, { role: args.role });
  },
});

export const addFamilyDiamonds = mutation({
  args: {
    receiverUserId: v.id("users"),
    giftPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const receiverProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.receiverUserId)).unique();
    if (!receiverProfile?.familyId) return;
    const receiverMembership = await ctx.db.query("familyMembers")
      .withIndex("by_family_and_user", (q) => q.eq("familyId", receiverProfile.familyId!).eq("userId", args.receiverUserId))
      .unique();
    if (!receiverMembership) return;

    const diamondsEarned = Math.floor(args.giftPrice * 0.7);
    const newMemberDiamonds = (receiverMembership.diamonds ?? 0) + diamondsEarned;
    await ctx.db.patch(receiverMembership._id, { diamonds: newMemberDiamonds });
    await ctx.db.patch(receiverProfile._id, { diamonds: (receiverProfile.diamonds ?? 0) + diamondsEarned });

    const family = await ctx.db.get(receiverProfile.familyId!);
    if (family) {
      const newTotal = (family.totalDiamonds ?? 0) + diamondsEarned;
      const newLevel = calcFamilyLevel(newTotal);
      await ctx.db.patch(family._id, { totalDiamonds: newTotal, familyLevel: newLevel });
    }

    await ctx.db.insert("notifications", {
      userId: args.receiverUserId,
      type: "diamond_received",
      title: "💎 حصلت على ماس",
      body: `حصلت على ${diamondsEarned.toLocaleString()} 💎 من هدية. إجمالي ماسك: ${((receiverProfile.diamonds ?? 0) + diamondsEarned).toLocaleString()} 💎`,
      isRead: false,
      createdAt: Date.now(),
    });

    const ownerBonus = Math.floor(diamondsEarned * 0.1);
    if (ownerBonus > 0 && family) {
      const ownerMembership = await ctx.db.query("familyMembers")
        .withIndex("by_family_and_user", (q) => q.eq("familyId", receiverProfile.familyId!).eq("userId", family.ownerId))
        .unique();
      if (ownerMembership && ownerMembership.userId !== args.receiverUserId) {
        await ctx.db.patch(ownerMembership._id, { diamonds: (ownerMembership.diamonds ?? 0) + ownerBonus });
        const ownerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", family.ownerId)).unique();
        if (ownerProfile) {
          await ctx.db.patch(ownerProfile._id, { diamonds: (ownerProfile.diamonds ?? 0) + ownerBonus });
        }
        await ctx.db.patch(family._id, { ownerDiamonds: (family.ownerDiamonds ?? 0) + ownerBonus });
      }
    }
  },
});

export const withdrawDiamondsToAgent = mutation({
  args: {
    agentSakiId: v.string(),
    diamonds: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    if (!VALID_DIAMOND_TIERS.includes(args.diamonds)) {
      throw new Error(`الكمية يجب أن تكون إحدى القيم: ${VALID_DIAMOND_TIERS.map(t => t.toLocaleString()).join("، ")} ماسة`);
    }

    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile) throw new Error("الملف الشخصي غير موجود");

    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership) throw new Error("يجب أن تكون عضواً في عائلة للسحب");
    if (membership.role !== "owner" && membership.role !== "admin") throw new Error("السحب متاح للمالك والمضيفين فقط");

    const myDiamonds = myProfile.diamonds ?? 0;
    if (myDiamonds < args.diamonds) throw new Error(`ليس لديك كافٍ من الماس. لديك ${myDiamonds.toLocaleString()} ماسة`);

    const agentProfile = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.agentSakiId)).unique();
    if (!agentProfile) throw new Error("الوكيل غير موجود");
    if (!agentProfile.isAgent && !agentProfile.isSuperAdmin) throw new Error("هذا المستخدم ليس وكيل شحن");

    await ctx.db.patch(myProfile._id, { diamonds: myDiamonds - args.diamonds });
    await ctx.db.patch(membership._id, { diamonds: Math.max(0, (membership.diamonds ?? 0) - args.diamonds) });

    await ctx.db.insert("diamondSales", {
      sellerId: userId,
      agentId: agentProfile.userId,
      diamonds: args.diamonds,
      coinsReceived: 0,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: agentProfile.userId,
      type: "diamond_received",
      title: "💎 استقبلت ماساً للسحب",
      body: `أرسل لك ${myProfile.name} ${args.diamonds.toLocaleString()} ماسة للسحب`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId,
      type: "diamond_received",
      title: "✅ تم إرسال طلب السحب",
      body: `تم إرسال ${args.diamonds.toLocaleString()} ماسة للوكيل ${agentProfile.name}. سيتواصل معك الوكيل قريباً`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true, agentName: agentProfile.name };
  },
});

export const getMyDiamondSales = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("diamondSales").withIndex("by_seller", (q) => q.eq("sellerId", userId)).order("desc").take(50);
  },
});

export const getOwnerProfitReport = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership || membership.role !== "owner") return null;
    const family = await ctx.db.get(membership.familyId);
    if (!family) return null;
    const members = await ctx.db.query("familyMembers").withIndex("by_family", (q) => q.eq("familyId", membership.familyId)).collect();
    const membersData = await Promise.all(members.filter(m => m.role !== "owner").map(async (m) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", m.userId)).unique();
      return {
        name: profile?.name ?? "مجهول",
        sakiId: profile?.sakiId ?? "",
        role: m.role,
        diamonds: m.diamonds ?? 0,
        ownerShare: Math.floor((m.diamonds ?? 0) * 0.1),
      };
    }));
    membersData.sort((a, b) => b.diamonds - a.diamonds);
    return {
      familyName: family.name,
      totalFamilyDiamonds: family.totalDiamonds ?? 0,
      ownerTotalDiamonds: membership.diamonds ?? 0,
      ownerDiamondsFromMembers: family.ownerDiamonds ?? 0,
      members: membersData,
    };
  },
});

export const getMyJoinRequestStatus = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const request = await ctx.db.query("familyJoinRequests")
      .withIndex("by_family_and_user", (q) => q.eq("familyId", args.familyId).eq("userId", userId))
      .unique();
    return request?.status ?? null;
  },
});

export const getMyFamilyMemberInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const membership = await ctx.db.query("familyMembers").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    const myDiamonds = membership.diamonds ?? 0;
    const withdrawalTiers = [120000, 240000, 360000, 480000, 600000, 720000];
    const availableTier = withdrawalTiers.filter(t => myDiamonds >= t);
    const maxWithdrawable = availableTier.length > 0 ? availableTier[availableTier.length - 1] : 0;
    const dollarValue = (maxWithdrawable / 120000) * 10;
    return {
      role: membership.role,
      diamonds: myDiamonds,
      seatHours: membership.seatHours ?? 0,
      activeDays: membership.activeDays ?? 0,
      joinedAt: membership.joinedAt,
      isAgent: profile?.isAgent ?? false,
      isSuperAdmin: profile?.isSuperAdmin ?? false,
      maxWithdrawable,
      dollarValue,
      withdrawalTiers,
    };
  },
});

export const getFamilyTopMembers = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const members = await ctx.db.query("familyMembers").withIndex("by_family", (q) => q.eq("familyId", args.familyId)).collect();
    const membersData = await Promise.all(members.map(async (m) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", m.userId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return {
        userId: m.userId,
        name: profile?.name ?? "مجهول",
        sakiId: profile?.sakiId ?? "",
        avatarUrl,
        diamonds: m.diamonds ?? 0,
        totalCoinsSent: profile?.totalCoinsSent ?? 0,
        totalCoinsReceived: profile?.totalCoinsReceived ?? 0,
        role: m.role,
      };
    }));
    const topSenders = [...membersData].sort((a, b) => b.totalCoinsSent - a.totalCoinsSent).slice(0, 3);
    const topReceivers = [...membersData].sort((a, b) => b.diamonds - a.diamonds).slice(0, 3);
    return { topSenders, topReceivers };
  },
});

export const getMyWithdrawalHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const sales = await ctx.db.query("diamondSales")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc")
      .take(30);
    return await Promise.all(sales.map(async (s) => {
      const agentProfile = s.agentId
        ? await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", s.agentId!)).unique()
        : null;
      return { ...s, agentName: agentProfile?.name ?? "مجهول", agentSakiId: agentProfile?.sakiId ?? "" };
    }));
  },
});

export const listAgentsForFamily = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    const agents = profiles.filter(p => p.isAgent || p.isSuperAdmin);
    return agents.map(a => ({
      _id: a._id,
      name: a.name,
      sakiId: a.sakiId,
      avatarUrl: a.avatarUrl,
    }));
  },
});
