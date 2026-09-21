# 🏭 توثيق شاشة مستودع المكونات والقطع (Entrepôt : Components & Parts)
## نظام CIOB GMAO Light UI Excel

يوثق هذا المستند المعمارية التقنية والتصميمية لشاشة **Entrepôt (المستودع الصناعي)**، التي تجمع وتفصل بذكاء بين **المكونات الآلية (Components Machines)** و**قطع الغيار والمستهلكات (Parts de Rechange)**، مع الحفاظ على التطابق مع نموذج إكسيل التوأم (**Excel Twin**).

---

## 🏛️ 1. الفلسفة المعمارية والفصل التام بين Components و Parts

في بيئات الصيانة الصناعية المعقدة:
1. **المكونات (Components):** هي وحدات فرعية متكاملة (Sub-assemblies) مثل المحركات الكهربائية، مضخات الضغط، مغيرات السرعة، وعلب التروس. تتبع معمارية هرمية من 4 مستويات (`Groupe -> Famille -> Template -> Stock Entrepôt`)، وتمتلك خصائص تقنية دقيقة (القدرة، الجهد، الشدة، السرعة) وترتبط بالماكينات.
2. **قطع الغيار (Parts):** هي قطع تبديل ومستهلكات (Roulements, Courroies, Filtres, Vannes) ذات طبيعة تخزينية مباشرة تخضع لمعدلات دوران وجرد دوري.

### 🎯 قرار الفصل المعماري للجدولين (ComponentsTable & PartsTable):
لتجنب خلط الأعمدة والقواعد البرمجية، ولمنح النظام مرونة مستقبلية كاملة لإضافة أعمدة وخصائص مخصصة لكل نوع بشكل مستقل، تم عزل الواجهة إلى جدولين منفصلين:
- `/src/presentation/pages/warehouse/components/ComponentsTable.jsx` (خاص حصراً بالمكونات).
- `/src/presentation/pages/warehouse/components/PartsTable.jsx` (خاص حصراً بقطع الغيار).

---

## 🎨 2. تصميم بطاقة الهيدر وتبويبات التنقل والحركات التفاعلية (Header, Tabs & Animations)

تم تنظيم الجزء العلوي من شاشة المستودع وفق أعلى معايير التصميم والتنظيم والحركات التفاعلية الراقية:

### أ. شريط التبويبات المتماثل (Segmented Dual-Tabs Pattern):
- **الهيكل الشبكي المتساوي:** استخدام شبكة ثنائية متكافئة الأبعاد (`inline-grid grid-cols-2`) مع تحديد عرض متوازن (`w-full sm:w-[340px]`) لمنع أي تمدد غير مرغوب فيه وضمان استجابة تامة على الشاشات الصغيرة والكبيرة.
- **الحاوية والتنسيق:** تصميم كبسولي (`p-1 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs`).
- **التبويب النشط:** بروز خفيف مع خلفية بيضاء وظل ناعم (`bg-white text-blue-950 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/60`).

### ب. الزر الأيقوني الدائري وتأثير السويتش التفاعلي (3D Action Switch Animation):
- **الأيقونات القياسية الموحدة:**
  - **تبويب Components:** يعرض **أيقونة المكعب (`CubeIcon`)** باللون الأزرق ليعبر عن المكونات الميكانيكية والكهربائية المتكاملة.
  - **تبويب Parts:** يعرض **أيقونة الطبقات (`LayersIcon`)** باللون النيلي (Indigo) ليعبر عن قطع الغيار والمستهلكات.
- **تأثير الدوران والتلاشي السلس (`Action Switch Transition`):**
  - يتم استخدام `AnimatePresence (mode="wait")` مع `motion.div`.
  - معايير الحركة: `initial={{ scale: 0.82, rotate: -12, opacity: 0 }}`, `animate={{ scale: 1, rotate: 0, opacity: 1 }}`, `exit={{ scale: 0.82, rotate: 12, opacity: 0 }}` بزمن `0.18s` ومنحنى `easeOut`.

### ج. الانتقال التدريجي بين الجداول (Table Smooth Transition):
- عند الانتقال بين جدول المكونات وجدول القطع، يتم تطبيق تأثير ظهور وانسياب عمودي ناعم:
  - `initial={{ opacity: 0, y: 6 }}`
  - `animate={{ opacity: 1, y: 0 }}`
  - `exit={{ opacity: 0, y: -6 }}`
  - بزمن `0.22s` يمنح تجربة استخدام سريعة ومريحة للعين بدون وميض أو قفز مفاجئ في الصفحة.

---

## 📊 3. التطابق مع أعمدة إكسيل التوأم (Excel Columns Mapping A → H)

| العمود في إكسيل | الحقل البرمجي | النوع | الوصف في النظام |
| :---: | :--- | :---: | :--- |
| **(Col. A)** | `id_warehouse_item` | `String` | المعرف النظامي الثابت والفريد (System ID) |
| **(Col. B)** | `nature` | `String` | طبيعة الصنف (`COMPONENT` أو `PART`) |
| **(Col. C)** | `code_item` | `String` | الكود الداخلي للمصنع (Plant Code) |
| **(Col. D)** | `designation` / `id_famille` | `String` | التسمية، العائلة، أو نوع المقال |
| **(Col. E)** | `emplacement` | `String` | الموقع الفيزيائي في المستودع (الرف / الخزانة) |
| **(Col. F)** | `quantite` | `Number` | الرصيد الحالي المتوفر في المستودع |
| **(Col. G)** | `statut` | `String` | الحالة التشغيلية (`En stock`, `En service`, `En révision`, `Hors service`) |
| **(Col. H)** | `rattachement` / `id_machine` | `String` | ارتباط المكون بالماكينة أو الخط الإنتاجي |

---

## ⚙️ 4. مفاتيح التخزين والحالة المحلية (State & Persistence)

- **حالة التبويب النشط:** `activeWarehouseTab` تدار عبر `useState` بقيمتي `'COMPONENTS'` و `'PARTS'`.
- **مزامنة الفلاتر:** ترتبط بالدوال `changeNatureFilter` لضمان مزامنة الكروت الإحصائية الـ 4 العلوية مع الجداول.
- **التخزين الدائم:** يتم حفظ بيانات المستودع عبر `useWarehouseSubState` بمفتاح LocalStorage الأساسي `gmao_entrepot_components_v1`.

---

*تم التوثيق رسمياً ضمن معايير بنية وتطوير تطبيق CIOB GMAO Light UI Excel.*
