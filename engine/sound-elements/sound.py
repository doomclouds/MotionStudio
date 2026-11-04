#!/usr/bin/env python3
"""Read self-describing sound assets; materialize authorized local sources offline."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import struct
import sys
import tempfile
import wave
from fractions import Fraction
import synth

ROOT = Path(__file__).resolve().parent
CATEGORIES = {'sfx': {'ui-feedback', 'confirmation', 'transition', 'impact', 'texture', 'ambience'},
              'bgm': {'pulse-bed', 'ambient-bed', 'rhythmic', 'melodic', 'stinger'},
              'voice': {'narration', 'performance'}}

def require(test, message):
    if not test: raise ValueError(message)

def keys(obj, expected, label):
    require(isinstance(obj, dict) and set(obj) == set(expected.split()), f'{label}: missing/unknown fields')

def text(value): return isinstance(value, str) and bool(value.strip())

def local(base, value, boundary):
    require(text(value) and not Path(value).is_absolute() and '\\' not in value and ':' not in value, 'local relative entry required')
    p = base / value
    require(p.resolve().is_relative_to(boundary.resolve()) and p.is_file(), 'entry missing/outside library')
    # Do not follow symlinked components even if the ultimate target is internal.
    require(not any(x.is_symlink() for x in [p, *p.parents] if x.is_relative_to(boundary)), 'symlink entry rejected')
    return p.resolve()

def validate(d, directory, library):
    keys(d, 'schema id version title kind category moods status design audio source rights review', 'asset')
    require(d['schema'] == 'sound-asset/1', 'unsupported schema')
    require(isinstance(d['id'],str) and re.fullmatch('[a-z][a-z0-9-]{1,63}',d['id']) and directory.name == d['id'] and directory.parent.name == d['kind'], 'id/directory mismatch')
    require(type(d['version']) is int and d['version'] > 0 and text(d['title']), 'invalid version/title')
    require(d['kind'] in CATEGORIES and d['category'] in CATEGORIES[d['kind']], 'invalid category')
    require(isinstance(d['moods'],list) and d['moods'] and all(text(x) for x in d['moods']), 'moods required')
    require(d['status'] in {'candidate','retired'}, 'catalog cannot self-certify acceptance')
    keys(d['design'], 'intent use_when avoid_when mix_notes', 'design')
    require(all(text(x) for x in d['design'].values()), 'design text required')
    a=d['audio'];keys(a,'duration_seconds format codec sample_rate channels duration_basis loop','audio')
    require(type(a['duration_seconds']) in {int,float} and math.isfinite(a['duration_seconds']) and 0<a['duration_seconds']<=600,'invalid duration')
    require((a['format'],a['codec'],a['sample_rate'],a['channels']) == ('wav','pcm_s16le',48000,2),'v1 supports stereo PCM16 WAV at 48 kHz only')
    require(a['duration_basis'] in {'recipe','measured'},'invalid duration evidence')
    loop=a['loop'];keys(loop,'mode start_sample end_sample listened_seam','loop')
    require(loop['listened_seam'] is False,'public candidate cannot claim a heard seam')
    require(loop['mode'] in {'one-shot','explicit-repeat'},'unsupported loop mode')
    if loop['mode']=='one-shot': require(loop['start_sample'] is None and loop['end_sample'] is None,'one shot has no loop range')
    else: require(type(loop['start_sample']) is int and type(loop['end_sample']) is int and 0<=loop['start_sample']<loop['end_sample']<=round(a['duration_seconds']*48000),'invalid loop range')
    s=d['source'];keys(s,'kind entry recipe sha256 creator provenance','source')
    require(text(s['creator']) and text(s['provenance']), 'source attribution required')
    entry=local(directory,s['entry'],library)
    if s['kind']=='generated':
        require(entry == (ROOT/'synth.py').resolve() and s['recipe'] in synth.DURATIONS,'only built-in synthesis is executable')
        require(s['sha256'] is None and a['duration_basis']=='recipe' and a['duration_seconds']==synth.DURATIONS[s['recipe']],'recipe identity/duration mismatch')
    else:
        require(s['kind']=='local-file' and s['recipe'] is None and a['duration_basis']=='measured','invalid file source')
        require(isinstance(s['sha256'],str) and re.fullmatch('[a-f0-9]{64}',s['sha256']), 'file requires SHA-256')
    r=d['rights'];keys(r,'license license_entry use standalone_distribution conditions basis','rights')
    require(all(text(r[k]) for k in ['license','conditions','basis']), 'rights rationale required')
    local(directory,r['license_entry'],library)
    require(r['use'] in {'allowed','unknown','prohibited'} and r['standalone_distribution'] in {'allowed','unknown','prohibited'},'rights enum')
    if s['kind']=='generated': require(r['license']=='MIT' and r['use']=='allowed' and r['standalone_distribution']=='allowed','built-in source license mismatch')
    keys(d['review'],'technical listening av_sync owner limits','review')
    require(d['review']['technical']=='RUN_REQUIRED' and d['review']['listening']=='NOT_LISTENED' and d['review']['av_sync']=='NOT_RUN' and d['review']['owner']=='NOT_RUN' and text(d['review']['limits']),'candidate evidence must remain unreviewed')
    return d

def load(library=ROOT, validate_views=True):
    library=Path(library).resolve()
    require(library.is_dir() and (library/'assets').is_dir(),'missing asset library')
    rows=[]
    for path in sorted((library/'assets').glob('*/*/asset.json')):
        require(not any(p.is_symlink() for p in (path, path.parent, path.parent.parent, library/'assets')),'symlink contract rejected')
        d=validate(json.loads(path.read_text()),path.parent,library)
        if validate_views: require(local(path.parent, 'design.md', library).read_text() == design(d), 'design.md missing or drifted; regenerate from asset.json')
        rows.append((d,path))
    require(len({d['id'] for d,_ in rows})==len(rows),'duplicate ID')
    return rows

def query(rows,kind=None,category=None,mood=None,include_retired=False):
    return [(d,p) for d,p in rows if (include_retired or d['status']!='retired') and (not kind or d['kind']==kind) and (not category or d['category']==category) and (not mood or mood in d['moods'])]

def design(d):
    """Readable per-asset view; asset.json remains the only fact source."""
    return '\n'.join([
        '# '+d['title'], '',
        '由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。', '',
        f"ID: {d['id']} · version {d['version']} · {d['kind']} / {d['category']} · {d['status']}", '',
        '## 意图与使用', '',
        d['design']['intent'], '',
        '适用：'+d['design']['use_when'], '',
        '反例：'+d['design']['avoid_when'], '',
        '混音：'+d['design']['mix_notes'], '',
        '情绪意图：'+', '.join(d['moods']), '',
        '## 来源与调用', '',
        f"[文件或生成器]({d['source']['entry']}) · recipe: {d['source']['recipe']} · {d['source']['creator']}", '',
        d['source']['provenance'], '',
        f"{d['audio']['duration_seconds']}s · PCM16 stereo 48kHz · {d['audio']['loop']['mode']}。时长依据：{d['audio']['duration_basis']}。", '',
        '从库根调用：`python3 sound.py render --id '+d['id']+' --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。', '',
        '## 权利与验收', '',
        f"[许可]({d['rights']['license_entry']})：{d['rights']['license']}；使用 {d['rights']['use']}；独立分发 {d['rights']['standalone_distribution']}。", '',
        d['rights']['conditions'], '', d['rights']['basis'], '',
        f"技术 {d['review']['technical']} · 听审 {d['review']['listening']} · 声画 {d['review']['av_sync']} · 用户 {d['review']['owner']}", '',
        d['review']['limits'], '',
    ])

def index(rows):
    lines=['# 声音资产目录（生成视图）','', '由各目录 asset.json 生成；不在此修改事实。所有条目是未听审候选，不是推荐榜。','']
    for kind in CATEGORIES:
        lines += ['## '+kind,'']
        found=[(d,p) for d,p in rows if d['kind']==kind]
        if not found: lines += ['空位：尚无审定可保留资产，不编造素材或授权。','']
        for d,p in found:
            lines += [f"- [{d['title']}](assets/{d['kind']}/{d['id']}/design.md) · {d['id']} · {d['category']} · {d['audio']['duration_seconds']}s · {d['status']} / NOT_LISTENED", '  '+d['design']['intent']]
        lines += ['']
    return '\n'.join(lines).rstrip()+'\n'

def sha(data):return hashlib.sha256(data).hexdigest()
def time(samples):
    f=Fraction(samples,48000);return {'n':str(f.numerator),'d':str(f.denominator)}

def materialize(d,contract,output,library=ROOT,repeats=1,variant=0):
    validate(d,contract.parent,Path(library))
    contract_bytes=contract.read_bytes()
    require(json.loads(contract_bytes)==d, 'contract changed or differs from selected asset')
    require(d['status']=='candidate' and d['rights']['use']=='allowed','asset retired or use rights unresolved')
    require(type(repeats) is int and 1<=repeats<=32,'repeats must be 1..32')
    require(repeats==1 or d['audio']['loop']['mode']=='explicit-repeat','one-shot cannot implicitly loop')
    if d['source']['kind']=='generated': synth.validate_variant(d['source']['recipe'],variant)
    else: require(type(variant) is int and variant==0,'local-file does not support synthesis variants')
    output=Path(output).absolute()
    require(not output.resolve().is_relative_to(ROOT.parents[1]) and not output.resolve().is_relative_to(Path(library).resolve()),'output must be outside source/package and input library')
    require(output.parent.is_dir() and not output.exists() and not output.is_symlink(),'output needs existing parent and new directory')
    with tempfile.TemporaryDirectory(prefix='.sound-',dir=output.parent) as tmp:
        tmp=Path(tmp); target=tmp/'source.wav'; s=d['source']
        entry=local(contract.parent,s['entry'],Path(library))
        source_hash=sha(entry.read_bytes())
        if s['kind']=='generated': synth.render(s['recipe'],target,variant)
        else:
            require(source_hash==s['sha256'],'source hash mismatch')
            shutil.copyfile(entry,target)
            require(sha(target.read_bytes())==s['sha256'],'source changed during copy')
        with wave.open(str(target),'rb') as f:
            require((f.getnchannels(),f.getsampwidth(),f.getframerate(),f.getcomptype())==(2,2,48000,'NONE'),'PCM format mismatch')
            n=f.getnframes(); data=f.readframes(n)
            require(n==round(d['audio']['duration_seconds']*48000) and len(data)==n*4,'duration mismatch/truncation')
        peak=max(abs(v[0]) for v in struct.iter_unpack('<h',data))/32768
        require(peak<1,'clipping rejected')
        loop=d['audio']['loop']; start,end=(0,n) if repeats==1 else (loop['start_sample'],loop['end_sample'])
        count=end-start
        require(count*repeats<=600*48000,'timeline duration exceeds Audio Core')
        # Audio Core sources are explicit; it does not infer or perform looping.
        plan={'schemaVersion':1,'project':{'sampleRate':48000,'frameRate':{'n':24,'d':1},'channelLayout':'stereo','duration':time(count*repeats)},
              'sources':[{'id':d['id'],'path':'source.wav','streamIndex':0,'expectedSha256':sha(target.read_bytes())}],
              'clips':[{'id':f'cue-{i}','sourceId':d['id'],'sourceRange':{'start':time(start),'end':time(end)},'timelineRange':{'start':time(i*count),'end':time((i+1)*count)},'outputId':'sound','gainDb':0} for i in range(repeats)],
              'stems':[{'id':'sound','outputId':'master'}],'buses':[],'master':{},'views':[]}
        receipt={'schema':'sound-materialization/1','asset_id':d['id'],'version':d['version'],'contract_sha256':sha(contract_bytes),'source_sha256':source_hash,'output_sha256':plan['sources'][0]['expectedSha256'],
                 'generation':{'recipe':s['recipe'],'variant':variant} if s['kind']=='generated' else None,
                 'python':sys.version,'technical':{'frames':n,'sample_peak':peak,'format':'PCM16 stereo 48kHz','status':'PASS'},'listening':'NOT_LISTENED','av_sync':'NOT_RUN','owner':'NOT_RUN','standalone_distribution':d['rights']['standalone_distribution']}
        for name,value in [('timeline.json',plan),('receipt.json',receipt),('asset.json',d)]: (tmp/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
        (tmp/'design.md').write_text(design(d))
        shutil.copyfile(local(contract.parent,d['rights']['license_entry'],Path(library)),tmp/'LICENSE')
        # mkdir is exclusive; a pre-existing output is never replaced.
        output.mkdir()
        for file in tmp.iterdir(): shutil.copyfile(file,output/file.name)
    return receipt

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('command',choices=['validate','query','index','design','render'])
    p.add_argument('--library',type=Path,default=ROOT)
    p.add_argument('--id');p.add_argument('--kind',choices=sorted(CATEGORIES));p.add_argument('--category');p.add_argument('--mood');p.add_argument('--include-retired',action='store_true')
    p.add_argument('--output',type=Path);p.add_argument('--repeats',type=int,default=1)
    p.add_argument('--variant',type=int,default=0,help='Explicit synthesis variant: keyboard-press 0..3; all other assets 0 only')
    a=p.parse_args(argv)
    try:
        require(a.command=='render' or a.variant==0,'--variant applies only to render')
        rows=load(a.library, validate_views=a.command != 'design')
        if a.command=='validate': result={'valid':True,'count':len(rows),'listening':'NOT_LISTENED'}
        elif a.command=='index': print(index(rows),end='');return 0
        elif a.command=='design':
            found=[d for d,_ in rows if d['id']==a.id]
            require(len(found)==1, 'design requires a known --id')
            print(design(found[0]),end='');return 0
        elif a.command=='query': result=[d for d,_ in query(rows,a.kind,a.category,a.mood,a.include_retired) if not a.id or d['id']==a.id]
        else:
            found=[(d,path) for d,path in rows if d['id']==a.id]
            require(len(found)==1 and a.output is not None,'render requires a known --id and --output')
            result=materialize(*found[0],a.output,a.library,a.repeats,a.variant)
        print(json.dumps(result,ensure_ascii=False,indent=2));return 0
    except (ValueError,OSError,TypeError,KeyError,wave.Error) as e:
        print(json.dumps({'valid':False,'error':str(e)},ensure_ascii=False),file=sys.stderr);return 1

if __name__=='__main__':raise SystemExit(main())
