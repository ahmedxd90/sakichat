const patterns = [
  /(?:porn|porno|xxx|sexcam|nudes?|onlyfans|hentai|blowjob|fuck|dick|pussy|cum|sexvideo)/i,
  /(?:سكس|اباحي|إباحي|عاري|عارية|جنس صريح|محتوى جنسي|صور عارية|فيديو عاري|ممارسة جنسية|فيديو جنسي)/i,
  /(?:fuck|fucking|shit|bitch|bastard|asshole|idiot|stupid|moron|dumbass|slut|whore|cunt|nigg(?:er|a))/i,
  /(?:كلب|حيوان|خنزير|حقير|تافه|غبي|أحمق|قذر|وسخ|زبالة|لعنة|تباً|تبًا|يلعن|شرموط|شرموطة|قحبة|منيك|كس|طيز|خرا|عرص|ديوث|متناك)/i,
];
const contains = (text) => {
  const spaced = text.normalize("NFKC").replace(/[\u064B-\u065F\u0670\u06D6-\u06EDـ]/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "").toLowerCase();
  const compact = spaced.replace(/[^\p{L}\p{N}]/gu, "");
  return patterns.some((pattern) => pattern.test(spaced) || pattern.test(compact));
};
const cases = [
  ["هذه رسالة عادية ومحترمة", false],
  ["you are an idiot", true],
  ["هذا محتوى إباحي", true],
  ["غـبـي", true],
  ["p o r n", true],
];
for (const [text, expected] of cases) {
  const actual = contains(text);
  if (actual !== expected) throw new Error(`Moderation mismatch: ${text}`);
}
console.log(`Passed ${cases.length} moderation cases`);
