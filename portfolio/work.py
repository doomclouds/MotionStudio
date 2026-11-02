"""Single work/1 consumer: inspect, admit-check, query, index. No legacy reads."""
import argparse,json,os,re,tempfile
from pathlib import Path
from validate_work import Blocked,require,read,validate
from admission import inspect,local

def load_all(portfolio):
 root=Path(portfolio);require(root.is_dir() and not root.is_symlink(),'PORTFOLIO_ROOT_INVALID');works=root/'works'
 require(works.is_dir() and not works.is_symlink(),'WORKS_ROOT_INVALID');rows=[]
 for folder in sorted(works.iterdir()):
  require(folder.is_dir() and not folder.is_symlink(),'WORK_DIRECTORY_INVALID')
  require((folder/'work.json').is_file(),'WORK_MANIFEST_REQUIRED_NO_LEGACY_SUPPORT')
  require(not (folder/'entry.json').exists() and not (folder/'retention.json').exists(),'PARALLEL_METADATA_FORBIDDEN')
  d=read(folder/'work.json');validate(d,folder);rows.append((folder,d))
 return rows

def public_row(d):
 # Explicit public allowlist; never serialize all data then redact private fields.
 return {'id':d['id'],'version':d['version'],'title':d['title'],'kind':d['kind'],'lifecycle':d['lifecycle'],'publication':d['publication']['status'],'visual':d['acceptance']['visual']['status'] if d['lifecycle']=='retained' else 'NOT_RUN','reviewArtifacts':'NOT_INCLUDED','families':[u['familyId'] for u in d.get('design',{}).get('assetUsage',[])]}

def index(portfolio,repo):
 loaded=load_all(portfolio)
 for folder,d in loaded:inspect(folder,repo)
 rows=[public_row(d) for _,d in loaded]
 catalog=read(local(repo,'engine/design-elements/catalog.json'))['assets'];families=[]
 for a in catalog:
  origins=[]
  for value in a.get('sourceCases',[]):
   match=re.search(r'/portfolio/works/([^/]+)/',value)
   if match:origins.append(match.group(1))
  families.append({'id':a['id'],'entry':a['entry'],'guidance':a['guidance'],'sourceCases':origins,'actualUsers':[r['id'] for r in rows if r['lifecycle']=='retained' and a['id'] in r['families']],'candidateUsers':[r['id'] for r in rows if r['lifecycle']=='candidate' and a['id'] in r['families']]})
 return {'schema':'motionstudio.work-index/1','source':'work/1-only','evidencePolicy':'NOT_INCLUDED is disclosure policy, not proof of review or absence.','counts':{'works':len(rows),'static':sum(x['kind']=='static' for x in rows),'video':sum(x['kind']=='video' for x in rows),'candidates':sum(x['lifecycle']=='candidate' for x in rows)},'families':families,'works':rows}

def query(portfolio,repo,text=None,family=None,kind=None):
 if text is not None:require(bool(text.strip()),'EMPTY_QUERY')
 if family is not None:require(family in {a['id'] for a in read(local(repo,'engine/design-elements/catalog.json'))['assets']},'UNKNOWN_FAMILY')
 result=[]
 for folder,d in load_all(portfolio):
  inspect(folder,repo)
  if kind is not None and d['kind']!=kind:continue
  row=public_row(d)
  if family is not None and family not in row['families']:continue
  corpus=d['id']+'\n'+d['title']+'\n'+local(folder,'README.md').read_text()
  if 'design' in d:
   corpus+='\n'+local(folder,d['design']['decisionCard']).read_text()
   for name in d['design']['sourceAnalysis']:corpus+='\n'+local(folder,name).read_text()
  if text is None or text.casefold() in corpus.casefold():result.append(row)
 return result

def index_markdown(data):
 def cell(x):return str(x).replace('|','\\|').replace('\n',' ')
 lines=['# 作品索引（自动生成）','','唯一真源：各作品work.json。NOT_INCLUDED只表示公开不含审查材料；候选NOT_RUN不算准入。','','|作品|类型|版本|生命周期|视觉状态|实际族声明|','|---|---|---|---|---|---|']
 for w in data['works']:lines.append('|['+cell(w['title'])+'](works/'+w['id']+'/README.md)|'+ '|'.join(cell(w[k]) for k in ['kind','version','lifecycle','visual'])+'|'+cell(', '.join(w['families']) or '未声明')+'|')
 lines+=['','## 公共族来源与使用','','来源作品不是调用证明；候选使用列不代表新版本已通过复验。','','|族|来源作品|已保留版本使用|候选使用|','|---|---|---|---|']
 for f in data['families']:lines.append('|'+cell(f['id'])+'|'+cell(', '.join(f['sourceCases']))+'|'+cell(', '.join(f['actualUsers']))+'|'+cell(', '.join(f['candidateUsers']))+'|')
 return '\n'.join(lines)+'\n'

def coverage_markdown(data):
 lines=['# 作品与公共资产覆盖（自动生成）','','由portfolio/work.py index生成；作品真源仅work.json。来源不是调用证明，候选调用不代表复验通过。','','[统一作品索引](../../portfolio/INDEX.md) · [历史设计说明](CASE-DESIGN-NOTES.md)','','|族|来源作品|已保留版本使用|候选使用（NOT_RUN）|','|---|---|---|---|']
 def links(ids):return ', '.join('['+x+'](../../portfolio/works/'+x+'/README.md)' for x in ids) or '—'
 for f in data['families']:lines.append('|['+f['id']+']('+f['entry']+')|'+links(f['sourceCases'])+'|'+links(f['actualUsers'])+'|'+links(f['candidateUsers'])+'|')
 return '\n'.join(lines)+'\n'

def index_write(portfolio,data,repo=None):
 root=Path(portfolio);payloads={root/'index.json':json.dumps(data,ensure_ascii=False,indent=2)+'\n',root/'INDEX.md':index_markdown(data)};staged=[]
 if repo is not None:payloads[Path(repo)/'engine/design-elements/CASE-COVERAGE.md']=coverage_markdown(data)
 for target in payloads:require(target.parent.is_dir() and not target.is_symlink(),'INDEX_TARGET_SYMLINK_OR_PARENT')
 try:
  for target,payload in payloads.items():
   fd,name=tempfile.mkstemp(prefix='.work-index-',dir=target.parent)
   with os.fdopen(fd,'w') as f:f.write(payload)
   staged.append((Path(name),target))
  # Each file atomic; an interruption between them is explicitly detected by --check.
  for temp,target in staged:os.replace(temp,target)
 finally:
  for temp,target in staged:temp.unlink(missing_ok=True)

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('command',choices=['inspect','admit-check','query','index']);ap.add_argument('--portfolio',default=str(Path(__file__).resolve().parent));ap.add_argument('--repo',default=str(Path(__file__).resolve().parent.parent));ap.add_argument('--kind',choices=['static','video']);ap.add_argument('--text');ap.add_argument('--family');ap.add_argument('--write',action='store_true');ap.add_argument('--check',action='store_true');a=ap.parse_args()
 try:
  require(not(a.write and a.check),'INDEX_MODE_CONFLICT')
  if a.command in ['inspect','admit-check']:
   require(a.repo is not None,'REPOSITORY_SCOPE_REQUIRED');results=[inspect(folder,a.repo) for folder,_ in load_all(a.portfolio)];print(json.dumps({'results':results},ensure_ascii=False));return 0 if a.command=='inspect' or all(r['admissible'] for r in results) else 3
  if a.command=='query':
   require(a.repo is not None,'REPOSITORY_SCOPE_REQUIRED');rows=query(a.portfolio,a.repo,a.text,a.family,a.kind);print(json.dumps(rows,ensure_ascii=False));return 0
  require(a.repo is not None,'REPOSITORY_SCOPE_REQUIRED');data=index(a.portfolio,a.repo)
  if a.write:index_write(a.portfolio,data,a.repo)
  elif a.check:
   require(read(Path(a.portfolio)/'index.json')==data,'INDEX_DRIFT');require((Path(a.portfolio)/'INDEX.md').read_text()==index_markdown(data),'INDEX_MARKDOWN_DRIFT');require((Path(a.repo)/'engine/design-elements/CASE-COVERAGE.md').read_text()==coverage_markdown(data),'COVERAGE_DRIFT')
  print(json.dumps(data,ensure_ascii=False));return 0
 except Exception as e:
  print(json.dumps({'status':'BLOCKED','reason':str(e) if isinstance(e,Blocked) else 'INPUT_OR_VALIDATION_FAILED'}));return 2
if __name__=='__main__':raise SystemExit(main())
