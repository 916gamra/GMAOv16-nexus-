import { useState, useMemo } from 'react';
import { Search, X, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useGmaoState } from '../../hooks/useGmaoState';

/**
 * صفحة مهام الصيانة الوقائية للهاتف - مبسطة وسريعة
 */
export default function MobileTasksView({ onMarkTaskDone, onBack }) {
  const gmaoState = useGmaoState();
  const preventiveTasks = gmaoState?.preventiveTasks || gmaoState?.state?.preventiveTasks || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'all', 'pending', 'done'
  const [justCompletedId, setJustCompletedId] = useState(null);

  // تصفية المهام الوقائية فقط
  const filteredTasks = useMemo(() => {
    let list = preventiveTasks || [];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(t =>
        String(t.titre || t.description || t.titre_intervention || '').toLowerCase().includes(q) ||
        String(t.machine || t.machine_id || '').toLowerCase().includes(q) ||
        String(t.periodicite || '').toLowerCase().includes(q)
      );
    }

    if (filterStatus === 'pending') {
      list = list.filter(t => !t.completed && t.status !== 'REALISE' && t.status !== 'FAIT');
    } else if (filterStatus === 'done') {
      list = list.filter(t => t.completed || t.status === 'REALISE' || t.status === 'FAIT');
    }

    return list;
  }, [preventiveTasks, searchTerm, filterStatus]);

  const counts = useMemo(() => {
    return {
      all: preventiveTasks.length,
      pending: preventiveTasks.filter(t => !t.completed && t.status !== 'REALISE' && t.status !== 'FAIT').length,
      done: preventiveTasks.filter(t => t.completed || t.status === 'REALISE' || t.status === 'FAIT').length,
    };
  }, [preventiveTasks]);

  const handleValidate = async (task) => {
    const taskId = task.id || task.code;
    setJustCompletedId(taskId);
    if (typeof onMarkTaskDone === 'function') {
      await onMarkTaskDone(taskId, {
        dateExecution: new Date().toISOString().split('T')[0],
        intervenant: gmaoState?.technicians?.[0]?.nom || 'Technicien',
      });
    } else if (typeof gmaoState?.handleMarkTaskDone === 'function') {
      await gmaoState.handleMarkTaskDone(taskId, {
        dateExecution: new Date().toISOString().split('T')[0],
      });
    }
    setTimeout(() => setJustCompletedId(null), 1500);
  };

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
              <Calendar size={18} className="text-purple-600" />
              <span>الوقائي (Préventif)</span>
            </h1>
          </div>
          <span className="text-xs font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
            {filteredTasks.length} مهمة
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="بحث بالمهمة، الماكينة، الدورية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-zinc-100 border border-zinc-200/80 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            label="⏳ بانتظار الإنجاز"
            active={filterStatus === 'pending'}
            onClick={() => setFilterStatus('pending')}
            badge={counts.pending}
          />
          <FilterTab
            label="✅ تم الإنجاز"
            active={filterStatus === 'done'}
            onClick={() => setFilterStatus('done')}
            badge={counts.done}
          />
          <FilterTab
            label="الكل"
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
            badge={counts.all}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="p-3 space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 text-zinc-500 text-xs">
            <Calendar size={28} className="mx-auto mb-2 opacity-30 text-zinc-400" />
            لا توجد مهام وقائية مطابقة
          </div>
        ) : (
          filteredTasks.map((task, idx) => (
            <PreventiveTaskCard
              key={task.id || task.code || idx}
              task={task}
              isJustCompleted={justCompletedId === (task.id || task.code)}
              onValidate={() => handleValidate(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * بطاقة المهمة الوقائية
 */
function PreventiveTaskCard({ task, onValidate, isJustCompleted }) {
  const isDone = task.completed || task.status === 'REALISE' || task.status === 'FAIT' || isJustCompleted;

  return (
    <div className={`rounded-xl p-3.5 border transition duration-200 shadow-2xs ${
      isDone ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-zinc-200'
    }`}>
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-xs text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded">
              {task.machine || task.machine_id || 'Machine'}
            </span>
            {task.periodicite && (
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                ⏱ {task.periodicite}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-zinc-800 mt-1">
            {task.titre || task.description || task.titre_intervention || 'Tâche préventive'}
          </p>
        </div>

        {isDone ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 flex items-center gap-1">
            <CheckCircle2 size={11} /> منجزة
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0 flex items-center gap-1">
            <Clock size={11} /> معلقة
          </span>
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-xs">
        <span className="text-[11px] text-zinc-500">
          الموعد: <strong className="text-zinc-700 font-semibold">{task.date_prevue || task.prochaineDate || 'مجدول'}</strong>
        </span>

        {!isDone ? (
          <button
            onClick={onValidate}
            className="bg-purple-600 active:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition"
          >
            <CheckCircle2 size={13} />
            <span>تسجيل الإنجاز</span>
          </button>
        ) : (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 size={14} /> تم الحفظ
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * تبويب التصفية
 */
function FilterTab({ label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 active:scale-95 ${
        active
          ? 'bg-purple-700 text-white shadow-2xs'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
      }`}
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
          active ? 'bg-white/25 text-white' : 'bg-zinc-200 text-zinc-700'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
