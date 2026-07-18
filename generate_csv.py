import json
import csv

with open('peta_sls_202511708.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('peta_sls_template.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['IDSUBSLS', 'IDSLS', 'KDKEC', 'KDDESA', 'NMKEC', 'NMDESA', 'NMSLS'])
    
    for feature in data['features']:
        props = feature['properties']
        writer.writerow([
            props.get('idsubsls'),
            props.get('idsls'),
            props.get('kdkec'),
            props.get('kddesa'),
            props.get('nmkec'),
            props.get('nmdesa'),
            props.get('nmsls')
        ])
print("CSV generated.")
