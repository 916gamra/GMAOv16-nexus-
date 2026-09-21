import os

target_dir = "src/presentation/pages"

old_shadows = [
    "shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300",
    "shadow-xs"
]

new_shadow = "shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out"

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith(".jsx") or file.endswith(".tsx"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            updated = False
            if "Top Banner" in content or "group/header" in content or "Header Card" in content:
                for os_str in old_shadows:
                    if os_str in content:
                        content = content.replace(os_str, new_shadow)
                        updated = True
                
                if updated:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Updated header in: {path}")

print("Header shadow update completed.")
