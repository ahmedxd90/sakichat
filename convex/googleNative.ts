import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Links a verified Google identity to a Convex Auth user.
 * This mutation is only callable from the server-side native bridge action.
 */
export const upsertGoogleUser = internalMutation({
  args: {
    providerAccountId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "googleNative").eq("providerAccountId", args.providerAccountId),
      )
      .unique();

    if (existingAccount) {
      return { userId: existingAccount.userId };
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    const userId = existingUser?._id ?? (await ctx.db.insert("users", {
      email: args.email,
      emailVerificationTime: Date.now(),
      name: args.name,
      image: args.image,
      isAnonymous: false,
    }));

    if (existingUser && (args.name || args.image)) {
      await ctx.db.patch(userId, {
        ...(args.name ? { name: args.name } : {}),
        ...(args.image ? { image: args.image } : {}),
      });
    }

    const existingProviderAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "googleNative"))
      .unique();

    if (!existingProviderAccount) {
      await ctx.db.insert("authAccounts", {
        userId,
        provider: "googleNative",
        providerAccountId: args.providerAccountId,
        emailVerified: args.email,
      });
    }

    return { userId };
  },
});
