import { ValidationError } from '../../infrastructure/errors/AppError';

/**
 * Validation Service
 * ✅ التحقق الشامل من صحة الكيانات الصناعية
 */
export class ValidationService {
  static validateStockItem(data) {
    if (!data || !data.ref || !data.designation) {
      throw new ValidationError('Invalid stock item: missing ref or designation', [
        { field: 'ref/designation', message: 'Reference and designation are required' }
      ]);
    }
    return true;
  }

  static validateMovement(data) {
    if (!data || !data.ref || !data.quantite || !data.type) {
      throw new ValidationError('Invalid movement: missing ref, quantity, or type', [
        { field: 'movement', message: 'Reference, quantity, and type are required' }
      ]);
    }
    const qty = Number(data.quantite);
    if (isNaN(qty) || qty <= 0) {
      throw new ValidationError('Invalid movement quantity', [
        { field: 'quantite', message: 'Quantity must be greater than 0' }
      ]);
    }
    return true;
  }
}

export default ValidationService;
