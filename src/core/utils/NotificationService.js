/**
 * خدمة الإشعارات الموحدة للتطبيق
 * @module NotificationService
 */
export class NotificationService {
  static #listeners = [];

  /**
   * إضافة مستمع للإشعارات
   * @param {Function} listener
   */
  static subscribe(listener) {
    this.#listeners.push(listener);
    return () => {
      this.#listeners = this.#listeners.filter(l => l !== listener);
    };
  }

  /**
   * إشعار المستخدم
   * @param {string} message - نص الإشعار
   * @param {'success'|'error'|'info'|'warning'} type - نوع الإشعار
   * @param {number} duration - المدة بالمللي ثانية
   */
  static notify(message, type = 'info', duration = 3000) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration,
      timestamp: new Date()
    };

    // إشعار جميع المستمعين
    this.#listeners.forEach(listener => listener(notification));

    // تسجيل في الـ Console كـ Fallback
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    if (type === 'error') {
      console.error(`${icons[type] || '📢'} ${message}`);
    } else if (type === 'warning') {
      console.warn(`${icons[type] || '📢'} ${message}`);
    } else {
      console.log(`${icons[type] || '📢'} ${message}`);
    }

    return notification;
  }

  static success(message, duration) {
    return this.notify(message, 'success', duration);
  }

  static error(message, duration) {
    return this.notify(message, 'error', duration);
  }

  static warning(message, duration) {
    return this.notify(message, 'warning', duration);
  }

  static info(message, duration) {
    return this.notify(message, 'info', duration);
  }
}

export const notify = NotificationService;
export default NotificationService;
