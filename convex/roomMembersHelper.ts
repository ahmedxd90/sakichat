// @ts-nocheck
import { query } from "./_generated/server";
import { v } from "convex/values";

// مساعد: جلب URL من storage فقط إذا لم يكن موجوداً
async function resolveUrl(ctx: any, storedUrl: string | undefined | null, storageId: any): Promise<string | null> {
  if (storedUrl) return storedUrl;
  if (storageId) return (await ctx.storage.getUrl(storageId)) ?? null;
  return null;
}

export const getRoomMembersEnhanced = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    // ── تحديد الأعضاء بـ 120 لتجنب تجاوز حدود Convex ──
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .take(120);

    // ── جلب giftEvents بحد أقصى 300 بدلاً من collect() الكامل ──
    const giftEvents = await ctx.db
      .query("giftEvents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(150);
    const coinsPerReceiver: Record<string, number> = {};
    for (const ev of giftEvents) {
      const rid = ev.receiverId as string;
      coinsPerReceiver[rid] = (coinsPerReceiver[rid] ?? 0) + ev.price;
    }

    // ── جلب جميع مستويات VIP مرة واحدة كـ Map ──
    const vipLevelsAll = await ctx.db.query("vipLevels").collect();
    const vipLevelMap: Record<number, any> = {};
    for (const vl of vipLevelsAll) {
      vipLevelMap[vl.level] = vl;
    }

    // ── جلب مستويات الأرستقراطية مرة واحدة كـ Map ──
    const aristocracyLevelsAll = await ctx.db.query("aristocracyLevels").collect();
    const aristocracyMap: Record<number, any> = {};
    for (const al of aristocracyLevelsAll) {
      aristocracyMap[al.level] = al;
    }

    return await Promise.all(
      members.map(async (member) => {
        const profileCandidates = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", member.userId))
          .order("desc")
          .take(1);
        const profile = profileCandidates[0];

        const avatarUrl = await resolveUrl(ctx, profile?.avatarUrl, profile?.avatarStorageId);
        const sakiIdIconUrl = await resolveUrl(ctx, (profile as any)?.sakiIdIconUrl, (profile as any)?.sakiIdIconStorageId);
        const adminTitleIconUrl = await resolveUrl(ctx, (profile as any)?.adminTitleIconUrl, (profile as any)?.adminTitleIconStorageId);

        const effectiveRole = room && room.ownerId === member.userId ? "owner" : member.role;

        // ── إعدادات VIP من الـ Map المحملة مسبقاً ──
        let vipConfig: any = null;
        if (profile?.isVip && profile.vipLevel) {
          const vipLevel = vipLevelMap[profile.vipLevel];
          if (vipLevel) {
            const chatBubbleUrl = await resolveUrl(ctx, vipLevel.chatBubbleUrl, vipLevel.chatBubbleStorageId);
            const titleUrl = await resolveUrl(ctx, vipLevel.titleUrl, vipLevel.titleStorageId);
            vipConfig = { ...vipLevel, chatBubbleUrl, titleUrl };
          }
        }

        // ── فقاعة الدردشة النشطة ──
        let activeChatBubbleUrl: string | null = null;
        if (profile?.activeBubbleId) {
          const bubbleIdStr = String(profile.activeBubbleId);
          if (bubbleIdStr.startsWith("aristo_")) {
            const level = parseInt(bubbleIdStr.split("_")[1]);
            if (level > 0) {
              const ac = aristocracyMap[level];
              if (ac) {
                activeChatBubbleUrl = await resolveUrl(ctx, ac.chatBubbleUrl, ac.chatBubbleStorageId);
              }
            }
          } else {
            try {
              const bi = await ctx.db.get(profile.activeBubbleId as any);
              if (bi) {
                activeChatBubbleUrl = await resolveUrl(ctx, bi.mediaUrl, bi.mediaStorageId);
              }
            } catch (_) {}
          }
        }
        // fallback: فقاعة VIP التلقائية
        if (!activeChatBubbleUrl && vipConfig?.chatBubbleUrl) {
          activeChatBubbleUrl = vipConfig.chatBubbleUrl;
        }

        // ── ستايل المقعد النشط ──
        let seatSkinUrl: string | undefined;
        let seatLockedSkinUrl: string | undefined;
        let seatThumbnailUrl: string | undefined;
        if (profile?.activeSeatSkinId) {
          try {
            const sk = await ctx.db.get(profile.activeSeatSkinId as any);
            if (sk) {
              seatSkinUrl = await resolveUrl(ctx, (sk as any).seatOpenUrl ?? sk.mediaUrl, (sk as any).seatOpenStorageId ?? sk.mediaStorageId) ?? undefined;
              seatLockedSkinUrl = await resolveUrl(ctx, (sk as any).seatLockedUrl, (sk as any).seatLockedStorageId) ?? undefined;
              seatThumbnailUrl = await resolveUrl(ctx, sk.thumbnailUrl, sk.thumbnailStorageId) ?? undefined;
            }
          } catch (_) {}
        }

        return {
          ...member,
          role: effectiveRole,
          name: profile?.name ?? "مستخدم",
          avatarUrl,
          isVip: profile?.isVip ?? false,
          vipLevel: profile?.vipLevel,
          isSuperAdmin: profile?.isSuperAdmin ?? false,
          sakiId: profile?.sakiId,
          goldCoins: profile?.goldCoins ?? 0,
          wealthLevel: profile?.wealthLevel,
          charismaLevel: profile?.charismaLevel,
          aristocracyLevel: profile?.aristocracyLevel,
          coinsReceivedInRoom: coinsPerReceiver[member.userId as string] ?? 0,
          profile: profile ? { ...profile, avatarUrl, sakiIdIconUrl, adminTitleIconUrl, seatSkinUrl, seatLockedSkinUrl, seatThumbnailUrl } : null,
          vipConfig,
          activeChatBubbleUrl,
          seatSkinUrl,
          seatLockedSkinUrl,
          seatThumbnailUrl,
        };
      })
    );
  },
});
