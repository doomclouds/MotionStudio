"""Synthetic contracts only: no actual listening, video decoding or quality evidence."""
import copy
from decimal import Decimal
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import subprocess
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest.mock import patch

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('event_intervals',ROOT/'event_intervals.py')
ei=importlib.util.module_from_spec(spec); spec.loader.exec_module(ei)

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()

def make_fixture(root):
    """Create deliberately non-media bytes and synthetic timing; tool does not decode."""
    root=Path(root); root.mkdir(parents=True,exist_ok=True)
    data=json.loads((ROOT/'event-intervals.example.synthetic.json').read_text())
    args={'annotations':root/'annotations.json','evidence_root':root}
    for role,first in [('reference',10),('candidate',20)]:
        media=root/(role+'.synthetic-bytes'); media.write_bytes(('NOT MEDIA: synthetic '+role).encode())
        profile=root/(role+'.profile.json')
        profile.write_text(json.dumps({'schema_version':ei.PROFILE_SCHEMA,'input':{'sha256':digest(media),'video':{'first_pts_s':first}},'timeline':{'duration_s':3},'audio':{'status':'OBSERVED','origin_s':-0.1,'duration_s':3.1}}))
        data['inputs'][role]={'media_sha256':digest(media),'profile_sha256':digest(profile)}
        record=root/(role+'-observation.json'); record.write_text('{"synthetic":true,"not_an_actual_observation":true}')
        next(x for x in data['evidence'] if x['id']=='ev_'+role[0])['sha256']=digest(record)
        args[role+'_media']=media; args[role+'_profile']=profile
    args['annotations'].write_text(json.dumps(data))
    return args,data

class IntervalTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.root=Path(self.temp.name)
        self.args,self.data=make_fixture(self.root)
    def tearDown(self): self.temp.cleanup()
    def save(self): self.args['annotations'].write_text(json.dumps(self.data))
    def run_case(self): self.save(); return ei.evaluate_files(**self.args)
    def invalid(self):
        with self.assertRaises(ei.ContractError): self.run_case()
    def test_synthetic_example_exact(self):
        result=self.run_case(); ev=result['events'][0]; m=ev['measurements']
        self.assertEqual(m['reference_lag']['interval_s'],['-0.02','0.06'])
        self.assertEqual(m['candidate_lag']['interval_s'],['-0.02','0.06'])
        self.assertEqual(m['visual_shift']['interval_s'],['0.16','0.24'])
        self.assertEqual(m['audio_shift']['interval_s'],['0.16','0.24'])
        self.assertEqual(m['lag_error']['interval_s'],['-0.08','0.08'])
        self.assertIn('INSPECT_DECLARED_DIFFERENCE',ev['review_actions'])
        self.assertEqual(result['timing']['candidate']['first_video_pts_s'],'20')
        self.assertEqual(result['timing']['reference']['audio_domain_s'],['-0.1','3'])
        self.assertEqual(result['synthetic_notice'],'SYNTHETIC_NOT_FILM_EVIDENCE')
        self.assertEqual(result['provenance_validation'],'OPERATOR_DECLARED_NOT_INDEPENDENTLY_VERIFIED')
        self.assertEqual(result['verified_scope'],'FILE_BYTES_AND_CONTRACT_ONLY_NOT_WATCHING_OR_LISTENING')
        self.assertNotIn('passed',json.dumps(result).lower())
        self.assertEqual(result,self.run_case())
    def test_arithmetic_and_invalid_seconds(self):
        D=Decimal
        self.assertEqual(ei.subtract_interval((D('1'),D('1')),(D('2'),D('2'))),(D('-1'),D('-1')))
        for x in [True,1,1.0,'1e2','NaN','Infinity','-0','-0.00','01','10000000','0.1234567891']:
            with self.subTest(x=x), self.assertRaises(ei.ContractError): ei.parse_seconds(x)
        with self.assertRaises(ei.ContractError): ei.interval(['2','1'])
        with self.assertRaises(ei.ContractError): ei.profile_number(Decimal('1e1000000'))
    def test_negative_audio_time(self):
        self.data['observations'][1]['interval_s']=['-0.1','0']; result=self.run_case()
        self.assertEqual(result['events'][0]['measurements']['reference_lag']['interval_s'],['-1.14','-1'])
    def test_missing_audio_preserves_visual_shift(self):
        ob=self.data['observations'][3]; ob.update(state='unknown',interval_s=None,interval_kind='none')
        m=self.run_case()['events'][0]['measurements']
        self.assertEqual(m['candidate_lag']['status'],'MISSING'); self.assertEqual(m['visual_shift']['status'],'ARITHMETIC_ENVELOPE')
    def test_ambiguity_no_choice(self):
        ob=copy.deepcopy(self.data['observations'][3]); ob['id']='ca2'
        self.data['observations'].append(ob); self.data['events'][0]['slots']['candidate_audio'].append('ca2')
        ev=self.run_case()['events'][0]
        self.assertEqual(ev['measurements']['candidate_lag']['status'],'AMBIGUOUS')
        self.assertIsNone(ev['measurements']['lag_error']['interval_s'])
        self.assertEqual(len(ev['review_windows']['candidate_audio']),2)
    def test_unresolved_mapping(self):
        self.data['events'][0]['mapping']='unresolved'
        self.assertTrue(all(v['status']=='UNRESOLVED_MAPPING' for v in self.run_case()['events'][0]['measurements'].values()))
    def test_planned_layer_does_not_calculate(self):
        self.data['events'][0]['layer']='planned'
        for e in self.data['evidence']: e['kind']='plan_record'
        for o in self.data['observations']: o.update(layer='planned',interval_kind='planned_window')
        self.assertTrue(all(v['status']=='PLANNED_ONLY' and v['interval_s'] is None for v in self.run_case()['events'][0]['measurements'].values()))
    def test_measured_layer_stays_measured(self):
        self.data['events'][0]['layer']='measured'
        for e in self.data['evidence']: e['kind']='measurement_profile'
        for o in self.data['observations']: o.update(layer='measured',interval_kind='analysis_support')
        self.assertEqual(self.run_case()['events'][0]['layer'],'measured')
    def test_unknown_layer(self):
        self.data['events'][0]['layer']='unknown'; self.data['evidence']=[]
        for o in self.data['observations']: o.update(layer='unknown',state='unknown',interval_s=None,interval_kind='none',evidence_id=None)
        self.assertTrue(all(v['interval_s'] is None for v in self.run_case()['events'][0]['measurements'].values()))
    def test_not_observed_and_intentional_silence(self):
        for state in ['not_observed','intentional_silence']:
            self.data['observations'][3].update(state=state,interval_s=None,interval_kind='none')
            self.assertEqual(self.run_case()['events'][0]['measurements']['candidate_lag']['status'],'NOT_APPLICABLE')
    def test_reject_mixed_layer(self):
        self.data['observations'][0].update(layer='measured',interval_kind='analysis_support'); self.invalid()
    def test_reject_slot_swap(self):
        self.data['events'][0]['slots']['reference_visual']=['ra1']; self.invalid()
    def test_reject_duplicate_id(self):
        self.data['observations'].append(copy.deepcopy(self.data['observations'][0])); self.invalid()
    def test_reject_missing_evidence(self):
        self.data['observations'][0]['evidence_id']=None; self.invalid()
    def test_reject_unknown_fields(self):
        self.data['observations'][0]['confidence']=.99; self.invalid()
    def test_json_parser(self):
        for raw in ['{"a":1,"a":2}','{"x":NaN}','['*21+']'*21,b'\xff','{"x":Infinity}']:
            with self.subTest(raw=raw),self.assertRaises(ei.ContractError): ei.parse_strict_json(raw)
        self.assertEqual(ei.parse_strict_json('{"x":"[[["}'),{'x':'[[['})
    def test_out_of_bounds_not_clipped(self):
        self.data['observations'][1]['interval_s']=['-0.2','0']; self.invalid()
    def modify_profile(self,fn):
        path=self.args['reference_profile']; p=json.loads(path.read_text()); fn(p); path.write_text(json.dumps(p))
        self.data['inputs']['reference']['profile_sha256']=digest(path)
    def test_absent_audio(self):
        self.modify_profile(lambda p:p.update(audio={'status':'ABSENT'})); self.invalid()
    def test_profile_invalid_fields(self):
        self.modify_profile(lambda p:p['timeline'].update(duration_s=3601)); self.invalid()
    def test_profile_media_binding_stale(self):
        self.modify_profile(lambda p:p['input'].update(sha256='0'*64))
        with self.assertRaises(ei.BindingError) as ctx:self.run_case()
        self.assertEqual(ctx.exception.status,'STALE')
    def test_mutations_stale(self):
        for key in ['reference_media','reference_profile']:
            with self.subTest(key=key):
                args,_=make_fixture(self.root); args[key].write_bytes(b'changed')
                with self.assertRaises(ei.BindingError) as ctx:ei.evaluate_files(**args)
                self.assertEqual(ctx.exception.status,'STALE')
        self.args,self.data=make_fixture(self.root)
        (self.root/'reference-observation.json').write_text('changed')
        with self.assertRaises(ei.BindingError) as ctx:self.run_case()
        self.assertEqual(ctx.exception.status,'STALE')
    def test_missing_media(self):
        self.args['reference_media'].unlink()
        with self.assertRaises(ei.BindingError) as ctx:self.run_case()
        self.assertEqual(ctx.exception.status,'MISSING')
    def test_traversal_and_symlink(self):
        for path in ['../outside','/outside','a//b','a/./b','https://x','a\\b']:
            with self.subTest(path=path),self.assertRaises(ei.ContractError):ei.relative_parts(path)
        original=self.root/'reference-observation.json'; target=self.root/'target'; original.rename(target); original.symlink_to(target)
        with self.assertRaises(ei.BindingError) as ctx:self.run_case()
        self.assertEqual(ctx.exception.status,'BLOCKED')
    def test_outside_evidence_symlink_is_blocked(self):
        with tempfile.TemporaryDirectory() as other:
            target=Path(other)/'outside'; target.write_text('outside')
            original=self.root/'reference-observation.json'; original.unlink(); original.symlink_to(target)
            with self.assertRaises(ei.BindingError) as ctx:self.run_case()
            self.assertEqual(ctx.exception.status,'BLOCKED')
    def test_intermediate_symlink(self):
        (self.root/'dir').mkdir(); (self.root/'link').symlink_to(self.root/'dir',target_is_directory=True)
        with self.assertRaises(ei.BindingError):ei.regular_path(self.root/'link'/'missing','test')
    def test_nonregular(self):
        with self.assertRaises(ei.BindingError):ei.regular_path(self.root,'test')
    def test_limits(self):
        with patch.dict(ei.LIMITS,{'annotation':1}):
            with self.assertRaises(ei.ContractError):ei.evaluate_files(**self.args)
        self.data['events']*=101; self.invalid()
    def test_context_separate(self):
        ev=self.run_case()['events'][0]; row=ev['review_windows']['reference_visual'][0]
        self.assertEqual(row['interval_s'],['1.000','1.040']); self.assertEqual(row['context_s'],['0.75','1.29'])
    def cli(self,out):
        argv=['evaluate']
        for k,v in self.args.items():argv+=['--'+k.replace('_','-'),str(v)]
        argv+=['--out',str(out)]
        with redirect_stdout(io.StringIO()),redirect_stderr(io.StringIO()):return ei.main(argv)
    def test_cli_fresh_and_input_error(self):
        out=self.root/'out.json'; self.assertEqual(self.cli(out),0)
        old=out.read_bytes(); self.assertEqual(self.cli(out),2); self.assertEqual(old,out.read_bytes())
        self.data['bad']=True; self.save(); newer=self.root/'bad.json'; self.assertEqual(self.cli(newer),2); self.assertFalse(newer.exists())
    def test_cli_stale_receipt(self):
        self.args['reference_media'].write_bytes(b'changed'); out=self.root/'stale.json'
        self.assertEqual(self.cli(out),1); result=json.loads(out.read_text())
        self.assertEqual(result['collection_status'],'STALE'); self.assertEqual(result['events'],[])
    def test_atomic_write_failure_and_race(self):
        out=self.root/'atomic.json'
        with patch.object(ei.os,'fsync',side_effect=OSError('write failed')):
            with self.assertRaises(OSError): ei.write_fresh_json(out,{'valid':True})
        self.assertFalse(out.exists()); self.assertEqual(list(self.root.glob('.event-interval-*.tmp')),[])
        out.write_text('existing')
        with self.assertRaises(FileExistsError):ei.write_fresh_json(out,{'valid':True})
        self.assertEqual(out.read_text(),'existing'); self.assertEqual(list(self.root.glob('.event-interval-*.tmp')),[])
    def test_missing_input_cannot_be_output(self):
        path=self.args['reference_media']; path.unlink()
        self.assertEqual(self.cli(path),2); self.assertFalse(path.exists())
    def test_missing_evidence_cannot_be_output(self):
        path=self.root/'reference-observation.json'; path.unlink()
        self.assertEqual(self.cli(path),2); self.assertFalse(path.exists())
    def test_annotation_binding_recorded(self):
        result=self.run_case()
        self.assertEqual(next(b['sha256'] for b in result['bindings'] if b['field']=='annotations'),digest(self.args['annotations']))
    def test_reader_changed_during_read(self):
        path=self.args['reference_media']; actual_open=Path.open
        class GrowingStream:
            def __init__(self,stream): self.stream=stream; self.grown=False
            def __enter__(self): return self
            def __exit__(self,*a): self.stream.close()
            def read(self,n):
                chunk=self.stream.read(n)
                if chunk and not self.grown:
                    self.grown=True
                    with actual_open(path,'ab') as other:other.write(b'changed')
                return chunk
        def changed_open(p,*a,**kw):return GrowingStream(actual_open(p,*a,**kw))
        with patch.object(Path,'open',changed_open):
            with self.assertRaises(ei.BindingError) as ctx:ei.Reader().read(path,'media',10000)
        self.assertEqual(ctx.exception.status,'STALE')
    def test_profile_malformed_and_nonfinite(self):
        for value in [True,[], '1', float('inf')]:
            with self.subTest(value=value):
                self.args,self.data=make_fixture(self.root)
                self.modify_profile(lambda p:p['timeline'].update(duration_s=value))
                self.invalid()
    def test_limit_total_and_slot(self):
        with patch.dict(ei.LIMITS,{'total':1}):
            with self.assertRaises(ei.ContractError):ei.evaluate_files(**self.args)
        self.data['events'][0]['slots']['reference_visual']=['rv1']*5; self.invalid()
    def test_negative_profile_pts_and_point_interval(self):
        self.modify_profile(lambda p:p['input']['video'].update(first_pts_s=-10))
        self.data['observations'][0]['interval_s']=['1','1']
        result=self.run_case()
        self.assertEqual(result['timing']['reference']['first_video_pts_s'],'-10')
        self.assertEqual(result['events'][0]['measurements']['reference_lag']['interval_s'],['0.02','0.06'])
    def git(self,root,*args):
        return subprocess.run(['git','-C',str(root),*args],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=ei.git_environment())
    def test_placeholder_git_not_repository(self):
        (self.root/'.git').mkdir(); script=self.root/'unpacked'/'review-tools'/'event_intervals.py'
        script.parent.mkdir(parents=True); script.write_text('# synthetic')
        self.assertIsNone(ei.detect_repository(script))
        ei.validate_output_policy(self.root/'result.json',script)
    def test_real_repository_output_policy(self):
        self.git(self.root,'init'); script=self.root/'event_intervals.py'; script.write_text('# synthetic')
        (self.root/'.gitignore').write_text('ignored/\n')
        self.assertEqual(ei.detect_repository(script),self.root)
        with self.assertRaises(ei.ContractError):ei.validate_output_policy(self.root/'public.json',script)
        ei.validate_output_policy(self.root/'ignored'/'result.json',script)
    def test_gitfile_worktree_output_policy(self):
        repo=self.root/'repo'; repo.mkdir(); self.git(repo,'init')
        (repo/'file').write_text('synthetic'); self.git(repo,'add','file')
        self.git(repo,'-c','user.name=Synthetic','-c','user.email=synthetic@example.invalid','commit','-m','synthetic fixture')
        tree=self.root/'tree'; self.git(repo,'worktree','add','--detach',str(tree))
        self.assertTrue((tree/'.git').is_file())
        script=tree/'event_intervals.py'; script.write_text('# synthetic')
        (tree/'.gitignore').write_text('ignored/\n')
        self.assertEqual(ei.detect_repository(script),tree)
        with self.assertRaises(ei.ContractError):ei.validate_output_policy(tree/'public.json',script)
        ei.validate_output_policy(tree/'ignored'/'result.json',script)
    def test_repository_missing_head_fails_closed(self):
        self.git(self.root,'init'); (self.root/'.git'/'HEAD').unlink()
        script=self.root/'event_intervals.py'; script.write_text('# synthetic')
        with self.assertRaises(ei.ContractError):ei.validate_output_policy(self.root/'public.json',script)
    def test_nonempty_invalid_gitfile_fails_closed(self):
        (self.root/'.git').write_text('invalid gitfile')
        script=self.root/'event_intervals.py'; script.write_text('# synthetic')
        with self.assertRaises(ei.ContractError):ei.detect_repository(script)
    def test_empty_gitfile_placeholder(self):
        (self.root/'.git').write_bytes(b'')
        script=self.root/'event_intervals.py'; script.write_text('# synthetic')
        self.assertIsNone(ei.detect_repository(script))
    def test_repository_marker_permission_failure_closed(self):
        (self.root/'.git').mkdir(); script=self.root/'event_intervals.py'; script.write_text('# synthetic')
        real_iterdir=Path.iterdir
        def denied(path):
            if path==self.root/'.git': raise PermissionError('not readable')
            return real_iterdir(path)
        with patch.object(Path,'iterdir',denied):
            with self.assertRaises(PermissionError):ei.validate_output_policy(self.root/'public.json',script)
        self.assertFalse((self.root/'public.json').exists())
    def test_dangling_head_fails_closed(self):
        self.git(self.root,'init'); head=self.root/'.git'/'HEAD'; head.unlink(); head.symlink_to('missing')
        script=self.root/'event_intervals.py'; script.write_text('# synthetic')
        with self.assertRaises(ei.ContractError):ei.detect_repository(script)
    def test_broken_plausible_repo_fails_closed(self):
        (self.root/'.git').mkdir(); (self.root/'.git'/'HEAD').write_text('broken')
        script=self.root/'event_intervals.py'; script.write_text('# synthetic')
        with self.assertRaises(ei.ContractError):ei.detect_repository(script)
    def test_permission_failure_redacted(self):
        with patch.object(Path,'open',side_effect=PermissionError('private path')):
            with self.assertRaises(ei.BindingError) as ctx:ei.Reader().read(self.args['reference_media'],'reference',1000)
        self.assertNotIn('private path',str(ctx.exception))

if __name__=='__main__': unittest.main()
