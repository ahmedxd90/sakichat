// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// نسبة المضيف من الهدايا
const HOST_DIAMOND_RATE = 0.7;

// جدول مستويات السحب
const WITHDRAWAL_TIERS = [
  { diamonds: 1200000,  usd: 10  },
  { diamonds: 2400000,  usd: 20  },
  { diamonds: 3600000,  usd: 30  },
  { diamonds: 4800000,  usd: 40  },
  { diamonds: 6000000,  usd: 50  },
  { diamonds: 7200000,  usd: 60  },
  { diamonds: 8400000,  usd: 70  },
  { diamonds: 9600000,  usd: 80  },
  { diamonds: 10800000, usd: 90  },
  { diamonds: 12000000, usd: 100 },
];

// معدل تحويل الألماس إلى كوين
const DIAMOND_TO_COINS_RATE = 0.1;

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// توليد aginsId عشوائي 5 أرقام فريد
async function generateUniqueAginsId(ctx: any): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = String(Math.floor(10000 + Math.random() * 90000));
    const existing = await ctx.db.query("hostAgencies")
      .withIndex("by_aginsId", (q: any) => q.eq("aginsId", id)).first();
    if (!existing) return id;
  }
  throw new Error("فشل توليد معرف فريد، حاول مرة أخرى");
}

// ── إنشاء وكالة مضيفين (قيد المراجعة) ──────────────────────────────────────
export const createAgency = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    // تحقق أنه ليس عضواً في وكالة أخرى
    const existingMember = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (existingMember) throw new Error("أنت بالفعل عضو في وكالة مضيفين");

    // تحقق أنه لا يملك وكالة (بما فيها المعلقة)
    const existingOwner = await ctx.db.query("hostAgencies")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId)).first();
    if (existingOwner) throw new Error("لديك وكالة مضيفين بالفعل أو طلب قيد المراجعة");

    let logoUrl: string | undefined;
    if (args.logoStorageId) {
      logoUrl = await ctx.storage.getUrl(args.logoStorageId) ?? undefined;
    }

    const aginsId = await generateUniqueAginsId(ctx);

    const agencyId = await ctx.db.insert("hostAgencies", {
      name: args.name,
      description: args.description,
      ownerId: userId,
      logoStorageId: args.logoStorageId,
      logoUrl,
      country: args.country ?? profile.country,
      totalDiamonds: 0,
      memberCount: 0,
      isActive: false,
      aginsId,
      status: "pending",
      createdAt: Date.now(),
    });

    return agencyId;
  },
});

// ── موافقة السوبر أدمن على وكالة ────────────────────────────────────────────
export const approveAgency = mutation({
  args: { agencyId: v.id("hostAgencies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("ليس لديك صلاحية");

    const agency = await ctx.db.get(args.agencyId);
    if (!agency) throw new Error("الوكالة غير موجودة");

    await ctx.db.patch(args.agencyId, {
      status: "active",
      isActive: true,
      reviewedBy: userId,
      reviewedAt: Date.now(),
    });

    // أضف المالك كعضو بدور owner إذا لم يكن موجوداً
    const existingMember = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", agency.ownerId)).unique();
    if (!existingMember) {
      await ctx.db.insert("hostAgencyMembers", {
        agencyId: args.agencyId,
        userId: agency.ownerId,
        role: "owner",
        totalDiamonds: 0,
        pendingDiamonds: 0,
        withdrawnDiamonds: 0,
        joinedAt: Date.now(),
      });
      await ctx.db.patch(args.agencyId, { memberCount: 1 });
      // No need to set familyId on profile for agency owners
    }

    await ctx.db.insert("notifications", {
      userId: agency.ownerId,
      type: "agency_approved",
      title: "✅ تمت الموافقة على وكالتك",
      body: `تمت الموافقة على وكالة "${agency.name}" - معرف الوكالة: ${agency.aginsId}`,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// ── رفض وكالة ───────────────────────────────────────────────────────────────
export const rejectAgency = mutation({
  args: { agencyId: v.id("hostAgencies"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("ليس لديك صلاحية");

    const agency = await ctx.db.get(args.agencyId);
    if (!agency) throw new Error("الوكالة غير موجودة");

    // Send notification before deleting
    await ctx.db.insert("notifications", {
      userId: agency.ownerId,
      type: "agency_rejected",
      title: "❌ تم رفض طلب وكالتك",
      body: args.reason
        ? `تم رفض وكالة "${agency.name}": ${args.reason}`
        : `تم رفض طلب إنشاء وكالة "${agency.name}"`,
      isRead: false,
      createdAt: Date.now(),
    });

    // Delete the agency record so the owner can re-apply
    await ctx.db.delete(args.agencyId);
  },
});

// ── جلب طلبات الوكالات المعلقة (للسوبر أدمن) ────────────────────────────────
export const getPendingAgencies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const agencies = await ctx.db.query("hostAgencies")
      .withIndex("by_status", (q) => q.eq("status", "pending")).collect();
    return await Promise.all(agencies.map(async (a) => {
      let logoUrl = a.logoUrl;
      if (a.logoStorageId && !logoUrl) logoUrl = await ctx.storage.getUrl(a.logoStorageId) ?? undefined;
      const ownerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", a.ownerId)).unique();
      let ownerAvatarUrl = ownerProfile?.avatarUrl;
      if (ownerProfile?.avatarStorageId && !ownerAvatarUrl) ownerAvatarUrl = await ctx.storage.getUrl(ownerProfile.avatarStorageId) ?? undefined;
      return { ...a, logoUrl, ownerName: ownerProfile?.name ?? "مجهول", ownerSakiId: ownerProfile?.sakiId ?? "", ownerAvatarUrl };
    }));
  },
});

// ── إدارة الوكالات للمشرف ────────────────────────────────────────────────────
async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!profile?.isSuperAdmin) throw new Error("ليس لديك صلاحية");
  return userId;
}

export const listAllAgenciesForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const agencies = await ctx.db.query("hostAgencies").collect();
    return await Promise.all(agencies.map(async (agency: any) => {
      const owner = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", agency.ownerId)).unique();
      const members = await ctx.db.query("hostAgencyMembers").withIndex("by_agency", (q: any) => q.eq("agencyId", agency._id)).collect();
      const logoUrl = agency.logoStorageId ? (await ctx.storage.getUrl(agency.logoStorageId) ?? agency.logoUrl) : agency.logoUrl;
      return { ...agency, logoUrl, ownerName: owner?.name ?? agency.ownerName ?? "مجهول", ownerSakiId: owner?.sakiId ?? "", memberCount: members.length || agency.memberCount || 0 };
    }));
  },
});

export const banAgency = mutation({
  args: { agencyId: v.id("hostAgencies"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const adminId = await requireSuperAdmin(ctx);
    const agency = await ctx.db.get(args.agencyId);
    if (!agency) throw new Error("الوكالة غير موجودة");
    await ctx.db.patch(args.agencyId, { isBanned: true, status: "banned", isActive: false, bannedAt: Date.now(), bannedBy: adminId, banReason: args.reason });
    const members = await ctx.db.query("hostAgencyMembers").withIndex("by_agency", (q: any) => q.eq("agencyId", args.agencyId)).collect();
    const recipients = Array.from(new Set([agency.ownerId, ...members.map((m: any) => m.userId)]));
    for (const userId of recipients) {
      await ctx.db.insert("notifications", { userId, type: "agency_banned", title: "🚫 تم حظر وكالة المضيفين", body: args.reason ? `تم حظر وكالة "${agency.name}". السبب: ${args.reason}` : `تم حظر وكالة "${agency.name}" من الإدارة.`, isRead: false, createdAt: Date.now() });
    }
    return true;
  },
});

export const deleteAgency = mutation({
  args: { agencyId: v.id("hostAgencies"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const agency = await ctx.db.get(args.agencyId);
    if (!agency) throw new Error("الوكالة غير موجودة");
    const members = await ctx.db.query("hostAgencyMembers").withIndex("by_agency", (q: any) => q.eq("agencyId", args.agencyId)).collect();
    const requests = await ctx.db.query("hostAgencyJoinRequests").withIndex("by_agency", (q: any) => q.eq("agencyId", args.agencyId)).collect();
    const recipients = Array.from(new Set([agency.ownerId, ...members.map((m: any) => m.userId)]));
    for (const userId of recipients) {
      await ctx.db.insert("notifications", { userId, type: "agency_deleted", title: "🗑️ تم حذف وكالة المضيفين", body: args.reason ? `تم حذف وكالة "${agency.name}". السبب: ${args.reason}` : `تم حذف وكالة "${agency.name}" من النظام.`, isRead: false, createdAt: Date.now() });
    }
    for (const member of members) await ctx.db.delete(member._id);
    for (const request of requests) await ctx.db.delete(request._id);
    await ctx.db.delete(args.agencyId);
    return true;
  },
});

// ── جلب وكالتي ──────────────────────────────────────────────────────────────
export const getMyAgency = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // تحقق من وجود عضوية نشطة
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();

    // إذا لم يكن عضواً، تحقق إذا كان مالك وكالة معلقة أو مرفوضة
    if (!membership) {
      const ownedAgency = await ctx.db.query("hostAgencies")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId)).first();
      if (ownedAgency && ownedAgency.status === "pending") {
        let logoUrl = ownedAgency.logoUrl;
        if (ownedAgency.logoStorageId && !logoUrl) logoUrl = await ctx.storage.getUrl(ownedAgency.logoStorageId) ?? undefined;
        return { ...ownedAgency, logoUrl, members: [], myRole: "owner", myDiamonds: 0, myPendingDiamonds: 0, pendingCount: 0 };
      }
      return null;
    }

    const agency = await ctx.db.get(membership.agencyId);
    if (!agency) return null;

    let logoUrl = agency.logoUrl;
    if (agency.logoStorageId && !logoUrl) {
      logoUrl = await ctx.storage.getUrl(agency.logoStorageId) ?? undefined;
    }

    if (agency.isBanned || agency.status === "banned") {
      return { ...agency, logoUrl, isBanned: true, members: [], myRole: membership.role, myDiamonds: membership.totalDiamonds ?? 0, myPendingDiamonds: membership.pendingDiamonds ?? 0, pendingCount: 0 };
    }

    const members = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id)).collect();

    const membersWithProfiles = await Promise.all(members.map(async (m) => {
      const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", m.userId)).unique();
      let avatarUrl = p?.avatarUrl;
      if (p?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(p.avatarStorageId) ?? undefined;
      return { ...m, profile: p ? { ...p, avatarUrl } : null };
    }));

    membersWithProfiles.sort((a, b) => {
      if (a.role === "owner") return -1;
      if (b.role === "owner") return 1;
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (b.role === "admin" && a.role !== "admin") return 1;
      return (b.totalDiamonds ?? 0) - (a.totalDiamonds ?? 0);
    });

    const pendingRequests = await ctx.db.query("hostAgencyJoinRequests")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id)).collect();
    const pendingCount = pendingRequests.filter(r => r.status === "pending").length;

    return {
      ...agency,
      logoUrl,
      members: membersWithProfiles,
      myRole: membership.role,
      myDiamonds: membership.totalDiamonds ?? 0,
      myPendingDiamonds: membership.pendingDiamonds ?? 0,
      pendingCount,
    };
  },
});

// ── جلب معلومات عضويتي ──────────────────────────────────────────────────────
export const getMyMembership = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership) return null;
    const agency = await ctx.db.get(membership.agencyId);
    if (!agency) return null;
    let logoUrl = agency.logoUrl;
    if (agency.logoStorageId && !logoUrl) {
      logoUrl = await ctx.storage.getUrl(agency.logoStorageId) ?? undefined;
    }
    return { ...membership, agencyName: agency.name, agencyLogoUrl: logoUrl };
  },
});

// ── قائمة الوكالات (النشطة فقط) ─────────────────────────────────────────────
export const listAgencies = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const agencies = await ctx.db.query("hostAgencies").collect();
    // عرض الوكالات النشطة فقط
    const activeAgencies = agencies.filter(a => a.status === "active" || a.isActive);
    const result = await Promise.all(activeAgencies.map(async (a) => {
      let logoUrl = a.logoUrl;
      if (a.logoStorageId && !logoUrl) logoUrl = await ctx.storage.getUrl(a.logoStorageId) ?? undefined;
      const ownerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", a.ownerId)).unique();
      let ownerAvatarUrl = ownerProfile?.avatarUrl;
      if (ownerProfile?.avatarStorageId && !ownerAvatarUrl) ownerAvatarUrl = await ctx.storage.getUrl(ownerProfile.avatarStorageId) ?? undefined;
      return {
        ...a,
        logoUrl,
        ownerName: ownerProfile?.name ?? "مجهول",
        ownerAvatarUrl,
        memberCount: a.memberCount ?? 0,
      };
    }));
    if (args.search) {
      const q = args.search.toLowerCase();
      return result.filter(a => a.name.toLowerCase().includes(q) || a.ownerName.toLowerCase().includes(q));
    }
    return result.sort((a, b) => (b.totalDiamonds ?? 0) - (a.totalDiamonds ?? 0));
  },
});

// ── طلب الانضمام لوكالة ─────────────────────────────────────────────────────
export const requestJoinAgency = mutation({
  args: { agencyId: v.id("hostAgencies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const existing = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (existing) throw new Error("أنت بالفعل عضو في وكالة");
    const targetAgency = await ctx.db.get(args.agencyId);
    if (!targetAgency || targetAgency.isBanned || targetAgency.status === "banned" || (!targetAgency.isActive && targetAgency.status !== "active")) throw new Error("هذه الوكالة غير متاحة للانضمام");
    const existingReq = await ctx.db.query("hostAgencyJoinRequests")
      .withIndex("by_agency_and_user", (q) => q.eq("agencyId", args.agencyId).eq("userId", userId)).unique();
    if (existingReq && existingReq.status === "pending") throw new Error("لديك طلب انضمام معلق");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.db.insert("hostAgencyJoinRequests", {
      agencyId: args.agencyId,
      userId,
      userName: profile?.name ?? "مجهول",
      userSakiId: profile?.sakiId ?? "",
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// ── الرد على طلب الانضمام ───────────────────────────────────────────────────
export const respondToJoinRequest = mutation({
  args: {
    requestId: v.id("hostAgencyJoinRequests"),
    approve: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") throw new Error("الطلب غير موجود");
    const agency = await ctx.db.get(request.agencyId);
    if (!agency) throw new Error("الوكالة غير موجودة");
    const myMembership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_agency_and_user", (q) => q.eq("agencyId", agency._id).eq("userId", userId)).unique();
    if (!myMembership || (myMembership.role !== "owner" && myMembership.role !== "admin")) {
      throw new Error("ليس لديك صلاحية");
    }
    await ctx.db.patch(args.requestId, { status: args.approve ? "approved" : "rejected" });
    if (args.approve) {
      const existing = await ctx.db.query("hostAgencyMembers")
        .withIndex("by_user", (q) => q.eq("userId", request.userId)).unique();
      if (!existing) {
        await ctx.db.insert("hostAgencyMembers", {
          agencyId: agency._id,
          userId: request.userId,
          role: "host",
          totalDiamonds: 0,
          pendingDiamonds: 0,
          withdrawnDiamonds: 0,
          joinedAt: Date.now(),
        });
        await ctx.db.patch(agency._id, { memberCount: (agency.memberCount ?? 0) + 1 });
        // Do NOT set familyId on profile - hostAgencies is not families table
        await ctx.db.insert("notifications", {
          userId: request.userId,
          type: "agency_join",
          title: "✅ تم قبولك في الوكالة",
          body: `تم قبول طلبك للانضمام إلى وكالة "${agency.name}"`,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

// ── إزالة عضو من الوكالة ────────────────────────────────────────────────────
export const removeMember = mutation({
  args: { memberId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMembership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!myMembership || (myMembership.role !== "owner" && myMembership.role !== "admin")) {
      throw new Error("ليس لديك صلاحية");
    }
    const targetMembership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_agency_and_user", (q) => q.eq("agencyId", myMembership.agencyId).eq("userId", args.memberId)).unique();
    if (!targetMembership) throw new Error("العضو غير موجود");
    if (targetMembership.role === "owner") throw new Error("لا يمكن إزالة المالك");
    await ctx.db.delete(targetMembership._id);
    const agency = await ctx.db.get(myMembership.agencyId);
    if (agency) await ctx.db.patch(agency._id, { memberCount: Math.max(0, (agency.memberCount ?? 1) - 1) });
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.memberId)).unique();
    if (profile) await ctx.db.patch(profile._id, { familyId: undefined });
  },
});

// ── مغادرة الوكالة ──────────────────────────────────────────────────────────
export const leaveAgency = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership) throw new Error("لست عضواً في أي وكالة");
    if (membership.role === "owner") throw new Error("المالك لا يمكنه المغادرة، يمكنك حذف الوكالة");
    const agency = await ctx.db.get(membership.agencyId);
    await ctx.db.delete(membership._id);
    if (agency) await ctx.db.patch(agency._id, { memberCount: Math.max(0, (agency.memberCount ?? 1) - 1) });
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (profile) await ctx.db.patch(profile._id, { familyId: undefined });
  },
});

// ── تحديث معلومات الوكالة ───────────────────────────────────────────────────
export const updateAgency = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership || membership.role !== "owner") throw new Error("فقط المالك يمكنه التعديل");
    const updates: any = {};
    if (args.name) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.logoStorageId) {
      updates.logoStorageId = args.logoStorageId;
      updates.logoUrl = await ctx.storage.getUrl(args.logoStorageId) ?? undefined;
    }
    await ctx.db.patch(membership.agencyId, updates);
  },
});

// ── تعيين دور عضو ───────────────────────────────────────────────────────────
export const setMemberRole = mutation({
  args: { memberId: v.id("users"), role: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMembership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!myMembership || myMembership.role !== "owner") throw new Error("فقط المالك يمكنه تعيين الأدوار");
    const targetMembership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_agency_and_user", (q) => q.eq("agencyId", myMembership.agencyId).eq("userId", args.memberId)).unique();
    if (!targetMembership) throw new Error("العضو غير موجود");
    await ctx.db.patch(targetMembership._id, { role: args.role });
  },
});

// ── إضافة ألماس للمضيف (يُستدعى عند إرسال هدية) ────────────────────────────
export const addDiamondsToHost = mutation({
  args: {
    hostUserId: v.id("users"),
    giftCoins: v.number(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.hostUserId)).unique();
    if (!membership) return;
    const diamonds = Math.floor(args.giftCoins * HOST_DIAMOND_RATE);
    await ctx.db.patch(membership._id, {
      totalDiamonds: (membership.totalDiamonds ?? 0) + diamonds,
      pendingDiamonds: (membership.pendingDiamonds ?? 0) + diamonds,
    });
    const agency = await ctx.db.get(membership.agencyId);
    if (agency) {
      await ctx.db.patch(agency._id, {
        totalDiamonds: (agency.totalDiamonds ?? 0) + diamonds,
      });
    }
  },
});

// ── طلب سحب ─────────────────────────────────────────────────────────────────
export const requestWithdrawal = mutation({
  args: {
    diamonds: v.number(),
    method: v.string(),
    accountInfo: v.string(),
    whatsapp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership) throw new Error("لست عضواً في أي وكالة");

    const tier = WITHDRAWAL_TIERS.find(t => t.diamonds === args.diamonds);
    if (!tier) throw new Error("مستوى السحب غير صحيح");
    if ((membership.pendingDiamonds ?? 0) < args.diamonds) {
      throw new Error(`ألماسك غير كافٍ. لديك ${membership.pendingDiamonds ?? 0} ألماس`);
    }

    const pendingWithdrawal = await ctx.db.query("hostWithdrawals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc").first();
    if (pendingWithdrawal && pendingWithdrawal.status === "pending") {
      throw new Error("لديك طلب سحب معلق بانتظار المعالجة");
    }

    await ctx.db.patch(membership._id, {
      pendingDiamonds: (membership.pendingDiamonds ?? 0) - args.diamonds,
      withdrawnDiamonds: (membership.withdrawnDiamonds ?? 0) + args.diamonds,
    });

    // تحويل الألماس إلى حساب saki_id1000 (حساب السحوبات المركزي)
    const centralProfile = await ctx.db.query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", "1000")).unique();
    if (centralProfile) {
      await ctx.db.patch(centralProfile._id, {
        diamonds: (centralProfile.diamonds ?? 0) + args.diamonds,
      });
    }

    await ctx.db.insert("hostWithdrawals", {
      userId,
      agencyId: membership.agencyId,
      diamonds: args.diamonds,
      usdAmount: tier.usd,
      method: args.method,
      accountInfo: args.accountInfo,
      whatsapp: args.whatsapp,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// ── تحويل ألماس إلى كوين ────────────────────────────────────────────────────
export const convertDiamondsToCoins = mutation({
  args: { diamonds: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (!Number.isFinite(args.diamonds) || args.diamonds <= 0 || !Number.isInteger(args.diamonds)) throw new Error("أدخل كمية ماس صحيحة أكبر من صفر");
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).unique();
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const available = membership?.pendingDiamonds ?? profile.diamonds ?? 0;
    if (available < args.diamonds) throw new Error("رصيد الماس غير كافٍ");
    const coins = Math.floor(args.diamonds * DIAMOND_TO_COINS_RATE);
    if (membership) {
      await ctx.db.patch(membership._id, {
        pendingDiamonds: (membership.pendingDiamonds ?? 0) - args.diamonds,
        withdrawnDiamonds: (membership.withdrawnDiamonds ?? 0) + args.diamonds,
      });
    } else {
      await ctx.db.patch(profile._id, { diamonds: Math.max(0, (profile.diamonds ?? 0) - args.diamonds) });
    }
    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + coins });
    return { coins };
  },
});

// ── جلب طلبات السحب (للمالك) ────────────────────────────────────────────────
export const getAgencyWithdrawals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) return [];
    const withdrawals = await ctx.db.query("hostWithdrawals")
      .withIndex("by_agency", (q) => q.eq("agencyId", membership.agencyId))
      .order("desc").take(50);
    return await Promise.all(withdrawals.map(async (w) => {
      const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", w.userId)).unique();
      return { ...w, userName: p?.name ?? "مجهول", userSakiId: p?.sakiId ?? "" };
    }));
  },
});

// ── جلب طلبات السحب الخاصة بي ───────────────────────────────────────────────
export const getMyWithdrawals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("hostWithdrawals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc").take(20);
  },
});

// ── معالجة طلب سحب (للمالك/أدمن) ───────────────────────────────────────────
export const processWithdrawal = mutation({
  args: {
    withdrawalId: v.id("hostWithdrawals"),
    approve: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMembership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if ((!myMembership || (myMembership.role !== "owner" && myMembership.role !== "admin")) && !profile?.isSuperAdmin) {
      throw new Error("ليس لديك صلاحية");
    }
    const withdrawal = await ctx.db.get(args.withdrawalId);
    if (!withdrawal || withdrawal.status !== "pending") throw new Error("الطلب غير موجود أو تمت معالجته");
    await ctx.db.patch(args.withdrawalId, {
      status: args.approve ? "approved" : "rejected",
      processedBy: userId,
      processedAt: Date.now(),
      note: args.note,
    });
    await ctx.db.insert("notifications", {
      userId: withdrawal.userId,
      type: "withdrawal",
      title: args.approve ? "✅ تم قبول طلب السحب" : "❌ تم رفض طلب السحب",
      body: args.approve
        ? `تم قبول طلب سحب $${withdrawal.usdAmount} بنجاح`
        : `تم رفض طلب السحب. ${args.note ?? ""}`,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// ── جلب طلبات الانضمام المعلقة ──────────────────────────────────────────────
export const getPendingJoinRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) return [];
    const requests = await ctx.db.query("hostAgencyJoinRequests")
      .withIndex("by_agency", (q) => q.eq("agencyId", membership.agencyId)).collect();
    const pending = requests.filter(r => r.status === "pending");
    return await Promise.all(pending.map(async (r) => {
      const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.userId)).unique();
      let avatarUrl = p?.avatarUrl;
      if (p?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(p.avatarStorageId) ?? undefined;
      return { ...r, profile: p ? { ...p, avatarUrl } : null };
    }));
  },
});

// ── إحصائيات الوكالة ─────────────────────────────────────────────────────────
export const getAgencyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!membership || membership.role !== "owner") return null;
    const agency = await ctx.db.get(membership.agencyId);
    if (!agency) return null;
    const members = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id)).collect();
    const withdrawals = await ctx.db.query("hostWithdrawals")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id)).collect();
    const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
    const totalPaidUsd = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + w.usdAmount, 0);
    return {
      memberCount: members.length,
      totalDiamonds: agency.totalDiamonds ?? 0,
      pendingWithdrawals,
      totalPaidUsd,
    };
  },
});

// ── جلب وكالة بمعرف المستخدم ─────────────────────────────────────────────────
export const getAgencyByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId)).unique();
    if (!membership) return null;
    const agency = await ctx.db.get(membership.agencyId);
    if (!agency) return null;
    return { ...agency, role: membership.role };
  },
});

// ── جلب ماس الوكالة الخاص بي (للمحفظة) ──────────────────────────────────────
export const getMyAgencyDiamonds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    const agency = membership ? await ctx.db.get(membership.agencyId) : null;
    const available = membership?.pendingDiamonds ?? profile?.diamonds ?? 0;
    return {
      pendingDiamonds: available,
      totalDiamonds: membership?.totalDiamonds ?? profile?.diamonds ?? 0,
      withdrawnDiamonds: membership?.withdrawnDiamonds ?? 0,
      agencyName: agency?.name ?? "جميع المستخدمين",
      role: membership?.role ?? "user",
      isAgencyMember: Boolean(membership),
    };
  },
});

// ── جلب لقب الوكالة لمستخدم (للعرض في الملف الشخصي) ─────────────────────────
export const getAgencyBadgeByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const membership = await ctx.db.query("hostAgencyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId)).unique();
    if (!membership) return null;
    const agency = await ctx.db.get(membership.agencyId);
    if (!agency || agency.status !== "active") return null;
    return { role: membership.role ?? "host", agencyName: agency.name };
  },
});

// ── ثوابت للعرض ─────────────────────────────────────────────────────────────
export const getWithdrawalTiers = query({
  args: {},
  handler: async () => WITHDRAWAL_TIERS,
});

export const getDiamondToCoinsRate = query({
  args: {},
  handler: async () => DIAMOND_TO_COINS_RATE,
});

// ── جلب جميع طلبات السحب (للسوبر أدمن) ─────────────────────────────────────
export const getAllWithdrawals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const withdrawals = await ctx.db.query("hostWithdrawals")
      .order("desc").take(100);
    return await Promise.all(withdrawals.map(async (w) => {
      const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", w.userId)).unique();
      const agency = await ctx.db.get(w.agencyId);
      return {
        ...w,
        userName: p?.name ?? "مجهول",
        userSakiId: p?.sakiId ?? "",
        agencyName: agency?.name ?? "وكالة",
      };
    }));
  },
});
