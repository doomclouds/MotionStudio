// SPDX-License-Identifier: MIT
// Restricted spatial-character snapshot recipe. See NOTICES.md for Orca provenance.
// No parser, operator execution, editor, timing, terminal, audio or device protocol.
export const FONT_FAMILY = 'SpatialGridMono';
export const COLORS = Object.freeze({base:'#838383', quiet:'#3f3f3f', accent:'#70d9c6', paper:'#dededc', ink:'#222222', cursor:'#ffc34e'});
function record(o, keys) {
  if (!o || Object.getPrototypeOf(o) !== Object.prototype) throw Error('plain record required');
  for (const k of Reflect.ownKeys(o)) {
    const d=Object.getOwnPropertyDescriptor(o,k);
    if (typeof k!=='string' || !keys.includes(k) || !Object.hasOwn(d,'value')) throw Error('own data fields only');
  }
  for (const k of keys) if (!Object.hasOwn(o,k)) throw Error('missing field: '+k);
}
function dense(a, max, fn) {
  if (!Array.isArray(a) || Object.getPrototypeOf(a)!==Array.prototype || a.length>max) throw Error('dense bounded array required');
  const out=[];
  for(let i=0;i<a.length;i++) {const d=Object.getOwnPropertyDescriptor(a,''+i);if(!d||!Object.hasOwn(d,'value'))throw Error('own array entries only');out.push(fn(d.value));}
  return out;
}
function integer(x,lo,hi) {if(typeof x!=='number'||!Number.isSafeInteger(x)||x<lo||x>hi)throw Error('integer range');return x;}
function ascii(s,max) {if(typeof s!=='string'||s.length<1||s.length>max||!/^[\x20-\x7e]+$/.test(s))throw Error('printable ASCII required');return s;}
function font(c) {
  c.font=`500 24px ${FONT_FAMILY}`;c.textAlign='left';c.textBaseline='alphabetic';c.direction='ltr';c.letterSpacing='0px';c.wordSpacing='0px';c.fontKerning='none';c.fontStretch='normal';c.fontVariantCaps='normal';c.textRendering='auto';
}
function metrics(c,s) {
  const m=c.measureText(s);
  for(const k of ['width','actualBoundingBoxLeft','actualBoundingBoxRight','actualBoundingBoxAscent','actualBoundingBoxDescent']) if(typeof m[k]!=='number'||!Number.isFinite(m[k])||Math.abs(m[k])>100000)throw Error('invalid native text metrics');
  if(m.width<0)throw Error('invalid text advance');return m;
}
export function normalizeGrid(input) {
  record(input,['columns','rows','cellWidth','cellHeight','cells','marks','cursor']);
  const columns=integer(input.columns,8,64),rows=integer(input.rows,4,32),cellWidth=integer(input.cellWidth,18,28),cellHeight=integer(input.cellHeight,28,36);
  const width=columns*cellWidth,height=rows*cellHeight;
  if(width*height>900000)throw Error('logical pixel budget');
  const cells=dense(input.cells,rows,s=>{ascii(s,columns);if(s.length!==columns)throw Error('row width');return s;});
  if(cells.length!==rows)throw Error('row count');
  const seen=new Set(),roleCounts={accent:0,paper:0,bright:0};
  const marks=dense(input.marks,columns*rows,m=>{
    record(m,['column','row','role']);const column=integer(m.column,0,columns-1),row=integer(m.row,0,rows-1),role=m.role;
    if(typeof role!=='string'||!Object.hasOwn(roleCounts,role))throw Error('mark role');
    const key=row*columns+column;if(seen.has(key))throw Error('duplicate mark');seen.add(key);roleCounts[role]++;
    return Object.freeze({column,row,role});
  });
  record(input.cursor,['column','row']);const cursor=Object.freeze({column:integer(input.cursor.column,0,columns-1),row:integer(input.cursor.row,0,rows-1)});
  let dots=0,spaces=0,glyphs=0;for(const row of cells)for(const ch of row){if(ch==='.')dots++;else if(ch===' ')spaces++;else glyphs++;}
  return Object.freeze({kind:'spatial-character-grid',columns,rows,cellWidth,cellHeight,cells:Object.freeze(cells),marks:Object.freeze(marks),cursor,width,height,markedCount:marks.length,roleCounts:Object.freeze(roleCounts),counts:Object.freeze({dots,spaces,glyphs,total:columns*rows})});
}
export function createSpatialCharacterKit(api) {
  if(!api||typeof api.createCanvas!=='function')throw Error('trusted fresh Native Canvas factory required');
  const storage=new WeakMap();
  function wrap(canvas,plan) {const h=Object.freeze({width:plan.width,height:plan.height,plan});storage.set(h,canvas);return h;}
  function gridTile(input) {
    const p=normalizeGrid(input),q=api.createCanvas(1,1).getContext('2d'),baseline=(p.cellHeight-24)/2+22; font(q);
    const ink=new Map();
    for(const row of p.cells)for(const ch of row) {
      if(ink.has(ch)||ch==='.')continue;
      const m=metrics(q,ch),left=(p.cellWidth-m.width)/2;
      if(left-m.actualBoundingBoxLeft<0.5||left+m.actualBoundingBoxRight>p.cellWidth-0.5||baseline-m.actualBoundingBoxAscent<0.5||baseline+m.actualBoundingBoxDescent>p.cellHeight-0.5)throw Error('glyph ink exceeds cell guard');
      ink.set(ch,{left});
    }
    const a=api.createCanvas(p.width*2,p.height*2),c=a.getContext('2d');c.scale(2,2);font(c);
    const roles=new Map(p.marks.map(m=>[m.row*p.columns+m.column,m.role]));
    for(let row=0;row<p.rows;row++)for(let column=0;column<p.columns;column++) {
      const ch=p.cells[row][column],x=column*p.cellWidth,y=row*p.cellHeight,role=roles.get(row*p.columns+column),cursor=column===p.cursor.column&&row===p.cursor.row;
      const filled=cursor||role==='accent'||role==='paper';
      if(filled){c.fillStyle=cursor?COLORS.cursor:role==='accent'?COLORS.accent:COLORS.paper;c.fillRect(x,y,p.cellWidth,p.cellHeight);}
      c.fillStyle=filled?COLORS.ink:role==='bright'?COLORS.accent:ch==='.'?COLORS.quiet:COLORS.base;
      if(ch==='.'){c.beginPath();c.arc(x+p.cellWidth/2,y+baseline-4,2.4,0,Math.PI*2);c.fill();}
      else c.fillText(ch,x+ink.get(ch).left,y+baseline);
    }
    return wrap(a,p);
  }
  function summaryTile(handle,options) {
    if(!storage.has(handle)||handle.plan.kind!=='spatial-character-grid')throw Error('same-builder grid required');
    record(options,['label']);const label=ascii(options.label,16);if(!/[^ ]/.test(label))throw Error('nonblank label');
    const p=handle.plan;if(p.columns<32)throw Error('summary needs at least32 columns');
    const width=p.width,height=132,half=width/2;
    const rows=[ [`GRID ${p.columns}x${p.rows}`,`CURSOR ${p.cursor.column},${p.cursor.row}`], [`MARKS ${p.markedCount}`,`GLYPHS ${p.counts.glyphs}`], [`DOTS ${p.counts.dots}`,`SPACES ${p.counts.spaces}`] ];
    const q=api.createCanvas(1,1).getContext('2d');font(q);
    const check=(s,x,y,w)=>{const m=metrics(q,s);if(x-m.actualBoundingBoxLeft<1||x+Math.max(m.width,m.actualBoundingBoxRight)>x+w||y-m.actualBoundingBoxAscent<1||y+m.actualBoundingBoxDescent>height-1)throw Error('summary ink exceeds slot');};
    check(label,12,26,width-24);for(let i=0;i<3;i++)for(let j=0;j<2;j++)check(rows[i][j],12+j*half,58+i*32,half-24);
    const a=api.createCanvas(width*2,height*2),c=a.getContext('2d');c.scale(2,2);font(c);c.fillStyle=COLORS.accent;c.fillText(label,12,26);c.fillStyle=COLORS.paper;
    rows.forEach((r,i)=>r.forEach((s,j)=>c.fillText(s,12+j*half,58+i*32)));
    return wrap(a,Object.freeze({kind:'spatial-character-summary',width,height,label,source:p,rows:Object.freeze(rows.map(r=>Object.freeze(r)))}));
  }
  function place(ctx,handle,x,y) {
    if(!storage.has(handle)||typeof x!=='number'||typeof y!=='number'||!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>16384||Math.abs(y)>16384)throw Error('same-builder handle and bounded finite placement required');
    ctx.drawImage(storage.get(handle),x,y,handle.width,handle.height);
  }
  return Object.freeze({gridTile,summaryTile,place});
}
