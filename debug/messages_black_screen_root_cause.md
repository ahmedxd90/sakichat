# تشخيص الشاشة السوداء في صفحة الرسائل

تم اختبار نسخة الويب محلياً عبر `http://127.0.0.1:4173/?debug=messages-fix-2` وتسجيل الدخول بحساب اختبار. عند الضغط على زر الرسائل في الشريط السفلي، ظهرت شاشة خطأ بدلاً من ترك التطبيق فارغاً بعد إضافة Error Boundary.

الخطأ الحقيقي الذي ظهر:

```text
Error: [CONVEX Q(friends:getFriends)] [Request ID: 63c0070283893600] Server Error
Could not find public function for 'friends:getFriends'.

Called by client
```

الاستنتاج: الدالة `getFriends` موجودة في ملف المشروع المحلي `convex/friends.ts`، لكنها لم تكن منشورة في بيئة Convex الحية `https://tremendous-eel-230.convex.cloud`. هذا الاستعلام يُستدعى مباشرة من `MessagesPage` عبر `api.friends.getFriends`، لذلك كان فشل الاستعلام يؤدي إلى انهيار شجرة React وظهور الشاشة السوداء.

تم نشر الدالة بنجاح إلى بيئة Convex الحية باستخدام مفتاح النشر السابق الصحيح، وظهرت رسالة:

```text
Successfully deployed Convex functions to https://tremendous-eel-230.convex.cloud
```

بعد النشر وإعادة تحميل التطبيق، عادت الصفحة الرئيسية للعمل. يلزم إكمال اختبار الضغط على الرسائل بعد إغلاق نافذة مكافأة المستخدم الجديد، ثم اختبار تبويب الأصدقاء، وإعادة بناء APK/AAB إذا لزم الأمر.

تم أيضاً إضافة `GlobalErrorBoundary` إلى `src/main.tsx` ليعرض رسالة مفيدة وتفاصيل تقنية بدلاً من الشاشة السوداء عند حدوث أي خطأ مستقبلي.

مصدر الاختبار: التطبيق المحلي والبيئة الحية المتصلة بـ Convex؛ لا توجد روابط بحث خارجية إضافية.
