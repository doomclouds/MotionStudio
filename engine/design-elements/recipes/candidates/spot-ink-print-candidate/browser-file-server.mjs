import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {loadVerifiedUpstream} from './upstream-oracle.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const allowed=new Set(['/browser-tests.html','/spot-ink.mjs','/shader-sources.mjs','/render-plan.mjs','/validation.mjs','/fixtures.mjs']);
export async function createFixtureServer(upstreamPath){
 const oracle=upstreamPath===undefined?null:await loadVerifiedUpstream(upstreamPath);
 return http.createServer(async(req,res)=>{try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(req.method!=='GET'){res.writeHead(404);res.end();return;}
  if(pathname==='/reference/upstream-riso.js'&&oracle!==null){res.setHeader('Content-Type','text/javascript');res.end(oracle);return;}
  if(!allowed.has(pathname)){res.writeHead(404);res.end();return;}
  const filename=path.join(root,pathname.slice(1)),data=await fs.readFile(filename);
  res.setHeader('Content-Type',pathname.endsWith('.html')?'text/html':'text/javascript');res.end(data);
 }catch{res.writeHead(404);res.end();}});
}
