import { Logger } from '../core/logger/LoggerService.js';

/**
 * خدمة قائمة الانتظار للمزامنة
 * تدير العمليات المعلقة عند العمل offline مع حل النزاعات (Conflict Resolution)
 */

export class SyncQueueService {
  constructor() {
    this.queue = [];
    this.syncing = false;
    this.listeners = [];
    this._loadQueue();
  }

  /**
   * إضافة عملية إلى قائمة الانتظار
   */
  enqueue(operation) {
    const queueItem = {
      id: this._generateId(),
      timestamp: Date.now(),
      operation,
      status: 'PENDING',
      retries: 0,
      maxRetries: 3
    };

    this.queue.push(queueItem);
    this._persistQueue();
    this._notifyListeners();

    return queueItem;
  }

  /**
   * الحصول على قائمة الانتظار
   */
  getQueue() {
    return this.queue;
  }

  /**
   * مزامنة جميع العمليات المعلقة
   */
  async syncAll() {
    if (this.syncing || this.queue.length === 0) {
      return { success: true, synced: 0 };
    }

    this.syncing = true;
    let synced = 0;
    const failed = [];

    for (const item of this.queue) {
      if (item.status === 'SYNCED') continue;

      try {
        await this._syncItem(item);
        item.status = 'SYNCED';
        synced++;
      } catch {
        item.retries++;

        if (item.retries >= item.maxRetries) {
          item.status = 'FAILED';
          failed.push(item);
        } else {
          item.status = 'PENDING';
        }
      }
    }

    this.queue = this.queue.filter(item => item.status !== 'SYNCED');
    this._persistQueue();
    this.syncing = false;
    this._notifyListeners();

    return { success: failed.length === 0, synced, failed };
  }

  /**
   * الاستماع للتغييرات
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // ==================== Private Methods ====================

  async _syncItem(item) {
    const { operation } = item;

    // Fetch from simulated server or storage
    const serverData = await this._fetchFromServer(operation.id || operation.data?.id);
    const conflict = this._detectConflict(operation.data, serverData);

    let resolvedData = operation.data;
    if (conflict) {
      resolvedData = this._resolveConflict(
        operation.data,
        serverData,
        operation.strategy || 'LAST_WRITE_WINS'
      );
    }

    await this._updateServer(resolvedData);
  }

  _detectConflict(local, server) {
    if (!local || !server) return false;
    const localHash = this._hashObject(local);
    const serverHash = this._hashObject(server);
    return localHash !== serverHash;
  }

  _resolveConflict(local, server, strategy) {
    switch (strategy) {
      case 'LAST_WRITE_WINS':
        return (local.timestamp || 0) > (server.timestamp || 0) ? local : server;
      case 'LOCAL_WINS':
        return local;
      case 'SERVER_WINS':
        return server;
      default:
        return local;
    }
  }

  async _fetchFromServer(id) {
    try {
      const data = JSON.parse(localStorage.getItem('gmao_light_data') || '{}');
      if (!id) return null;
      const foundArticle = (data.articles || []).find(a => a.id === id || a.ref === id);
      return foundArticle || null;
    } catch {
      return null;
    }
  }

  async _updateServer(data) {
    try {
      const stored = JSON.parse(localStorage.getItem('gmao_light_data') || '{}');
      stored.articles = stored.articles || [];
      const index = stored.articles.findIndex(a => a.id === data.id || a.ref === data.ref);
      if (index >= 0) {
        stored.articles[index] = data;
      } else {
        stored.articles.push(data);
      }
      localStorage.setItem('gmao_light_data', JSON.stringify(stored));
      return data;
    } catch (error) {
      Logger.error('Error updating server storage:', error, 'SyncQueue');
      throw error;
    }
  }

  _persistQueue() {
    try {
      localStorage.setItem('sync_queue', JSON.stringify(this.queue));
    } catch (error) {
      Logger.error('Error persisting queue:', error, 'SyncQueue');
    }
  }

  _loadQueue() {
    try {
      const data = localStorage.getItem('sync_queue');
      this.queue = data ? JSON.parse(data) : [];
    } catch (error) {
      Logger.error('Error loading queue:', error, 'SyncQueue');
      this.queue = [];
    }
  }

  _generateId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _hashObject(obj) {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  _notifyListeners() {
    for (const listener of this.listeners) {
      listener({
        queueSize: this.queue.length,
        pending: this.queue.filter(item => item.status === 'PENDING').length,
        syncing: this.syncing
      });
    }
  }
}

export default SyncQueueService;
