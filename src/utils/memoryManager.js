/**
 * Memory Manager for checking storage quotas and memory usage
 */
export class MemoryManager {
  static getLocalStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += ((localStorage[key].length + key.length) * 2);
      }
    }
    return {
      usedBytes: total,
      usedMb: (total / (1024 * 1024)).toFixed(2),
    };
  }
}
