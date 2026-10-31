// SPDX-License-Identifier: MIT
// Finite mathematical fixture generator for the independent Python formulation.
import{compileDrape,sampleDrape}from'./index.mjs';
const seeds=[0,1,2,3,4,5,7,11,31,43,91,137,167,257,503,659,811,887,1024,2029,4095,65535,65536,99999,123456,999999,2147483647,2147483648,3000000000,4000000000,4294967294,4294967295];
const out=seeds.map(seed=>{const m=compileDrape({width:333,height:517,seed,low:'#19314e',high:'#ebc6ad',vignette:.25});const samples=[];for(const u of[0,.17,.5,.83,1])for(const v of[0,.25,.5,.75,1])samples.push({u,v,...sampleDrape(m,u,v)});return{model:m,samples};});
console.log(JSON.stringify(out));
