import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='motion.stagger');
assert(item);
const rows=api.compileStagger(item.example);assert.deepEqual(rows.map(r=>r.range.start),[{n:'0',d:'1'},{n:'1',d:'4'},{n:'1',d:'2'}]);assert.deepEqual(rows[2].range.end,{n:'3',d:'2'});assert(Object.isFrozen(rows[0].range));assert.throws(()=>api.compileStagger({...item.example,step:{n:'-1',d:'1'}}));assert.deepEqual(rows,api.compileStagger(item.example));
console.log('motion.stagger contract PASS');
