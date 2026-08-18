# ملاحظات جسر Google Native

## النتيجة
مسار Convex Auth القياسي ينشئ رمز تحقق داخليًا ثم يتحقق من `code` و`verifier`. قيمة `serverAuthCode` التي يعيدها Google Native هي رمز Google OAuth مباشر، لذلك لا يمكن تمريرها مباشرة إلى `signIn("google", { code })`.

## المطلوب
يحتاج المسار Native إلى جسر خلفي آمن يستقبل `serverAuthCode`، يستبدله مع Google باستخدام `AUTH_GOOGLE_ID` و`AUTH_GOOGLE_SECRET`، يتحقق من بيانات الحساب، ثم ينشئ جلسة Convex بطريقة مدعومة. لا يجوز وضع `AUTH_GOOGLE_SECRET` داخل Android أو الواجهة.

## توثيق مرجعي
- https://docs.convex.dev/auth/convex-auth
- https://labs.convex.dev/auth/config/oauth
- https://labs.convex.dev/auth/advanced

## قيود الاختبار
اختيار الحساب يمكن اختباره محليًا من APK، لكن نجاح إنشاء جلسة حقيقية يتطلب نشر Action/HTTP endpoint في Convex مع متغيرات الإنتاج، ثم اختبار APK أو AAB بالحزمة `saki.chat.co` وبصمة الشهادة المطابقة.
