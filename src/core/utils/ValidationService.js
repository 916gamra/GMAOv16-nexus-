import { z } from 'zod';

/**
 * مخططات Validation لمختلف الكيانات
 */
export const Schemas = {
  // مخطط لعنصر المخزون
  StockItem: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    ref: z.string().min(1, { message: "REF هو حقل إجباري" }),
    designation: z.string().min(1, { message: "التصنيف هو حقل إجباري" }),
    id_type: z.string().optional(),
    type: z.string().optional(),
    stockInitial: z.union([z.number(), z.string()]).transform(val => Number(val) || 0),
    stockActuel: z.union([z.number(), z.string()]).transform(val => Number(val) || 0).optional(),
    seuil: z.union([z.number(), z.string()]).transform(val => Number(val) || 0).optional(),
    emplacement: z.string().optional(),
    id_diag: z.string().optional()
  }),

  // مخطط لآلة
  Machine: z.object({
    id: z.string().optional(),
    id_machine_registered: z.string().min(1, { message: "رقم التسجيل إجباري" }),
    designation: z.string().min(1, { message: "الاسم إجباري" }),
    id_family: z.string().optional(),
    id_templates: z.string().optional(),
    id_blueprint: z.string().optional(),
    id_zone_default: z.string().optional(),
    technician: z.string().optional(),
    status: z.enum(['En service', 'En maintenance', 'Arrêt', '']).optional()
  }),

  // مخطط لمنطقة
  Zone: z.object({
    id_zone: z.string().min(1, { message: "رمز المنطقة إجباري" }),
    code: z.string().optional(),
    libelle: z.string().min(1, { message: "الاسم إجباري" }),
    philosophie: z.string().optional()
  }),

  // مخطط لحركة المخزون
  Movement: z.object({
    id: z.string().optional(),
    code_bon: z.string().min(1, { message: "رمز البون إجباري" }),
    date: z.string().min(1, { message: "التاريخ إجباري" }),
    ref: z.string().min(1, { message: "المرجع إجباري" }),
    designation: z.string().optional(),
    quantite: z.union([z.number(), z.string()]).transform(val => Number(val) || 0),
    type: z.enum(['Entrée', 'Sortie', 'Sortie Interne', 'Sortie Externe', 'Bon de sortie']),
    action_id: z.string().optional(),
    id_machine_registered: z.string().optional()
  })
};

/**
 * خدمة التحقق من البيانات
 */
export class ValidationService {
  /**
   * التحقق من البيانات باستخدام مخطط Zod
   * @param {Object} data - البيانات
   * @param {z.ZodSchema} schema - مخطط Zod
   * @returns {Object} { success: boolean, data?: any, error?: string }
   */
  static validate(data, schema) {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        }).join(', ');
        return { success: false, error: errorMessages };
      }
      return { success: false, error: 'خطأ غير متوقع في التحقق' };
    }
  }

  /**
   * التحقق من قائمة بيانات
   */
  static validateArray(dataArray, schema) {
    const errors = [];
    const validData = [];

    dataArray.forEach((data, index) => {
      const result = this.validate(data, schema);
      if (result.success) {
        validData.push(result.data);
      } else {
        errors.push({ index, error: result.error });
      }
    });

    return {
      success: errors.length === 0,
      validData,
      errors
    };
  }

  /**
   * التحقق من بيانات المخزون
   */
  static validateStockItem(data) {
    return this.validate(data, Schemas.StockItem);
  }

  /**
   * التحقق من بيانات الآلة
   */
  static validateMachine(data) {
    return this.validate(data, Schemas.Machine);
  }

  /**
   * التحقق من بيانات الحركة
   */
  static validateMovement(data) {
    return this.validate(data, Schemas.Movement);
  }
}

export default ValidationService;
