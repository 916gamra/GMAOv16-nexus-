import { useEffect } from 'react';
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

  useEffect(() => {
    let isMounted = true;
    let isSyncing = false;

    async function syncEnterpriseDb() {
      if (isSyncing) return;
      isSyncing = true;

      try {
        const sparePartService = new SparePartApplicationService();
        const machineService = new MachineApplicationService();
        const taskService = new TaskApplicationService();

        const [idbParts, idbMachines, idbTasks] = await Promise.all([
          sparePartService.listSpareParts(),
          machineService.listMachines(),
          taskService.listTasks(),
        ]);

        if (isMounted && idbParts.length === 0 && rawStock.length > 0) {
          const existingRefs = new Set(idbParts.map((p) => p.ref || p.id));
          const partsToCreate = [];
          for (const p of rawStock) {
            if (!existingRefs.has(p.ref) && !existingRefs.has(p.id)) {
              const partId =
                p.id ||
                p.ref ||
                (typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `part_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
              partsToCreate.push({ ...p, id: partId });
              existingRefs.add(p.ref);
            }
          }
          if (partsToCreate.length > 0) {
            await Promise.all(partsToCreate.map((p) => sparePartService.createSparePart(p)));
          }
        } else if (isMounted && idbParts.length > 0 && rawStock.length === 0) {
          setRawStock(idbParts);
        }

        if (isMounted && idbMachines.length === 0 && machines.length > 0) {
          const existingMachines = new Set(idbMachines.map((m) => m.id_machine_registered || m.id));
          const machinesToCreate = [];
          for (const m of machines) {
            if (!existingMachines.has(m.id_machine_registered) && !existingMachines.has(m.id)) {
              const mchId =
                m.id ||
                m.id_machine_registered ||
                (typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `mch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
              machinesToCreate.push({
                ...m,
                id: mchId,
                id_machine_registered: m.id_machine_registered || mchId,
              });
              existingMachines.add(m.id_machine_registered);
            }
          }
          if (machinesToCreate.length > 0) {
            await Promise.all(machinesToCreate.map((m) => machineService.createMachine(m)));
          }
        } else if (isMounted && idbMachines.length > 0 && machines.length === 0) {
          setMachines(idbMachines);
        }

        if (isMounted && idbTasks.length === 0 && mouvements.length > 0) {
          const existingTasks = new Set(idbTasks.map((t) => t.id || t.code_bon));
          const tasksToCreate = [];
          for (const t of mouvements) {
            if (!existingTasks.has(t.id) && !existingTasks.has(t.code_bon)) {
              const taskId =
                t.id ||
                t.code_bon ||
                (typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
              tasksToCreate.push({ ...t, id: taskId });
              existingTasks.add(t.code_bon);
            }
          }
          if (tasksToCreate.length > 0) {
            await Promise.all(tasksToCreate.map((t) => taskService.createTask(t)));
          }
        } else if (isMounted && idbTasks.length > 0 && mouvements.length === 0) {
          setMouvements(idbTasks);
        }
      } catch (_err) {
        Logger.error('Enterprise DB Sync Error:', _err, 'useEnterpriseDbSync');
      } finally {
        isSyncing = false;
      }
    }

    syncEnterpriseDb();

    return () => {
      isMounted = false;
    };
  }, [machines, mouvements, rawStock, setMachines, setMouvements, setRawStock]);
}
