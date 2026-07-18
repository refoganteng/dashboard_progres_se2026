import json

with open('peta_sls_202511708.geojson', 'r', encoding='utf-8') as f:
    data = f.read()

with open('PetaData.html', 'w', encoding='utf-8') as f:
    f.write("<script>\n")
    f.write(f"const GEOJSON_DATA = {data};\n")
    f.write("</script>\n")

print("PetaData.html generated.")
