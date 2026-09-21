import sys

def process(file):
    with open(file, "r") as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if "setSearch('')" in line:
            # We are at the onClick line.
            # The structure is:
            # onClick={() => setSearch('')}
            # className="..."
            # >
            #   <X className="..." />
            # </button>
            # <--- Insert `            )}` here
            lines.insert(i + 5, "            )}\n")
            break
            
    with open(file, "w") as f:
        f.writelines(lines)

process("src/presentation/pages/referentiel/PartDesignationView.jsx")
process("src/presentation/pages/referentiel/PartTypeView.jsx")
print("Done")
