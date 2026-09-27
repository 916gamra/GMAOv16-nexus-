# 🏛️ GMAO Industrial Architecture & Relational Engine Constitution

For comprehensive system documentation and guides:
- [`docs/STATE_MANAGEMENT_AND_ARCHITECTURE.md`](./docs/STATE_MANAGEMENT_AND_ARCHITECTURE.md) — Single Source of Truth for State Management.
- [`docs/AI_AGENT_GUIDELINES.md`](./docs/AI_AGENT_GUIDELINES.md) — Core Engineering Spec for Developers & AI Agents.
- [`DOCS_INDEX.md`](./DOCS_INDEX.md) — Full Documentation Directory.

---

## ⚙️ 1. فلسفة "الآلة الميكانيكية وشاشة الـ LCD" (Deterministic Relational Engine)
- التطبيق يُعامل كأنه **مصنف إكسيل موحد في الذاكرة (Unified In-Memory Excel Workbook)** ذو منطق علائقي حتمي وصارم.
- شاشات وواجهات المستخدم (**UI Views**) هي مجرد **شاشات عرض رقمية (LCD Readouts)**:
  - **يُمنع قطعياً** أن تخترع أي شاشة أو صفحة مصفوفات بيانات محلية مستقلة أو مكررة (Strictly NO Data Silos).
  - الحسابات والإحصائيات والعدادات تتم عبر معادلات إكسيل الصريحة (`SUMIFS`, `COUNTIFS`, `FILTER`, `VLOOKUP`).

---

## 🧱 2. بنية المستويين لكل قسم (2-Tier Architecture per Module)
لكل مجموعة رئيسية في النظام مستويان هندسيان واضحان:
1. **المستوى 1: الصفحات التشغيلية (المركز الأول - Transactional / Operations):**
   - مثل: `Correctif Hub` (DI, BT, Chrono, Clôture), `Planning Préventif`, `Stock Articles & Sorties`, `Machines Registered`.
   - **قاعدة ذهبية:** تخزن هذه الصفحات حصراً **المفاتيح المرجعية الخارجية (Foreign Keys)** مثل (`machine_id`, `panne_code`, `technicien_id`, `pdr_ref`). **يُمنع قطعياً تخزين نصوص حرة مكررة لأسماء الآلات أو الأعطال أو الفنيين.**
2. **المستوى 2: الصفحات المرجعية (المركز الثاني / الكواليس - Master Data & Catalogs):**
   - مثل: `Catalogue & Données GMAO` (كتالوج الـ 282 عطلاً، مهام الورشة الـ 114 القياسية، مصفوفات الحلول 71), `Ingénierie & Référentiel Préventif`, `Familles & Blueprints`.
   - توفر هذه الشاشات الكتالوجات والقوالب الثابتة التي تغذي المستوى التشغيلي وتمنع التكرار البشري.

---

## 🌳 3. شجرة النسب والاعتمادية الصارمة (Strict Data Lineage)
- `Zones` (الورشات والمواقع) ──► تغذي وتحدد موقع `Machines Registered`.
- `Machines Registered` ──► تغذي قطع الغيار (`PDR / Stock / Entrepôt`)، وتغذي مهام الصيانة الوقائية (`Preventive`)، وبلاغات الصيانة العلاجية (`Corrective`).
- `Utilisateurs` (جدول المستخدمين) هو **المصدر الوحيد والحصري (Single Source of Truth)** لجميع الفنيين والعمال:
  - تبويب الفنيين في الصيانة العلاجية (`Équipe Intervenants`) هو مجرد استعلام ديناميكي:
    `Intervenants = FILTER(Utilisateurs, role === 'Technicien')`
  - إجمالي تدخلات كل فني يحسب بمعادلة إكسيل:
    `TotalInterventions = COUNTIFS(BonsTravail, technicien_id === user.id)`

---

## 💾 4. نموذج التخزين والحقن المباشر في ذاكرة الجهاز (Dual Partition Injection Model)
عند حفظ البيانات في ذاكرة الجهاز أو قراءتها، تُقسم منطقياً إلى وعائين نظيفين:
1. **وعاء البيانات المرجعية (Master Referential):** الآلات، القوالب، كود الأعطال، المهام القياسية، المستخدمين (حجم ثابت، تعديلات نادرة).
2. **وعاء العمليات والحركات (Operations History):** طلبات الصيانة، بطاقات العمل، حركات المخزون، سجل الإنجاز (ينمو تراكمياً).
