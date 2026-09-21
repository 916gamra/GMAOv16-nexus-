export class Mouvement {
  constructor(data) {
    this.id = data.id || data.code_bon;
    this.type = data.type || ''; // Entrée, Sortie...
    this.action_id = data.action_id;
    this.id_machine_registered = data.id_machine_registered;
    this.ref = data.ref || data.id_article;
    this.qte = Number(data.quantite || data.qte) || 0;
    this.date = data.date;
    this.technicien = data.technicien;
  }
  
  isSortie() { 
    return String(this.type).toLowerCase().includes('sortie'); 
  }
  
  isEntree() { 
    return String(this.type).toLowerCase().includes('entrée') || String(this.type).toLowerCase().includes('entree'); 
  }
}
