# 📋 GMAO v16 Nexus — دليل تنفيذ الإصلاحات المعمارية الشامل (GMAO Fixes Guide)

هذا الدليل يوثق الإصلاحات الأساسية والخدمات المركزية التي تم إنشاؤها وفقاً لخطة التطوير الشاملة.

---

## 🎯 ملخص الإصلاحات والخدمات المنفذة

### 1. نظام تسجيل موحد (Unified Logger)
- **المسار:** `src/core/utils/Logger.js`
- **الوظيفة:** استبدال `console.log` بنظام تسجيل محكوم بمستويات (DEBUG, INFO, WARN, ERROR, SILENT) مع إمكانية التفعيل والتعطيل في بيئة الإنتاج لمنع تسريب البيانات وتحسين الأداء.

### 2. خدمة التحقق من صحة البيانات (Zod Validation Service)
- **المسار:** `src/core/utils/ValidationService.js`
- **الوظيفة:** مخططات تحقق قوية لكافة الكيانات الأساسية (`StockItem`, `Machine`, `Zone`, `Movement`) مع رسائل خطأ دقيقة ومنع إدخال بيانات غير متوافقة.

### 3. خدمة الإشعارات المركزية (Notification Service)
- **المسار:** `src/core/utils/NotificationService.js`
- **الوظيفة:** إدارة الرسائل والتنبيهات بنمط النشر/الاشتراك (Pub/Sub) بدلاً من `window.alert` لضمان التوافقية مع بيئة iFrame وواجهات المستخدم التفاعلية.

### 4. إدارة الحالة المركزية بـ Zustand (Zustand Stores)
- **المسارات:** 
  - `src/stores/useStockStore.js`
  - `src/stores/useMachineStore.js`
- **الوظيفة:** مخازن حالة تفاعلية وموحدة مع دوال CRUD مدمجة بالتحقق التلقائي وتسجيل العمليات وتحديث الأرصدة.

### 5. التخزين المؤقت متعدد المستويات (Multi-Level Cache Service)
- **المسار:** `src/core/utils/CacheService.js`
- **الوظيفة:** تخزين L1 في الذاكرة الحية (RAM) و L2 في التخزين المحلي (LocalStorage) مع فترات صلاحية (TTL) قابلة للتخصيص.

### 6. البحث السريع المفهرس (Search Service)
- **المسار:** `src/core/utils/SearchService.js`
- **الوظيفة:** فهرسة الذاكرة للبحث الفوري متعدد الكلمات (Multi-token) والتطابق التقريبي (Fuzzy matching) عبر آلاف السجلات.

### 7. الجداول الافتراضية عالية الأداء (Virtualized Table)
- **المسار:** `src/presentation/components/common/VirtualizedTable.jsx`
- **الوظيفة:** عرض الجداول الضخمة باستخدام `react-window` لتثبيت معدل الإطارات عند 60fps دون تجميد واجهة المستخدم.

### 8. تفكيك وهيكلة خدمة الصيانة الوقائية (Modular Preventive Services)
- **المسارات:**
  - `src/application/services/preventive/ActionService.js`
  - `src/application/services/preventive/GuideService.js`
  - `src/application/services/preventive/PlanService.js`
  - `src/application/services/preventive/TaskService.js`
- **الوظيفة:** فصل المسؤوليات بدقة مع الحفاظ الكامل على التوافق مع الكود القائم.

### 9. خدمة التصدير والاستيراد الموحدة (Export / Import Service)
- **المسار:** `src/core/utils/ExportImportService.js`
- **الوظيفة:** قراءة وتصدير ملفات Excel و JSON بضمانات معالجة الأخطاء والتنبيهات المباشرة.

### 10. نظام التحكم في الصلاحيات والأمان (Permission & RBAC System)
- **المسارات:**
  - `src/core/security/PermissionService.js`
  - `src/presentation/components/common/PermissionGate.jsx`
- **الوظيفة:** بوابات صلاحية تعتمد على الأدوار (RBAC) لحماية الإجراءات الحساسة (حذف، تعديل) في واجهات المستخدم.
