import { Logger } from '../logger/LoggerService.js';
import { SecurityService } from './SecurityService.js';
import { DatabaseService } from '../database/DatabaseService.js';

/**
 * @file SessionService.js
 * @module core/security/SessionService
 * @description
 * خدمة إدارة الجلسات والأمان لربط المستخدمين بالعمليات الميدانية (CIOB GMAO Security Subsystem).
 * 
 * الميزات والمعايير المشددة:
 * - ⏱️ انتهاء الجلسة التلقائي عند عدم النشاط (Inactivity Timeout Default: 30 minutes).
 * - 🔐 توليد وتخزين رموز التوثيق الآمنة (HMAC SHA-256 / JWT-like tokens).
 * - 📱 بصمة الجهاز الرقمية (Device Fingerprinting & Unique Device ID).
 * - 💾 تخزين الجلسات محلياً في قاعدة البيانات مع دعم بيئة المتصفح والعمل بدون إنترنت (100% Offline).
 */
export class SessionService {
  /**
   * مهلة الخمول الافتراضية للجلسة بالميلي ثانية (30 دقيقة افتراضياً)
   * @type {number}
   */
  static SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 30 * 60 * 1000;

  /**
   * إنشاء جلسة مستخدم جديدة وحفظ بياناتها برمز توثيق مرمز
   * 
   * @param {string|number} userId - معرف المستخدم الفريد (مثل: TECH-01, CHEF-02)
   * @param {string} userRole - دور المستخدم في النظام ('ADMIN' | 'RESPONSABLE' | 'TECHNICIEN' | 'OPERATEUR')
   * @returns {Promise<Object>} كائن الجلسة المنشأة محتوياً على التوكن ومعرف الجلسة وتاريخ الانتهاء
   * @throws {Error} عند فشل عملية إنشاء الجلسة أو الكتابة في قاعدة البيانات
   */
  static async createSession(userId, userRole) {
    try {
      const sessionId = SecurityService.generateId();
      const token = SecurityService.generateToken({
        userId,
        userRole,
        sessionId,
        iat: Date.now()
      });

      const session = {
        id: sessionId,
        userId,
        userRole,
        token,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوماً كأقصى صلاحية للجلسة المحفوظة
        lastActivity: new Date(),
        deviceId: this._getDeviceId(),
        deviceFingerprint: SecurityService.getDeviceFingerprint(),
        ipAddress: 'offline'
      };

      // حفظ بيانات الجلسة في قاعدة البيانات المحلية
      const db = new DatabaseService();
      db.execute(
        `INSERT INTO sessions (id, user_id, token, device_id, ip_address, expires_at, last_activity, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.userId,
          session.token,
          session.deviceId,
          session.ipAddress,
          session.expiresAt.toISOString(),
          session.lastActivity.toISOString(),
          session.createdAt.toISOString()
        ]
      );

      // تخزين التوكن والمعرف والدور في sessionStorage لضمان الخصوصية أثناء الجلسة الحالية
      sessionStorage.setItem('sessionToken', token);
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('userRole', userRole);

      Logger.info('✅ Session created successfully', { userId, sessionId });
      return session;
    } catch (error) {
      Logger.error('❌ Session creation failed', error);
      throw error;
    }
  }

  /**
   * التحقق من صحة وصلاحية جلسة المستخدم بناءً على رمز التوثيق (Token Verification)
   * 
   * @param {string} token - رمز التوثيق المراد فخصه
   * @returns {Promise<{isValid: boolean, session?: Object, error?: string}>} نتيجة التحقق مع كائن الجلسة أو سبب الرفض
   */
  static async validateSession(token) {
    try {
      const decoded = SecurityService.verifyToken(token);
      
      // التحقق من وجود الجلسة في السجل
      const db = new DatabaseService();
      const session = db.queryOne(
        'SELECT * FROM sessions WHERE id = ?',
        [decoded.sessionId]
      );

      if (!session) {
        Logger.warn('⚠️ Session not found in database');
        return { isValid: false, error: 'Session not found' };
      }

      // التحقق من تاريخ انتهاء الصلاحية الإجمالي
      if (new Date() > new Date(session.expires_at)) {
        await this.destroySession(decoded.sessionId);
        Logger.warn('⚠️ Session expired');
        return { isValid: false, error: 'Session expired' };
      }

      // التحقق من مهلة الخمول وعدم النشاط (Inactivity Timeout)
      const inactivityTime = Date.now() - new Date(session.last_activity).getTime();
      if (inactivityTime > this.SESSION_TIMEOUT) {
        await this.destroySession(decoded.sessionId);
        Logger.warn('⚠️ Session inactive for too long');
        return { isValid: false, error: 'Session inactive' };
      }

      // تحديث طابع آخر نشاط للجلسة
      db.execute(
        'UPDATE sessions SET last_activity = ? WHERE id = ?',
        [new Date().toISOString(), decoded.sessionId]
      );

      Logger.debug('✅ Session validated', { userId: decoded.userId });
      return { isValid: true, session };
    } catch (error) {
      Logger.error('❌ Session validation failed', error);
      return { isValid: false, error: error.message };
    }
  }

  /**
   * إنهاء وحذف جلسة محددة من السجلات والمستودع المحلي
   * 
   * @param {string} sessionId - معرف الجلسة المراد إنهاؤها
   * @returns {Promise<void>}
   */
  static async destroySession(sessionId) {
    try {
      const db = new DatabaseService();
      db.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
      sessionStorage.removeItem('sessionToken');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userRole');
      Logger.info('✅ Session destroyed', { sessionId });
    } catch (error) {
      Logger.error('❌ Session destruction failed', error);
    }
  }

  /**
   * إنهاء جميع الجلسات لمنتسب/مستخدم معين (Force logout from all devices)
   * 
   * @param {string|number} userId - معرف المستخدم
   * @returns {Promise<void>}
   */
  static async destroyAllUserSessions(userId) {
    try {
      const db = new DatabaseService();
      db.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
      Logger.info('✅ All user sessions destroyed', { userId });
    } catch (error) {
      Logger.error('❌ Failed to destroy all user sessions', error);
    }
  }

  /**
   * استرجاع بيانات الجلسة الحالية النشطة من الذاكرة المؤقتة للذاكرة المحلية
   * 
   * @returns {Object|null} الحمولة المفكوكة التابعة للتشفير أو null عند عدم وجود جلسة نشطة
   */
  static getCurrentSession() {
    try {
      const token = sessionStorage.getItem('sessionToken');
      if (!token) return null;

      const decoded = SecurityService.verifyToken(token);
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * استخراج أو توليد معرف فريد للجهاز الحالي لمتابعة الأمان والعمليات (Device Fingerprinting)
   * 
   * @private
   * @returns {string} معرف الجهاز الفريد
   */
  static _getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = SecurityService.generateId();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }
}
