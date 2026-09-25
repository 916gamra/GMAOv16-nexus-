# 📚 فهرس التوثيق الفني والمعماري الشامل — CIOB GMAO Light UI Excel

مرحباً بك في مركز التوثيق الشامل والمكتمل لنظام **CIOB GMAO Light UI Excel**.
تم إعداد هذا التوثيق ليكون مرجعاً هندسياً، وظيفياً، وتنظيمياً دقيقاً وشاملاً لكافة مستخدمي النظام ومهندسيه ووكلائه الذكيين (**AI Agents**)، ليعكس فلسفة التطبيق، منطقه الحسابي، ومطابقته التامة لنموذج **Excel Twin** ومبدأ الـ **100% Offline Client-Side Execution** بدون أي تضليل أو مبالغة.

---

## 🌟 المستندات الرئيسية الجامعة (Core Master Documents)

| المستند الأساسي | مسار الملف | الفئة المستهدفة والمحتوى |
| :--- | :--- | :--- |
| 📖 **دليل المستخدم الشامل** | [`docs/USER_GUIDE.md`](./docs/USER_GUIDE.md) | **للمستخدمين النهائيين والمديرين**: دليل تشغيلي مصور، خطوات التثبيت كـ PWA، تسجيل الدخول والأدوار، شرح كل شاشة، التدفقات الخمسة، والأسئلة الشائعة. |
| 🤖 **دليل وكلاء ومطوري الذكاء الاصطناعي** | [`docs/AI_AGENT_GUIDELINES.md`](./docs/AI_AGENT_GUIDELINES.md) | **للذكاء الاصطناعي والمطورين**: المواصفة الهندسية الصارمة، إدارة الحالة، محرك الحسابات الرياضية، قواعد الأمان، ومصفوفة الاختبارات والمحظورات. |
| 🏭 **المواصفة التشغيلية لكل الشاشات** | [`docs/MODULES_SPECIFICATION.md`](./docs/MODULES_SPECIFICATION.md) | **توثيق وظيفي تفصيلي**: فلسفة كل شاشة، مكوناتها، الجداول المتطابقة مع إكسيل، وتفاصيل الأعمدة والمعادلات. |
| 📐 **معادلات إكسيل المرجعية** | [`EXCEL_FORMULAS.md`](./EXCEL_FORMULAS.md) | **المرجع الحسابي**: كافة معادلات `SUMIFS`, `COUNTIF`, ومطابقتها البرمجية في محرك الجافاسكريبت. |
| 🏛️ **دستور القواعد والمعايير المعمارية** | [`docs/SYSTEM_RULES.md`](./docs/SYSTEM_RULES.md) | **دستور النظام المعماري**: المبادئ الـ 9، معايير Excel Twin، أزرار 3D، مسار التنقل الذكي، وتوحيد الجداول. |
| 🧪 **استراتيجية الاختبار الشاملة** | [`src/tests/testing-strategy.md`](./src/tests/testing-strategy.md) | **استراتيجية وضمان الجودة**: اختبارات الوحدة (Unit)، التكامل (Integration)، التدفقات (E2E)، الأداء، والأمان. |
| 🔄 **إدارة الحالة والمعمارية الموحدة** | [`docs/STATE_MANAGEMENT_AND_ARCHITECTURE.md`](./docs/STATE_MANAGEMENT_AND_ARCHITECTURE.md) | **إدارة الحالة ومنسق النظام**: معمارية Orchestrator، القواعد الـ 4، عدم فقدان البيانات، ومعيار الجداول المجمعة (Accordion). |
| ⚙️ **هرم المكونات وثلاثية ID/CODE/REF** | [`docs/COMPOSANTS_HIERARCHIE_ET_IDENTIFIANTS.md`](./docs/COMPOSANTS_HIERARCHIE_ET_IDENTIFIANTS.md) | **هندسة المكونات والتسميات**: فلسفة 4 مستويات (Groupe -> Famille -> Template -> Entrepôt)، وفلسفة التمييز بين ID و CODE و REF. |

---

## 📑 هيكل ملفات التوثيق الفردية لكل شاشة (Individual View Documents)

| الشاشة / الوحدة | مسار ملف التوثيق | الوصف ومحتوى التوثيق |
| :--- | :--- | :--- |
| **Dashboard & Pilotage** | [`docs/DASHBOARD_VIEW.md`](./docs/DASHBOARD_VIEW.md) | قمرة القيادة الشاملة، تتبع طلبات الشراء، تحليلات التدخلات، والمؤشرات الحية. |
| **Sortie & Entrée Rapide** | [`docs/SORTIE_RAPIDE_VIEW.md`](./docs/SORTIE_RAPIDE_VIEW.md) | دليل كامل لإدارة حركات المخزون، التدفقات الـ 5، الفرق بين المنفذ والطالب، وتأهيل الحركات. |
| **Preventive Maintenance** | [`docs/PREVENTIVE_VIEW.md`](./docs/PREVENTIVE_VIEW.md) | مصفوفة الأسابيع السنوية S1..S52 (1175 مهمة)، منشئ الخطط، دليل التعليمات، ورموز الإجراءات القياسية. |
| **Mouvements & Sorties** | [`docs/MOUVEMENTS_VIEW.md`](./docs/MOUVEMENTS_VIEW.md) | دفتر أستاذ حركات المخزن (665 حركة)، تتبع أذونات الصرف، الإدخال، وأوامر الشغل. |
| **Sortie Externe & Bobinage** | [`docs/SORTIE_EXTERNE_VIEW.md`](./docs/SORTIE_EXTERNE_VIEW.md) | تتبع الصرف الخارجي ولف المحركات، المقاولين الخارجيين، والتكاليف. |
| **Components Hierarchy** | [`docs/COMPONENTS_VIEW.md`](./docs/COMPONENTS_VIEW.md) | شجرة المكونات وتصنيفات الأجزاء (Groups -> Families -> Templates -> Part Types -> Designations). |
| **Entrepôt (Components & Parts)** | [`docs/ENTREPOT_VIEW.md`](./docs/ENTREPOT_VIEW.md) | دليل مستودع المكونات والقطع، التبويبات المنفصلة (ComponentsTable / PartsTable)، وتطابق أعمدة إكسيل A-H. |
| **Stock Actuel (Articles)** | [`docs/STOCK_VIEW.md`](./docs/STOCK_VIEW.md) | إدارة المقالات، حسابات `SUMIFS`، الحدود الدنيا، التنبيهات والأرصدة. |
| **Machines Registered** | [`docs/MACHINES_VIEW.md`](./docs/MACHINES_VIEW.md) | بطاقة الآلات الصناعية، التوزيع الجغرافي، ونماذج العائلات والقوالب والمخططات الـ 47. |
| **Zones & Emplacements** | [`docs/ZONES_VIEW.md`](./docs/ZONES_VIEW.md) | شجرة المناطق والورش الصناعية الـ 14 ومواقع التخزين في المستودعات. |
| **Utilisateurs & Profils** | [`docs/USERS_VIEW.md`](./docs/USERS_VIEW.md) | الفنيين، المشغلين، رؤساء الفرق، وتوزيع الأدوار وقوالب المسؤولية (RMG, RMT, RZN). |
| **Paramètres & Excel Twin** | [`docs/SETTINGS_BACKUP.md`](./docs/SETTINGS_BACKUP.md) | الاستيراد والتصدير، النسخ الاحتياطي المضغوط، ونظام التدقيق. |
| **الدليل المعماري وقابلية التوسع** | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | هيكل المشروع الكامل، إرشادات إضافة شاشات ونوافذ ومميزات جديدة. |

---

## 🎯 المبادئ التوجيهية للتوثيق لكل صفحة

يحتوي توثيق كل صفحة على الأقسام المعيارية التالية:
1. **الفلسفة والهدف الوظيفي (Functional Philosophy):** ما هي الغاية الصناعية من هذه الشاشة.
2. **التطابق مع نموذج إكسيل (Excel Twin & Data Schema):** أسماء الأعمدة من `A` إلى `Z` ومعادلات الربط.
3. **تفصيل الأعمدة والأدوار (Columns Breakdown & Roles):** شرح دقيق لكل حقل والفرق بين الحقول المتشابهة (مثل `Intervenant` مقابل `Demandeur`).
4. **التدفقات والحالات الخاصة (Workflows & Business Logic):** مسارات الصرف والدخول العادية والخاصة.
5. **المعمارية البرمجية والمكونات (Technical Architecture):** الخطافات `useMemo`, `useState` والمكونات الفرعية وتكامل الأداء.

---
*تم إنشاء هذا التوثيق لضمان أقصى درجات الوضوح والاحترافية لفريق التطوير وإدارة الصيانة.*
