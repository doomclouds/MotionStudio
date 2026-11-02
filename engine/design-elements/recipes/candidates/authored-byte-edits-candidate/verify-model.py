# SPDX-License-Identifier: BSD-2-Clause
"""Independent Python reverse-edit oracle; no input files, network or private case data."""
import subprocess,json
from pathlib import Path
R=Path(__file__).absolute().parent
code="""import{compileEdits,baseByteEvidence,targetByteEvidence}from'./index.mjs';const rows=[];for(let i=0;i<160;i++){const n=1+i%8,count=128+(i%16)*32,base=Array.from({length:count},(_,j)=>(i*17+j*13)%256),edits=Array.from({length:n},(_,j)=>({at:Math.floor((j+1)*count/(n+1)),remove:j%3===0?0:1+(i+j)%6,insert:j%3===1?[]:Array.from({length:1+(i+j)%9},(_,k)=>(i+j+k*19)%256)}));const input={base,edits,selected:i%n},m=compileEdits(input);rows.push({input,model:m,baseEvidence:base.map((_,j)=>baseByteEvidence(m,j)),targetEvidence:m.target.map((_,j)=>targetByteEvidence(m,j))});}console.log(JSON.stringify(rows));"""
rows=json.loads(subprocess.run(['node','--input-type=module','-e',code],cwd=R,text=True,capture_output=True,check=True).stdout);ops=byteschecked=0
for row in rows:
 q,m=row['input'],row['model'];target=q['base'].copy()
 for e in reversed(q['edits']):target[e['at']:e['at']+e['remove']]=e['insert']
 assert target==m['target'];delta=0
 for e,o in zip(q['edits'],m['operations']):
  assert o['baseStart']==e['at'] and o['baseEnd']==e['at']+e['remove'];assert o['targetStart']==e['at']+delta and o['targetEnd']==e['at']+delta+len(e['insert']);assert o['deltaBefore']==delta;delta+=len(e['insert'])-e['remove'];ops+=1
 assert delta==len(target)-len(q['base'])==m['delta']
 for i,e in enumerate(row['baseEvidence']):
  removed=[j for j,x in enumerate(q['edits'])if x['at']<=i<x['at']+x['remove']]
  if removed:assert e['kind']=='removed-by-authored-edit' and e['operation']==removed[0]
  else:
   d=sum(len(x['insert'])-x['remove']for x in q['edits']if x['at']+x['remove']<=i);assert e['kind']=='retained' and e['targetIndex']==i+d and target[i+d]==q['base'][i]
  byteschecked+=1
 for i,e in enumerate(row['targetEvidence']):
  assert e['value']==target[i]
  if e['kind']=='retained':assert q['base'][e['baseIndex']]==target[i]
  else:assert q['edits'][e['operation']]['insert'][e['insertIndex']]==target[i]
  byteschecked+=1
print(json.dumps({'status':'PASS','models':len(rows),'operations':ops,'byteProvenanceChecks':byteschecked,'oracle':'reverse base-coordinate splice + cumulative delta, independent Python'},indent=2))
