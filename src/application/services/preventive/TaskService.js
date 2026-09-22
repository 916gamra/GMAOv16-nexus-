export const STORAGE_KEY_TASKS = 'gmao_preventive_tasks_v8';
export const INITIAL_TASKS = [];

export class TaskService {
  static getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TASKS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_TASKS;
  }

  static saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch {
      // storage error
    }
  }

  static deleteTask(taskId) {
    const current = this.getTasks();
    const filtered = current.filter(t => t.id !== taskId);
    this.saveTasks(filtered);
    return filtered;
  }

  static updateTask(taskId, updatedFields) {
    const current = this.getTasks();
    const updated = current.map(t => t.id === taskId ? { ...t, ...updatedFields, updated_at: new Date().toISOString() } : t);
    this.saveTasks(updated);
    return updated;
  }
}

export default TaskService;
