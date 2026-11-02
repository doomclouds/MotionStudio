// SPDX-License-Identifier: Apache-2.0
import {createGlyphEvidenceKit} from './index.mjs';const k=createGlyphEvidenceKit(),models=[];
for(const instance of ['serif-display','serif-soft','sans-text','sans-heavy'])for(const size of [48,86,137,220])for(const text of ['AV','WMW','j.f','i l','Hello 2026','[]{}()/','1'.repeat(20),'A  ']){const m=k.model({text,instance,size});models.push({text,instance,size,unitsPerEm:m.unitsPerEm,axes:m.axes,advance:m.line.advance,ink:m.line.ink,glyphs:m.line.glyphs.map(({path,...g})=>g)});}console.log(JSON.stringify(models));
