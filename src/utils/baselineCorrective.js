// src/utils/baselineCorrective.js
import { Logger } from '../core/logger/LoggerService.js';

let cachedCorrectiveData = null;

/**
 * Loads baseline corrective maintenance data asynchronously from /data/corrective/
 * This prevents bundling 1.7MB+ of JSON into the JS application bundle.
 */
export async function loadBaselineCorrectiveData() {
  if (cachedCorrectiveData) {
    return cachedCorrectiveData;
  }

  try {
    const [
      interventionsRes,
      actionsRes,
      panneCategoriesRes,
      travauxRes,
      intervenantsRes,
    ] = await Promise.all([
      fetch('/data/corrective/seedCorrectiveInterventions.json').catch((e) => {
        Logger.warn('Failed to fetch seedCorrectiveInterventions.json', e);
        return null;
      }),
      fetch('/data/corrective/seedActionsByPanne.json').catch(() => null),
      fetch('/data/corrective/seedPanneByCategory.json').catch(() => null),
      fetch('/data/corrective/seedTravailAFaire.json').catch(() => null),
      fetch('/data/corrective/seedIntervenants.json').catch(() => null),
    ]);

    const interventions = interventionsRes && interventionsRes.ok ? await interventionsRes.json() : [];
    const actionsByPanne = actionsRes && actionsRes.ok ? await actionsRes.json() : {};
    const panneCategories = panneCategoriesRes && panneCategoriesRes.ok ? await panneCategoriesRes.json() : {};
    const travauxAFaire = travauxRes && travauxRes.ok ? await travauxRes.json() : [];
    const intervenants = intervenantsRes && intervenantsRes.ok ? await intervenantsRes.json() : [];

    cachedCorrectiveData = {
      interventions: Array.isArray(interventions) ? interventions : [],
      actionsByPanne: actionsByPanne && typeof actionsByPanne === 'object' ? actionsByPanne : {},
      panneCategories: panneCategories && typeof panneCategories === 'object' ? panneCategories : {},
      travauxAFaire: Array.isArray(travauxAFaire) ? travauxAFaire : [],
      intervenants: Array.isArray(intervenants) ? intervenants : [],
    };

    return cachedCorrectiveData;
  } catch (err) {
    Logger.warn('Error in loadBaselineCorrectiveData:', err);
    return {
      interventions: [],
      actionsByPanne: {},
      panneCategories: {},
      travauxAFaire: [],
      intervenants: [],
    };
  }
}
