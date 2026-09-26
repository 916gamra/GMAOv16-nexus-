// src/utils/baselineCorrective.js
import { Logger } from '../core/logger/LoggerService.js';
import seedInterventions from '../data/corrective/seedCorrectiveInterventions.json';
import seedActionsByPanne from '../data/corrective/seedActionsByPanne.json';
import seedPanneByCategory from '../data/corrective/seedPanneByCategory.json';
import seedTravailAFaire from '../data/corrective/seedTravailAFaire.json';
import seedIntervenants from '../data/corrective/seedIntervenants.json';

/**
 * Synchronously / directly provides baseline corrective maintenance data
 * Guarantees 100% offline availability and eliminates flaky fetch calls.
 */
export async function loadBaselineCorrectiveData() {
  try {
    return {
      interventions: Array.isArray(seedInterventions) ? seedInterventions : [],
      actionsByPanne: seedActionsByPanne && typeof seedActionsByPanne === 'object' ? seedActionsByPanne : {},
      panneCategories: seedPanneByCategory && typeof seedPanneByCategory === 'object' ? seedPanneByCategory : {},
      travauxAFaire: Array.isArray(seedTravailAFaire) ? seedTravailAFaire : [],
      intervenants: Array.isArray(seedIntervenants) ? seedIntervenants : [],
    };
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
