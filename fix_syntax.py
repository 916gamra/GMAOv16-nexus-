import os
import glob
import re

files = [
    "src/presentation/pages/referentiel/CompFamilyView.jsx",
    "src/presentation/pages/referentiel/CompTemplateView.jsx",
    "src/presentation/pages/referentiel/PartDesignationView.jsx",
    "src/presentation/pages/referentiel/PartTypeView.jsx",
    "src/presentation/pages/settings/SettingsView.jsx",
    "src/presentation/pages/stock/StockView.jsx",
    "src/presentation/pages/utilisateurs/UtilisateursView.jsx",
    "src/presentation/pages/warehouse/MouvementsJournalTable.jsx"
]

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # The error is `)}` right before `</tbody>`.
    # It might be `})` followed by `)}`
    # Let's replace `})\n              )}\n            </tbody>` with `})\n            }\n            </tbody>`
    
    # regex to find it:
    content = re.sub(r'\}\)\s*\)\}\s*</tbody>', '})\n            }\n            </tbody>', content)
    
    # Sometimes it's `})\n              )}\n` without tbody?
    # Let's just fix it manually if it doesn't match exactly. Let's see what happens.
    
    with open(file_path, "w") as f:
        f.write(content)

print("Done")
