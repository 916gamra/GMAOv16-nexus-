import { create } from 'zustand';
import { Logger } from '../core/utils/Logger.js';
import { NotificationService } from '../core/utils/NotificationService.js';

/**
 * متجر حالة المستودع والمكونات الموحد (Zustand Warehouse Store)
 */
export const useWarehouseStore = create((set, get) => ({
  warehouseItems: [],
  entrepotComponents: [],
  compGroups: [],
  compFamilies: [],
  compTemplates: [],
  partTypes: [],
  partDesignations: [],
  isLoading: false,

  setWarehouseItems: (warehouseItems) => set({ warehouseItems }),
  setEntrepotComponents: (entrepotComponents) => set({ entrepotComponents }),
  setCompGroups: (compGroups) => set({ compGroups }),
  setCompFamilies: (compFamilies) => set({ compFamilies }),
  setCompTemplates: (compTemplates) => set({ compTemplates }),
  setPartTypes: (partTypes) => set({ partTypes }),
  setPartDesignations: (partDesignations) => set({ partDesignations }),

  addWarehouseItem: (newItem) => {
    const { warehouseItems } = get();
    const itemRef = String(newItem.ref || newItem.code || '').trim().toUpperCase();

    if (warehouseItems.some(i => String(i.ref || i.code).trim().toUpperCase() === itemRef)) {
      NotificationService.warning(`L'article ${itemRef} existe déjà dans l'entrepôt.`);
      return false;
    }

    const created = {
      ...newItem,
      id: newItem.id || `wh_${Date.now()}`,
      ref: itemRef
    };

    set({ warehouseItems: [created, ...warehouseItems] });
    Logger.info(`Article entrepôt ajouté: ${itemRef}`);
    NotificationService.success(`Article ${itemRef} ajouté avec succès.`);
    return true;
  },

  updateWarehouseItem: (idOrRef, updatedFields) => {
    const { warehouseItems } = get();
    const updated = warehouseItems.map(item => {
      if (item.id === idOrRef || item.ref === idOrRef) {
        return { ...item, ...updatedFields };
      }
      return item;
    });

    set({ warehouseItems: updated });
    Logger.info(`Article entrepôt mis à jour: ${idOrRef}`);
    return true;
  },

  deleteWarehouseItem: (idOrRef) => {
    const { warehouseItems } = get();
    const filtered = warehouseItems.filter(item => item.id !== idOrRef && item.ref !== idOrRef);
    set({ warehouseItems: filtered });
    Logger.info(`Article entrepôt supprimé: ${idOrRef}`);
    NotificationService.info('Article entrepôt supprimé.');
    return true;
  }
}));

export default useWarehouseStore;
