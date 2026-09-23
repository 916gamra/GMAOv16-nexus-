import { z } from 'zod';

export const StockItemSchema = z.object({
  ref: z.string().min(1, 'المرجع مطلوب (Référence obligatoire)'),
  designation: z.string().min(1, 'التسمية مطلوبة (Désignation obligatoire)'),
  id_type: z.string().optional(),
  type: z.string().optional(),
  stockInitial: z
    .number()
    .min(0, 'المخزون الأولي يجب أن يكون موجباً')
    .optional()
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  seuil: z
    .number()
    .min(0, 'الحد الأدنى يجب أن يكون موجباً')
    .optional()
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  emplacement: z.string().optional(),
  id_diag: z.string().optional(),
});

export const MovementSchema = z.object({
  code_bon: z.string().min(1, 'رمز الحركة مطلوب (Code Bon obligatoire)'),
  ref: z.string().min(1, 'المرجع مطلوب (Référence obligatoire)'),
  quantite: z
    .number()
    .positive('الكمية يجب أن تكون موجبة')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  type: z.string().transform((s) => {
    const lower = String(s || '').toLowerCase();
    if (lower.includes('entr') || lower.includes('in')) return 'Entrée';
    return 'Sortie';
  }),
  date: z.string().optional(),
  action_id: z.string().optional(),
  technicien: z.string().optional(),
  id_zone: z.string().optional(),
  id_machine_registered: z.string().optional(),
  operation: z.string().optional(),
});

export const MachineSchema = z.object({
  id_machine_registered: z.string().min(1, 'رمز الماكينة مطلوب'),
  designation: z.string().min(1, 'اسم الماكينة مطلوب'),
  id_family: z.string().optional(),
  id_templates: z.string().optional(),
  status: z.string().optional(),
});

export const validateImportedData = (data) => {
  const errors = {
    stock: [],
    movements: [],
    machines: [],
    general: [],
  };

  try {
    if (!data) {
      errors.general.push('البيانات فارغة');
      return { valid: false, errors };
    }

    if (Array.isArray(data.Stock_Actuel)) {
      data.Stock_Actuel.forEach((item, index) => {
        try {
          StockItemSchema.parse({
            ...item,
            ref: item.ref || item['Référence'] || item['Reference'] || '',
            designation:
              item.designation || item['Désignation'] || item['D\u00c3\u00a9signation'] || '',
          });
        } catch (error) {
          const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
          errors.stock.push({
            row: index + 1,
            message: msg,
          });
        }
      });
    }

    if (Array.isArray(data.Mouvement)) {
      data.Mouvement.forEach((item, index) => {
        try {
          MovementSchema.parse({
            ...item,
            code_bon: item.code_bon || item['Code_Bon'] || item['Code Bon'] || item['N° Bon'] || `BON-${index + 1}`,
            ref: item.ref || item['Référence'] || item['Reference'] || '',
            quantite:
              item.quantite != null
                ? item.quantite
                : item['Quantité'] != null
                  ? item['Quantité']
                  : item['Quantite'],
            type: item.type || item['Type (Entrée/Sortie)'] || 'Sortie',
          });
        } catch (error) {
          const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
          errors.movements.push({
            row: index + 1,
            message: msg,
          });
        }
      });
    }

    if (Array.isArray(data.Machines)) {
      data.Machines.forEach((item, index) => {
        try {
          MachineSchema.parse({
            id_machine_registered: item.id_machine_registered || item.id || item['Code Machine'] || item.code || '',
            designation: item.designation || item.nom || item.name || item['Nom Machine'] || '',
            id_family: item.id_family || item.famille || item.family || '',
            id_templates: item.id_templates || item.modele || item.template || '',
            status: item.status || 'EN_SERVICE',
          });
        } catch (error) {
          const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || error.message;
          errors.machines.push({
            row: index + 1,
            message: msg,
          });
        }
      });
    }

    const valid = Object.values(errors).every((arr) => arr.length === 0);
    return { valid, errors };
  } catch (error) {
    errors.general.push(`خطأ في التحقق: ${error.message}`);
    return { valid: false, errors };
  }
};
