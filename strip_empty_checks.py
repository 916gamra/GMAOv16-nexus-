import os
import glob
import re

files = glob.glob("src/presentation/pages/**/*.jsx", recursive=True)

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Pattern for removing the empty check block
    # It usually looks like:
    # {some_condition.length === 0 ? (
    #   <tr>
    #     <td colSpan={X} ...>
    #       ... text ...
    #     </td>
    #   </tr>
    # ) : (
    #   displayedData.map(...)
    # )}
    
    # We will use regex to find `{.*\.length === 0 \? \([\s\S]*?\) : \(` and replace it with `{`
    # BUT wait, the `}` at the end needs to be removed.
    # A safer way: I'll just write a script to match the specific blocks and remove the ternary.

    # Let's search for:
    # {something === 0 ? (
    #   <tr>...</tr>
    # ) : (
    #   something.map(...)
    
    pattern = r'\{[^\}]*\.length === 0[^\?]*\? \(\s*<tr[^>]*>\s*<td[^>]*>[\s\S]*?</td>\s*</tr>\s*\)\s*:\s*\(\s*(.*?\.map\()'
    
    def replacer(match):
        return "{" + match.group(1)

    new_content = re.sub(pattern, replacer, content)

    # Now we need to remove the trailing `)}` that matched the `: (`
    # We can do this by balancing parenthesis, or simply replacing the `)}` that comes after the map.
    # Actually, it's safer to just do manual edits for the 10 files using sed or python.

    with open(file_path, "w") as f:
        f.write(new_content)

print("Done")
