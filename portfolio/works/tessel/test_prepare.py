"""Offline failure-path tests; mocks do not stand in for the real download audit."""
import contextlib, copy, hashlib, io, json, tempfile, unittest, urllib.error, urllib.request
from pathlib import Path
from unittest.mock import patch
import prepare as p


class PreparationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='tessel-prepare-test-')
        self.root = Path(self.tmp.name)
        self.cache = self.root / 'cache'
        self.seed = self.root / 'seed'
        self.seed.mkdir()
        self.body = b'licensed test resource'
        self.row = {'id':'glow-ink', 'role':'background', 'bytes':len(self.body),
                    'sha256':p.sha(self.body), 'permission':'explicit-license',
                    'notice':'LICENSES/Leonxlnx-Tessel-MIT.txt',
                    'url':'https://raw.githubusercontent.com/example/fixed/test'}
        self.lock = {'assets':[self.row], 'fonts':[], 'derived_fonts':[]}
        self.lockpatch = patch.object(p, 'LOCK', self.lock)
        self.lockpatch.start()
        self.spawnpatch = patch.object(p.subprocess, 'run')
        self.spawnpatch.start()

    def tearDown(self):
        self.spawnpatch.stop(); self.lockpatch.stop(); self.tmp.cleanup()

    def run_prepare(self, download=False):
        with contextlib.redirect_stdout(io.StringIO()):
            p.prepare(self.cache, self.seed, download)

    def test_offline_missing_fails_without_network(self):
        with patch.object(p.urllib.request, 'build_opener') as net:
            with self.assertRaisesRegex(p.Bad, 'Offline resource missing'):self.run_prepare()
            net.assert_not_called()

    def test_exact_seed_and_cached_bytes_pass(self):
        (self.seed/'glow-ink').write_bytes(self.body)
        self.run_prepare()
        self.assertEqual((self.cache/'reference/source/public/fx/glow-ink.png').read_bytes(), self.body)
        (self.seed/'glow-ink').unlink()
        self.run_prepare()

    def test_bad_seed_fails_without_fallback(self):
        (self.seed/'glow-ink').write_bytes(b'changed')
        with patch.object(p.urllib.request, 'build_opener') as net:
            with self.assertRaisesRegex(p.Bad, 'hash/size mismatch'):self.run_prepare(True)
            net.assert_not_called()

    def test_bad_cache_fails_without_fallback(self):
        (self.cache/'downloads').mkdir(parents=True)
        (self.cache/'downloads/glow-ink').write_bytes(b'changed')
        with self.assertRaisesRegex(p.Bad, 'hash/size mismatch'):self.run_prepare(True)

    def test_symlink_resource_refused(self):
        (self.root/'actual').write_bytes(self.body)
        (self.seed/'glow-ink').symlink_to(self.root/'actual')
        with self.assertRaisesRegex(p.Bad, 'Symlink path component'):self.run_prepare()

    def test_intermediate_cache_links_refused_before_acquisition(self):
        (self.seed/'glow-ink').write_bytes(self.body)
        outside=self.root/'outside';outside.mkdir()
        for directory in ['downloads','reference','fonts','LICENSES']:
            with self.subTest(directory=directory):
                self.cache=self.root/('cache-'+directory);self.cache.mkdir()
                (self.cache/directory).symlink_to(outside,target_is_directory=True)
                with patch.object(p.urllib.request,'build_opener') as net, patch.object(p.subprocess,'run') as child:
                    with self.assertRaisesRegex(p.Bad,'Symlink path component'):self.run_prepare(True)
                    net.assert_not_called();child.assert_not_called()
                self.assertEqual(list(outside.iterdir()),[])

    def test_downloads_link_into_source_regression(self):
        source=self.root/'source';source.mkdir();self.cache.mkdir()
        (self.cache/'downloads').symlink_to(source,target_is_directory=True)
        (self.seed/'glow-ink').write_bytes(self.body)
        with patch.object(p,'SOURCE_ROOT',source):
            with self.assertRaisesRegex(p.Bad,'Symlink path component'):self.run_prepare()
        self.assertFalse((source/'glow-ink').exists())

    def test_nested_reference_link_refused(self):
        outside=self.root/'outside';outside.mkdir()
        (self.cache/'reference').mkdir(parents=True)
        (self.cache/'reference/source').symlink_to(outside,target_is_directory=True)
        (self.seed/'glow-ink').write_bytes(self.body)
        with self.assertRaisesRegex(p.Bad,'Symlink path component'):self.run_prepare()
        self.assertEqual(list(outside.iterdir()),[])

    def test_cache_root_link_refused_without_resolve_erasing_it(self):
        outside=self.root/'outside';outside.mkdir();self.cache.symlink_to(outside,target_is_directory=True)
        with self.assertRaisesRegex(p.Bad,'Symlink path component'):self.run_prepare()
        self.assertEqual(list(outside.iterdir()),[])

    def test_cache_parent_link_refused(self):
        outside=self.root/'outside';outside.mkdir();link=self.root/'link';link.symlink_to(outside,target_is_directory=True)
        self.cache=link/'new-cache'
        with self.assertRaisesRegex(p.Bad,'Symlink path component'):self.run_prepare()
        self.assertEqual(list(outside.iterdir()),[])

    def test_seed_parent_link_refused(self):
        link=self.root/'linked-seed';link.symlink_to(self.seed,target_is_directory=True);self.seed=link
        with self.assertRaisesRegex(p.Bad,'Symlink path component'):self.run_prepare()

    def test_derived_font_leaf_link_refused(self):
        outside=self.root/'outside-font';outside.write_bytes(self.body)
        (self.seed/'glow-ink').write_bytes(self.body);(self.cache/'fonts').mkdir(parents=True)
        (self.cache/'fonts/test.ttf').symlink_to(outside)
        self.lock['derived_fonts']=[{'file':'test.ttf','sha256':p.sha(self.body)}]
        with self.assertRaisesRegex(p.Bad,'Symlink path component'):self.run_prepare()

    def test_nested_font_package_directory_link_refused(self):
        outside=self.root/'outside';outside.mkdir();(self.cache/'reference').mkdir(parents=True)
        (self.cache/'reference/font-packages').symlink_to(outside,target_is_directory=True)
        with self.assertRaisesRegex(p.Bad,'Symlink path component'):
            p.inside(self.cache/'reference/font-packages/geist-5.3.0/package/font.woff2',self.cache)
        self.assertEqual(list(outside.iterdir()),[])

    def test_explicit_write_containment_refused(self):
        with self.assertRaisesRegex(p.Bad,'escapes authorized root'):
            p.put(self.root/'escape',self.body,p.sha(self.body),self.cache)
        self.assertFalse((self.root/'escape').exists())

    def test_render_preflight_rejects_background_parent_link(self):
        import render
        (self.cache/'downloads').mkdir(parents=True)
        (self.cache/'downloads/glow-ink').write_bytes(self.body)
        outside=self.root/'outside';outside.mkdir()
        (self.cache/'reference').symlink_to(outside,target_is_directory=True)
        with patch.object(render,'LOCK',self.lock):
            with self.assertRaisesRegex(p.Bad,'Symlink path component'):render.check_assets(self.cache)

    def test_shared_source_and_install_lock_drift_refused(self):
        import render
        repo=self.root/'repo';work=repo/'portfolio/works/test';(work/'locks').mkdir(parents=True)
        paths=[repo/'engine.mjs',repo/'npm.json',work/'locks/npm.json',work/'pip.lock']
        for path in paths:path.write_bytes(self.body)
        h=p.sha(self.body)
        lock={'shared_source_files':[{'path':'engine.mjs','sha256':h}],
              'npm_install_lock':{'repository_path':'npm.json','work_copy':'locks/npm.json','sha256':h},
              'python_install_lock':{'work_path':'pip.lock','sha256':h}}
        (work/'locks/runtime.json').write_text(json.dumps(lock))
        with patch.object(render,'HERE',work),patch.object(render,'ROOT',repo):
            render.check_sources()
            for path in paths:
                with self.subTest(path=path.name):
                    path.write_bytes(b'drift')
                    with self.assertRaisesRegex(p.Bad,'drift'):render.check_sources()
                    path.write_bytes(self.body)

    def test_uncleared_license_refused(self):
        self.row['permission']='unknown'
        with self.assertRaisesRegex(p.Bad, 'license not cleared'):self.run_prepare(True)

    def test_missing_notice_refused(self):
        self.row['notice']='LICENSES/missing-test.txt'
        with self.assertRaisesRegex(p.Bad, 'license notice missing'):self.run_prepare(True)

    def test_unapproved_host_refused(self):
        self.row['url']='https://example.com/test'
        with self.assertRaisesRegex(p.Bad, 'Unapproved resource URL'):self.run_prepare(True)

    def test_non_https_refused(self):
        self.row['url']='http://raw.githubusercontent.com/test'
        with self.assertRaisesRegex(p.Bad, 'Unapproved resource URL'):self.run_prepare(True)

    def test_network_404_has_no_fallback(self):
        with patch.object(p.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect=urllib.error.HTTPError(self.row['url'],404,'Not Found',{},None)
            with self.assertRaisesRegex(p.Bad, 'No fallback'):self.run_prepare(True)
            self.assertEqual(opener.return_value.open.call_count,1)

    def test_wrong_download_never_promoted(self):
        with patch.object(p.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value=io.BytesIO(b'wrong')
            with self.assertRaisesRegex(p.Bad, 'Downloaded identity mismatch'):self.run_prepare(True)
        self.assertFalse((self.cache/'downloads/glow-ink').exists())

    def test_oversized_download_never_promoted(self):
        with patch.object(p.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value=io.BytesIO(self.body+b'X'*100)
            with self.assertRaisesRegex(p.Bad, 'Downloaded identity mismatch'):self.run_prepare(True)
        self.assertFalse((self.cache/'downloads/glow-ink').exists())

    def test_correct_download_hash(self):
        with patch.object(p.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value=io.BytesIO(self.body)
            self.run_prepare(True)
        self.assertEqual((self.cache/'downloads/glow-ink').read_bytes(),self.body)

    def test_cross_host_redirect_refused(self):
        req=urllib.request.Request(self.row['url'])
        with self.assertRaisesRegex(p.Bad, 'Cross-host'):p.FixedRedirect().redirect_request(req,None,302,'',{},'https://example.com/test')

    def test_redirect_downgrade_refused(self):
        req=urllib.request.Request(self.row['url'])
        with self.assertRaisesRegex(p.Bad, 'Non-HTTPS'):p.FixedRedirect().redirect_request(req,None,302,'',{},self.row['url'].replace('https:','http:'))

    def test_in_source_cache_refused(self):
        self.cache=p.SOURCE_ROOT/'must-not-create-test-cache'
        with self.assertRaisesRegex(p.Bad, 'outside the source tree'):self.run_prepare()
        self.assertFalse(self.cache.exists())

    def test_changed_output_not_overwritten(self):
        target=self.root/'existing';target.write_bytes(b'changed')
        with self.assertRaisesRegex(p.Bad, 'Refusing replacement'):p.put(target,self.body,self.row['sha256'])
        self.assertEqual(target.read_bytes(),b'changed')

    def test_nonregular_font_member_refused(self):
        import tarfile
        archive=io.BytesIO()
        with tarfile.open(fileobj=archive,mode='w:gz') as tar:
            item=tarfile.TarInfo('package/font.woff2');item.type=tarfile.SYMTYPE;item.linkname='../../outside';tar.addfile(item)
        blob=archive.getvalue();self.row.update(id='geist',role='font-package',bytes=len(blob),sha256=p.sha(blob))
        self.lock['fonts']=[{'id':'geist','member':'package/font.woff2','sha256':'0'*64,'license_member':'package/LICENSE','license_sha256':'0'*64}]
        (self.seed/'geist').write_bytes(blob)
        with self.assertRaisesRegex(p.Bad, 'Unexpected font package member'):self.run_prepare()


if __name__ == '__main__':unittest.main()
