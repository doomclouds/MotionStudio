# Standalone diagnostic backend. Existing Python Pillow + libEGL + Node required.
# Compiles only canonical sources returned by the sibling validated Node exporter.
import ctypes as C
import argparse, json, os, subprocess
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--plate',required=True)
parser.add_argument('--options',required=True)
parser.add_argument('--out',required=True,help='new absolute output directory outside this package')
parser.add_argument('--node',default='node')
args=parser.parse_args()
exporter=Path(__file__).resolve().with_name('export-render-plan.mjs')
root=Path(__file__).resolve().parent
requested=Path(args.out)
if not requested.is_absolute(): raise ValueError('--out must be absolute')
output_dir=requested.parent.resolve(strict=True)/requested.name
if output_dir==root or root in output_dir.parents: raise ValueError('--out cannot be inside package')
output_dir.mkdir() # existing path/symlink refused; parent must exist
with open(args.options,'rb') as source:
 request=source.read(65537)
if len(request)>65536: raise ValueError('options exceeds 65536 UTF-8 bytes')
request=request.decode('utf-8',errors='strict')
result=subprocess.run([args.node,str(exporter)],input=request,text=True,capture_output=True,timeout=30)

if result.returncode: raise RuntimeError('Plan validation failed: '+result.stderr)
envelope=json.loads(result.stdout);plan=envelope['plan'];sources=envelope['shaderSources']
W,H=plan['width'],plan['height']
if not (plan['schema']=='spot-ink-render-plan/1'): raise ValueError('Unsupported render plan contract')
if not (plan['texture']=={'unit':0,'format':'RGBA8','minFilter':'LINEAR','magFilter':'LINEAR','wrapS':'CLAMP_TO_EDGE','wrapT':'CLAMP_TO_EDGE','rowOrder':'top-to-bottom','flipY':False,'premultiplyAlpha':False,'colorSpaceConversion':'NONE','inputAlpha':'opaque-required-shader-ignores','outputAlpha':1}): raise ValueError('Unsupported render plan contract')
if not (plan['geometry']=={'mode':'TRIANGLES','attribute':'p','components':2,'vertices':[-1,-1,3,-1,-1,3],'first':0,'count':3}): raise ValueError('Unsupported render plan contract')
if not (plan['target']=={'viewport':[0,0,W,H],'blend':False,'depth':False,'cull':False,'scissor':False,'colorMask':[True]*4}): raise ValueError('Unsupported render plan contract')

from PIL import Image
plate_path=Path(args.plate)
if plate_path.stat().st_size>64*1024*1024: raise ValueError('PNG file exceeds 64 MiB')
with Image.open(plate_path) as source_image:
 if source_image.format!='PNG': raise ValueError('Only PNG density input supported')
 if source_image.size!=(W,H): raise ValueError('PNG dimensions must match validated plan before decoding')
 if source_image.mode not in ('RGB','RGBA'): raise ValueError('PNG must use RGB or RGBA channels')
 raw=source_image.convert('RGBA').tobytes()
if min(raw[3::4])!=255: raise ValueError('Opaque density input required')
os.environ['MESA_SHADER_CACHE_DIR']=str(output_dir/'shader-cache')
E=C.CDLL('libEGL.so.1')
def fn(name,restype,args):
 f=getattr(E,name); f.restype=restype; f.argtypes=args; return f
P=C.c_void_p; I=C.c_int; U=C.c_uint
getproc=fn('eglGetProcAddress',P,[C.c_char_p])
plat=C.CFUNCTYPE(P,U,P,C.POINTER(I))(getproc(b'eglGetPlatformDisplayEXT'))
d=plat(0x31DD,None,None)
a=I();b=I(); init=fn('eglInitialize',U,[P,C.POINTER(I),C.POINTER(I)])
print('display',d,'init',init(d,C.byref(a),C.byref(b)),a.value,b.value,flush=True)
print('error',hex(fn('eglGetError',I,[])()),flush=True)
attrs=(I*13)(0x3033,1,0x3040,0x40,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038)
cfg=P();n=I(); print('choose',fn('eglChooseConfig',U,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)])(d,attrs,C.byref(cfg),1,C.byref(n)),n.value,flush=True)
fn('eglBindAPI',U,[U])(0x30A0)
ctx=fn('eglCreateContext',P,[P,P,P,C.POINTER(I)])(d,cfg,None,(I*3)(0x3098,3,0x3038))
surf=fn('eglCreatePbufferSurface',P,[P,P,C.POINTER(I)])(d,cfg,(I*5)(0x3057,W,0x3056,H,0x3038))
current=fn('eglMakeCurrent',U,[P,P,P,P])(d,surf,surf,ctx)
if not (d and cfg and ctx and surf and current): raise RuntimeError('EGL initialization failed')
print('context',ctx,'surface',surf,'current',current,flush=True)
def gl(name,r,args):
 address=getproc(name.encode())
 if not address: raise RuntimeError('Missing GL function '+name)
 return C.CFUNCTYPE(r,*args)(address)
getstr=gl('glGetString',C.c_char_p,[U])
for enum in [0x1F00,0x1F01,0x1F02,0x8B8C]: print(hex(enum),getstr(enum),flush=True)
from PIL import Image
vs=sources['vertex'];fs=sources['fragment']
def shader(typ,src):
 sh=gl('glCreateShader',U,[U])(typ); txt=C.c_char_p(src.encode())
 gl('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),P])(sh,1,C.byref(txt),None)
 gl('glCompileShader',None,[U])(sh); status=I();gl('glGetShaderiv',None,[U,U,C.POINTER(I)])(sh,0x8B81,C.byref(status))
 if not status.value:
  log=C.create_string_buffer(65536);gl('glGetShaderInfoLog',None,[U,I,P,P])(sh,len(log),None,log);raise Exception(log.value)
 return sh
pr=gl('glCreateProgram',U,[])()
for sh in [shader(0x8B31,vs),shader(0x8B30,fs)]:gl('glAttachShader',None,[U,U])(pr,sh)
gl('glLinkProgram',None,[U])(pr)
status=I();gl('glGetProgramiv',None,[U,U,C.POINTER(I)])(pr,0x8B82,C.byref(status))
if not status.value: raise RuntimeError('Shader link failed')
gl('glUseProgram',None,[U])(pr)
buf=U();gl('glGenBuffers',None,[I,C.POINTER(U)])(1,C.byref(buf));gl('glBindBuffer',None,[U,U])(0x8892,buf.value)
verts=(C.c_float*6)(-1,-1,3,-1,-1,3)
gl('glBufferData',None,[U,C.c_ssize_t,P,U])(0x8892,C.sizeof(verts),verts,0x88E4)
loc=gl('glGetAttribLocation',I,[U,C.c_char_p])(pr,b'p')
gl('glEnableVertexAttribArray',None,[U])(loc);gl('glVertexAttribPointer',None,[U,I,U,U,I,P])(loc,2,0x1406,0,0,None)
tex=U();gl('glGenTextures',None,[I,C.POINTER(U)])(1,C.byref(tex));gl('glBindTexture',None,[U,U])(0x0DE1,tex.value)
for key,val in [(0x2801,0x2601),(0x2800,0x2601),(0x2802,0x812F),(0x2803,0x812F)]: gl('glTexParameteri',None,[U,U,I])(0x0DE1,key,val)
gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,P])(0x0DE1,0,0x1908,W,H,0,0x1908,0x1401,raw)
def uniform(name,n,values):
 location=gl('glGetUniformLocation',I,[U,C.c_char_p])(pr,name.encode())
 arr=(C.c_float*len(values))(*values); gl('glUniform%dfv'%n,None,[I,I,P])(location,len(values)//n,arr)
for name,descriptor in plan['uniforms'].items():
 typ=descriptor['type']; values=descriptor['value']
 if typ=='1i':gl('glUniform1i',None,[I,I])(gl('glGetUniformLocation',I,[U,C.c_char_p])(pr,name.encode()),values[0])
 else:uniform(name,int(typ[0]),values)
gl('glViewport',None,[I,I,I,I])(0,0,W,H);gl('glDrawArrays',None,[U,I,I])(4,0,3)
out=(C.c_ubyte*(W*H*4))();gl('glReadPixels',None,[I,I,I,I,U,U,P])(0,0,W,H,0x1908,0x1401,out)
error=gl('glGetError',U,[])()
if error!=0: raise RuntimeError('GL error '+str(error))
print('GL error',hex(error),'canonical source + validated plan compiled/drawn',flush=True)
Image.frombytes('RGBA',(W,H),bytes(out)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(output_dir/'output.png')
