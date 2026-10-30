from pathlib import Path
import argparse,json,hashlib
p=argparse.ArgumentParser();p.add_argument('--font-dir',type=Path,required=True);root=p.parse_args().font_dir.resolve();base=Path(__file__).parent
m=json.loads((base/'font-inputs.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for row in m['originalInputs']:
 f=root/row['filename']
 if not f.is_file() or sha(f)!=row['sha256']:raise ValueError('Missing or mismatched original font: '+row['filename'])
if not m['expectedOutputs'] or {r['filename']for r in m['expectedOutputs']}!=set(m['outputNames']):raise ValueError('Incomplete output identity contract')
for row in m['expectedOutputs']:
 if sha(root/row['filename'])!=row['sha256']:raise ValueError('Derived/output font identity mismatch: '+row['filename'])
print('Original and output font identities verified')
