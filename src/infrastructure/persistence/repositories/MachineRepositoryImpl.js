import { IMachineRepository } from '../../../domain/machines/repositories/IMachineRepository.js';
import { MachineEntity } from '../../../domain/machines/entities/MachineEntity.js';
import { DatabaseService } from '../../../core/database/DatabaseService.js';
import { INITIAL_MACHINES_REGISTERED } from '../../../data/seedData.js';
import { Logger } from '../../../core/logger/LoggerService.js';

export class MachineRepositoryImpl extends IMachineRepository {
  constructor() {
    super();
    this.db = new DatabaseService();
    this.storeName = 'machines';
  }

  async create(machine) {
    await this.db.save(this.storeName, machine);
    return machine;
  }

  async findById(id) {
    const row = await this.db.getById(this.storeName, id);
    if (!row) return null;
    return new MachineEntity(row);
  }

  async findAll(filters = {}) {
    let all = await this.db.getAll(this.storeName);
    if (!all || all.length === 0 || all.length < 80 || all.some(item => item.id === 'MCH-001' || item.id_machine_registered === 'MCH-001')) {
      // Auto seed with the full 87 machines
      try {
        for (const m of INITIAL_MACHINES_REGISTERED) {
          const rec = { ...m, id: m.id_machine_registered || m.id };
          await this.db.save(this.storeName, rec);
        }
        all = await this.db.getAll(this.storeName);
      } catch (err) {
        Logger.warn('Failed to seed machines in IndexedDB, using in-memory INITIAL_MACHINES_REGISTERED:', err, 'MachineRepository');
        all = INITIAL_MACHINES_REGISTERED.map(m => ({ ...m, id: m.id_machine_registered || m.id }));
      }
    }
    let filtered = all || [];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        (item.designation || '').toLowerCase().includes(s) || 
        (item.id || item.id_machine_registered || '').toLowerCase().includes(s)
      );
    }
    return filtered.map(row => new MachineEntity(row));
  }

  async update(id, machine) {
    await this.db.save(this.storeName, machine);
    return machine;
  }

  async delete(id) {
    await this.db.delete(this.storeName, id);
  }
}
