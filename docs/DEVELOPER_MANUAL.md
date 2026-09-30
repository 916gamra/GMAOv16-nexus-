# 🏛️ GMAO Industrial Architecture & Developer Master Manual
**CIOB GMAO Light UI Excel — المواصفة الهندسية والمعمارية الشاملة للمطورين والوكلاء الذكيين**

---

## 📑 الفهرس العام (Table of Contents)
1. [دستور النظام وفلسفة الآلة الميكانيكية وشاشة الـ LCD](#1-دستور-النظام-وفلسفة-الآلة-الميكانيكية-وشاشة-الـ-lcd)
2. [بنية المستويين لكل قسم وشجرة النسب والاعتمادية](#2-بنية-المستويين-لكل-قسم-وشجرة-النسب-والاعتمادية)
3. [محرك الإكسيل التفاعلي المتقدم (ExcelJS & HyperFormula Reactive Engine)](#3-محرك-الإكسيل-التفاعلي-المتقدم-exceljs--hyperformula-reactive-engine)
4. [طبقة الاستيراد والفك الذكية (Smart Import Parser Layer)](#4-طبقة-الاستيراد-والفك-الذكية-smart-import-parser-layer)
5. [معمارية الحالة ومخازن الفهرسة اللحظية (State Management & O(1) Stores)](#5-معمارية-الحالة-ومخازن-الفهرسة-اللحظية-state-management--o1-stores)
6. [نموذج التخزين والمزامنة مع الملف التوأم (Storage & Excel Twin Sync)](#6-نموذج-التخزين-والمزامنة-مع-الملف-التوأم-storage--excel-twin-sync)
7. [هيكل البيانات والمخططات العلائقية (Relational Schemas & Entities)](#7-هيكل-البيانات-والمخططات-العلائقية-relational-schemas--entities)
8. [معايير الجودة والأداء ومصفوفة الاختبارات (Quality, Benchmarks & Testing)](#8-معايير-الجودة-والأداء-ومصفوفة-الاختبارات-quality-benchmarks--testing)

---

## 1. دستور النظام وفلسفة الآلة الميكانيكية وشاشة الـ LCD

### ⚙️ المبدأ المعماري الأول: الحتمية الرياضية (Deterministic In-Memory Excel Engine)
* التطبيق يُعامل كأنه **مصنف إكسيل موحد في الذاكرة (Unified In-Memory Excel Workbook)** ذو منطق علائقي حتمي وصارم.
* شاشات وواجهات المستخدم (**UI Views**) هي مجرد **شاشات عرض رقمية (LCD Readouts)**:
  * **يُمنع قطعياً** أن تخترع أي شاشة أو صفحة مصفوفات بيانات محلية مستقلة أو مكررة (Strictly NO Data Silos).
  * الحسابات والإحصائيات والعدادات تتم عبر معادلات إكسيل الصريحة (`SUMIFS`, `COUNTIFS`, `FILTER`, `VLOOKUP`).
  * الحفظ دائم في مصدر حقيقة واحد يغذي كافة الواجهات.

---

## 2. بنية المستويين لكل قسم وشجرة النسب والاعتمادية

### 🧱 2-Tier Architecture per Module
لكل قسم رئيسي في النظام مستويان هندسيان واضحان:
1. **المستوى 1: الصفحات التشغيلية (Transactional / Operations):**
   * مثل: `Correctif Hub` (DI, BT, Chrono, Clôture)، `Planning Préventif`، `Stock Articles & Sorties`، `Machines Registered`.
   * **القاعدة الذهبية:** تخزن هذه الصفحات حصراً **المفاتيح المرجعية الخارجية (Foreign Keys)** مثل (`machine_id`, `panne_code`, `technicien_id`, `pdr_ref`). **يُمنع قطعياً تخزين نصوص حرة مكررة لأسماء الآلات أو الأعطال أو الفنيين.**
2. **المستوى 2: الصفحات المرجعية (Master Data & Catalogs):**
   * مثل: `Catalogue & Données GMAO` (كتالوج الـ 282 عطلاً، مهام الورشة الـ 114 القياسية، مصفوفات الحلول 71)، `Ingénierie & Référentiel Préventif`، `Familles & Blueprints`.
   * توفر هذه الشاشات الكتالوجات والقوالب الثابتة التي تغذي المستوى التشغيلي وتمنع التكرار البشري.

### 🌳 شجرة النسب والاعتمادية الصارمة (Strict Data Lineage)
* `Zones` (الورشات والمواقع) ──► تغذي وتحدد موقع `Machines Registered`.
* `Machines Registered` ──► تغذي قطع الغيار (`PDR / Stock / Entrepôt`)، وتغذي مهام الصيانة الوقائية (`Preventive`)، وبلاغات الصيانة العلاجية (`Corrective`).
* `Utilisateurs` (جدول المستخدمين) هو **المصدر الوحيد والحصري (Single Source of Truth)** لجميع الفنيين والعمال:
  * تبويب الفنيين في الصيانة العلاجية (`Équipe Intervenants`) هو استعلام ديناميكي:
    `Intervenants = FILTER(Utilisateurs, role === 'Technicien')`
  * إجمالي تدخلات كل فني يحسب بمعادلة إكسيل:
    `TotalInterventions = COUNTIFS(BonsTravail, technicien_id === user.id)`

### 💾 نموذج الحقن المقسم (Dual Partition Injection Model)
عند حفظ البيانات في ذاكرة الجهاز أو قراءتها، تُقسم منطقياً إلى وعائين نظيفين:
1. **وعاء البيانات المرجعية (Master Referential):** الآلات، القوالب، كود الأعطال، المهام القياسية، المستخدمين (حجم ثابت، تعديلات نادرة).
2. **وعاء العمليات والحركات (Operations History):** طلبات الصيانة، بطاقات العمل، حركات المخزون، سجل الإنجاز (ينمو تراكمياً).

---

## 3. محرك الإكسيل التفاعلي المتقدم (ExcelJS & HyperFormula Reactive Engine)

### أ. خدمة بناء وحقن المصنفات (`ExcelEngineService`)
الملف: `src/services/excelEngineService.js`
* **المسؤولية:** توليد وتصدير وحقن ملفات إكسيل احترافية بصيغ رياضية حية 100% ومتوافقة مع Microsoft Excel و Google Sheets و LibreOffice.
* **المعادلات التوأم المبرمجة بالملف:**
  * عمود المدخلات (Entrées):
    `=SUMIFS(Mouvements!C:C, Mouvements!B:B, A{row}, Mouvements!D:D, "Entrée")`
  * عمود المخرجات (Sorties):
    `=SUMIFS(Mouvements!C:C, Mouvements!B:B, A{row}, Mouvements!D:D, "Sortie")`
  * رصيد المخزون الحالي (Stock Actuel):
    `=E{row} + F{row} - G{row}` (رصيد أولي + مدخلات - مخرجات)
  * التنبيه التلقائي (Alerte):
    `=IF(H{row}<=I{row}, "ALERTE", "OK")`
* **صفحة لوحة القيادة التنفيذية (`Synthèse_GMAO`):**
  * تتضمن بطاقات KPI حية تُحسب تلقائياً بواسطة صيغ Excel:
    * إجمالي الأصناف: `=COUNTA(Stock_Actuel!A2:A5000)`
    * أصناف في حالة حرجة: `=COUNTIF(Stock_Actuel!J2:J5000, "ALERTE")`
    * مجموع كميات المخزون: `=SUM(Stock_Actuel!H2:H5000)`
    * مجموع الحركات: `=COUNTA(Mouvements!A2:A20000)`
* **التنسيق الصناعي المتقدم:**
  * خطوط `Segoe UI` و `Consolas` للأرقام والرموز المرجعية.
  * ترويسات داكنة أنيقة (`#1E293B` و `#0F766E`) مع تجميد الصف العلوي (`Frozen Panes`).
  * تلوين شرطي ناعم لخلايا التنبيه (`Red 100 / Red 800`) وخلايا الأمان (`Emerald 100 / Emerald 800`).

### ب. محرك الحساب التفاعلي في الذاكرة (`ReactiveCalculationEngine` عبر `HyperFormula`)
الملف: `src/services/reactiveCalculationEngine.js`
* **المسؤولية:** محاكاة دقيقة لشجرة الاعتماديات الحسابية (DAG - Directed Acyclic Graph) في الذاكرة.
* **المزايا:**
  * إعادة حساب أرصدة قطع الغيار والتنبيهات في أجزاء من الميلي ثانية فور تسجيل أي حركة دخول أو خروج.
  * إمكانية تقييم أي صيغة رياضية معقدة عبر دالة `evaluateFormula(formulaString)`.
  * حساب مؤشرات لوحة القيادة التنفيذية عبر دالة `computeExecutiveKpis(...)`.

### ج. توليد القالب الصناعي الخام (`GMAO_Gabarit_Vierge_Template.xlsx`)
* توفير دالة `downloadGmaoBlankTemplate()` لتوليد مصنف إكسيل نظيف يحتوي على:
  * الترويسات القياسية لكافة الكينونات.
  * الصيغ الحية المسبقة في الصفوف الأولى.
  * صفوف عينات توضيحية خفيفة لتمكين إدارة المصنع من ملء بياناتها يدوياً ثم استيرادها.

---

## 4. طبقة الاستيراد والفك الذكية (Smart Import Parser Layer)

### دالة `parseWorkbookFile(fileOrBuffer)`
الملف: `src/services/excelEngineService.js`
* **وضعية القراءة بالقيمة المحسوبة فقط (Data-Only Evaluation):**
  * فك وقراءة الخلايا التي تحتوي على صيغ واستخراج النتيجة الرقمية النهائية (`cell.result` أو `cell.value.result`) لمنع استيراد نصوص المعادلات كأخطاء نصية.
  * دعم النصوص الغنية (`RichText`) والأنماط المعقدة.
* **الشمولية لكافة كينونات النظام:**
  * استخراج صفحات: `Stock_Actuel`, `Mouvements`, `Machines_Registered`, `Warehouse_Items`, `Demandes_Intervention`, `Bons_Travail`, `Preventive_S1_S52`, `Sortie_Externe`, `Zones`, `Technicians`, `Operations`, `Types`, `Diagnostics`, `Families`, `Templates`.
* **الحماية والنسخ المؤرخة:**
  * تطبيق التحقق الصارم `validateImportedData` قبل حقن أي بيانات.
  * إنشاء نسخة احتياطية آلية مؤرخة بالوقت والتاريخ في `gmao_backups_list` قبل تطبيق الاستيراد لضمان إمكانية التراجع بنسبة 100%.

---

## 5. معمارية الحالة ومخازن الفهرسة اللحظية (State Management & O(1) Stores)

### تدفق الحالة وتجنب الهدر الحسابي
* **`stockIndexStore`:**
  * يوفر فهرسة لحظية $O(1)$ لحركات المخزون بدلاً من البحث التكراري الخطي $O(N \times M)$.
  * يقدم دالة `getTotals(ref)` التي تعيد فوراً `{ entrees, sorties, commandes }`.
* **`useAppCalculations`:**
  * خطاف التجميع المركزي الذي ينتج مصفوفة `stockItems` المعتمدة والمحسوبة.
  * يضمن عدم إعادة تشغيل الحسابات إلا عند تغير `globalVersion` أو إضافة حركة جديدة.

---

## 6. نموذج التخزين والمزامنة مع الملف التوأم (Storage & Excel Twin Sync)

### 3 مستويات من التخزين الصناعي:
1. **المستوى المحلي السريع (L1 - Memory / React State):** سرعة فائقة تفاعلية في الشاشات.
2. **المستوى الثابت المدمج (L2 - IndexedDB & LocalStorage):** حفظ تلقائي مستمر حتى في حال إغلاق المتصفح أو انقطاع التيار الكهربائي.
3. **مستوى التوأم المباشر (L3 - Excel Twin File / File System Access API):**
   * ربط ملف `.xlsx` حقيقي على القرص الصلب أو مجلد الشبكة المشترك (`Twin Dossier Réseau`).
   * عند النقر على "حفظ مباشر"، يقوم النظام بكتابة المصنف بالكامل بالمعادلات الحية في الملف المفتوح على الشبكة دون حاجة لإعادة التنزيل.

---

## 7. هيكل البيانات والمخططات العلائقية (Relational Schemas & Entities)

### المفاتيح والمحددات الأساسية:
* **`ref`:** كود قطعة الغيار أو المادة (مثال: `ROUL-6204-2RS`).
* **`id_machine_registered`:** كود الآلة المسجلة (مثال: `PRI-01`, `FRA-02`).
* **`id_zone`:** كود المنطقة والورشة (مثال: `Presse injection`, `Usinage`).
* **`id_panne` / `code_panne`:** رمز العطل من كتالوج الـ 282 عطلاً القياسي.
* **`technicien_id` / `matricule`:** رقم الفني المرجعي في جدول المستخدمين.

---

## 8. معايير الجودة والأداء ومصفوفة الاختبارات (Quality, Benchmarks & Testing)

* **الأداء القياسي:** حساب 10,000 قطعة غيار و 100,000 حركة مخزون في أقل من 35 ميلي ثانية.
* **معايير الكود:**
  * فحص ESLint صارم بدون أي استثناءات.
  * اختبارات Unit و Integration عبر Vitest تغطي سيناريوهات التزامن والتراجع والعمليات غير المتصلة (Offline).
