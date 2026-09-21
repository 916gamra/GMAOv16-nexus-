export const ROLES = {
  ADMIN: 'ADMIN',
  RESPONSABLE: 'RESPONSABLE',
  TECHNICIEN: 'TECHNICIEN',
  MAGASINIER: 'MAGASINIER',
  VIEWER: 'VIEWER'
};

export const PERMISSIONS = {
  'stock.view': [ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.TECHNICIEN, ROLES.MAGASINIER, ROLES.VIEWER],
  'stock.create': [ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.MAGASINIER],
  'stock.update': [ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.MAGASINIER],
  'stock.delete': [ROLES.ADMIN],
  'machine.view': [ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.TECHNICIEN, ROLES.VIEWER],
  'machine.create': [ROLES.ADMIN, ROLES.RESPONSABLE],
  'machine.update': [ROLES.ADMIN, ROLES.RESPONSABLE],
  'machine.delete': [ROLES.ADMIN]
};

export class RBACService {
  static hasPermission(userRole, permission) {
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(userRole);
  }
}
