import os
from pathlib import Path
from fontTools.ttLib import TTFont
p=Path(os.environ['BOOKCRAFT_VINYL_FONT_DIR'])/'Sans700.ttf'
required=set('收听明年回声唱片年报第页数字皆为店内账本')
cmap=set(map(chr,TTFont(p).getBestCmap()))
assert required<=cmap, required-cmap
print('Book small-label cmap complete')
