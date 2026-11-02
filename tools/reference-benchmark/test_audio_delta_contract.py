"""Synthetic in-memory comparison field contract; no media or external access."""
import unittest
import benchmark

class AudioDeltaContract(unittest.TestCase):
    def profile(self, bins, global_db):
        return {"input": {"sha256": "a"*64}, "visual": {"samples": []},
                "audio": {"global_rms_dbfs": global_db, "samples": [
                    {"t_s": i*.1, "rms_dbfs": value, "lr_balance": 0}
                    for i,value in enumerate(bins)]}}
    def test_single_bin_field_preserves_computation(self):
        result=benchmark.compare_profiles(self.profile([-120,-30,-20],-28),
                                           self.profile([-120,-24,-14],-22))["audio_deltas"]
        self.assertEqual(result["mean_bin_rms_db_delta"],4)
        self.assertEqual(result["global_rms_db"],6)
        self.assertNotIn("rms_db",result)
        self.assertNotIn("rms_db_note",result)
        self.assertIn("not global RMS or LUFS",result["mean_bin_rms_db_delta_note"])
    def test_missing_audio_does_not_invent_bins(self):
        result=benchmark.compare_profiles(self.profile([],None),self.profile([],None))["audio_deltas"]
        self.assertNotIn("mean_bin_rms_db_delta",result)
        self.assertNotIn("rms_db",result)
        self.assertIsNone(result["global_rms_db"])

if __name__ == "__main__": unittest.main()
