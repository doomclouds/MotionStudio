#!/usr/bin/env python3
"""Create synthetic-only bad/corrected/control inputs in a NEW local directory.
No media, decoder, model, network or artistic acceptance. Never use as film evidence.
"""
import argparse
import copy
import json
from pathlib import Path
from event_correspondence import SCHEMA, TIME_BASIS, hash_file, validate


def create(out):
    out = Path(out)
    out.mkdir(parents=False, exist_ok=False)
    (out / 'reference.txt').write_text('SYNTHETIC reference bytes, not media\n')
    (out / 'record.txt').write_text('SYNTHETIC imagined labels, not observed film evidence\n')
    event = dict(id='contact', actor='ball', action='contact', target='platform', kind='point',
                 status='observed', interval_s=['1', '1'], pts_samples=['1'], evidence_id='record',
                 note='Synthetic invented event, not a source-film observation')
    base = dict(schema=SCHEMA, dataset_kind='synthetic', time_basis=TIME_BASIS,
                coverage={'reference': ['0', '2'], 'candidate': ['0', '2']},
                evidence=[dict(id='record', path='record.txt', sha256=hash_file(out / 'record.txt'))],
                sequences={role: dict(media_sha256='0' * 64, first_video_pts_s='0', events=[copy.deepcopy(event)])
                           for role in ('reference', 'candidate')},
                correspondences=[dict(reference_id='contact', candidate_ids=['contact'], tolerance_s='0.05',
                                      rationale='Explicit synthetic one-to-one example')])
    base['sequences']['reference']['media_sha256'] = hash_file(out / 'reference.txt')
    for name in ('bad', 'corrected', 'control'):
        candidate = out / (name + '.txt')
        candidate.write_text('SYNTHETIC ' + name + ' bytes, not media\n')
        data = copy.deepcopy(base)
        data['sequences']['candidate']['media_sha256'] = hash_file(candidate)
        if name == 'bad':
            item = data['sequences']['candidate']['events'][0]
            item.update(target='wall', interval_s=['1.4', '1.4'], pts_samples=['1.4'])
        if name == 'control':
            for role in ('reference', 'candidate'):
                data['sequences'][role]['events'][0].update(action='release', interval_s=['1.7', '1.7'], pts_samples=['1.7'])
        validate(data)
        (out / (name + '.json')).write_text(json.dumps(data, indent=2) + '\n')
    return out


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--out', required=True, help='New directory, existing parent; refuses overwrite')
    a = p.parse_args()
    try:
        create(a.out)
    except (OSError, ValueError) as e:
        p.error(str(e))
    print('SYNTHETIC_NOT_FILM_EVIDENCE: bad/corrected/control inputs created; run diagnostic explicitly')


if __name__ == '__main__':
    main()
