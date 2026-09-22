import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import { Logger } from '../core/logger/LoggerService.js';

const DEFAULT_SECRET_KEY = 'GMAO_SECURE_KEY';

/**
 * Security Service for Hashing, Encryption and Local Storage protection
 */
export class SecurityService {
  /**
   * Encrypt object/string data to secure string format
   * @param {any} data - Raw data to encrypt
   * @param {string} [secretKey] - Optional encryption key
   * @returns {string} Encrypted string payload
   */
  static encrypt(data, secretKey = DEFAULT_SECRET_KEY) {
    try {
      if (data === undefined || data === null) return '';
      return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
    } catch (e) {
      // Fallback to safe base64 encoding if AES fails
      try {
        return btoa(JSON.stringify(data));
      } catch {
        Logger.error('Encryption error:', e, 'SecurityService');
        return '';
      }
    }
  }

  /**
   * Decrypt encrypted string payload back to original object/value
   * @param {string} encrypted - Encrypted string payload
   * @param {string} [secretKey] - Optional encryption key
   * @returns {any} Decrypted data object or null if invalid
   */
  static decrypt(encrypted, secretKey = DEFAULT_SECRET_KEY) {
    if (!encrypted) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedData) {
        return JSON.parse(decryptedData);
      }
    } catch {
      // Fallback base64 decode attempt
      try {
        return JSON.parse(atob(encrypted));
      } catch (err) {
        Logger.error('Failed to decrypt data:', err, 'SecurityService');
        return null;
      }
    }
    return null;
  }

  /**
   * Save encrypted item safely to localStorage
   * @param {string} key - Storage key name
   * @param {any} data - Value object/data to store securely
   */
  static saveSecure(key, data) {
    try {
      const encrypted = this.encrypt(data);
      localStorage.setItem(key, encrypted);
      Logger.debug(`✅ Data saved securely under key: ${key}`);
    } catch (error) {
      Logger.error(`❌ Failed to save secure item: ${key}`, error);
    }
  }

  /**
   * Retrieve and decrypt item safely from localStorage
   * @param {string} key - Storage key name
   * @returns {any} Decrypted payload or null
   */
  static getSecure(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return this.decrypt(encrypted);
    } catch (error) {
      Logger.error(`❌ Failed to get secure item for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Hash PIN code securely using bcrypt
   * @param {string} pin
   * @returns {string} Hashed PIN string
   */
  static hashPin(pin) {
    if (!pin) return '';
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(pin, salt);
  }

  /**
   * Verify plain text PIN against stored hash or plain PIN
   * @param {string} enteredPIN
   * @param {string} storedPIN
   * @returns {boolean}
   */
  static verifyPIN(enteredPIN, storedPIN) {
    if (!enteredPIN || !storedPIN) return false;
    if (enteredPIN === storedPIN) return true;
    try {
      return bcrypt.compareSync(enteredPIN, storedPIN);
    } catch {
      return false;
    }
  }

  // Alias helpers for backwards compatibility
  static verifyPin(pin, hashedPin) {
    return this.verifyPIN(pin, hashedPin);
  }

  static encryptData(data, secretKey = DEFAULT_SECRET_KEY) {
    return this.encrypt(data, secretKey);
  }

  static decryptData(ciphertext, secretKey = DEFAULT_SECRET_KEY) {
    return this.decrypt(ciphertext, secretKey);
  }
}

export default SecurityService;
