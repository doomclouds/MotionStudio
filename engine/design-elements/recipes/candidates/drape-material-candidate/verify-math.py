#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Independent Python integer PRNG / scalar oracle; no Canvas or font dependency."""
import json,math,subprocess
from pathlib import Path
root=Path(__file__).resolve().parent
rows=json.loads(subprocess.check_output(['node',str(root/'model-samples.mjs')],cwd=root,text=True))
MASK=0xffffffff

def rand(seed):
    a=seed
    while True:
        a=(a+0x6d2b79f5)&MASK
        t=((a^(a>>15))*(1|a))&MASK
        t=((t+(((t^(t>>7))*(61|t))&MASK))^t)&MASK
        yield ((t^(t>>14))&MASK)/4294967296

worst=0; checks=0
for row in rows:
    m=row['model']; r=rand(m['seed']);p={'folds':6+math.floor(next(r)*7),'phase':next(r)*math.tau,'sharp':.7+next(r)*1.5,'tilt':(next(r)*2-1)*.55,'rippleFrequency':2+next(r)*3,'ripplePhase':next(r)*math.tau,'bias':next(r)*.18}
    assert p==m['parameters'],m['seed']
    low=[int(m['low'][i:i+2],16)for i in[1,3,5]];high=[int(m['high'][i:i+2],16)for i in[1,3,5]]
    for s in row['samples']:
        u,v=s['u'],s['v'];b=(1+math.sin((u*p['folds']+p['tilt']*v+p['phase'])*math.tau))/2
        b+=.12*math.sin((u*p['rippleFrequency']+v*1.6)*math.tau+p['ripplePhase'])+p['bias']*math.sin(u*math.pi)
        b=min(1,max(0,(min(1,max(0,b))**p['sharp'])*(1.05-v*.14)))
        err=abs(b-s['brightness']);worst=max(worst,err);assert err<1e-12
        assert [math.floor(a+(z-a)*b+.5)for a,z in zip(low,high)]==s['rgb']
        checks+=1
print(json.dumps({'status':'PASS','models':len(rows),'parameterChecks':len(rows)*7,'scalarSamples':checks,'maxBrightnessDifference':worst,'rgbBytesExact':True,'scope':'Independent scalar formula, not post-vignette PNG pixel identity'}))
