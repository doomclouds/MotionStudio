"""Metadata validation, never artistic or listening tests."""
import copy
import json
import hashlib
import tempfile
from pathlib import Path
import unittest
import sfx_catalog as s

class CatalogTests(unittest.TestCase):
    def setUp(self):
        # Fictional per-asset metadata only; nothing refers to a real sound or user review.
        base={'title':'Synthetic sound fixture','creator':'Test fixture','credit':'Fictional attribution',
              'standalone_distribution':'No actual audio exists','rights_caveat':'Synthetic license labels test structure, not legal clearance',
              'access_note':'No network request or media','selection_inference':'Fixture, not a recommendation',
              'access':'login-required','source_url':'https://example.org/synthetic-sound',
              'license':'CC0-1.0','license_url':s.LICENSES['CC0-1.0'],'attribution_required':False,
              'commercial_video_sync':'allowed_under_declared_license','source_check':'primary_asset_page',
              'checked_on':'2000-01-01','roles':['impact'],'audition_status':'not_auditioned',
              'duration_seconds':None,'probe_status':'not_probed','sha256':None,'duration_evidence':'not_probed'}
        rows=[]
        for n in range(4):
            c=copy.deepcopy(base);c['id']='synthetic-'+str(n);rows.append(c)
        rows[0]['roles']=['signature_chime']
        rows[-1].update(id='synthetic-probed',access='public-download',probe_status='probed_not_heard',
                       sha256=hashlib.sha256(b'synthetic fixture, not audio').hexdigest(),duration_seconds=1,
                       duration_evidence='local_ffprobe',download_url='https://example.org/synthetic.wav')
        self.temp=tempfile.TemporaryDirectory()
        path=Path(self.temp.name)/'synthetic-catalog.json';path.write_text(json.dumps({'schema_version':1,'candidates':rows}))
        self.data=json.loads(path.read_text())
    def tearDown(self): self.temp.cleanup()
    def test_public_default_is_empty(self):
        data=json.loads(s.DEFAULT.read_text());self.assertEqual(s.validate(data),[])
        self.assertEqual(data['candidates'],[]);self.assertEqual(s.query(data),[])
    def mutate(self, **fields):
        self.data['candidates'][0].update(fields)
        self.assertTrue(s.validate(self.data))
    def test_catalog(self): self.assertEqual(s.validate(self.data), [])
    def test_query(self):
        self.assertEqual(len(s.query(self.data, 'signature_chime')), 1)
        self.assertEqual(s.query(self.data, 'missing'), [])
        self.assertEqual(s.query(self.data, limit=-1), [])
    def test_combined_filters_public_only(self):
        rows = s.query(self.data, license_id='CC0-1.0', access='public-download', evidence='probed')
        self.assertEqual([c['id'] for c in rows], ['synthetic-probed'])
        self.assertEqual(rows[0]['audition_status'], 'not_auditioned')
    def test_login_metadata_filter(self):
        self.assertEqual(len(s.query(self.data, access='login-required', evidence='metadata-only', limit=10)), 3)
    def test_no_match_never_mutates(self):
        before = copy.deepcopy(self.data)
        self.assertEqual(s.query(self.data, role='missing', access='public-download'), [])
        self.assertEqual(s.query(self.data, access='login-required', evidence='probed'), [])
        self.assertEqual(s.query(self.data, license_id='CC-BY-4.0'), [])
        self.assertEqual(self.data, before)
    def test_bad_access_enum(self): self.mutate(access='free-somewhere')
    def test_bad_filter_enums(self):
        for kw in ({'access': 'free'}, {'evidence': 'heard'}, {'license_id': 'unknown'}):
            with self.assertRaises(ValueError): s.query(self.data, **kw)
    def test_date_format_not_freshness(self):
        self.data['candidates'][0]['checked_on'] = '2000-01-01'
        self.assertEqual(s.validate(self.data), [])
        self.mutate(checked_on='not-a-date')
    def test_no_audition_from_metadata(self): self.mutate(audition_status='heard')
    def test_no_hash_without_probe(self): self.mutate(sha256='a'*64)
    def test_no_nc_license(self): self.mutate(license='CC-BY-NC-4.0')
    def test_attribution(self): self.mutate(attribution_required=True)
    def test_no_homepage(self): self.mutate(source_url='https://example.org/')
    def test_no_aggregator_check(self): self.mutate(source_check='search_snippet')
    def test_no_missing_rights(self): self.mutate(commercial_video_sync='unknown')
    def test_duplicate(self):
        self.data['candidates'].append(copy.deepcopy(self.data['candidates'][0]))
        self.assertTrue(s.validate(self.data))
    def test_measured_requires_hash(self):
        self.data['candidates'][-1]['sha256'] = None
        self.assertTrue(s.validate(self.data))
    def test_by_requires_credit_and_correct_url(self):
        self.data['candidates'][0].update(license='CC-BY-4.0', license_url=s.LICENSES['CC-BY-4.0'], attribution_required=True)
        self.assertEqual(s.validate(self.data), [])
        self.mutate(credit='')

if __name__ == '__main__': unittest.main()
