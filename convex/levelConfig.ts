// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
  return { userId, profile };
}

// Default level configs
const DEFAULT_WEALTH_BASE = 200;
const DEFAULT_WEALTH_MULTIPLIER = 2; // doubles each level
const DEFAULT_CHARISMA_BASE = 200;
const DEFAULT_CHARISMA_MULTIPLIER = 4; // quadruples each level

export function calcCoinsForLevel(level: number, base: number, multiplier: number): number {
  if (level <= 0) return 0;
  let total = 0;
  let req = base;
  for (let i = 1; i <= level; i++) {
    total += req;
    req = Math.floor(req * multiplier);
  }
  return total;
}

export function calcLevelFromCoins(totalCoins: number, base: number, multiplier: number): number {
  if (totalCoins < base) return 0;
  let level = 0;
  let required = base;
  let cumulative = 0;
  for (let i = 1; i <= 500; i++) {
    cumulative += required;
    if (totalCoins >= cumulative) level = i;
    else break;
    required = Math.floor(required * multiplier);
  }
  return level;
}

// Get level config (returns custom or default)
export const getLevelConfig = query({
  args: {},
  handler: async (ctx) => {
    const wealthConfigs = await ctx.db.query("levelConfig").withIndex("by_type", (q) => q.eq("type", "wealth")).collect();
    const charismaConfigs = await ctx.db.query("levelConfig").withIndex("by_type", (q) => q.eq("type", "charisma")).collect();

    // Build wealth levels 1-50
    const wealthLevels: Array<{ level: number; requiredCoins: number; isCustom: boolean }> = [];
    for (let i = 1; i <= 50; i++) {
      const custom = wealthConfigs.find((c) => c.level === i);
      if (custom) {
        wealthLevels.push({ level: i, requiredCoins: custom.requiredCoins, isCustom: true });
      } else {
        // Default: each level needs base * multiplier^(level-1)
        let req = DEFAULT_WEALTH_BASE;
        for (let j = 1; j < i; j++) req = Math.floor(req * DEFAULT_WEALTH_MULTIPLIER);
        wealthLevels.push({ level: i, requiredCoins: req, isCustom: false });
      }
    }

    const charismaLevels: Array<{ level: number; requiredCoins: number; isCustom: boolean }> = [];
    for (let i = 1; i <= 50; i++) {
      const custom = charismaConfigs.find((c) => c.level === i);
      if (custom) {
        charismaLevels.push({ level: i, requiredCoins: custom.requiredCoins, isCustom: true });
      } else {
        let req = DEFAULT_CHARISMA_BASE;
        for (let j = 1; j < i; j++) req = Math.floor(req * DEFAULT_CHARISMA_MULTIPLIER);
        charismaLevels.push({ level: i, requiredCoins: req, isCustom: false });
      }
    }

    return { wealthLevels, charismaLevels };
  },
});

// Set custom coins for a specific level
export const setLevelRequirement = mutation({
  args: {
    type: v.union(v.literal("wealth"), v.literal("charisma")),
    level: v.number(),
    requiredCoins: v.number(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    if (args.level < 1 || args.level > 500) throw new Error("المستوى يجب أن يكون بين 1 و 500");
    if (args.requiredCoins < 1) throw new Error("يجب أن تكون العملات أكبر من صفر");

    const existing = await ctx.db.query("levelConfig")
      .withIndex("by_type_and_level", (q) => q.eq("type", args.type).eq("level", args.level))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { requiredCoins: args.requiredCoins, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("levelConfig", {
        type: args.type,
        level: args.level,
        requiredCoins: args.requiredCoins,
        updatedAt: Date.now(),
      });
    }
    return { success: true };
  },
});

// Reset level to default
export const resetLevelRequirement = mutation({
  args: {
    type: v.union(v.literal("wealth"), v.literal("charisma")),
    level: v.number(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.query("levelConfig")
      .withIndex("by_type_and_level", (q) => q.eq("type", args.type).eq("level", args.level))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
    return { success: true };
  },
});

// Compute level from total coins using config
export const computeWealthLevel = query({
  args: { totalCoinsSent: v.number() },
  handler: async (ctx, args) => {
    const configs = await ctx.db.query("levelConfig").withIndex("by_type", (q) => q.eq("type", "wealth")).collect();
    // Build cumulative thresholds
    let level = 0;
    let cumulative = 0;
    for (let i = 1; i <= 500; i++) {
      const custom = configs.find((c) => c.level === i);
      let req: number;
      if (custom) {
        req = custom.requiredCoins;
      } else {
        req = DEFAULT_WEALTH_BASE;
        for (let j = 1; j < i; j++) req = Math.floor(req * DEFAULT_WEALTH_MULTIPLIER);
      }
      cumulative += req;
      if (args.totalCoinsSent >= cumulative) level = i;
      else break;
    }
    return level;
  },
});
