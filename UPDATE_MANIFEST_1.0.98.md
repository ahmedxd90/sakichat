# Saki Chat — سجل الحفظ

## الإصدار

تم حفظ المشروع الأصلي مع الإصدار **1.0.98**، ورقم Android هو `versionCode 98`.

## التحديثات المحفوظة

يتضمن هذا الأرشيف إصلاح حلقة إعادة التحميل ونافذة مغادرة الصفحة، شاشة تشخيص الإقلاع الداخلية، إصلاحات الدردشة الخاصة للصور والفيديو والتسجيل الصوتي والإبلاغ وحالة الكتابة والفقاعات حسب الأرستقراطية، إعدادات توفير البطارية، الإصدار الحقيقي، فحص الشبكة، تنظيف التخزين المؤقت، حذف سجلات الدردشة، قائمة الحظر، الإشعارات، والحساب المرتبط بجوجل.

كما يتضمن إصلاح حماية `App.getLaunchUrl()` عند عدم وجود رابط، ومنع استدعاء دالة قائمة المحظورين غير المنشورة في Convex حتى لا يتسبب ذلك في انهيار التطبيق. يجب نشر دالة `chatBlocks:listMyBlockedUsers` في بيئة Convex الإنتاجية قبل إعادة تفعيل استعلام قائمة المحظورين.

## الملفات الرئيسية

- `src/App.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/ChatPage.tsx`
- `src/components/GlobalErrorBoundary.tsx`
- `src/components/GoogleAuthDeepLinkHandler.tsx`
- `src/components/PushNotificationManager.tsx`
- `convex/chatBlocks.ts`
- `convex/messages.ts`
- `convex/fcmSubscriptions.ts`
- `android/app/build.gradle`
- `todo.md`

## ملاحظات الأرشفة

تم استبعاد مجلدات الاعتماديات وملفات البناء المؤقتة لتقليل حجم الأرشيف، مثل `node_modules` و`dist` و`android/.gradle` وملفات `build`. كما تم استبعاد ملفات البيئة والمفاتيح وملفات التوقيع. يجب إعادة إنشاء ملف البيئة محليًا من متغيرات النشر الآمنة قبل البناء.

## البناء

```bash
pnpm install
pnpm run build
pnpm exec cap sync android
cd android && ./gradlew assembleRelease bundleRelease
```
