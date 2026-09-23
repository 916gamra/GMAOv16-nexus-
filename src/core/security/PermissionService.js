import { ROLES, PERMISSIONS, RBACService } from './RBACService.js';

/**
 * خدمة التحقق من الصلاحيات وأدوار المستخدمين
 * @module PermissionService
 */
export class PermissionService {
  static ROLES = ROLES;
  static PERMISSIONS = PERMISSIONS;

  /**
   * استخراج المستخدم الحالي من التخزين بآلية الفشل المغلق
   */
  static getCurrentUser() {
    try {
      const sessionStr = localStorage.getItem('gmao_session_v2') || localStorage.getItem('gmao_current_user');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        if (parsed && parsed.role) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Fail-closed: الزائر الافتراضي عند عدم وجود جلسة
    return { username: 'Visiteur', role: ROLES.VIEWER };
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
