import { useState } from 'react';
import { storageService } from '../utils/storageService';
import initialData from '../initialData.json';
import { INITIAL_TECHNICIANS, INITIAL_OPERATIONS } from '../data/seedData';

/**
 * Hook managing Technicians and Operations/Chefs data
 */
export function useUserSubState(groupedState = {}) {
  const [technicians, setTechnicians] = useState(() => {
    const raw =
      groupedState.technicians ||
      storageService.getItem('gmao_technicians') ||
      (initialData.Technicians?.length ? initialData.Technicians : INITIAL_TECHNICIANS);
    if (Array.isArray(raw)) {
      const hasOldDummyTechs = raw.some(
        (t) =>
          (t.id_technician === 'TECH-02' && t.nom === 'Karim') ||
          (t.id_technician === 'TECH-03' && t.nom === 'Yassine') ||
          (t.id_technician === 'TECH-04' && t.nom === 'Amine')
      );
      const hasRealTechs = raw.some(
        (t) => t.nom === 'Rachid' || t.nom === 'Youssef' || t.nom === 'Mhammed' || t.nom === 'Ismail'
      );
      if (hasOldDummyTechs || !hasRealTechs) {
        return INITIAL_TECHNICIANS;
      }
      return raw;
    }
    return INITIAL_TECHNICIANS;
  });

  const [operations, setOperations] = useState(() => {
    const raw =
      groupedState.operations ||
      storageService.getItem('gmao_operations') ||
      (initialData.Operations?.length ? initialData.Operations : INITIAL_OPERATIONS);
    if (Array.isArray(raw)) {
      return raw.filter(
        (o) =>
          !(o.id_operation === 'RESP-03' && String(o.nom || '').toLowerCase().includes('karim')) &&
          !(o.id_operation === 'RESP-04' && String(o.nom || '').toLowerCase().includes('ahmed')) &&
          !(o.id_operation === 'OP-01' && String(o.nom || '').includes('Anas - ZONE-DET')) &&
          !(o.id_operation === 'OP-02' && String(o.nom || '').includes('Maintenance Préventive')) &&
          !(o.id_operation === 'OP-03' && String(o.nom || '').includes('Changement Outils')) &&
          !(o.id_operation === 'OP-04' && String(o.nom || '').includes('Contrôle Niveaux'))
      );
    }
    return INITIAL_OPERATIONS;
  });

  return {
    technicians,
    setTechnicians,
    operations,
    setOperations,
  };
}
