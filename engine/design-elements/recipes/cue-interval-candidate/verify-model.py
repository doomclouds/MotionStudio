"""Independent rational/integer oracle over synthesized cue families; no media input."""
import subprocess,json
from pathlib import Path
from fractions import Fraction
ROOT=Path(__file__).resolve().parent
code="""import{createCueModel,inspectCueModel,intervalGeometry}from'./lib/model.mjs';let out=[];for(let k=0;k<256;k++){let t=200,cues=[];for(let j=0;j<1+k%24;j++){let duration=1+((k*311+j*127)%5000);cues.push({id:j+1,startMs:t,endMs:t+duration,lines:j%2?['Word '+j,'Second line']:['Cue '+j]});t+=duration+(k+j)%403;}const durationMs=Math.max(1000,t+1),playheadMs=(k*997)%durationMs,input={durationMs,playheadMs,selectedId:1+k%cues.length,cues},h=createCueModel(input),startMs=k%(durationMs-1),endMs=durationMs,view={startMs,endMs,x:-13.25,width:861.5};out.push({input,view,model:inspectCueModel(h),geometry:intervalGeometry(h,view)})}console.log(JSON.stringify(out));"""
r=subprocess.run(['node','--input-type=module','-e',code],cwd=ROOT,capture_output=True,text=True,check=True);rows=json.loads(r.stdout);count=0
fmt=lambda x:f'{x//3600000:02d}:{x//60000%60:02d}:{x//1000%60:02d},{x%1000:03d}'
for row in rows:
 s=row['input'];m=row['model'];v=row['view'];active=next((q['id']for q in s['cues']if q['startMs']<=s['playheadMs']<q['endMs']),None)
 assert m['activeId']==active and m['selectedId']==s['selectedId'];assert m['playheadLabel']==fmt(s['playheadMs'])
 for q,derived in zip(s['cues'],m['cues']):
  n=len(' '.join(q['lines']));d=q['endMs']-q['startMs'];expected=(2*n*10000+d)//(2*d);assert derived['cpsTenths']==expected and derived['characters']==n;assert derived['startLabel']==fmt(q['startMs'])and derived['endLabel']==fmt(q['endMs']);count+=1
 expected=[q for q in s['cues']if q['endMs']>v['startMs']and q['startMs']<v['endMs']];assert len(expected)==len(row['geometry'])
 for q,g in zip(expected,row['geometry']):
  left=Fraction(str(v['x']))+Fraction(str(v['width']))*Fraction(max(q['startMs'],v['startMs'])-v['startMs'],v['endMs']-v['startMs']);right=Fraction(str(v['x']))+Fraction(str(v['width']))*Fraction(min(q['endMs'],v['endMs'])-v['startMs'],v['endMs']-v['startMs']);assert abs(float(left)-g['left'])<1e-9 and abs(float(right)-g['right'])<1e-9
print(json.dumps({'models':len(rows),'cues':count,'oracle':'Python integer CPS/timecode + Fraction clipped geometry','passed':True}))
