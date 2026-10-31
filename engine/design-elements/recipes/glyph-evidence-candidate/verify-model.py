# SPDX-License-Identifier: Apache-2.0
from fractions import Fraction as F
from pathlib import Path
import os,json,subprocess
ROOT=Path(__file__).absolute().parent;models=json.loads(subprocess.check_output(['node',str(ROOT/'verify-model.mjs')]));faces={f['id']:f for f in json.loads((Path(os.environ['GE_RESOURCE_DIR'])/'outlines.json').read_text())['faces']};count=0
for m in models:
 f=faces[m['instance']];scale=F(m['size'],f['unitsPerEm']);at=F(0);bounds=[];assert m['axes']==f['axes'] and m['unitsPerEm']==f['unitsPerEm']
 for char,c in zip(m['text'],m['glyphs'],strict=True):
  g=f['glyphs'][str(ord(char))];adv=F(str(g['advance']))*scale;assert c['unicode']==g['unicode'] and c['name']==g['name'] and c['advanceUnits']==g['advance'];assert abs(float(at)-c['x'])<1e-9 and abs(float(adv)-c['advancePx'])<1e-9
  if g['bounds']:
   x0,y0,x1,y1=map(lambda n:F(str(n)),g['bounds']);bounds.append([at+x0*scale,-y1*scale,at+x1*scale,-y0*scale])
  at+=adv;count+=1
 assert abs(float(at)-m['advance'])<1e-9
 for key,v in zip(['left','top','right','bottom'],[min(b[0]for b in bounds),min(b[1]for b in bounds),max(b[2]for b in bounds),max(b[3]for b in bounds)]):assert abs(float(v)-m['ink'][key])<1e-9
print(json.dumps({'status':'PASS','models':len(models),'glyphs':count,'method':'independent Python Fraction versus JS model; not shaping'}))
