import { useState } from 'react';
import { storageService } from '../utils/storageService';
import initialTechnicians from '../data/users/seedTechnicians.json';
import initialOperations from '../data/users/seedOperations.json';

/**
 * Hook managing Technicians and Operations/Chefs data
 * Implements Dedicated Clean Seed Architecture (Standard Corrective Pattern)
 */
export function useUserSubState(groupedState = {}) {
  const [technicians, setTechnicians] = useState(() => {
    if (groupedState.technicians && Array.isArray(groupedState.technicians) && groupedState.technicians.length > 0) {
      return groupedState.technicians;
    }
    const raw = storageService.getItem('gmao_technicians_v2') || storageService.getItem('gmao_technicians');
    if (Array.isArray(raw) && raw.length > 0) {
      return raw;
    }
    return initialTechnicians;
  });

  const [operations, setOperations] = useState(() => {
    if (groupedState.operations && Array.isArray(groupedState.operations) && groupedState.operations.length > 0) {
      return groupedState.operations;
    }
    const raw = storageService.getItem('gmao_operations_v2') || storageService.getItem('gmao_operations');
    if (Array.isArray(raw) && raw.length > 0) {
      return raw;
    }
    return initialOperations;
  });

  return {
    technicians,
    setTechnicians,
    operations,
    setOperations,
  };
}

