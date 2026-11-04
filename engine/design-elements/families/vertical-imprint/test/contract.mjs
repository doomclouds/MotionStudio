import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {draw,validate,id,version,guidance} from '../index.mjs';
import {drawAsset} from '../../../index.mjs';
import {examples} from '../examples/cases.mjs';
import {loadCanvas} from '../examples/runtime.mjs';
import {renderExamples} from '../examples/render.mjs';
const api=loadCanvas(),checks=[],clone=x=>structuredClone(x),samples=examples.map(x=>x.props??x);
function check(name,fn){fn();checks.push(name)}
const canvas=()=>api.createCanvas(1800,1400);
function rejects(change){const p=clone(samples[0]);change(p);const c=canvas(),before=c.toBuffer('image/png');assert.throws(()=>draw(c.getContext('2d'),p));assert.deepEqual(c.toBuffer('image/png'),before);}
check('canonical catalog metadata and absent legacy paths',()=>{
 const root=new URL('../../../',import.meta.url),a=JSON.parse(readFileSync(new URL('catalog.json',root))).assets.find(a=>a.id===id);
 assert.equal(version,a.version);assert.equal(a.entry,'families/vertical-imprint/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['vertical-imprint.mjs','docs/vertical-imprint.md','examples/vertical-imprint.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('column reading order and every authored glyph survive with contained ink boxes',()=>{for(const p of samples){const g=draw(canvas().getContext('2d'),p);assert.deepEqual(g.readingOrder,p.data.columns.map(x=>x.id));assert.equal(g.glyphs.length,p.data.columns.reduce((n,x)=>n+[...x.text].length,0));const starts=g.readingOrder.map(id=>g.glyphs.find(x=>x.columnId===id).bounds.x);for(let i=1;i<starts.length;i++)assert.ok(starts[i]<starts[i-1]);for(const col of p.data.columns)assert.equal(g.glyphs.filter(x=>x.columnId===col.id).map(x=>x.character).join(''),col.text);for(const x of g.glyphs){assert.ok(x.bounds.x>=g.frame.x&&x.bounds.x+x.bounds.width<=g.frame.x+g.frame.width);assert.ok(x.bounds.y>=g.frame.y&&x.bounds.y+x.bounds.height<=g.frame.y+g.frame.height);assert.equal(x.role,p.data.columns.find(k=>k.id===x.columnId).role);}}});
check('Latin, punctuation, duplicate IDs and overcrowding reject before pixels',()=>{for(const change of [p=>p.data.columns[0].text='ABC',p=>p.data.columns[0].text='山。',p=>p.data.columns[1].id=p.data.columns[0].id,p=>p.data.columns[0].role='source',p=>p.data.columns[0].text='山'.repeat(40),p=>p.bounds.width=100,p=>p.data.step=p.data.fontSize])rejects(change)});
check('local frame strokes ignore and restore caller dash',()=>{const render=dash=>{const c=canvas(),ctx=c.getContext('2d');ctx.setLineDash(dash);draw(ctx,samples[0]);assert.deepEqual(ctx.getLineDash(),dash);return c.toBuffer('image/png')};assert.deepEqual(render([]),render([4,9]));});
check('coverage helper rejects an explicitly synthetic Latin-only font',()=>{
 const script=fileURLToPath(new URL('./verify-font.py',import.meta.url));
 const program=`import tempfile,pathlib,subprocess,sys,json
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
with tempfile.TemporaryDirectory(prefix='missing-han-test-') as temp:
 f=FontBuilder(1000,isTTF=True);f.setupGlyphOrder(['.notdef','A']);f.setupCharacterMap({65:'A'})
 f.setupGlyf({x:TTGlyphPen(None).glyph() for x in ['.notdef','A']});f.setupHorizontalMetrics({x:(500,0) for x in ['.notdef','A']});f.setupHorizontalHeader(ascent=800,descent=-200)
 f.setupNameTable({'familyName':'Synthetic missing-Han test fixture','styleName':'Regular','uniqueFontIdentifier':'synthetic-missing-han','fullName':'Synthetic missing-Han test fixture','psName':'SyntheticMissingHan'})
 f.setupOS2(sTypoAscender=800,sTypoDescender=-200,usWinAscent=800,usWinDescent=200);f.setupPost();f.setupMaxp()
 path=pathlib.Path(temp)/'synthetic-missing-han.ttf';f.save(path)
 result=subprocess.run([sys.executable,sys.argv[1],str(path)],capture_output=True,text=True)
 assert result.returncode!=0
 data=json.loads(result.stdout);assert data['status']=='FAIL' and len(data['missing'])>0
 print('PASS synthetic missing-glyph rejection')`;
 const result=spawnSync('python3',['-c',program,script],{encoding:'utf8'});assert.equal(result.status,0,result.stderr||result.stdout);
});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,font:api.fontIdentities,limits:['Native static technical checks under this actual font only','not historical-font reproduction','no new visual or user acceptance']}));
