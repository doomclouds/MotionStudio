import copy, hashlib, json, tempfile, unittest
from unittest.mock import patch
from pathlib import Path
from event_correspondence import *

def event(id='a', action='contact', target='floor', at='1',status='observed',kind='point'):
 return dict(id=id,actor='actor',action=action,target=target,kind=kind,status=status,interval_s=[at,at] if status=='observed' else None,pts_samples=[at] if status=='observed' else [],evidence_id='record',note='Synthetic test annotation, not a real observation')
def fixture():
 d=dict(schema=SCHEMA,dataset_kind='synthetic',time_basis=TIME_BASIS,
 coverage={'reference':['0','10'],'candidate':['0','10']},evidence=[dict(id='record',path='record.txt',sha256='0'*64)],
 sequences={r:dict(media_sha256='0'*64,first_video_pts_s='0',events=[event()]) for r in ('reference','candidate')},
 correspondences=[dict(reference_id='a',candidate_ids=['a'],tolerance_s='0.05',rationale='Explicit synthetic correspondence')])
 return d

class GateTests(unittest.TestCase):
 def test_identity_not_art_pass(self):
  r=compare(fixture());self.assertEqual(r['events'][0]['findings'],['WITHIN_DECLARED_TOLERANCE_NOT_APPROVAL']);self.assertIsNone(r['artistic_quality'])
 def test_late_even_same_sequence(self):
  d=fixture();d['sequences']['candidate']['events'][0]=event(at='1.4');r=compare(d)
  self.assertEqual(r['sequence']['minimum_insert_delete_operations'],0);self.assertIn('DEFINITELY_LATE',r['events'][0]['findings'])
 def test_early(self):
  d=fixture();d['sequences']['candidate']['events'][0]=event(at='0.7');self.assertIn('DEFINITELY_EARLY',compare(d)['events'][0]['findings'])
 def test_wrong_target_same_time(self):
  d=fixture();d['sequences']['candidate']['events'][0]['target']='blue_head';r=compare(d)
  self.assertIn('SEMANTIC_MISMATCH',r['events'][0]['findings']);self.assertEqual(r['events'][0]['lag_interval_s'],['0','0'])
 def test_unknown_target_not_false_mismatch(self):
  d=fixture();d['sequences']['candidate']['events'][0]['target']='unknown';self.assertEqual(compare(d)['events'][0]['findings'],['SEMANTICS_NOT_ESTABLISHED'])
 def test_first_contact_not_stable_ride(self):
  d=fixture();d['sequences']['candidate']['events'][0]['action']='stable_ride';self.assertIn('SEMANTIC_MISMATCH',compare(d)['events'][0]['findings'])
 def test_missing_is_annotation_scope_only(self):
  d=fixture();d['sequences']['candidate']['events']=[];d['correspondences'][0]['candidate_ids']=[]
  self.assertEqual(compare(d)['events'][0]['findings'],['MISSING_FROM_ANNOTATED_CANDIDATE_SEQUENCE'])
 def test_not_observed_not_pass(self):
  d=fixture();d['sequences']['candidate']['events']=[event(status='not_observed')]
  self.assertEqual(compare(d)['events'][0]['findings'],['CANDIDATE_NOT_OBSERVED'])
 def test_unknown_not_pass(self):
  d=fixture();d['sequences']['candidate']['events']=[event(status='unknown')]
  self.assertEqual(compare(d)['events'][0]['findings'],['CANDIDATE_UNKNOWN'])
 def test_ambiguous_repeats(self):
  d=fixture();d['sequences']['candidate']['events']=[event('a',at='1'),event('b',at='2')];d['correspondences'][0]['candidate_ids']=['a','b']
  r=compare(d);self.assertEqual(r['events'][0]['findings'],['AMBIGUOUS_CORRESPONDENCE']);self.assertEqual(r['sequence']['optimal_alignment'],'AMBIGUOUS')
 def test_omitted_repeat_not_collapsed(self):
  d=fixture();d['sequences']['reference']['events'].append(event('b',at='2'))
  self.assertEqual(compare(d)['sequence']['minimum_insert_delete_operations'],1)
 def test_coarse_window_inconclusive(self):
  d=fixture();d['sequences']['candidate']['events'][0]['interval_s']=['0.7','1.4']
  self.assertEqual(compare(d)['events'][0]['findings'],['TIMING_INCONCLUSIVE'])
 def test_interval_formula(self):
  d=fixture();d['sequences']['reference']['events'][0]['interval_s']=['0.9','1.1'];d['sequences']['candidate']['events'][0]['interval_s']=['0.8','1.2']
  self.assertEqual(compare(d)['events'][0]['lag_interval_s'],['-0.3','0.3'])
 def test_audio_and_visual_both_shift(self):
  d=fixture()
  for r in ['reference','candidate']:
   d['sequences'][r]['events']=[event('visual',action='visual_contact',at='1' if r=='reference' else '2'),event('audio',action='audio_onset',at='1' if r=='reference' else '2')]
  d['correspondences']=[dict(reference_id=x,candidate_ids=[x],tolerance_s='0.05',rationale='explicit') for x in ['visual','audio']]
  self.assertTrue(all('DEFINITELY_LATE' in x['findings'] for x in compare(d)['events']))
 def test_state_no_point_iou(self):
  d=fixture()
  for r in ['reference','candidate']:d['sequences'][r]['events'][0]['kind']='state';d['sequences'][r]['events'][0]['interval_s']=['1','2']
  self.assertEqual(compare(d)['events'][0]['findings'],['STATE_BOUNDARIES_RECORDED_NO_POINT_IOU_SCORE'])
 def test_order_inversion(self):
  d=fixture()
  for r in ['reference','candidate']:d['sequences'][r]['events']=[event('a',at='1'),event('b',at='2')]
  d['correspondences']=[dict(reference_id='a',candidate_ids=['b'],tolerance_s='0.05',rationale='explicit'),dict(reference_id='b',candidate_ids=['a'],tolerance_s='0.05',rationale='explicit')]
  self.assertEqual(compare(d)['order_inversions'],[('a','b')])
 def test_bad_time(self):
  for value in ['NaN','Infinity','-0','1e-3',1.0,True]:
   d=fixture();d['correspondences'][0]['tolerance_s']=value
   with self.assertRaises(Error):compare(d)
 def test_extra_field(self):
  d=fixture();d['pass']=True
  with self.assertRaises(Error):compare(d)
 def test_observed_without_pts(self):
  d=fixture();d['sequences']['reference']['events'][0]['pts_samples']=[]
  with self.assertRaises(Error):compare(d)
 def test_no_reuse_candidate(self):
  d=fixture();d['sequences']['reference']['events'].append(event('b',at='2'));d['correspondences'].append(dict(reference_id='b',candidate_ids=['a'],tolerance_s='0.1',rationale='bad'))
  with self.assertRaises(Error):compare(d)
 def test_binding_and_stale_evidence(self):
  with tempfile.TemporaryDirectory() as td:
   p=Path(td);d=fixture()
   for name in ['ref','cand','record.txt']:(p/name).write_text(name)
   d['evidence'][0]['sha256']=hash_file(p/'record.txt')
   for r,name in [('reference','ref'),('candidate','cand')]:d['sequences'][r]['media_sha256']=hash_file(p/name)
   self.assertEqual(evaluate(d,p/'ref',p/'cand',p,True)['bindings']['reference'],'SYNTHETIC_BYTES_NOT_MEDIA')
   (p/'record.txt').write_text('changed')
   with self.assertRaisesRegex(Error,'STALE'):evaluate(d,p/'ref',p/'cand',p,True)
 def test_annotation_correction_invalidates_receipt(self):
  d=fixture()
  result={'annotation_content_sha256':hashlib.sha256(json.dumps(d,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'implementation_sha256':hash_file(__import__('event_correspondence').__file__)}
  self.assertEqual(check_receipt_annotation(result,d),'ANNOTATION_AND_IMPLEMENTATION_CURRENT_ONLY')
  d['sequences']['reference']['events'][0]['target']='white_keyframe'
  with self.assertRaisesRegex(Error,'STALE annotation'):check_receipt_annotation(result,d)
 def test_actual_pts_rejected(self):
  with tempfile.TemporaryDirectory() as td:
   p=Path(td);d=fixture();d['dataset_kind']='real'
   for name in ['ref','cand','record.txt']:(p/name).write_text(name)
   d['evidence'][0]['sha256']=hash_file(p/'record.txt')
   for r,name in [('reference','ref'),('candidate','cand')]:d['sequences'][r]['media_sha256']=hash_file(p/name);d['coverage'][r]=['0','2']
   with patch('event_correspondence.probe_pts',return_value=(Decimal('0'),[Decimal('0'),Decimal('2')])):
    with self.assertRaisesRegex(Error,'PTS not present'):evaluate(d,p/'ref',p/'cand',p)
 def test_first_pts_stale(self):
  with tempfile.TemporaryDirectory() as td:
   p=Path(td);d=fixture();d['dataset_kind']='real'
   for name in ['ref','cand','record.txt']:(p/name).write_text(name)
   d['evidence'][0]['sha256']=hash_file(p/'record.txt')
   for r,name in [('reference','ref'),('candidate','cand')]:d['sequences'][r]['media_sha256']=hash_file(p/name)
   with patch('event_correspondence.probe_pts',return_value=(Decimal('1'),[Decimal('0'),Decimal('1')])):
    with self.assertRaisesRegex(Error,'STALE first'):evaluate(d,p/'ref',p/'cand',p)
 def test_malformed_ids_and_path(self):
  for slot in ['evidence_id','reference_id','candidate_ids','path']:
   d=fixture()
   if slot=='evidence_id':d['sequences']['reference']['events'][0][slot]=[]
   elif slot in ['reference_id','candidate_ids']:d['correspondences'][0][slot]=[] if slot=='reference_id' else [{}]
   else:d['evidence'][0]['path']=None
   with self.assertRaises(Error):compare(d)
 def test_wrong_media_hash(self):
  with tempfile.TemporaryDirectory() as td:
   p=Path(td)/'f';p.write_text('x')
   with self.assertRaisesRegex(Error,'STALE'):bind(p,'0'*64)
 def test_duplicate_and_nonfinite_json(self):
  with tempfile.TemporaryDirectory() as td:
   p=Path(td)/'a.json'
   for text in ['{"a":1,"a":2}','{"a":NaN}','['*21+']'*21]:
    p.write_text(text)
    with self.assertRaises(Error):strict_json(p)
class RevisionTests(unittest.TestCase):
 def sampled(self):
  d=fixture()
  for role in ('reference','candidate'):
   d['sequences'][role]['events']=[event(str_id,action='held_compressed',at=t,kind='sampled_state') for str_id,t in [('a','1'),('b','2'),('c','3')]]
  d['correspondences']=[dict(reference_id=x,candidate_ids=[x],tolerance_s='0.05',rationale='Sample only') for x in ('a','b','c')]
  return d
 def test_hold_sampled_three_times_not_three_contacts(self):
  r=compare(self.sampled())
  self.assertEqual(r['sequence']['status'],'NO_EVENT_OBSERVATIONS')
  self.assertEqual(r['sequence']['reference_observed_count'],0)
  self.assertEqual(r['sequence']['excluded_sampled_state_reference_count'],3)
  self.assertIsNone(r['sequence']['minimum_insert_delete_operations'])
  for row in r['events']:
   self.assertIsNone(row['lag_interval_s']);self.assertIsNone(row['tolerance_s']);self.assertFalse(row['tolerance_applied'])
   self.assertEqual(row['findings'],['SAMPLED_LABEL_AGREEMENT_NOT_APPEARANCE_APPROVAL'])
 def test_different_sample_clock_not_late_event(self):
  d=self.sampled();d['sequences']['candidate']['events'][0]=event(action='held_compressed',at='1.5',kind='sampled_state')
  row=compare(d)['events'][0]
  self.assertIn('DIFFERENT_SAMPLE_CLOCKS_NO_ONSET_INFERENCE',row['findings']);self.assertIsNone(row['lag_interval_s'])
 def test_sample_different_target(self):
  d=self.sampled();d['sequences']['candidate']['events'][0]['target']='other'
  row=compare(d)['events'][0];self.assertIn('SAMPLED_LABEL_DIFFERENCE',row['findings']);self.assertIsNone(row['lag_interval_s'])
 def test_sample_cannot_promote_contact_timing(self):
  for side in ('reference','candidate'):
   d=self.sampled();d['sequences'][side]['events'][0]['kind']='point'
   row=compare(d)['events'][0];self.assertIn('EVENT_KIND_MISMATCH_NO_TIMING',row['findings']);self.assertIsNone(row['lag_interval_s']);self.assertFalse(row['tolerance_applied'])
 def test_sample_extent_and_zero_duration_state_rejected(self):
  d=self.sampled();d['sequences']['reference']['events'][0]['interval_s']=['1','1.2']
  with self.assertRaises(Error):compare(d)
  d=fixture();d['sequences']['reference']['events'][0]['kind']='state'
  with self.assertRaises(Error):compare(d)
 def test_empty_sequence_not_zero_edit_pass(self):
  r=sequence_diagnostic([],[]);self.assertEqual(r['status'],'NO_EVENT_OBSERVATIONS');self.assertIsNone(r['minimum_insert_delete_operations'])
 def test_pts_bisect_gap_tolerance(self):
  pts=list(map(Decimal,['0','0.033333','0.1']))
  for t in ['0','0.033333','0.033332','0.033334','0.100001']:self.assertTrue(pts_contains(pts,Decimal(t)))
  for t in ['0.066667','0.033331999','0.100001001']:self.assertFalse(pts_contains(pts,Decimal(t)))
 def test_pts_max_inputs_bounded_reads(self):
  class Counting:
   def __init__(self):self.reads=0
   def __len__(self):return 216001
   def __getitem__(self,i):self.reads+=1;return Decimal(i)/Decimal(60)
  pts=Counting()
  for i in range(10000):self.assertTrue(pts_contains(pts,Decimal(216000-i)/Decimal(60)))
  self.assertLessEqual(pts.reads,220000)
 def test_image_binding_mutation_rejected(self):
  with tempfile.TemporaryDirectory() as td:
   p=Path(td);d=fixture()
   for name in ['ref','cand','record.txt','frame.png']:(p/name).write_bytes(name.encode())
   d['evidence'][0]['sha256']=hash_file(p/'record.txt');d['evidence'].append(dict(id='image',path='frame.png',sha256=hash_file(p/'frame.png')))
   for role,name in [('reference','ref'),('candidate','cand')]:d['sequences'][role]['media_sha256']=hash_file(p/name)
   evaluate(d,p/'ref',p/'cand',p,True);(p/'frame.png').write_bytes(b'changed image')
   with self.assertRaisesRegex(Error,'STALE'):evaluate(d,p/'ref',p/'cand',p,True)
 def test_old_schema_not_current(self):
  d=fixture();d['schema']='motionstudio.event-correspondence/0.1'
  with self.assertRaisesRegex(Error,'Schema'):compare(d)

if __name__=='__main__':unittest.main()
