import React, { useState } from 'react';
import { Smartphone, X, RotateCcw, Maximize2, Minimize2, CheckCircle, RefreshCw, Cpu, Package, Wrench, Settings, Home, AlertTriangle, Layers } from 'lucide-react';
import MobileLayout from '../../../mobile/components/layout/MobileLayout.jsx';
import TouchButton from '../../../mobile/components/common/TouchButton.jsx';
import MobileCard from '../../../mobile/components/common/MobileCard.jsx';
import MobileInput from '../../../mobile/components/forms/MobileInput.jsx';
import MobileSelect from '../../../mobile/components/forms/MobileSelect.jsx';
import SwipeableDrawer from '../../../mobile/components/common/SwipeableDrawer.jsx';

export default function MobileSimulatorModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((res) => setTimeout(res, 800));
    setIsRefreshing(false);
    showNotice('تم تحديث البيانات المباشرة بالسحب!');
  };

  const showNotice = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Outer Controls Header */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-white z-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30 backdrop-blur-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">محاكي وضع الهواتف المحمولة GMAO Mobile</h2>
            <p className="text-xs text-slate-400">اختبار تفاعلي لمكونات وقوائم وتدفقات وضع الموبايل</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700/50"
            title={isFullScreen ? 'تصغير الحجم' : 'تكبير ملء الشاشة'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-red-600/80 hover:bg-red-700 text-white rounded-xl transition-all shadow-md"
            title="إغلاق المحاكي"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Device Frame */}
      <div
        className={`
          relative bg-slate-900 rounded-[44px] border-[10px] border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 flex flex-col mt-12
          ${isFullScreen ? 'w-full h-[calc(100vh-80px)] max-w-2xl' : 'w-[395px] h-[780px] max-h-[calc(100vh-90px)]'}
        `}
      >
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-50 flex items-center justify-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-slate-800 rounded-full"></div>
          <div className="w-2 h-2 bg-blue-950/80 rounded-full border border-blue-800/50"></div>
        </div>

        {/* Device Content Screen */}
        <div className="relative flex-1 bg-slate-50 overflow-hidden flex flex-col font-sans select-none">
          <MobileLayout
            title={
              activeTab === 'dashboard' ? 'الرئيسية - GMAO Nexus' :
              activeTab === 'stock' ? 'إدارة قطع الغيار' :
              activeTab === 'machines' ? 'سجل آلات المصنع' :
              activeTab === 'preventive' ? 'خطة الصيانة الوقائية' : 'إعدادات النظام المحمول'
            }
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            onRefresh={handleRefresh}
            rightHeaderAction={
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>خيارات</span>
              </button>
            }
          >
            {/* Toast Notification Banner inside Mobile */}
            {toastMsg && (
              <div className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl mb-3 shadow-md flex items-center gap-2 animate-in slide-in-from-top duration-200">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{toastMsg}</span>
              </div>
            )}

            {/* TAB CONTENT 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-3">
                <MobileCard
                  title="نظام GMAO Nexus Mobile"
                  subtitle="مظهر محسن وسلس للعمل الميداني"
                  icon={Home}
                  badge="نشط 100%"
                >
                  <p className="text-xs text-slate-600 mb-3">
                    مرحباً بك في وضع الهواتف المحمولة المخصص للفنيين ومسؤولي المستودع. يدعم السحب للتحديث واستجابة اللمس الفورية.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <TouchButton
                      size="sm"
                      variant="primary"
                      fullWidth
                      onClick={() => showNotice('تم تنفيذ الإجراء الميداني بنجاح!')}
                    >
                      إجراء سريع
                    </TouchButton>
                    <TouchButton
                      size="sm"
                      variant="outline"
                      fullWidth
                      onClick={() => setDrawerOpen(true)}
                    >
                      فتح القائمة
                    </TouchButton>
                  </div>
                </MobileCard>

                <div className="grid grid-cols-2 gap-2">
                  <MobileCard className="!p-3 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">قطع الغيار</span>
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">1,420</p>
                    <span className="text-[10px] text-emerald-600 font-bold">12 إشعار حرج</span>
                  </MobileCard>

                  <MobileCard className="!p-3 border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">الآلات والخطوط</span>
                      <Cpu className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">84</p>
                    <span className="text-[10px] text-slate-500">جاهزية 98.4%</span>
                  </MobileCard>
                </div>

                <MobileCard title="مهام الصيانة اليومية" subtitle="جدول الفنيين اليوم" icon={Wrench}>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">فحص مضخة الهيدروليك P-01</span>
                        <span className="text-[11px] text-slate-500">المنطقة: خط الإنتاج أ</span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">قيد الانتظار</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">تشحيم المحركات والتروس</span>
                        <span className="text-[11px] text-slate-500">المنطقة: الورشة المركزية</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">مكتمل</span>
                    </div>
                  </div>
                </MobileCard>
              </div>
            )}

            {/* TAB CONTENT 2: STOCK */}
            {activeTab === 'stock' && (
              <div className="space-y-3">
                <MobileInput
                  label="البحث الميداني عن قطعة غيار"
                  placeholder="أدخل الاسم، الكود، أو المرجع..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  icon={Package}
                />

                <MobileSelect
                  label="تصفية حالة المخزون"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'جميع القطع المخزنة' },
                    { value: 'ALERT', label: 'القطع التي بلغت حد الإنذار' },
                    { value: 'ZERO', label: 'القطع النفاد (صفر)' },
                  ]}
                />

                <div className="space-y-2">
                  <MobileCard title="رولمان بلي 6205-2RS" subtitle="Réf: SKF-6205 • المخزن الرئيسي" badge="متوفر 45">
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-slate-500">السعر: 14.50 د.ت</span>
                      <TouchButton size="sm" variant="outline" onClick={() => showNotice('تم طلب إخراج قطعة غيار')}>
                        طلب إخراج
                      </TouchButton>
                    </div>
                  </MobileCard>

                  <MobileCard title="حزام ناقل B-1200" subtitle="Réf: CONV-B1200 • خط التجميع" badge="حرج 2">
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-amber-600 font-bold">تنبيه المخزون الأدنى!</span>
                      <TouchButton size="sm" variant="danger" onClick={() => showNotice('تم تسجيل طلب شراء عاجل')}>
                        طلب شراء
                      </TouchButton>
                    </div>
                  </MobileCard>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: MACHINES */}
            {activeTab === 'machines' && (
              <div className="space-y-3">
                <MobileCard title="آلة التعبئة التلقائية V-50" subtitle="Code: MCH-FILL-50 • زون الإنتاج" icon={Cpu} badge="تشغيل">
                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <p>• العائلة: آلات التعبئة والتلحيم</p>
                    <p>• آخر صيانة وقائية: منذ 3 أيام</p>
                  </div>
                  <TouchButton fullWidth variant="primary" size="sm" onClick={() => showNotice('تم فتح سجل صيانة الآلة')}>
                    عرض السجل الكامل
                  </TouchButton>
                </MobileCard>

                <MobileCard title="مكبس هيدروليكي 50 تن" subtitle="Code: MCH-PRESS-50 • زون الهيدروليك" icon={Cpu} badge="صيانة">
                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <p>• العائلة: المكابس والتشكيل</p>
                    <p>• الحالة: خاضع لفحص الصيانة الوقائية</p>
                  </div>
                  <TouchButton fullWidth variant="secondary" size="sm" onClick={() => showNotice('تم تسجيل ملاحظة فنية')}>
                    إضافة ملاحظة فنية
                  </TouchButton>
                </MobileCard>
              </div>
            )}

            {/* TAB CONTENT 4: PREVENTIVE */}
            {activeTab === 'preventive' && (
              <div className="space-y-3">
                <MobileCard title="خطة الصيانة الوقائية الشهرية" subtitle="سبتمبر 2026" icon={Wrench}>
                  <p className="text-xs text-slate-600 mb-3">
                    تتضمن الخطة 24 عملية فحص دوري مجدولة للفنيين بالورشة وخطوط الإنتاج.
                  </p>
                  <TouchButton fullWidth variant="primary" size="sm" onClick={() => showNotice('تم تأكيد إنجاز الخطة اليومية')}>
                    تأكيد إنجاز مهمة
                  </TouchButton>
                </MobileCard>
              </div>
            )}

            {/* TAB CONTENT 5: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-3">
                <MobileCard title="إعدادات التطبيق المحمول" subtitle="النسخة PWA v16.0" icon={Settings}>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                      <span>العمل دون اتصال (Offline)</span>
                      <span className="font-bold text-emerald-600">مفعل 100%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                      <span>مزامنة التغييرات</span>
                      <span className="font-bold text-blue-600">تلقائية</span>
                    </div>
                    <TouchButton fullWidth variant="danger" size="sm" onClick={onClose}>
                      الخروج من وضع المحاكاة
                    </TouchButton>
                  </div>
                </MobileCard>
              </div>
            )}
          </MobileLayout>

          {/* Swipeable Drawer Demo */}
          <SwipeableDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="خيارات وإجراءات السحب الميداني"
          >
            <div className="space-y-2">
              <TouchButton fullWidth variant="primary" onClick={() => { setDrawerOpen(false); showNotice('تم إجراء فحص سريع!'); }}>
                فحص سريع بالأصابع
              </TouchButton>
              <TouchButton fullWidth variant="outline" onClick={() => { setDrawerOpen(false); showNotice('تم تحديث البيانات'); }}>
                إعادة تنشيط المزامنة
              </TouchButton>
              <TouchButton fullWidth variant="ghost" onClick={() => setDrawerOpen(false)}>
                إغلاق القائمة
              </TouchButton>
            </div>
          </SwipeableDrawer>
        </div>

        {/* Home Bar Indicator */}
        <div className="h-5 bg-slate-950 flex items-center justify-center">
          <div className="w-28 h-1 bg-slate-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
