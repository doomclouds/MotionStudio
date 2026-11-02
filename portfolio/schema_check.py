"""Stdlib evaluator for the CLOSED subset used by work.schema.json.
Not a general JSON Schema engine: unknown schema keywords fail at load time.
No external resolution, network, package installation, or alternate work schema.
"""
import math,re
KEYS={'$schema','$id','type','properties','required','additionalProperties','items','minItems','minLength','minimum','pattern','const','enum','allOf','anyOf','if','then','else','not'}
TYPES={'object','array','string','integer','number','boolean','null'}
PATTERNS={r'^[0-9a-f]{64}$',r'^[0-9a-f]{40}$',r'^[a-z0-9]+(?:-[a-z0-9]+)*$',r'^[0-9]+\.[0-9]+\.[0-9]+$'}
def check_schema(s):
 if not isinstance(s,dict) or set(s)-KEYS:raise ValueError('UNSUPPORTED_SCHEMA_CONSTRUCT')
 for key in ['$schema','$id']:
  if key in s and not isinstance(s[key],str):raise ValueError('INVALID_SCHEMA_METADATA')
 if 'type' in s:
  kinds=s['type'] if isinstance(s['type'],list) else [s['type']]
  if not kinds or any(not isinstance(k,str) or k not in TYPES for k in kinds) or len(set(kinds))!=len(kinds):raise ValueError('UNSUPPORTED_SCHEMA_TYPE')
 if 'properties' in s and (not isinstance(s['properties'],dict) or any(not isinstance(k,str) for k in s['properties'])):raise ValueError('INVALID_SCHEMA_PROPERTIES')
 if 'required' in s and (not isinstance(s['required'],list) or any(not isinstance(x,str) for x in s['required']) or len(set(s['required']))!=len(s['required'])):raise ValueError('INVALID_SCHEMA_REQUIRED')
 for key in ['minLength','minItems']:
  if key in s and (type(s[key]) is not int or s[key]<0):raise ValueError('INVALID_SCHEMA_BOUND')
 if 'minimum' in s and (type(s['minimum']) not in [int,float] or (isinstance(s['minimum'],float) and not math.isfinite(s['minimum']))):raise ValueError('INVALID_SCHEMA_MINIMUM')
 if 'pattern' in s and (not isinstance(s['pattern'],str) or s['pattern'] not in PATTERNS):raise ValueError('UNSUPPORTED_SCHEMA_PATTERN')
 if 'enum' in s and (not isinstance(s['enum'],list) or not s['enum']):raise ValueError('INVALID_SCHEMA_ENUM')
 for subschema in s.get('properties',{}).values():check_schema(subschema)
 for key in ['items','if','then','else','not']:
  if key in s:check_schema(s[key])
 for key in ['allOf','anyOf']:
  if key in s and (not isinstance(s[key],list) or not s[key]):raise ValueError('INVALID_SCHEMA_COMBINATOR')
  for item in s.get(key,[]):check_schema(item)
 if 'additionalProperties' in s and not isinstance(s['additionalProperties'],bool):raise ValueError('UNSUPPORTED_ADDITIONAL_PROPERTIES')

def same(a,b):
 if isinstance(a,bool) or isinstance(b,bool):return type(a) is type(b) and a==b
 if isinstance(a,dict) and isinstance(b,dict):return set(a)==set(b) and all(same(a[k],b[k]) for k in a)
 if isinstance(a,list) and isinstance(b,list):return len(a)==len(b) and all(same(x,y) for x,y in zip(a,b))
 return a==b

def typed(value,kind):
 if kind=='object':return isinstance(value,dict)
 if kind=='array':return isinstance(value,list)
 if kind=='string':return isinstance(value,str)
 if kind=='boolean':return isinstance(value,bool)
 if kind=='null':return value is None
 numeric=type(value) is int or (type(value) is float and math.isfinite(value))
 if kind=='number':return numeric
 if kind=='integer':return numeric and int(value)==value
 return False

def matches(s,v):
 if 'type' in s and not any(typed(v,k) for k in (s['type'] if isinstance(s['type'],list) else [s['type']])):return False
 if 'const' in s and not same(v,s['const']):return False
 if 'enum' in s and not any(same(v,x) for x in s['enum']):return False
 if isinstance(v,dict):
  props=s.get('properties',{})
  if any(k not in v for k in s.get('required',[])):return False
  if s.get('additionalProperties') is False and set(v)-set(props):return False
  if any(k in v and not matches(sub,v[k]) for k,sub in props.items()):return False
 if isinstance(v,list):
  if len(v)<s.get('minItems',0):return False
  if 'items' in s and any(not matches(s['items'],x) for x in v):return False
 if isinstance(v,str):
  if len(v)<s.get('minLength',0):return False
  if 'pattern' in s and re.search(s['pattern'],v) is None:return False
 if isinstance(v,(int,float)) and not isinstance(v,bool) and 'minimum' in s and v<s['minimum']:return False
 if any(not matches(x,v) for x in s.get('allOf',[])):return False
 if 'anyOf' in s and not any(matches(x,v) for x in s['anyOf']):return False
 if 'not' in s and matches(s['not'],v):return False
 if 'if' in s:
  branch='then' if matches(s['if'],v) else 'else'
  if branch in s and not matches(s[branch],v):return False
 return True
