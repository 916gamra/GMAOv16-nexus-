import { useState, useEffect, useCallback, useMemo } from 'react';
import { storageService } from '../utils/storageService';
import initialSeed from '../data/corrective/seedCorrectiveInterventions.json';
import { CorrectiveIntervention } from '../domain/corrective/entities/CorrectiveIntervention';
import { CorrectiveCalculationService } from '../domain/corrective/services/CorrectiveCalculationService';
import { movementRepository } from '../application/MovementRepository';

const STORAGE_KEY = 'gmao_corrective_interventions';
const ACTIVE_LIVE_KEY = 'gmao_corrective_active_live';

export function useCorrectiveSubState() {
  const [interventions, setInterventions] = useState(() => {
    try {
      const saved = storageService.getItem(STORAGE_KEY);
      if (Array.isArray(saved) && saved.length > 0) {
        return saved;
      }
      return initialSeed || [];
    } catch {
      return initialSeed || [];
    }
  });

  const [activeLiveId, setActiveLiveId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_LIVE_KEY) || null;
    } catch {
      return null;
    }
  });

  // Save to persistent storage
  useEffect(() => {
    try {
      storageService.setItem(STORAGE_KEY, interventions);
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
  const resetToSeedData = useCallback(() => {
    setInterventions(initialSeed || []);
    setActiveLiveId(null);
    storageService.setItem(STORAGE_KEY, initialSeed || []);
  }, []);

  return {
    interventions,
    setInterventions,
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
