import bcrypt from 'bcryptjs';
import { storageService } from '../../utils/storageService';
import { SecurityService } from './SecurityService';

const USERS_KEY = 'gmao_auth_accounts_v2';
const SESSION_KEY = 'gmao_session_v2';

export class AuthService {
  static instance = null;

  constructor() {
    if (AuthService.instance) return AuthService.instance;
    this.initDefaultUsers();
    AuthService.instance = this;
  }

  /**
   * Encrypt and sign session with HMAC-SHA256
   */
  saveSignedSession(sessionPayload) {
    const payload = {
      ...sessionPayload,
      loginTime: sessionPayload.loginTime || Date.now()
    };
    delete payload.passwordHash;
    delete payload.defaultPass;

    const token = SecurityService.generateToken(payload);
    const sessionEnvelope = {
      token,
      payload
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionEnvelope));
    return payload;
  }

  getDefaultUsersList() {
    // Predictable default credentials for fresh installs to allow first-time login
    const storedPinHash = localStorage.getItem('gmao_admin_pin');
    
    const getInitHash = (roleKey, fallbackPass) => {
      if (storedPinHash) return storedPinHash;
      // Use fallbackPass as the initial password if no Master PIN is set
      return bcrypt.hashSync(fallbackPass || 'admin', 10);
    };

    return [
      {
        id: 'admin',
        username: 'admin',
        passwordHash: getInitHash('ADMIN', 'admin'),
        role: 'ADMIN',
        name: 'Administrateur',
        titleFr: 'Administrateur Système',
        avatar: 'AD',
        badgeColor: 'emerald',
        description: 'Supervision complète, paramétrage & sécurité'
      },
      {
        id: 'magasinier',
        username: 'magasinier',
        passwordHash: getInitHash('MAGASINIER', 'magasinier'),
        role: 'RESPONSABLE_MAGASIN',
        name: 'Responsable Magasin',
        titleFr: 'Responsable Magasin (RMG)',
        avatar: 'RM',
        badgeColor: 'amber',
        description: 'Gestion du stock, réapprovisionnement & PDR'
      },
      {
        id: 'tech',
        username: 'tech',
        passwordHash: getInitHash('TECHNICIEN', 'tech'),
        role: 'TECHNICIEN',
        name: 'Technicien Maintenance',
        titleFr: 'Technicien Maintenance (TC)',
        avatar: 'TC',
        badgeColor: 'blue',
        description: 'Bons de sortie, pannes & interventions'
      },
      {
        id: 'viewer',
        username: 'viewer',
        passwordHash: getInitHash('VIEWER', 'viewer'),
        role: 'VIEWER',
        name: 'Observateur',
        titleFr: 'Observateur / Consultation',
        avatar: 'OB',
        badgeColor: 'slate',
        description: 'Accès lecture seule aux KPIs et tables'
      }
    ];
  }

  initDefaultUsers() {
    let users = null;
    try {
      users = JSON.parse(localStorage.getItem(USERS_KEY));
    } catch {
      users = null;
    }

    if (users && users.length > 0 && !users[0].passwordHash?.startsWith('$2')) {
      users = null; // Reset if using old hashes
    }

    const defaultUsers = this.getDefaultUsersList();

    if (!users || users.length === 0) {
      users = defaultUsers;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } else {
      // Ensure missing default accounts like 'magasinier' are present
      let updated = false;
      defaultUsers.forEach((defUser) => {
        const idx = users.findIndex((u) => u.username === defUser.username || u.id === defUser.id);
        if (idx === -1) {
          users.push(defUser);
          updated = true;
        } else {
          // Enrich existing account with avatar and titleFr if missing
          if (!users[idx].avatar || !users[idx].titleFr) {
            users[idx] = { ...defUser, ...users[idx] };
            updated = true;
          }
        }
      });
      if (updated) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
  }

  getAvailableAccounts() {
    let users;
    try {
      const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
      users = (parsed && Array.isArray(parsed) && parsed.length > 0) ? parsed : this.getDefaultUsersList();
    } catch {
      users = this.getDefaultUsersList();
    }
    return users.map((u) => ({
      id: u.id,
      code: u.username,
      username: u.username,
      name: u.name,
      role: u.role,
      titleFr: u.titleFr || u.role,
      avatar: u.avatar || u.name?.slice(0, 2).toUpperCase() || 'US',
      badgeColor: u.badgeColor || 'slate',
      description: u.description || '',
    }));
  }

  updateUserPassword(usernameOrId, newPlainPassword) {
    const cleanPass = (newPlainPassword || '').trim();
    if (cleanPass.length < 4) {
      throw new Error('Le nouveau mot de passe doit comporter au moins 4 caractères.');
    }

    let users;
    try {
      const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
      users = (parsed && Array.isArray(parsed) && parsed.length > 0) ? parsed : this.getDefaultUsersList();
    } catch {
      users = this.getDefaultUsersList();
    }

    const idx = users.findIndex(
      (u) => u.username?.toLowerCase() === usernameOrId?.toLowerCase() || u.id === usernameOrId
    );

    if (idx === -1) {
      throw new Error(`Compte "${usernameOrId}" introuvable.`);
    }

    const newHash = bcrypt.hashSync(cleanPass, 10);
    users[idx].passwordHash = newHash;
    delete users[idx].defaultPass;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Update active session if it corresponds to this user
    const currentSession = this.getCurrentUser();
    if (currentSession && (currentSession.username === users[idx].username || currentSession.id === users[idx].id)) {
      this.saveSignedSession(currentSession);
    }

    window.dispatchEvent(new Event('storage'));
    return users[idx];
  }

  updateUserProfile(usernameOrId, updates = {}) {
    let users;
    try {
      const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
      users = (parsed && Array.isArray(parsed) && parsed.length > 0) ? parsed : this.getDefaultUsersList();
    } catch {
      users = this.getDefaultUsersList();
    }

    const idx = users.findIndex(
      (u) => u.username?.toLowerCase() === usernameOrId?.toLowerCase() || u.id === usernameOrId
    );

    if (idx === -1) {
      throw new Error(`Compte "${usernameOrId}" introuvable.`);
    }

    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const currentSession = this.getCurrentUser();
    if (currentSession && (currentSession.username === users[idx].username || currentSession.id === users[idx].id)) {
      const updatedSession = { ...currentSession, ...updates };
      this.saveSignedSession(updatedSession);
    }

    window.dispatchEvent(new Event('storage'));
    return users[idx];
  }

  resetAllAccountsToDefaults() {
    const defaultUsers = this.getDefaultUsersList();
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    window.dispatchEvent(new Event('storage'));
    return defaultUsers;
  }

  hashPasswordBCrypt(plainPassword) {
    if (!plainPassword) return '';
    return bcrypt.hashSync(plainPassword, 10);
  }

  verifyPasswordBCrypt(plainPassword, hash) {
    if (!plainPassword || !hash) return false;
    try {
      return bcrypt.compareSync(plainPassword, hash);
    } catch {
      return false;
    }
  }

  switchSessionToUser(usernameOrId) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || this.getDefaultUsersList();
    const user = users.find(
      (u) => u.username?.toLowerCase() === usernameOrId?.toLowerCase() || u.id === usernameOrId
    );
    if (!user) {
      throw new Error(`Compte "${usernameOrId}" introuvable.`);
    }
    const sessionPayload = {
      ...user,
      authMethod: 'ADMIN_SWITCH'
    };
    const session = this.saveSignedSession(sessionPayload);
    window.dispatchEvent(new Event('storage'));
    return session;
  }

  isPinConfigured() {
    return !!localStorage.getItem('gmao_admin_pin');
  }

  createAdminSession(role = 'ADMIN', authMethod = 'PASSWORD') {
    const sessionPayload = {
      id: 'admin',
      username: 'admin',
      role: role,
      name: 'Administrateur',
      titleFr: `Administrateur Système (${role})`,
      avatar: 'AD',
      authMethod: authMethod
    };
    return this.saveSignedSession(sessionPayload);
  }

  async loginWithPin(pin) {
    const cleanPin = (pin || '').trim();
    if (!cleanPin) {
      throw new Error('Veuillez saisir votre code PIN chiffré.');
    }

    const storedAdminPin = localStorage.getItem('gmao_admin_pin');
    if (!storedAdminPin) {
      throw new Error("Aucun code PIN chiffré n'est configuré dans les Paramètres. Utilisez le mot de passe habituel.");
    }

    const isMatch = storageService.verifyPin(cleanPin, storedAdminPin);
    if (!isMatch) {
      throw new Error('Code PIN chiffré incorrect.');
    }

    const configuredRole = localStorage.getItem('gmao_admin_role') || 'ADMIN';
    return this.createAdminSession(configuredRole, 'ENCRYPTED_PIN');
  }

  async login(username, password) {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanPassword) {
      throw new Error("Veuillez saisir votre mot de passe ou code PIN.");
    }

    // Check if configured Admin PIN from Settings matches
    const storedAdminPin = localStorage.getItem('gmao_admin_pin');
    const isPinMatch = storedAdminPin ? storageService.verifyPin(cleanPassword, storedAdminPin) : false;

    // If username is admin, or empty with valid admin PIN, authenticate as Admin
    if ((cleanUsername === 'admin' || !cleanUsername) && isPinMatch) {
      const configuredRole = localStorage.getItem('gmao_admin_role') || 'ADMIN';
      return this.createAdminSession(configuredRole, 'ENCRYPTED_PIN');
    }

    // Standard user lookup by username or alias
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || this.getDefaultUsersList();
    const user = users.find(
      (u) =>
        u.username?.toLowerCase() === cleanUsername ||
        (cleanUsername === 'rmg' && (u.username === 'magasinier' || u.id === 'magasinier')) ||
        (cleanUsername === 'magasin' && (u.username === 'magasinier' || u.id === 'magasinier'))
    );

    if (user) {
      const isPasswordValid =
        (user.passwordHash && bcrypt.compareSync(cleanPassword, user.passwordHash)) ||
        (user.role === 'ADMIN' && isPinMatch);

      if (isPasswordValid) {
        const sessionPayload = {
          ...user,
          authMethod: 'PASSWORD'
        };
        return this.saveSignedSession(sessionPayload);
      }
    }

    throw new Error("Nom d'utilisateur ou mot de passe incorrect");
  }

  logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  getCurrentUser() {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) return null;

      let parsed;
      try {
        parsed = JSON.parse(sessionStr);
      } catch {
        this.logout();
        return null;
      }

      // Verify HMAC token signature if wrapped envelope
      if (parsed && parsed.token && parsed.payload) {
        try {
          const verifiedPayload = SecurityService.verifyToken(parsed.token);
          // Sliding session renewal: auto-refresh if token is older than 24 hours
          const nowSec = Math.floor(Date.now() / 1000);
          if (verifiedPayload.iat && nowSec - verifiedPayload.iat > 24 * 60 * 60) {
            return this.saveSignedSession(verifiedPayload);
          }
          return verifiedPayload;
        } catch {
          // Token expired naturally or invalid signature: clear expired session cleanly
          this.logout();
          return null;
        }
      }

      // Legacy plain session upgrade: sign and convert
      if (parsed && parsed.username && parsed.role) {
        const signed = this.saveSignedSession(parsed);
        return signed;
      }

      return null;
    } catch {
      // Clear corrupt session
      this.logout();
      return null;
    }
  }
}
