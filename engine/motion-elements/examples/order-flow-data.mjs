/** Synthetic 100-order batch for the proposed film; not a production result. */
import {layeredDagLayout} from '../lib/layered-dag.mjs';
import {compileFlowHandoff,sampleFlowHandoff} from '../lib/recipes/flow-handoff.mjs';
import {rational} from '../lib/time.mjs';
export const labels=Object.freeze({received:'Received',auto:'Auto cleared',review:'Review',held:'Held',ready:'Ready',fulfilled:'Fulfilled'});
const links=held=>[
 {linkId:'received-auto',fromId:'received',toId:'auto',value:40},
 {linkId:'received-review',fromId:'received',toId:'review',value:60},
 {linkId:'auto-ready',fromId:'auto',toId:'ready',value:40},
 {linkId:'review-held',fromId:'review',toId:'held',value:held},
 {linkId:'review-ready',fromId:'review',toId:'ready',value:60-held},
 {linkId:'ready-fulfilled',fromId:'ready',toId:'fulfilled',value:100-held},
];
export function createOrderFlowPlan(){
 const before=links(40),after=links(5);
 const layout=layeredDagLayout({nodes:Object.keys(labels).map(itemId=>({itemId,width:116,height:128})),links:before.map(({value,...link})=>link),layerGap:156,nodeGap:70});
 const plan=compileFlowHandoff({nodes:layout.items,from:before,to:after,range:{start:rational(9,2),end:rational(19,2)},unitsToPixels:.9,portGap:10,samples:128});
 return{layout,plan};
}
export function sampleOrderFlow(plan,at){
 const state=sampleFlowHandoff(plan,at),held=state.flow.balances.find(n=>n.itemId==='held').incoming;
 // Intermediate weights are visual interpolation, not fractional real orders.
 // Couple display rounding to the single 100-order budget rather than rounding
 // two .5 counters independently and accidentally displaying 101 orders.
 const displayHeld=Math.round(held);
 return{...state,display:{received:100,held:displayHeld,fulfilled:100-displayHeld},dataSource:'SYNTHETIC_ILLUSTRATIVE_BATCH'};
}
