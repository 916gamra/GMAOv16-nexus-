import { create } from 'zustand';
import { Logger } from '../core/utils/Logger.js';
import { NotificationService } from '../core/utils/NotificationService.js';
import { ValidationService, Schemas } from '../core/utils/ValidationService.js';

/**
 * متجر حالة المخزون الموحد (Zustand Stock Store)
 */
export const useStockStore = create((set, get) => ({
  articles: [],
  movements: [],
  types: [],
  diagnostics: [],
  isLoading: false,
  error: null,

  // تهيئة أو تعيين البيانات
  setArticles: (articles) => set({ articles }),
  setMovements: (movements) => set({ movements }),
  setTypes: (types) => set({ types }),
  setDiagnostics: (diagnostics) => set({ diagnostics }),

  // إضافة مقال مع التحقق
  addArticle: (newArticle) => {
    const validation = ValidationService.validate(newArticle, Schemas.StockItem);
    if (!validation.success) {
      NotificationService.error(`Erreur de validation: ${validation.error}`);
      return false;
    }

    const { articles } = get();
    // فحص تكرار المرجع
    const exists = articles.some(a => String(a.ref).trim().toLowerCase() === String(newArticle.ref).trim().toLowerCase());
    if (exists) {
      NotificationService.warning(`La référence ${newArticle.ref} existe déjà.`);
      return false;
    }

    const created = {
      ...newArticle,
      id: newArticle.id || `art_${Date.now()}`,
      stockActuel: newArticle.stockActuel ?? newArticle.stockInitial ?? 0
    };

    set({ articles: [created, ...articles] });
    Logger.info(`Article ajouté: ${created.ref}`, created);
    NotificationService.success(`Article ${created.ref} ajouté avec succès.`);
    return true;
  },

  // تعديل مقال
  updateArticle: (idOrRef, updatedFields) => {
    const { articles } = get();
    const updated = articles.map(item => {
      if (item.id === idOrRef || item.ref === idOrRef) {
        return { ...item, ...updatedFields };
      }
      return item;
    });

    set({ articles: updated });
    Logger.info(`Article mis à jour: ${idOrRef}`);
    return true;
  },

  // حذف مقال
  deleteArticle: (idOrRef) => {
    const { articles } = get();
    const filtered = articles.filter(item => item.id !== idOrRef && item.ref !== idOrRef);
    set({ articles: filtered });
    Logger.info(`Article supprimé: ${idOrRef}`);
    NotificationService.info(`Article supprimé.`);
    return true;
  },

  // إضافة حركة مخزون
  addMovement: (movement) => {
    const validation = ValidationService.validate(movement, Schemas.Movement);
    if (!validation.success) {
      NotificationService.error(`Erreur mouvement: ${validation.error}`);
      return false;
    }

    const { movements, articles } = get();
    const newMvt = {
      ...movement,
      id: movement.id || `mvt_${Date.now()}`
    };

    // تحديث كمية المقال تلقائياً
    const qty = Number(newMvt.quantite) || 0;
    const isSortie = newMvt.type.includes('Sortie');

    const updatedArticles = articles.map(art => {
      if (art.ref === newMvt.ref) {
        const current = Number(art.stockActuel ?? art.stockInitial) || 0;
        const newStock = isSortie ? Math.max(0, current - qty) : current + qty;
        return { ...art, stockActuel: newStock };
      }
      return art;
    });

    set({
      movements: [newMvt, ...movements],
      articles: updatedArticles
    });

    NotificationService.success(`Mouvement enregistré avec succès.`);
    return true;
  }
}));

export default useStockStore;
