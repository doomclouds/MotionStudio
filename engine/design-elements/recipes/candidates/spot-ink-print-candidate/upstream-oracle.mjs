// Optional external test oracle only. Not a runtime dependency.
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
export const upstreamOracleIdentity=Object.freeze({commit:'bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00',sha256:'38608d32fae1cf963983587d9c64cf21274334f90f9148621bafedb07ec42eb2',source:'https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/risograph/demo/riso.js'});
export async function loadVerifiedUpstream(filename){
 if(typeof filename!=='string'||!path.isAbsolute(filename))throw new Error('--upstream must name an absolute riso.js path');
 const file=await fs.open(filename,'r');let bytes;
 try{const buffer=Buffer.alloc(1024*1024+1);let length=0;while(length<buffer.length){const {bytesRead}=await file.read(buffer,length,buffer.length-length,null);if(!bytesRead)break;length+=bytesRead;}if(length>1024*1024)throw Error('Upstream oracle exceeds 1 MiB');bytes=buffer.subarray(0,length);}finally{await file.close();}
 if(createHash('sha256').update(bytes).digest('hex')!==upstreamOracleIdentity.sha256)throw Error('Upstream oracle does not match fixed-commit SHA-256');
 return bytes.toString('utf8');
}
