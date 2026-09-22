import { z } from 'zod';
import { Logger } from '../logger/LoggerService.js';

/**
 * Validation Service
 * ✅ التحقق الشامل والصارم من صحة البيانات لجميع الكيانات
 */
export class ValidationService {
  /**
   * Article / StockItem schema
   * متوافق 100% مع معايير Excel Twin و GMAO
   */
  static stockItemSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    id_article: z.union([z.string(), z.number()]).optional(),
    ref: z.string().min(1, 'REF is required'),
    designation: z.string().min(1, 'Designation is required'),
    id_type: z.string().optional(),
    type: z.string().optional(),
    stockInitial: z.union([z.number(), z.string()]).transform(val => Number(val) || 0),
    stockActuel: z.union([z.number(), z.string()]).transform(val => Number(val) || 0).optional(),
    seuil: z.union([z.number(), z.string()]).transform(val => Number(val) || 0).optional(),
    minThreshold: z.union([z.number(), z.string()]).transform(val => Number(val) || 0).optional(),
    maxThreshold: z.union([z.number(), z.string()]).transform(val => Number(val) || 0).optional(),
    unitPrice: z.union([z.number(), z.string()]).transform(val => Number(val) || 0).optional(),
    emplacement: z.string().optional(),
    id_diag: z.string().optional(),
    alerte: z.string().optional()
  });

  // التوافق مع الاسم السابق
  static articleSchema = this.stockItemSchema;

  /**
   * Machine schema
   */
  static machineSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    id_machine_registered: z.string().min(1, 'Machine ID is required'),
    designation: z.string().min(1, 'Designation is required'),
    id_family: z.string().optional(),
    id_templates: z.string().optional(),
    id_blueprint: z.string().optional(),
    id_zone_default: z.string().optional(),
    technician: z.string().optional(),
    status: z.enum(['En service', 'En maintenance', 'Arrêt', '']).optional()
  });

  /**
   * Zone schema
   */
  static zoneSchema = z.object({
    id_zone: z.string().min(1, 'Zone ID is required'),
    code: z.string().optional(),
    libelle: z.string().min(1, 'Name is required'),
    philosophie: z.string().optional()
  });

  /**
   * Movement schema
   */
  static movementSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    code_bon: z.string().optional(),
    ref: z.string().min(1, 'Ref is required'),
    designation: z.string().optional(),
    quantite: z.union([z.number(), z.string()]).transform(val => Number(val) || 0),
    type: z.enum(['Entrée', 'Sortie', 'Sortie Interne', 'Sortie Externe', 'Bon de sortie']),
    date: z.string().min(1, 'Date is required'),
    technicien: z.string().optional(),
    action_id: z.string().optional(),
    id_machine_registered: z.string().optional(),
    id_zone: z.string().optional(),
    usage_type: z.string().optional()
  });

  /**
   * User schema
   */
  static userSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email').optional(),
    password: z.string().min(4, 'Password must be at least 4 characters').optional(),
    role: z.enum(['ADMIN', 'RESPONSABLE', 'TECHNICIEN', 'OPERATEUR', 'admin', 'responsable', 'technicien', 'operateur'])
  });

  /**
   * Generic validator
   */
  static validate(data, schema) {
    try {
      const validated = schema.parse(data);
      return { success: true, isValid: true, data: validated };
    } catch (error) {
      const errorMessages = error.errors ? error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ') : error.message;
      Logger.warn('⚠️ Validation failed', { error: errorMessages });
      return { success: false, isValid: false, errors: error.errors, error: errorMessages };
    }
  }

  /**
   * Validate Array of items
   */
  static validateArray(dataArray, schema) {
    if (!Array.isArray(dataArray)) {
      return { success: false, validData: [], errors: [{ error: 'Input is not an array' }] };
    }

    const errors = [];
    const validData = [];

    dataArray.forEach((data, index) => {
      const result = this.validate(data, schema);
      if (result.success) {
        validData.push(result.data);
      } else {
        errors.push({ index, error: result.error, errors: result.errors });
      }
    });

    return {
      success: errors.length === 0,
      validData,
      errors
    };
  }

  /**
   * Validate Stock Item
   */
  static validateStockItem(data) {
    return this.validate(data, this.stockItemSchema);
  }

  /**
   * Validate Article
   */
  static validateArticle(data) {
    return this.validate(data, this.stockItemSchema);
  }

  /**
   * Validate Movement
   */
  static validateMovement(data) {
    return this.validate(data, this.movementSchema);
  }

  /**
   * Validate Machine
   */
  static validateMachine(data) {
    return this.validate(data, this.machineSchema);
  }

  /**
   * Validate Zone
   */
  static validateZone(data) {
    return this.validate(data, this.zoneSchema);
  }

  /**
   * Validate User
   */
  static validateUser(data) {
    return this.validate(data, this.userSchema);
  }
}

export default ValidationService;
