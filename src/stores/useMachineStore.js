import { create } from 'zustand';
import { Logger } from '../core/utils/Logger.js';
import { NotificationService } from '../core/utils/NotificationService.js';
import { ValidationService, Schemas } from '../core/utils/ValidationService.js';

/**
 * متجر حالة الآلات والورش (Zustand Machine Store)
 */
export const useMachineStore = create((set, get) => ({
  machines: [],
  families: [],
  templates: [],
  blueprints: [],
  zones: [],
  isLoading: false,

  setMachines: (machines) => set({ machines }),
  setZones: (zones) => set({ zones }),
  setFamilies: (families) => set({ families }),

  addMachine: (newMachine) => {
    const validation = ValidationService.validate(newMachine, Schemas.Machine);
    if (!validation.success) {
      NotificationService.error(`Erreur validation machine: ${validation.error}`);
      return false;
    }

    const { machines } = get();
    const exists = machines.some(m =>
      String(m.id_machine_registered).trim().toLowerCase() === String(newMachine.id_machine_registered).trim().toLowerCase()
    );

    if (exists) {
      NotificationService.warning(`La machine ${newMachine.id_machine_registered} existe déjà.`);
      return false;
    }

    const created = {
      ...newMachine,
      id: newMachine.id || `mach_${Date.now()}`
    };

    set({ machines: [created, ...machines] });
    Logger.info(`Machine ajoutée: ${created.id_machine_registered}`);
    NotificationService.success(`Machine ${created.id_machine_registered} ajoutée.`);
    return true;
  },

  updateMachine: (idOrReg, updatedFields) => {
    const { machines } = get();
    const updated = machines.map(m => {
      if (m.id === idOrReg || m.id_machine_registered === idOrReg) {
        return { ...m, ...updatedFields };
      }
      return m;
    });

    set({ machines: updated });
    Logger.info(`Machine mise à jour: ${idOrReg}`);
    return true;
  },

  deleteMachine: (idOrReg) => {
    const { machines } = get();
    const filtered = machines.filter(m => m.id !== idOrReg && m.id_machine_registered !== idOrReg);
    set({ machines: filtered });
    Logger.info(`Machine supprimée: ${idOrReg}`);
    NotificationService.info(`Machine supprimée.`);
    return true;
  }
}));

export default useMachineStore;
