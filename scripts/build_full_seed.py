# scripts/build_full_seed.py
import json
import re
from scripts.data_motors_part1 import MOTORS_PART1
from scripts.data_motors_part2 import MOTORS_PART2
from scripts.data_motors_part3 import MOTORS_PART3
from scripts.data_motors_part4 import MOTORS_PART4

from scripts.data_templates_part1 import TEMPLATES_PART1
from scripts.data_templates_part2 import TEMPLATES_PART2
from scripts.data_templates_part3 import TEMPLATES_PART3
from scripts.data_templates_part4 import TEMPLATES_PART4

def build():
    all_tpl = TEMPLATES_PART1 + TEMPLATES_PART2 + TEMPLATES_PART3 + TEMPLATES_PART4
    all_mot = MOTORS_PART1 + MOTORS_PART2 + MOTORS_PART3 + MOTORS_PART4

    print(f"Loaded {len(all_tpl)} templates and {len(all_mot)} motors.")

    with open("src/data/seedData.js", "r", encoding="utf-8") as f:
        src = f.read()

    # 1. Extract prefix before INITIAL_COMP_FAMILIES
    prefix_match = re.search(r"export const INITIAL_COMP_FAMILIES = \[", src)
    if not prefix_match:
        raise ValueError("INITIAL_COMP_FAMILIES not found")
    prefix_code = src[:prefix_match.start()]

    # 2. Extract part types & designations (between INITIAL_COMP_TEMPLATES and INITIAL_WAREHOUSE_ITEMS)
    part_types_match = re.search(r"export const INITIAL_PART_TYPES = \[", src)
    wh_items_match = re.search(r"export const INITIAL_WAREHOUSE_ITEMS = \[", src)
    part_section = src[part_types_match.start():wh_items_match.start()]

    # 3. Extract middle section (from generateWarehouseItemCode up to INITIAL_ENTREPOT_COMPONENTS)
    gen_code_match = re.search(r"export const generateWarehouseItemCode =", src)
    entrepot_comp_match = re.search(r"export const INITIAL_ENTREPOT_COMPONENTS = \[", src)
    middle_section = src[gen_code_match.start():entrepot_comp_match.start()]

    # Check for missing machines in INITIAL_MACHINES_REGISTERED
    mach_reg_match = re.search(r"export const INITIAL_MACHINES_REGISTERED = \[\n", middle_section)
    if not mach_reg_match:
        raise ValueError("INITIAL_MACHINES_REGISTERED not found in middle section")

    existing_machs = set(re.findall(r'"id_machine_registered":\s*"([^"]+)"', middle_section))
    missing_machs = []
    for m in all_mot:
        mid = m["id_machine"]
        if mid and mid not in existing_machs and mid not in [x["id_machine_registered"] for x in missing_machs]:
            missing_machs.append({
                "id_machine_registered": mid,
                "id": mid,
                "designation": f"Machine {mid}",
                "id_family": "FAM-MEC",
                "id_templates": "TPL-MACHINE",
                "id_zone_default": m.get("zone", "Atelier"),
                "technician": "Rachid",
                "status": "En Service",
                "statut": "Actif",
                "id_blueprint": ""
            })

    if missing_machs:
        print(f"Adding {len(missing_machs)} missing machines to INITIAL_MACHINES_REGISTERED")
        insert_pos = mach_reg_match.end()
        missing_json = ",\n".join(json.dumps(m, ensure_ascii=False, indent=2) for m in missing_machs) + ",\n"
        middle_section = middle_section[:insert_pos] + missing_json + middle_section[insert_pos:]

    # Build INITIAL_COMP_FAMILIES
    comp_families = [
        {
            "id_comp_family": "FAM-MOTEUR-ELEC-001",
            "id_family": "FAM-MOTEUR-ELEC-001",
            "libelle": "Moteur Electrique",
            "code": "MOTEUR",
            "type": "Moteur",
            "description": "Type Moteur Electrique - Tous les moteurs asynchrones triphasés du parc - Principe électromagnétique"
        },
        {
            "id_comp_family": "FAM-MOTEUR-ELEC",
            "id_family": "FAM-MOTEUR-ELEC",
            "libelle": "Moteur Electrique",
            "code": "MOTEUR",
            "type": "Moteur",
            "description": "Type Moteur Electrique - Tous les moteurs asynchrones triphasés du parc - Principe électromagnétique"
        }
    ]

    # Standardize templates (Virtual Twins)
    comp_templates = []
    for tpl in all_tpl:
        tpl_obj = {
            "id_template": tpl.get("id_template") or tpl.get("id_templates") or tpl.get("id"),
            "id_templates": tpl.get("id_templates") or tpl.get("id_template") or tpl.get("id"),
            "id": tpl.get("id") or tpl.get("id_template"),
            "code": tpl.get("code", ""),
            "ref": tpl.get("ref", ""),
            "libelle": tpl.get("libelle", ""),
            "id_family": tpl.get("id_family", "FAM-MOTEUR-ELEC-001"),
            "type": tpl.get("type", "Moteur Asynchrone Triphasé"),
            "specs": tpl.get("specs", {})
        }
        comp_templates.append(tpl_obj)

    # Standardize motors (Real Twins)
    warehouse_items = []
    entrepot_components = []

    for m in all_mot:
        code = m.get("code", "").strip()
        ref = m.get("ref", "").strip()
        mach = m.get("id_machine", "").strip()
        base_libelle = m.get("libelle", "").strip()
        # Unique designation for each element code
        unique_designation = f"{base_libelle} ({code})" if f"({code})" not in base_libelle else base_libelle
        passport_id = m.get("id") or f"ID-{code.upper().replace(' ', '')}-REF-{ref.replace('-', '')}-{mach.replace('-', '')}-ZONE-{m.get('zone', 'ATELIER').upper().replace(' ', '-')}"

        wh_item = {
            "id": passport_id,
            "id_warehouse_item": code,
            "code": code,
            "ref": ref,
            "designation": unique_designation,
            "libelle": unique_designation,
            "nature": "COMPONENT",
            "id_family": m.get("id_family", "FAM-MOTEUR-ELEC-001"),
            "id_template": m.get("id_template", ""),
            "id_templates": m.get("id_templates", m.get("id_template", "")),
            "id_type": "",
            "id_diag": "",
            "rattachement_type": "MACHINE",
            "id_machine": mach,
            "id_machine_registered": mach,
            "emplacement": mach,
            "zone": m.get("zone", ""),
            "id_zone": m.get("zone", ""),
            "status": m.get("etat", "Actif"),
            "statut": m.get("etat", "Actif"),
            "etat": m.get("etat", "Actif"),
            "stockInitial": 1,
            "seuil": 0,
            "quantite": 1,
            "technician": "Soufiane" if m.get("historique_bobinage") else "Rachid",
            "remarques": f"Moteur {code} rattaché à la machine {mach} ({m.get('zone', '')})",
            "historique_bobinage": m.get("historique_bobinage", [])
        }
        warehouse_items.append(wh_item)

        ent_comp = {
            "id": passport_id,
            "id_entrepot": passport_id,
            "id_warehouse_item": code,
            "code": code,
            "ref": ref,
            "libelle": unique_designation,
            "designation": unique_designation,
            "id_family": m.get("id_family", "FAM-MOTEUR-ELEC-001"),
            "id_template": m.get("id_template", ""),
            "id_templates": m.get("id_templates", m.get("id_template", "")),
            "id_machine": mach,
            "id_machine_registered": mach,
            "emplacement": mach,
            "zone": m.get("zone", ""),
            "id_zone": m.get("zone", ""),
            "position": f"Moteur {code}",
            "nature": "COMPONENT",
            "etat": m.get("etat", "Actif"),
            "status": m.get("etat", "Actif"),
            "quantite": 1,
            "historique_bobinage": m.get("historique_bobinage", [])
        }
        entrepot_components.append(ent_comp)

    # Reassemble complete seedData.js
    output_parts = [
        prefix_code.rstrip(),
        "\n\nexport const INITIAL_COMP_FAMILIES = " + json.dumps(comp_families, ensure_ascii=False, indent=2) + ";\n\n",
        "export const INITIAL_COMP_TEMPLATES = " + json.dumps(comp_templates, ensure_ascii=False, indent=2) + ";\n\n",
        part_section.rstrip(),
        "\n\nexport const INITIAL_WAREHOUSE_ITEMS = " + json.dumps(warehouse_items, ensure_ascii=False, indent=2) + ";\n\n",
        middle_section.rstrip(),
        "\n\nexport const INITIAL_ENTREPOT_COMPONENTS = " + json.dumps(entrepot_components, ensure_ascii=False, indent=2) + ";\n"
    ]

    final_content = "".join(output_parts)
    with open("src/data/seedData.js", "w", encoding="utf-8") as f:
        f.write(final_content)

    print(f"Wrote {len(final_content)} characters to src/data/seedData.js successfully!")

if __name__ == "__main__":
    build()
