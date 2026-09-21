import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';
import { Logger } from '../logger/LoggerService.js';

/**
 * @file SecurityService.js
 * @module core/security/SecurityService
 * @description
 * خدمة التشفير وتمرير الرموز والحفاظ على الأمان والتوقيع الرقمي (AES-256 / Bcrypt / HMAC-SHA256 / Fingerprinting).
 * 
 * الوظائف الأمنية المقدمة:
 * - 🔑 تجشيم كلمة السر باستخدام bcrypt مع 10 جولات Salt.
 * - 🔒 تشفير وفك تشفير البيانات الحساسة عبر AES-256.
 * - 🎟️ توليد والتحقق من رموز التوثيق الموقعة بـ HMAC-SHA256.
 * - 🆔 استخراج بصمة رقمية فريدة للجهاز (Device Fingerprint).
 */
export class SecurityService {
  /**
   * المفتاح السري الافتراضي للتشفير والتوقيع الرقمي
   * @type {string}
   */
  static SECRET_KEY = import.meta.env.VITE_SECRET_KEY || 'your-secret-key-change-in-production';

  /**
   * تجشيم (Hash) كلمة السر باستخدام مكتبة bcrypt لضمان عدم تخزينها كنص صريح
   * 
   * @param {string} password - كلمة السر المراد تجشيمها
   * @returns {Promise<string>} النص المجشم لكلمة السر
   * @throws {Error} عند فشل عملية التجشيم
   */
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      Logger.debug('Password hashed successfully');
      return hash;
    } catch (error) {
      Logger.error('Password hashing failed', error);
      throw error;
    }
  }

  /**
   * المقارنة بين كلمة السر النصية والرمز المجشم مخزن سابقاً
   * 
   * @param {string} password - كلمة السر النصية المدخلة
   * @param {string} hash - الرمز المجشم المخزن
   * @returns {Promise<boolean>} true إذا كانت كلمة السر مطابقة، و false خلاف ذلك
   */
  static async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      Logger.error('Password comparison failed', error);
      return false;
    }
  }

  /**
   * تشفير البيانات باستخدام خوارزمية AES-256
   * 
   * @param {any} data - البيانات المراد تشفيرها (سيتم تحويلها لـ JSON)
   * @returns {string} النص المشفر في صيغة String Base64
   * @throws {Error} عند فشل التشفير
   */
  static encrypt(data) {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        this.SECRET_KEY
      ).toString();
      Logger.debug('Data encrypted successfully');
      return encrypted;
    } catch (error) {
      Logger.error('Encryption failed', error);
      throw error;
    }
  }

  /**
   * فك تشفير النص المشفر باستخدام AES-256 لاسترجاع البيانات الأصلية
   * 
   * @param {string} encrypted - النص المشفر
   * @returns {any} البيانات الأصلية المفكوكة
   * @throws {Error} عند فشل فك التشفير أو التوقيع غير الصحيح
   */
  static decrypt(encrypted) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.SECRET_KEY).toString(CryptoJS.enc.Utf8);
      Logger.debug('Data decrypted successfully');
      return JSON.parse(decrypted);
    } catch (error) {
      Logger.error('Decryption failed', error);
      throw error;
    }
  }

  /**
   * توليد توكن توثيق آمن موثق بتوقيع HMAC-SHA256 (مشابه لـ JWT)
   * 
   * @param {Object} payload - البيانات المراد تضمينها بالرمز
   * @returns {string} الرمز المولد بالصيغة `encodedHeaderPayload.signature`
   * @throws {Error} عند فشل عملية الإنشاء
   */
  static generateToken(payload) {
    try {
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };

      const token = {
        header,
        payload: {
          ...payload,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        }
      };

      const encoded = btoa(JSON.stringify(token));
      const signature = CryptoJS.HmacSHA256(encoded, this.SECRET_KEY).toString();
      
      Logger.debug('Token generated successfully');
      return `${encoded}.${signature}`;
    } catch (error) {
      Logger.error('Token generation failed', error);
      throw error;
    }
  }

  /**
   * فحص وتأكيد توقيع رمز التوثيق وصلاحية تاريخ الانتهاء
   * 
   * @param {string} token - الرمز المراد فصحه
   * @returns {Object} الحمولة الأصلية المفككة
   * @throws {Error} إذا كان التوقيع ملغياً أو صلاحية الرمز منتهية
   */
  static verifyToken(token) {
    try {
      const [encoded, signature] = token.split('.');
      const expectedSignature = CryptoJS.HmacSHA256(encoded, this.SECRET_KEY).toString();
      
      if (signature !== expectedSignature) {
        throw new Error('Invalid token signature');
      }

      const decoded = JSON.parse(atob(encoded));
      
      if (decoded.payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      Logger.debug('Token verified successfully');
      return decoded.payload;
    } catch (error) {
      Logger.error('Token verification failed', error);
      throw error;
    }
  }

  /**
   * توليد معرف عشوائي فريد بالقطع والنص الألفابيتي
   * 
   * @returns {string} المعرف العشوائي المولد
   */
  static generateId() {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * استخراج البصمة الرقمية للجهاز (Device Fingerprint) باستخدام الخصائص التقنية للمتصفح والتوقيع بـ SHA-256
   * 
   * @returns {string} البصمة المشفرة للجهاز
   */
  static getDeviceFingerprint() {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const fingerprint = `${userAgent}|${language}|${timezone}`;
    return CryptoJS.SHA256(fingerprint).toString();
  }
}
