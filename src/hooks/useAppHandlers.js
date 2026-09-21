import { useGenericCRUD } from './useGenericCRUD';
export function useAppHandlers(state) {
  const {
    setTypes,
    setDesignations,
    setFamilies,
    setTemplates,
    setZones,
    setTechnicians,
    setOperations,
    setCompGroups,
    setCompFamilies,
    setCompTemplates,
    setPartTypes,
    setPartDesignations,
  } = state;

  const { handleAdd: addCompGrp, handleUpdate: updateCompGrp, handleDelete: delCompGrp } = useGenericCRUD(setCompGroups, 'id');
  const { handleAdd: addCompFam, handleUpdate: updateCompFam, handleDelete: delCompFam } = useGenericCRUD(setCompFamilies, 'id_family');
  const { handleAdd: addCompTpl, handleUpdate: updateCompTpl, handleDelete: delCompTpl } = useGenericCRUD(setCompTemplates, 'id_templates');
  const { handleAdd: addPartType, handleUpdate: updatePartType, handleDelete: delPartType } = useGenericCRUD(setPartTypes, 'id_type');
  const { handleAdd: addPartDesig, handleUpdate: updatePartDesig, handleDelete: delPartDesig } = useGenericCRUD(setPartDesignations, 'ref');
  const { handleAdd: addType, handleUpdate: updateType, handleDelete: delType } = useGenericCRUD(setTypes, 'id_type');
  const { handleAdd: addDesig, handleUpdate: updateDesig, handleDelete: delDesig } = useGenericCRUD(setDesignations, 'id_diag');
  const { handleAdd: addFam, handleUpdate: updateFam, handleDelete: delFam } = useGenericCRUD(setFamilies, 'id_family');
  const { handleAdd: addTpl, handleUpdate: updateTpl, handleDelete: delTpl } = useGenericCRUD(setTemplates, 'id_templates');
  const { handleAdd: addZone, handleUpdate: updateZone, handleDelete: delZone } = useGenericCRUD(setZones, 'id_zone');
  const { handleAdd: addTech, handleUpdate: updateTech, handleDelete: delTech } = useGenericCRUD(setTechnicians, 'id');
  const { handleAdd: addOp, handleUpdate: updateOp, handleDelete: delOp } = useGenericCRUD(setOperations, 'id');

  return {
    handleAddCompGroup: addCompGrp,
    handleUpdateCompGroup: updateCompGrp,
    handleDeleteCompGroup: delCompGrp,

    handleAddCompFamily: addCompFam,
    handleUpdateCompFamily: updateCompFam,
    handleDeleteCompFamily: delCompFam,

    handleAddCompTemplate: addCompTpl,
    handleUpdateCompTemplate: updateCompTpl,
    handleDeleteCompTemplate: delCompTpl,

    handleAddPartType: addPartType,
    handleUpdatePartType: updatePartType,
    handleDeletePartType: delPartType,

    handleAddPartDesignation: addPartDesig,
    handleUpdatePartDesignation: updatePartDesig,
    handleDeletePartDesignation: delPartDesig,

    handleAddType: addType,
    handleUpdateType: updateType,
    handleDeleteType: delType,

    handleAddDesignation: addDesig,
    handleUpdateDesignation: updateDesig,
    handleDeleteDesignation: delDesig,
    handleAddDiagnostic: addDesig,
    handleUpdateDiagnostic: updateDesig,
    handleDeleteDiagnostic: delDesig,

    handleAddFamily: addFam,
    handleUpdateFamily: updateFam,
    handleDeleteFamily: delFam,

    handleAddTemplate: addTpl,
    handleUpdateTemplate: updateTpl,
    handleDeleteTemplate: delTpl,

    handleAddZone: addZone,
    handleUpdateZone: updateZone,
    handleDeleteZone: delZone,

    handleAddTechnician: addTech,
    handleUpdateTechnician: updateTech,
    handleDeleteTechnician: delTech,

    handleAddOperation: addOp,
    handleUpdateOperation: updateOp,
    handleDeleteOperation: delOp,
  };
}
