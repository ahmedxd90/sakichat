// ── دالة تنظيف رسائل الخطأ من الـ backend ──
// تحوّل رسائل الخطأ التقنية إلى رسائل عربية مفهومة للمستخدم

const ERROR_MAP: Record<string, string> = {
  // Auth
  "Not authenticated": "يجب تسجيل الدخول أولاً",
  "غير مصرح": "يجب تسجيل الدخول أولاً",
  "غير مصرح.": "يجب تسجيل الدخول أولاً",
  "Unauthorized": "غير مصرح بهذه العملية",
  "User not found": "المستخدم غير موجود",

  // Coins
  "رصيدك غير كافٍ": "رصيدك غير كافٍ لإتمام هذه العملية",
  "Insufficient balance": "رصيدك غير كافٍ",
  "Not enough coins": "رصيدك من العملات غير كافٍ",

  // Room
  "الغرفة غير موجودة": "الغرفة غير موجودة أو تم حذفها",
  "Room not found": "الغرفة غير موجودة",
  "الغرفة مقفلة": "هذه الغرفة مقفلة",
  "لديك تحدي PK نشط بالفعل": "لديك تحدي PK نشط بالفعل",
  "غرفتك في تحدي PK بالفعل": "غرفتك في تحدي PK بالفعل",

  // Index errors (hide completely)
  "Index": "حدث خطأ مؤقت، يرجى المحاولة مرة أخرى",
  "not found": "العنصر غير موجود",
  "Server Error": "حدث خطأ في الخادم، يرجى المحاولة مرة أخرى",
  "Request ID": "حدث خطأ مؤقت، يرجى المحاولة مرة أخرى",
};

// أنماط تقنية يجب إخفاؤها
const TECHNICAL_PATTERNS = [
  /\[Request ID: [a-f0-9]+\]/,             // [Request ID: abc123]
  /Server Error\s*\n/,                      // Server Error\n
  /Uncaught Error:/,                        // Uncaught Error:
  /at handler \([^)]+\)/,                  // at handler (file.ts:line)
  /at [a-zA-Z]+ \([^)]+\)/,               // at function (file:line)
  /Called by client/,                       // Called by client
  /\.ts:\d+:\d+/,                          // file.ts:123:45
  /Index [a-zA-Z]+\.[a-zA-Z_]+ not found/, // Index table.index not found
  /\n\s+at /,                              // stack trace lines
];

export function cleanErrorMessage(error: any): string {
  let msg = "";

  if (typeof error === "string") {
    msg = error;
  } else if (error?.message) {
    msg = error.message;
  } else if (error?.data?.message) {
    msg = error.data.message;
  } else {
    return "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى";
  }

  // إذا كانت الرسالة تحتوي على أنماط تقنية، أخفِها
  for (const pattern of TECHNICAL_PATTERNS) {
    if (pattern.test(msg)) {
      // حاول استخراج الرسالة الحقيقية بعد "Uncaught Error:"
      const uncaughtMatch = msg.match(/Uncaught Error:\s*([^\n]+)/);
      if (uncaughtMatch) {
        msg = uncaughtMatch[1].trim();
        // تحقق مرة أخرى إذا كانت الرسالة المستخرجة تقنية
        if (TECHNICAL_PATTERNS.some((p) => p.test(msg))) {
          return "حدث خطأ مؤقت، يرجى المحاولة مرة أخرى";
        }
        break;
      }
      return "حدث خطأ مؤقت، يرجى المحاولة مرة أخرى";
    }
  }

  // تنظيف الرسالة من أي نص تقني متبقٍ
  msg = msg
    .replace(/\[[A-Z][A-Z0-9_ ]+[^\]]*\]/g, "")
    .replace(/\[Request ID: [^\]]+\]/g, "")
    .replace(/Server Error\s*/g, "")
    .replace(/Uncaught Error:\s*/g, "")
    .replace(/Called by client\s*/g, "")
    .replace(/\n\s+at [^\n]+/g, "")
    .trim();

  // ابحث في خريطة الترجمة
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return value;
  }

  // إذا كانت الرسالة قصيرة ومفهومة (عربية أو إنجليزية بسيطة)، أعدها كما هي
  if (msg.length > 0 && msg.length < 120 && !msg.includes("at ") && !msg.includes(".ts:")) {
    return msg;
  }

  return "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى";
}

// دالة مساعدة لاستخدامها مع toast
export function toastError(toast: any, error: any) {
  toast.error(cleanErrorMessage(error));
}
