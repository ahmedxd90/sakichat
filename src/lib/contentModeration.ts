const INAPPROPRIATE_CHAT_PATTERNS = [
  // محتوى إباحي أو جنسي صريح.
  /(?:porn|porno|xxx|sexcam|nudes?|onlyfans|hentai|blowjob|fuck|dick|pussy|cum|sexvideo)/i,
  /(?:سكس|اباحي|إباحي|عاري|عارية|جنس صريح|محتوى جنسي|صور عارية|فيديو عاري|ممارسة جنسية|فيديو جنسي)/i,
  // شتائم وإهانات شائعة، بما فيها الكتابة الإنجليزية أو العربية.
  /(?:fuck|fucking|shit|bitch|bastard|asshole|idiot|stupid|moron|dumbass|slut|whore|cunt|nigg(?:er|a))/i,
  /(?:كلب|حيوان|خنزير|حقير|تافه|غبي|أحمق|قذر|وسخ|زبالة|لعنة|تباً|تبًا|يلعن|شرموط|شرموطة|قحبة|منيك|كس|طيز|خرا|عرص|ديوث|متناك)/i,
];

function normalizeForModeration(content: string): { spaced: string; compact: string } {
  const spaced = content
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06EDـ]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
  return { spaced, compact: spaced.replace(/[^\p{L}\p{N}]/gu, "") };
}

export function containsInappropriateChatContent(content: string): boolean {
  const { spaced, compact } = normalizeForModeration(content);
  return INAPPROPRIATE_CHAT_PATTERNS.some((pattern) => pattern.test(spaced) || pattern.test(compact));
}

export const INAPPROPRIATE_CONTENT_MESSAGE = "لا يمكن إرسال الشتائم أو المحتوى غير اللائق في دردشة الغرفة";

export function maskInappropriateContent(): string {
  return "[محتوى محجوب]";
}

export default containsInappropriateChatContent;
