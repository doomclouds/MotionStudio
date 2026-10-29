#!/usr/bin/env python3
"""Render all 1980 frames from source with fixed resources; no movie input or download."""
from pathlib import Path
import argparse,hashlib,json,os,subprocess,sys
sys.dont_write_bytecode=True
from prepare import LOCK,verify,Bad,inside,regular_path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]

def run(argv,**kw):return subprocess.run([str(x) for x in argv],check=True,**kw)
def digest(p):return hashlib.sha256(regular_path(p).read_bytes()).hexdigest()
def check_sources():
    lock=json.loads((HERE/'locks/runtime.json').read_text())
    for row in lock['shared_source_files']:
        if digest(inside(ROOT/row['path'],ROOT))!=row['sha256']:raise Bad('Shared source drift: '+row['path'])
    npm=lock['npm_install_lock']
    for path,root in [(ROOT/npm['repository_path'],ROOT),(HERE/npm['work_copy'],HERE)]:
        if digest(inside(path,root))!=npm['sha256']:raise Bad('npm installation lock drift')
    pip=lock['python_install_lock']
    if digest(inside(HERE/pip['work_path'],HERE))!=pip['sha256']:raise Bad('Python installation lock drift')
def check_assets(cache):
    cache=regular_path(cache)
    for row in LOCK['assets']:verify(cache/'downloads'/row['id'],row,cache)
    for font in LOCK['fonts']:
        for suffix,key in [(font['member'],'sha256'),(font['license_member'],'license_sha256')]:
            p=inside(cache/f"reference/font-packages/{font['id']}-5.3.0"/suffix,cache)
            if not p.is_file() or digest(p)!=font[key]:raise Bad('Font resource mismatch: '+str(p))
    for row in LOCK['derived_fonts']:
        p=inside(cache/'fonts'/row['file'],cache)
        if not p.is_file() or digest(p)!=row['sha256']:raise Bad('Derived font mismatch: '+str(p))
    for row in LOCK['assets']:
        if row['role']=='background':verify(cache/'reference/source/public/fx'/f"{row['id']}.png",row,cache)
        elif row['role']=='audio':verify(cache/'audio/soundtrack.wav',row,cache)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--assets',type=Path,required=True);p.add_argument('--work',type=Path,required=True);p.add_argument('--canvas-module',type=Path);a=p.parse_args()
    cache=regular_path(a.assets);work=regular_path(a.work);canvas=regular_path(a.canvas_module or ROOT/'engine/motion-render-core/node_modules/@napi-rs/canvas')
    if work.exists():raise Bad('Choose a NEW work directory; successful output is not overwritten')
    if work==ROOT or ROOT in work.parents:raise Bad('Output must be outside source tree')
    check_sources();check_assets(cache)
    if not (canvas/'package.json').is_file() or json.loads((canvas/'package.json').read_text())['version']!='0.1.100':raise Bad('Install the locked @napi-rs/canvas 0.1.100 dependency first; no fallback/download')
    node=subprocess.check_output(['node','--version'],text=True).strip()
    if node!='v24.22.1':raise Bad('This verified runtime requires Node v24.22.1; changing it requires a new reproducibility check')
    for tool in ['ffmpeg','ffprobe']:
        v=subprocess.check_output([tool,'-version'],text=True).splitlines()[0]
        if 'version 7.1.5' not in v:raise Bad(f'This verified runtime requires {tool} 7.1.5; received '+v)
    env={**os.environ,'TESSEL_REFERENCE_ROOT':str(cache/'reference'),'TESSEL_FONT_ROOT':str(cache/'fonts'),'MOTIONSTUDIO_CANVAS_MODULE':str(canvas)};env.pop('TESSEL_USAGE_DIR',None)
    run(['node',HERE/'src/full-render-segment.mjs','--scene',HERE/'src/full-scene-rerender-v3.mjs','--work',work,'--crf','16'],env=env)
    video=work/'output/segment.mp4';partial=work/'output/tessel.partial.mp4';final=work/'output/tessel.mp4'
    run(['ffmpeg','-v','error','-n','-i',video,'-i',cache/'audio/soundtrack.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-t','33','-map_metadata','-1','-movflags','+faststart',partial])
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',partial],text=True));v=next(x for x in probe['streams'] if x['codec_type']=='video');s=next(x for x in probe['streams'] if x['codec_type']=='audio')
    if (int(v['nb_read_frames']),v['avg_frame_rate'],v['width'],v['height'],s['sample_rate'],s['channels'])!=(1980,'60/1',1920,1080,'48000',2):raise Bad('Final AV contract mismatch')
    if abs(float(probe['format']['duration'])-33)>0.001:raise Bad('Final duration mismatch')
    run(['ffmpeg','-v','error','-threads','1','-i',partial,'-f','null','-'])
    os.replace(partial,final)
    report={'status':'passed','route':'All 1980 frames rerendered from v3 source, no pre-encoded sample or original film used','sha256':digest(final),'bytes':final.stat().st_size,'source_audio_sha256':digest(cache/'audio/soundtrack.wav'),'probe':probe,'audio_derivation':'Original MIT PCM soundtrack newly AAC encoded at 320k; not original AAC bitstream identity','full_decode':'passed','listened':'NOT_LISTENED','artistic_acceptance':'not established by this run','scope':'New source/resource folders and newly installed pinned Node/Python dependencies on existing host; not a new OS/platform'}
    (work/'output/reproduction.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'passed','file':str(final),'sha256':report['sha256'],'bytes':report['bytes']}))

if __name__=='__main__':
    try:main()
    except (Bad,OSError,subprocess.CalledProcessError) as e:raise SystemExit('RENDER FAILED: '+str(e))
