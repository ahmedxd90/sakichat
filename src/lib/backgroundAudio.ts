/**
 * إيقاف أي تشغيل صوتي خلفي عند مغادرة الغرفة.
 * تُحافظ الوحدة على واجهة مستقرة حتى تعمل نسخة الويب وCapacitor معًا.
 */
export async function stopBackgroundAudio(): Promise<void> {
  try {
    if (typeof document !== "undefined") {
      document.querySelectorAll("audio[data-background-audio=\"true\"]").forEach((node) => {
        const audio = node as HTMLAudioElement;
        audio.pause();
        audio.currentTime = 0;
      });
    }
  } catch {
    // لا نمنع مغادرة الغرفة بسبب فشل تنظيف صوت خلفي.
  }
}
