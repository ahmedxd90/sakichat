import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
  if (!profile?.isSuperAdmin) throw new Error("هذه العملية للسوبر أدمن فقط");
  return { userId, profile };
}

export const preview = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    const activeNewInventory = (await ctx.db.query("aristocracyInventory").collect())
      .filter((item: any) => item.status === "activated");
    const newOwners = new Set(activeNewInventory.map((item: any) => String(item.ownerUserId)));
    const legacyProfiles = profiles.filter((profile: any) =>
      (profile.aristocracyLevel ?? 0) > 0 && !newOwners.has(String(profile.userId))
    );
    const oldPurchases = await ctx.db.query("aristocracyPurchases").collect();
    return {
      profilesWithLegacyAristocracy: legacyProfiles.length,
      legacyPurchaseRows: oldPurchases.length,
      preservedNewOwners: newOwners.size,
    };
  },
});

export const clearAllLegacy = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    const activeNewInventory = (await ctx.db.query("aristocracyInventory").collect())
      .filter((item: any) => item.status === "activated");
    const newOwners = new Set(activeNewInventory.map((item: any) => String(item.ownerUserId)));
    let clearedProfiles = 0;
    for (const profile of profiles) {
      const hasLegacy = (profile.aristocracyLevel ?? 0) > 0 || !!profile.aristocracyExpiresAt || !!profile.activeEntryId;
      if (!hasLegacy || newOwners.has(String(profile.userId))) continue;
      await ctx.db.patch(profile._id, {
        aristocracyLevel: undefined,
        aristocracyExpiresAt: undefined,
        aristocracyLastDailyClaim: undefined,
        activeEntryId: undefined,
      });
      clearedProfiles += 1;
    }
    const oldPurchases = await ctx.db.query("aristocracyPurchases").collect();
    for (const purchase of oldPurchases) await ctx.db.delete(purchase._id);
    return {
      success: true,
      clearedProfiles,
      deletedLegacyPurchaseRows: oldPurchases.length,
      preservedNewOwners: newOwners.size,
    };
  },
});

export const verify = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    const activeNewInventory = (await ctx.db.query("aristocracyInventory").collect())
      .filter((item: any) => item.status === "activated");
    const newOwners = new Set(activeNewInventory.map((item: any) => String(item.ownerUserId)));
    const remainingLegacyLike = profiles.filter((profile: any) =>
      ((profile.aristocracyLevel ?? 0) > 0 || !!profile.aristocracyExpiresAt || !!profile.activeEntryId) &&
      !newOwners.has(String(profile.userId))
    ).length;
    return { remainingLegacyLike, preservedNewOwners: newOwners.size };
  },
});

// تنفيذ مقصود مرة واحدة فقط من لوحة/جلسة السوبر أدمن بعد المعاينة.
