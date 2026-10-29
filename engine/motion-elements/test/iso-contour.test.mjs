import test from'node:test';import assert from'node:assert/strict';import{compileContourGrid as compile,extractIsoContours as extract}from'../lib/foundations/geometry/iso-contour.mjs';
const spec=(columns=3,rows=3)=>({columns,rows,x:0,y:0,width:2,height:2}),grid=(s,fn)=>Array.from({length:s.rows*s.columns},(_,i)=>fn(s.x+(i%s.columns)*s.width/(s.columns-1),s.y+Math.floor(i/s.columns)*s.height/(s.rows-1)));
test('single interior peak makes closed contour; exact interpolation',()=>{let p=compile(spec()),s=extract(p,{values:[0,0,0,0,2,0,0,0,0],level:1});assert.equal(s.closedLoopCount,1);assert.equal(s.openStripCount,0);assert.ok(s.contours[0].points.every(p=>p.x>=.5&&p.x<=1.5&&p.y>=.5&&p.y<=1.5));});
test('linear ramp crosses boundary as open strip',()=>{let sp=spec(4,4),p=compile(sp),s=extract(p,{values:grid(sp,(x,y)=>x),level:.7});assert.equal(s.closedLoopCount,0);assert.equal(s.openStripCount,1);for(let q of s.contours[0].points)assert.ok(Math.abs(q.x-.7)<1e-12);assert.equal(s.contours[0].points.length,7);});
test('annulus produces nested two loops without boundary strips',()=>{let sp={...spec(65,65),x:-2,y:-2,width:4,height:4},p=compile(sp),s=extract(p,{values:grid(sp,(x,y)=>Math.exp(-(((Math.hypot(x,y)-1)/.3)**2))),level:.51});assert.equal(s.closedLoopCount,2);assert.equal(s.openStripCount,0);});
test('checkerboard saddle uses declared NW-SE diagonal deterministically',()=>{let p=compile(spec(2,2)),v=[2,0,0,2],a=extract(p,{values:v,level:1});assert.equal(a.contours.length,2);assert.equal(a.segmentCount,2);assert.deepEqual(extract(p,{values:v,level:1}),a);});
test('exact ties and plateau are explicit diagnostics, not hidden clamping',()=>{let p=compile(spec());let a=extract(p,{values:Array(9).fill(0),level:0});assert.equal(a.degeneracies.plateauTriangles,8);assert.equal(a.segmentCount,0);let b=extract(p,{values:[-1,-1,-1,0,0,0,1,1,1],level:0});assert.equal(b.openStripCount,1);assert.ok(b.contours[0].points.every(p=>p.y===1));});
test('input isolation, frozen outputs, absolute repeated calls',()=>{let p=compile(spec()),v=[0,0,0,0,2,0,0,0,0],a=extract(p,{values:v,level:1}),before=JSON.stringify(a);v[4]=3;extract(p,{values:v,level:2});assert.equal(JSON.stringify(a),before);assert.ok(Object.isFrozen(a.contours[0].points[0]));});
test('reject nonfinite, unknown own keys including symbol and nonenumerable, sparse/getter arrays',()=>{for(const alter of[s=>s.rows=1,s=>s.columns=3.5,s=>s.width=0,s=>s.x=Infinity,s=>s[Symbol('x')]=1,s=>Object.defineProperty(s,'extra',{value:1})]){let s=spec();alter(s);assert.throws(()=>compile(s));}let p=compile(spec());for(const alter of[v=>v[2]=NaN,v=>delete v[2],v=>v.foo=1,v=>v[Symbol('x')]=1,v=>Object.defineProperty(v,'2',{get:()=>0})]){let v=Array(9).fill(0);alter(v);assert.throws(()=>extract(p,{values:v,level:1}));}assert.throws(()=>extract({...p},{values:Array(9).fill(0),level:1}));});
test('all16 scalar corner cases have deterministic complement-equivalent isolines',()=>{const p=compile(spec(2,2)),norm=s=>s.contours.flatMap(c=>c.points.map(p=>[p.x,p.y].join(','))).sort();for(let mask=0;mask<16;mask++){const values=Array.from({length:4},(_,i)=>(mask>>i)&1?2:0),a=extract(p,{values,level:1}),b=extract(p,{values:values.map(x=>2-x),level:1});assert.deepEqual(norm(a),norm(b));assert.equal(a.segmentCount,b.segmentCount);}});
test('exact-level branch is explicitly split and diagnosed',()=>{const p=compile(spec()),s=extract(p,{values:[-1,1,-1,1,0,-1,-1,-1,-1],level:0});assert.equal(s.degeneracies.branchVertices,1);assert.equal(s.openStripCount,4);assert.equal(s.closedLoopCount,0);});
test('100 seeded dense fields visit each segment once and remain in bounds',()=>{let seed=73;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};const p=compile(spec(11,9));for(let k=0;k<100;k++){const v=Array.from({length:99},rnd),s=extract(p,{values:v,level:.501});assert.equal(s.degeneracies.branchVertices,0);const traversed=s.contours.reduce((n,c)=>n+c.points.length-(c.closed?0:1),0);assert.equal(traversed,s.segmentCount);for(let c of s.contours)for(let a of c.points)assert.ok(a.x>=0&&a.x<=2&&a.y>=0&&a.y<=2);}});
test('IEEE collapsed triangle segments are discarded, without epsilon snapping',()=>{
 const p=compile({...spec(2,2),width:1,height:1});
 for(const level of [Number.MIN_VALUE,Number.MIN_VALUE*2]){const s=extract(p,{values:[0,1e12,1e12,1e12],level});assert.equal(s.segmentCount,0);assert.equal(s.degeneracies.zeroLengthSegments,2);assert.deepEqual(s.contours,[]);}
 const s=extract(p,{values:[0,1,1,1],level:1e-300});assert.equal(s.segmentCount,2);assert.equal(s.degeneracies.zeroLengthSegments,0);assert.ok(s.contours[0].points.some(p=>p.x>0||p.y>0));
 const large=compile({...spec(2,2),x:1e6,y:1e6,width:.001,height:.001});const c=extract(large,{values:[0,1,1,1],level:1e-10});assert.equal(c.segmentCount,0);assert.equal(c.degeneracies.zeroLengthSegments,2);
});
test('65536 budget inclusive; dimension and coordinate domains explicit',()=>{
 assert.equal(compile(spec(256,256)).sampleCount,65536);assert.equal(compile(spec(1025,2)).sampleCount,2050);
 for(const s of [spec(257,256),spec(512,512),spec(1026,2),{...spec(),height:.0009},{...spec(),x:1000001}])assert.throws(()=>compile(s));
});
test('all-above is not a filled-domain boundary; exact zero discard counts triangles',()=>{
 const p=compile(spec(2,2));for(const values of [Array(4).fill(2),Array(4).fill(-2)]){const s=extract(p,{values,level:0});assert.deepEqual(s.contours,[]);assert.equal(s.degeneracies.zeroLengthSegments,0);}
 const s=extract(p,{values:[0,1,1,1],level:0});assert.equal(s.degeneracies.zeroLengthSegments,2);assert.equal(s.segmentCount,0);
 // Two triangles share the exact-level diagonal: one output edge, not a zero-length discard.
 const d=extract(p,{values:[0,1,1,0],level:0});assert.equal(d.segmentCount,1);assert.equal(d.degeneracies.zeroLengthSegments,0);
});
test('records and arrays reject accessors, nonenumerable extras, subclasses and foreign realms',async()=>{
 const{runInNewContext}=await import('node:vm');let hits=0,s=spec();Object.defineProperty(s,'width',{get(){hits++;return 2;}});assert.throws(()=>compile(s));assert.equal(hits,0);
 for(const s of [Object.assign(Object.create(null),spec()),runInNewContext('({columns:3,rows:3,x:0,y:0,width:2,height:2})')])assert.throws(()=>compile(s));
 const p=compile(spec());for(const vals of [new(class extends Array{})(...Array(9).fill(0)),runInNewContext('Array(9).fill(0)')])assert.throws(()=>extract(p,{values:vals,level:0}));
 for(const alter of [v=>Object.defineProperty(v,'extra',{value:1}),v=>Object.defineProperty(v,'0',{value:0,enumerable:false})]){const v=Array(9).fill(0);alter(v);assert.throws(()=>extract(p,{values:v,level:0}));}
 const q={values:Array(9).fill(0),level:0};Object.defineProperty(q,'level',{get(){hits++;return 0;}});assert.throws(()=>extract(p,q));assert.equal(hits,0);
 for(const key of [Symbol('unknown'),'hidden']){const q={values:Array(9).fill(0),level:0};Object.defineProperty(q,key,{value:0});assert.throws(()=>extract(p,q));}
});
test('branded plans and independent-process reverse seeks',async()=>{
 const {execFileSync}=await import('node:child_process'),url=new URL('../lib/foundations/geometry/iso-contour.mjs',import.meta.url).href,p=compile(spec()),v=[0,0,0,0,2,0,0,0,0];
 const other=await import(url+'?another');assert.throws(()=>other.extractIsoContours(p,{values:v,level:1}));assert.throws(()=>extract(JSON.parse(JSON.stringify(p)),{values:v,level:1}));
 const levels=[.2,1,.5,1.5,0],baseline=levels.map(level=>extract(p,{values:v,level}));for(let i=levels.length-1;i>=0;i--)assert.deepEqual(extract(p,{values:v,level:levels[i]}),baseline[i]);
 const code=`import{compileContourGrid,extractIsoContours}from ${JSON.stringify(url)};const p=compileContourGrid(${JSON.stringify(spec())});console.log(JSON.stringify(${JSON.stringify(levels)}.map(level=>extractIsoContours(p,{values:${JSON.stringify(v)},level}))));`;
 assert.deepEqual(JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'})),baseline);
});
test('all 3125 small integer 2x2 fields/levels agree with independent rational triangle intersection oracle',()=>{
 const p=compile({...spec(2,2),width:1,height:1}),xy=[[0n,0n],[1n,0n],[0n,1n],[1n,1n]];
 const pointKey=p=>p.map(x=>Number(x[0])/Number(x[1])).map(x=>x.toFixed(12)).join(',');
 const edgeKey=(a,b)=>[a,b].sort().join('|');
 for(let mask=0;mask<625;mask++){let k=mask;const v=Array.from({length:4},()=>{const x=k%5-2;k=Math.floor(k/5);return x;});for(let level=-2;level<=2;level++){
  const expected=new Set();let zeros=0,plateaus=0;
  for(const ids of [[0,1,3],[0,3,2]]){
   if(ids.every(i=>v[i]===level))plateaus++;
   const hits=[];for(const[a,b]of[[ids[0],ids[1]],[ids[1],ids[2]],[ids[2],ids[0]]]){
    if((v[a]>level)===(v[b]>level))continue;
    const den=BigInt(v[b]-v[a]),num=BigInt(level-v[a]);
    hits.push(pointKey(xy[a].map((x,j)=>[x*den+(xy[b][j]-x)*num,den])));
   }
   if(hits.length===2){if(hits[0]===hits[1])zeros++;else expected.add(edgeKey(...hits));}
  }
  const s=extract(p,{values:v,level}),actual=new Set();for(const c of s.contours){const pts=c.points.map(p=>[p.x,p.y].map(x=>x.toFixed(12)).join(','));for(let i=1;i<pts.length;i++)actual.add(edgeKey(pts[i-1],pts[i]));if(c.closed)actual.add(edgeKey(pts.at(-1),pts[0]));}
  assert.deepEqual([...actual].sort(),[...expected].sort(),`field=${v};level=${level}`);assert.equal(s.segmentCount,expected.size);assert.equal(s.degeneracies.zeroLengthSegments,zeros);assert.equal(s.degeneracies.plateauTriangles,plateaus);
 }}
});

test('a branch-start cycle may be closed while a separate branch strip is open',()=>{
 const p=compile(spec()),s=extract(p,{values:[-1,0,1,-1,1,-1,-1,-1,-1],level:0});
 assert.equal(s.degeneracies.branchVertices,1);assert.equal(s.closedLoopCount,1);assert.equal(s.openStripCount,1);
 assert.equal(s.contours.reduce((n,c)=>n+c.points.length-(c.closed?0:1),0),s.segmentCount);
 const loop=s.contours.find(c=>c.closed);assert.notDeepEqual(loop.points[0],loop.points.at(-1));
});
