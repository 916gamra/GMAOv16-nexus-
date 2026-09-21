import fs from 'fs';

const INITIAL_FAMILIES = [
  { "id_family": "FAM-DIVE", "libelle": "Divers", "code": "DIVE" },
  { "id_family": "FAM-EMBA", "libelle": "Emballage", "code": "EMBA" },
  { "id_family": "FAM-FINI", "libelle": "Finition", "code": "FINI" },
  { "id_family": "FAM-FRAI", "libelle": "Fraiseuse", "code": "FRAI" },
  { "id_family": "FAM-MANU", "libelle": "Manutention", "code": "MANU" },
  { "id_family": "FAM-MEUL", "libelle": "Meule", "code": "MEUL" },
  { "id_family": "FAM-PERC", "libelle": "Perceuse", "code": "PERC" },
  { "id_family": "FAM-PRES", "libelle": "Presse", "code": "PRES" },
  { "id_family": "FAM-RIVE", "libelle": "Rivetage", "code": "RIVE" },
  { "id_family": "FAM-SCIE", "libelle": "Scie", "code": "SCIE" },
  { "id_family": "FAM-SERT", "libelle": "Sertissage", "code": "SERT" },
  { "id_family": "FAM-SOUD", "libelle": "Soudage", "code": "SOUD" },
  { "id_family": "FAM-TOUR", "libelle": "Tour", "code": "TOUR" }
];

const INITIAL_TEMPLATES = [
  { "id_templates": "TPL-FRAISEUSE", "libelle": "Fraiseuse", "id_family": "FAM-FRAI", "famille_lib": "Fraiseuse" },
  { "id_templates": "TPL-TOURPARALLEL", "libelle": "Tour paralléle", "id_family": "FAM-TOUR", "famille_lib": "Tour" },
  { "id_templates": "TPL-RECTIFIEUSEP", "libelle": "Réctifieuse paralléle", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-SCIEMECANIQU", "libelle": "Scie mécanique", "id_family": "FAM-SCIE", "famille_lib": "Scie" },
  { "id_templates": "TPL-PERCEUSE", "libelle": "Perçeuse", "id_family": "FAM-PERC", "famille_lib": "Perceuse" },
  { "id_templates": "TPL-MOTEURMEULE", "libelle": "Moteur Meule", "id_family": "FAM-MEUL", "famille_lib": "Meule" },
  { "id_templates": "TPL-POSTESOUDAGE", "libelle": "Poste soudage", "id_family": "FAM-SOUD", "famille_lib": "Soudage" },
  { "id_templates": "TPL-TOURDEREPOUS", "libelle": "Tour de repoussage", "id_family": "FAM-TOUR", "famille_lib": "Tour" },
  { "id_templates": "TPL-TOURDESATINA", "libelle": "Tour de Satinage", "id_family": "FAM-TOUR", "famille_lib": "Tour" },
  { "id_templates": "TPL-MONTECHARGE", "libelle": "Monte charge", "id_family": "FAM-MANU", "famille_lib": "Manutention" },
  { "id_templates": "TPL-PRESSEHYDRAU", "libelle": "Presse Hydraulique", "id_family": "FAM-PRES", "famille_lib": "Presse" },
  { "id_templates": "TPL-PRESSEDINJEC", "libelle": "Presse d'injection bakelite", "id_family": "FAM-PRES", "famille_lib": "Presse" },
  { "id_templates": "TPL-REFROIDISSEU", "libelle": "Refroidisseur  d'eau Bakélite", "id_family": "FAM-MANU", "famille_lib": "Manutention" },
  { "id_templates": "TPL-BROYEUR", "libelle": "Broyeur", "id_family": "FAM-MANU", "famille_lib": "Manutention" },
  { "id_templates": "TPL-PRESSEMECANI", "libelle": "Presse mécanique", "id_family": "FAM-PRES", "famille_lib": "Presse" },
  { "id_templates": "TPL-TOURDEDETOUR", "libelle": "Tour de détourage", "id_family": "FAM-TOUR", "famille_lib": "Tour" },
  { "id_templates": "TPL-PRESSECHUTEA", "libelle": "Presse chute aluminuim", "id_family": "FAM-PRES", "famille_lib": "Presse" },
  { "id_templates": "TPL-TOURDEPOLISS", "libelle": "Tour de polissage", "id_family": "FAM-TOUR", "famille_lib": "Tour" },
  { "id_templates": "TPL-RAVIVAGE", "libelle": "Ravivage", "id_family": "FAM-FINI", "famille_lib": "Finition" },
  { "id_templates": "TPL-SERTISSEUSE", "libelle": "Sertisseuse", "id_family": "FAM-SERT", "famille_lib": "Sertissage" },
  { "id_templates": "TPL-TARAUDEUSE", "libelle": "Taraudeuse", "id_family": "FAM-PERC", "famille_lib": "Perceuse" },
  { "id_templates": "TPL-CISAILLE", "libelle": "Cisaille", "id_family": "FAM-PRES", "famille_lib": "Presse" },
  { "id_templates": "TPL-MACHINETRACA", "libelle": "Machine traçage circulaire", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-MACHINEDECOR", "libelle": "Machine décoration", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-PORTEBOBINE", "libelle": "Porte bobine", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-RIVTEUSEUSE", "libelle": "Rivteuseuse", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-MACHINEEMBAL", "libelle": "Machine emballage", "id_family": "FAM-EMBA", "famille_lib": "Emballage" },
  { "id_templates": "TPL-MACHINEDECER", "libelle": "Machine de cerclage", "id_family": "FAM-EMBA", "famille_lib": "Emballage" },
  { "id_templates": "TPL-SCOTCHEUSE", "libelle": "Scotcheuse", "id_family": "FAM-EMBA", "famille_lib": "Emballage" },
  { "id_templates": "TPL-POICONAGE", "libelle": "Poiçonage", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-VISSEUSE", "libelle": "Visseuse", "id_family": "FAM-EMBA", "famille_lib": "Emballage" },
  { "id_templates": "TPL-MACHINEDETRA", "libelle": "Machine de traitement de surface", "id_family": "FAM-FINI", "famille_lib": "Finition" },
  { "id_templates": "TPL-FRAISEUSEAUR", "libelle": "Fraiseuse aureillete", "id_family": "FAM-FRAI", "famille_lib": "Fraiseuse" },
  { "id_templates": "TPL-MACHINEDETAN", "libelle": "Machine d'étancheité", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-TONNEAUXVIBR", "libelle": "Tonneaux vibreur", "id_family": "FAM-MANU", "famille_lib": "Manutention" },
  { "id_templates": "TPL-POINCONNEUSE", "libelle": "Poinçonneuse corp auto-cuiss", "id_family": "FAM-PRES", "famille_lib": "Presse" },
  { "id_templates": "TPL-BALANCE", "libelle": "Balance", "id_family": "FAM-EMBA", "famille_lib": "Emballage" },
  { "id_templates": "TPL-PRESSEPOURRO", "libelle": "Presse pour roulement", "id_family": "FAM-PRES", "famille_lib": "Presse" },
  { "id_templates": "TPL-TRANCONNEUSE", "libelle": "Trançonneuse", "id_family": "FAM-SCIE", "famille_lib": "Scie" },
  { "id_templates": "TPL-FOUR", "libelle": "Four", "id_family": "FAM-FINI", "famille_lib": "Finition" },
  { "id_templates": "TPL-DECOUPEDUCAG", "libelle": "découpe du cage cassrole", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-CENTREUSE", "libelle": "Centreuse", "id_family": "FAM-PERC", "famille_lib": "Perceuse" },
  { "id_templates": "TPL-ASPIRATEUR", "libelle": "Aspirateur", "id_family": "FAM-MANU", "famille_lib": "Manutention" },
  { "id_templates": "TPL-COMPRESSEUR", "libelle": "Compresseur", "id_family": "FAM-PRES", "famille_lib": "Presse" },
  { "id_templates": "TPL-ELEVATEUR", "libelle": "Elévateur", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-POMPEDEAU", "libelle": "Pompe d'eau", "id_family": "FAM-MANU", "famille_lib": "Manutention" },
  { "id_templates": "TPL-TAPIECONVOYE", "libelle": "TAPIE CONVOYEUR", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-DIVERS", "libelle": "Divers", "id_family": "FAM-DIVE", "famille_lib": "Divers" },
  { "id_templates": "TPL-MEULE", "libelle": "Meule", "id_family": "FAM-MEUL", "famille_lib": "Meule" },
  { "id_templates": "TPL-RIVETEUSE", "libelle": "Riveteuse", "id_family": "FAM-RIVE", "famille_lib": "Rivetage" },
  { "id_templates": "TPL-TONNEAU", "libelle": "Tonneau", "id_family": "FAM-MANU", "famille_lib": "Manutention" }
];

const INITIAL_ZONES = [
  {
    "code_zone": "DETOURAG",
    "id_zone": "Détourage",
    "libelle": "Détourage",
    "type": "PRODUCTION",
    "description": "DET - Détourage - Cisaillement mécanique - Shear Stress - Élimination bavures après formage"
  },
  {
    "code_zone": "FEMB1",
    "id_zone": "FEMB1",
    "libelle": "FEMB1",
    "type": "PRODUCTION",
    "description": "FEMB1 - Finition Emballage Ligne 1 - Rivetage montage conditionnement"
  },
  {
    "code_zone": "FEMB2",
    "id_zone": "FEMB2",
    "libelle": "FEMB2",
    "type": "PRODUCTION",
    "description": "FEMB2 - Finition Emballage Ligne 2 - Faitouts casseroles"
  },
  {
    "code_zone": "FEMB3",
    "id_zone": "FEMB3",
    "libelle": "FEMB3",
    "type": "PRODUCTION",
    "description": "FEMB3 - Finition Emballage Ligne 3 - Bouilloires"
  },
  {
    "code_zone": "FEMB4",
    "id_zone": "FEMB4",
    "libelle": "FEMB4",
    "type": "PRODUCTION",
    "description": "FEMB4 - Finition Emballage Ligne 4 - Haute cadence"
  },
  {
    "code_zone": "FM",
    "id_zone": "FM",
    "libelle": "FM",
    "type": "PRODUCTION",
    "description": "FM - Fabrication Mécanique - Usinage par enlèvement matière - Tournage, Fraisage, Rectification - Principe: copeau, dépouille, précision"
  },
  {
    "code_zone": "MAINTENA",
    "id_zone": "Maintenance",
    "libelle": "Maintenance",
    "type": "PRODUCTION",
    "description": "Maintenance - Secteur production"
  },
  {
    "code_zone": "POLISSAG",
    "id_zone": "Polissage",
    "libelle": "Polissage",
    "type": "PRODUCTION",
    "description": "POL - Polissage - Abrasion fine - Miroir spéculaire - Inox Aluminium"
  },
  {
    "code_zone": "PRESSEHY",
    "id_zone": "Presse Hydraulique",
    "libelle": "Presse Hydraulique",
    "type": "PRODUCTION",
    "description": "PRH - Presse Hydraulique - Deep Drawing - Flan plat → corps creux - 200T-400T"
  },
  {
    "code_zone": "PRESSEIN",
    "id_zone": "Presse injection",
    "libelle": "Presse injection",
    "type": "PRODUCTION",
    "description": "PRI - Presse Injection Bakélite - Moulage haute pression polymère"
  },
  {
    "code_zone": "REPOUSSA",
    "id_zone": "Repoussage",
    "libelle": "Repoussage",
    "type": "PRODUCTION",
    "description": "REPO - Repoussage - Metal Spinning - Déformation plastique localisée axisymétrique"
  },
  {
    "code_zone": "SATINAGE",
    "id_zone": "Satinage",
    "libelle": "Satinage",
    "type": "PRODUCTION",
    "description": "SAT - Satinage - Rayage contrôlé directionnel - Finition soyeuse non spéculaire"
  },
  {
    "code_zone": "SOUDEUR",
    "id_zone": "Soudeur",
    "libelle": "Soudeur",
    "type": "PRODUCTION",
    "description": "SOUD - Soudeur - Soudure par points"
  }
];

// Read user provided file or embedded data
console.log('Script running...');
