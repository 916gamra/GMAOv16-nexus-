# 🤖 دليل مطوري ووكلاء الذكاء الاصطناعي (AI Agent & Core Engineering Spec)

هذا التوثيق يمثل المواصفة الهندسية الدقيقة لنظام **CIOB GMAO Light UI Excel**، وهو مخصص لمساعدي الذكاء الاصطناعي (**AI Agents**) والمهندسين الذين يقومون بصيانة وتطوير النظام، لضمان عدم كسر القواعد الأساسية، والحفاظ على التطابق الدقيق مع **Excel Twin** ومبدأ الـ **100% Offline Client-Side Execution**.

---

## 🏛️ 1. المبادئ المعمارية الحاكمة (Golden Architecture Principles)

1. **العمل المستقل دون خادم (Strict Offline Client-Side Execution):**
   - التطبيق لا يعتمد على خادم Node/Express لتشغيل قواعد بيانات (مثل SQLite أو Postgres) في وضع الإنتاج للعميل.
   - محرك التخزين الأساسي هو **IndexedDB** للبيانات الكبيرة و **LocalStorage** للتهيئة والحالات الخفيفة عبر `storageService` و `indexedDBService`.
   - يمنع تماماً تثبيت حزم C++ Native (مثل `better-sqlite3`, `sharp`, `sqlite3`) في حزم الواجهة الأمامية.

2. **نموذج التوأم لإكسيل (Excel Twin Model & Single Source of Truth):**
   - كل جدول هو صورة طبق الأصل من ورقة عمل (`Worksheet`) في النموذج المرجعي `GMAO_Light_Template_V2_Formules.xlsx`.
   - جميع الحسابات (الأرصدة، مجموع الوارد والصادر، التنبيهات) تتم في الذاكرة اللحظية عبر `formulaEngine.js` ومحسوبة في الوقت الحقيقي عبر خطاف `useAppCalculations`.

3. **التحسين الرياضي للأداء والتصيير (React 19 & Memoization Discipline):**
   - استخدام `useMemo` و `useCallback` لمنع أي Re-render غير مبرر في الشاشات والجداول الكبيرة.
   - تثبيت حجم الجداول على معيار **20 سطر مرئي** (سطر العنوان + 19 سطر بيانات أو سطور بديلة فارغة ناعمة) مع حاوية تمرير هيدروليكية `max-h-[62vh] overflow-y-auto`.

---

## 🧬 2. هيكلية الحالات وتدفق البيانات (State Management & Hooks Flow)

```text
[LocalStorage / IndexedDB]
       │
       ▼
[useGmaoState] ── (Composes 5 Domain Sub-Hooks)
       │
       ├─► useStockSubState        (rawStock, designations, types)
       ├─► useMovementSubState     (mouvements)
       ├─► useMachineSubState      (machines, families, templates)
       ├─► useWarehouseSubState    (warehouseItems, compFamilies, compTemplates, partTypes, partDesignations)
       └─► useUserSubState         (zones, technicians, operations)
       │
       ▼
[useGmaoPersistence] ── (useAutoSave: Debounced 1000ms + useStateSync Multi-Tab)
       │
       ▼
[useAppCalculations] ── (Real-time SUMIFS: stockItems, stockKPIs, warehouseItemsComputed)
       │
       ▼
[useAppRouterProps] ── (useMemo: Passes optimized props to modules)
       │
       ▼
[AppRouter] ── (Renders Active View: Dashboard, Stock, SortieRapide, Machines, etc.)
```

---

## 📐 3. محرك الحسابات الرياضي (`src/utils/formulaEngine.js`)

### معادلة الرصيد الفعلي للمقال (`Stock Actuel`):
```excel
= StockInitial + SUMIFS(Mouvement[Quantite], Mouvement[Ref], [@Ref], Mouvement[Type], "Entrée") - SUMIFS(Mouvement[Quantite], Mouvement[Ref], [@Ref], Mouvement[Type], "Sortie")
```
في الجافاسكريبت:
```javascript
const entrees = sumMovements(mouvements, ref, 'Entrée');
const sorties = sumMovements(mouvements, ref, 'Sortie');
const stockActuel = Number(stockInitial || 0) + entrees - sorties;
```

### معادلة شارة التنبيه (`Alerte`):
```javascript
if (isAchatUnique) {
  alerte = 'OK';
} else if (displayStock <= 0) {
  alerte = 'RUPTURE'; // خلفية حمراء
} else if (displayStock <= Number(seuil || 0)) {
  alerte = 'ALERTE';  // خلفية برتقالية
} else {
  alerte = 'OK';      // خلفية خضراء
}
```

---

## 🔒 4. الأمان والمصادقة الصارمة (`src/core/security/AuthService.js`)

- **تشفير كلمات المرور:** يتم التشفير حصراً بخوارزمية الهاش الأحادية (`bcrypt.hashSync(pass, 10)`).
- **قواعد منع التسريب (Data Leak Prevention):**
  - **يمنع قطعياً** تخزين `defaultPass` أو أي كلمة مرور صريحة في كائنات المستخدمين بعد التعيين.
  - **يمنع قطعياً** إدراج `passwordHash` أو `defaultPass` داخل كائن الجلسة `currentSession` في `localStorage`.
  - يجب تنظيف الجلسة لتقتصر فقط على: `id`, `username`, `name`, `role`, `token`, `loginTime`.

---

## 🧪 5. مصفوفة الاختبارات والتحقق البرمجي (Testing Standard)

التطبيق مدعوم ببيئة اختبارات شاملة مبنية على **Vitest**:

| مسار ملف الاختبار | نطاق التحقق والمهمة |
| :--- | :--- |
| `src/test/unit/AppCalculations.test.jsx` | فحص محرك حسابات الوارد والمنصرف والرصيد الفعلي والتنبيهات. |
| `src/test/unit/baselineStock.test.js` | فحص اتساق بيانات المخزون المرجعية مع نموذج إكسيل. |
| `src/test/unit/MovementNormalization.test.js` | فحص تنظيف وتأهيل حركات الصرف والإدخال والتدفقات الـ 5. |
| `src/test/unit/AutoBackupService.test.js` | فحص النسخ الاحتياطي المضغوط وفك الضغط واسترجاع البيانات. |
| `src/test/unit/PermissionGate.test.jsx` | فحص بوابات الصلاحيات وحماية الشاشات حسب رتبة المستخدم. |
| `src/test/utils/securityService.test.js` | فحص تشفير الـ PIN والتحقق الأمني. |
| `src/test/e2e/offlineSync.test.js` | فحص المزامنة المحلية عند انقطاع وعودة الاتصال. |

**لتشغيل الاختبارات في أي وقت:**
```bash
npx vitest run
```

---

## ⚠️ 6. المحظورات الهندسية (Strict Anti-Patterns)

1. **إعادة إنشاء خادم خلفي دون طلب المستخدم:** التطبيق يعمل محلياً في المتصفح، لا تقم بإنشاء مسارات Express Backend إجبارية للمخزون أو المستخدمين.
2. **إعادة تثبيت حزم C++ Native الممنوعة في المتصفح:** مثل `sharp` أو `better-sqlite3`.
3. **تغيير أسماء أعمدة جداول Excel:** يمنع تعديل أسماء الحقول الأساسية (`ref`, `designation`, `stockInitial`, `quantite`, `code_bon`, `id_zone`, `id_machine_registered`) لأنها مرتبطة مباشرة بملف `GMAO_Light_Template_V2_Formules.xlsx`.
4. **تجاوز معايير واجهة المستخدم:** ممنوع استخدام الألوان المتدرجة الفاقعة (Purple-to-Blue Gradients)، أو الأيقونات التعبيرية (Emojis) كأيقونات أساسية بدلاً من أيقونات Lucide SVG.
