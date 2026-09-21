export class StockItem {
  constructor(data) {
    this.id = data.id_article || data.id || data.ref;
    this.initial = Number(data.stockInitial) || 0;
    this.entrees = Number(data.entrees) || 0;
    this.sorties = Number(data.sorties) || 0;
    this.seuil = Number(data.seuil) || 0;
  }

  // Method: Stock Actuel = E + F - G
  getActuel() { 
    return this.initial + this.entrees - this.sorties; 
  }

  getSeuilAlerte() {
    return this.seuil;
  }

  getFormule() {
    return `${this.initial} + ${this.entrees} - ${this.sorties} = ${this.getActuel()}`;
  }

  // Method: واش تحت Seuil؟
  isBelowSeuil() { 
    return this.getActuel() <= this.seuil; 
  }

  // Method: Criticité
  getCriticite() { 
    if(this.getActuel() === 0) return 'Haute'; 
    if(this.isBelowSeuil()) return 'Moyenne'; 
    return 'Faible'; 
  }

  // Method: واش هاد PDR كيستهلك فـ هاد Blueprint؟
  isUsedInBlueprint(blueprint) {
    if (!blueprint || !blueprint.pdr_theoriques) return false;
    return blueprint.pdr_theoriques.some(p => p.id_pdr === this.id); 
  }
}
