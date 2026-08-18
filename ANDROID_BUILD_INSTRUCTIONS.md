# تعليمات بناء تطبيق Saku Voice Chat لنظام أندرويد (APK / AAB)

يوفر هذا المستند الدليل الشامل لتجميع تطبيق **Saku Voice Chat** (النسخة المطورة بأسلوب Ahleen الملكي ونظام PRO Membership) كملف تنفيذي **APK** أو حزمة نشر **AAB** باستخدام أداة **Capacitor** و **Android Studio**.

---

## 1. المتطلبات الأساسية
- **Node.js** (الإصدار 18 أو أحدث)
- **pnpm** أو npm
- **Android Studio** (مع أحدث إصدار من Android SDK و Build Tools 34+)
- **Java Development Kit (JDK 17)**

---

## 2. خطوات تجهيز المشروع وبناء الواجهة

1. **فك ضغط المشروع أو فتح مجلد العمل:**
   ```bash
   cd /home/ubuntu/saku_project
   ```

جهازك يحتوي على كود المصدر المحدث بالكامل (React + Vite + Tailwind CSS + Convex + Capacitor).

2. **تثبيت الحزم:**
   ```bash
   pnpm install
   ```

3. **بناء ملفات الويب (Production Build):**
   ```bash
   pnpm build
   ```
   سيقوم هذا الأمر بتوليد مجلد `dist` يحتوي على ملفات التطبيق الجاهزة للدمج مع أندرويد.

---

## 3. إعداد وفتح مشروع أندرويد عبر Capacitor

1. **مزامنة ملفات الويب مع منصة أندرويد:**
   ```bash
   npx cap sync android
   ```

2. **فتح مشروع أندرويد مباشرة في Android Studio:**
   ```bash
   npx cap open android
   ```
   *(أو افتح مجلد `android` يدويًا داخل Android Studio).*

---

## 4. توليد ملفات APK و AAB من داخل Android Studio

1. **بناء ملف التثبيت المباشر (APK التجريبي):**
   - من القائمة العلوية في Android Studio، اختر:
     `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`
   - بعد انتهاء البناء، ستظهر رسالة نجاح في أسفل الشاشة مع رابط `locate`. اضغط عليه للحصول على ملف `app-debug.apk`.

2. **بناء حزمة النشر على متجر جوجل بلاي (AAB Release Bundle):**
   - من القائمة العلوية، اختر:
     `Build` -> `Generate Signed Bundle / APK...`
   - اختر **Android App Bundle (AAB)** ثم اضغط *Next*.
   - حدد مفتاح التوقيع (Keystore) الخاص بك أو أنشئ مفتاحاً جديداً (KeyStore Path, Password, Key Alias).
   - اختر وضع **release** ثم اضغط **Finish**.
   - سيتم تسيير حزمة النشر `app-release.aab` في مجلد `android/app/release/`.

---

## 5. الأذونات والمميزات المضمنة في التطبيق
تم ضبط ملف `AndroidManifest.xml` ليدعم الأذونات الكاملة المطلوبة لعمل الغرف الصوتية والمكالمات (Agora) ورفع الملفات وتخزينها:
- `INTERNET` و `ACCESS_NETWORK_STATE` (للاتصال بـ Convex و Agora)
- `RECORD_AUDIO` و `MODIFY_AUDIO_SETTINGS` (للصوتيات وغرف الدردشة الصوتية)
- `CAMERA` و `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` (لرفع الصور والملفات واللحظات)
- `FOREGROUND_SERVICE` (لبقاء الغرفة والفقاعة العائمة نشطة في الخلفية أثناء التنقل بين التطبيقات)
