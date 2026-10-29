#!/usr/bin/env python3
"""Offline source/manifest checks; never downloads, renders or confers legal approval."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
from urllib.parse import parse_qsl, urlsplit

ID = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
SHA = re.compile(r"[0-9a-f]{64}")
VERSION = re.compile(r"\d+\.\d+\.\d+")
ROLES = {"source", "config", "documentation", "license", "lock", "cover"}
TEXT_SUFFIXES = {".md", ".txt", ".json", ".mjs", ".cjs", ".js", ".py", ".sh", ".toml", ".lock"}
FORBIDDEN_PARTS = {"assets", "frames", "renders", "output", "node_modules", "__pycache__", ".cache", "tmp"}
ACCEPTANCE = {"complete_work", "owner_keep", "clean_restore", "technical", "visual", "listened", "av_sync"}
REQUIRED_GATES = {"complete_work", "owner_keep", "clean_restore", "technical"}
REVIEW_STATUSES = {
    "visual": {"PASSED", "PARTIAL", "NOT_REVIEWED"},
    "listened": {"PASSED", "NOT_LISTENED"},
    "av_sync": {"PASSED", "NUMERIC_ONLY", "NOT_REVIEWED"},
}
TOP_KEYS = {"schema", "id", "version", "title", "status", "unofficial_recreation", "original", "rights", "files", "runtime", "render", "resources", "cover", "acceptance"}
PRIVATE = re.compile(r"/workspace/|/home/agent/|/Users/|libfile_[a-zA-Z0-9]+|\bsk-[A-Za-z0-9_-]{24,}")
MAX_TEXT_BYTES = 2 * 1024 * 1024


class Invalid(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise Invalid(message)


def fields(value, keys, label):
    require(isinstance(value, dict), f"{label}: expected object")
    require(set(value) == set(keys), f"{label}: fields must be {', '.join(sorted(keys))}")


def nonempty(value, label):
    require(isinstance(value, str) and bool(value.strip()), f"{label}: expected nonempty text")


def positive_int(value, label):
    require(type(value) is int and value > 0, f"{label}: expected positive integer")


def digest(value, label):
    require(isinstance(value, str) and SHA.fullmatch(value), f"{label}: expected lowercase SHA-256")


def public_url(value, label):
    nonempty(value, label)
    require(not any(c.isspace() for c in value), f"{label}: whitespace in URL")
    try:
        u = urlsplit(value)
        port = u.port
    except ValueError as e:
        raise Invalid(f"{label}: malformed URL") from e
    require(u.scheme == "https" and u.hostname and "." in u.hostname and not u.username and not u.password,
            f"{label}: expected public HTTPS URL without credentials")
    require(port in (None, 443), f"{label}: nonstandard port")
    require(not re.search(r"(?:^|\.)(?:localhost|local|internal)$", u.hostname), f"{label}: local hostname")
    # Static hygiene only: this tool neither resolves hosts nor follows redirects.
    require(not re.fullmatch(r"[0-9.]+", u.hostname) and ":" not in u.hostname, f"{label}: numeric host")
    for key, _ in parse_qsl(u.query):
        require(not re.search(r"token|secret|signature|credential|password|api.?key|x-amz|x-goog", key, re.I),
                f"{label}: credential-like query parameter")


def relative(value, label):
    nonempty(value, label)
    p = PurePosixPath(value)
    require(not p.is_absolute() and "\\" not in value and ":" not in value and str(p) == value,
            f"{label}: noncanonical relative path")
    require(all(part not in {".", ".."} and not part.startswith(".") for part in p.parts),
            f"{label}: hidden/traversing path")
    require(not FORBIDDEN_PARTS.intersection(p.parts), f"{label}: generated/media directory")
    return p


def read_text(path):
    require(not path.is_symlink() and path.is_file(), f"{path.name}: expected regular file")
    require(path.stat().st_size <= MAX_TEXT_BYTES, f"{path.name}: source file exceeds 2 MiB")
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        raise Invalid(f"{path.name}: non-text content") from e
    require("\0" not in text, f"{path.name}: binary content")
    require(not PRIVATE.search(text), f"{path.name}: possible private path, Library ID or secret")
    require(not re.search(r"data:[^\s,]+;base64,", text, re.I), f"{path.name}: embedded encoded asset")
    return raw, text


def read_cover(path):
    """JPEG header/size/metadata check only, not complete decode or visual review."""
    require(path.is_file() and not path.is_symlink(), "cover: expected regular file")
    require(path.stat().st_size <= 1024 * 1024, "cover: exceeds 1 MiB")
    raw = path.read_bytes()
    require(raw.startswith(b"\xff\xd8") and raw.endswith(b"\xff\xd9"), "cover: expected JPEG")
    pos, dimensions = 2, None
    while pos < len(raw):
        require(raw[pos] == 255, "cover: malformed JPEG marker")
        while pos < len(raw) and raw[pos] == 255:
            pos += 1
        require(pos < len(raw), "cover: truncated JPEG")
        marker = raw[pos]
        pos += 1
        require(marker not in {0, 0xD8, 0xD9}, "cover: unexpected JPEG marker")
        require(pos + 2 <= len(raw), "cover: truncated JPEG segment")
        size = int.from_bytes(raw[pos:pos + 2], "big")
        require(size >= 2 and pos + size <= len(raw), "cover: invalid JPEG segment size")
        segment = raw[pos + 2:pos + size]
        require(marker not in {0xE1, 0xED, 0xFE}, "cover: remove EXIF/XMP/IPTC/comment metadata")
        if marker in {0xC0, 0xC1, 0xC2}:
            require(len(segment) >= 6, "cover: truncated JPEG dimensions")
            dimensions = (int.from_bytes(segment[3:5], "big"), int.from_bytes(segment[1:3], "big"))
            require(all(0 < x <= 8192 for x in dimensions), "cover: invalid JPEG dimensions")
        if marker == 0xDA:
            require(dimensions is not None, "cover: missing JPEG dimensions")
            return raw, dimensions
        pos += size
    raise Invalid("cover: missing JPEG scan")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f"duplicate JSON field: {key}")
        result[key] = value
    return result


def validate_work(root):
    root = Path(root)
    require(not root.is_symlink() and root.is_dir(), "work must be a regular directory")
    _, raw_manifest = read_text(root / "entry.json")
    try:
        data = json.loads(raw_manifest, object_pairs_hook=unique_object)
    except ValueError as e:
        raise Invalid("entry.json: invalid JSON") from e
    fields(data, TOP_KEYS, "entry")
    require(type(data["schema"]) is int and data["schema"] in {1, 2}, "schema must be 1 or 2")
    require(isinstance(data["id"], str) and ID.fullmatch(data["id"]) and data["id"] == root.name,
            "id must match the work directory")
    require(isinstance(data["version"], str) and VERSION.fullmatch(data["version"]), "version must be exact x.y.z")
    nonempty(data["title"], "title")
    require(data["status"] == "released", "candidates do not belong in works/")
    require(data["unofficial_recreation"] is True, "unofficial_recreation must explicitly be true")
    fields(data["original"], {"author", "title", "url"}, "original")
    for key in ("author", "title"):
        nonempty(data["original"][key], f"original.{key}")
    public_url(data["original"]["url"], "original.url")

    files = data["files"]
    require(isinstance(files, list) and files, "files: expected nonempty inventory")
    inventory = {}
    for row in files:
        fields(row, {"path", "sha256", "role"}, "files[]")
        p = relative(row["path"], "files[].path")
        require(row["path"] != "entry.json" and row["path"] not in inventory, "duplicate/self-referential file")
        require(row["role"] in ROLES, "files[].role: unknown role")
        if row["role"] == "cover":
            require(row["path"] == "cover.jpg", "cover must be the sole root cover.jpg")
        else:
            require(p.suffix in TEXT_SUFFIXES or p.name in {"LICENSE", "NOTICE", "COPYING"}, "non-source file extension")
        digest(row["sha256"], "files[].sha256")
        inventory[row["path"]] = row

    actual = set()
    cover_dimensions = None
    for file in root.rglob("*"):
        require(not file.is_symlink(), "symlink is not allowed")
        rel = file.relative_to(root).as_posix()
        relative(rel, "actual file")
        if file.is_dir():
            continue
        require(file.is_file(), "nonregular source file")
        if rel == "entry.json":
            continue
        require(rel in inventory, f"unlisted file: {rel}")
        if inventory[rel]["role"] == "cover":
            raw, cover_dimensions = read_cover(file)
        else:
            raw, _ = read_text(file)
        require(hashlib.sha256(raw).hexdigest() == inventory[rel]["sha256"], f"source hash mismatch: {rel}")
        actual.add(rel)
    require(actual == set(inventory), "source inventory contains missing files")

    def listed(name, role):
        relative(name, "file reference")
        require(name in inventory and inventory[name]["role"] == role, f"{name}: expected listed {role} file")

    listed("README.md", "documentation")
    rights = data["rights"]
    fields(rights, {"status", "credits", "notices", "evidence_urls"}, "rights")
    require(rights["status"] == "reviewed", "rights must have been reviewed before release")
    listed(rights["credits"], "documentation")
    for key in ("notices", "evidence_urls"):
        require(isinstance(rights[key], list) and rights[key], f"rights.{key}: expected nonempty list")
    for name in rights["notices"]:
        listed(name, "license")
    for url in rights["evidence_urls"]:
        public_url(url, "rights.evidence_urls[]")

    runtime = data["runtime"]
    require(isinstance(runtime, list) and runtime, "runtime: expected explicit pins/locks")
    names = set()
    for row in runtime:
        fields(row, {"name", "version", "lock"}, "runtime[]")
        nonempty(row["name"], "runtime.name")
        nonempty(row["version"], "runtime.version")
        require(row["name"] not in names, "duplicate runtime dependency")
        names.add(row["name"])
        require(not re.search(r"[~^*<>=\s]|latest|unspecified|unknown", row["version"], re.I), "runtime version must be exact")
        listed(row["lock"], "lock")

    render = data["render"]
    fields(render, {"entrypoint", "frames", "width", "height", "fps_num", "fps_den", "audio_sample_rate", "audio_channels"}, "render")
    listed(render["entrypoint"], "source")
    for key in set(render) - {"entrypoint"}:
        positive_int(render[key], f"render.{key}")

    cover = data["cover"]
    fields(cover, {"path", "kind", "source_sha256", "frame", "rights_status", "credit"}, "cover")
    require(cover["path"] == "cover.jpg", "cover.path must be cover.jpg")
    listed(cover["path"], "cover")
    require(sum(row["role"] == "cover" for row in inventory.values()) == 1, "exactly one cover is required")
    require(cover["rights_status"] == "reviewed", "cover rights must be reviewed")
    require(cover["credit"] == rights["credits"], "cover credit must be in the work credits")
    digest(cover["source_sha256"], "cover.source_sha256")
    require(cover["kind"] in {"rendered-frame", "original-artwork"}, "cover must derive from own rendered film or original artwork")
    if cover["kind"] == "rendered-frame":
        require(type(cover["frame"]) is int and 0 <= cover["frame"] < render["frames"], "cover frame outside final film")
    else:
        require(cover["frame"] is None, "original-artwork cover must not claim a film frame")
    require(cover_dimensions[0] * render["height"] == cover_dimensions[1] * render["width"], "cover must preserve film aspect ratio")

    resources = data["resources"]
    require(isinstance(resources, list), "resources: expected list (empty for code-only work)")
    names = set()
    common = {"id", "mode", "license", "notice", "source_url", "sha256", "permission"}
    for row in resources:
        require(isinstance(row, dict) and row.get("mode") in {"fetch", "generate"}, "resource.mode: fetch or generate only")
        fields(row, common | ({"fetch_url", "max_bytes"} if row["mode"] == "fetch" else {"generator"}), "resource")
        require(isinstance(row["id"], str) and ID.fullmatch(row["id"]) and row["id"] not in names, "resource id invalid/duplicate")
        names.add(row["id"])
        nonempty(row["license"], "resource.license")
        require(not re.search(r"unknown|pending|unclear|tbd", row["license"], re.I), "resource license is unresolved")
        require(row["permission"] == "explicit-license", "resource acquisition needs explicit license")
        listed(row["notice"], "license")
        require(row["notice"] in rights["notices"], "resource notice missing from rights")
        public_url(row["source_url"], "resource.source_url")
        digest(row["sha256"], "resource.sha256")
        if row["mode"] == "fetch":
            public_url(row["fetch_url"], "resource.fetch_url")
            positive_int(row["max_bytes"], "resource.max_bytes")
        else:
            listed(row["generator"], "source")

    fields(data["acceptance"], ACCEPTANCE, "acceptance")
    acceptance = data["acceptance"]
    if data["schema"] == 1:
        # Compatibility never silently reinterprets legacy boolean declarations.
        require(all(v is True for v in acceptance.values()), "v1 requires all acceptance booleans true; use v2 for partial review states")
    else:
        require(all(acceptance[k] is True for k in REQUIRED_GATES), "complete work, owner retention, clean restore and technical gates must be true")
        for key, allowed in REVIEW_STATUSES.items():
            row = acceptance[key]
            fields(row, {"status", "coverage"}, f"acceptance.{key}")
            require(isinstance(row["status"], str) and row["status"] in allowed, f"acceptance.{key}: unsupported review status")
            nonempty(row["coverage"], f"acceptance.{key}.coverage")
    return data["id"]


def validate_portfolio(root):
    root = Path(root)
    require(not root.is_symlink() and root.is_dir(), "portfolio root must be an existing regular directory")
    works = root / "works"
    require(not works.is_symlink(), "works/ must not be a symlink")
    if not works.exists():
        return []
    require(works.is_dir(), "works/ must be a directory")
    return [validate_work(p) for p in sorted(works.iterdir())]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args()
    try:
        result = validate_portfolio(args.root)
    except (Invalid, OSError, TypeError, KeyError) as e:
        parser.exit(1, f"FAIL: {e}\n")
    print(f"Static source checks passed: {len(result)} released works. Not a render, rights or artistic approval.")


if __name__ == "__main__":
    main()
