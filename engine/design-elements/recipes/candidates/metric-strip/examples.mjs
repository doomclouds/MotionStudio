// Synthetic model examples only: no renderer, live source, fonts or files.
import {pathToFileURL} from 'node:url';
import {layoutMetricStrip} from './metric-strip.mjs';
export const examples=[
 {name:'workshop-snapshot',input:{bounds:{x:20,y:30,width:720,height:140},items:[
  {id:'notes',label:'Notes received',kind:'count',value:18,delta:{text:'4 added in this fictional batch',meaning:'neutral'}},
  {id:'ready',label:'Plans checked',kind:'part-whole',value:7,total:12},
  {id:'open',label:'Questions remaining',kind:'count',value:3,delta:{text:'2 fewer to resolve',meaning:'favorable'}}]}},
 {name:'library-snapshot',input:{bounds:{x:0,y:0,width:440,height:120},items:[
  {id:'books',label:'Books returned',kind:'count',value:8},
  {id:'shelves',label:'Shelves checked',kind:'part-whole',value:4,total:5}]}}
];
export function runExamples(){return examples.map(({name,input})=>({name,disclosure:'SYNTHETIC STATIC MODEL',model:layoutMetricStrip(input)}));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(runExamples(),null,2));
