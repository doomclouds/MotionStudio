// Derived from LemoLab riso.js, MIT Copyright (c) 2026 LemoLab.
// Full copyright and permission notice: licenses/LemoLab-MIT.txt.
// Fixed source and changes: PROVENANCE.md. Not a color-managed print model.
import {spotInkShaderSources} from './shader-sources.mjs';
import {createSpotInkRenderPlan} from './render-plan.mjs';
import {record,canvas} from './validation.mjs';
export function createSpotInkCompositor(config) {
  record(config,['outputCanvas','inputCanvas'],'config');
  const {outputCanvas:out,inputCanvas:input}=config;
  canvas(out,'outputCanvas'); canvas(input,'inputCanvas');
  if (out===input || out.width!==input.width || out.height!==input.height) throw new RangeError('distinct equal-size canvases required');
  const W=out.width,H=out.height;
  const gl=out.getContext('webgl2',{preserveDrawingBuffer:true,antialias:false,alpha:false});
  if (!gl) throw new Error('WebGL2 unavailable');
  let disposed=false;
  const resources=[];
  const own=(type,x)=>{if(!x) throw new Error('WebGL2 allocation failed'); resources.push([type,x]); return x;};
  const dispose=()=>{if(disposed)return; disposed=true; for(const [type,x] of resources.reverse()) gl['delete'+type](x); resources.length=0;};
  try {
    const compile=(type,src)=>{const x=own('Shader',gl.createShader(type));gl.shaderSource(x,src);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;};
    const pr=own('Program',gl.createProgram());
    gl.attachShader(pr,compile(gl.VERTEX_SHADER,spotInkShaderSources.vertex));gl.attachShader(pr,compile(gl.FRAGMENT_SHADER,spotInkShaderSources.fragment));gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    const vao=own('VertexArray',gl.createVertexArray());gl.bindVertexArray(vao);
    const b=own('Buffer',gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const tex=own('Texture',gl.createTexture());gl.bindTexture(gl.TEXTURE_2D,tex);
    for(const name of ['TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER'])gl.texParameteri(gl.TEXTURE_2D,gl[name],gl.LINEAR);
    for(const name of ['TEXTURE_WRAP_S','TEXTURE_WRAP_T'])gl.texParameteri(gl.TEXTURE_2D,gl[name],gl.CLAMP_TO_EDGE);
    const u={};for(const n of ['Tex','Res','Off','Rot','Ang','Ink','Paper','Seed','Sheet','Boil','Period','Gate','Sweep','Grain'])u[n]=gl.getUniformLocation(pr,'u'+n);
    const render=(raw)=>{
      if(disposed)throw new Error('compositor disposed');
      if(gl.isContextLost())throw new Error('WebGL2 context lost');
      if(out.width!==W||out.height!==H||input.width!==W||input.height!==H)throw new RangeError('canvas resized; recreate compositor');
      const plan=createSpotInkRenderPlan({width:W,height:H,options:raw});
      gl.useProgram(pr);gl.bindVertexArray(vao);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,W,H);
      gl.disable(gl.BLEND);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.colorMask(true,true,true,true);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,input);
      for(const [name,uniform] of Object.entries(plan.uniforms)) {
        const location=u[name.slice(1)];
        if(uniform.type==='1i')gl.uniform1i(location,uniform.value[0]);
        else gl['uniform'+uniform.type](location,uniform.value);
      }
      gl.drawArrays(gl.TRIANGLES,0,3);
      const error=gl.getError();if(error!==gl.NO_ERROR)throw new Error('WebGL2 render error '+error);
    };
    return Object.freeze({render,dispose});
  } catch(e) {dispose();throw e;}
}
