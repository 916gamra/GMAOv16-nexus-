import { CorrectiveCalculationService } from '../services/CorrectiveCalculationService';

export class CorrectiveIntervention {
  constructor(data = {}) {
    this.id = data.id || `CORR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    this.num_bt = data.num_bt || '';
    this.code_machine = String(data.code_machine || '').trim().toUpperCase();
    this.demande_date = data.demande_date || new Date().toISOString().split('T')[0];
    this.demande_heure = data.demande_heure || new Date().toTimeString().slice(0, 5);
    this.demandeur = data.demandeur || 'Production';
    this.intervenant = data.intervenant || '';
    this.date_debut = data.date_debut || '';
    this.heure_debut = data.heure_debut || '';
    this.date_fin = data.date_fin || '';
    this.heure_fin = data.heure_fin || '';

    // Calculate working time automatically
    if (this.date_debut && this.heure_debut && this.date_fin && this.heure_fin) {
      const calc = CorrectiveCalculationService.calculateWorkingTime(
        this.date_debut,
        this.heure_debut,
        this.date_fin,
        this.heure_fin
      );
      this.temps_intervention = calc.formatted;
      this.temps_intervention_mins = calc.minutes;
    } else {
      this.temps_intervention = data.temps_intervention || '00:00';
      this.temps_intervention_mins = Number(data.temps_intervention_mins) || 0;
    }

    this.arret_machine = Boolean(data.arret_machine);
    this.temps_arret = data.temps_arret || (this.arret_machine ? this.temps_intervention : '00:00');
    this.action_fermee = data.action_fermee || (data.statut === 'CLOTURE' ? 'OUI' : 'NON');
    this.statut = data.statut || (this.num_bt ? (this.action_fermee === 'OUI' ? 'CLOTURE' : 'EN_COURS') : 'DEMANDE');

    this.type_panne = data.type_panne || 'M';
    this.anomalie = data.anomalie || '';
    this.travail_a_faire = data.travail_a_faire || '';
    this.action_realisee = data.action_realisee || '';

    // PDR Link
    this.pdr_ref = data.pdr_ref || '';
    this.pdr_designation = data.pdr_designation || '';
    this.pdr_quantite = Number(data.pdr_quantite) || 0;
    this.marque = data.marque || '';
    this.etat_piece = data.etat_piece || 'Neuve';

    this.rapport_redige = data.rapport_redige || (this.action_fermee === 'OUI' ? 'OUI' : 'NON');
    this.priorite = data.priorite || 'MOYENNE';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  static fromJSON(json) {
    return new CorrectiveIntervention(json);
  }

  toJSON() {
    return {
      id: this.id,
      num_bt: this.num_bt,
      code_machine: this.code_machine,
      demande_date: this.demande_date,
      demande_heure: this.demande_heure,
      demandeur: this.demandeur,
      intervenant: this.intervenant,
      date_debut: this.date_debut,
      heure_debut: this.heure_debut,
      date_fin: this.date_fin,
      heure_fin: this.heure_fin,
      temps_intervention: this.temps_intervention,
      temps_intervention_mins: this.temps_intervention_mins,
      arret_machine: this.arret_machine,
      temps_arret: this.temps_arret,
      action_fermee: this.action_fermee,
      statut: this.statut,
      type_panne: this.type_panne,
      anomalie: this.anomalie,
      travail_a_faire: this.travail_a_faire,
      action_realisee: this.action_realisee,
      pdr_ref: this.pdr_ref,
      pdr_designation: this.pdr_designation,
      pdr_quantite: this.pdr_quantite,
      marque: this.marque,
      etat_piece: this.etat_piece,
      rapport_redige: this.rapport_redige,
      priorite: this.priorite,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
