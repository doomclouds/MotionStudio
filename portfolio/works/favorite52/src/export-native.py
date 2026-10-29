"""Render native V4 in isolated scene batches, then preserve the original AAC track."""
from pathlib import Path
import subprocess,json,hashlib,os,argparse,datetime
P=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--name',default='favorite52-native-canvas-v2');args=a.parse_args()
if not args.name.replace('-','').replace('_','').isalnum():raise SystemExit('Invalid name')
W=Path(os.environ['FAVORITE52_WORK']); A=Path(os.environ['FAVORITE52_ASSETS'])
O=W/'output'/args.name
O.mkdir(parents=True,exist_ok=False)
SLOTS=[(0,180),(180,369),(369,549),(549,690),(690,795),(795,915),(915,1020),(1020,1200),(1200,1380),(1380,1560)]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(cmd):return subprocess.run(cmd,check=True,capture_output=True,text=True)
def audio(f):
 d=json.loads(run(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-of','json',str(f)]).stdout)
 packets=[{k:x.get(k) for k in ['pts','dts','duration','size','data_hash']} for x in d['packets']]
 pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-map','0:a:0','-f','s16le','-'])
 return {'packets':len(packets),'packetSHA256':hashlib.sha256(json.dumps(packets,sort_keys=True).encode()).hexdigest(),'decodedPCM_SHA256':hashlib.sha256(pcm).hexdigest(),'decodedPCM_bytes':len(pcm)}
report={'status':'running','backend':'native-canvas','startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'batches':[],'normalSpeedWatching':'not performed','listening':'not performed'}
try:
 fingerprint=None;concat=[];allframes=[]
 for i,(start,end) in enumerate(SLOTS):
  label=f'{args.name}-{i:02d}'
  subprocess.run(['node',str(P/'src/render-native.mjs'),'--range',f'{start}:{end}','--name',label],check=True)
  B=W/'tmp/native-batches'/label;d=json.loads((B/'report.json').read_text())
  if d['status']!='passed':raise RuntimeError('Batch failed')
  if fingerprint is not None and fingerprint!=d['fingerprint']:raise RuntimeError('Mixed scene/runtime fingerprint')
  fingerprint=d['fingerprint'];allframes+=d['frames'];concat.append("file '"+str(B/'video.mp4')+"'")
  report['batches'].append({'start':start,'end':end,'report':str(B/'report.json'),'sha256':sha(B/'report.json')})
  (O/'progress.json').write_text(json.dumps(report,indent=2))
 if [f['frame'] for f in allframes]!=list(range(1560)):raise RuntimeError('Missing/duplicate frame')
 C=O/'concat.txt';C.write_text('\n'.join(concat)+'\n');partial=O/'video.partial.mp4';final=O/(args.name+'.mp4')
 run(['ffmpeg','-v','error','-f','concat','-safe','0','-i',str(C),'-i',str(A/'original-v4-audio.m4a'),'-map','0:v:0','-map','1:a:0','-c','copy','-map_metadata','-1','-metadata','title=Made with Motion Studio','-movflags','+faststart',str(partial)])
 probe=json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(partial)]).stdout);v=next(x for x in probe['streams'] if x['codec_type']=='video')
 assert (v['width'],v['height'],v['avg_frame_rate'],int(v['nb_read_frames']))==(1920,1080,'30/1',1560)
 assert abs(float(probe['format']['duration'])-52)<.005
 run(['ffmpeg','-v','error','-i',str(partial),'-f','null','-'])
 aa=audio(A/'original-v4-audio.m4a');ab=audio(partial);assert aa==ab,{'source':aa,'output':ab}
 os.replace(partial,final)
 report.update(status='passed',file=str(final),mp4SHA256=sha(final),bytes=final.stat().st_size,probe=probe,frameCount=1560,fingerprint=fingerprint,frames=allframes,audioSource=aa,audioOutput=ab,audioPreservation='AAC packets and decoded PCM identical',fullDecodePassed=True)
except Exception as e:
 report['status']='failed';report['error']=repr(e);raise
finally:
 report['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();(O/'native-final-qa.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:report[k] for k in ['status','file','frameCount','bytes']}))
