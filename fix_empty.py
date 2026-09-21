import os
import glob
import re

files = glob.glob("src/presentation/pages/**/*.jsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Replacements
    content = content.replace("displayedData.length === 0", "rawDisplayedData.length === 0")
    content = content.replace("displayedMouvements.length === 0", "(pageSize === 0 ? sortedMouvements : sortedMouvements.slice(startIndex, startIndex + effectivePageSize)).length === 0")
    content = content.replace("displayedStock.length === 0", "rawDisplayedStock.length === 0")
    
    # We already changed to `&& rawDisplayedData.length === 0`, let's fix it
    content = content.replace("rawDisplayedData.length === 0 && rawDisplayedData.length === 0", "rawDisplayedData.length === 0")

    with open(file_path, "w") as f:
        f.write(content)

print("Done")
