import { SecurityService } from '../core/security/SecurityService.js';
import { Logger } from '../core/logger/LoggerService.js';

/**
 * Storage Service
 * ✅ تخزين البيانات بشكل آمن
 */
export class StorageService {
  /**
   * Set encrypted value in localStorage
   */
  static setEncrypted(key, value) {
    try {
      const encrypted = SecurityService.encrypt(value);
      localStorage.setItem(key, encrypted);
      Logger.debug('💾 Encrypted value stored', { key });
    } catch (error) {
      Logger.error('❌ Failed to store encrypted value', error);
    }
  }

  /**
   * Get decrypted value from localStorage
   */
  static getDecrypted(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = SecurityService.decrypt(encrypted);
      Logger.debug('✅ Decrypted value retrieved', { key });
      return decrypted;
    } catch (error) {
      Logger.error('❌ Failed to retrieve decrypted value', error);
      return null;
    }
  }

  /**
   * Set plain value in localStorage
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      Logger.debug('💾 Value stored', { key });
    } catch (error) {
      Logger.error('❌ Failed to store value', error);
    }
  }

  /**
   * Get plain value from localStorage
   */
  static get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      Logger.error('❌ Failed to retrieve value', error);
      return null;
    }
  }

  /**
   * Remove value from localStorage
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      Logger.debug('🗑️ Value removed', { key });
    } catch (error) {
      Logger.error('❌ Failed to remove value', error);
    }
  }

  /**
   * Clear all localStorage
   */
  static clear() {
    try {
      localStorage.clear();
      Logger.info('🧹 localStorage cleared');
    } catch (error) {
      Logger.error('❌ Failed to clear localStorage', error);
    }
  }
}
