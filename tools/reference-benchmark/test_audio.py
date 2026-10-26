"""Synthetic DSP and event-contract regression. None of these tests is a film approval."""
import json
from pathlib import Path
import tempfile
import unittest

import numpy as np

import benchmark as b


class SyntheticAudioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sr=48000
        t=np.arange(cls.sr*5)/cls.sr
        envelope=np.full(len(t), .003)
        for onset,gain,duration in [(.5,.1,.08),(1.1,.07,.16),(2.2,.15,.12),(3.1,.08,.23),(4.2,.12,.1)]:
            envelope+=(t>=onset)*(t<onset+duration)*gain
        carrier=np.sin(2*np.pi*440*t)+.3*np.sin(2*np.pi*1760*t)
        cls.pcm=np.column_stack([envelope*carrier, .35*envelope*carrier]).astype(np.float32)
        cls.base=b.audio_features(cls.pcm,cls.sr)

    def test_identity_is_zero_delta_and_not_approval(self):
        other=b.audio_features(self.pcm.copy(),self.sr)
        self.assertEqual(self.base,other)
        self.assertNotIn("quality_score",other)
        self.assertNotIn("passed",other)

    def test_gain_shift_6db_is_measured_without_claiming_semantic_onsets(self):
        louder=b.audio_features(self.pcm*2,self.sr)
        self.assertAlmostEqual(louder["global_rms_dbfs"]-self.base["global_rms_dbfs"],20*np.log10(2),places=5)
        original=np.asarray(self.base["mel"]["power_db"])
        shifted=np.asarray(louder["mel"]["power_db"])
        self.assertLess(np.max(np.abs((shifted-original)[original>-100]-20*np.log10(2))),.011)
        # Fixed spectral floors and refractory peak competition can change ambiguous
        # transient candidates under gain. Do not turn a detector into an SFX oracle.
        self.assertTrue(all(x["status"]=="ESTIMATED" for x in louder["onsets"]))

    def test_stereo_swap_reverses_energy_balance(self):
        swapped=b.audio_features(self.pcm[:,::-1],self.sr)
        for a,c in zip(self.base["samples"],swapped["samples"]):
            self.assertAlmostEqual(a["lr_balance"],-c["lr_balance"],places=6)
            self.assertAlmostEqual(a["rms_l"],c["rms_r"],places=7)

    def test_antiphase_stereo_does_not_cancel_spectrum(self):
        antiphase=self.pcm.copy();antiphase[:,1]*=-1
        data=b.audio_features(antiphase,self.sr)
        np.testing.assert_allclose(self.base["mel"]["power_db"],data["mel"]["power_db"],atol=1e-8)

    def test_known_audio_lag_has_explicit_sign_and_is_not_applied(self):
        shift=int(.2*self.sr)
        later=np.vstack([np.zeros((shift,2),np.float32),self.pcm[:-shift]])
        shifted=b.audio_features(later,self.sr)
        ref=np.array([x["rms_dbfs"] for x in self.base["samples"]])
        cand=np.array([x["rms_dbfs"] for x in shifted["samples"]])
        forward=b.offset_estimate(ref,cand,.1)
        reverse=b.offset_estimate(cand,ref,.1)
        self.assertAlmostEqual(forward["offset_s"],.2)
        self.assertAlmostEqual(reverse["offset_s"],-.2)
        self.assertGreater(float(np.mean(np.abs(cand-ref))),0)
        self.assertGreaterEqual(forward["uncertainty_s"],.1)

    def test_silence_has_no_bpm_or_pan_failure(self):
        quiet=b.audio_features(np.zeros((self.sr,2),np.float32),self.sr)
        self.assertEqual(quiet["tempo"]["status"],"UNINFORMATIVE")
        self.assertEqual(quiet["onsets"],[])
        self.assertTrue(all(row["lr_balance"] is None for row in quiet["samples"]))
        self.assertNotIn("bad",json.dumps(quiet))

    def test_onset_timestamps_preserve_origin_and_uncertainty(self):
        delayed_origin=b.audio_features(self.pcm,self.sr,origin=5)
        self.assertTrue(self.base["onsets"])
        for a,c in zip(self.base["onsets"],delayed_origin["onsets"]):
            self.assertAlmostEqual(c["t_s"]-a["t_s"],5)
            self.assertGreaterEqual(a["localization_uncertainty_s"],.025)
            self.assertEqual(a["status"],"ESTIMATED")
            self.assertNotIn("sfx",a)
        self.assertAlmostEqual(delayed_origin["mel"]["times_s"][0]-self.base["mel"]["times_s"][0],5)


class EventContractTests(unittest.TestCase):
    def setUp(self):
        self.ref={"input":{"sha256":"refhash"},"timeline":{"duration_s":8}}
        self.cand={"input":{"sha256":"candhash"},"timeline":{"duration_s":8}}
        self.folder=tempfile.TemporaryDirectory(prefix="motionstudio-events-")
        self.path=Path(self.folder.name)/"events.json"
    def tearDown(self): self.folder.cleanup()
    def load(self,**updates):
        row={"label":"Synthetic whoosh","cause":"intentional pre-contact sound","source_certainty":"SYNTHETIC_KNOWN",
             "expected_lag_s":-.3,"reference_visual_s":2.5,"reference_audio_s":2.2,
             "candidate_visual_s":2.9,"candidate_audio_s":2.6,**updates}
        data={"schema_version":"motionstudio.reference-events/1.0","inputs":{"reference_sha256":"refhash","candidate_sha256":"candhash"},"events":[row]}
        self.path.write_text(json.dumps(data))
        return b.load_events(self.path,self.ref,self.cand)[0]
    def test_intentional_lead_and_joint_delay_are_both_visible(self):
        row=self.load()
        self.assertAlmostEqual(row["reference_lag_s"],-.3)
        self.assertEqual(row["lag_error_s"],0)
        self.assertAlmostEqual(row["visual_shift_s"],.4)
        self.assertAlmostEqual(row["audio_shift_s"],.4)
        self.assertEqual(row["status"],"ANNOTATED")
    def test_missing_actual_sound_is_null_even_with_plan(self):
        row=self.load(candidate_audio_s=None,candidate_planned_audio_s=2.6)
        self.assertIsNone(row["candidate_lag_s"])
        self.assertIsNone(row["lag_error_s"])
        self.assertIsNone(row["audio_shift_s"])
        self.assertEqual(row["candidate_planned_audio_s"],2.6)
    def test_stale_hash_is_rejected(self):
        self.load()
        wrong={**self.ref,"input":{"sha256":"other"}}
        with self.assertRaises(b.BenchmarkError): b.load_events(self.path,wrong,self.cand)
    def test_nonfinite_or_out_of_range_time_is_rejected(self):
        with self.assertRaises(b.BenchmarkError): self.load(candidate_visual_s=float("nan"))
        with self.assertRaises(b.BenchmarkError): self.load(candidate_visual_s=9)


if __name__=="__main__": unittest.main()
