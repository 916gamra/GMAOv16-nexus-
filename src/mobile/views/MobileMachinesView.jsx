import { useState, useMemo } from 'react';
import { Search, X, Cpu, MapPin, Tag, CheckCircle2 } from 'lucide-react';

export default function MobileMachinesView({
  machines = [],
  _zones = [],
  _onNavigateTab,
}) {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');

  const filteredMachines = useMemo(() => {
    let result = machines;

    if (selectedZone !== 'all') {
      result = result.filter(
        (m) =>
          String(m.zone || m.id_zone_default || '').toLowerCase() ===
          selectedZone.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (m) =>
          String(m.nom || '').toLowerCase().includes(q) ||
          String(m.id_machine_registered || m.id || '').toLowerCase().includes(q) ||
          String(m.famille || '').toLowerCase().includes(q) ||
          String(m.zone || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [machines, search, selectedZone]);

  // Extract unique zones present in machines
  const availableZones = useMemo(() => {
    const set = new Set();
    machines.forEach((m) => {
      const z = m.zone || m.id_zone_default;
      if (z) set.add(z);
    });
    return Array.from(set);
  }, [machines]);

  return (
    <div className="space-y-3 pb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une machine par code, nom..."
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

      {/* Zone Filter Chips */}
      {availableZones.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setSelectedZone('all')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition cursor-pointer ${
              selectedZone === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200'
            }`}
          >
            Toutes les zones ({machines.length})
          </button>
          {availableZones.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1 cursor-pointer ${
                selectedZone === z
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-zinc-700 border border-zinc-200'
              }`}
            >
              <MapPin size={12} />
              <span>{z}</span>
            </button>
          ))}
        </div>
      )}

      {/* Machine Cards List */}
      <div className="space-y-2.5">
        {filteredMachines.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-400">
            <Cpu size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Aucune machine trouvée</p>
          </div>
        ) : (
          filteredMachines.map((m) => {
            const machineCode = m.id_machine_registered || m.id || m.code;
            const machineName = m.nom || machineCode;
            const zoneName = m.zone || m.id_zone_default;

            return (
              <div
                key={machineCode}
                className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                        {machineCode}
                      </span>
                      {zoneName && (
                        <span className="text-[10.5px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <MapPin size={11} />
                          <span>{zoneName}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-zinc-900 mt-1 leading-snug">
                      {machineName}
                    </h3>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={12} />
                    <span>En Service</span>
                  </div>
                </div>

                {/* Sub details */}
                <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                  {m.famille && (
                    <div className="flex items-center gap-1">
                      <Tag size={12} />
                      <span>{m.famille}</span>
                    </div>
                  )}
                  {m.technician && (
                    <div className="text-[11px] text-zinc-600 font-semibold">
                      Tech: {m.technician}
                    </div>
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
