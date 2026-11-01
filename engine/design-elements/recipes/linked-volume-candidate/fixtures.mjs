// SPDX-License-Identifier: MIT
// Newly authored abstract byte fields. No reference sampling / patient data.
import {createVolume} from './model.mjs';
export function input(kind){if(!['strata','lattice'].includes(kind))throw Error('fixture');const size=kind==='strata'?[36,28,24]:[24,32,40],values=[];for(let z=0;z<size[2];z++)for(let y=0;y<size[1];y++)for(let x=0;x<size[0];x++){const X=x/(size[0]-1),Y=y/(size[1]-1),Z=z/(size[2]-1);values.push(kind==='strata'?Math.round(255*(.15+.4*X+.25*Y+.2*Z)):Math.round(255*(.5+.5*Math.sin(2*Math.PI*X)*Math.cos(3*Math.PI*Y)*Math.sin(2*Math.PI*Z))));}return {size,values,cursor:kind==='strata'?[11,18,9]:[16,12,25],thresholds:[48,80,112,144,176,208,232]};}
export function fixture(kind){return createVolume(input(kind));}
