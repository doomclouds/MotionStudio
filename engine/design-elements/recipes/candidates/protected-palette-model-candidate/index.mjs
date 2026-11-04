// Bounded recipe adaptation of LemoLab's index-identity protection and two-LUT
// selection. Not a new algorithm or rasterizer. See CREDITS.md and licenses/.
function record(v, fields, required) {
  if (!v || Object.getPrototypeOf(v) !== Object.prototype) throw TypeError('ordinary record required');
  for (const k of Reflect.ownKeys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (typeof k !== 'string' || !fields.includes(k) || !d.enumerable || !('value' in d)) throw TypeError('unexpected/non-data field');
  }
  for (const k of required) if (!Object.hasOwn(v,k)) throw TypeError('missing '+k);
}
function array(v, min, max=min) {
  if (!Array.isArray(v) || Object.getPrototypeOf(v)!==Array.prototype || v.length<min || v.length>max || Reflect.ownKeys(v).length!==v.length+1) throw TypeError('ordinary dense array required');
  const a=[];
  for(let i=0;i<v.length;i++) { const d=Object.getOwnPropertyDescriptor(v,String(i)); if(!d || !d.enumerable || !('value' in d)) throw TypeError('dense data array required'); a.push(d.value); }
  return a;
}
function int(v,lo,hi) { if(typeof v!=='number' || !Number.isInteger(v) || v<lo || v>hi) throw RangeError('integer out of range'); return v; }
function palette(v,min=1,max=128) {return array(v,min,max).map(c=>{if(typeof c!=='string'||!/^#[0-9a-fA-F]{6}$/.test(c))throw TypeError('RGB hex required');return c.toLowerCase();});}
export function protectPalette(spec) {
  record(spec,['base','mapped','protectedIndices','protect'],['base','mapped']);
  const base=palette(spec.base,1,256), mapped=palette(spec.mapped,base.length,base.length);
  const ids=spec.protectedIndices===undefined?[]:array(spec.protectedIndices,0,base.length).map(i=>int(i,0,base.length-1));
  if(new Set(ids).size!==ids.length)throw TypeError('duplicate protected index');
  const enabled=spec.protect===undefined?false:spec.protect;
  if(typeof enabled!=='boolean')throw TypeError('protect must be boolean');
  if(enabled)for(const i of ids)mapped[i]=base[i];
  return mapped;
}
export function prepareIndexedPaletteModel(spec) {
  record(spec,['columns','rows','indices','paletteA','paletteB','selection'],['columns','rows','indices','paletteA','paletteB','selection']);
  const columns=int(spec.columns,1,256), rows=int(spec.rows,1,256);
  const a=palette(spec.paletteA), b=palette(spec.paletteB,a.length,a.length);
  const indices=array(spec.indices,columns*rows).map(i=>int(i,-1,a.length-1));
  const selection=array(spec.selection,columns*rows).map(i=>int(i,0,1));
  return {columns,rows,palette:a.concat(b),indices:indices.map((i,k)=>i<0?-1:i+selection[k]*a.length)};
}
