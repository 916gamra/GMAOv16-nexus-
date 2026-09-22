import { useState, useMemo } from 'react';
import { Search, X, Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function MobilePreventiveView({
  preventiveTasks = [],
  onMarkTaskDone,
  showToast,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'all' | 'completed'
  const [validatingId, setValidatingId] = useState(null);

  const isTaskCompleted = (task) => {
    const s = String(task.statut || '').toLowerCase();
    return s === 'termine' || s === 'terminé' || s === 'fait' || task.effectuee === true;
  };

  const filteredTasks = useMemo(() => {
    let result = preventiveTasks;

    if (statusFilter === 'pending') {
      result = result.filter((t) => !isTaskCompleted(t));
    } else if (statusFilter === 'completed') {
      result = result.filter((t) => isTaskCompleted(t));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          String(t.titre || t.description || '').toLowerCase().includes(q) ||
          String(t.machine_nom || t.machine || t.id_machine || '').toLowerCase().includes(q) ||
          String(t.composant || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [preventiveTasks, search, statusFilter]);

  const counts = useMemo(() => {
    const completed = preventiveTasks.filter((t) => isTaskCompleted(t)).length;
    const pending = preventiveTasks.length - completed;
    return { all: preventiveTasks.length, pending, completed };
  }, [preventiveTasks]);

  const handleValidate = async (task) => {
    const taskId = task.id || task.id_task;
    if (!taskId) return;

    setValidatingId(taskId);
    try {
      if (onMarkTaskDone) {
        await onMarkTaskDone(taskId);
      }
      showToast?.(`Tâche préventive validée avec succès !`, 'success');
    } catch (err) {
      console.error(err);
      showToast?.("Erreur lors de la validation de la tâche.", 'error');
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher tâche, machine, composant..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200/90 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-2xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-purple-700 border border-purple-200'
          }`}
        >
          <Clock size={13} />
          <span>À faire ({counts.pending})</span>
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 border border-emerald-200'
          }`}
        >
          <CheckCircle2 size={13} />
          <span>Réalisées ({counts.completed})</span>
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl shrink-0 transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-white text-zinc-600 border border-zinc-200'
          }`}
        >
          Toutes ({counts.all})
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Aucune tâche préventive à afficher</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const taskId = task.id || task.id_task;
            const completed = isTaskCompleted(task);
            const isValidating = validatingId === taskId;
            const machineName = task.machine_nom || task.machine || task.id_machine || 'Machine';

            return (
              <div
                key={taskId}
                className={`p-4 rounded-2xl bg-white border shadow-2xs space-y-3 transition ${
                  completed ? 'border-zinc-200/80 bg-zinc-50/40 opacity-80' : 'border-zinc-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-purple-800 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md">
                        {machineName}
                      </span>
                      {task.periodicite && (
                        <span className="text-[10.5px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                          {task.periodicite}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-zinc-900 mt-1 leading-snug">
                      {task.titre || task.description || 'Intervention Préventive'}
                    </h3>
                    {task.composant && (
                      <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                        Composant: <span className="font-semibold text-zinc-700">{task.composant}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {completed ? (
                      <span className="px-2 py-1 rounded-lg font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Fait</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg font-bold text-[11px] bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock size={12} />
                        <span>Planifié</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Due Date & Action */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <div className="text-xs text-zinc-500 font-medium">
                    {task.date_prochaine ? `Échéance: ${task.date_prochaine}` : 'Périodique standard'}
                  </div>

                  {!completed && (
                    <button
                      onClick={() => handleValidate(task)}
                      disabled={isValidating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50 shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>{isValidating ? 'Validation...' : 'Valider'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
