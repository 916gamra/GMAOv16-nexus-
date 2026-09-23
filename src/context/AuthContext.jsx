import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as bcrypt from 'bcryptjs';
import { Container } from '../core/di/Container.js';
import { accessLogService } from '../utils/AccessLogService';
import { vaultService } from '../utils/vaultService';
import { storageService } from '../utils/storageService';

const AuthContext = createContext(null);
const BCRYPT_ROUNDS = 10;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isVaultExists, setIsVaultExists] = useState(() => vaultService.isVaultExists());
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [accounts, setAccounts] = useState([]);

  // Resolve AuthService for legacy/storage compatibility
  const authService = Container.resolve('auth');

  // Check initial session
  useEffect(() => {
    const sessionUser = authService?.getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
    }
    setIsVaultExists(vaultService.isVaultExists());
  }, [authService]);

  // Initialisation du Master PIN pour la première fois - crée le coffre chiffré AES-256-GCM
  const setupMasterPin = useCallback(async (pin) => {
    const cleanPin = (pin || '').trim();
    if (!cleanPin || cleanPin.length < 4) {
      throw new Error('Le Master PIN doit comporter au moins 4 chiffres.');
    }

    const defaultAccounts = [
      {
        id: 'ID-ADMIN-001',
        code: 'admin',
        username: 'admin',
        libelle: 'Administrateur Système',
        name: 'Administrateur',
        role: 'ADMIN',
        titleFr: 'Administrateur Système',
        avatar: 'AD',
        badgeColor: 'emerald',
        passwordHash: bcrypt.hashSync('admin123', BCRYPT_ROUNDS),
        description: 'Supervision complète, paramétrage & sécurité'
      },
      {
        id: 'ID-MAG-001',
        code: 'magasinier',
        username: 'magasinier',
        libelle: 'Responsable Magasin (RMG)',
        name: 'Responsable Magasin',
        role: 'RESPONSABLE_MAGASIN',
        titleFr: 'Responsable Magasin (RMG)',
        avatar: 'RM',
        badgeColor: 'amber',
        passwordHash: bcrypt.hashSync('magasin123', BCRYPT_ROUNDS),
        description: 'Gestion du stock, réapprovisionnement & PDR'
      },
      {
        id: 'ID-TECH-001',
        code: 'tech',
        username: 'tech',
        libelle: 'Technicien Maintenance (TC)',
        name: 'Technicien Maintenance',
        role: 'TECHNICIEN',
        titleFr: 'Technicien Maintenance (TC)',
        avatar: 'TC',
        badgeColor: 'blue',
        passwordHash: bcrypt.hashSync('tech123', BCRYPT_ROUNDS),
        description: 'Bons de sortie, pannes & interventions'
      },
      {
        id: 'ID-VIEW-001',
        code: 'viewer',
        username: 'viewer',
        libelle: 'Observateur / Consultation',
        name: 'Observateur',
        role: 'VIEWER',
        titleFr: 'Observateur / Consultation',
        avatar: 'OB',
        badgeColor: 'slate',
        passwordHash: bcrypt.hashSync('viewer123', BCRYPT_ROUNDS),
        description: 'Accès lecture seule aux KPIs et tables'
      },
    ];

    const newVault = {
      version: 2,
      createdAt: new Date().toISOString(),
      accounts: defaultAccounts,
    };

    await vaultService.encryptVault(newVault, cleanPin);
    await vaultService.setPinHash(cleanPin);

    setIsVaultExists(true);
    setIsVaultUnlocked(true);
    setAccounts(defaultAccounts.map(({ passwordHash: _passwordHash, ...rest }) => rest));

    // Also sync admin PIN hash with storage
    localStorage.setItem('gmao_admin_pin', storageService.hashPin(cleanPin));

    return true;
  }, []);

  // Déchiffrement du coffre-fort avec le Master PIN
  const unlockVault = useCallback(async (pin) => {
    const cleanPin = (pin || '').trim();
    if (!cleanPin) throw new Error('Veuillez saisir le code Master PIN.');
    const vault = await vaultService.decryptVault(cleanPin);
    if (vault && Array.isArray(vault.accounts)) {
      setAccounts(vault.accounts.map(({ passwordHash: _passwordHash, ...rest }) => rest));
      setIsVaultUnlocked(true);
      await vaultService.setPinHash(cleanPin);
      return vault;
    }
    throw new Error('Structure du coffre-fort invalide.');
  }, []);

  // Verrouillage du coffre-fort
  const lockVault = useCallback(() => {
    setIsVaultUnlocked(false);
    setAccounts([]);
    authService?.logout();
    setUser(null);
  }, [authService]);

  // Liste des comptes disponibles sans exposer les mots de passe
  const getAvailableAccounts = useCallback(() => {
    if (accounts.length > 0) {
      return accounts.map((acc) => ({
        id: acc.id,
        code: acc.code || acc.username,
        username: acc.username || acc.code,
        name: acc.name || acc.libelle,
        libelle: acc.libelle || acc.name,
        role: acc.role,
        titleFr: acc.titleFr || acc.role,
        avatar: acc.avatar || (acc.code || 'US').substring(0, 2).toUpperCase(),
        badgeColor: acc.badgeColor || 'slate',
        description: acc.description || '',
      }));
    }
    const legacyUsers = authService?.getAvailableAccounts() || [];
    return legacyUsers.map((acc) => ({
      id: acc.id,
      code: acc.username,
      username: acc.username,
      name: acc.name,
      libelle: acc.titleFr || acc.name,
      role: acc.role,
      titleFr: acc.titleFr || acc.role,
      avatar: acc.avatar || (acc.username || 'US').substring(0, 2).toUpperCase(),
      badgeColor: acc.badgeColor || 'slate',
      description: acc.description || '',
    }));
  }, [accounts, authService]);

  // Authentification système : supporte le 2FA (Code + Mot de passe + Master PIN)
  const login = useCallback(async (usernameOrParams, passwordParam, pinParam) => {
    const usernameRaw = (typeof usernameOrParams === 'object' && usernameOrParams !== null)
      ? (usernameOrParams.code || usernameOrParams.username || '')
      : (usernameOrParams || '');
    const passwordRaw = (typeof usernameOrParams === 'object' && usernameOrParams !== null)
      ? (usernameOrParams.password || '')
      : (passwordParam || '');
    const pinRaw = (typeof usernameOrParams === 'object' && usernameOrParams !== null)
      ? (usernameOrParams.pin || usernameOrParams.pinCode || '')
      : (pinParam || '');

    const username = usernameRaw.trim().toLowerCase();
    const password = (passwordRaw || '').trim();
    const pin = (pinRaw || '').trim();

    // Case 1: Vault exists and PIN is provided -> 2FA Zero-Knowledge decryption
    if (vaultService.isVaultExists()) {
      let vault = null;

      // If user supplied PIN, decrypt vault with PIN
      if (pin) {
        try {
          vault = await vaultService.decryptVault(pin);
        } catch {
          throw new Error('Master PIN incorrect : échec du déchiffrement du coffre-fort (AES-GCM).');
        }
      }

      if (vault && Array.isArray(vault.accounts)) {
        // Look up account in decrypted vault
        const acc = vault.accounts.find(
          (a) =>
            (a.code && a.code.toLowerCase() === username) ||
            (a.username && a.username.toLowerCase() === username) ||
            (username === 'rmg' && (a.code === 'magasinier' || a.username === 'magasinier'))
        );

        if (!acc) {
          throw new Error(`Le compte "${username}" est introuvable dans le coffre-fort.`);
        }

        // Verify password with BCrypt
        const isOk = acc.passwordHash && bcrypt.compareSync(password, acc.passwordHash);
        if (!isOk) {
          throw new Error('Mot de passe incorrect.');
        }

        // Create session
        const sessionUser = {
          id: acc.id,
          code: acc.code || acc.username,
          username: acc.username || acc.code,
          name: acc.name || acc.libelle,
          role: acc.role,
          titleFr: acc.titleFr || acc.role,
          avatar: acc.avatar || (acc.code || 'US').substring(0, 2).toUpperCase(),
          badgeColor: acc.badgeColor || 'emerald',
          authMethod: 'VAULT_2FA',
          loginTime: Date.now(),
        };

        setUser(sessionUser);
        setIsVaultUnlocked(true);
        setAccounts(vault.accounts.map(({ passwordHash: _passwordHash, ...rest }) => rest));
        localStorage.setItem('gmao_session_v2', JSON.stringify(sessionUser));
        await accessLogService.recordLogin(sessionUser);
        return sessionUser;
      }
    }

    // Case 2: Standard authentication fallback
    const loggedInUser = await authService.login(username, password);
    setUser(loggedInUser);
    await accessLogService.recordLogin(loggedInUser);
    return loggedInUser;
  }, [authService]);

  // Authentification rapide par code PIN
  const loginWithPin = useCallback(async (pin) => {
    const cleanPin = (pin || '').trim();
    if (!cleanPin) throw new Error('Veuillez saisir le code PIN.');

    // If vault exists, try decrypting vault with PIN
    if (vaultService.isVaultExists()) {
      try {
        const vault = await vaultService.decryptVault(cleanPin);
        const adminAcc = vault.accounts.find((a) => a.role === 'ADMIN') || vault.accounts[0];
        const sessionUser = {
          id: adminAcc?.id || 'admin',
          code: adminAcc?.code || 'admin',
          username: adminAcc?.username || 'admin',
          name: adminAcc?.name || 'Administrateur',
          role: adminAcc?.role || 'ADMIN',
          titleFr: adminAcc?.titleFr || 'Administrateur Système',
          avatar: adminAcc?.avatar || 'AD',
          badgeColor: 'emerald',
          authMethod: 'VAULT_MASTER_PIN',
          loginTime: Date.now(),
        };
        setUser(sessionUser);
        setIsVaultUnlocked(true);
        setAccounts(vault.accounts.map(({ passwordHash: _passwordHash, ...rest }) => rest));
        localStorage.setItem('gmao_session_v2', JSON.stringify(sessionUser));
        await accessLogService.recordLogin(sessionUser);
        return sessionUser;
      } catch {
        throw new Error('Master PIN incorrect : échec du déchiffrement du coffre-fort.');
      }
    }

    // Fallback to authService PIN login
    const loggedInUser = await authService.loginWithPin(cleanPin);
    setUser(loggedInUser);
    await accessLogService.recordLogin(loggedInUser);
    return loggedInUser;
  }, [authService]);

  const logout = useCallback(() => {
    accessLogService.recordLogout();
    authService?.logout();
    setUser(null);
  }, [authService]);

  // Mise à jour du mot de passe d'un compte dans le coffre chiffré
  const updateUserPassword = useCallback(async (username, newPass, masterPin) => {
    const cleanPass = (newPass || '').trim();
    if (cleanPass.length < 4) {
      throw new Error('Le mot de passe doit comporter au moins 4 caractères.');
    }

    if (vaultService.isVaultExists()) {
      if (!masterPin) {
        throw new Error('Veuillez saisir le Master PIN pour déverrouiller et mettre à jour le coffre-fort.');
      }
      const vault = await vaultService.decryptVault(masterPin);
      const idx = vault.accounts.findIndex(
        (a) => (a.code && a.code.toLowerCase() === username.toLowerCase()) ||
               (a.username && a.username.toLowerCase() === username.toLowerCase()) ||
               a.id === username
      );
      if (idx === -1) {
        throw new Error(`Le compte "${username}" est introuvable dans le coffre-fort.`);
      }
      vault.accounts[idx].passwordHash = bcrypt.hashSync(cleanPass, BCRYPT_ROUNDS);
      await vaultService.encryptVault(vault, masterPin);
      setAccounts(vault.accounts.map(({ passwordHash: _passwordHash, ...rest }) => rest));
      return vault.accounts[idx];
    }

    // Fallback
    return authService?.updateUserPassword(username, cleanPass);
  }, [authService]);

  // Basculement de session 2FA
  const switchSessionToUser = useCallback(async (username, masterPin) => {
    if (vaultService.isVaultExists()) {
      if (!masterPin) {
        throw new Error('Veuillez saisir le Master PIN pour confirmer le basculement de session (2FA).');
      }
      const vault = await vaultService.decryptVault(masterPin);
      const acc = vault.accounts.find(
        (a) => (a.code && a.code.toLowerCase() === username.toLowerCase()) ||
               (a.username && a.username.toLowerCase() === username.toLowerCase()) ||
               a.id === username
      );
      if (!acc) throw new Error(`Le compte "${username}" est introuvable.`);

      const session = {
        id: acc.id,
        code: acc.code || acc.username,
        username: acc.username || acc.code,
        name: acc.name || acc.libelle,
        role: acc.role,
        titleFr: acc.titleFr || acc.role,
        avatar: acc.avatar || (acc.code || 'US').substring(0, 2).toUpperCase(),
        badgeColor: acc.badgeColor || 'slate',
        authMethod: 'VAULT_SWITCH_2FA',
        loginTime: Date.now(),
      };
      setUser(session);
      localStorage.setItem('gmao_session_v2', JSON.stringify(session));
      return session;
    }

    const newSession = authService?.switchSessionToUser(username);
    setUser(newSession);
    return newSession;
  }, [authService]);

  // Réinitialisation du coffre-fort et des comptes
  const resetAllAccountsToDefaults = useCallback(async (masterPin) => {
    if (vaultService.isVaultExists()) {
      if (!masterPin) {
        throw new Error('Veuillez saisir le Master PIN pour autoriser la réinitialisation.');
      }
      await vaultService.decryptVault(masterPin);
    }
    // Re-setup master pin or reset vault
    localStorage.removeItem('gmao_vault_cipher_v2');
    localStorage.removeItem('gmao_vault_iv_v2');
    localStorage.removeItem('gmao_vault_pin_hash_v2');
    setIsVaultExists(false);
    setIsVaultUnlocked(false);
    setAccounts([]);
    if (authService?.resetAllAccountsToDefaults) {
      authService.resetAllAccountsToDefaults();
    }
    return true;
  }, [authService]);

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        accounts,
        isVaultExists,
        isVaultUnlocked,
        setupMasterPin,
        unlockVault,
        lockVault,
        login,
        loginWithPin,
        logout,
        getAvailableAccounts,
        isPinConfigured: () => vaultService.isVaultExists() || authService?.isPinConfigured(),
        getCurrentSessionUser: () => user || authService?.getCurrentUser(),
        updateUserPassword,
        updateUserProfile: (username, updates) => authService?.updateUserProfile(username, updates),
        resetAllAccountsToDefaults,
        switchSessionToUser,
        hashPasswordBCrypt: (pass) => bcrypt.hashSync(pass || '', BCRYPT_ROUNDS),
        verifyPasswordBCrypt: (pass, hash) => {
          try {
            return bcrypt.compareSync(pass || '', hash || '');
          } catch {
            return false;
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
