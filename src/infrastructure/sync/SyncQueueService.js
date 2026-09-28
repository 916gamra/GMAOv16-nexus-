import { Logger } from '../../core/logger/LoggerService';

/**
 * Sync Queue Service
 * ✅ إدارة طابور المزامنة دون اتصال (Offline-first sync queue) مع إعادة المحاولة التلقائية
 */
export class SyncQueueService {
  constructor() {
    this.queue = [];
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.setupListeners();
    this.loadQueueFromStorage();
  }

  setupListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      Logger.info('[SyncQueueService] Online - Processing sync queue');
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      Logger.info('[SyncQueueService] Offline - Queue paused');
      this.isOnline = false;
    });
  }

  async addToQueue(operation) {
    const queueItem = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      operation,
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: this.maxRetries,
      status: 'PENDING'
    };

    this.queue.push(queueItem);
    this.saveQueueToStorage();

    if (this.isOnline) {
      await this.processQueue();
    }

    return queueItem.id;
  }

  async processQueue() {
    if (this.queue.length === 0 || !this.isOnline) return;

    while (this.queue.length > 0 && this.isOnline) {
      const item = this.queue[0];

      try {
        item.status = 'PROCESSING';
        await this.executeOperation(item.operation);
        item.status = 'SUCCESS';
        this.queue.shift();
        this.saveQueueToStorage();
      } catch (error) {
        item.retries++;
        if (item.retries >= item.maxRetries) {
          item.status = 'FAILED';
          Logger.error(`[SyncQueueService] Operation failed after ${item.maxRetries} retries`, error);
          this.queue.shift();
        } else {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * item.retries));
        }
        this.saveQueueToStorage();
      }
    }
  }

  async executeOperation(_operation) {
    // Execute business operation sync
    return true;
  }

  saveQueueToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gmao_sync_queue', JSON.stringify(this.queue));
      }
    } catch (error) {
      Logger.error('[SyncQueueService] Failed to save queue:', error);
    }
  }

  loadQueueFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('gmao_sync_queue');
        if (saved) {
          this.queue = JSON.parse(saved);
        }
      }
    } catch (error) {
      Logger.error('[SyncQueueService] Failed to load queue:', error);
    }
  }

  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      pendingItems: this.queue.filter(i => i.status === 'PENDING').length,
      failedItems: this.queue.filter(i => i.status === 'FAILED').length,
      items: this.queue
    };
  }
}

export default new SyncQueueService();
