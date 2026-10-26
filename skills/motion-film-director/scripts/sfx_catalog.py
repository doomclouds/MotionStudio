#!/usr/bin/env python3
"""Offline discovery seed checks. No downloads, listening, licensing guarantee or API calls."""
import argparse
import datetime
import json
import re
from pathlib import Path
from urllib.parse import urlparse

DEFAULT = Path(__file__).resolve().parents[1] / 'research/sfx-candidates.json'
LICENSES = {'CC0-1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
            'CC-BY-4.0': 'https://creativecommons.org/licenses/by/4.0/'}
ACCESS = {'public-download', 'login-required', 'unavailable', 'unknown'}
EVIDENCE = {'metadata-only': 'not_probed', 'probed': 'probed_not_heard'}
ROLES = {'signature_chime', 'whoosh', 'impact', 'ui_appearance'}

def validate(data):
    errors, seen = [], set()
    if data.get('schema_version') != 1:
        errors.append('unsupported schema_version')
    rows = data.get('candidates')
    if not isinstance(rows, list):
        return errors + ['candidates must be a list (empty is allowed)']
    for c in rows:
        if not isinstance(c, dict):
            errors.append('candidate must be an object'); continue
        ident = c.get('id', '?')
        def bad(message): errors.append(f'{ident}: {message}')
        if ident == '?' or ident in seen: bad('missing/duplicate id')
        seen.add(ident)
        for key in ('title', 'creator', 'credit', 'standalone_distribution', 'rights_caveat', 'access_note', 'selection_inference'):
            if not isinstance(c.get(key), str) or not c[key].strip(): bad(f'missing {key}')
        if c.get('access') not in ACCESS: bad('unsupported access enum')
        for key in ('source_url', 'license_url'):
            url = urlparse(str(c.get(key, '')))
            if url.scheme != 'https' or not url.netloc or url.path in ('', '/'): bad(f'{key} must identify a specific HTTPS resource')
        license_id = c.get('license')
        if license_id not in LICENSES or c.get('license_url') != LICENSES.get(license_id): bad('unsupported/inconsistent license')
        if c.get('attribution_required') is not (license_id == 'CC-BY-4.0'): bad('attribution flag inconsistent')
        if c.get('commercial_video_sync') != 'allowed_under_declared_license': bad('video sync rights unresolved')
        if c.get('source_check') != 'primary_asset_page': bad('primary per-asset source required')
        try: datetime.date.fromisoformat(c.get('checked_on', ''))
        except (ValueError, TypeError): bad('checked_on must be ISO date')
        roles = c.get('roles')
        if not isinstance(roles, list) or not roles or any(r not in ROLES for r in roles): bad('unsupported/missing role')
        # The shared seed is metadata-only; actual listening belongs in version-bound project evidence.
        if c.get('audition_status') != 'not_auditioned': bad('seed cannot claim audition; use project evidence')
        duration = c.get('duration_seconds')
        if duration is not None and (type(duration) not in (int, float) or duration <= 0): bad('invalid duration')
        if c.get('probe_status') == 'not_probed':
            if c.get('sha256') is not None: bad('unprobed file cannot claim hash')
            if c.get('duration_evidence') not in ('source_page', 'not_probed'): bad('unprobed measurement claim')
        elif c.get('probe_status') == 'probed_not_heard':
            if not re.fullmatch(r'[a-f0-9]{64}', str(c.get('sha256', ''))): bad('probe requires sha256')
            if c.get('duration_evidence') != 'local_ffprobe' or duration is None: bad('probe requires measured duration')
            if not str(c.get('download_url', '')).startswith('https://'): bad('probe requires exact download URL')
        else: bad('invalid probe status')
    return errors

def query(data, role=None, limit=3, license_id=None, access=None, evidence=None):
    # Filters inspect recorded evidence only; they never fetch, certify freshness or audition.
    for value, allowed in ((license_id, LICENSES), (access, ACCESS), (evidence, EVIDENCE)):
        if value is not None and value not in allowed:
            raise ValueError(f'unsupported filter: {value}')
    return [c for c in data['candidates']
            if (role is None or role in c['roles'])
            and (license_id is None or c['license'] == license_id)
            and (access is None or c['access'] == access)
            and (evidence is None or c['probe_status'] == EVIDENCE[evidence])
            ][:max(0, min(limit, 10))]

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('command', choices=['validate', 'query'])
    p.add_argument('--catalog', type=Path, default=DEFAULT)
    p.add_argument('--role', choices=sorted(ROLES))
    p.add_argument('--license', dest='license_id', choices=sorted(LICENSES))
    p.add_argument('--access', choices=sorted(ACCESS))
    p.add_argument('--evidence', choices=sorted(EVIDENCE))
    p.add_argument('--limit', type=int, default=3)
    a = p.parse_args()
    try:
        data = json.loads(a.catalog.read_text())
        errors = validate(data)
    except (OSError, ValueError, TypeError, AttributeError) as exc:
        errors = [str(exc)]
    if errors:
        print(json.dumps({'valid': False, 'errors': errors}, ensure_ascii=False)); return 1
    print(json.dumps({'valid': True, 'count': len(data['candidates'])} if a.command == 'validate'
                     else query(data, a.role, a.limit, a.license_id, a.access, a.evidence), ensure_ascii=False, indent=2))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
