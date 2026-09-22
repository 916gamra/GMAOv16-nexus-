// src/application/services/SortieExterneService.js
// SERVICE SORTIE EXTERNE BOBINAGE & REPARATION
// ARCHITECTURE: ref (Coordonnées externes / Bon bobinier) | code (Adresse interne SORT-EXT-xxx) | id (Passeport unique complet)

import { Logger } from '../../core/logger/LoggerService.js';

const STORAGE_KEY = 'gmao_sortie_externe_bobinage_v1';

// Seed Initial réaliste issu des archives de l'usine (POA-08, SAT-16, DET-01, DET-06, etc.)
export const INITIAL_SORTIES_BOBINAGE = [
  {
    id: 'ID-SORT-EXT-001-POA08-MOT41-REF13KW-STE-AMAL',
    code: 'SORT-EXT-001',
    ref: 'BS-2021-042',
    id_machine: 'POA-08',
    code_moteur_reel: 'mot 41',
    id_groupe: 'GRP-MOTEUR-001',
    id_family: 'FAM-MOTEUR-ELEC-001',
    id_template: 'TPL-MOT-ASYNC-041',
    ref_moteur: 'REF-13KW-1440',
    designation_moteur: 'Moteur Asynchrone 13 KW 18 CV 1440 tr/min (mot 41)',
    date_demontage: '2021-06-24',
    technicien_demontage: 'Soufiane',
    type_probleme: 'grille',
    observation_probleme: 'Moteur bruyant, bobinage grillé suite à surchauffe',
    date_expedition: '2021-06-25',
    fournisseur_externe: 'STE AMAL',
    date_arrivee_prevue: '2021-06-29',
    date_arrivee_reelle: '2021-06-29',
    technicien_montage: 'Soufiane',
    date_montage: '2021-06-30',
    etat: 'Monté', // 'En réparation externe' | 'Retourné OK' | 'Monté' | 'En stock'
    cout_bobinage: 1800,
    note: 'Ok, retour bobinage parfait, vernis neuf et roulements remplacés',
    id_corrective: 'BT-1976',
    created_at: '2021-06-24T09:30:00.000Z',
    updated_at: '2021-06-30T14:15:00.000Z',
  },
  {
    id: 'ID-SORT-EXT-002-SAT16-MOT18-SIEMENS-BOBINAGE-CASA',
    code: 'SORT-EXT-002',
    ref: 'BS-2024-118',
    id_machine: 'SAT-16',
    code_moteur_reel: 'mot 18',
    id_groupe: 'GRP-MOTEUR-001',
    id_family: 'FAM-MOTEUR-ELEC-001',
    id_template: 'TPL-MOT-ASYNC-018',
    ref_moteur: 'Siemens 1LA7 11KW 1450tr',
    designation_moteur: 'Moteur Asynchrone 11KW 15CV 1450 tr/min (mot 18)',
    date_demontage: '2024-03-12',
    technicien_demontage: 'Rachid',
    type_probleme: 'la masse électrique',
    observation_probleme: 'Disjonction générale sur défaut d isolement stator',
    date_expedition: '2024-03-13',
    fournisseur_externe: 'Bobinage Casa',
    date_arrivee_prevue: '2024-03-22',
    date_arrivee_reelle: '2024-03-24',
    technicien_montage: 'Ismaayl',
    date_montage: '2024-03-25',
    etat: 'Monté',
    cout_bobinage: 2200,
    note: 'Rebobinage complet classe F + équilibrage dynamique rotor',
    id_corrective: 'BT-3474',
    created_at: '2024-03-12T11:00:00.000Z',
    updated_at: '2024-03-25T16:00:00.000Z',
  },
  {
    id: 'ID-SORT-EXT-003-DET06-MOT23-LEROY-SOMER-ATELIER-EXPRESS',
    code: 'SORT-EXT-003',
    ref: 'BS-2025-004',
    id_machine: 'DET-06',
    code_moteur_reel: 'mot 23',
    id_groupe: 'GRP-MOTEUR-001',
    id_family: 'FAM-MOTEUR-ELEC-001',
    id_template: 'TPL-MOT-ASYNC-023',
    ref_moteur: 'Leroy Somer 7,5KW 10HP 2900tr/min',
    designation_moteur: 'Moteur Électrique 7,5KW 10HP 2900tr/min (mot 23)',
    date_demontage: '2025-02-18',
    technicien_demontage: 'Ismaayl',
    type_probleme: 'problème du marche',
    observation_probleme: 'Blocage mécanique interne et odeur de brûlé',
    date_expedition: '2025-02-19',
    fournisseur_externe: 'Atelier Express Bobinage',
    date_arrivee_prevue: '2025-02-28',
    date_arrivee_reelle: '2025-03-01',
    technicien_montage: null,
    date_montage: null,
    etat: 'Retourné OK',
    cout_bobinage: 1650,
    note: 'Reçu et contrôlé à vide en atelier, stocké en réserve pour DET-06',
    id_corrective: 'BT-3575',
    created_at: '2025-02-18T08:45:00.000Z',
    updated_at: '2025-03-01T15:30:00.000Z',
  },
  {
    id: 'ID-SORT-EXT-004-DET01-MOT01-ABB-BOBINAGE-CASA',
    code: 'SORT-EXT-004',
    ref: 'BS-2025-015',
    id_machine: 'DET-01',
    code_moteur_reel: 'mot 01',
    id_groupe: 'GRP-MOTEUR-001',
    id_family: 'FAM-MOTEUR-ELEC-001',
    id_template: 'TPL-MOT-ASYNC-001',
    ref_moteur: 'ABB M2BAX 15KW 4 pôles 1460tr',
    designation_moteur: 'Moteur Broche Principale 15KW (mot 01)',
    date_demontage: '2025-03-10',
    technicien_demontage: 'Soufiane',
    type_probleme: 'grille',
    observation_probleme: 'Bobinage phase 2 fondu suite à coupure neutre réseau',
    date_expedition: '2025-03-11',
    fournisseur_externe: 'Bobinage Casa',
    date_arrivee_prevue: '2025-03-24',
    date_arrivee_reelle: null,
    technicien_montage: null,
    date_montage: null,
    etat: 'En réparation externe',
    cout_bobinage: 2600,
    note: 'En cours de trempage vernis et étuvage',
    id_corrective: 'BT-4070',
    created_at: '2025-03-10T14:20:00.000Z',
    updated_at: '2025-03-11T10:00:00.000Z',
  },
];

class SortieExterneService {
  /**
   * Charge la liste des sorties depuis le localStorage ou le seed initial
   */
  static getSorties() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SORTIES_BOBINAGE));
        return INITIAL_SORTIES_BOBINAGE;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SORTIES_BOBINAGE));
      return INITIAL_SORTIES_BOBINAGE;
    } catch {
      return INITIAL_SORTIES_BOBINAGE;
    }
  }

  /**
   * Sauvegarde les données dans le stockage
   */
  static saveSorties(sorties) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorties));
    } catch (e) {
      Logger.error('Erreur sauvegarde sorties externes:', e);
    }
  }

  /**
   * Génère le prochain code interne (SORT-EXT-001, SORT-EXT-002, ...)
   */
  static getNextCode(existingSorties = []) {
    const list = existingSorties.length > 0 ? existingSorties : this.getSorties();
    let maxSeq = 0;
    list.forEach((s) => {
      const m = String(s.code || '').match(/SORT-EXT-(\d+)/i);
      if (m && m[1]) {
        const val = parseInt(m[1], 10);
        if (val > maxSeq) maxSeq = val;
      }
    });
    const nextSeq = maxSeq + 1;
    return `SORT-EXT-${String(nextSeq).padStart(3, '0')}`;
  }

  /**
   * Construit le Passport ID unique selon la philosophie convenue:
   * ID-SORT-EXT-{SEQ}-{MACHINE}-{MOTEUR}-{REF}-{FOURNISSEUR}
   */
  static generatePassportId({ code, machine, moteurReel, refMoteur, fournisseur }) {
    const cleanCode = String(code || 'SORT-EXT-000').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cleanMach = String(machine || 'NOMACH').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cleanMot = String(moteurReel || 'NOMOT').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cleanRef = String(refMoteur || 'NOREF').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cleanFourn = String(fournisseur || 'EXT').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `ID-${cleanCode}-${cleanMach}-${cleanMot}-${cleanRef}-${cleanFourn}`;
  }

  /**
   * Ajoute une nouvelle sortie externe bobinage
   */
  static addSortie(payload) {
    const currentList = this.getSorties();
    const code = payload.code || this.getNextCode(currentList);
    const id = payload.id || this.generatePassportId({
      code,
      machine: payload.id_machine,
      moteurReel: payload.code_moteur_reel,
      refMoteur: payload.ref_moteur,
      fournisseur: payload.fournisseur_externe,
    });

    const now = new Date().toISOString();
    const newEntry = {
      id,
      code,
      ref: payload.ref || `BS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      id_machine: payload.id_machine || 'DET-01',
      code_moteur_reel: payload.code_moteur_reel || 'mot 01',
      id_groupe: payload.id_groupe || 'GRP-MOTEUR-001',
      id_family: payload.id_family || 'FAM-MOTEUR-ELEC-001',
      id_template: payload.id_template || 'TPL-MOT-ASYNC-001',
      ref_moteur: payload.ref_moteur || '',
      designation_moteur: payload.designation_moteur || '',
      date_demontage: payload.date_demontage || new Date().toISOString().split('T')[0],
      technicien_demontage: payload.technicien_demontage || '',
      type_probleme: payload.type_probleme || 'grille',
      observation_probleme: payload.observation_probleme || '',
      date_expedition: payload.date_expedition || new Date().toISOString().split('T')[0],
      fournisseur_externe: payload.fournisseur_externe || 'Bobinage Casa',
      date_arrivee_prevue: payload.date_arrivee_prevue || '',
      date_arrivee_reelle: payload.date_arrivee_reelle || null,
      technicien_montage: payload.technicien_montage || null,
      date_montage: payload.date_montage || null,
      etat: payload.etat || 'En réparation externe',
      cout_bobinage: Number(payload.cout_bobinage) || 0,
      note: payload.note || '',
      id_corrective: payload.id_corrective || '',
      created_at: now,
      updated_at: now,
    };

    const updated = [newEntry, ...currentList];
    this.saveSorties(updated);
    return newEntry;
  }

  /**
   * Met à jour un enregistrement existant
   */
  static updateSortie(id, updates) {
    const currentList = this.getSorties();
    const index = currentList.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const updatedRecord = {
      ...currentList[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    currentList[index] = updatedRecord;
    this.saveSorties(currentList);
    return updatedRecord;
  }

  /**
   * Marque une sortie comme "Retourné OK" avec date de retour réelle et coût final
   */
  static markAsReturned(id, { date_arrivee_reelle, cout_bobinage, note, technicien_reception }) {
    return this.updateSortie(id, {
      etat: 'Retourné OK',
      date_arrivee_reelle: date_arrivee_reelle || new Date().toISOString().split('T')[0],
      cout_bobinage: cout_bobinage !== undefined ? Number(cout_bobinage) : undefined,
      note: note || 'Retour atelier contrôlé OK',
      technicien_reception: technicien_reception || '',
    });
  }

  /**
   * Marque le moteur comme remonté sur sa machine
   */
  static markAsMounted(id, { technicien_montage, date_montage, id_machine_cible, note }) {
    return this.updateSortie(id, {
      etat: 'Monté',
      technicien_montage: technicien_montage || 'Ismaayl',
      date_montage: date_montage || new Date().toISOString().split('T')[0],
      id_machine: id_machine_cible || undefined,
      note: note || 'Moteur remonté et testé en charge OK',
    });
  }

  /**
   * Supprime une sortie
   */
  static deleteSortie(id) {
    const currentList = this.getSorties();
    const filtered = currentList.filter((s) => s.id !== id);
    this.saveSorties(filtered);
    return filtered;
  }

  /**
   * Calcule les KPIs en direct pour le tableau de bord
   */
  static getStats(sortiesList = []) {
    const list = sortiesList.length > 0 ? sortiesList : this.getSorties();
    const total = list.length;
    const enCours = list.filter((s) => s.etat === 'En réparation externe').length;
    const retournes = list.filter((s) => s.etat === 'Retourné OK').length;
    const montes = list.filter((s) => s.etat === 'Monté' || s.etat === 'En stock').length;
    const totalCout = list.reduce((sum, s) => sum + (Number(s.cout_bobinage) || 0), 0);

    return {
      total,
      enCours,
      retournes,
      montes,
      totalCout,
    };
  }
}

export default SortieExterneService;
