/**
 * Batch Processing Service for GMAO Application
 * Processes large arrays or async operations in controlled chunks (batches)
 * to maintain fluid 60fps rendering without freezing UI thread.
 */
export class BatchService {
  /**
   * @param {number} batchSize - Number of items per batch (default: 100)
   * @param {number} delayMs - Delay between batch execution chunks in ms (default: 50ms)
   */
  constructor(batchSize = 100, delayMs = 50) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Add async function/task to processing batch
   * @param {Function} operation - Async operation function
   */
  async addToBatch(operation) {
    this.queue.push(operation);

    if (this.queue.length >= this.batchSize) {
      await this.processBatch();
    }
  }

  /**
   * Process single chunk batch from queue
   */
  async processBatch() {
    if (this.isProcessing || this.queue.length === 0) return [];

    this.isProcessing = true;

    try {
      const batch = this.queue.splice(0, this.batchSize);
      console.log(`🔄 Processing batch chunk of ${batch.length} operations...`);

      const results = await Promise.all(
        batch.map((op) => {
          try {
            return typeof op === 'function' ? op() : op;
          } catch (err) {
            console.error('⚠️ Operation in batch failed:', err);
            return null;
          }
        })
      );

      console.log('✅ Batch chunk processed successfully');
      return results;
    } catch (error) {
      console.error('❌ Batch chunk processing error:', error);
      throw error;
    } finally {
      this.isProcessing = false;

      if (this.queue.length > 0) {
        setTimeout(() => {
          this.processBatch();
        }, this.delayMs);
      }
    }
  }

  /**
   * Helper utility to process any large array in batches with optional progress callback
   * @param {Array} items - Array of items to process
   * @param {Function} processFn - Async function per item (item, index) => Promise
   * @param {number} [batchSize] - Batch chunk size
   * @param {Function} [onProgress] - Optional progress callback (completed, total) => void
   */
  static async processArrayInBatches(items = [], processFn, batchSize = 100, onProgress = null) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const results = [];
    const total = items.length;

    for (let i = 0; i < total; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      const chunkResults = await Promise.all(
        chunk.map((item, idx) => processFn(item, i + idx))
      );
      results.push(...chunkResults);

      if (onProgress) {
        onProgress(Math.min(i + batchSize, total), total);
      }

      // Yield event loop briefly
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    return results;
  }

  /**
   * Flush and process all remaining items in queue
   */
  async flush() {
    const allResults = [];
    while (this.queue.length > 0) {
      const res = await this.processBatch();
      if (Array.isArray(res)) {
        allResults.push(...res);
      }
    }
    return allResults;
  }
}

export default BatchService;
