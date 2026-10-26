import {rational, compare, sub, add, framesToTime} from '../../motion-timeline-core/lib/timeline.mjs';
import {object, fail} from './validate.mjs';
export {rational, framesToTime};
export function time(value) {
  object(value, ['n','d'], ['n','d']);
  if(typeof value.n !== 'string' || typeof value.d !== 'string') fail('Time must use rational string integers');
  return rational(value.n,value.d);
}
export function timing(start, duration) {
  start=time(start); duration=time(duration);
  if(compare(start,rational(0))<0 || compare(duration,rational(0))<=0 || compare(add(start,duration),rational(86400))>0) fail('Timing requires start>=0, duration>0, end<=24h');
  return {start,duration,end:add(start,duration)};
}
export function progress(at, range) {
  at=time(at);
  const phase=compare(at,range.start)<0?'before':compare(at,range.end)>=0?'after':'active';
  if(phase==='before') return {phase,progress:0};
  if(phase==='after') return {phase,progress:1};
  const local=sub(at,range.start);
  return {phase,progress:Number(BigInt(local.n)*BigInt(range.duration.d))/Number(BigInt(local.d)*BigInt(range.duration.n))};
}
export function range(value) {
  object(value,['start','end'],['start','end']);
  const start=time(value.start), end=time(value.end);
  const r=timing(start,sub(end,start));
  return r;
}
