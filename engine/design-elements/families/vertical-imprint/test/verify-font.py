"""Check current synthetic Han fixtures and report the actual caller font identity.

Does not install fonts, validate licensing, or claim historical-font equivalence.
"""
import hashlib,json,os,pathlib,sys
from fontTools.ttLib import TTFont
from fontTools.unicodedata import script
root=pathlib.Path(__file__).resolve().parents[1]
value=sys.argv[1] if len(sys.argv)>1 else os.environ.get('VERTICAL_IMPRINT_FONT_FILE') or os.environ.get('UI_B05_FONT_FILE')
if not value or not pathlib.Path(value).is_absolute():raise SystemExit('Provide an absolute VERTICAL_IMPRINT_FONT_FILE (or UI_B05_FONT_FILE) for a licensed standalone CJK font face')
font=pathlib.Path(value);strings=(root/'examples/cases.mjs').read_text()
chars=sorted({s for s in strings if script(s)=='Hani' or s=='〇'})
with TTFont(font) as f:
 cmap=f.getBestCmap() or {};missing=[s for s in chars if ord(s) not in cmap]
 def names(code):return sorted({n.toUnicode() for n in f['name'].names if n.nameID==code})
 result={'fontName':font.name,'familyNames':names(16) or names(1),'postscriptNames':names(6),'versionNames':names(5),'licenseDescriptions':names(13),'sha256':hashlib.sha256(font.read_bytes()).hexdigest(),'cmapEntries':len(cmap),'characters':len(chars),'missing':missing,'status':'FAIL' if missing else 'PASS','scope':'Current synthetic fixture coverage only; not licensing approval, complete repertoire proof, or historical font-lock reproduction'}
print(json.dumps(result,ensure_ascii=False,indent=2))
if missing:raise SystemExit('Missing required Han glyphs; no substitute boxes accepted')
