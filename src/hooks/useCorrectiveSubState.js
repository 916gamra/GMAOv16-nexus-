import { useState, useEffect, useCallback, useMemo } from 'react';
import { storageService } from '../utils/storageService';
import { loadBaselineCorrectiveData } from '../utils/baselineCorrective';
import initialInterventions from '../data/corrective/seedCorrectiveInterventions.json';
import initialActionsByPanne from '../data/corrective/seedActionsByPanne.json';
import initialPanneCategories from '../data/corrective/seedPanneByCategory.json';
import initialTravauxAFaire from '../data/corrective/seedTravailAFaire.json';
import initialIntervenants from '../data/corrective/seedIntervenants.json';
import { CorrectiveIntervention } from '../domain/corrective/entities/CorrectiveIntervention';
import { CorrectiveCalculationService } from '../domain/corrective/services/CorrectiveCalculationService';
import { movementRepository } from '../application/MovementRepository';

const STORAGE_KEY = 'gmao_corrective_interventions_v800';
const ACTIVE_LIVE_KEY = 'gmao_corrective_active_live';
const STORAGE_KEY_ACTIONS_BY_PANNE = 'gmao_corrective_actions_by_panne_v4';
const STORAGE_KEY_PANNE_CATEGORIES = 'gmao_corrective_panne_categories_v4';
const STORAGE_KEY_TRAVAUX = 'gmao_corrective_travaux_v4';
const STORAGE_KEY_INTERVENANTS = 'gmao_corrective_intervenants_v4';
const STORAGE_KEY_CORRECTIVE_INIT = 'gmao_corrective_initialized_v800';

// Helper to deep-merge dictionaries while guaranteeing baseline seed presence
function mergeDictsWithBaseline(saved, baseline) {
  if (!saved || typeof saved !== 'object') return { ...(baseline || {}) };
  if (!baseline || typeof baseline !== 'object') return { ...saved };
  const merged = { ...baseline };
  for (const [key, val] of Object.entries(saved)) {
    if (!merged[key]) {
      merged[key] = val;
    } else if (Array.isArray(val) && Array.isArray(merged[key])) {
      const set = new Set(merged[key]);
      val.forEach((item) => set.add(item));
      merged[key] = Array.from(set);
    }
  }
  return merged;
}

// Helper to merge string arrays while guaranteeing baseline seed presence
function mergeArraysWithBaseline(saved, baseline, keyField = null) {
  if (!Array.isArray(saved) || saved.length === 0) return [...(baseline || [])];
  if (!Array.isArray(baseline) || baseline.length === 0) return [...saved];
  if (!keyField) {
    const set = new Set(baseline);
    saved.forEach((item) => {
      if (item && typeof item === 'string') set.add(item.trim());
    });
    return Array.from(set);
  }
  const map = new Map();
  baseline.forEach((item) => {
    const k = String(item[keyField] || JSON.stringify(item)).toLowerCase();
    map.set(k, item);
  });
  saved.forEach((item) => {
    const k = String(item[keyField] || JSON.stringify(item)).toLowerCase();
    if (!map.has(k)) {
      map.set(k, item);
    }
  });
  return Array.from(map.values());
}

// Robust resolver that guarantees the 800 factory interventions are loaded and not superseded by legacy 23 items
function resolveInitialInterventions(saved, baseline) {
  if (!Array.isArray(saved) || saved.length === 0) {
    return baseline;
  }
  // If saved already has the full 800+ dataset with genuine factory records
  if (saved.length >= baseline.length && saved.some((item) => item?.id?.startsWith('CORR-0'))) {
    return saved;
  }

  // If saved is the obsolete mock dataset of ~23 items (typically IDs like CORR-2026-xxx)
  const isOldMockDataset =
    saved.length < baseline.length &&
    saved.every((item) => !item?.id || item.id.startsWith('CORR-2026-') || !item.id.startsWith('CORR-0'));
  if (isOldMockDataset) {
    return baseline;
  }

  // Otherwise, merge baseline with any non-mock custom user items
  const baselineMap = new Map();
  baseline.forEach((item) => {
    if (item?.id) baselineMap.set(item.id, item);
  });

  saved.forEach((item) => {
    if (item?.id && !item.id.startsWith('CORR-2026-')) {
      if (baselineMap.has(item.id)) {
        baselineMap.set(item.id, { ...baselineMap.get(item.id), ...item });
      } else {
        baselineMap.set(item.id, item);
      }
    }
  });

  return Array.from(baselineMap.values());
}

export function useCorrectiveSubState(groupedState = {}) {
  // 1. Interventions State (persisted in storage, guaranteed 800 records baseline)
  const [interventions, setInterventions] = useState(() => {
    try {
      const storedV800 = storageService.getItem(STORAGE_KEY);
      if (
        Array.isArray(storedV800) &&
        storedV800.length >= initialInterventions.length &&
        storedV800.some((i) => i?.id?.startsWith('CORR-0'))
      ) {
        return storedV800;
      }

      const existingData =
        storedV800 ||
        (Array.isArray(groupedState.correctiveInterventions) && groupedState.correctiveInterventions.length > 0
          ? groupedState.correctiveInterventions
          : null) ||
        storageService.getItem('gmao_corrective_interventions_v3') ||
        storageService.getItem('gmao_corrective_interventions') ||
        [];

      const resolved = resolveInitialInterventions(existingData, initialInterventions);
      storageService.setItem(STORAGE_KEY, resolved);
      storageService.setItem('gmao_corrective_interventions', resolved);
      storageService.setItem('gmao_corrective_interventions_v3', resolved);
      storageService.setItem(STORAGE_KEY_CORRECTIVE_INIT, 'true');
      return resolved;
    } catch {
      return initialInterventions;
    }
  });

  // 2. Actions par Panne Dictionary
  const [actionsByPanne, setActionsByPanne] = useState(() => {
    try {
      const saved =
        groupedState.correctiveActionsByPanne ||
        storageService.getItem(STORAGE_KEY_ACTIONS_BY_PANNE) ||
        storageService.getItem('gmao_corrective_actions_by_panne_v2');
      return saved && typeof saved === 'object' && Object.keys(saved).length > 0
        ? mergeDictsWithBaseline(saved, initialActionsByPanne)
        : initialActionsByPanne;
    } catch {
      return initialActionsByPanne;
    }
  });

  // 3. Panne Categories Dictionary
  const [panneCategories, setPanneCategories] = useState(() => {
    try {
      const saved =
        groupedState.correctivePanneCategories ||
        storageService.getItem(STORAGE_KEY_PANNE_CATEGORIES) ||
        storageService.getItem('gmao_corrective_panne_categories_v1');
      return saved && typeof saved === 'object' && Object.keys(saved).length > 0
        ? mergeDictsWithBaseline(saved, initialPanneCategories)
        : initialPanneCategories;
    } catch {
      return initialPanneCategories;
    }
  });

  // 4. Travail à Faire Standard Descriptions
  const [travauxAFaire, setTravauxAFaire] = useState(() => {
    try {
      const saved =
        groupedState.correctiveTravauxAFaire ||
        storageService.getItem(STORAGE_KEY_TRAVAUX) ||
        storageService.getItem('gmao_corrective_travaux_v1');
      return Array.isArray(saved) && saved.length > 0
        ? mergeArraysWithBaseline(saved, initialTravauxAFaire)
        : initialTravauxAFaire;
    } catch {
      return initialTravauxAFaire;
    }
  });

  // 5. Intervenants Correctifs
  const [intervenants, setIntervenants] = useState(() => {
    try {
      const saved =
        groupedState.correctiveIntervenants ||
        storageService.getItem(STORAGE_KEY_INTERVENANTS) ||
        storageService.getItem('gmao_corrective_intervenants_v1');
      return Array.isArray(saved) && saved.length > 0
        ? mergeArraysWithBaseline(saved, initialIntervenants, 'nom')
        : initialIntervenants;
    } catch {
      return initialIntervenants;
    }
  });

  const [activeLiveId, setActiveLiveId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_LIVE_KEY) || null;
    } catch {
      return null;
    }
  });

  // Initial Bootstrap: Load baseline corrective data on first run or if stale
  useEffect(() => {
    const isAlreadyInitialized = storageService.getItem(STORAGE_KEY_CORRECTIVE_INIT);
    const existingInStorage = storageService.getItem(STORAGE_KEY);

    if (
      !isAlreadyInitialized ||
      !existingInStorage ||
      !Array.isArray(existingInStorage) ||
      existingInStorage.length < initialInterventions.length ||
      !existingInStorage.some((i) => i?.id?.startsWith('CORR-0'))
    ) {
      setInterventions((prev) => {
        const resolved = resolveInitialInterventions(existingInStorage || prev, initialInterventions);
        storageService.setItem(STORAGE_KEY, resolved);
        storageService.setItem('gmao_corrective_interventions', resolved);
        storageService.setItem('gmao_corrective_interventions_v3', resolved);
        storageService.setItem(STORAGE_KEY_CORRECTIVE_INIT, 'true');
        return resolved;
      });
    }

    loadBaselineCorrectiveData().then((baseline) => {
      if (!baseline) return;

      if (baseline.actionsByPanne && Object.keys(baseline.actionsByPanne).length > 0) {
        setActionsByPanne((prev) => {
          const merged = mergeDictsWithBaseline(prev, baseline.actionsByPanne);
          storageService.setItem(STORAGE_KEY_ACTIONS_BY_PANNE, merged);
          return merged;
        });
      }

      if (baseline.panneCategories && Object.keys(baseline.panneCategories).length > 0) {
        setPanneCategories((prev) => {
          const merged = mergeDictsWithBaseline(prev, baseline.panneCategories);
          storageService.setItem(STORAGE_KEY_PANNE_CATEGORIES, merged);
          return merged;
        });
      }

      if (baseline.travauxAFaire && baseline.travauxAFaire.length > 0) {
        setTravauxAFaire((prev) => {
          const merged = mergeArraysWithBaseline(prev, baseline.travauxAFaire);
          storageService.setItem(STORAGE_KEY_TRAVAUX, merged);
          return merged;
        });
      }

      if (baseline.intervenants && baseline.intervenants.length > 0) {
        setIntervenants((prev) => {
          const merged = mergeArraysWithBaseline(prev, baseline.intervenants, 'nom');
          storageService.setItem(STORAGE_KEY_INTERVENANTS, merged);
          return merged;
        });
      }
    });
  }, []);

  // Auto-persist dictionary state changes
  useEffect(() => {
    try {
      storageService.setItem(STORAGE_KEY_ACTIONS_BY_PANNE, actionsByPanne);
    } catch (e) {
      console.error('Failed to save corrective actionsByPanne:', e);
    }
  }, [actionsByPanne]);

  useEffect(() => {
    try {
      storageService.setItem(STORAGE_KEY_PANNE_CATEGORIES, panneCategories);
    } catch (e) {
      console.error('Failed to save corrective panneCategories:', e);
    }
  }, [panneCategories]);

  useEffect(() => {
    try {
      storageService.setItem(STORAGE_KEY_TRAVAUX, travauxAFaire);
    } catch (e) {
      console.error('Failed to save corrective travauxAFaire:', e);
    }
  }, [travauxAFaire]);

  useEffect(() => {
    try {
      storageService.setItem(STORAGE_KEY_INTERVENANTS, intervenants);
    } catch (e) {
      console.error('Failed to save corrective intervenants:', e);
    }
  }, [intervenants]);

  // Robust Search for Actions by Panne (normalized matching)
  const getActionsForPanne = useCallback((anomalie) => {
    if (!anomalie || !actionsByPanne) return [];
    const anom = String(anomalie).trim();
    if (!anom) return [];

    // Exact key
    if (actionsByPanne[anom]) return actionsByPanne[anom];

    // Underscore variation
    const withUnder = anom.replace(/\s+/g, '_');
    if (actionsByPanne[withUnder]) return actionsByPanne[withUnder];

    // Space variation
    const withSpace = anom.replace(/_/g, ' ');
    if (actionsByPanne[withSpace]) return actionsByPanne[withSpace];

    // Normalized lowercase compare
    const lower = anom.toLowerCase().replace(/_/g, ' ').trim();
    for (const [key, acts] of Object.entries(actionsByPanne)) {
      if (key.toLowerCase().replace(/_/g, ' ').trim() === lower) {
        return acts;
      }
    }

    // Substring contains compare
    for (const [key, acts] of Object.entries(actionsByPanne)) {
      const normKey = key.toLowerCase().replace(/_/g, ' ').trim();
      if (normKey.includes(lower) || lower.includes(normKey)) {
        return acts;
      }
    }

    return [];
  }, [actionsByPanne]);

  // Dynamically add a new standard action to any panne
  const addActionForPanne = useCallback((panneKey, actionText) => {
    if (!panneKey || !actionText) return;
    const cleanAction = String(actionText).trim();
    if (!cleanAction) return;

    setActionsByPanne((prev) => {
      const existing = prev[panneKey] || [];
      if (existing.includes(cleanAction)) return prev;
      const updated = {
        ...prev,
        [panneKey]: [...existing, cleanAction],
      };
      try {
        storageService.setItem(STORAGE_KEY_ACTIONS_BY_PANNE, updated);
      } catch {}
      return updated;
    });
  }, []);

  // Reset standard corrective action & panne dictionaries back to factory seeds
  const resetCorrectiveActionsToSeed = useCallback(async () => {
    const baseline = await loadBaselineCorrectiveData();
    if (!baseline) return;

    setActionsByPanne(baseline.actionsByPanne || {});
    setPanneCategories(baseline.panneCategories || {});
    setTravauxAFaire(baseline.travauxAFaire || []);
    setIntervenants(baseline.intervenants || []);

    storageService.setItem(STORAGE_KEY_ACTIONS_BY_PANNE, baseline.actionsByPanne || {});
    storageService.setItem(STORAGE_KEY_PANNE_CATEGORIES, baseline.panneCategories || {});
    storageService.setItem(STORAGE_KEY_TRAVAUX, baseline.travauxAFaire || []);
    storageService.setItem(STORAGE_KEY_INTERVENANTS, baseline.intervenants || []);

    // Sync legacy keys
    storageService.setItem('gmao_corrective_actions_by_panne_v2', baseline.actionsByPanne || {});
    storageService.setItem('gmao_corrective_panne_categories_v1', baseline.panneCategories || {});
    storageService.setItem('gmao_corrective_travaux_v1', baseline.travauxAFaire || []);
    storageService.setItem('gmao_corrective_intervenants_v1', baseline.intervenants || []);
  }, []);

  // Force authoritative sync of all real factory data
  const forceSyncAllSeedData = useCallback(async () => {
    const baseline = await loadBaselineCorrectiveData();
    if (!baseline) return { interventionsCount: 0 };

    setInterventions(baseline.interventions || []);
    storageService.setItem(STORAGE_KEY, baseline.interventions || []);
    storageService.setItem('gmao_corrective_interventions', baseline.interventions || []);
    storageService.setItem('gmao_corrective_interventions_v3', baseline.interventions || []);
    await resetCorrectiveActionsToSeed();

    return {
      interventionsCount: (baseline.interventions || []).length,
      pannesCount: Object.values(baseline.panneCategories || {}).reduce((acc, curr) => acc + (curr?.length || 0), 0),
      categoriesCount: Object.keys(baseline.panneCategories || {}).length,
      travauxCount: (baseline.travauxAFaire || []).length,
      actionsCount: Object.keys(baseline.actionsByPanne || {}).length,
      intervenantsCount: (baseline.intervenants || []).length,
    };
  }, [resetCorrectiveActionsToSeed]);

  // Save to persistent storage
  useEffect(() => {
    try {
      storageService.setItem(STORAGE_KEY, interventions);
      storageService.setItem('gmao_corrective_interventions', interventions);
      storageService.setItem('gmao_corrective_interventions_v3', interventions);
    } catch (e) {
      console.error('Failed to save corrective interventions:', e);
    }
  }, [interventions]);

  useEffect(() => {
    try {
      if (activeLiveId) {
        localStorage.setItem(ACTIVE_LIVE_KEY, activeLiveId);
      } else {
        localStorage.removeItem(ACTIVE_LIVE_KEY);
      }
    } catch {}
  }, [activeLiveId]);

  // Derived KPI metrics
  const kpis = useMemo(() => {
    return CorrectiveCalculationService.computeKpis(interventions);
  }, [interventions]);

  // Derived Pareto analyses
  const paretoAnomalies = useMemo(() => {
    return CorrectiveCalculationService.computePareto(interventions, 'anomalie');
  }, [interventions]);

  const paretoMachines = useMemo(() => {
    return CorrectiveCalculationService.computePareto(interventions, 'code_machine');
  }, [interventions]);

  const paretoTypes = useMemo(() => {
    return CorrectiveCalculationService.computePareto(interventions, 'type_panne');
  }, [interventions]);

  // Preventive recommendations
  const preventiveRecommendations = useMemo(() => {
    return CorrectiveCalculationService.detectPreventiveRecommendations(interventions);
  }, [interventions]);

  // 1. Create a Demande d'Intervention (DI)
  const addDemandeIntervention = useCallback((data) => {
    const now = new Date();
    const newDi = new CorrectiveIntervention({
      ...data,
      demande_date: data.demande_date || now.toISOString().split('T')[0],
      demande_heure: data.demande_heure || now.toTimeString().slice(0, 5),
      statut: 'DEMANDE',
      action_fermee: 'NON',
      rapport_redige: 'NON',
    }).toJSON();

    setInterventions((prev) => [newDi, ...prev]);
    return newDi;
  }, []);

  // 2. Convert DI to BT (Bon de Travail)
  const convertToBt = useCallback((id, btDetails = {}) => {
    let convertedItem = null;
    setInterventions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const num_bt = btDetails.num_bt || `BT-${Math.floor(1000 + Math.random() * 9000)}`;
          convertedItem = new CorrectiveIntervention({
            ...item,
            ...btDetails,
            num_bt,
            statut: 'EN_COURS',
            date_debut: btDetails.date_debut || new Date().toISOString().split('T')[0],
            heure_debut: btDetails.heure_debut || new Date().toTimeString().slice(0, 5),
          }).toJSON();
          return convertedItem;
        }
        return item;
      })
    );
    return convertedItem;
  }, []);

  // 3. Start Live Intervention (Chronometer)
  const startLiveIntervention = useCallback((id) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = now.toTimeString().slice(0, 5);

    setActiveLiveId(id);
    setInterventions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            statut: 'EN_COURS',
            date_debut: item.date_debut || today,
            heure_debut: item.heure_debut || timeNow,
          };
        }
        return item;
      })
    );
  }, []);

  // 4. Clôturer intervention & optional PDR sortie
  const clotureIntervention = useCallback((id, clotureData = {}, onAddMouvement = null) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = now.toTimeString().slice(0, 5);

    let updated = null;

    setInterventions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const dDebut = item.date_debut || clotureData.date_debut || today;
          const hDebut = item.heure_debut || clotureData.heure_debut || '08:00';
          const dFin = clotureData.date_fin || today;
          const hFin = clotureData.heure_fin || timeNow;

          const timeCalc = CorrectiveCalculationService.calculateWorkingTime(dDebut, hDebut, dFin, hFin);

          updated = new CorrectiveIntervention({
            ...item,
            ...clotureData,
            date_debut: dDebut,
            heure_debut: hDebut,
            date_fin: dFin,
            heure_fin: hFin,
            temps_intervention: timeCalc.formatted,
            temps_intervention_mins: timeCalc.minutes,
            action_fermee: 'OUI',
            statut: 'CLOTURE',
            rapport_redige: 'OUI',
          }).toJSON();

          // Auto-generate PDR Sortie if parts were used
          if (updated.pdr_ref && updated.pdr_quantite > 0) {
            const mvt = {
              ref: updated.pdr_ref,
              type: 'Sortie',
              quantite: updated.pdr_quantite,
              date: dFin,
              machine: updated.code_machine,
              technicien: updated.intervenant || 'Technicien',
              motif: `Intervention corrective BT ${updated.num_bt || updated.id} sur machine ${updated.code_machine}`,
            };

            // Single Write Path via MovementRepository
            try {
              movementRepository.add(mvt);
            } catch (err) {
              console.warn('[useCorrectiveSubState] Failed to add movement via repository:', err);
            }

            if (typeof onAddMouvement === 'function') {
              try {
                onAddMouvement(mvt);
              } catch (e) {
                console.warn('[useCorrectiveSubState] onAddMouvement error:', e);
              }
            }
          }

          return updated;
        }
        return item;
      })
    );

    if (activeLiveId === id) {
      setActiveLiveId(null);
    }

    return updated;
  }, [activeLiveId]);

  // 5. Update intervention partially
  const updateIntervention = useCallback((id, patch = {}) => {
    setInterventions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return new CorrectiveIntervention({ ...item, ...patch }).toJSON();
        }
        return item;
      })
    );
  }, []);

  // 6. Delete intervention
  const deleteIntervention = useCallback((id) => {
    setInterventions((prev) => prev.filter((item) => item.id !== id));
    if (activeLiveId === id) setActiveLiveId(null);
  }, [activeLiveId]);

  // 7. Bulk import (e.g. from Excel)
  const bulkImportInterventions = useCallback((importedItems = []) => {
    if (!Array.isArray(importedItems) || importedItems.length === 0) return;
    const validated = importedItems.map((item) => new CorrectiveIntervention(item).toJSON());
    setInterventions((prev) => [...validated, ...prev]);
  }, []);

  // 8. Reset to baseline seed
  const resetToSeedData = useCallback(async () => {
    const baseline = await loadBaselineCorrectiveData();
    const finalItems = baseline?.interventions && baseline.interventions.length > 0 ? baseline.interventions : initialInterventions;
    setInterventions(finalItems);
    setActiveLiveId(null);
    storageService.setItem(STORAGE_KEY, finalItems);
    storageService.setItem('gmao_corrective_interventions', finalItems);
    storageService.setItem('gmao_corrective_interventions_v3', finalItems);
    await resetCorrectiveActionsToSeed();
  }, [resetCorrectiveActionsToSeed]);

  return {
    interventions,
    setInterventions,
    actionsByPanne,
    setActionsByPanne,
    panneCategories,
    setPanneCategories,
    travauxAFaire,
    setTravauxAFaire,
    intervenants,
    setIntervenants,
    getActionsForPanne,
    addActionForPanne,
    resetCorrectiveActionsToSeed,
    forceSyncAllSeedData,
    activeLiveId,
    setActiveLiveId,
    kpis,
    paretoAnomalies,
    paretoMachines,
    paretoTypes,
    preventiveRecommendations,
    addDemandeIntervention,
    convertToBt,
    startLiveIntervention,
    clotureIntervention,
    updateIntervention,
    deleteIntervention,
    bulkImportInterventions,
    resetToSeedData,
  };
}
