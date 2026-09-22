import { normalizeSearchString, multiTokenSearch, fuzzyMatch } from '../../utils/searchUtils.js';
import { Logger } from '../../core/logger/LoggerService.js';

/**
 * Service de Recherche et Filtrage Avancé pour CIOB GMAO
 * Offre recherche multi-critères, multi-tokens et floue sur articles, machines, mouvements et préventifs.
 */
export class SearchService {
  /**
   * Recherche générique sur une collection d'objets
   * @param {Array<Object>} items - Liste des éléments
   * @param {string} query - Requête de recherche
   * @param {Array<string>} searchFields - Champs textuels à scanner
   * @param {Object} [filters] - Filtres d'égalité optionnels { [field]: value }
   * @returns {Array<Object>} Éléments filtrés
   */
  static search(items = [], query = '', searchFields = [], filters = {}) {
    if (!Array.isArray(items)) return [];
    const cleanQuery = (query || '').trim();

    const filtered = items.filter((item) => {
      if (!item) return false;

      // 1. Appliquer les filtres stricts (catégorie, état, zone, alerte, etc.)
      for (const [key, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null && val !== '' && val !== 'TOUS') {
          if (String(item[key]).toLowerCase() !== String(val).toLowerCase()) {
            return false;
          }
        }
      }

      // 2. Recherche textuelle multi-tokens
      if (cleanQuery && searchFields.length > 0) {
        return multiTokenSearch(item, searchFields, cleanQuery);
      }

      return true;
    });

    Logger.debug(`[SearchService] Searched ${items.length} items -> Found ${filtered.length}`);
    return filtered;
  }

  /**
   * Recherche spécifique au stock d'articles
   */
  static searchArticles(articles = [], query = '', filters = {}) {
    const fields = ['ref', 'designation', 'famille', 'casier', 'emplacement', 'fournisseur', 'code_barre'];
    return this.search(articles, query, fields, filters);
  }

  /**
   * Recherche spécifique au parc machines
   */
  static searchMachines(machines = [], query = '', filters = {}) {
    const fields = ['id_machine', 'nom', 'designation', 'zone', 'constructeur', 'numero_serie', 'modele'];
    return this.search(machines, query, fields, filters);
  }

  /**
   * Recherche spécifique aux mouvements de stock
   */
  static searchMovements(movements = [], query = '', filters = {}) {
    const fields = ['ref', 'designation', 'type', 'destinataire', 'demandeur', 'machine', 'code_bon'];
    return this.search(movements, query, fields, filters);
  }

  /**
   * Recherche spécifique aux tâches de maintenance préventive
   */
  static searchPreventiveTasks(tasks = [], query = '', filters = {}) {
    const fields = ['code', 'id_machine', 'nom_machine', 'composant', 'frequence', 'responsable', 'consigne'];
    return this.search(tasks, query, fields, filters);
  }

  /**
   * Correspondance floue utile pour suggestions de complétion automatique
   */
  static fuzzyFind(text, pattern) {
    return fuzzyMatch(text, pattern);
  }
}

export default SearchService;
