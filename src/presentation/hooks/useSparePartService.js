import { useMemo } from 'react';
import { SparePartApplicationService } from '../../application/services/SparePartApplicationService.js';

export function useSparePartService() {
  const service = useMemo(() => new SparePartApplicationService(), []);
  return service;
}
