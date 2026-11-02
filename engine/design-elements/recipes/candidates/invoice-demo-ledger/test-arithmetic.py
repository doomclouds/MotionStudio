"""SPDX-License-Identifier: Apache-2.0. Independent Fraction reference, synthetic data only."""
from pathlib import Path
from fractions import Fraction
import json,random,subprocess
r=Path(__file__).resolve().parent;rng=random.Random(731)
cases=[]
for i in range(1000):
 rows=[{'title':'Synthetic row','note':'Arithmetic test only.','quantity':rng.randint(1,99),'rateCents':rng.randint(0,9999)} for _ in range(rng.randint(1,6))]
 cases.append({'items':rows,'retainerBps':rng.randint(0,10000),'taxBps':rng.randint(0,10000)})
code="import fs from 'node:fs';import {computeInvoice} from "+json.dumps((r/'src/model.mjs').as_uri())+";console.log(JSON.stringify(JSON.parse(fs.readFileSync(0,'utf8')).map(x=>computeInvoice(x.items,x.retainerBps,x.taxBps))))"
result=subprocess.run(['node','--input-type=module','-e',code],input=json.dumps(cases),text=True,capture_output=True,check=True)
models=json.loads(result.stdout)
def round_half_up(n,b):
 x=Fraction(n*b,10000)+Fraction(1,2);return x.numerator//x.denominator
for c,m in zip(cases,models):
 subtotal=sum(r['quantity']*r['rateCents']for r in c['items']);retainer=round_half_up(subtotal,c['retainerBps']);net=subtotal-retainer;tax=round_half_up(net,c['taxBps'])
 assert [m[k]for k in ['subtotal','retainer','net','tax','total']]==[subtotal,retainer,net,tax,net+tax]
print(json.dumps({'status':'PASS','fractionReferenceCases':len(cases)}))
