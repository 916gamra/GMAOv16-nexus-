# 📋 GMAO v16 Nexus — دليل تنفيذ الإصلاحات المعمارية الشامل (GMAO Fixes Guide)

دليل شامل لكافة الخدمات المركزية، المخازن الموحدة، وهيكلية الصيانة الوقائية المفككة لدعم المطورين والوكلاء البرمجيين.

---

## 🎯 ملخص الخدمات المركزية والمخازن المنفذة

### 1. نظام التسجيل الموحد (Unified Logger)
- **المسار الأساسي:** `src/core/utils/Logger.js` و `src/core/logger/LoggerService.js`
- **الوظيفة:** استبدال `console.log` بنظام تسجيل محكوم بمستويات (DEBUG, INFO, WARN, ERROR) مع إمكانية التفعيل والتعطيل التلقائي في بيئة الإنتاج لمنع تسريب البيانات الحساسة وحفظ الأداء.

### 2. خدمة الإشعارات والتنبيهات الموحدة (Notification Service)
- **المسارات:** `src/services/NotificationService.js` و `src/core/utils/NotificationService.js`
- **الوظيفة:** إدارة الرسائل والتنبيهات بنمط النشر/الاشتراك (Pub/Sub) بدلاً من `window.alert` لضمان التوافق مع بيئة iFrame. تشتمل على تنبيهات مخصصة لإنشاء الأوامر وحركات المخزون وحالات انتهاء الصلاحية والتصدير.

### 3. خدمة الصلاحيات والأمان الموحدة (PermissionService)
- **المسار:** `src/application/services/PermissionService.js`
- **الوظيفة:** توحيد التحكم بالأدوار والصلاحيات (RBAC) بالربط المباشر مع `AuthService` و `RBACService` للتحقق السريع عبر `PermissionService.can(permission)`.

### 4. خدمة البحث والفلترة متعددة الرموز (SearchService)
- **المسار:** `src/application/services/SearchService.js`
- **الوظيفة:** توفير خوارزميات البحث السريع متعدد الحقول (Multi-token Search)، والتطبيع ضد اللهجات والهمزات، والمطابقة الضبابية (Fuzzy Search) للمقالات والآلات والمهام الوقائية.

### 5. خدمة التصدير والاستيراد الشاملة (ExportImportService)
- **المسار:** `src/application/services/ExportImportService.js`
- **الوظيفة:** تصدير واستيراد متقدم لملفات Excel (.xlsx) و JSON مع معالجة الأخطاء والتكامل مع نظام الإشعارات.

### 6. مخازن الحالة الموحدة (Zustand Stores)
- **المسارات:**
  - `src/stores/useStockStore.js`: إدارة المخزون، الحركات، والتحقق التلقائي من تكرار المراجع.
  - `src/stores/useMachineStore.js`: إدارة سجل الآلات والورش والمناطق.
  - `src/stores/useWarehouseStore.js`: إدارة مستودع المكونات والقوالب وعائلات القطع.
  - `src/stores/index.js`: نقطة تصدير موحدة لكافة المخازن.

### 7. تفكيك وهيكلة خدمة الصيانة الوقائية (Modular Preventive Services)
- **المسارات:**
  - `src/application/services/preventive/ActionService.js`: إدارة الأفعال القياسية (Actions).
  - `src/application/services/preventive/GuideService.js`: إدارة الأدلة الفنية للمكونات (Guides).
  - `src/application/services/preventive/PlanService.js`: إدارة خطط الصيانة، التوزيع عبر 52 أسبوعاً، وتوليد المهام.
  - `src/application/services/preventive/TaskService.js`: إدارة وتنفيذ المهام الوقائية، الاستيراد من Excel، وتحميل بيانات المصنع الحقيقية.
  - `src/application/services/preventive/index.js`: واجهة موحدة للتصدير.
- **التوافق التراجعي:** كائن `PreventiveService.js` يستمر في العمل كـ Facade موحد لتفادي كسر أي واجهة مستخدم سابقة.

### 8. مكون الجدول الافتراضي عالي الأداء (VirtualizedTable)
- **المسار:** `src/presentation/components/VirtualizedTable.jsx`
- **الوظيفة:** استخدام `react-window` لمعالجة وعرض آلاف السجلات بدون أي بطء أو تجميد في واجهة المستخدم، مع استجابة تامة لأبعاد الشاشة.
