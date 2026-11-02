"""New-contract generic safety primitives. No old manifest reader or schema dispatch.
Source: audited generic guards from portfolio/validate.py at baseline 87dc72d.
These guard file/URL/JPEG properties only; they do not grant review or rights.
"""

from pathlib import Path, PurePosixPath
import re
from urllib.parse import parse_qsl, urlsplit
from validate_work import require, Blocked
Invalid=Blocked

ID = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")

SHA = re.compile(r"[0-9a-f]{64}")

VERSION = re.compile(r"\d+\.\d+\.\d+")

ROLES = {"source", "config", "documentation", "license", "lock", "cover"}

TEXT_SUFFIXES = {".md", ".txt", ".json", ".mjs", ".cjs", ".js", ".py", ".sh", ".toml", ".lock"}

FORBIDDEN_PARTS = {"assets", "frames", "renders", "output", "node_modules", "__pycache__", ".cache", "tmp"}

PRIVATE = re.compile(r"/workspace/|/home/agent/|/Users/|libfile_[a-zA-Z0-9]+|\bsk-[A-Za-z0-9_-]{24,}")

MAX_TEXT_BYTES = 2 * 1024 * 1024

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
