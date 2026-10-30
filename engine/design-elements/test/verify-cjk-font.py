"""Check caller font covers every Han character in the actual B05 examples."""
import os,pathlib,hashlib,json
from fontTools.ttLib import TTFont
root=pathlib.Path(__file__).resolve().parent.parent
font=pathlib.Path(os.environ['UI_B05_FONT_FILE'])
strings=''.join((root/'examples'/name).read_text() for name in ['vertical-imprint.mjs','b05-compositions.mjs'])
chars=sorted({s for s in strings if '\u3400'<=s<='\u9fff' or s=='〇'})
cmap=TTFont(font).getBestCmap();missing=[s for s in chars if ord(s) not in cmap]
result={'fontName':font.name,'sha256':hashlib.sha256(font.read_bytes()).hexdigest(),'characters':len(chars),'missing':missing,'status':'FAIL' if missing else 'PASS'}
print(json.dumps(result,ensure_ascii=False,indent=2))
assert not missing,missing
