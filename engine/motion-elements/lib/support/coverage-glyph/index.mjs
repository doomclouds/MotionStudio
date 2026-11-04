// Bounded scalar-to-character selection; no raster, font, or scene ownership.
export function coverageGlyph(input) {
 if(!input || Object.getPrototypeOf(input)!==Object.prototype)throw TypeError('plain record required');
 for(const key of ['coverage','luminance'])if(!Object.hasOwn(input,key))throw TypeError('coverage and luminance required');
 const allowed=['coverage','luminance','shade','threshold','ramp','minimumIndex'];
 for(const key of Reflect.ownKeys(input)){if(!allowed.includes(key)||!('value' in Object.getOwnPropertyDescriptor(input,key)))throw TypeError('own data fields only');}
 const {coverage,luminance,shade=1,threshold=.23,ramp=' .,:;-/+*%$0MW#',minimumIndex=0}=input;
 for(const v of [coverage,luminance,shade,threshold])if(!Number.isFinite(v)||v<0||v>1)throw RangeError('unit interval required');
 // Explicit codepoint ramp, not UTF-16 indexing, grapheme segmentation or shaping.
 if(typeof ramp!=='string'||ramp.length>128)throw TypeError('bounded scalar ramp required');
 const glyphs=Array.from(ramp);
 if(glyphs.length<2||glyphs.length>64||glyphs.some(c=>{const cp=c.codePointAt(0);return cp<32||(cp>=0x7f&&cp<=0x9f)||(cp>=0xd800&&cp<=0xdfff)||/\p{Mark}|\p{Format}/u.test(c)||(c!==' '&&/\p{Separator}/u.test(c));}))throw RangeError('2..64 standalone Unicode scalars required; no marks, controls, format characters or non-space separators');
 if(!Number.isInteger(minimumIndex)||minimumIndex<0||minimumIndex>=glyphs.length)throw RangeError('minimumIndex out of range');
 if(coverage<threshold)return null;
 return glyphs[Math.max(minimumIndex,Math.min(glyphs.length-1,Math.floor(luminance*shade*glyphs.length)))];
}
