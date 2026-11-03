// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {linkedQuote,fixtures} from './linked-quote.mjs';
for (const fixture of fixtures) test(`source-bound quote / ${fixture.name}`, () => {
  const {source,selection}=structuredClone(fixture);
  const sourceText=source.lines.join('\n');
  const response={sourceId:source.id,selectionId:selection.id,sourceText,start:selection.start,end:selection.end,text:'An authored note about this passage.'};
  const before=JSON.stringify({source,selection,response});
  const result=linkedQuote(source,selection,response);
  assert.equal(result.quote,sourceText.slice(selection.start,selection.end));
  assert.equal(result.spans.map(x=>x.text).join(''),result.quote);
  assert.equal(result.quoteLines.join('\n'),result.quote);
  assert.equal(JSON.stringify({source,selection,response}),before);
  assert.throws(()=>linkedQuote(source,{...selection,sourceId:'other'}),/source mismatch/);
  assert.throws(()=>linkedQuote(source,selection,{...response,selectionId:'other'}),/identity mismatch/);
  assert.throws(()=>linkedQuote(source,selection,{...response,sourceId:'other'}),/identity mismatch/);
  assert.throws(()=>linkedQuote({...source,lines:['X'+source.lines[0].slice(1),...source.lines.slice(1)]},selection,response),/stale/);
  assert.throws(()=>linkedQuote(source,{...selection,end:selection.end-1},response),/stale/);
  assert.throws(()=>linkedQuote(source,{...selection,start:-1}),/range/);
  assert.throws(()=>linkedQuote({...source,lines:['café']},selection),/ASCII/);
  const lf=source.lines[0].length;
  for(const [start,end]of[[lf,lf+2],[lf-1,lf+1],[lf-1,lf+2]]){
    const r=linkedQuote(source,{...selection,start,end});
    assert.equal(r.quote,sourceText.slice(start,end));
    assert.equal(r.spans.map(x=>x.text).join(''),r.quote);
    assert.equal(r.quoteLines.join('\n'),r.quote);
    assert(r.spans.some(x=>x.kind==='line-break'));
  }
  assert.throws(()=>linkedQuote(source,{...selection,start:lf,end:lf+1}),/visible/);
});
