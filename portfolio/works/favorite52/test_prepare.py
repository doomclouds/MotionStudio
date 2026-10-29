"""Synthetic offline acquisition/security fixtures; no actual resource license assertions."""
from pathlib import Path
import hashlib,json,tempfile,unittest,zipfile
from unittest.mock import patch
import prepare as p
class PreparationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
  self.source=self.root/'source';self.source.mkdir();(self.source/'LICENSES').mkdir();(self.source/'LICENSES/n.txt').write_text('notice')
  self.cache=self.root/'cache';self.seed=self.root/'seed';self.seed.mkdir();(self.seed/'fonts').mkdir();self.data=b'fixture font bytes';(self.seed/'fonts/one.ttf').write_bytes(self.data)
  self.row={'path':'fonts/one.ttf','bytes':len(self.data),'sha256':hashlib.sha256(self.data).hexdigest(),'source_url':'https://example.invalid/font'}
  self.lock={'assets':[self.row],'recovery_archive':{'sha256':'0'*64,'prefix':'authorized/assets/'}}
  for key,value in [('HERE',self.source),('REPO',self.source),('LOCK',self.lock)]:
   mock=patch.object(p,key,value);mock.start();self.addCleanup(mock.stop)
 def test_seed_exact_and_repeated_restore(self):
  self.assertEqual(p.prepare(self.cache,self.seed)['resource_count'],1);p.prepare(self.cache,self.seed);p.check(self.cache)
  self.assertEqual((self.cache/'fonts/one.ttf').read_bytes(),self.data)
  self.assertEqual((self.cache/'LICENSES/n.txt').read_text(),'notice')
 def test_missing_reports_path_hash_and_source(self):
  with self.assertRaises(p.Bad) as e:p.prepare(self.cache)
  for text in ['fonts/one.ttf',self.row['sha256'],self.row['source_url']]:self.assertIn(text,str(e.exception))
  self.assertFalse(self.cache.exists())
 def test_bad_seed_refused_without_writes(self):
  (self.seed/'fonts/one.ttf').write_bytes(b'bad')
  with self.assertRaises(p.Bad):p.prepare(self.cache,self.seed)
  self.assertFalse(self.cache.exists())
 def test_bad_cached_bytes_not_overwritten(self):
  p.prepare(self.cache,self.seed);target=self.cache/'fonts/one.ttf';target.write_bytes(b'bad')
  with self.assertRaises(p.Bad):p.prepare(self.cache,self.seed)
  self.assertEqual(target.read_bytes(),b'bad')
 def test_source_repository_target_rejected(self):
  with self.assertRaises(p.Bad):p.prepare(self.source/'cache',self.seed)
 def test_source_ancestor_target_rejected(self):
  with self.assertRaises(p.Bad):p.prepare(self.root,self.seed)
 def test_cache_root_symlink_refused(self):
  self.cache.symlink_to(self.source,target_is_directory=True)
  with self.assertRaises(p.Bad):p.prepare(self.cache,self.seed)
 def test_cache_parent_symlink_refused(self):
  link=self.root/'link';link.symlink_to(self.root,target_is_directory=True)
  with self.assertRaises(p.Bad):p.prepare(link/'cache',self.seed)
 def test_intermediate_fonts_symlink_cannot_write_source(self):
  self.cache.mkdir();(self.cache/'fonts').symlink_to(self.source,target_is_directory=True)
  with self.assertRaises(p.Bad):p.prepare(self.cache,self.seed)
  self.assertFalse((self.source/'one.ttf').exists())
 def test_seed_ancestor_symlink_refused(self):
  link=self.root/'link';link.symlink_to(self.seed,target_is_directory=True)
  with self.assertRaises(p.Bad):p.prepare(self.cache,link)
 def test_seed_file_symlink_refused(self):
  target=self.seed/'fonts/one.ttf';target.unlink();target.symlink_to(self.source/'LICENSES/n.txt')
  with self.assertRaises(p.Bad):p.prepare(self.cache,self.seed)
 def test_external_containment_guard(self):
  with self.assertRaises(p.Bad):p.inside(self.source/'x',self.cache)
 def test_notices_symlink_refused(self):
  self.cache.mkdir();(self.cache/'LICENSES').symlink_to(self.source/'LICENSES',target_is_directory=True)
  with self.assertRaises(p.Bad):p.prepare(self.cache,self.seed)
 def archive(self,duplicate=False):
  z=self.root/'recovery.zip'
  with zipfile.ZipFile(z,'w') as f:
   f.writestr('authorized/assets/fonts/one.ttf',self.data)
   f.writestr('unrelated/private.txt',b'Do not extract me')
   if duplicate:f.writestr('authorized/assets/fonts/one.ttf',self.data)
  self.lock['recovery_archive']['sha256']=p.sha_file(z);return z
 def test_exact_archive_selected_members_only(self):
  z=self.archive();p.prepare(self.cache,recovery=z);self.assertFalse((self.cache/'unrelated').exists());p.check(self.cache)
 def test_wrong_archive_hash_rejected(self):
  z=self.archive();self.lock['recovery_archive']['sha256']='0'*64
  with self.assertRaises(p.Bad):p.prepare(self.cache,recovery=z)
  self.assertFalse(self.cache.exists())
 def test_duplicate_archive_member_rejected(self):
  z=self.archive(True)
  with self.assertRaises(p.Bad):p.prepare(self.cache,recovery=z)
 def test_two_seed_routes_rejected(self):
  with self.assertRaises(p.Bad):p.prepare(self.cache,self.seed,self.archive())
 def test_output_path_rejects_concat_control_characters(self):
  import render
  for name in ["owner's-work", "a\\b", "a\nb", "a\rb"]:
   with self.subTest(name=name),self.assertRaises(p.Bad):render.output_path(self.root/name,self.cache)
 def test_output_path_disjoint_from_assets(self):
  import render
  with self.assertRaises(p.Bad):render.output_path(self.cache/'out',self.cache)
 def test_output_path_must_be_new(self):
  import render
  with self.assertRaises(p.Bad):render.output_path(self.seed,self.cache)
 def test_output_path_good(self):
  import render
  self.assertEqual(render.output_path(self.root/'new-work',self.cache),self.root/'new-work')
if __name__=='__main__':unittest.main()
