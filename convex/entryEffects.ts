// @ts-nocheck
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const fireEntryEvent = internalMutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile?.activeEntryId) return null;

    let mediaUrl: string | null = null;
    let entryMediaType: "gif" | "mp4" | "svga" = "mp4";

    const activeEntryIdStr = String(profile.activeEntryId);

    // ── حالة: دخولية أرستقراطية من aristocracyLevels (aristo_N_entry) ──
    if (activeEntryIdStr.startsWith("aristo_") && activeEntryIdStr.endsWith("_entry")) {
      const parts = activeEntryIdStr.split("_");
      const level = parseInt(parts[1]);
      if (level > 0) {
        const aristoConfig = await ctx.db
          .query("aristocracyLevels")
          .withIndex("by_level", (q) => q.eq("level", level))
          .first();
        if (aristoConfig?.entryEffectUrl) {
          mediaUrl = aristoConfig.entryEffectUrl;
          const t = aristoConfig.entryEffectType ?? "mp4";
          entryMediaType = t === "svga" ? "svga" : t === "gif" ? "gif" : "mp4";
        }
      }
    } else {
      // ── حالة: دخولية عادية من storeItems (VIP أو أرستقراطية من المتجر أو عادية) ──
      let entryItem: any = null;
      try { entryItem = await ctx.db.get(profile.activeEntryId); } catch (_) {}
      if (!entryItem || entryItem.isActive === false) {
        // isActive في storeItems يخص نشر العنصر في المتجر، وقد يكون غير معرّف في العناصر القديمة.
        // لا نمنع حدث الدخولية المفعلة ما دام العنصر موجودًا، إلا إذا عُطّل صراحةً.
        entryItem = null;
      }
      if (entryItem) {
        const rawUrl = entryItem.mediaUrl
          ?? entryItem.videoUrl
          ?? entryItem.svgaUrl
          ?? entryItem.imageUrl
          ?? (entryItem.mediaStorageId ? await ctx.storage.getUrl(entryItem.mediaStorageId) : null)
          ?? (entryItem.videoStorageId ? await ctx.storage.getUrl(entryItem.videoStorageId) : null)
          ?? (entryItem.svgaStorageId ? await ctx.storage.getUrl(entryItem.svgaStorageId) : null);
        if (rawUrl) {
          mediaUrl = rawUrl;
          const lowerUrl = rawUrl.toLowerCase();
          const isSvga = entryItem.mediaType === "svga" || Boolean(entryItem.svgaUrl || entryItem.svgaStorageId) || lowerUrl.includes(".svga");
          const isGif = entryItem.mediaType === "gif" || lowerUrl.includes(".gif");
          entryMediaType = isSvga ? "svga" : isGif ? "gif" : "mp4";
        }
      }
    }

    // لا نسقط حدث الدخول إذا لم يوجد ملف وسائط؛ EntryEffectOverlay يعرض الشريط CSS دائمًا.

    const isPrivateProfile = Boolean((profile as any).isPrivateProfile);
    let avatarUrl = isPrivateProfile
      ? "/assets/privacy/private-person-icon.svg"
      : profile.avatarUrl;
    if (!isPrivateProfile && profile.avatarStorageId && !avatarUrl) {
      avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
    }

    // بيانات العرض الخاصة بالشريط: مستوى PRO والإطار النشط، دون استخدام SVGA.
    let frameUrl: string | undefined;
    let frameMediaType: string | undefined;
    if (profile.superAdminFrameUrl) {
      frameUrl = profile.superAdminFrameUrl;
      frameMediaType = "image";
    } else if (profile.activeFrameId) {
      try {
        const frameItem = await ctx.db.get(profile.activeFrameId as any) as any;
        if (frameItem) {
          frameUrl = frameItem.frameUrl ?? frameItem.imageUrl ?? frameItem.mediaUrl ?? frameItem.thumbnailUrl;
          frameMediaType = frameItem.mediaType ?? "image";
          if (!frameUrl && frameItem.imageStorageId) frameUrl = await ctx.storage.getUrl(frameItem.imageStorageId) ?? undefined;
          if (!frameUrl && frameItem.mediaStorageId) frameUrl = await ctx.storage.getUrl(frameItem.mediaStorageId) ?? undefined;
        }
      } catch (_) {
        // بعض الإطارات القديمة تحفظ مفتاحًا نصيًا وليس معرّف Convex؛ نتجاهلها بأمان.
      }
    }

    await ctx.db.insert("entryEffectEvents", {
      roomId: args.roomId,
      userId: args.userId,
      userName: isPrivateProfile ? "شخصي" : profile.name,
      userAvatarUrl: avatarUrl,
      proLevel: profile.isPro ? Math.max(0, Number(profile.proLevel ?? 0)) : 0,
      aristocracyLevel: Math.max(0, Number(profile.aristocracyLevel ?? 0)),
      frameUrl,
      frameMediaType,
      entryMediaUrl: mediaUrl ?? undefined,
      entryMediaType: mediaUrl ? entryMediaType : undefined,
      createdAt: Date.now(),
    });
    return null;
  },
});
