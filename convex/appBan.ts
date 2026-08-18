// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const BAN_DURATIONS: Record<string, number | null> = {
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "365d": 365 * 24 * 60 * 60 * 1000,
  "permanent": null,
};

// ── Check ban status ────────────────────────────────────────────────────────
export const checkBanStatus = query({
  args: { fingerprint: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    const deviceBan = await ctx.db
      .query("deviceBans")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
      .first();

    if (deviceBan) {
      if (deviceBan.banExpiresAt && deviceBan.banExpiresAt < now) {
        // Expired
      } else {
        return {
          isBanned: true,
          reason: "تم حظرك من التطبيق بالكامل ومن جميع الحسابات، تواصل مع الدعم الفني أو خدمة العملاء الرسمية لمعرفة السبب",
          type: "device" as const,
          banExpiresAt: deviceBan.banExpiresAt ?? null,
          banDuration: deviceBan.banDuration ?? "permanent",
        };
      }
    }

    if (userId) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (profile?.isBanned) {
        if (profile.banExpiresAt && profile.banExpiresAt < now) {
          // Expired
        } else {
          return {
            isBanned: true,
            reason: "تم حظرك من التطبيق بالكامل ومن جميع الحسابات، تواصل مع الدعم الفني أو خدمة العملاء الرسمية لمعرفة السبب",
            type: "account" as const,
            banExpiresAt: profile.banExpiresAt ?? null,
            banDuration: profile.banDuration ?? "permanent",
          };
        }
      }
    }

    return { isBanned: false, reason: null, type: null, banExpiresAt: null, banDuration: null };
  },
});

// ── Check forced logout ─────────────────────────────────────────────────────
export const checkForcedLogout = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { shouldLogout: false };

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return { shouldLogout: false };

    if (profile.isBanned) {
      const now = Date.now();
      if (!profile.banExpiresAt || profile.banExpiresAt > now) {
        return { shouldLogout: true, isBanned: true };
      }
    }

    return { shouldLogout: false };
  },
});

// ── Auto-lift expired bans ──────────────────────────────────────────────────
export const liftExpiredBan = mutation({
  args: { fingerprint: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    const deviceBan = await ctx.db
      .query("deviceBans")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
      .first();
    if (deviceBan?.banExpiresAt && deviceBan.banExpiresAt < now) {
      await ctx.db.delete(deviceBan._id);
    }

    if (userId) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      if (profile?.isBanned && profile.banExpiresAt && profile.banExpiresAt < now) {
        await ctx.db.patch(profile._id, {
          isBanned: false,
          banReason: undefined,
          bannedAt: undefined,
          bannedBy: undefined,
          banExpiresAt: undefined,
          banDuration: undefined,
        });
      }
    }
  },
});

// ── Register device fingerprint (with IP) ───────────────────────────────────
export const registerDevice = mutation({
  args: {
    fingerprint: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("deviceRegistry")
      .withIndex("by_fingerprint_and_user", (q) =>
        q.eq("fingerprint", args.fingerprint).eq("userId", userId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        ...(args.ipAddress ? { ipAddress: args.ipAddress } : {}),
      });
    } else {
      await ctx.db.insert("deviceRegistry", {
        fingerprint: args.fingerprint,
        userId,
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
        lastSeen: Date.now(),
        createdAt: Date.now(),
      });
    }
  },
});

// ── Get user device details (admin) ────────────────────────────────────────
export const getUserDeviceDetails = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile?.isSuperAdmin) return null;

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!targetProfile) return null;

    const userDevices = await ctx.db
      .query("deviceRegistry")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();

    const devicesWithAccounts = [];
    const allLinkedUserIds = new Set();

    for (const device of userDevices) {
      const sharedUsers = await ctx.db
        .query("deviceRegistry")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprint", device.fingerprint))
        .collect();

      const linkedAccounts = [];
      for (const su of sharedUsers) {
        if (su.userId === args.targetUserId) continue;
        allLinkedUserIds.add(su.userId);
        const p = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", su.userId))
          .unique();
        if (p) {
          linkedAccounts.push({
            name: p.name,
            sakiId: p.sakiId,
            userId: su.userId,
            avatarUrl: p.avatarUrl,
            isBanned: p.isBanned ?? false,
            country: p.country,
          });
        }
      }

      devicesWithAccounts.push({
        fingerprint: device.fingerprint,
        ipAddress: device.ipAddress ?? null,
        userAgent: device.userAgent ?? null,
        lastSeen: device.lastSeen,
        linkedAccounts,
      });
    }

    const latestDevice = [...userDevices].sort((a, b) => b.lastSeen - a.lastSeen)[0];

    return {
      country: targetProfile.country,
      ipAddress: latestDevice?.ipAddress ?? null,
      userAgent: latestDevice?.userAgent ?? null,
      devices: devicesWithAccounts,
      totalLinkedAccounts: allLinkedUserIds.size,
    };
  },
});

// ── Advanced Ban User (شامل) ────────────────────────────────────────────────
export const banUserFromApp = mutation({
  args: {
    targetUserId: v.id("users"),
    reason: v.optional(v.string()),
    banAllDevices: v.optional(v.boolean()),
    duration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!targetProfile) throw new Error("المستخدم غير موجود");
    if (targetProfile.isSuperAdmin) throw new Error("لا يمكن حظر مدير آخر");

    const duration = args.duration ?? "permanent";
    const durationMs = BAN_DURATIONS[duration] ?? null;
    const banExpiresAt = durationMs ? Date.now() + durationMs : undefined;
    const banReason = args.reason ?? "مخالفة شروط الاستخدام";
    const now = Date.now();

    const durationLabels: Record<string, string> = {
      "1h": "ساعة واحدة", "1d": "يوم واحد", "3d": "3 أيام",
      "7d": "7 أيام", "30d": "30 يوم", "365d": "سنة كاملة", "permanent": "دائم",
    };

    await ctx.db.patch(targetProfile._id, {
      isBanned: true, banReason, bannedAt: now, bannedBy: userId,
      banExpiresAt, banDuration: duration, forcedLogoutAt: now,
    });

    const targetDevices = await ctx.db
      .query("deviceRegistry")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();

    const allAffectedUserIds = new Set<string>([args.targetUserId]);

    for (const device of targetDevices) {
      const sharedUsers = await ctx.db
        .query("deviceRegistry")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprint", device.fingerprint))
        .collect();
      for (const su of sharedUsers) allAffectedUserIds.add(su.userId);
    }

    for (const affectedUserId of allAffectedUserIds) {
      if (affectedUserId === args.targetUserId) continue;
      const affectedProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", affectedUserId as any))
        .unique();
      if (!affectedProfile || affectedProfile.isSuperAdmin) continue;
      await ctx.db.patch(affectedProfile._id, {
        isBanned: true, banReason, bannedAt: now, bannedBy: userId,
        banExpiresAt, banDuration: duration, forcedLogoutAt: now,
      });
    }

    if (args.banAllDevices !== false) {
      for (const affectedUserId of allAffectedUserIds) {
        const userDevices = await ctx.db
          .query("deviceRegistry")
          .withIndex("by_userId", (q) => q.eq("userId", affectedUserId as any))
          .collect();

        for (const device of userDevices) {
          const existingBan = await ctx.db
            .query("deviceBans")
            .withIndex("by_fingerprint", (q) => q.eq("fingerprint", device.fingerprint))
            .first();

          if (existingBan) {
            await ctx.db.patch(existingBan._id, { reason: banReason, banExpiresAt, banDuration: duration });
          } else {
            await ctx.db.insert("deviceBans", {
              fingerprint: device.fingerprint, userId: args.targetUserId,
              bannedBy: userId, reason: banReason, banExpiresAt, banDuration: duration, createdAt: now,
            });
          }
        }
      }
    }

    await ctx.db.insert("notifications", {
      userId: args.targetUserId, type: "system",
      title: "🚫 تم حظرك من التطبيق",
      body: `تم حظرك من التطبيق بالكامل ومن جميع الحسابات. السبب: ${banReason}. مدة الحظر: ${durationLabels[duration] ?? "دائم"}. تواصل مع الدعم الفني أو خدمة العملاء الرسمية لمعرفة السبب.`,
      isRead: false, createdAt: now,
    });

    return { success: true, affectedAccounts: allAffectedUserIds.size };
  },
});

// ── Unban user ──────────────────────────────────────────────────────────────
export const unbanUserFromApp = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!targetProfile) throw new Error("المستخدم غير موجود");

    await ctx.db.patch(targetProfile._id, {
      isBanned: false, banReason: undefined, bannedAt: undefined,
      bannedBy: undefined, banExpiresAt: undefined, banDuration: undefined, forcedLogoutAt: undefined,
    });

    const deviceBans = await ctx.db
      .query("deviceBans")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();

    for (const ban of deviceBans) await ctx.db.delete(ban._id);

    await ctx.db.insert("notifications", {
      userId: args.targetUserId, type: "system",
      title: "✅ تم رفع الحظر عن حسابك",
      body: "تم رفع الحظر عن حسابك من قِبل الإدارة. يمكنك الآن استخدام التطبيق بشكل طبيعي.",
      isRead: false, createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ── Get banned users list ───────────────────────────────────────────────────
export const getBannedUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile?.isSuperAdmin) return [];

    const bannedProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_banned", (q) => q.eq("isBanned", true))
      .collect();

    const now = Date.now();
    return await Promise.all(
      bannedProfiles.map(async (p) => {
        let avatarUrl = p.avatarUrl;
        if (p.avatarStorageId && !avatarUrl) {
          avatarUrl = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        }
        const deviceCount = await ctx.db
          .query("deviceBans")
          .withIndex("by_userId", (q) => q.eq("userId", p.userId))
          .collect();
        const isExpired = p.banExpiresAt ? p.banExpiresAt < now : false;
        return { ...p, avatarUrl, deviceBansCount: deviceCount.length, isExpired };
      })
    );
  },
});

// ── Get user devices ────────────────────────────────────────────────────────
export const getUserDevices = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile?.isSuperAdmin) return [];

    return await ctx.db
      .query("deviceRegistry")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();
  },
});

// ── Check if new registration is allowed ───────────────────────────────────
export const checkRegistrationAllowed = query({
  args: { fingerprint: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const deviceBan = await ctx.db
      .query("deviceBans")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
      .first();

    if (deviceBan) {
      if (deviceBan.banExpiresAt && deviceBan.banExpiresAt < now) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "تم حظرك من التطبيق بالكامل ومن جميع الحسابات، تواصل مع الدعم الفني أو خدمة العملاء الرسمية لمعرفة السبب",
      };
    }
    return { allowed: true };
  },
});
