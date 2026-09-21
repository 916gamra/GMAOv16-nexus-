for file in ["src/presentation/pages/referentiel/PartDesignationView.jsx", "src/presentation/pages/referentiel/PartTypeView.jsx"]:
    with open(file, "r") as f:
        content = f.read()
    content = content.replace("              </button>\n            )}", "              </button>")
    with open(file, "w") as f:
        f.write(content)
print("Done")
