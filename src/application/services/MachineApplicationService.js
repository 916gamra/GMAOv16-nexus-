import { Container } from '../../core/di/Container.js';
import { MachineMapper } from '../mappers/MachineMapper.js';

export class MachineApplicationService {
  constructor() {
    this.domainService = Container.resolve('machineService');
    this.mapper = new MachineMapper();
  }

  async createMachine(request) {
    const entity = await this.domainService.createMachine(request);
    return this.mapper.toResponse(entity);
  }

  async getMachine(id) {
    const entity = await this.domainService.getMachine(id);
    return this.mapper.toResponse(entity);
  }

  async listMachines(filters = {}) {
    const entities = await this.domainService.listMachines(filters);
    return entities.map(e => this.mapper.toResponse(e));
  }

  async updateMachine(id, request) {
    const entity = await this.domainService.updateMachine(id, request);
    return this.mapper.toResponse(entity);
  }

  async deleteMachine(id) {
    await this.domainService.deleteMachine(id);
  }
}
