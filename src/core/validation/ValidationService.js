import { z } from 'zod';
import { Logger } from '../logger/LoggerService.js';

/**
 * Validation Service
 * ✅ التحقق من صحة البيانات
 */
export class ValidationService {
  /**
   * Article schema
   */
  static articleSchema = z.object({
    ref: z.string().min(1, 'Ref is required'),
    designation: z.string().min(1, 'Designation is required'),
    id_type: z.string().min(1, 'Type is required'),
    stockInitial: z.number().min(0, 'Stock must be >= 0'),
    minThreshold: z.number().min(0, 'Min threshold must be >= 0'),
    maxThreshold: z.number().min(0, 'Max threshold must be >= 0'),
    unitPrice: z.number().min(0, 'Unit price must be >= 0')
  });

  /**
   * Movement schema
   */
  static movementSchema = z.object({
    ref: z.string().min(1, 'Ref is required'),
    quantite: z.number().min(1, 'Quantity must be > 0'),
    type: z.enum(['Entrée', 'Sortie']),
    date: z.string().min(1, 'Date is required'),
    technicien: z.string().min(1, 'Technician is required')
  });

  /**
   * User schema
   */
  static userSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'RESPONSABLE', 'TECHNICIEN', 'OPERATEUR'])
  });

  /**
   * Validate article
   */
  static validateArticle(data) {
    try {
      const validated = this.articleSchema.parse(data);
      Logger.debug('✅ Article validated', { ref: validated.ref });
      return { isValid: true, data: validated };
    } catch (error) {
      Logger.warn('⚠️ Article validation failed', error.errors);
      return { isValid: false, errors: error.errors };
    }
  }

  /**
   * Validate movement
   */
  static validateMovement(data) {
    try {
      const validated = this.movementSchema.parse(data);
      Logger.debug('✅ Movement validated', { ref: validated.ref });
      return { isValid: true, data: validated };
    } catch (error) {
      Logger.warn('⚠️ Movement validation failed', error.errors);
      return { isValid: false, errors: error.errors };
    }
  }

  /**
   * Validate user
   */
  static validateUser(data) {
    try {
      const validated = this.userSchema.parse(data);
      Logger.debug('✅ User validated', { username: validated.username });
      return { isValid: true, data: validated };
    } catch (error) {
      Logger.warn('⚠️ User validation failed', error.errors);
      return { isValid: false, errors: error.errors };
    }
  }
}
