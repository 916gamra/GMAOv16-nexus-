import { useState, useMemo } from 'react';
import { Search, X, Cpu } from 'lucide-react';
import { useGmaoState } from '../../hooks/useGmaoState';

/**
 * صفحة الآلات للهاتف - مبسطة وسريعة
 */
export default function MobileMachinesView({ onBack }) {
  const gmaoState = useGmaoState();
  const machines = gmaoState?.machines || gmaoState?.state?.machines || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, en_service, en_panne, maintenance

  const filteredMachines = useMemo(() => {
    let list = machines || [];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(m =>
        String(m.nom || m.name || m.id || '').toLowerCase().includes(q) ||
        String(m.zone || '').toLowerCase().includes(q) ||
        String(m.famille || m.family || '').toLowerCase().includes(q)
      );
    }

    if (filterStatus === 'en_service') {
      list = list.filter(m => (m.status || 'EN_SERVICE') === 'EN_SERVICE' || (m.status || '').includes('ACTIF'));
    } else if (filterStatus === 'en_panne') {
      list = list.filter(m => m.status === 'EN_PANNE');
    } else if (filterStatus === 'maintenance') {
      list = list.filter(m => m.status === 'MAINTENANCE');
    }

    return list;
  }, [machines, searchTerm, filterStatus]);

  const counts = useMemo(() => {
    return {
      all: machines.length,
      service: machines.filter(m => (m.status || 'EN_SERVICE') === 'EN_SERVICE').length,
      panne: machines.filter(m => m.status === 'EN_PANNE').length,
      maint: machines.filter(m => m.status === 'MAINTENANCE').length,
    };
  }, [machines]);

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
              <Cpu size={18} className="text-blue-600" />
              <span>الآلات (Parc Machines)</span>
            </h1>
          </div>
          <span className="text-xs font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
            {filteredMachines.length} آلة
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، الكود، الورشة، العائلة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-zinc-100 border border-zinc-200/80 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <FilterButton
            label="الكل"
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
            badge={counts.all}
          />
          <FilterButton
            label="✅ في الخدمة"
            active={filterStatus === 'en_service'}
            onClick={() => setFilterStatus('en_service')}
            badge={counts.service}
          />
          {counts.panne > 0 && (
            <FilterButton
              label="🔴 معطلة"
              active={filterStatus === 'en_panne'}
              onClick={() => setFilterStatus('en_panne')}
              badge={counts.panne}
              badgeColor="bg-rose-600"
            />
          )}
          {counts.maint > 0 && (
            <FilterButton
              label="🔧 صيانة"
              active={filterStatus === 'maintenance'}
              onClick={() => setFilterStatus('maintenance')}
              badge={counts.maint}
              badgeColor="bg-amber-600"
            />
          )}
        </div>
      </div>

      {/* Machines List */}
      <div className="p-3 space-y-2.5">
        {filteredMachines.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 text-zinc-500 text-xs">
            <Cpu size={28} className="mx-auto mb-2 opacity-30 text-zinc-400" />
            لا توجد آلات مطابقة للبحث أو التصفية
          </div>
        ) : (
          filteredMachines.map((machine, idx) => (
            <MachineCard key={machine.id || machine.code || idx} machine={machine} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * بطاقة الآلة
 */
function MachineCard({ machine }) {
  const statusConfig = {
    EN_SERVICE: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'في الخدمة' },
    EN_PANNE: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'متوقفة / عطل' },
    MAINTENANCE: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'قيد الصيانة' },
  };

  const status = machine.status || 'EN_SERVICE';
  const config = statusConfig[status] || statusConfig.EN_SERVICE;

  return (
    <div className="bg-white rounded-xl p-3.5 border border-zinc-200 shadow-2xs">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-xs text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded">
              {machine.id || machine.code}
            </span>
            <span className="text-xs font-bold text-zinc-800">
              {machine.nom || machine.name}
            </span>
          </div>
          {(machine.famille || machine.family) && (
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
              العائلة: {machine.famille || machine.family}
            </p>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${config.color}`}>
          {config.label}
        </span>
      </div>

      <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
        <span>📍 المنطقة: <strong className="text-zinc-700 font-bold">{machine.zone || 'Zone 1'}</strong></span>
        {(machine.modele || machine.template) && (
          <span>القالب: <strong className="text-zinc-700 font-bold">{machine.modele || machine.template}</strong></span>
        )}
      </div>
    </div>
  );
}

/**
 * زر التصفية مع العداد
 */
function FilterButton({ label, active, onClick, badge, badgeColor = 'bg-zinc-700' }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 active:scale-95 ${
        active
          ? 'bg-blue-600 text-white shadow-2xs'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
      }`}
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
          active ? 'bg-white/25 text-white' : `${badgeColor} text-white`
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
