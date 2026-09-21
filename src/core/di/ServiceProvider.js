import { Container } from './Container.js';
import { CacheService } from '../cache/CacheService.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { AuthService } from '../security/AuthService.js';

import { SparePartRepositoryImpl } from '../../infrastructure/persistence/repositories/SparePartRepositoryImpl.js';
import { SparePartService } from '../../domain/pdr/services/SparePartService.js';

import { MachineRepositoryImpl } from '../../infrastructure/persistence/repositories/MachineRepositoryImpl.js';
import { MachineService } from '../../domain/machines/services/MachineService.js';

import { TaskRepositoryImpl } from '../../infrastructure/persistence/repositories/TaskRepositoryImpl.js';
import { TaskService } from '../../domain/maintenance/services/TaskService.js';

export class ServiceProvider {
  static register() {
    // Core Services
    Container.register('database', () => new DatabaseService(), true);
    Container.register('cache', () => new CacheService(), true);
    Container.register('auth', () => new AuthService(), true);

    // Repositories
    Container.register('sparePartRepository', () => new SparePartRepositoryImpl(), true);
    Container.register('machineRepository', () => new MachineRepositoryImpl(), true);
    Container.register('taskRepository', () => new TaskRepositoryImpl(), true);

    // Domain Services
    Container.register('sparePartService', () => {
      const repository = Container.resolve('sparePartRepository');
      return new SparePartService(repository);
    }, true);
    
    Container.register('machineService', () => {
      const repository = Container.resolve('machineRepository');
      return new MachineService(repository);
    }, true);
    
    Container.register('taskService', () => {
      const repository = Container.resolve('taskRepository');
      return new TaskService(repository);
    }, true);
  }
}


