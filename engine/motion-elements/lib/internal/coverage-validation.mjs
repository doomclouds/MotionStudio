// Original candidate implementation. Current-realm data only; proxies and modified intrinsics unsupported.
export function record(value, keys, label) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw TypeError(`${label}: plain record required`);
  const ds = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(ds).length !== keys.length) throw TypeError(`${label}: exact fields required`);
  for (const k of keys) if (!Object.hasOwn(ds,k) || !Object.hasOwn(ds[k],'value')) throw TypeError(`${label}: data field ${k} required`);
}
export function number(value, lo, hi, label, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < lo || value > hi || (integer && !Number.isInteger(value))) throw RangeError(`${label}: out of range`);
}
export function dense(a, length) {
  if (!Array.isArray(a) || Object.getPrototypeOf(a) !== Array.prototype || a.length !== length) throw TypeError('values: ordinary exact-length array required');
  const ds = Object.getOwnPropertyDescriptors(a);
  if (Reflect.ownKeys(ds).length !== length+1) throw TypeError('values: dense array without extra fields required');
  for (let i=0;i<length;i++) if (!Object.hasOwn(ds,i) || !Object.hasOwn(ds[i],'value')) throw TypeError('values: data elements required');
}
const tp = Object.getPrototypeOf(Uint8Array.prototype);
const get = k => Object.getOwnPropertyDescriptor(tp,k).get;
const lengthGet = get('length'), bufferGet=get('buffer'), offsetGet=get('byteOffset');
const byteLengthGet=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get;
const resizableGet=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'resizable')?.get;
export function coverage(data, length) {
  if (!data || ![Uint8Array.prototype,Uint8ClampedArray.prototype].includes(Object.getPrototypeOf(data))) throw TypeError('data: current-realm unsigned byte view required');
  if (lengthGet.call(data)!==length) throw RangeError('data: exact length required');
  const buffer=bufferGet.call(data);
  // Intrinsic ArrayBuffer getter rejects shared buffers, independent of shadowed fields.
  byteLengthGet.call(buffer);
  if (resizableGet?.call(buffer)) throw TypeError('data: resizable buffers unsupported');
  const keys=Reflect.ownKeys(data);
  if(keys.length!==length) throw TypeError('data: extra own properties unsupported');
  for(let i=0;i<length;i++) if(keys[i]!==String(i)) throw TypeError('data: extra own properties unsupported');
  return new Uint8Array(buffer,offsetGet.call(data),length).slice();
}
