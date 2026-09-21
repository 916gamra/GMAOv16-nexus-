import os
import glob
import re

files = glob.glob("src/presentation/pages/**/*.jsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # The error is `}\n            </tbody>` because we replaced `)}` with `}` earlier, 
    # but since `{displayedData.map(() => { ... })}` is all we need, the `}` is extra.
    # We should have `})}\n            </tbody>`
    
    # Wait, the end of map is `})`.
    # Let's search for `})\n            }\n            </tbody>` and replace with `})\n            </tbody>`
    
    content = content.replace("})\n            }\n            </tbody>", "})\n            </tbody>")
    content = content.replace("})\n          }\n          </tbody>", "})\n          </tbody>")
    content = content.replace("})\n              }\n            </tbody>", "})\n            </tbody>")

    # In SettingsView: let's see what's wrong with line 2464
    
    with open(file_path, "w") as f:
        f.write(content)

print("Done")
