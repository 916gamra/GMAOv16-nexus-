import { useState, useMemo } from 'react';
import { Search, X, Package, ArrowUpRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useGmaoState } from '../../hooks/useGmaoState';
import QuickMovementModal from './QuickMovementModal';

/**
 * صفحة المخزون للهاتف - مبسطة وسريعة
 */
export default function MobileStockView({ onAddMovement, onBack }) {
  const gmaoState = useGmaoState();
  const rawStock = gmaoState?.rawStock || gmaoState?.state?.rawStock || gmaoState?.stock || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, low, critical
  const [selectedItem, setSelectedItem] = useState(null);

  // تصفية وحساب عناصر المخزون
  const filteredStock = useMemo(() => {
    let result = rawStock || [];

    // البحث الفوري
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(s =>
        String(s.code || s.ref || '').toLowerCase().includes(q) ||
        String(s.designation || '').toLowerCase().includes(q) ||
        String(s.emplacement || '').toLowerCase().includes(q)
      );
    }

    // التصفية بالحالة
    if (filterType === 'low') {
      result = result.filter(s => {
        const qty = Number(s.stockActuel ?? s.quantity ?? s.qte ?? 0);
        const min = Number(s.stockMin ?? s.minStock ?? s.seuil ?? 0);
        return qty <= min && qty > 0;
      });
    } else if (filterType === 'critical') {
      result = result.filter(s => {
        const qty = Number(s.stockActuel ?? s.quantity ?? s.qte ?? 0);
        return qty <= 0;
      });
    }

    return result;
  }, [rawStock, searchTerm, filterType]);

  return (
    <div className="min-h-[85vh] bg-zinc-50 pb-24">
      {/* Header & Search */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-3 py-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 active:scale-95"
              >
                ✕
              </button>
            )}
            <h1 className="text-base font-black text-zinc-900 flex items-center gap-1.5">
              <Package size={18} className="text-emerald-600" />
              <span>قطع الغيار (Stock PDR)</span>
            </h1>
          </div>
          <span className="text-xs font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
            {filteredStock.length} مادة
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="بحث بالرمز، الاسم، أو الرف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-zinc-100 border border-zinc-200/80 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
          <FilterTab
            label="الكل"
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          />
          <FilterTab
            label="⚠️ تحت الحد الأدنى"
            active={filterType === 'low'}
            onClick={() => setFilterType('low')}
          />
          <FilterTab
            label="🔴 نفاد كلي"
            active={filterType === 'critical'}
            onClick={() => setFilterType('critical')}
          />
        </div>
      </div>

      {/* Stock Items List */}
      <div className="p-3 space-y-2.5">
        {filteredStock.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 text-zinc-500 text-xs">
            <Package size={28} className="mx-auto mb-2 opacity-30 text-zinc-400" />
            لا توجد مواد مطابقة للبحث أو الفلتر
          </div>
        ) : (
          filteredStock.map((item, idx) => (
            <StockItemCard
              key={item.id || item.code || item.ref || idx}
              item={item}
              onQuickMove={() => setSelectedItem(item)}
            />
          ))
        )}
      </div>

      {/* Quick Movement Modal */}
      {selectedItem && (
        <QuickMovementModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={onAddMovement}
        />
      )}
    </div>
  );
}

/**
 * بطاقة عنصر مخزون مختصرة
 */
function StockItemCard({ item, onQuickMove }) {
  const currentStock = Number(item.stockActuel ?? item.quantity ?? item.qte ?? 0);
  const minStock = Number(item.stockMin ?? item.minStock ?? item.seuil ?? 0);

  const isRupture = currentStock <= 0;
  const isAlerte = !isRupture && minStock > 0 && currentStock <= minStock;

  return (
    <div className="bg-white rounded-xl p-3.5 border border-zinc-200 shadow-2xs flex flex-col gap-2">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-xs text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded">
              {item.ref || item.code}
            </span>
            {item.emplacement && (
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-200 px-1.5 py-0.2 rounded">
                📍 {item.emplacement}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-zinc-800 mt-1 line-clamp-1">{item.designation}</p>
        </div>

        {/* Status Badge */}
        {isRupture ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 shrink-0 flex items-center gap-1">
            <ShieldAlert size={11} /> نفاد
          </span>
        ) : isAlerte ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 shrink-0 flex items-center gap-1">
            <AlertTriangle size={11} /> تنبيه
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            متوفر
          </span>
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-xs">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] text-zinc-400 block">المتاح</span>
            <span className={`font-black text-sm ${isRupture ? 'text-rose-600' : isAlerte ? 'text-amber-600' : 'text-emerald-700'}`}>
              {currentStock} <span className="text-[10px] font-normal">{item.unit || item.unite || 'U'}</span>
            </span>
          </div>
          {minStock > 0 && (
            <div>
              <span className="text-[10px] text-zinc-400 block">الحد الأدنى</span>
              <span className="font-bold text-xs text-zinc-600">{minStock}</span>
            </div>
          )}
        </div>

        <button
          onClick={onQuickMove}
          className="bg-emerald-600 active:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition"
        >
          <span>حركة سريعة</span>
          <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}

/**
 * تبويب التصفية
 */
function FilterTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 ${
        active
          ? 'bg-emerald-700 text-white shadow-2xs'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}
