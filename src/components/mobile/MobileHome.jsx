import { useState } from 'react';
import { AlertCircle, Package, Wrench, BarChart3, Search, Cpu } from 'lucide-react';
import { useGmaoState } from '../../hooks/useGmaoState';
import MobileStockView from './MobileStockView';
import MobileMachinesView from './MobileMachinesView';
import MobileTasksView from './MobileTasksView';
import QuickMovementModal from './QuickMovementModal';

/**
 * الشاشة الرئيسية للهاتف - مبسطة وسريعة وعالية الاستجابة
 */
export default function MobileHome({
  onAddMovement,
  onMarkTaskDone,
  onOpenMenu,
  _onDirectSave,
  _currentUser,
}) {
  const gmaoState = useGmaoState();
  const [activeTab, setActiveTab] = useState('home'); // home, stock, machines, tasks
  const [quickMovementItem, setQuickMovementItem] = useState(null);

  const rawStock = gmaoState?.rawStock || gmaoState?.state?.rawStock || [];
  const machines = gmaoState?.machines || gmaoState?.state?.machines || [];
  const preventiveTasks = gmaoState?.preventiveTasks || gmaoState?.state?.preventiveTasks || [];
  const mouvements = gmaoState?.mouvements || gmaoState?.state?.mouvements || [];

  // حساب الأرقام المهمة فقط
  const stats = {
    lowStockCount: rawStock.filter(s => {
      const q = Number(s.stockActuel ?? s.quantity ?? s.qte ?? 0);
      const min = Number(s.stockMin ?? s.minStock ?? s.seuil ?? 0);
      return min > 0 && q <= min;
    }).length,
    machinesDown: machines.filter(m => m.status === 'EN_PANNE').length,
    pendingTasks: preventiveTasks.filter(t => !t.completed && t.status !== 'REALISE').length,
    totalStockCount: rawStock.length,
  };

  const lowStockAlerts = rawStock.filter(s => {
    const q = Number(s.stockActuel ?? s.quantity ?? 0);
    const min = Number(s.stockMin ?? s.minStock ?? 0);
    return min > 0 && q <= min;
  }).slice(0, 4);

  // Switch to specific sub-view if not home
  if (activeTab === 'stock') {
    return (
      <div className="min-h-screen bg-zinc-50 pb-20">
        <MobileStockView
          onAddMovement={onAddMovement}
          onBack={() => setActiveTab('home')}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onOpenMenu={onOpenMenu} />
      </div>
    );
  }

  if (activeTab === 'machines') {
    return (
      <div className="min-h-screen bg-zinc-50 pb-20">
        <MobileMachinesView onBack={() => setActiveTab('home')} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onOpenMenu={onOpenMenu} />
      </div>
    );
  }

  if (activeTab === 'tasks') {
    return (
      <div className="min-h-screen bg-zinc-50 pb-20">
        <MobileTasksView
          onMarkTaskDone={onMarkTaskDone}
          onBack={() => setActiveTab('home')}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onOpenMenu={onOpenMenu} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Quick Stats - 4 أرقام مهمة فقط */}
      <div className="grid grid-cols-2 gap-2.5 p-3">
        {/* تنبيهات المخزون */}
        <QuickStat
          icon={<AlertCircle className="w-5 h-5" />}
          label="مخزون منخفض"
          value={stats.lowStockCount}
          color={stats.lowStockCount > 0 ? 'bg-linear-to-br from-rose-500 to-rose-600' : 'bg-linear-to-br from-zinc-700 to-zinc-800'}
          onClick={() => setActiveTab('stock')}
        />

        {/* الآلات المعطلة */}
        <QuickStat
          icon={<Wrench className="w-5 h-5" />}
          label="آلات معطلة"
          value={stats.machinesDown}
          color={stats.machinesDown > 0 ? 'bg-linear-to-br from-amber-500 to-amber-600' : 'bg-linear-to-br from-zinc-700 to-zinc-800'}
          onClick={() => setActiveTab('machines')}
        />

        {/* المهام المعلقة */}
        <QuickStat
          icon={<BarChart3 className="w-5 h-5" />}
          label="وقائي معلق"
          value={stats.pendingTasks}
          color="bg-linear-to-br from-purple-600 to-purple-700"
          onClick={() => setActiveTab('tasks')}
        />

        {/* إجمالي أصناف المخزون */}
        <QuickStat
          icon={<Package className="w-5 h-5" />}
          label="أصناف المخزون"
          value={stats.totalStockCount}
          color="bg-linear-to-br from-emerald-600 to-emerald-700"
          onClick={() => setActiveTab('stock')}
        />
      </div>

      {/* Action Buttons - العمليات الأساسية فقط */}
      <div className="px-3 py-1 space-y-2">
        <button
          onClick={() => {
            if (rawStock.length > 0) {
              setQuickMovementItem(rawStock[0]);
            } else {
              setActiveTab('stock');
            }
          }}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-98 transition"
        >
          <span>📦</span>
          <span>صرف قطعة غيار سريعة (Sortie PDR)</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab('stock')}
            className="py-3 bg-white border border-zinc-200 text-zinc-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition"
          >
            <Search size={15} className="text-zinc-500" />
            <span>فحص وبحث المخزون</span>
          </button>
          <button
            onClick={() => setActiveTab('machines')}
            className="py-3 bg-white border border-zinc-200 text-zinc-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition"
          >
            <Cpu size={15} className="text-blue-600" />
            <span>سجل الآلات</span>
          </button>
        </div>
      </div>

      {/* Critical Low Stock Alert Section */}
      {lowStockAlerts.length > 0 && (
        <div className="px-3 py-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-extrabold text-xs text-zinc-800 flex items-center gap-1.5">
              <AlertCircle size={15} className="text-rose-600" />
              <span>نواقص المخزون الحرجة ({stats.lowStockCount})</span>
            </h2>
            <button
              onClick={() => setActiveTab('stock')}
              className="text-[11px] font-bold text-blue-600"
            >
              عرض الكل ←
            </button>
          </div>
          <div className="space-y-1.5">
            {lowStockAlerts.map((item, idx) => (
              <div
                key={item.id || item.code || idx}
                onClick={() => setQuickMovementItem(item)}
                className="bg-white border border-rose-100 rounded-xl p-2.5 flex justify-between items-center shadow-2xs cursor-pointer active:scale-98 transition"
              >
                <div>
                  <span className="font-extrabold text-xs text-zinc-900 bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded">
                    {item.ref || item.code}
                  </span>
                  <p className="text-xs text-zinc-700 font-medium mt-0.5 line-clamp-1">{item.designation}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-rose-600 block">
                    {item.stockActuel ?? item.quantity ?? 0} {item.unit || 'U'}
                  </span>
                  <span className="text-[10px] text-zinc-400">الحد: {item.stockMin || item.minStock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities - آخر 3 حركات فقط */}
      {mouvements.length > 0 && (
        <div className="px-3 py-2">
          <h2 className="font-extrabold text-xs text-zinc-800 mb-2">آخر حركات المخزون المسجلة</h2>
          <div className="space-y-1.5">
            {mouvements.slice(-3).reverse().map((m, idx) => (
              <RecentActivityCard key={m.id || idx} movement={m} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Movement Modal */}
      {quickMovementItem && (
        <QuickMovementModal
          item={quickMovementItem}
          onClose={() => setQuickMovementItem(null)}
          onSave={onAddMovement}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMenu={onOpenMenu}
      />
    </div>
  );
}

/**
 * بطاقة إحصائية سريعة
 */
function QuickStat({ icon, label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-2xl p-3.5 text-left shadow-2xs active:scale-98 transition cursor-pointer`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="opacity-90">{icon}</span>
        <span className="text-2xl font-black">{value}</span>
      </div>
      <div className="text-xs font-bold opacity-95">{label}</div>
    </button>
  );
}

/**
 * بطاقة الحركة الأخيرة
 */
function RecentActivityCard({ movement }) {
  const isOut = (movement.type || '').toUpperCase().includes('SORTIE') || (movement.type || '').toUpperCase() === 'OUT';

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-2.5 flex justify-between items-center shadow-2xs">
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
            isOut ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {isOut ? '📤 خروج' : '📥 دخول'}
          </span>
          <span className="font-bold text-xs text-zinc-900">{movement.ref || movement.stockCode || 'PDR'}</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
          الكمية: <strong>{movement.quantite || movement.quantity}</strong> | المنفذ: {movement.intervenant || movement.user || 'Technicien'}
        </p>
      </div>
      <span className="text-[10px] text-zinc-400 font-medium">
        {movement.date ? new Date(movement.date).toLocaleDateString('fr-FR') : 'اليوم'}
      </span>
    </div>
  );
}

/**
 * شريط التنقل السفلي
 */
function BottomNav({ activeTab, setActiveTab, onOpenMenu }) {
  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'stock', label: 'المخزون', icon: '📦' },
    { id: 'machines', label: 'الآلات', icon: '⚙️' },
    { id: 'tasks', label: 'الوقائي', icon: '📅' },
    { id: 'menu', label: 'المزيد', icon: '☰' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 flex justify-around items-center z-40 h-16 max-w-md mx-auto shadow-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => {
            if (tab.id === 'menu') {
              if (typeof onOpenMenu === 'function') onOpenMenu();
            } else {
              setActiveTab(tab.id);
            }
          }}
          className={`flex-1 py-1 flex flex-col items-center justify-center transition active:scale-95 ${
            activeTab === tab.id
              ? 'text-blue-600 font-black'
              : 'text-zinc-500 font-medium hover:text-zinc-900'
          }`}
        >
          <span className="text-lg leading-none mb-0.5">{tab.icon}</span>
          <span className="text-[10px]">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
