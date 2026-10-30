"""Synthetic protocol tests only. These fixtures are not portfolio works or rights evidence."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from validate import Invalid, validate_portfolio, validate_work


class PortfolioTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="portfolio-contract-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.work = self.root / "works" / "synthetic-test"
        self.work.mkdir(parents=True)
        contents = {
            "README.md": ("Synthetic test only; non-official recreation.\n", "documentation"),
            "CREDITS.md": ("Synthetic attribution, not a rights approval.\n", "documentation"),
            "LICENSES/test.txt": ("Synthetic license fixture; no actual grant.\n", "license"),
            "src/scene.mjs": ("// Test fixture; never executed.\n", "source"),
            "locks/runtime.json": ("{}\n", "lock"),
        }
        files = []
        for name, (text, role) in contents.items():
            path = self.work / name
            path.parent.mkdir(exist_ok=True, parents=True)
            path.write_text(text)
            files.append({"path": name, "sha256": hashlib.sha256(text.encode()).hexdigest(), "role": role})
        # Minimal JPEG marker fixture: tests static header checks, not image decoding.
        self.cover_bytes = (b"\xff\xd8\xff\xc0\x00\x0b\x08\x02\xd0\x05\x00\x01\x01\x11\x00"
                            b"\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x00\xff\xd9")
        (self.work / "cover.jpg").write_bytes(self.cover_bytes)
        files.append({"path": "cover.jpg", "sha256": hashlib.sha256(self.cover_bytes).hexdigest(), "role": "cover"})
        self.data = {
            "schema": 1, "id": "synthetic-test", "title": "Synthetic test, not a work", "version": "1.0.0",
            "status": "released", "unofficial_recreation": True,
            "original": {"author": "Synthetic", "title": "Fixture", "url": "https://example.invalid/original"},
            "rights": {"status": "reviewed", "credits": "CREDITS.md", "notices": ["LICENSES/test.txt"],
                       "evidence_urls": ["https://example.invalid/license"]},
            "files": files,
            "runtime": [{"name": "node", "version": "24.22.1", "lock": "locks/runtime.json"}],
            "render": {"entrypoint": "src/scene.mjs", "frames": 60, "width": 1280, "height": 720,
                       "fps_num": 60, "fps_den": 1, "audio_sample_rate": 48000, "audio_channels": 2},
            "resources": [],
            "cover": {"path": "cover.jpg", "kind": "rendered-frame", "source_sha256": "b" * 64,
                      "frame": 30, "rights_status": "reviewed", "credit": "CREDITS.md"},
            "acceptance": {k: True for k in ["complete_work", "owner_keep", "clean_restore", "technical", "visual", "listened", "av_sync"]},
        }
        self.save()

    def save(self):
        (self.work / "entry.json").write_text(json.dumps(self.data))

    def reject(self):
        self.save()
        with self.assertRaises(Invalid):
            validate_work(self.work)

    def resource(self):
        return {"id": "synthetic-resource", "mode": "fetch", "license": "MIT", "notice": "LICENSES/test.txt",
                "source_url": "https://example.invalid/source", "sha256": "a" * 64,
                "permission": "explicit-license", "fetch_url": "https://example.invalid/resource", "max_bytes": 100}

    def static_ui(self):
        self.data['schema']=4
        self.data['status']='source-release'
        self.data['rights']['status']='reviewed-publication-scope'
        self.data['render']={k:v for k,v in self.data['render'].items() if k in {'entrypoint','width','height'}}
        self.data['cover'].update(kind='rendered-static',frame=None)
        self.data['acceptance']={k:True for k in ['complete_work','owner_keep','clean_restore','technical']}
        self.data['acceptance']['visual']={'status':'PARTIAL','coverage':'Synthetic static coverage only'}
        r=self.resource();r.pop('fetch_url');r.pop('max_bytes');r.update(mode='provide',permission='user-supplied-not-distributed',local_path='font.ttf',bytes=100,instructions='Supply licensed input externally')
        self.data['resources']=[r]

    def test_static_ui_schema4_valid(self):
        self.static_ui();self.save();self.assertEqual(validate_work(self.work),'synthetic-test')

    def test_static_ui_rejects_fake_audio_contract(self):
        self.static_ui();self.data['render']['audio_channels']=2;self.reject()

    def test_static_ui_rejects_fake_listening(self):
        self.static_ui();self.data['acceptance']['listened']={'status':'PASSED','coverage':'None'};self.reject()

    def test_static_ui_rejects_video_cover(self):
        self.static_ui();self.data['cover'].update(kind='rendered-frame',frame=0);self.reject()

    def test_static_ui_requires_external_resources_and_retention(self):
        self.static_ui();self.data['resources']=[];self.reject()
        self.static_ui();self.data['acceptance']['owner_keep']=False;self.reject()

    def test_valid_static_fixture(self):
        self.assertEqual(validate_portfolio(self.root), ["synthetic-test"])

    def test_empty_portfolio_is_not_a_successful_work(self):
        with tempfile.TemporaryDirectory() as temp:
            self.assertEqual(validate_portfolio(Path(temp)), [])

    def test_candidate_rejected(self):
        self.data["status"] = "candidate"
        self.reject()

    def test_unofficial_notice_required(self):
        self.data["unofficial_recreation"] = False
        self.reject()

    def test_missing_original_author_rejected(self):
        self.data["original"]["author"] = ""
        self.reject()

    def test_all_acceptance_must_be_explicit(self):
        for key in self.data["acceptance"]:
            with self.subTest(key=key):
                self.data["acceptance"][key] = False
                self.reject()
                self.data["acceptance"][key] = True

    def use_v2(self):
        self.data["schema"] = 2
        self.data["acceptance"].update(
            visual={"status":"PARTIAL","coverage":"Synthetic contact-sheet check only; not normal-speed watching."},
            listened={"status":"NOT_LISTENED","coverage":"Actual listening has not been performed."},
            av_sync={"status":"NUMERIC_ONLY","coverage":"Synthetic timestamps and correlation only; not perceptual sync review."})

    def test_v2_truthful_not_listened_can_be_retained(self):
        self.use_v2();self.save()
        self.assertEqual(validate_work(self.work), "synthetic-test")

    def test_v2_required_gates_cannot_be_relaxed(self):
        self.use_v2()
        for key in ["complete_work","owner_keep","clean_restore","technical"]:
            with self.subTest(key=key):
                self.data["acceptance"][key]=False;self.reject()
                self.data["acceptance"][key]=True

    def test_v2_boolean_does_not_imply_review(self):
        self.use_v2()
        for key in ["visual","listened","av_sync"]:
            with self.subTest(key=key):
                old=self.data["acceptance"][key];self.data["acceptance"][key]=True;self.reject()
                self.data["acceptance"][key]=old

    def test_v2_review_coverage_required(self):
        self.use_v2()
        for key in ["visual","listened","av_sync"]:
            with self.subTest(key=key):
                old=self.data["acceptance"][key]["coverage"]
                self.data["acceptance"][key]["coverage"]=" ";self.reject()
                self.data["acceptance"][key]["coverage"]=old

    def test_v2_review_status_not_interchangeable(self):
        self.use_v2();self.data["acceptance"]["listened"]["status"]="NUMERIC_ONLY";self.reject()

    def test_v2_failed_or_unknown_review_not_published(self):
        self.use_v2()
        for state in ["FAILED","unknown",True,{}]:
            with self.subTest(state=state):
                self.data["acceptance"]["visual"]["status"]=state;self.reject()

    def test_v2_full_review_with_explicit_scope(self):
        self.use_v2()
        for key in ["visual","listened","av_sync"]:
            self.data["acceptance"][key]={"status":"PASSED","coverage":"Synthetic complete-review assertion; not real evidence."}
        self.save();self.assertEqual(validate_work(self.work),"synthetic-test")

    def test_v2_not_reviewed_disclosure_is_valid(self):
        self.use_v2()
        for key in ["visual","av_sync"]:
            self.data["acceptance"][key]={"status":"NOT_REVIEWED","coverage":"No human review performed."}
        self.save();self.assertEqual(validate_work(self.work),"synthetic-test")

    def test_v2_states_do_not_silently_migrate_into_v1(self):
        self.use_v2();self.data["schema"]=1;self.reject()

    def test_unknown_schema_rejected(self):
        self.data["schema"]=4;self.reject()

    def use_v3(self):
        self.use_v2();self.data["schema"]=3;self.data["status"]="source-release";self.data["rights"]["status"]="reviewed-publication-scope"
        self.data["resources"]=[{"id":"manual-resource","mode":"provide","license":"No redistribution license established; not distributed",
            "notice":"LICENSES/test.txt","source_url":"https://example.invalid/provenance","sha256":"a"*64,
            "permission":"user-supplied-not-distributed","local_path":"fonts/example.ttf","bytes":100,
            "instructions":"Supply authorized exact bytes; URL is not an acquisition permission."}]

    def test_v3_external_source_release_truthful(self):
        self.use_v3();self.save();self.assertEqual(validate_work(self.work),"synthetic-test")

    def test_v3_cannot_claim_complete_resource_release(self):
        self.use_v3();self.data["status"]="released";self.reject()

    def test_v3_no_fake_automatic_permission(self):
        self.use_v3();self.data["resources"][0]["permission"]="explicit-license";self.reject()

    def test_v3_requires_external_gap(self):
        self.use_v3();self.data["resources"]=[];self.reject()

    def test_v3_no_unverified_auto_download(self):
        self.use_v3();r=self.data["resources"][0];r["fetch_url"]="https://example.invalid/download";self.reject()

    def test_v3_manual_mode_cannot_enter_v2(self):
        self.use_v3();self.data["schema"]=2;self.data["status"]="released";self.reject()

    def test_v3_external_path_escape_rejected(self):
        self.use_v3()
        for name in ["../file", "/file", ".file", "fonts/../file", "fonts\\file", "file:bad"]:
            with self.subTest(name=name):self.data["resources"][0]["local_path"]=name;self.reject()

    def test_v3_rights_scope_cannot_imply_blanket_clearance(self):
        self.use_v3();self.data["rights"]["status"]="reviewed";self.reject()

    def test_v3_external_path_cannot_be_duplicated(self):
        self.use_v3();row=copy.deepcopy(self.data["resources"][0]);row["id"]="other-resource";self.data["resources"].append(row);self.reject()

    def test_v3_external_path_requires_text(self):
        self.use_v3();self.data["resources"][0]["local_path"]=42;self.reject()

    def test_v3_no_fake_review_or_recovery(self):
        self.use_v3();self.data["acceptance"]["clean_restore"]=False;self.reject()

    def test_missing_or_changed_sources_rejected(self):
        (self.work / "src/scene.mjs").write_text("// changed\n")
        with self.assertRaisesRegex(Invalid, "hash mismatch"):
            validate_work(self.work)
        (self.work / "src/scene.mjs").unlink()
        with self.assertRaisesRegex(Invalid, "missing files"):
            validate_work(self.work)

    def test_unlisted_media_rejected(self):
        (self.work / "film.mp4").write_bytes(b"\x00\x00\x00\x18ftyp")
        with self.assertRaisesRegex(Invalid, "unlisted file"):
            validate_work(self.work)

    def test_renamed_binary_rejected(self):
        path = self.work / "src/scene.mjs"
        path.write_bytes(b"\xff\x00\xaa")
        next(x for x in self.data["files"] if x["path"] == "src/scene.mjs")["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
        self.reject()

    def test_embedded_asset_rejected(self):
        path = self.work / "src/scene.mjs"
        path.write_text('const media="data:image/png;base64,abcd";')
        next(x for x in self.data["files"] if x["path"] == "src/scene.mjs")["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
        self.reject()

    def test_symlinks_rejected(self):
        (self.work / "link").symlink_to(self.root, target_is_directory=True)
        with self.assertRaisesRegex(Invalid, "symlink"):
            validate_work(self.work)

    def test_hidden_output_and_traversal_rejected(self):
        original = self.data["files"][0]["path"]
        for path in ["../escape.md", "/absolute.md", "C:\\windows.md", "./README.md", "output/test.md", ".env", "src//test.mjs"]:
            with self.subTest(path=path):
                self.data["files"][0]["path"] = path
                self.reject()
        self.data["files"][0]["path"] = original

    def test_private_identity_rejected(self):
        self.data["title"] = "private libfile_0123456789"
        self.reject()

    def test_runtime_pin_required(self):
        for version in [">=24", "^0.1.100", "latest", "24.*"]:
            with self.subTest(version=version):
                self.data["runtime"][0]["version"] = version
                self.reject()

    def test_boolean_is_not_frame_number(self):
        self.data["render"]["frames"] = True
        self.reject()

    def test_licensed_fetch_metadata_valid_but_does_not_fetch(self):
        self.data["resources"] = [self.resource()]
        self.save()
        self.assertEqual(validate_work(self.work), "synthetic-test")
        self.assertEqual(len(list(self.work.rglob("*.*"))), 7)

    def test_uncleared_resource_rejected(self):
        self.data["resources"] = [self.resource()]
        for permission in ["publicly-visible", "user-liked", "unknown"]:
            with self.subTest(permission=permission):
                self.data["resources"][0]["permission"] = permission
                self.reject()

    def test_asset_hash_and_notice_required(self):
        for key, value in [("sha256", "pending"), ("notice", "LICENSES/missing.txt"), ("max_bytes", 0)]:
            with self.subTest(key=key):
                r = self.resource()
                r[key] = value
                self.data["resources"] = [r]
                self.reject()

    def test_unsafe_url_rejected(self):
        for url in ["http://example.invalid/a", "https://user:secret@example.invalid/a", "https://127.0.0.1/a",
                    "https://example.invalid/a?token=secret", "https://example.internal/a", "https://example.invalid:8080/a"]:
            with self.subTest(url=url):
                r = self.resource()
                r["fetch_url"] = url
                self.data["resources"] = [r]
                self.reject()

    def test_generation_requires_listed_source(self):
        r = self.resource()
        del r["fetch_url"], r["max_bytes"]
        r.update(mode="generate", generator="src/scene.mjs")
        self.data["resources"] = [r]
        self.save()
        self.assertEqual(validate_work(self.work), "synthetic-test")
        r["generator"] = "src/missing.py"
        self.reject()

    def test_duplicate_or_missing_inventory_rejected(self):
        self.data["files"].append(copy.deepcopy(self.data["files"][0]))
        self.reject()

    def test_unknown_fields_rejected(self):
        self.data["download_url"] = "https://example.invalid/private"
        self.reject()

    def test_cover_is_required_and_unique(self):
        self.data["cover"]["path"] = "extra.jpg"
        self.reject()

    def test_extra_cover_is_rejected(self):
        (self.work / "extra.jpg").write_bytes(self.cover_bytes)
        self.data["files"].append({"path": "extra.jpg", "role": "cover", "sha256": hashlib.sha256(self.cover_bytes).hexdigest()})
        self.reject()

    def test_original_source_frame_not_allowed(self):
        self.data["cover"]["kind"] = "reference-video-frame"
        self.reject()

    def test_cover_frame_boundaries(self):
        for frame in [-1, 60, True, 30.5]:
            with self.subTest(frame=frame):
                self.data["cover"]["frame"] = frame
                self.reject()

    def test_cover_metadata_rejected(self):
        raw = self.cover_bytes[:2] + b"\xff\xe1\x00\x08Exif\x00\x00" + self.cover_bytes[2:]
        (self.work / "cover.jpg").write_bytes(raw)
        next(x for x in self.data["files"] if x["path"] == "cover.jpg")["sha256"] = hashlib.sha256(raw).hexdigest()
        self.reject()

    def test_cover_hash_required(self):
        (self.work / "cover.jpg").write_bytes(self.cover_bytes[:-3] + b"\x01\xff\xd9")
        with self.assertRaisesRegex(Invalid, "hash mismatch"):
            validate_work(self.work)

    def test_original_cover_does_not_claim_film_frame(self):
        self.data["cover"].update(kind="original-artwork", frame=None)
        self.save()
        self.assertEqual(validate_work(self.work), "synthetic-test")
        self.data["cover"]["frame"] = 0
        self.reject()

    def test_missing_root_does_not_report_zero_success(self):
        with self.assertRaisesRegex(Invalid, "root must"):
            validate_portfolio(self.root / "missing")

    def test_duplicate_json_field_rejected(self):
        path = self.work / "entry.json"
        path.write_text(path.read_text().replace('"schema": 1', '"schema": 1, "schema": 1'))
        with self.assertRaises(Invalid):
            validate_work(self.work)

    def test_works_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp)
            (p / "works").symlink_to(self.root / "works", target_is_directory=True)
            with self.assertRaisesRegex(Invalid, "symlink"):
                validate_portfolio(p)


if __name__ == "__main__":
    unittest.main()
