# قائمة مهام إعادة بناء Saki Chat (Agora + Supabase)

## المرحلة 1: تصفير البيانات وتهيئة Supabase
- [x] مسح كافة الجداول الحالية في Supabase والبدء بمخطط نظيف.
- [x] إنشاء جداول PostgreSQL الأساسية (users, profiles, rooms, messages, store, transactions).
- [x] تهيئة علاقات قاعدة البيانات والفهارس (Indexes).

## المرحلة 2: التبديل من ZEGOCLOUD إلى Agora
- [x] إزالة كافة مراجع ZEGOCLOUD من الكود (hooks, components, services).
- [x] إعادة تفعيل Agora SDK للاتصال الصوتي والبث المباشر.
- [x] ربط مفاتيح Agora (App ID, Certificate) في النظام الجديد.

## المرحلة 3: ترحيل المنطق البرمجي (Backend)
- [x] ترحيل نظام المستخدمين والملفات الشخصية إلى Supabase Auth وPostgreSQL.
- [x] إعادة بناء نظام تسجيل الدخول (Google OAuth) ليعمل مع Supabase Auth.
- [ ] إعادة بناء نظام الغرف والمقاعد والصلاحيات.

## المرحلة 4: إعادة بناء الألعاب
- [ ] تحويل منطق لعبة DJ Spin إلى النظام الجديد.
- [ ] تحويل منطق لعبة Saki Party (حفلة ساكي) إلى النظام الجديد.
- [ ] التأكد من تسوية الرهانات والأرباح في PostgreSQL.

## المرحلة 5: الاختبار والبناء النهائي
- [ ] فحص TypeScript لكامل المشروع لضمان عدم وجود أخطاء.
- [ ] بناء نسخة APK و AAB جديدة وموقعة.
- [ ] إنشاء Tag مرجعي (v1.1.0) في GitHub لحفظ حالة المشروع الحالية.
- [ ] اختبار النظام بالكامل (تسجيل دخول -> إنشاء غرفة -> اتصال صوتي Agora -> لعب).

## إصلاح طارئ: تعطل Android بسبب Supabase
- [x] فحص ملفات تهيئة Supabase ومراجع `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY`.
- [x] فحص إعدادات Vite وGitHub Actions وملفات البيئة المستخدمة أثناء بناء Android.
- [x] تطبيق إصلاح آمن يمنع انهيار التطبيق عند غياب متغيرات البيئة ويوفر إعدادات البناء الصحيحة.
- [x] تشغيل فحص TypeScript وبناء الويب وCapacitor/Android.
- [x] إنشاء إصدار Android v1.1.2 موقّع وتسليم رابط التحميل المباشر.
- [ ] إبلاغ المستخدم بضرورة اختبار تسجيل الدخول والغرف بعد تثبيت النسخة الجديدة.

### ملاحظة الخطأ
يظهر في Android: `Uncaught Error: supabaseUrl is required.` ثم يفشل تركيب الواجهة بعد 8 ثوانٍ. هذا يعني أن `VITE_SUPABASE_URL` لم يصل إلى bundle النهائي أو أن اسم المتغير المستخدم في الكود لا يطابق اسم المتغير المعرّف في بيئة البناء.

### النتيجة المتوقعة
لا يبدأ التطبيق بدون تهيئة صحيحة؛ يجب تضمين رابط Supabase العام ومفتاح anon العام في عملية بناء الواجهة، مع عدم تضمين أي service-role أو أسرار خادم داخل Android.

### النتيجة المنفذة
تم دفع الإصلاح إلى GitHub وإنشاء الإصدار `v1.1.2`. نجح بناء APK وAAB الموقّعين في GitHub Actions، وأصبحا منشورين في GitHub Release. تمت إضافة `.env.production` ويحتوي فقط على إعدادات Supabase العامة اللازمة لواجهة Vite، كما أضيف fallback يمنع توقف WebView إذا غابت البيئة مستقبلاً.

### Style Reminder
هذا الملف توثيقي فقط ولا يحتوي على واجهة؛ أي تغييرات UI لاحقة يجب أن تحافظ على أسلوب Saki الحالي دون إدخال تدرجات أو عناصر زخرفية غير لازمة.

## إصلاح طارئ ثانٍ: GlobalErrorBoundary بعد تركيب React
- [x] استخراج مسار الخطأ من سجلات بدء التطبيق وGlobalErrorBoundary.
- [x] تحديد السبب: `App.tsx` يستدعي `useQuery` و`useMutation` من Convex، بينما `main.tsx` كان يركب App دون `ConvexProvider`.
- [x] إعادة إضافة `ConvexProvider` باستخدام العميل الموجود في `src/lib/convexClient.ts`، مع الإبقاء على `SupabaseProvider`، وتحديث رقم الإصدار إلى 1.1.3.
- [x] تشغيل فحص TypeScript بعد التعديل.
- [x] بناء Android والتحقق من نجاح الحزمة في GitHub Actions.
- [x] إصدار APK جديد v1.1.3 وإرسال رابط مباشر للمستخدم.

## المرحلة 6: الإزالة الكاملة لـ Convex والاعتماد على Supabase
- [x] جرد كافة مراجع `convex/react` و `api.*` في ملفات المشروع.
- [x] تحليل خطأ `signIn` undefined في ملف `pasted_content_2.txt` ومعالجة مسار Auth بعد إزالة Convex.
- [x] تحويل كافة استدعاءات `useQuery` و `useMutation` في `App.tsx` و `LoginPage` و `RegisterPage` و `RoomPage` إلى Supabase.
- [x] إزالة `ConvexProvider` نهائياً من `main.tsx`.
- [x] حذف ملفات `convex/` و `src/lib/convexClient.ts`.
- [x] تحديث `package.json` وإزالة حزم Convex وZEGOCLOUD، وحذف workflow نشر Convex.
- [x] بناء Android v1.1.4 وتسليم النسخة النهائية.

## إصلاح طارئ ثالث: إعادة توجيه Google OAuth إلى localhost
- [x] فحص قيمة redirectTo ومسارات OAuth في Supabase وCapacitor.
- [x] تحديد سبب إعادة التوجيه إلى localhost وإصلاحه للويب وأندرويد.
- [x] اختبار العودة من Google ومعالجة deep link داخل التطبيق.
- [x] تشغيل TypeScript/build وبناء APK/AAB بعد الإصلاح.
- [x] حفظ checkpoint وتسليم الإصدار النهائي.

## تصحيح Site URL وإعدادات Supabase OAuth (2026-08-27)
- [x] جلب عنوان الويب الفعلي للمشروع (Domain).
- [x] تحديث redirectTo في الكود ليتطابق مع النطاق الجديد.
- [x] إضافة `saki.chat.co://callback` إلى قائمة Redirect URLs في Supabase.
- [x] توجيه المستخدم لتغيير Site URL في لوحة Supabase إلى النطاق الفعلي.
- [x] إعادة بناء APK/AAB واختبار مسار OAuth بالكامل.

## إصلاح «العنصر غير موجود» بعد Google OAuth
- [x] تتبع شاشة إكمال المعلومات واستدعاء حفظ الملف الشخصي.
- [x] التحقق من إنشاء سجل المستخدم في Supabase قبل التحديث.
- [x] إصلاح التعامل مع عدم وجود profile أو user metadata.
- [x] إعادة فحص TypeScript وبناء Android بعد الإصلاح.

السبب المؤكد: bucket التخزين `avatars` لم يكن موجوداً في Supabase، وكان رفع الصورة يفشل برسالة `Bucket not found` التي تُترجم للمستخدم إلى «العنصر غير موجود». تم إنشاء bucket عام للقراءة مع حد رفع 5MB وسياسات رفع/تحديث للمستخدمين المسجلين، كما أصبح حفظ الملف يستخدم `upsert` على `user_id` ثم يحدّث ProfileProvider.

السياق: يظهر بعد اختيار حساب Google الخطأ ERR_CONNECTION_REFUSED لأن المتصفح يحاول فتح localhost.

المبدأ: عدم تخزين أو عرض أسرار OAuth أو مفاتيح خاصة في الكود أو السجل.
