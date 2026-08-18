// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// منح رتبة الدوق لمستخدمي الذكاء الاصطناعي
export const grantAiUserAristocracy = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    // منح رتبة الدوق (المستوى 4) لمدة 30 يوم إذا لم يكن لديه رتبة
    const currentLevel = profile.aristocracyLevel ?? 0;
    if (currentLevel >= 4) return { alreadyHas: true };
    const expiresAt = Date.now() + 30 * 86400000;
    await ctx.db.patch(profile._id, {
      aristocracyLevel: 4,
      aristocracyExpiresAt: expiresAt,
    });
    return { granted: true, level: 4, expiresAt };
  },
});

export const submitReport = mutation({
  args: {
    reportType: v.union(v.literal("user"), v.literal("room"), v.literal("problem")),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    reason: v.string(),
    details: v.optional(v.string()),
    evidenceStorageId: v.optional(v.id("_storage")),
    evidenceType: v.optional(v.string()),
    aiAnalysis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    let evidenceUrl: string | undefined;
    if (args.evidenceStorageId) {
      evidenceUrl = (await ctx.storage.getUrl(args.evidenceStorageId)) ?? undefined;
    }

    let reportedUserId: any = undefined;
    if (args.reportType === "user" && args.targetId) {
      const targetProfile = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetId)).unique();
      if (targetProfile) {
        if (targetProfile.userId === userId) throw new Error("لا يمكنك الإبلاغ عن نفسك");
        reportedUserId = targetProfile.userId;
      }
    }

    const detailsText = [
      args.details,
      args.aiAnalysis ? `\n[تحليل الذكاء الاصطناعي]: ${args.aiAnalysis}` : "",
      evidenceUrl ? `\n[دليل مرفق]: ${evidenceUrl}` : "",
    ].filter(Boolean).join("");

    await ctx.db.insert("userReports", {
      reporterId: userId,
      reportedUserId,
      reportedId: reportedUserId,
      reason: `[${args.reportType === "user" ? "مستخدم" : args.reportType === "room" ? "غرفة" : "مشكلة"}] ${args.reason}`,
      details: detailsText || undefined,
      status: "pending",
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const reportBySakiId = mutation({
  args: {
    sakiId: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
    aiAnalysis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const targetProfile = await ctx.db.query("profiles").withIndex("by_sakiId", (q) => q.eq("sakiId", args.sakiId)).unique();
    if (!targetProfile) throw new Error("لم يتم العثور على المستخدم");
    if (targetProfile.userId === userId) throw new Error("لا يمكنك الإبلاغ عن نفسك");
    const existing = await ctx.db.query("userReports").withIndex("by_reporter", (q) => q.eq("reporterId", userId)).collect();
    const recentReport = existing.find((r) => r.reportedUserId === targetProfile.userId && Date.now() - r.createdAt < 24 * 60 * 60 * 1000);
    if (recentReport) throw new Error("لقد أبلغت عن هذا المستخدم مؤخراً");
    await ctx.db.insert("userReports", {
      reporterId: userId,
      reportedUserId: targetProfile.userId,
      reportedId: targetProfile.userId,
      reason: args.reason,
      details: args.aiAnalysis ? `${args.details ?? ""}\n\n[تحليل الذكاء الاصطناعي]: ${args.aiAnalysis}` : args.details,
      status: "pending",
      createdAt: Date.now(),
    });
    return { success: true, reportedName: targetProfile.name };
  },
});

export const getReports = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const reports = await ctx.db.query("userReports").order("desc").take(100);
    return await Promise.all(reports.map(async (r) => {
      const reporter = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.reporterId)).unique();
      const reported = r.reportedUserId ? await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.reportedUserId)).unique() : null;
      return { ...r, reporterName: reporter?.name, reportedName: reported?.name, reportedSakiId: reported?.sakiId };
    }));
  },
});

export const updateReportStatus = mutation({
  args: {
    reportId: v.id("userReports"),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("غير مصرح");
    await ctx.db.patch(args.reportId, { status: args.status });
  },
});

export const generateEvidenceUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});
