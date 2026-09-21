import re
def fix(file):
    with open(file, "r") as f:
        content = f.read()
    
    # In SettingsView:
    # {activityLogs.map((log) => (
    # ...
    # ))
    # )}
    # Replace `))\n                        )}` with `))\n                        }`
    content = content.replace("))\n                        )}", "))\n                        }")
    
    with open(file, "w") as f:
        f.write(content)
        
fix("src/presentation/pages/settings/SettingsView.jsx")
fix("src/presentation/pages/utilisateurs/UtilisateursView.jsx")
print("Done")
