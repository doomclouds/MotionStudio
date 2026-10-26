// Independent, read-only source inspection; scratch decode output is explicitly local.
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {authorizedPath,fileHash,command,capabilities,FORMATS,hash,stable} from './runtime.mjs';
import {fromPCM} from './dsp.mjs';
import {measureFile} from './metrics.mjs';
export async function inspectEncodedAudio(path,{sourceRoots,workDir,expectedFrames,channels,ffmpeg='ffmpeg',ffprobe='ffprobe',signal}={}){
 if(!Number.isSafeInteger(expectedFrames)||expectedFrames<1||expectedFrames>28_800_000)throw Error('expectedFrames must be bounded 48 kHz project frames');
 if(![1,2].includes(channels))throw Error('channels must be mono(1) or stereo(2)');
 if(typeof workDir!=='string')throw Error('Fresh inspection workDir required');workDir=resolve(workDir);await mkdir(workDir);
 try{const coreNames=['inspect.mjs','metrics.mjs','runtime.mjs','dsp.mjs'],core=await Promise.all(coreNames.map(name=>fileHash(new URL(name,import.meta.url))));const local=await authorizedPath(path,sourceRoots),sha256=await fileHash(local),caps=await capabilities({ffmpeg,ffprobe,signal});
 const ff=args=>command(ffmpeg,args,{signal});const input=['-protocol_whitelist','file,pipe','-format_whitelist',FORMATS,'-i',local];
 const {stdout}=await command(ffprobe,['-v','error',...input.slice(0,-2),'-show_streams','-show_format','-of','json',local],{signal});const probe=JSON.parse(stdout),audio=probe.streams.filter(s=>s.codec_type==='audio');if(audio.length!==1)throw Error('Final encoded file must contain exactly one audio stream');const stream=audio[0];if(stream.codec_name!=='aac'||Number(stream.sample_rate)!==48000||stream.channels!==channels)throw Error('Final encoded audio must be AAC, 48kHz, declared mono/stereo');
 const decoded=join(workDir,'decoded.f32');const maxFrames=expectedFrames+1024;
 if(maxFrames*channels>20_000_000)throw Error('Inspection exceeds 20M scalar sample bound');
 await ff(['-hide_banner','-xerror','-nostdin','-v','error','-y',...input,'-map',`0:${stream.index}`,'-vn','-sn','-dn','-c:a','pcm_f32le','-t',String((maxFrames+48000)/48000),'-fs',String((maxFrames+2048)*channels*4),'-f','f32le',decoded]);
 const bytes=(await stat(decoded)).size;if(bytes%(channels*4))throw Error('Partial decoded audio frame');const frames=bytes/(channels*4),padding=frames-expectedFrames;if(padding<0||padding>1024)throw Error('AAC decoded duration outside 0..1024 sample padding tolerance');
 const pcm=fromPCM(await readFile(decoded)),measurements=await measureFile(local,pcm,channels,{ff,hasEbur128:caps.ebur128});if(await fileHash(await authorizedPath(path,sourceRoots))!==sha256)throw Error('Encoded source mutation detected');
 for(let i=0;i<coreNames.length;i++)if(await fileHash(new URL(coreNames[i],import.meta.url))!==core[i])throw Error('Inspector source mutation detected');
 const report={schemaVersion:1,status:'PASS',path:local,sha256,streamIndex:stream.index,frames,expectedFrames,decodedPaddingSamples:padding,durationToleranceSamples:1024,sampleRate:48000,channels,fullDecode:'PASS',measurements,probe,primingPolicy:'FFmpeg MP4 presentation/edit-list/skip-sample handling; trailing decoder padding retained and measured',identity:hash(stable({sha256,ffmpeg:caps.ffmpeg,ffprobe:caps.ffprobe,expectedFrames,channels,core})),review:{listening:{status:'NOT_RUN'},owner:{status:'NOT_RUN'},avSync:{status:'NOT_RUN',reason:'Audio inspection alone does not verify video synchronization'}}};await writeFile(join(workDir,'inspection.json'),JSON.stringify(report,null,2));return report;
 }catch(e){await writeFile(join(workDir,'failure.json'),JSON.stringify({status:'FAIL',error:e.message}));throw e;}
}
