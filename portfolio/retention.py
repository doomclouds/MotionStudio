#!/usr/bin/env python3
"""Validate static-work semantic sidecars and generate truthful cross-indexes.
Offline metadata/source checks only: not rendering, visual judgment or rights approval.
"""
import argparse, hashlib, json, re
from pathlib import Path, PurePosixPath

TOP = {'schemaVersion','workId','kind','canvas','entrypoint','decisionCard','sourceAnalysis','ruleRefs','ruleStatus','assetUsage','nonAssetNote','evidence','motionTransfer'}
USAGE = {'familyId','mode','modulePath','moduleSha256','sourceCommit','callsite','importToken','callToken','visibleRole','snapshotPath','executionEvidence'}
SHA = re.compile(r'[a-f0-9]{64}')

def require(ok, message):
    if not ok: raise ValueError(message)

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def read(path): return json.loads(path.read_text())
def local(base, value):
    require(isinstance(value,str) and value and not PurePosixPath(value).is_absolute() and '\\' not in value and '..' not in PurePosixPath(value).parts, 'unsafe relative path')
    path=base/value
    cursor=base
    require(not base.is_symlink(),'symlink base rejected')
    for part in PurePosixPath(value).parts:
        cursor=cursor/part
        require(not cursor.is_symlink(),'symlink path rejected')
    require(path.resolve().is_relative_to(base.resolve()),'path escapes base')
    require(path.is_file() and not path.is_symlink(), 'missing/nonregular path: '+value)
    return path

def dependency_closure(base, name, seen=None):
    seen=set() if seen is None else seen
    if name in seen:return seen
    seen.add(name); code=local(base,name).read_text()
    require('import(' not in code,'dynamic module dependency needs explicit validator support')
    for target in re.findall(r"(?:from\s*|import\s*)['\"](\./[^'\"]+)['\"]",code):
        dependency_closure(base,str(PurePosixPath(name).parent/target),seen)
    return seen

def inspect(root):
    assets=read(root/'engine/design-elements/catalog.json')['assets']
    ids={a['id']:a for a in assets}
    require(len(ids)==len(assets),'duplicate family ID')
    works=[]
    for folder in sorted((root/'portfolio/works').iterdir()):
        e=read(folder/'entry.json')
        if e['schema']!=4: continue # Motion keeps existing schema and review dimensions
        p=folder/'retention.json'; require(p.is_file(),'missing static retention: '+folder.name)
        d=read(p); require(set(d)==TOP,'unexpected retention keys: '+folder.name)
        require(d['schemaVersion']==1 and d['kind']=='fixed-static-design' and d['workId']==e['id']==folder.name,'work identity mismatch')
        require(d['canvas']=={k:e['render'][k] for k in ['width','height']},'canvas mismatch')
        require(d['entrypoint']==e['render']['entrypoint'],'entrypoint mismatch')
        local(folder,d['entrypoint']); local(folder,d['decisionCard'])
        for path in d['sourceAnalysis']: local(folder,path)
        for path in d['ruleRefs']: local(root,path)
        require(isinstance(d['assetUsage'],list),'usage must be list')
        seen=set()
        for u in d['assetUsage']:
            require(set(u)==USAGE,'unexpected usage keys')
            require(u['familyId'] in ids and u['familyId'] not in seen,'unknown/duplicate family ID'); seen.add(u['familyId'])
            require(u['mode'] in ['runtime-import','vendored-snapshot'],'unsupported dependency mode')
            require(u['modulePath']=='engine/design-elements/'+ids[u['familyId']]['entry'],'family entry mismatch')
            module=local(root,u['modulePath']); require(digest(module)==u['moduleSha256'],'module digest mismatch')
            require(re.fullmatch('[a-f0-9]{40}',u['sourceCommit']) is not None,'invalid provenance commit')
            code=local(folder,u['callsite']).read_text()
            require(u['importToken']==module.name and u['importToken'] in code,'module import evidence absent')
            # Lightweight lexical guard only; execution evidence is a separate review.
            callcode=re.sub(r"/\*[\s\S]*?\*/|//[^\n]*|\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`", '', code)
            require(re.search(r'\b'+re.escape(u['callToken'])+r'\s*\(',callcode) is not None,'visible call evidence absent')
            require(isinstance(u['visibleRole'],str) and u['visibleRole'].strip(),'missing visible role')
            if u['mode']=='vendored-snapshot':
                require(digest(local(folder,u['snapshotPath']))==u['moduleSha256'],'snapshot changed')
                snapshots=read(local(folder,'module-snapshots.json'))['files']
                require(any(x['path']==u['snapshotPath'] and x['sha256']==u['moduleSha256'] and u['sourceCommit'] in x['source_url'] for x in snapshots),'snapshot provenance absent')
            else:
                require(u['snapshotPath'] is None,'runtime import must not claim snapshot')
                require(('MOTION_UI_ASSETS_ROOT' in code and 'import(' in code) or u['modulePath'] in code,'runtime mode has no engine-root import')
                if (folder/'ui-dependencies.json').exists():
                    dep=read(folder/'ui-dependencies.json')
                    require(dep['tested_commit']==u['sourceCommit'],'dependency commit mismatch')
                    require(dependency_closure(root/'engine/design-elements',module.name).issubset({f['path'] for f in dep['files']}),'transitive dependency lock incomplete')
                    for f in dep['files']:
                        require(digest(local(root/'engine/design-elements',f['path']))==f['sha256'],'transitive dependency mismatch')
                else:
                    require(u['moduleSha256'] in code,'runtime hardcoded dependency hash absent')
        ev=d['evidence']; require(set(ev) in [{'acceptanceSource','renderHashSource','publicCover','comparisonBundle','independentReview'},{'acceptanceSource','renderHashSource','publicCover','comparisonBundle','independentReview','visualReport'}],'unexpected evidence fields')
        require(ev['acceptanceSource']=='entry.json#/acceptance' and ev['renderHashSource']=='entry.json#/cover/source_sha256','duplicate acceptance source not allowed')
        require(ev['publicCover']==e['cover']['path'],'cover mismatch'); local(folder,ev['publicCover'])
        for key in ['comparisonBundle','independentReview']+(['visualReport'] if 'visualReport' in ev else []):
            record=ev[key]
            basekeys={'status','recordId','sha256','storage','durableStorage','note'}
            extra={'acceptedFrameBinding','artifactKind'} if key=='visualReport' else set()
            require(set(record)==basekeys|extra,'unexpected evidence record fields')
            if key=='visualReport':require(record['storage']=='PRIVATE_LIBRARY' and record['durableStorage']=='ACCESS_VERIFIED','visualReport requires independently verified private archive')
            require(record['status'] in (['NOT_PUBLISHED'] if key in ['comparisonBundle','visualReport'] else ['PRIVATE_RECORD_LOCATED','NOT_LOCATED']),'unsupported evidence status')
            if record['storage']=='NOT_LOCATED':
                require(record['recordId'] is None and record['sha256'] is None and record['durableStorage']=='NOT_LOCATED','missing evidence cannot claim identity')
                if key=='independentReview':require(record['status']=='NOT_LOCATED','review status conflicts with missing storage')
            else:
                require(re.fullmatch(r'[a-z0-9][a-z0-9-]+',record['recordId'] or '') is not None and SHA.fullmatch(record['sha256'] or ''),'invalid private evidence identity')
                if record['storage']=='SCRATCH_LOCAL_ONLY':
                    require(record['durableStorage']=='NOT_LOCATED','scratch storage is not durable proof')
                else:
                    require(key!='comparisonBundle','legacy comparison artifact has no durable proof')
                    require(record['storage']==('PRIVATE_LIBRARY' if key=='visualReport' else 'PRIVATE_OWNER_PAGE') and record['durableStorage']=='ACCESS_VERIFIED','unsupported durable storage claim')
                    if key=='visualReport':
                        require(record['artifactKind']=='html-report','durable report hash must identify HTML container')
                        require(record['acceptedFrameBinding'] in ['EXACT_PIXELS','NOT_ESTABLISHED'],'explicit accepted-frame binding required')
                if key=='independentReview':require(record['status']=='PRIVATE_RECORD_LOCATED','located storage conflicts with review status')
        for usage in d['assetUsage']:
            record=usage['executionEvidence']
            require(set(record)=={'status','recordId','sha256','frameSha256','storage','durableStorage','note'},'unexpected runtime evidence fields')
            require(record['status']=='MATCHED_ACCEPTED_FRAME' and record['frameSha256']==e['cover']['source_sha256'],'runtime frame mismatch')
            require(SHA.fullmatch(record['sha256'] or '') and re.fullmatch(r'[a-z0-9][a-z0-9-]+',record['recordId'] or ''),'invalid runtime record identity')
            require(record['storage']=='SCRATCH_LOCAL_ONLY' and record['durableStorage']=='NOT_LOCATED','unsupported runtime storage claim')
        require(d['motionTransfer']['status']=='NOT_TESTED','static migration cannot grant Motion approval')
        require(not re.search(r'/workspace/|/home/agent/|libfile_',p.read_text()),'private location leaked')
        works.append((d,e))
    return assets,works

def outputs(root):
    assets,works=inspect(root)
    family=[]
    for a in assets:
        origin=[]
        for value in a.get('sourceCases',[]):
            match=re.search(r'/portfolio/works/([^/]+)/',value)
            if match:
                origin.append(match.group(1))
        family.append({'id':a['id'],'entry':a['entry'],'guidance':a['guidance'],'sourceCases':origin,'actualUsers':[d['workId'] for d,e in works if any(u['familyId']==a['id'] for u in d['assetUsage'])]})
    data={'schemaVersion':1,'countingUnit':'stable callable family; no function, case or snapshot duplication','staticWorks':len(works),'families':family,'works':[{'id':d['workId'],'decisionCard':'works/'+d['workId']+'/'+d['decisionCard'],'sourceAnalysis':d['sourceAnalysis'],'assetUsage':d['assetUsage'],'visualStatus':e['acceptance']['visual']['status'],'reviewEvidence':d['evidence']['independentReview']['status'],'comparisonBundle':d['evidence']['comparisonBundle']['status'],'reportStorage':d['evidence'].get('visualReport',d['evidence']['comparisonBundle'])['storage'],'acceptedFrameBinding':d['evidence'].get('visualReport',d['evidence']['comparisonBundle']).get('acceptedFrameBinding','NOT_CHECKED'),'motionTransfer':'NOT_TESTED'} for d,e in works]}
    lines=['# 静态设计沉淀索引（自动生成）','','运行 `python portfolio/retention.py --write` 生成；`--check` 拒绝漂移。不是新的审美验收。','',f'完整静态作品 {len(works)}；公共族 {len(assets)}；在已发布作品源码中实际调用的不同族 {sum(bool(f["actualUsers"]) for f in family)}。作品收藏、模块测试、可视复核、素材公开权限分别判断。','','| 作品/统一设计卡 | 实际公共族 | 视觉状态（来自entry） | 独审证据身份 | 对照报告 |','|---|---|---|---|---|']
    for d,e in works:
        labels=', '.join(u['familyId'].replace('design.','').replace('.v1','')+('（快照）' if u['mode']=='vendored-snapshot' else '') for u in d['assetUsage']) or '0（案例代码保留）'
        lines.append(f'| [{e["title"]}](works/{d["workId"]}/{d["decisionCard"]}) | {labels} | {e["acceptance"]["visual"]["status"]} | {d["evidence"]["independentReview"]["status"]} | {d['evidence'].get('visualReport',d['evidence']['comparisonBundle'])['storage']} / {d['evidence'].get('visualReport',d['evidence']['comparisonBundle']).get('acceptedFrameBinding','NOT_CHECKED')}；未公开 |')
    lines+=['','完整可运行入口、画幅、文件hash及验收以各作品entry.json为准。retention.json只补语义关联，不重写验收。旧分析路径原位保留，由统一设计卡和sidecar导航。','原始参考/对照证据受独立权限约束，未公开不表示未做，也不能推定已存在可访问报告。私人证据ID/hash只供受控记录核对，公开校验器不宣称读取了私有报告。存储与验收帧绑定逐例列明：PRIVATE_LIBRARY/PRIVATE_OWNER_PAGE及ACCESS_VERIFIED仅表示私有报告/评审容器已取回核对，不公开私有链接；EXACT_PIXELS表示报告嵌图含已审帧相同像素，NOT_ESTABLISHED仅表示未找到完全相同的原尺寸嵌图，不推定报告版本错误，也不能宣称完整原帧对照闭环。HTML哈希不冒充单独PNG哈希；浏览器预览和新的审美验收均不推定。运行调用回执仍按独立存储状态记账。','', '## 公共族：来源与真实调用分开','','| 族 | 来源作品（非调用证明） | 已发布作品真实调用 |','|---|---|---|']
    for f in family: lines.append('| ['+f['id']+'](../engine/design-elements/'+f['entry']+') | '+(', '.join(f['sourceCases']) or '见模块指导')+' | '+(', '.join(f['actualUsers']) or '尚无已发布作品调用；看独立配方')+' |')
    coverage=['# 作品与公共资产覆盖（自动生成）','','旧16案的逐例设计关系与未泛化边界完整保留于[历史设计说明](CASE-DESIGN-NOTES.md)，不是调用账单。','','详见 [完整静态作品语义索引（远端仓库，不随Skill打包）](https://github.com/doomclouds/MotionStudio/blob/dev/portfolio/DESIGN-INDEX.md)。本表区分“提供提取灵感的来源”与“源码实际调用”，不能用来源关系冒充复用。','',*lines[lines.index('| 族 | 来源作品（非调用证明） | 已发布作品真实调用 |'):]]
    coverage=[s.replace('(../engine/design-elements/','(') for s in coverage]
    return {'portfolio/design-index.json':json.dumps(data,ensure_ascii=False,indent=2)+'\n','portfolio/DESIGN-INDEX.md':'\n'.join(lines)+'\n','engine/design-elements/CASE-COVERAGE.md':'\n'.join(coverage)+'\n'}

def query(root, text=None, family=None):
    """Case-insensitive literal substring search; family filter means actual usage only."""
    assets,works=inspect(root)
    if text is not None:require(isinstance(text,str) and text.strip(),'--text must be nonempty')
    if family is not None:require(family in {a['id'] for a in assets},'unknown family ID: '+family)
    rows=[]
    for d,e in works:
        folder=root/'portfolio/works'/d['workId']
        families=[u['familyId'] for u in d['assetUsage']]
        if family is not None and family not in families:continue
        corpus='\n'.join([d['workId'],e['title'],local(folder,d['decisionCard']).read_text(),*[local(folder,p).read_text() for p in d['sourceAnalysis']]])
        if text is not None and text.casefold() not in corpus.casefold():continue
        rows.append({'workId':d['workId'],'title':e['title'],'decisionCard':'portfolio/works/'+d['workId']+'/'+d['decisionCard'],'families':families,'visualStatus':e['acceptance']['visual']['status'],'reviewEvidence':d['evidence']['independentReview']['status'],'reviewStorage':d['evidence']['independentReview']['storage'],'durableStorage':d['evidence']['independentReview']['durableStorage'],'comparisonBundle':d['evidence']['comparisonBundle']['status'],'reportStorage':d['evidence'].get('visualReport',d['evidence']['comparisonBundle'])['storage'],'acceptedFrameBinding':d['evidence'].get('visualReport',d['evidence']['comparisonBundle']).get('acceptedFrameBinding','NOT_CHECKED'),'motionTransfer':d['motionTransfer']['status']})
    return {'query':{'text':text,'family':family,'combination':'intersection','semantics':'case-insensitive literal substring; family matches actual use, not inspiration'},'count':len(rows),'results':rows,'limits':'No aesthetic ranking or inferred suitability. Zero matches means no literal match, not no relevant design. Full repository required; private evidence content is not searched.'}

def main():
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]); mode=parser.add_mutually_exclusive_group();mode.add_argument('--write',action='store_true');mode.add_argument('--check',action='store_true'); mode.add_argument('--query',action='store_true'); parser.add_argument('--text'); parser.add_argument('--family'); args=parser.parse_args()
    if (args.text is not None or args.family is not None) and not args.query:parser.error('--text/--family require --query')
    try:
        if args.query:
            print(json.dumps(query(args.root,args.text,args.family),ensure_ascii=False,indent=2));return
        result=outputs(args.root)
        for p,text in result.items():
            if args.write:(args.root/p).write_text(text)
            else:require((args.root/p).is_file() and (args.root/p).read_text()==text,'generated index stale: '+p)
    except (ValueError,KeyError,TypeError,OSError) as e:parser.exit(1,'FAIL: '+str(e)+'\n')
    print('PASS: semantic links, module source-reference consistency and generated indexes; no new render/aesthetic/rights approval.')
if __name__=='__main__':main()
