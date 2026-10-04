
import { syncQueueService } from '../../services/syncQueueService';

describe('SyncQueueService Integration', () => {
  let syncQueue;

  beforeEach(async () => {
    syncQueue = syncQueueService;
    await syncQueue.init();
    await syncQueue.clearQueue(); // Start with a clean queue
    syncQueue.isOnline = false;   // Force offline state so tasks accumulate in the queue
  });

  it('should add an item to the queue and retrieve it', async () => {
    const mockTask = { id: 1, action: 'CREATE_DI', data: { id: 'DI-001' } };
    
    // Use 'add' method as per service definition
    await syncQueue.add(mockTask); 
    
    const queue = await syncQueue.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].operation.action).toBe('CREATE_DI');
  });

  it('should process the queue when online', async () => {
    const mockTask = { id: 2, action: 'UPDATE_STOCK', data: { ref: 'A' } };
    await syncQueue.add(mockTask);

    const queueBefore = await syncQueue.getQueue();
    expect(queueBefore.length).toBe(1);

    // Turn online and process
    syncQueue.isOnline = true;
    await syncQueue.processQueue();

    const queueAfter = await syncQueue.getQueue();
    expect(queueAfter.length).toBe(0); // Should be empty after successful processing
  });
});
