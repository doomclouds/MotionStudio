// SPDX-License-Identifier: MIT
// Executable method example, not a registered component or general text API.
import {pathToFileURL} from 'node:url';

export function linkedQuote(source, selection, response = null) {
  const stableId = x => typeof x === 'string' && /^[a-z][a-z0-9-]{0,39}$/.test(x);
  if (!source || !selection || !stableId(source.id) || !stableId(selection.id)) throw TypeError('source and selection ids required');
  if (!Array.isArray(source.lines) || source.lines.length < 1 || source.lines.length > 8 || Object.keys(source.lines).length !== source.lines.length) throw TypeError('1..8 authored lines');
  if (source.lines.some(x => typeof x !== 'string' || !x.length || x.length > 100 || /[^\x20-\x7e]/.test(x))) throw TypeError('nonempty printable ASCII lines only');
  const sourceText = source.lines.join('\n');
  if (selection.sourceId !== source.id) throw TypeError('selection source mismatch');
  const {start, end} = selection;
  // UTF-16 code units, half-open. Inserted LF counts; ASCII makes units unambiguous.
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > sourceText.length) throw RangeError('invalid source range');
  const quote = sourceText.slice(start, end);
  if (!quote.trim()) throw RangeError('no visible selected text');
  if (response) {
    if (response.sourceId !== source.id || response.selectionId !== selection.id) throw TypeError('response identity mismatch');
    // IDs alone do not invalidate old responses when callers reuse them after editing.
    // This example requires the exact earlier source snapshot and range as well.
    if (response.sourceText !== sourceText || response.start !== start || response.end !== end) throw TypeError('stale response snapshot or range');
    if (typeof response.text !== 'string' || !response.text.trim()) throw TypeError('authored response text required');
  }
  // Preserve LF explicitly rather than dropping invisible separators from geometry.
  const spans = [];
  let offset = 0;
  source.lines.forEach((line, lineIndex) => {
    const a = Math.max(start, offset), b = Math.min(end, offset + line.length);
    if (b > a) spans.push({kind:'text',lineIndex,start:a-offset,end:b-offset,text:line.slice(a-offset,b-offset)});
    const newline = offset + line.length;
    if (lineIndex < source.lines.length-1 && start <= newline && end > newline) spans.push({kind:'line-break',lineIndex,text:'\n'});
    offset += line.length + 1;
  });
  if (spans.map(x => x.text).join('') !== quote) throw Error('source span invariant');
  return {sourceId:source.id,selectionId:selection.id,quote,quoteLines:quote.split('\n'),spans,response:response?.text??null};
}

// Original fictional fixtures, not copied reference-video text or UI.
export const fixtures = [
  {name:'courtyard',source:{id:'courtyard',lines:['Keep the watering time unchanged.','Compare the two beds for one week.']},selection:{id:'watering',sourceId:'courtyard',start:0,end:null}},
  {name:'workshop',source:{id:'workshop',lines:['Leave a note beside unfinished work.','Name the next step, not only the problem.']},selection:{id:'handoff',sourceId:'workshop',start:8,end:null}}
];
// Explicit fixture endpoint, independent of incidental hardcoded string lengths.
fixtures[0].selection.end = fixtures[0].source.lines.join('\n').length;
fixtures[1].selection.end = fixtures[1].source.lines[0].length - 1;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const f of fixtures) console.log(JSON.stringify({name:f.name,...linkedQuote(f.source,f.selection)},null,2));
}
