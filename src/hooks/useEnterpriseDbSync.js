import { useEffect, useRef } from 'react';
import { Logger } from '../core/logger/LoggerService';
import { SparePartApplicationService } from '../application/services/SparePartApplicationService.js';
import { MachineApplicationService } from '../application/services/MachineApplicationService.js';
import { TaskApplicationService } from '../application/services/TaskApplicationService.js';

/**
 * Hook to manage two-way initial synchronization between React state and Enterprise IndexedDB repositories
 */
export function useEnterpriseDbSync(state, setters) {
  const { rawStock, machines, mouvements } = state;
  const { setRawStock, setMachines, setMouvements } = setters;
  const syncInProgressRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function syncEnterpriseDb() {
      if (syncInProgressRef.current) return;
      syncInProgressRef.current = true;

      try {
        const sparePartService = new SparePartApplicationService();
        const machineService = new MachineApplicationService();
        const taskService = new TaskApplicationService();

        const [idbParts, idbMachines, idbTasks] = await Promise.all([
          sparePartService.listSpareParts(),
          machineService.listMachines(),
          taskService.listTasks(),
        ]);

        if (!isMounted) return;

        // Parts Sync
        if (idbParts.length === 0 && rawStock.length > 0) {
          const partsToCreate = rawStock.map(p => ({
            ...p,
            id: p.id || p.ref || `part_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
          }));
          await Promise.all(partsToCreate.map((p) => sparePartService.createSparePart(p)));
        } else if (idbParts.length > 0 && rawStock.length === 0) {
          setRawStock(idbParts);
        }

        // Machines Sync
        if (idbMachines.length === 0 && machines.length > 0) {
          const machinesToCreate = machines.map(m => ({
            ...m,
            id: m.id || m.id_machine_registered || `mch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            id_machine_registered: m.id_machine_registered || m.id
          }));
          await Promise.all(machinesToCreate.map((m) => machineService.createMachine(m)));
        } else if (idbMachines.length > 0 && machines.length === 0) {
          setMachines(idbMachines);
        }

        // Tasks Sync
        if (idbTasks.length === 0 && mouvements.length > 0) {
          const tasksToCreate = mouvements.map(t => ({
            ...t,
            id: t.id || t.code_bon || `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
          }));
          await Promise.all(tasksToCreate.map((t) => taskService.createTask(t)));
        } else if (idbTasks.length > 0 && mouvements.length === 0) {
          setMouvements(idbTasks);
        }
      } catch (_err) {
        Logger.error('Enterprise DB Sync Error:', _err, 'useEnterpriseDbSync');
      } finally {
        syncInProgressRef.current = false;
      }
    }

    // Only sync if we have something to sync or if storage is empty
    const shouldSync = (rawStock.length > 0 || machines.length > 0 || mouvements.length > 0);
    if (shouldSync) {
      syncEnterpriseDb();
    }

    return () => {
      isMounted = false;
    };
  }, [machines.length, mouvements.length, rawStock.length]); // Only react to length changes to avoid loops
}
