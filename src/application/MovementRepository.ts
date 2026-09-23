import { stockIndexStore } from './StockIndexStore';
import type { MovementDelta } from './IncrementalStockIndex';
import { storageService } from '../utils/storageService';
import { TaskApplicationService } from './services/TaskApplicationService';

export interface MovementEntity {
  id?: string | number;
  code_bon?: string;
  ref: string;
  quantite: number | string;
  type: string;
  date?: string;
  technicien?: string;
  id_zone?: string;
  id_machine_registered?: string;
  operation?: string;
}

const channel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('gmao_cache_sync')
    : null;

export class MovementRepository {
  private static channelBound = false;

  constructor() {
    if (!MovementRepository.channelBound && channel) {
      channel.addEventListener('message', this.onRemoteDelta);
      MovementRepository.channelBound = true;
    }
  }

  dispose(): void {
    if (MovementRepository.channelBound && channel) {
      channel.removeEventListener('message', this.onRemoteDelta);
      MovementRepository.channelBound = false;
    }
  }

  add(m: MovementEntity): void {
    const delta: MovementDelta = {
      ref: m.ref,
      type: m.type,
      quantity: Number(m.quantite) || 0,
    };
    stockIndexStore.index.applyDelta(delta);
    stockIndexStore.notifyRef(m.ref);
    stockIndexStore.notifyAll();

    channel?.postMessage({
      kind: 'DELTA',
      ref: m.ref,
      type: m.type,
      qty: delta.quantity,
      sign: 1,
    });
  }

  edit(oldM: MovementEntity, newM: MovementEntity): void {
    stockIndexStore.index.updateDelta({
      ref: oldM.ref,
      oldType: oldM.type,
      oldQty: Number(oldM.quantite) || 0,
      newType: newM.type,
      newQty: Number(newM.quantite) || 0,
    });

    stockIndexStore.notifyRef(oldM.ref);
    if (oldM.ref !== newM.ref) {
      stockIndexStore.notifyRef(newM.ref);
    }
    stockIndexStore.notifyAll();

    channel?.postMessage({
      kind: 'UPDATE',
      ref: oldM.ref,
      oldType: oldM.type,
      oldQty: Number(oldM.quantite) || 0,
      newType: newM.type,
      newQty: Number(newM.quantite) || 0,
    });
  }

  remove(m: MovementEntity): void {
    const delta: MovementDelta = {
      ref: m.ref,
      type: m.type,
      quantity: Number(m.quantite) || 0,
    };
    stockIndexStore.index.rollbackDelta(delta);
    stockIndexStore.notifyRef(m.ref);
    stockIndexStore.notifyAll();

    channel?.postMessage({
      kind: 'DELTA',
      ref: m.ref,
      type: m.type,
      qty: delta.quantity,
      sign: -1,
    });
  }

  bulkReplace(movements: MovementEntity[], initialStocks?: Map<string, number>): void {
    const deltas: MovementDelta[] = movements.map((m) => ({
      ref: m.ref,
      type: m.type,
      quantity: Number(m.quantite) || 0,
    }));
    stockIndexStore.index.rebuild(deltas, initialStocks);
    stockIndexStore.markHydrated();
    stockIndexStore.notifyAll();

    channel?.postMessage({ kind: 'REBUILD' });
  }

  private onRemoteDelta = async (e: MessageEvent) => {
    const msg = e.data;
    if (!msg) return;

    if (msg.kind === 'DELTA') {
      stockIndexStore.index.applyDelta({
        ref: msg.ref,
        type: msg.type,
        quantity: msg.qty * msg.sign,
      });
      stockIndexStore.notifyRef(msg.ref);
      stockIndexStore.notifyAll();
    } else if (msg.kind === 'UPDATE') {
      stockIndexStore.index.updateDelta(msg);
      stockIndexStore.notifyRef(msg.ref);
      stockIndexStore.notifyAll();
    } else if (msg.kind === 'REBUILD') {
      try {
        const taskService = new TaskApplicationService();
        const idbTasks = await taskService.listTasks();
        const savedMovements = idbTasks && idbTasks.length > 0 ? idbTasks : (storageService.getItem('gmao_mouvements') || []);
        const deltas: MovementDelta[] = savedMovements.map((m: any) => ({
          ref: m.ref || m['Référence'] || '',
          type: m.type || m['Type (Entrée/Sortie)'] || '',
          quantity: Number(m.quantite != null ? m.quantite : m['Quantité']) || 0,
        }));
        stockIndexStore.index.rebuild(deltas);
        stockIndexStore.notifyAll();
      } catch (err) {
        console.error('[MovementRepository] Failed to handle remote REBUILD message:', err);
      }
    }
  };
}

export const movementRepository = new MovementRepository();
