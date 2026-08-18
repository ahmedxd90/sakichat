"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const searchYoutube = action({
  args: { query: v.string() },
  handler: async (_ctx, args) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY غير مضبوط");
    }
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(args.query)}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message ?? "فشل البحث في يوتيوب");
    }
    const data = await res.json();
    return (data.items ?? []).map((item: any) => ({
      videoId: item.id?.videoId ?? "",
      title: item.snippet?.title ?? "",
      channelTitle: item.snippet?.channelTitle ?? "",
      thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? "",
      publishedAt: item.snippet?.publishedAt ?? "",
    }));
  },
});
