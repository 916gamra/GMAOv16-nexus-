import glob

files = glob.glob("src/presentation/pages/**/*.jsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Find `})\n            </tbody>` and replace with `})}\n            </tbody>`
    content = content.replace("})\n            </tbody>", "})}\n            </tbody>")
    content = content.replace("})\n          </tbody>", "})}\n          </tbody>")

    # In SettingsView and UtilisateursView, the issue was `))\n                        }`
    # Wait, in those files it was `activityLogs.map((log) => ( <tr>...</tr> ))`. 
    # So it's `))}` instead of `))`.
    content = content.replace("))\n                        }", "))}\n                        }")
    content = content.replace("))\n                      }", "))}\n                      }")

    with open(file_path, "w") as f:
        f.write(content)

print("Done")
