// @ts-nocheck
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const LEVEL_THRESHOLDS = [
  1_000_000, 5_000_000, 10_000_000, 15_000_000, 20_000_000,
  30_000_000, 50_000_000, 75_000_000, 100_000_000, 150_000_000,
];
const MAX_LEVEL = 10;

const LEVEL_REWARDS = [
  { vipLevel: 3,  vipDays: 7,  coinsRewards: [5000,    4000,   3000,   2000,   1000]   },
  { vipLevel: 4,  vipDays: 7,  coinsRewards: [10000,   8000,   6000,   4000,   2000]   },
  { vipLevel: 5,  vipDays: 7,  coinsRewards: [20000,   15000,  10000,  7000,   3000]   },
  { vipLevel: 6,  vipDays: 7,  coinsRewards: [50000,   40000,  30000,  20000,  10000]  },
  { vipLevel: 7,  vipDays: 7,  coinsRewards: [100000,  80000,  60000,  40000,  20000]  },
  { vipLevel: 8,  vipDays: 14, coinsRewards: [200000,  150000, 100000, 70000,  30000]  },
  { vipLevel: 9,  vipDays: 14, coinsRewards: [300000,  250000, 200000, 150000, 100000] },
  { vipLevel: 10, vipDays: 30, coinsRewards: [500000,  400000, 300000, 200000, 100000] },
  { vipLevel: 11, vipDays: 30, coinsRewards: [800000,  600000, 400000, 300000, 200000] },
  { vipLevel: 12, vipDays: 30, coinsRewards: [1000000, 800000, 600000, 400000, 200000] },
];

function buildLevelConfig(db: any, lvl: number) {
  const reward = LEVEL_REWARDS[Math.min(lvl - 1, LEVEL_REWARDS.length - 1)];
  return {
    level: lvl,
    threshold: LEVEL_THRESHOLDS[Math.min(lvl - 1, LEVEL_THRESHOLDS.length - 1)],
    firstVip: db?.firstPlaceVipLevel ?? reward?.vipLevel ?? 0,
    firstVipDays: db?.firstPlaceVipDays ?? reward?.vipDays ?? 0,
    firstCoins: db?.firstPlaceCoins ?? 0,
    storeItemName: null as string | null,
    secondCoins: db?.secondPlaceCoins ?? (reward?.coinsRewards?.[0] ?? 0),
    secondVip: db?.secondPlaceVipLevel ?? null,
    thirdCoins: db?.thirdPlaceCoins ?? (reward?.coinsRewards?.[1] ?? 0),
    thirdVip: db?.thirdPlaceVipLevel ?? null,
  };
}

export const getRoomBombState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("roomBombLevels")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    const dbConfigs = await ctx.db.query("bombLevelConfig").collect();
    const getLevelConfig = (lvl: number) => {
      const dbCfg = dbConfigs.find((c) => c.level === lvl);
      return buildLevelConfig(dbCfg, lvl);
    };
    if (!state) {
      return {
        currentLevel: 1,
        totalCoinsInLevel: 0,
        threshold: LEVEL_THRESHOLDS[0],
        isExploding: false,
        explodeAt: null,
        lastExplodedLevel: null,
        lastExplodedAt: null,
        maxLevel: MAX_LEVEL,
        levelConfig: getLevelConfig(1),
      };
    }
    const lvl = Math.min(state.currentLevel, MAX_LEVEL);
    return {
      ...state,
      threshold: LEVEL_THRESHOLDS[lvl - 1],
      isExploding: state.isExploding ?? false,
      explodeAt: state.explodeAt ?? null,
      lastExplodedLevel: state.lastExplodedLevel ?? null,
      lastExplodedAt: state.lastExplodedAt ?? null,
      maxLevel: MAX_LEVEL,
      levelConfig: getLevelConfig(lvl),
    };
  },
});

export const getRoomBombLeaderboard = query({
  args: { roomId: v.id("rooms"), level: v.number() },
  handler: async (ctx, args) => {
    const contribs = await ctx.db
      .query("roomBombContributions")
      .withIndex("by_room_and_level", (q) =>
        q.eq("roomId", args.roomId).eq("level", args.level)
      )
      .collect();
    const userMap: Record<string, number> = {};
    for (const c of contribs) {
      const uid = c.userId as string;
      userMap[uid] = (userMap[uid] ?? 0) + c.coins;
    }
    const sorted = Object.entries(userMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    return await Promise.all(
      sorted.map(async ([userId, coins], i) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId as any))
          .unique();
        let avatarUrl = profile?.avatarUrl;
        if (profile?.avatarStorageId && !avatarUrl) {
          avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
        }
        return {
          rank: i + 1,
          userId,
          name: profile?.name ?? "مجهول",
          avatarUrl,
          isVip: profile?.isVip ?? false,
          vipLevel: profile?.vipLevel,
          coins,
        };
      })
    );
  },
});

// Query to get the latest explosion event for global banner
export const getLatestBombExplosionEvent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bombExplosionEvents")
      .order("desc")
      .first();
  },
});

export const addContribution = internalMutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    coins: v.number(),
  },
  handler: async (ctx, args) => {
    let state = await ctx.db
      .query("roomBombLevels")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (!state) {
      const id = await ctx.db.insert("roomBombLevels", {
        roomId: args.roomId,
        currentLevel: 1,
        totalCoinsInLevel: 0,
        isExploding: false,
        updatedAt: Date.now(),
      });
      state = await ctx.db.get(id);
    }
    if (!state) return;
    if (state.isExploding) return;
    const currentLevel = state.currentLevel;
    if (currentLevel > MAX_LEVEL) return;
    const threshold = LEVEL_THRESHOLDS[currentLevel - 1];
    const newTotal = state.totalCoinsInLevel + args.coins;
    await ctx.db.insert("roomBombContributions", {
      roomId: args.roomId,
      userId: args.userId,
      level: currentLevel,
      coins: args.coins,
      createdAt: Date.now(),
    });
    if (newTotal >= threshold) {
      const explodeAt = Date.now() + 10_000;
      await ctx.db.patch(state._id, {
        totalCoinsInLevel: newTotal,
        isExploding: true,
        explodeAt,
        updatedAt: Date.now(),
      });
      await ctx.scheduler.runAt(
        explodeAt,
        internal.roomBomb.triggerExplosion,
        { roomId: args.roomId, level: currentLevel }
      );
    } else {
      await ctx.db.patch(state._id, {
        totalCoinsInLevel: newTotal,
        updatedAt: Date.now(),
      });
    }
  },
});

export const triggerExplosion = internalMutation({
  args: { roomId: v.id("rooms"), level: v.number() },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("roomBombLevels")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (!state || state.currentLevel !== args.level) return;
    const rewardIdx = Math.min(args.level - 1, LEVEL_REWARDS.length - 1);
    const rewards = LEVEL_REWARDS[rewardIdx];
    const contribs = await ctx.db
      .query("roomBombContributions")
      .withIndex("by_room_and_level", (q) =>
        q.eq("roomId", args.roomId).eq("level", args.level)
      )
      .collect();
    const userMap: Record<string, number> = {};
    for (const c of contribs) {
      const uid = c.userId as string;
      userMap[uid] = (userMap[uid] ?? 0) + c.coins;
    }
    const sorted = Object.entries(userMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const now = Date.now();

    // Get top contributor info for global banner
    let topContributorName: string | undefined;
    let topContributorAvatarUrl: string | undefined;
    let topContributorCoins: number | undefined;

    for (let i = 0; i < sorted.length; i++) {
      const [userId, userCoins] = sorted[i];
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId as any))
        .unique();
      if (!profile) continue;

      if (i === 0) {
        topContributorName = profile.name;
        topContributorCoins = userCoins;
        if (profile.avatarStorageId) {
          topContributorAvatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? profile.avatarUrl;
        } else {
          topContributorAvatarUrl = profile.avatarUrl;
        }
        const expiresAt = now + rewards.vipDays * 24 * 60 * 60 * 1000;
        const currentVipLevel = profile.vipLevel ?? 0;
        if (!profile.isVip || currentVipLevel < rewards.vipLevel) {
          await ctx.db.patch(profile._id, {
            isVip: true,
            vipLevel: rewards.vipLevel,
            vipExpiresAt: expiresAt,
          });
        }
        await ctx.db.insert("notifications", {
          userId: profile.userId,
          type: "system",
          title: `💣 انفجار القنبلة - المركز الأول!`,
          body: `تهانينا! حصلت على VIP${rewards.vipLevel} لمدة ${rewards.vipDays} أيام - المستوى ${args.level}`,
          isRead: false,
          createdAt: now,
        });
      } else if (i <= 5) {
        const coinsReward = rewards.coinsRewards[i - 1] ?? 0;
        if (coinsReward > 0) {
          await ctx.db.patch(profile._id, {
            goldCoins: (profile.goldCoins ?? 0) + coinsReward,
          });
          await ctx.db.insert("notifications", {
            userId: profile.userId,
            type: "system",
            title: `💣 انفجار القنبلة - المركز ${i + 1}!`,
            body: `حصلت على ${coinsReward.toLocaleString()} عملة ذهبية - المستوى ${args.level}`,
            isRead: false,
            createdAt: now,
          });
        }
      }
    }

    // Insert global explosion event for banner
    await ctx.db.insert("bombExplosionEvents", {
      roomId: args.roomId,
      level: args.level,
      topContributorName,
      topContributorAvatarUrl,
      topContributorCoins,
      createdAt: now,
    });

    // Advance to next level or reset to 1 after MAX_LEVEL
    const nextLevel = args.level + 1;
    const newLevel = nextLevel > MAX_LEVEL ? 1 : nextLevel;
    await ctx.db.patch(state._id, {
      currentLevel: newLevel,
      totalCoinsInLevel: 0,
      isExploding: false,
      explodeAt: undefined,
      lastExplodedLevel: args.level,
      lastExplodedAt: now,
      updatedAt: now,
    });
  },
});

export const getAllLevelConfigs = query({
  args: {},
  handler: async (ctx) => {
    const dbConfigs = await ctx.db.query("bombLevelConfig").collect();
    return Array.from({ length: 10 }, (_, i) => {
      const lvl = i + 1;
      const db = dbConfigs.find((c) => c.level === lvl);
      return buildLevelConfig(db, lvl);
    });
  },
});

export const adminUpdateBombLevelConfig = mutation({
  args: {
    level: v.number(),
    threshold: v.optional(v.number()),
    firstPlaceVipLevel: v.optional(v.number()),
    firstPlaceVipDays: v.optional(v.number()),
    firstPlaceCoins: v.optional(v.number()),
    firstPlaceStoreItemId: v.optional(v.id("storeItems")),
    secondPlaceCoins: v.optional(v.number()),
    secondPlaceVipLevel: v.optional(v.number()),
    secondPlaceVipDays: v.optional(v.number()),
    thirdPlaceCoins: v.optional(v.number()),
    thirdPlaceVipLevel: v.optional(v.number()),
    thirdPlaceVipDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isSuperAdmin) throw new Error("للمشرف فقط");
    const existing = await ctx.db
      .query("bombLevelConfig")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .first();
    const patch: any = {
      level: args.level,
      updatedAt: Date.now(),
    };
    if (args.threshold !== undefined) patch.threshold = args.threshold;
    if (args.firstPlaceVipLevel !== undefined) patch.firstPlaceVipLevel = args.firstPlaceVipLevel;
    if (args.firstPlaceVipDays !== undefined) patch.firstPlaceVipDays = args.firstPlaceVipDays;
    if (args.firstPlaceCoins !== undefined) patch.firstPlaceCoins = args.firstPlaceCoins;
    if (args.firstPlaceStoreItemId !== undefined) patch.firstPlaceStoreItemId = args.firstPlaceStoreItemId;
    if (args.secondPlaceCoins !== undefined) patch.secondPlaceCoins = args.secondPlaceCoins;
    if (args.secondPlaceVipLevel !== undefined) patch.secondPlaceVipLevel = args.secondPlaceVipLevel;
    if (args.secondPlaceVipDays !== undefined) patch.secondPlaceVipDays = args.secondPlaceVipDays;
    if (args.thirdPlaceCoins !== undefined) patch.thirdPlaceCoins = args.thirdPlaceCoins;
    if (args.thirdPlaceVipLevel !== undefined) patch.thirdPlaceVipLevel = args.thirdPlaceVipLevel;
    if (args.thirdPlaceVipDays !== undefined) patch.thirdPlaceVipDays = args.thirdPlaceVipDays;
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("bombLevelConfig", patch);
    }
  },
});

export const resetBombLevel = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isSuperAdmin) throw new Error("للمشرف فقط");
    const state = await ctx.db
      .query("roomBombLevels")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (state) {
      await ctx.db.patch(state._id, {
        currentLevel: 1,
        totalCoinsInLevel: 0,
        isExploding: false,
        explodeAt: undefined,
        lastExplodedLevel: undefined,
        lastExplodedAt: undefined,
        updatedAt: Date.now(),
      });
    }
  },
});
