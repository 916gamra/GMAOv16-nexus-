# 🏛️ دليل المعمارية الموحد ونظام إدارة الحالة (State Orchestrator & Architectural Standard)

> تم نقل وتوحيد محتويات هذا المستند من تعليمات المعمارية وإدارة الحالة لحفظها كمرجع توثيقي دائم ومفصل للمطورين، ولتقليل حمولة سياق العمل والرموز (Token Optimization).

---

## 1. المعيار المعماري الأساسي: نمط منسق الحالة المركزي (Centralized State Orchestrator Pattern)

لتفادي تشتت الحالة (State Drift) أو تعارض التخزين والتعديلات غير المنسقة عبر وحدات GMAO، تلتزم كافة الشاشات والوحدات بنمط المنسق المركزي:

```
1. Storage & Persistence Tier (IndexedDB Batch + LocalStorage fallback)
                       │
2. Domain Sub-State Hooks (/src/hooks/use[Entity]SubState.js)
                       │
3. Master State Orchestrator (/src/hooks/useGmaoState.js)
         ├─ Unified Auto-Save & Debounce (/src/hooks/useAutoSave.js)
         └─ Multi-Tab Broadcast Sync (/src/hooks/useStateSync.js)
                       │
4. App Root Component (/src/App.jsx)
                       │
5. Router Props Coordinator (/src/presentation/router/useAppRouterProps.js)
                       │
6. Pure Presentation Views (/src/presentation/pages/.../[View].jsx)
```

---

## 2. القواعد الأربع الأساسية (The 4 Fundamental Rules)

### القاعدة 1: شاشات عرض نقية (Pure Presentation Views: Props Down, Events Up)
- لا تستدعي الشاشات إطلاقاً `localStorage.getItem` أو `localStorage.setItem` مباشرة للكيانات المشتركة للنظام.
- لا تقوم الشاشات بإنشاء عمليات `fetch` مستقلة أو دوال تمهيد داخل `useEffect` قد تمسح أو تعيد كتابة تعديلات المستخدم ببيانات افتراضية.
- تُستقبل البيانات كـ `props` للقراءة فقط من `useAppRouterProps.js`.
- كافة التعديلات تُرسل عبر دوال رد اتصال واضحة وصريحة (مثل: `onAddX`, `onUpdateX`, `onDeleteX`).

### القاعدة 2: الفصل بين البيانات التجريبية وبيانات المصنع الحقيقية (Baseline Seeds vs. Real Factory Data)
- لا يتم تحميل البيانات الأولية أو ملفات JSON إلا إذا كان التخزين غير مهيأ بالكامل لأول مرة (`gmao_initialized_flag`).
- في حال حذف المستخدم سجلات أو اختياره جداول فارغة في بيئة تشغيل مصنعية حقيقية، يمنع إعادة حقن البيانات التجريبية تلقائياً.

### القاعدة 3: الحفظ التلقائي في معاملة موحدة (Unified Single-Transaction Auto-Save)
- الحفظ الدائم مركزي وموحد في `useAutoSave.js`.
- عمليات الحفظ المجمعة تنفذ نحو IndexedDB مع تأخير مناسب (Debounced persistence) لعدم تجميد واجهة المستخدم أو معدل الإطارات (60fps).

### القاعدة 4: المزامنة عبر التبويبات المتعددة (Multi-Tab Broadcast Sync)
- تدار مركزياً عبر `useStateSync.js` باستخدام `StorageEvent` و `BroadcastChannel` لتنعكس التعديلات بين جميع التبويبات المفتوحة فورياً دون الحاجة لإعادة تحميل الصفحة.

---

## 3. التطورات المعمارية الثلاثة (The 3 Architectural Evolutions)

1. **سياقات النطاق (Domain Contexts - بديل الـ Prop-Drilling العميق):**
   - توفير سياقات مخصصة (`StockContext`, `PreventiveContext`, `MachineContext`, `SortieExterneContext`, `WarehouseContext`) في `/src/context/GmaoDomainContext.jsx`.
   - تغليف شاشات `AppRouter` لتمكين المكونات الفرعية من استهلاك الحالة مباشرة وبشكل نظيف.
2. **عامل الويب للعمليات الحسابية الثقيلة (Web Worker for Intensive Computing):**
   - تفريغ عمليات التصفية على آلاف السجلات، والبحث المصفوفي، ومؤشرات KPI، وتصدير إكسيل إلى `/src/workers/stockWorker.js` و `/src/hooks/useStockWorker.js` لضمان سلاسة العرض.
3. **مدير التراجع والإعادة العام (Global Undo / Redo Manager):**
   - إدارة سجل العمليات المركزية `Ctrl+Z` / `Ctrl+Y` في `/src/utils/undoRedoManager.js` و `/src/hooks/useUndoRedo.js` لحماية عمليات المخزون وحركات الصيانة.

---

## 4. خارطة توحيد الشاشات والوحدات (Standardization Roadmap)

1. **الخروج الخارجي واللف الورشوي (`SortieRapideView` / `SortieExterneBobinageTab`):**
   - عزل الحالة في `useSortieExterneSubState.js`.
   - ربط ورش إصلاح المحركات، وحالات الموردين الخارجيين، وقطع الغيار في `useGmaoState.js`.
   - حفظ متزامن في `useAutoSave.js` ومزامنة عبر التبويبات في `useStateSync.js`.
2. **المستودع وقطع الغيار الاحتياطية (`EntrepotView`):**
   - توحيد مواقع المستودع، القطع، والمكونات في `useWarehouseSubState.js`.
3. **مساعد الذكاء الاصطناعي نكسس (`NexusView`):**
   - تمرير حالة المصنع اللحظية مباشرة من منسق الحالة المركزي بدلاً من القراءة العشوائية من التخزين المحلي.
4. **الصيانة الوقائية والمرجعية (`PreventiveView` & `PreventiveSecondaryView`):**
   - توحيد +1175 مهمة، خطة، دليل، وإجراء وقائي في `usePreventiveSubState.js`.
   - ربط استهلاك المخزون (`onAddMouvement` & `onDirectAdjustStock`) بمرسلات المنسق الرئيسي.
5. **المناطق والورش (`ZonesView`):**
   - إدارة الورش ومواقع الخطوط والآلات عبر `useMachineSubState` والتوابع المركزية.
6. **المستخدمون والفنيون (`UtilisateursView`):**
   - إدارة الفنيين والعمليات وصلاحيات الأدوار عبر `useUserSubState`.
7. **النسخ الاحتياطي والاستعادة (`SettingsView` / `AutoBackupService`):**
   - لقطات نسخ احتياطي شاملة تغطي كافة جداول النظام في `CRITICAL_KEYS` مع بث فوري للمزامنة.

---

## 5. معيار واجهة المستخدم: الجداول المجمعة بالأكورديون (Collapsible Parent-Grouped Table Standard)

لتحقيق أقصى كفاءة بي ارغونومية في الجداول والتقاويم المعقدة (جداول الصيانة الوقائية، مصفوفة 52 أسبوعاً، مواقع المستودع):

1. **تجميع الكيانات الرئيسية (Parent-Entity Grouping):**
   - سطر واحد مضغوط لكل كيان رئيسي افتراضياً (مثل: آلة، معدة، منطقة، عائلة).
   - ملخص مباشر وفوري في السطر: المعرف، الاسم، إجمالي العناصر الفرعية، شارات الحالة، والإجراءات المجدولة.
2. **التوسيع التفاعلي داخل الجدول (Accordion Expansion):**
   - النقر على السطر أو السهم يفتح العناصر الفرعية مباشرة أسفله برابط شجري مرئي (`└─`).
   - عرض البيانات الدقيقة: المكون، رمز الإجراء، الدورية، المسؤول، الحالة، وأزرار التنفيذ.
3. **الترقيم المعتمد على الكيان الرئيسي (Entity-Centric Pagination):**
   - حجم الصفحة (`pageSize`) يحسب عدد الكيانات الرئيسية (مثلاً: 20 آلة في الصفحة)، مما يضمن عدم تفتيت مهام الآلة الواحدة بين صفحات متعددة.
4. **عناصر التحكم الجماعية (Tout déplier / Tout replier):**
   - زر علوي مخصص لفتح أو طي كافة المجموعات الحالية بنقرة واحدة.
5. **مظهر إكسيل الأنيق (Excel Light Aesthetic):**
   - خطوط شبكة واضحة `border-slate-200`، تظليل تبادلي للأسطر، وأرقام متسلسلة ثابتة مع تباين عالي للطباعة والقراءة.
