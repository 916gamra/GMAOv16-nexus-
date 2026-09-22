# 📱 دليل استخدام النسخة المحمولة GMAO Nexus Mobile

مرحباً بك في الدليل العربي المحدث لاستخدام وتطوير النسخة المحمولة من تطبيق GMAO Nexus.

---

## 🛠️ المكونات والخدمات المتاحة

### 1. شاشات وهيكل الصفحة
- `MobileLayout`: الهيكل العام للصفحة مع خيارات التحديث بالسحب وHeader وBottomNav.
- `MobileHeader`: شريط العنوان العلوي المحسن للمس وأزرار العودة والإشعارات.
- `BottomNavigation`: شريط التنقل السفلي الثابت مع إشارات التفعيل والعدادات.

### 2. عناصر التفاعل واللمس
- `TouchButton`: أزرار مخصصة لللمس بحجم أدنى 44px مع تأثيرات الاستجابة الفورية.
- `MobileCard`: بطاقات لعرض البيانات والتفاصيل المتجاوبة.
- `SwipeableDrawer`: لوحة سفلية قابلة للإغلاق بالسحب.
- `PullToRefresh`: آلية تحديث البيانات بالسحب من الأعلى.

### 3. عناصر النماذج والإدخال
- `MobileInput`: حقول إدخال نصية ورقمية مخصصة لللمس مع أزرار المسح ورسائل الأخطاء.
- `MobileSelect`: قوائم اختيار مخصصة ومتجاوبة مع الهواتف الذكية.

### 4. الـ Hooks المخصصة
- `useMobileDetect`: للكشف عن نوع الجهاز واللمس واتجاه الشاشة (Portrait/Landscape).
- `useTouch`: لإدارة حالات الضغط واللمس المباشر.
- `useSwipe`: للكشف عن إيماءات السحب (يمين، يسار، أعلى، أسفل).
- `useMobileKeyboard`: للتعامل مع ظهور وإخفاء لوحة المفاتيح الافتراضية.

---

## 🚀 طريقة الاستيراد والتطبيق

```javascript
import { MobileLayout } from './src/mobile/components/layout/MobileLayout.jsx';
import { TouchButton } from './src/mobile/components/common/TouchButton.jsx';
import { useMobileDetect } from './src/mobile/hooks/useMobileDetect.js';

function MyMobileView() {
  const { isMobile } = useMobileDetect();

  return (
    <MobileLayout title="إدارة المعدات">
      <TouchButton onClick={() => alert('تم الضغط')}>
        تنفيذ صيانة
      </TouchButton>
    </MobileLayout>
  );
}
```
