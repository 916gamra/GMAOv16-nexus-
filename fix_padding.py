import os
import glob

files = [
    "src/presentation/pages/machines/FamilyView.jsx",
    "src/presentation/pages/machines/TemplatesView.jsx",
    "src/presentation/pages/machines/MachinesRegisteredView.jsx",
    "src/presentation/pages/warehouse/MouvementsJournalTable.jsx",
    "src/presentation/pages/warehouse/EntrepotView.jsx",
    "src/presentation/pages/referentiel/ZonesView.jsx",
    "src/presentation/pages/referentiel/TypeView.jsx"
]

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # The block looks something like:
    #   const displayedData = useMemo(() => {
    #     if (pageSize === 0 || rawDisplayedData.length >= pageSize) return rawDisplayedData;
    #     const padded = [...rawDisplayedData];
    #     for (let i = 0; i < pageSize - rawDisplayedData.length; i++) {
    
    # Or in MouvementsJournalTable:
    #   const displayedData = useMemo(() => {
    #     if (pageSize === 0 || raw.length >= pageSize) return raw;
    #     const padded = [...raw];
    #     for (let i = 0; i < pageSize - raw.length; i++) {

    # Let's replace the whole useMemo block pattern
    import re
    # We will search for:
    # if (pageSize === 0 || raw(.*?).length >= pageSize) return raw(.*?);
    # const padded = \[...raw(.*?)\];
    # for \(let i = 0; i < pageSize - raw(.*?).length; i\+\+\) \{
    
    content = re.sub(
        r'if \(pageSize === 0 \|\| (.*?)\.length >= pageSize\) return \1;\n\s*const padded = \[\.\.\.\1\];\n\s*for \(let i = 0; i < pageSize - \1\.length; i\+\+\) \{',
        r'const minRows = 20;\n    if (\1.length >= minRows) return \1;\n    const padded = [...\1];\n    for (let i = 0; i < minRows - \1.length; i++) {',
        content,
        flags=re.MULTILINE
    )

    # We also need to fix the dependency array if it has pageSize
    content = re.sub(
        r'\}, \[(rawDisplayedData|raw), pageSize\]\);',
        r'}, [\1]);',
        content
    )

    with open(file_path, "w") as f:
        f.write(content)

print("Done")
