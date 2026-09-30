import { useState, useMemo, useCallback, useEffect } from 'react';
import { storageService } from '../utils/storageService';
import seedUsers from '../data/users/seedUsers.json';
import initialTechnicians from '../data/users/seedTechnicians.json';
import initialOperations from '../data/users/seedOperations.json';

const PERSONNEL_STORAGE_KEY = 'gmao_personnel_users_v2';

function isRealPersonnelUser(u) {
  if (!u || typeof u !== 'object') return false;
  if (u.passwordHash) return false;
  const idStr = String(u.id || u.id_technician || u.id_operation || '').trim().toUpperCase();
  const usernameStr = String(u.username || '').trim().toLowerCase();
  // Filter out system login accounts that might have leaked into users storage
  if (['ADMIN', 'MAGASINIER', 'VIEWER'].includes(idStr) || ['admin', 'magasinier', 'viewer'].includes(usernameStr)) {
    return false;
  }
  if (idStr === 'TECH' && (!u.nom || u.nom === 'Technicien Maintenance')) {
    return false;
  }
  return true;
}

function sanitizePersonnelList(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(isRealPersonnelUser);
}

/**
 * 🏛️ GMAO User Sub-State & Single Source of Truth
 * Conforme à la Constitution GMAO :
 * Le tableau `users` (Utilisateurs / Personnel) est le SEUL et UNIQUE conteneur maître (Single Source of Truth) pour les techniciens, opérateurs et responsables d'usine.
 * Les comptes système/connexion (Auth) sont isolés dans AuthService et le coffre-fort.
 */
export function useUserSubState(groupedState = {}) {
  // 1. Initialisation de la table unique des utilisateurs (Master Personnel Table)
  const [users, setUsers] = useState(() => {
    // Si fourni dans groupedState avec du personnel réel
    if (Array.isArray(groupedState.users) && groupedState.users.length > 0) {
      const sanitized = sanitizePersonnelList(groupedState.users);
      if (sanitized.length > 0) return sanitized;
    }

    // Si sauvegardé dans LocalStorage sous la clé dédiée au personnel
    const rawPersonnel = storageService.getItem(PERSONNEL_STORAGE_KEY);
    if (Array.isArray(rawPersonnel)) {
      const sanitized = sanitizePersonnelList(rawPersonnel);
      if (sanitized.length > 0) return sanitized;
    }

    // Vérification de l'ancienne clé avec assainissement strict
    const legacyUsers = storageService.getItem('gmao_users_v2') || storageService.getItem('gmao_users');
    if (Array.isArray(legacyUsers)) {
      const sanitized = sanitizePersonnelList(legacyUsers);
      if (sanitized.length > 0) return sanitized;
    }

    // Migration transparente depuis les clés techniciens et opérations si existantes
    const rawTechs =
      (groupedState.technicians && Array.isArray(groupedState.technicians) && groupedState.technicians.length > 0)
        ? groupedState.technicians
        : storageService.getItem('gmao_technicians_v2') || storageService.getItem('gmao_technicians');

    const rawOps =
      (groupedState.operations && Array.isArray(groupedState.operations) && groupedState.operations.length > 0)
        ? groupedState.operations
        : storageService.getItem('gmao_operations_v2') || storageService.getItem('gmao_operations');

    const sanitizedTechs = sanitizePersonnelList(rawTechs);
    const sanitizedOps = sanitizePersonnelList(rawOps);

    if (sanitizedTechs.length > 0 || sanitizedOps.length > 0) {
      const mergedTechs = (sanitizedTechs.length > 0 ? sanitizedTechs : initialTechnicians).map((t) => ({
        id: t.id_technician || t.id,
        id_technician: t.id_technician || t.id,
        nom: t.nom,
        role: 'Technicien',
        type_profil: 'TECHNICIEN',
        id_zone: t.id_zone,
        zones: [t.id_zone],
        specialite: t.specialite || 'Maintenance Générale',
      }));

      const mergedOps = (sanitizedOps.length > 0 ? sanitizedOps : initialOperations).map((o) => ({
        id: o.id_operation || o.id,
        id_operation: o.id_operation || o.id,
        nom: o.nom,
        role: o.type_profil === 'OPERATEUR' ? 'Operateur' : 'Responsable',
        type_profil: o.type_profil || 'RESPONSABLE',
        id_zone: o.id_zone || 'ALL',
        zones: o.zones || [o.id_zone || 'ALL'],
        templates: o.templates || [],
        template_ids: o.template_ids || [],
        template_id: o.template_id || '',
        template_label: o.template_label || '',
        specialite: o.specialite || o.template_label || 'Coordination Opérationnelle',
      }));

      return [...mergedTechs, ...mergedOps];
    }

    return seedUsers;
  });

  // 2. Vue dérivée stricte : Techniciens = FILTER(users, role === 'Technicien')
  const technicians = useMemo(() => {
    return users
      .filter((u) => {
        if (!u || !isRealPersonnelUser(u)) return false;
        const roleStr = String(u.role || u.type_profil || '').toLowerCase();
        const idStr = String(u.id || u.id_technician || '').toUpperCase();
        return roleStr.includes('tech') || idStr.startsWith('TECH');
      })
      .map((u) => ({
        ...u,
        id_technician: u.id_technician || u.id,
      }));
  }, [users]);

  // 3. Vue dérivée stricte : Opérations & Chefs = FILTER(users, role !== 'Technicien')
  const operations = useMemo(() => {
    return users
      .filter((u) => {
        if (!u || !isRealPersonnelUser(u)) return false;
        const roleStr = String(u.role || u.type_profil || '').toLowerCase();
        const idStr = String(u.id || u.id_technician || '').toUpperCase();
        return !roleStr.includes('tech') && !idStr.startsWith('TECH');
      })
      .map((u) => ({
        ...u,
        id_operation: u.id_operation || u.id,
      }));
  }, [users]);

  // 4. Maintien des setters pour rétrocompatibilité totale avec les hooks et composants existants
  const setTechnicians = useCallback((updater) => {
    setUsers((prevUsers) => {
      const currentTechs = prevUsers.filter((u) => {
        if (!u || !isRealPersonnelUser(u)) return false;
        const roleStr = String(u.role || u.type_profil || '').toLowerCase();
        const idStr = String(u.id || u.id_technician || '').toUpperCase();
        return roleStr.includes('tech') || idStr.startsWith('TECH');
      });
      const nonTechs = prevUsers.filter((u) => {
        if (!u || !isRealPersonnelUser(u)) return false;
        const roleStr = String(u.role || u.type_profil || '').toLowerCase();
        const idStr = String(u.id || u.id_technician || '').toUpperCase();
        return !roleStr.includes('tech') && !idStr.startsWith('TECH');
      });

      const nextTechs = typeof updater === 'function' ? updater(currentTechs) : updater;
      const formatted = (Array.isArray(nextTechs) ? nextTechs : []).map((t) => ({
        ...t,
        id: t.id || t.id_technician || `TECH-${Date.now()}`,
        id_technician: t.id_technician || t.id,
        role: 'Technicien',
        type_profil: 'TECHNICIEN',
      }));

      return [...formatted, ...nonTechs];
    });
  }, []);

  const setOperations = useCallback((updater) => {
    setUsers((prevUsers) => {
      const currentOps = prevUsers.filter((u) => {
        if (!u || !isRealPersonnelUser(u)) return false;
        const roleStr = String(u.role || u.type_profil || '').toLowerCase();
        const idStr = String(u.id || u.id_operation || '').toUpperCase();
        return !roleStr.includes('tech') && !idStr.startsWith('TECH');
      });
      const techs = prevUsers.filter((u) => {
        if (!u || !isRealPersonnelUser(u)) return false;
        const roleStr = String(u.role || u.type_profil || '').toLowerCase();
        const idStr = String(u.id || u.id_technician || '').toUpperCase();
        return roleStr.includes('tech') || idStr.startsWith('TECH');
      });

      const nextOps = typeof updater === 'function' ? updater(currentOps) : updater;
      const formatted = (Array.isArray(nextOps) ? nextOps : []).map((o) => ({
        ...o,
        id: o.id || o.id_operation || `RESP-${Date.now()}`,
        id_operation: o.id_operation || o.id,
        role: o.role || (o.type_profil === 'OPERATEUR' ? 'Operateur' : 'Responsable'),
        type_profil: o.type_profil || (o.role === 'Operateur' ? 'OPERATEUR' : 'RESPONSABLE'),
      }));

      return [...techs, ...formatted];
    });
  }, []);

  // 5. Sauvegarde automatique de la table du personnel
  useEffect(() => {
    const sanitized = sanitizePersonnelList(users);
    storageService.setItem(PERSONNEL_STORAGE_KEY, sanitized);
    storageService.setItem('gmao_technicians_v2', technicians);
    storageService.setItem('gmao_operations_v2', operations);
  }, [users, technicians, operations]);

  return {
    users,
    setUsers,
    technicians,
    setTechnicians,
    operations,
    setOperations,
  };
}
