import { describe, it, expect } from 'vitest';
import { ValidationService } from '@/domain/validators/index.js';

describe('Validation Service & Schemas Unit Tests', () => {
  it('يجب التحقق من صحة بيانات الآلة الصالحة', () => {
    const validMachine = {
      id: 'M01',
      name: 'Extrudeuse 01',
      zone: 'Zone A',
      family: 'Extrusion',
      template: 'TPL-EXT',
      status: 'EN_SERVICE',
    };

    const res = ValidationService.validateMachine(validMachine);
    expect(res.valid).toBe(true);
    expect(res.data.name).toBe('Extrudeuse 01');
  });

  it('يجب رفض الآلة عند نقص حقل إلزامي', () => {
    const invalidMachine = {
      id: '',
      name: '',
      zone: 'Zone A',
    };

    const res = ValidationService.validateMachine(invalidMachine);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('يجب التحقق من عنصر المخزون الصحيح', () => {
    const validStock = {
      code: 'PDR-001',
      designation: 'Roulement 6204',
      quantity: 15,
      minStock: 5,
      unit: 'U',
    };

    const res = ValidationService.validateStockItem(validStock);
    expect(res.valid).toBe(true);
  });

  it('يجب رفض عنصر المخزون ذو الكمية السالبة', () => {
    const invalidStock = {
      code: 'PDR-002',
      designation: 'Courroie B52',
      quantity: -5,
      minStock: 2,
    };

    const res = ValidationService.validateStockItem(invalidStock);
    expect(res.valid).toBe(false);
  });

  it('يجب التحقق من حركة المخزون الصحيحة', () => {
    const validMouvement = {
      date: new Date().toISOString(),
      type: 'OUT',
      quantity: 2,
      stockCode: 'PDR-001',
      user: 'Technicien 1',
    };

    const res = ValidationService.validateMouvement(validMouvement);
    expect(res.valid).toBe(true);
  });

  it('يجب التحقق من الملفات المستوردة المجمعة وتحديد الأخطاء', () => {
    const importData = {
      machines: [
        { id: 'M1', name: 'Presse 1', zone: 'Z1', family: 'F1', template: 'T1' },
        { id: '', name: '', zone: '' }, // Error
      ],
      stockItems: [
        { code: 'IT1', designation: 'Moteur', quantity: 2, minStock: 1 },
      ],
    };

    const res = ValidationService.validateImportedData(importData);
    expect(res.valid).toBe(false);
    expect(res.results.machines.errors.length).toBe(1);
    expect(res.results.stockItems.valid).toBe(true);
  });
});
