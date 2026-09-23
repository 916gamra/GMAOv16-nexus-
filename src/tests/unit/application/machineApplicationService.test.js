import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MachineApplicationService } from '@/application/services/MachineApplicationService.js';
import { Container } from '@/core/di/Container.js';

describe('Machine Application Service Unit Tests', () => {
  let mockDomainService;

  beforeEach(() => {
    mockDomainService = {
      createMachine: vi.fn().mockImplementation(async (data) => ({
        id: data.id || 'M-01',
        nom: data.nom || 'Machine 1',
        zone: data.zone || 'Zone A',
        famille: data.famille || 'Family 1',
        modele: data.modele || 'Model 1',
        status: 'EN_SERVICE',
      })),
      getMachine: vi.fn().mockImplementation(async (id) => ({
        id,
        nom: 'Machine 1',
        zone: 'Zone A',
        status: 'EN_SERVICE',
      })),
      listMachines: vi.fn().mockResolvedValue([
        { id: 'M-01', nom: 'Presse 01', zone: 'Zone A', status: 'EN_SERVICE' },
        { id: 'M-02', nom: 'Extrudeuse 02', zone: 'Zone B', status: 'MAINTENANCE' },
      ]),
      updateMachine: vi.fn().mockImplementation(async (id, data) => ({
        id,
        ...data,
      })),
      deleteMachine: vi.fn().mockResolvedValue(true),
    };

    Container.register('machineService', mockDomainService);
  });

  it('يجب إنشاء آلة جديدة بنجاح وتعيين بياناتها', async () => {
    const service = new MachineApplicationService();
    const result = await service.createMachine({
      id: 'M-01',
      nom: 'Ligne 1',
      zone: 'Zone Nord',
    });

    expect(result).toBeDefined();
    expect(mockDomainService.createMachine).toHaveBeenCalled();
  });

  it('يجب سرد الآلات وتصفيتها بشكل سليم', async () => {
    const service = new MachineApplicationService();
    const machines = await service.listMachines();

    expect(Array.isArray(machines)).toBe(true);
    expect(machines.length).toBe(2);
  });
});
