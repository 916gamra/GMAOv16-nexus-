import json
import re

# 1. Family: Moteur Electrique
FAMILIES_DATA = [
  {
    "id_family": "FAM-MOTEUR-ELEC",
    "id_comp_family": "FAM-MOTEUR-ELEC",
    "libelle": "Moteur Electrique",
    "code": "MOTEUR",
    "componentCode": "MOT",
    "type": "Moteur",
    "description": "Family Moteur Electrique - Tous les moteurs asynchrones triphasés du parc - Principe électromagnétique"
  }
]

# 2. Extract templates and entrepot components from user prompt
# Let's read the full objects provided in the user prompt:
# We will define TEMPLATES_DATA and ENTREPOT_COMPONENTS_DATA directly from the user's prompt.

EOF_CHECK = True
