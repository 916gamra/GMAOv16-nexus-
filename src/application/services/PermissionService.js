import { RBACService, ROLES, PERMISSIONS } from '../../core/security/RBACService.js';
import { AuthService } from '../../core/security/AuthService.js';
import { Logger } from '../../core/logger/LoggerService.js';

/**
 * Service de Gestion des Permissions et Droits d'Accès
 * Unifie et consolide les contrôles RBAC et sessions utilisateurs GMAO.
 */
export class PermissionService {
  /**
   * Vérifie si le rôle ou l'utilisateur courant possède une permission spécifique.
   * @param {string} permission - ex: 'stock.view', 'stock.update', 'machine.create'
   * @param {string} [role] - Rôle spécifique optionnel. Si omis, utilise la session courante.
   * @returns {boolean}
   */
  static can(permission, role = null) {
    let effectiveRole = role;
    if (!effectiveRole) {
      const auth = new AuthService();
      const currentUser = auth.getCurrentUser();
      effectiveRole = currentUser?.role || ROLES.VIEWER;
    }

    const hasPerm = RBACService.hasPermission(effectiveRole, permission);
    Logger.debug(`[PermissionService] Check ${permission} for ${effectiveRole}: ${hasPerm ? 'ALLOWED' : 'DENIED'}`);
    return hasPerm;
  }

  /**
   * Vérifie si l'utilisateur courant est un Administrateur.
   * @returns {boolean}
   */
  static isAdmin() {
    return this.can('machine.delete');
  }

  /**
   * Liste toutes les permissions disponibles dans le système.
   * @returns {Object.<string, string[]>}
   */
  static getAllPermissions() {
    return PERMISSIONS;
  }

  /**
   * Récupère la liste des rôles disponibles.
   * @returns {Object.<string, string>}
   */
  static getRoles() {
    return ROLES;
  }
}

export default PermissionService;
