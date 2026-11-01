"""Full cmap/hmtx/serialized-outline oracle for both complete OFL instances."""
import os,json,io
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.recordingPen import RecordingPen
master=Path(os.environ['CUE_MASTER_DIR']);derived=Path(os.environ['CUE_RESOURCE_DIR']);glyphs=0
for alias,weight in [('CueRegular',400),('CueSemibold',600)]:
 a=instantiateVariableFont(TTFont(master/'Inter.ttf',recalcTimestamp=False),{'opsz':14,'wght':weight},inplace=True);tmp=io.BytesIO();a.save(tmp);a=TTFont(io.BytesIO(tmp.getvalue()));b=TTFont(derived/(alias+'.ttf'));assert a.getBestCmap()==b.getBestCmap()and a['hmtx'].metrics==b['hmtx'].metrics
 assert a.getGlyphOrder()==b.getGlyphOrder();ga=a.getGlyphSet();gb=b.getGlyphSet()
 for name in a.getGlyphOrder():
  x=RecordingPen();y=RecordingPen();ga[name].draw(x);gb[name].draw(y);assert x.value==y.value;glyphs+=1
 for nameid in [0,7,8,9,13,14]:assert sorted((r.toUnicode()for r in a['name'].names if r.nameID==nameid))==sorted((r.toUnicode()for r in b['name'].names if r.nameID==nameid))
 assert b['OS/2'].usWeightClass==400
print(json.dumps({'instances':2,'glyphs':glyphs,'cmapHmtxOutlinesAndNoticesExact':True,'metadata':'Regular 400, actual outlines 400/600'}))
