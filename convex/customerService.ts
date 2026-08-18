// @ts-nocheck
import { query } from "./_generated/server";
import { v } from "convex/values";

// Query to get customer service users (for display purposes)
export const getCustomerServiceUsers = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    return profiles
      .filter((p: any) => p.isCustomerService)
      .map((p: any) => ({
        userId: p.userId,
        name: p.name,
        sakiId: p.sakiId,
        avatarUrl: p.avatarUrl,
      }));
  },
});
