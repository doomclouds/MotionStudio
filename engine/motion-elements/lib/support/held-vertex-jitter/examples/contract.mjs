import {compileHeldVertexJitter,sampleHeldVertexJitter} from '../index.mjs';
export const cases=[
 {points:[{x:10,y:20},{x:50,y:20},{x:80,y:50},{x:130,y:50}],seed:'route',amplitude:1.5,holdFrames:4},
 {points:[{x:20,y:20},{x:100,y:20},{x:110,y:85},{x:15,y:90},{x:20,y:20}],seed:'note-card',amplitude:2,holdFrames:3,lockEndpoints:false},
];
export const plans=cases.map(compileHeldVertexJitter);
export function sampledExamples(frame){return plans.map(p=>sampleHeldVertexJitter(p,frame));}
