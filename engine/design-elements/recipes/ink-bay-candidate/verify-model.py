# SPDX-License-Identifier: MIT
# Independent rational interval/centering oracle with declared synthetic metrics.
from pathlib import Path
from fractions import Fraction as F
import subprocess,json
R=Path(__file__).resolve().parent
js="""import{createRows}from'./lib/model.mjs';import{layoutRows}from'./lib/layout.mjs';let out=[];for(let k=0;k<240;k++){const row={key:'r',headline:'FORM'+('X'.repeat(k%7)),side:k%2?'left':'right',notes:['NOTES','DEMO']},o={width:700+(k%13)*23,padding:12+k%17,rowHeight:80+k%5*8,rowGap:k%9,headlineSize:30+k%7,noteSize:10+k%4,noteLeading:18+k%3,innerGap:8+k%17,bayMinWidth:100,ink:'#112233',noteInk:'#445566'};const p=layoutRows(createRows({rows:[row]}),o,(s,z)=>({left:.25,right:s.length*z/2,ascent:z*3/4,descent:z/4,advance:s.length*z/2+.25}));out.push({row,o,p})}console.log(JSON.stringify(out))"""
items=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=R,text=True));checks=0
for case in items:
 r,o,p=case['row'],case['o'],case['p'];head=p['rows'][0]['headline'];z=F(o['headlineSize']);inkw=F(1,4)+len(r['headline'])*z/2
 left=F(o['padding'])if r['side']=='left'else F(o['width']-o['padding'])-inkw;right=left+inkw
 bayl=right+o['innerGap']if r['side']=='left'else F(o['padding']);bayr=F(o['width']-o['padding'])if r['side']=='left'else left-o['innerGap'];t=F(o['padding'])+(o['rowHeight']-z)/2
 for value,expected in [(head['ink']['left'],left),(head['ink']['right'],right),(head['ink']['top'],t),(head['ink']['bottom'],t+z),(p['rows'][0]['bay']['left'],bayl),(p['rows'][0]['bay']['right'],bayr),(p['rows'][0]['bay']['width'],bayr-bayl)]:assert abs(F(value)-expected)<F(1,100000000);checks+=1
 nz=F(o['noteSize']);block=F(o['noteLeading'])+nz;ntop=F(o['padding'])+(o['rowHeight']-block)/2
 for i,n in enumerate(p['rows'][0]['notes']):
  for value,expected in [(n['ink']['left'],bayl),(n['ink']['right'],bayl+F(1,4)+len(r['notes'][i])*nz/2),(n['ink']['top'],ntop+i*o['noteLeading']),(n['ink']['bottom'],ntop+i*o['noteLeading']+nz)]:assert abs(F(value)-expected)<F(1,100000000);checks+=1
 assert p['height']==2*o['padding']+o['rowHeight']
print(json.dumps({'PASS':True,'models':len(items),'rationalScalarChecks':checks,'method':'Independent Fraction occupied interval, opposite complement and grouped baseline centering; synthetic metric oracle not font proof'}))
