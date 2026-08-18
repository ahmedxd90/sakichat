"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const generateRoomDescription = action({
  args: { roomName: v.string(), roomType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const prompt = `اكتب وصفاً جذاباً وقصيراً (جملتان فقط) لغرفة دردشة صوتية باسم "${args.roomName}"${args.roomType ? ` من نوع "${args.roomType}"` : ""}. الوصف باللغة العربية فقط.`;
    const resp = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
    });
    return resp.choices[0].message.content ?? "";
  },
});

export const generateMomentCaption = action({
  args: { hint: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const prompt = args.hint
      ? `اكتب تعليقاً إبداعياً قصيراً لمنشور عن: "${args.hint}". باللغة العربية فقط، جملة أو جملتان.`
      : `اكتب تعليقاً إبداعياً قصيراً لمنشور على وسائل التواصل. باللغة العربية فقط، جملة أو جملتان.`;
    const resp = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
    });
    return resp.choices[0].message.content ?? "";
  },
});

export const chatWithAI = action({
  args: {
    message: v.string(),
    history: v.optional(v.array(v.object({ role: v.string(), content: v.string() }))),
  },
  handler: async (ctx, args) => {
    const messages: any[] = [
      {
        role: "system",
        content: "أنت مساعد ذكي ومفيد في تطبيق دردشة اجتماعي. أجب باللغة العربية دائماً بشكل ودي وقصير.",
      },
      ...(args.history ?? []),
      { role: "user", content: args.message },
    ];
    const resp = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages,
    });
    return resp.choices[0].message.content ?? "";
  },
});

export const analyzeImageAndReport = action({
  args: {
    imageUrl: v.string(),
    reportedSakiId: v.optional(v.string()),
    userQuestion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const systemPrompt = args.reportedSakiId
      ? `أنت محلل محتوى ذكي في تطبيق اجتماعي. مهمتك تحليل الصور للكشف عن المحتوى المسيء أو المخالف. قيّم الصورة وأعطِ:
1. وصف موجز للصورة
2. هل تحتوي على محتوى مخالف؟ (نعم/لا)
3. نوع المخالفة إن وجدت (محتوى جنسي، عنف، تحرش، محتوى مسيء، لا مخالفة)
4. توصيتك: (حظر فوري، تحذير، لا إجراء)
أجب باللغة العربية بشكل موجز ومنظم.`
      : `أنت مساعد ذكي في تطبيق اجتماعي. حلل هذه الصورة وأجب على سؤال المستخدم إن وجد. أجب باللغة العربية.`;

    const userContent: any[] = [
      { type: "image_url", image_url: { url: args.imageUrl } },
    ];
    if (args.userQuestion) {
      userContent.unshift({ type: "text", text: args.userQuestion });
    } else if (args.reportedSakiId) {
      userContent.unshift({ type: "text", text: `حلل هذه الصورة المرفوعة من المستخدم ذو الـ ID: ${args.reportedSakiId}` });
    } else {
      userContent.unshift({ type: "text", text: "صف هذه الصورة وحللها." });
    }

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 500,
    });
    return resp.choices[0].message.content ?? "";
  },
});

export const generateText = action({
  args: {
    prompt: v.string(),
    type: v.union(
      v.literal("bio"),
      v.literal("status"),
      v.literal("message"),
      v.literal("poem"),
      v.literal("joke"),
      v.literal("general")
    ),
  },
  handler: async (ctx, args) => {
    const typePrompts: Record<string, string> = {
      bio: `اكتب نبذة شخصية جذابة وقصيرة (3 جمل) عن شخص يصف نفسه بـ: "${args.prompt}". باللغة العربية.`,
      status: `اكتب حالة مميزة وقصيرة (جملة واحدة) عن: "${args.prompt}". باللغة العربية.`,
      message: `اكتب رسالة ودية وجميلة عن: "${args.prompt}". باللغة العربية.`,
      poem: `اكتب قصيدة قصيرة (4 أبيات) عن: "${args.prompt}". باللغة العربية.`,
      joke: `اكتب نكتة مضحكة ولطيفة عن: "${args.prompt}". باللغة العربية.`,
      general: args.prompt,
    };
    const resp = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: "أنت مساعد إبداعي. أجب باللغة العربية فقط." },
        { role: "user", content: typePrompts[args.type] ?? args.prompt },
      ],
    });
    return resp.choices[0].message.content ?? "";
  },
});

export const generateImage = action({
  args: {
    prompt: v.string(),
    style: v.optional(v.union(
      v.literal("realistic"),
      v.literal("anime"),
      v.literal("artistic"),
      v.literal("cartoon"),
      v.literal("fantasy")
    )),
  },
  handler: async (ctx, args) => {
    const styleMap: Record<string, string> = {
      realistic: "realistic photo, high quality, photorealistic, detailed",
      anime: "anime style, manga art, vibrant colors, Japanese animation",
      artistic: "digital art, artistic, creative, beautiful painting",
      cartoon: "cartoon style, colorful, fun, animated",
      fantasy: "fantasy art, magical, epic, detailed, mystical",
    };
    const styleHint = args.style ? styleMap[args.style] : "high quality, detailed";
    const englishPrompt = `${args.prompt}, ${styleHint}`;

    // Try with user's own OpenAI key first, fallback to convex key
    const apiKey = process.env.OPENAI_API_KEY || process.env.CONVEX_OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_KEY ? undefined : process.env.CONVEX_OPENAI_BASE_URL;

    const openaiImg = new OpenAI({ apiKey, baseURL });

    try {
      const resp = await openaiImg.images.generate({
        model: "dall-e-3",
        prompt: englishPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      return { url: resp.data?.[0]?.url ?? null, error: null };
    } catch (e: any) {
      return { url: null, error: e.message ?? "فشل توليد الصورة" };
    }
  },
});
