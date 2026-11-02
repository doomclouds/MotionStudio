# SPDX-License-Identifier: MIT
import pathlib,tempfile,os,subprocess,json
root=pathlib.Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='linked-volume-io-',dir=os.environ.get('TMPDIR')) as tmp:
 p=pathlib.Path(tmp); (p/'existing').mkdir();(p/'link').symlink_to(p/'existing',target_is_directory=True);(p/'dangling').symlink_to(p/'absent',target_is_directory=True)
 targets=['relative',str(p/'existing'),str(p/'link'),str(p/'dangling'),str(root/'never-created-output'),str(p/'missing'/'new'),str(p)+'/./normalized']
 for target in targets:
  r=subprocess.run(['node',str(root/'examples.mjs'),'--output',target],capture_output=True)
  assert r.returncode, target
 assert not (root/'never-created-output').exists()
 assert sorted(x.name for x in p.iterdir())==['dangling','existing','link']
 print(json.dumps({'status':'PASS','realRejectedOutputs':len(targets),'noNewFiles':True}))
