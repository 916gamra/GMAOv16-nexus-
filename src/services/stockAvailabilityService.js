import { StockCalculationService } from '../domain/pdr/services/StockCalculationService.js';

export const stockAvailabilityService = {
  checkAvailability: StockCalculationService.checkAvailability.bind(StockCalculationService)
};
export default stockAvailabilityService;
