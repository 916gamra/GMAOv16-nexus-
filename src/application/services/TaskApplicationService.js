import { Container } from '../../core/di/Container.js';
import { TaskMapper } from '../mappers/TaskMapper.js';

export class TaskApplicationService {
  constructor() {
    this.domainService = Container.resolve('taskService');
    this.mapper = new TaskMapper();
  }

  async createTask(request) {
    const entity = await this.domainService.createTask(request);
    return this.mapper.toResponse(entity);
  }

  async getTask(id) {
    const entity = await this.domainService.getTask(id);
    return this.mapper.toResponse(entity);
  }

  async listTasks(filters = {}) {
    const entities = await this.domainService.listTasks(filters);
    return entities.map(e => this.mapper.toResponse(e));
  }

  async updateTask(id, request) {
    const entity = await this.domainService.updateTask(id, request);
    return this.mapper.toResponse(entity);
  }

  async deleteTask(id) {
    await this.domainService.deleteTask(id);
  }
}
