// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const setCustomerServiceRole = mutation({
  args: { targetUserId: v.id("users"), isCustomerService: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("ليس لديك صلاحية");
    const t = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!t) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(t._id, { isCustomerService: args.isCustomerService });
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "system",
      title: args.isCustomerService
        ? "🎧 تم تعيينك خدمة عملاء"
        : "ℹ️ تم إزالة لقب خدمة العملاء",
      body: args.isCustomerService
        ? "تهانينا! تم منحك لقب خدمة العملاء المميز"
        : "تم إزالة لقب خدمة العملاء من حسابك",
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });
    return null;
  },
});
