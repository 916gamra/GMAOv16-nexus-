import { ROLES, PERMISSIONS, RBACService } from './RBACService.js';

/**
 * خدمة التحقق من الصلاحيات وأدوار المستخدمين
 * @module PermissionService
 */
export class PermissionService {
  static ROLES = ROLES;
  static PERMISSIONS = PERMISSIONS;

  /**
   * استخراج المستخدم الحالي من التخزين
   */
  static getCurrentUser() {
    try {
      const stored = localStorage.getItem('gmao_current_user') || localStorage.getItem('current_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    // افتراضي مسؤول للمعاينة السلسة
    return { username: 'Admin', role: ROLES.ADMIN };
  }

  /**
   * فحص ما إذا كان المستخدم يملك الصلاحية
   * @param {string} permission - مثل 'stock.delete'
   * @param {string} [role] - الدور إن تم تمريره
   */
  static can(permission, role = null) {
    const userRole = role || this.getCurrentUser()?.role || ROLES.VIEWER;
    return RBACService.hasPermission(userRole, permission);
  }

  /**
   * فحص ما إذا كان المستخدم مسؤولاً
   */
  static isAdmin(role = null) {
    const userRole = role || this.getCurrentUser()?.role;
    return userRole === ROLES.ADMIN;
  }

  /**
   * فحص ما إذا كان للمستخدم دور من مجموعة أدوار
   */
  static hasAnyRole(roles = [], currentRole = null) {
    const userRole = currentRole || this.getCurrentUser()?.role;
    return roles.includes(userRole);
  }
}

export default PermissionService;
