"""Synthetic renderer tests; not viewing/listening or media-quality evidence."""
import copy
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest.mock import patch
import xml.etree.ElementTree as ET

import event_intervals as core
import event_interval_report as report
from test_event_intervals import make_fixture, digest


def make_receipt(root):
    args,data=make_fixture(root)
    return args,data,core.evaluate_files(**args)


def make_gallery(root):
    """Generate genuine synthetic evaluator receipts; no mock film observations."""
    args,original=make_fixture(root)
    data=copy.deepcopy(original); data['events']=[]; data['observations']=[]; data['evidence']=[]
    for name,label,layer in [('late','01 · Positive lag and whole-event shift','manual'),
                             ('lead','02 · Negative lag / anticipatory sound','manual'),
                             ('ambiguous','03 · Multiple candidates and missing observation','manual'),
                             ('plan','04 · Planned times are not observations','planned'),
                             ('unknown','05 · Unknown is not zero','unknown')]:
        event=copy.deepcopy(original['events'][0]); event.update(id=name,label=label,layer=layer)
        event['review_note']='Synthetic demonstration only. No person has watched or heard an actual film in this fixture.'
        event['mapping_note']='Explicit synthetic correspondence; not detected from media.'
        observations=copy.deepcopy(original['observations']); evidence=copy.deepcopy(original['evidence'])
        for ob in observations:
            ob['id']=name+'_'+ob['id']; ob['layer']=layer
            ob['evidence_id']=name+'_'+ob['evidence_id']
            ob['locator']='Synthetic record only; no media link.'
            if layer=='planned': ob['interval_kind']='planned_window'
            if layer=='unknown': ob.update(state='unknown',interval_kind='none',interval_s=None,evidence_id=None)
        for ev in evidence:
            ev['id']=name+'_'+ev['id']; ev['relative_path']=ev['id']+'.json'
            ev['kind']='plan_record' if layer=='planned' else 'manual_record'
            path=Path(root)/ev['relative_path']; path.write_text('{"synthetic":true}')
            ev['sha256']=digest(path)
        if name=='late': observations[3]['interval_s']=['1.420','1.460']
        if name=='lead': observations[3]['interval_s']=['0.950','0.990']
        event['slots']={slot:[name+'_'+oid for oid in ids] for slot,ids in event['slots'].items()}
        if name=='ambiguous':
            observations[1].update(state='unknown',interval_s=None,interval_kind='none')
            second=copy.deepcopy(observations[3]); second['id']='ambiguous_ca2'; second['interval_s']=['1.340','1.380']
            observations.append(second); event['slots']['candidate_audio'].append(second['id'])
        data['events'].append(event); data['observations'].extend(observations)
        if layer!='unknown': data['evidence'].extend(evidence)
    args['annotations'].write_text(json.dumps(data))
    return core.evaluate_files(**args)


class Tags(HTMLParser):
    def __init__(self): super().__init__(); self.tags=[]; self.attrs=[]
    def handle_starttag(self,tag,attrs): self.tags.append(tag); self.attrs.extend(attrs)


class ReportTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.root=Path(self.temp.name)
        self.args,self.data,self.receipt=make_receipt(self.root)
        self.path=self.root/'receipt.json'; self.save()
    def tearDown(self):self.temp.cleanup()
    def save(self):self.path.write_text(json.dumps(self.receipt))
    def html(self):return report.render_html(self.receipt,'a'*64)
    def invalid(self):
        with self.assertRaises(core.ContractError):self.html()
    def cli(self,out):
        with redirect_stdout(io.StringIO()),redirect_stderr(io.StringIO()):
            return report.main(['render','--receipt',str(self.path),'--out',str(out)])
    def test_base_four_lanes_and_values(self):
        html=self.html()
        for name in report.LABELS.values():self.assertIn(name,html)
        self.assertIn('[0.16, 0.24] s',html)
        self.assertIn('not statistical confidence',html)
        self.assertIn('operator-declared provenance',html)
        self.assertIn('Hash identifies these receipt bytes only',html)
        self.assertEqual(html,self.html())
        svg=ET.fromstring(report.event_svg(self.receipt['events'][0]))
        bars=svg.findall('.//{http://www.w3.org/2000/svg}rect[@class="interval-bar"]')
        self.assertEqual(len(bars),4)
        self.assertGreater(float(bars[2].attrib['x']),float(bars[0].attrib['x']))
    def test_gallery_positive_negative_ambiguous_planned_unknown(self):
        gallery=make_gallery(self.root/'gallery'); html=report.render_html(gallery,'b'*64)
        self.assertIn('[-0.29, -0.21] s',html)
        self.assertIn('[0.18, 0.26] s',html)
        self.assertIn('AMBIGUOUS',html); self.assertIn('PLANNED_ONLY',html)
        self.assertIn('MULTIPLE RECORDS',html)
        plan=report.event_svg(gallery['events'][3]); self.assertIn('stroke-dasharray="5 3"',plan)
        unknown=report.event_svg(gallery['events'][4]); self.assertNotIn('interval-bar',unknown)
        self.assertNotIn('interval-point',unknown); self.assertIn('NO TIMED EVIDENCE',unknown)
        ambiguous=ET.fromstring(report.event_svg(gallery['events'][2]))
        self.assertEqual(len(ambiguous.findall('.//{http://www.w3.org/2000/svg}rect[@class="interval-bar"]')),4)
    def test_failure_receipts_no_chart(self):
        for state in report.FAILURE_STATES:
            self.receipt={'schema_version':core.SCHEMA,'collection_status':state,'field':'evidence:synthetic','reason':'HASH_MISMATCH','events':[]}
            html=self.html(); self.assertNotIn('<svg',html); self.assertIn('Source receipt: '+state,html)
            self.assertIn(report.REPORT_STATUS,html)
    def test_failed_receipt_cannot_smuggle_events(self):
        self.receipt={'schema_version':core.SCHEMA,'collection_status':'STALE','field':'x','reason':'x','events':self.receipt['events']}; self.invalid()
    def test_xss_escaped_no_executable_tags_or_links(self):
        evil='</h2><script>alert(1)</script><img src="https://invalid.example/x" onerror="x()">'
        event=self.receipt['events'][0]; event['label']=evil[:120]; event['mapping_note']=evil; event['review_note']=evil
        for rows in event['review_windows'].values():
            for row in rows:row['locator']=evil
        self.receipt['limitations']=[evil]
        html=self.html(); parser=Tags(); parser.feed(html)
        self.assertNotIn('script',parser.tags); self.assertNotIn('img',parser.tags); self.assertNotIn('a',parser.tags)
        self.assertNotIn('foreignobject',parser.tags)
        self.assertFalse(any(k.startswith('on') or k in ('href','src','xlink:href') for k,v in parser.attrs))
        self.assertIn('&lt;script&gt;',html)
        ET.fromstring(report.event_svg(event))
    def test_xml_control_characters_rejected(self):
        self.receipt['events'][0]['review_note']='invalid\x00text'; self.invalid()
    def test_status_never_upgraded(self):
        self.receipt['collection_status']='PASSED'; self.invalid()
    def test_real_flag_does_not_authenticate_manual(self):
        self.receipt.update(dataset_kind='real',synthetic_notice=None)
        html=self.html(); self.assertIn('does not authenticate',html); self.assertIn('operator-declared provenance',html)
    def test_tampered_measurement_rejected(self):
        self.receipt['events'][0]['measurements']['visual_shift']['interval_s']=['0','0']; self.invalid()
    def test_tampered_action_rejected(self):
        self.receipt['events'][0]['review_actions']=['NO_RESOLVED_DIRECTION_AT_GIVEN_BOUNDS']; self.invalid()
    def test_unknown_with_timestamp_rejected(self):
        self.receipt['events'][0]['review_windows']['candidate_audio'][0]['state']='unknown'; self.invalid()
    def test_planned_cannot_keep_manual_measurements(self):
        self.receipt['events'][0]['layer']='planned'; self.invalid()
    def test_extra_root_field(self):
        self.receipt['artistic_score']=100; self.invalid()
    def test_unsupported_schema(self):
        self.receipt['schema_version']='unknown'; self.invalid()
    def test_timing_domain_and_origin_strict(self):
        self.receipt['timing']['reference']['audio_domain_s']=['0','Infinity']; self.invalid()
    def test_negative_audio_origin_preserved(self):
        html=self.html(); self.assertIn('[-0.1, 3] s',html)
        self.assertIn('10 s</code>',html); self.assertIn('20 s</code>',html)
    def test_duplicate_event(self):
        self.receipt['events'].append(copy.deepcopy(self.receipt['events'][0])); self.invalid()
    def test_binding_mismatch(self):
        self.receipt['inputs']['reference']['media_sha256']='f'*64; self.invalid()
    def test_duplicate_binding(self):
        self.receipt['bindings'].append(copy.deepcopy(self.receipt['bindings'][0])); self.invalid()
    def test_oversize_declared_binding(self):
        self.receipt['bindings'][0]['bytes']=core.LIMITS['annotation']+1; self.invalid()
    def test_snapshot_hash_and_no_media_access(self):
        for key,path in self.args.items():
            if key!='evidence_root' and path.exists():path.unlink()
        for path in self.root.glob('*observation.json'):path.unlink()
        out=self.root/'snapshot.html'; result=report.render_file(self.path,out)
        self.assertEqual(result['receipt_sha256'],digest(self.path)); self.assertIn(digest(self.path),out.read_text())
    def test_cli_fresh_no_overwrite(self):
        out=self.root/'out.html'; self.assertEqual(self.cli(out),0); original=out.read_bytes()
        self.assertEqual(self.cli(out),2); self.assertEqual(original,out.read_bytes())
        self.assertEqual(self.cli(self.path),2)
    def test_symlink_receipt_blocked(self):
        target=self.root/'target.json'; self.path.rename(target); self.path.symlink_to(target)
        out=self.root/'out.html'; self.assertEqual(self.cli(out),1); self.assertFalse(out.exists())
    def test_symlink_output_parent_blocked(self):
        parent=self.root/'dir'; parent.mkdir(); link=self.root/'link'; link.symlink_to(parent,target_is_directory=True)
        self.assertEqual(self.cli(link/'out.html'),2); self.assertFalse((parent/'out.html').exists())
    def test_missing_receipt(self):
        self.path.unlink(); out=self.root/'out.html'; self.assertEqual(self.cli(out),1); self.assertFalse(out.exists())
    def test_atomic_failure_no_partial_html(self):
        out=self.root/'out.html'
        with patch.object(core.os,'fsync',side_effect=OSError('fail')):self.assertEqual(self.cli(out),2)
        self.assertFalse(out.exists()); self.assertEqual(list(self.root.glob('.event-interval-*.tmp')),[])
    def test_concurrent_output_not_replaced(self):
        out=self.root/'out.html'; original_link=core.os.link
        def racing_link(source,target):
            Path(target).write_text('other writer'); return original_link(source,target)
        with patch.object(core.os,'link',racing_link):self.assertEqual(self.cli(out),2)
        self.assertEqual(out.read_text(),'other writer'); self.assertEqual(list(self.root.glob('.event-interval-*.tmp')),[])
    def test_parser_depth_duplicate_nonfinite_and_size(self):
        for raw in ['['*21+']'*21,'{"a":1,"a":2}','{"x":NaN}']:
            self.path.write_text(raw); out=self.root/'bad.html'; self.assertEqual(self.cli(out),2); self.assertFalse(out.exists())
        self.save()
        with patch.object(report,'MAX_RECEIPT_BYTES',1):self.assertEqual(self.cli(self.root/'large.html'),2)
    def test_invalid_receipt_no_html(self):
        self.receipt['bad']='field'; self.save(); out=self.root/'out.html'; self.assertEqual(self.cli(out),2); self.assertFalse(out.exists())
    def test_escaped_failure_reason(self):
        self.receipt={'schema_version':core.SCHEMA,'collection_status':'BLOCKED','field':'</p><script>x</script>','reason':'<img src=x>','events':[]}
        html=self.html(); self.assertNotIn('<script>',html); self.assertNotIn('<img',html)
    def test_context_not_changed_by_renderer(self):
        before=copy.deepcopy(self.receipt); self.html(); self.assertEqual(self.receipt,before)
        self.receipt['events'][0]['review_windows']['candidate_audio'][0]['context_s']=['0','3']; self.invalid()
    def test_stored_interval_precision_not_rounded(self):
        self.data['observations'][0]['interval_s']=['1.041666667','1.083333333']
        self.args['annotations'].write_text(json.dumps(self.data)); self.receipt=core.evaluate_files(**self.args)
        html=self.html(); self.assertIn('[1.041666667, 1.083333333] s',html)
        svg=report.event_svg(self.receipt['events'][0]); self.assertIn('Declared interval · s',svg)
        self.assertIn('Ticks are rounded',svg)
    def test_point_interval_not_artificial_range(self):
        self.data['observations'][0]['interval_s']=['1','1']; self.args['annotations'].write_text(json.dumps(self.data))
        self.receipt=core.evaluate_files(**self.args)
        svg=report.event_svg(self.receipt['events'][0]); self.assertIn('class="interval-point"',svg)
    def test_empty_event_set(self):
        self.receipt['events']=[]; self.receipt['bindings']=[b for b in self.receipt['bindings'] if not b['field'].startswith('evidence:')]
        html=self.html(); self.assertIn('No declared events',html); self.assertNotIn('<svg',html)

if __name__=='__main__':unittest.main()
