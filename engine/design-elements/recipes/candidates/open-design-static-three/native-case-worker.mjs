import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';import runtime from './shared/runtime.cjs';import io from './shared/external-io.cjs';import locks from './source-lock.json' with {type:'json'};
// Auxiliary worker: test-integration.mjs supplies the case and variant.
const args=process.argv.slice(2),usage='Usage: node native-case-worker.mjs <data-chart|light-leak|bold-signal> <reference|transfer>';
if(args.length===1&&args[0]==='--help'){console.log(usage);process.exit(0)}
const[id,variant]=args;
if(args.length!==2||!Object.hasOwn(runtime.CASES,id)||!['reference','transfer'].includes(variant)){console.error(usage);process.exit(2)}
runtime.caseInfo(id);const root=io.repositoryRoot(),base=path.dirname(fileURLToPath(import.meta.url));const{prepareNative}=await import(path.join(root,'engine/motion-render-core/lib/native.mjs'));
const renderer=await prepareNative({scenePath:path.join(base,id,`scene-${variant}.mjs`),canvasModulePath:process.env.MOTIONSTUDIO_CANVAS_MODULE});try{await renderer.renderFrame(0);const digest=runtime.sha(renderer.png());assert.equal(digest,locks.expectedStaticPngSHA256[id][variant]);await renderer.verifyIdentity();await assert.rejects(()=>renderer.renderFrame(1),/outside/i);console.log(JSON.stringify({case:id,variant,pngSHA256:digest,nativeCore:'PASS',sourceAndExternalFontIdentity:'PASS',oneFrameOnly:true}))}finally{await renderer.close()}
