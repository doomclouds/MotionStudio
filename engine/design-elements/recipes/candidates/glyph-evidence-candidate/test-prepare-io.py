# SPDX-License-Identifier: Apache-2.0
import tempfile,pathlib,sys,unittest.mock as mock,runpy,json
ROOT=pathlib.Path(__file__).absolute().parent;sys.path.insert(0,str(ROOT));base=pathlib.Path(tempfile.mkdtemp(prefix='glyph-io-'));(base/'existing').mkdir();(base/'dangling').symlink_to(base/'never-created');(base/'link').symlink_to(base/'existing',target_is_directory=True);checks=[]
for name,value in [('relative','x'),('existing',str(base/'existing')),('dangling',str(base/'dangling')),('symlink-ancestor',str(base/'link/new')),('in-package',str(ROOT/'new')),('missing-parent',str(base/'missing/new')),('dot-component',str(base)+'/existing/../new')]:
 for entry in ['fetch-masters.py','prepare-outlines.py']:
  args=[entry,'--output',value]
  if entry=='prepare-outlines.py':args+=['--inputs',str(base/'not-read')]
  with mock.patch.object(sys,'argv',args),mock.patch('urllib.request.urlopen',side_effect=AssertionError('unexpected network'))as net,mock.patch('pathlib.Path.read_bytes',side_effect=AssertionError('unexpected read'))as read,mock.patch('pathlib.Path.mkdir',side_effect=AssertionError('unexpected output'))as mkdir:
   try:runpy.run_path(str(ROOT/entry),run_name='__main__');raise AssertionError('accepted')
   except ValueError:pass
   assert net.call_count==read.call_count==mkdir.call_count==0
  checks.append({'entry':entry,'case':name,'zeroReadNetworkWrite':True})
assert not(base/'never-created').exists();print(json.dumps({'status':'PASS','cases':checks},indent=2))
