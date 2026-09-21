export class TaskMapper {
  toResponse(entity) {
    if (!entity) return null;
    return {
      id: entity.id,
      code_bon: entity.code_bon,
      num_commande: entity.num_commande,
      date: entity.date,
      ref: entity.ref,
      quantite: entity.quantite,
      type: entity.type,
      action_id: entity.action_id,
      usage_type: entity.usage_type,
      technicien: entity.technicien,
      id_zone: entity.id_zone,
      id_machine_registered: entity.id_machine_registered,
      operation: entity.operation,
      fournisseur: entity.fournisseur,
      emplacement_reception: entity.emplacement_reception,
      demandeur: entity.demandeur,
      commentaire: entity.commentaire
    };
  }
}
