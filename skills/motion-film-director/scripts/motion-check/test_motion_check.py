#!/usr/bin/env python3
"""离线回归：合成媒体均在临时目录生成并自动清理，不保留原音。"""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent
TOOL = ROOT / "motion_check.py"


def ffmpeg(*args):
    p = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *map(str, args)], capture_output=True, timeout=30)
    if p.returncode:
        raise RuntimeError(p.stderr.decode(errors="replace"))


class HTMLAudit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.forbidden = [], []

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "iframe", "audio", "video", "object", "embed"}:
            self.forbidden.append(tag)
        for key, value in attrs:
            if key in {"src", "href"}:
                self.links.append(value)
            if key.lower().startswith("on"):
                self.forbidden.append(key)


class MotionCheckTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="motion-check-test-")
        cls.base = Path(cls.temp.name)
        cls.still = cls.base / "still source.mp4"
        cls.audio = cls.base / "two audio tracks.mp4"
        cls.vfr = cls.base / "variable frame rate.mp4"
        cls.shifted = cls.base / "start five.mp4"
        cls.short = cls.base / "single frame.mp4"
        ffmpeg("-f", "lavfi", "-i", "color=c=blue:s=64x48:r=10:d=2", "-c:v", "mpeg4", cls.still)
        ffmpeg("-f", "lavfi", "-i", "testsrc2=s=64x48:r=10:d=2", "-f", "lavfi", "-i", "sine=f=440:d=2", "-f", "lavfi", "-i", "sine=f=880:d=2", "-map", "0:v", "-map", "1:a", "-map", "2:a", "-c:v", "mpeg4", "-c:a", "aac", cls.audio)
        ffmpeg("-f", "lavfi", "-i", "testsrc2=s=64x48:r=10:d=2", "-vf", "select=not(eq(mod(n\\,3)\\,1))", "-fps_mode", "vfr", "-c:v", "mpeg4", cls.vfr)
        ffmpeg("-i", cls.still, "-c", "copy", "-output_ts_offset", "5", cls.shifted)
        ffmpeg("-f", "lavfi", "-i", "color=c=red:s=64x48:r=30", "-frames:v", "1", "-c:v", "mpeg4", cls.short)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def cli(self, source, *extra, out=None):
        out = out or self.base / self.id().rsplit(".", 1)[-1]
        cmd = [sys.executable, str(TOOL), str(source), "--out", str(out), *map(str, extra)]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.base, timeout=60)
        return result, out

    def assert_success(self, p, out):
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        report = json.loads((out / "report.json").read_text())
        self.assertEqual(report["findings"], [])
        self.assertTrue(report["full_decode"]["ok"])
        return report

    def test_missing_file(self):
        p, out = self.cli(self.base / "does not exist.mp4")
        self.assertEqual(p.returncode, 2)
        self.assertFalse(out.exists())

    def test_empty_file(self):
        empty = self.base / "empty.mp4"
        empty.touch()
        p, out = self.cli(empty)
        self.assertEqual(p.returncode, 2)
        self.assertFalse(out.exists())

    def test_bad_nonempty_file_has_failure_report(self):
        bad = self.base / "not a video.mp4"
        bad.write_bytes(b"not a video\n")
        p, out = self.cli(bad)
        self.assertEqual(p.returncode, 1)
        report = json.loads((out / "report.json").read_text())
        self.assertTrue(report["findings"])
        self.assertTrue((out / "index.html").is_file())
        self.assertNotIn("Traceback", p.stderr)

    def test_space_and_metacharacters_are_literal(self):
        source = self.base / "clip ; <literal> space.mp4"
        shutil.copyfile(self.still, source)
        before = hashlib.sha256(source.read_bytes()).hexdigest()
        p, out = self.cli(source, out=self.base / "output with space ; literal")
        report = self.assert_success(p, out)
        self.assertEqual(report["source"]["sha256"], before)
        self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(), before)
        markup = (out / "index.html").read_text()
        self.assertIn("&lt;literal&gt;", markup)
        self.assertNotIn("<literal>", markup)

    def test_stillness_is_not_error_and_silent_is_not_error(self):
        p, out = self.cli(self.still)
        report = self.assert_success(p, out)
        self.assertEqual(report["frame_census"]["decoded_video_frames"], 20)
        self.assertEqual(report["sampling"]["max_energy"], 0.0)
        self.assertEqual(report["sampling"]["low_change_comparisons"], report["sampling"]["comparison_count"])
        self.assertFalse(report["media"]["has_audio"])
        self.assertEqual(report["audio_measurements"], [])
        self.assertIn("英文回退", report["图中文字"])

    def test_all_audio_tracks_measured(self):
        p, out = self.cli(self.audio)
        report = self.assert_success(p, out)
        self.assertEqual(len(report["audio_measurements"]), 2)
        for m in report["audio_measurements"]:
            self.assertTrue(m["measured"])
            self.assertIsInstance(m["integrated_loudness_lufs"], (int, float))
            self.assertIsInstance(m["true_peak_dbtp"], (int, float))
            self.assertNotIn("Input #", (out / m["log"]).read_text())
        self.assertFalse(any(p.suffix in {".wav", ".aac", ".mp3", ".mp4"} for p in out.iterdir()))

    def test_vfr_counts_actual_decoded_frames(self):
        p, out = self.cli(self.vfr)
        report = self.assert_success(p, out)
        self.assertEqual(report["frame_census"]["decoded_video_frames"], 13)
        self.assertAlmostEqual(report["frame_census"]["last_pts_s"], 1.8, places=4)

    def test_nonzero_start_is_reported_not_hidden(self):
        p, out = self.cli(self.shifted)
        report = self.assert_success(p, out)
        self.assertAlmostEqual(report["frame_census"]["first_pts_s"], 5.0)
        self.assertAlmostEqual(report["frame_census"]["observed_span_including_last_frame_s"], 2.0)
        self.assertEqual(report["sampling"]["contact_sheets"][0]["sample_times_s"][0], 0.0)

    def test_single_frame_shorter_than_sampling_period(self):
        p, out = self.cli(self.short)
        report = self.assert_success(p, out)
        self.assertEqual(report["frame_census"]["decoded_video_frames"], 1)
        self.assertEqual(report["sampling"]["sample_count"], 1)
        self.assertEqual(report["sampling"]["comparison_count"], 0)
        self.assertIsNone(report["sampling"]["mean_energy"])

    def test_existing_output_never_overwritten(self):
        out = self.base / "existing output"
        out.mkdir()
        sentinel = out / "do-not-overwrite.txt"
        sentinel.write_text("unchanged")
        p, _ = self.cli(self.still, out=out)
        self.assertEqual(p.returncode, 2)
        self.assertEqual(sentinel.read_text(), "unchanged")
        self.assertEqual(list(out.iterdir()), [sentinel])

    def test_resource_cap_does_not_claim_complete(self):
        p, out = self.cli(self.still, "--max-samples", "2")
        self.assertEqual(p.returncode, 1)
        report = json.loads((out / "report.json").read_text())
        self.assertTrue(report["findings"])
        self.assertNotIn("sampling", report)

    def test_invalid_sampling_parameter(self):
        p, out = self.cli(self.still, "--sample-fps", "nan")
        self.assertEqual(p.returncode, 2)
        self.assertFalse(out.exists())

    def test_static_html_only_and_local_references_exist(self):
        p, out = self.cli(self.still)
        self.assert_success(p, out)
        markup = (out / "index.html").read_text()
        audit = HTMLAudit()
        audit.feed(markup)
        self.assertEqual(audit.forbidden, [])
        self.assertIn('lang="zh-CN"', markup)
        self.assertIn("不能证明逐帧无故障", markup)
        self.assertNotIn("url(", markup.lower())
        self.assertNotIn("@import", markup.lower())
        for name in audit.links:
            self.assertNotIn(":", name)
            self.assertNotIn("..", name)
            self.assertTrue((out / name).is_file(), name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
