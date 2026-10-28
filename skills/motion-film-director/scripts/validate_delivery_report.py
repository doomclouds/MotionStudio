#!/usr/bin/env python3
"""Validate report v1 structure and internal consistency; never certify perception."""
import argparse
from datetime import datetime
from fractions import Fraction
import json
from pathlib import Path
import re
import sys

SCHEMA_PATH = Path(__file__).resolve().parents[1] / 'references' / 'report-schema.json'
KINDS = ('visual', 'audio', 'av_sync')


def load_json(raw):
    def pairs(items):
        value = {}
        for key, item in items:
            if key in value:
                raise ValueError('Duplicate JSON key: ' + key)
            value[key] = item
        return value
    return json.loads(raw, object_pairs_hook=pairs,
                      parse_constant=lambda value: (_ for _ in ()).throw(ValueError('Nonfinite JSON number')))


def _type(value, name):
    return {'object': lambda: isinstance(value, dict), 'array': lambda: isinstance(value, list),
            'string': lambda: isinstance(value, str), 'integer': lambda: type(value) is int,
            'number': lambda: type(value) in (int, float), 'null': lambda: value is None,
            'boolean': lambda: type(value) is bool}[name]()


def _schema_errors(value, node, root, at='$'):
    """Evaluate exactly the local JSON-Schema subset used by the shipped contract."""
    if '$ref' in node:
        ref = node['$ref']
        if not ref.startswith('#/'):
            raise ValueError('Only local schema references are allowed')
        node = root
        for key in ref[2:].split('/'):
            node = node[key]
    errors = []
    if 'type' in node:
        types = node['type'] if isinstance(node['type'], list) else [node['type']]
        if not any(_type(value, name) for name in types):
            return [at + ': wrong type']
    if 'const' in node and (value != node['const'] or type(value) is not type(node['const'])):
        errors.append(at + ': wrong constant/version')
    if 'enum' in node and value not in node['enum']:
        errors.append(at + ': unsupported value')
    if isinstance(value, str):
        if len(value) < node.get('minLength', 0) or ('minLength' in node and not value.strip()):
            errors.append(at + ': empty string')
        if 'pattern' in node and not re.search(node['pattern'], value):
            errors.append(at + ': invalid format')
    if type(value) in (int, float) and 'minimum' in node and value < node['minimum']:
        errors.append(at + ': below minimum')
    if isinstance(value, list):
        if len(value) < node.get('minItems', 0) or len(value) > node.get('maxItems', len(value)):
            errors.append(at + ': wrong item count')
        for index, item in enumerate(value):
            errors.extend(_schema_errors(item, node.get('items', {}), root, f'{at}[{index}]'))
    if isinstance(value, dict):
        for key in node.get('required', []):
            if key not in value:
                errors.append(at + ': missing ' + key)
        for key, item in value.items():
            if key in node.get('properties', {}):
                errors.extend(_schema_errors(item, node['properties'][key], root, at + '.' + key))
            elif node.get('additionalProperties') is False:
                errors.append(at + ': unknown field ' + key)
    return errors


def _time(value):
    if isinstance(value, bool):
        raise ValueError('Boolean time')
    return Fraction(str(value))


def validate_report(report, finalized=True):
    schema = load_json(SCHEMA_PATH.read_bytes())
    if not finalized:
        schema['required'].remove('report')
    errors = _schema_errors(report, schema, schema)
    if errors:
        return errors
    try:
        timestamp = datetime.fromisoformat(report['generated_at'].replace('Z', '+00:00'))
        if timestamp.utcoffset() is None:
            errors.append('generated_at: timezone required')
        duration = _time(report['movie']['duration_seconds_exact'])
        if duration <= 0 or _time(report['target_duration_seconds']) <= 0:
            errors.append('duration: must be positive')
        ready = report['status'] == 'ready_for_owner_review'
        if ready and (report['technical'].get('status') != 'passed'
                      or report['technical'].get('full_av_decode') != 'passed'
                      or type(report['technical'].get('decoded_frames')) is not int
                      or report['technical'].get('decoded_frames', 0) <= 0):
            errors.append('ready report requires actual technical decode and frame census')
        if ready and report['blockers']:
            errors.append('ready report cannot contain blockers')
        if not ready and not report['blockers']:
            errors.append('candidate report must explain blockers')
        if ready and not report['visual_artifacts']:
            errors.append('ready report requires visual evidence')
        for kind in KINDS:
            review = report['reviews'][kind]
            record = review.get('record', {})
            if ready and (review['status'] != 'passed' or review['blockers']):
                errors.append(kind + ': not passed in ready report')
            if ready and review.get('authentication') not in ('declared_not_authenticated', 'signed_attestation_not_proof_of_perception'):
                errors.append(kind + ': missing honest provenance state')
            if ready and 'movie_sha256' in record and record['movie_sha256'] != report['movie']['sha256']:
                errors.append(kind + ': record media mismatch')
            if ready:
                allowed_methods = {'visual': {'normal_speed_visual'},
                    'audio': {'perceptual_audio_human', 'perceptual_audio_model'},
                    'av_sync': {'normal_speed_av'}}
                if record.get('method') not in allowed_methods[kind]:
                    errors.append(kind + ': missing actual perceptual review method')
                if not record.get('reviewer') or not record.get('reviewed_at'):
                    errors.append(kind + ': missing reviewer/session time')
                if not record.get('observations') or not record.get('evidence') or not review.get('record_sha256'):
                    errors.append(kind + ': missing source-bound perceptual evidence')
                if any(issue.get('disposition') not in ('resolved', 'accepted')
                       for issue in record.get('issues', []) if isinstance(issue, dict)):
                    errors.append(kind + ': unresolved raw review issue')
            coverage = record.get('coverage', [])
            cursor = Fraction(0)
            for start, end in sorted((_time(s), _time(e)) for s, e in coverage):
                if not 0 <= start < end <= duration:
                    errors.append(kind + ': invalid coverage interval')
                if start <= cursor:
                    cursor = max(cursor, end)
            if ready and cursor != duration:
                errors.append(kind + ': incomplete full-film coverage')
            for observation in record.get('observations', []):
                if not 0 <= _time(observation['start_s']) < _time(observation['end_s']) <= duration:
                    errors.append(kind + ': observation outside movie')
        if report.get('reference_based') is True:
            diagnostics = report.get('comparison_diagnostics')
            if not isinstance(diagnostics, dict):
                errors.append('reference-based report requires existing benchmark and motion-check status')
            else:
                requirements = {
                    'benchmark': ({'full_comparison_html', 'full_comparison_overview'},
                                  {'stereo_waveforms', 'log_mel', 'visual_timeline', 'visual_metrics', 'block_matching'}),
                    'motion_check': ({'motion_heatmap', 'spatial_change_map', 'motion_report'},
                                     {'rgb_difference_heatmap', 'spatial_mean_change', 'contact_sheet'})}
                for tool, (roles, panels) in requirements.items():
                    item = diagnostics[tool]
                    if item['candidate_sha256'] != report['movie']['sha256']:
                        errors.append(tool + ': diagnostic evidence belongs to different candidate')
                    if tool == 'benchmark' and not item.get('reference_sha256'):
                        errors.append('benchmark: reference identity required')
                    if item['status'] == 'COLLECTED_NOT_APPROVED':
                        if not roles <= {a['role'] for a in item['artifacts']}:
                            errors.append(tool + ': missing existing full-comparison/heatmap artifacts')
                        if not panels <= set(item['panels']):
                            errors.append(tool + ': required diagnostic panels omitted')
                    elif ready:
                        errors.append(tool + ': diagnostic collection incomplete; retain candidate')

        identifiers = set()
        for issue in report['issues']:
            if issue['id'] in identifiers:
                errors.append('duplicate issue ID: ' + issue['id'])
            identifiers.add(issue['id'])
            if issue['scope'] == 'window':
                if not 0 <= _time(issue['start_s']) < _time(issue['end_s']) <= duration:
                    errors.append(issue['id'] + ': invalid issue interval')
            elif issue['start_s'] is not None or issue['end_s'] is not None:
                errors.append(issue['id'] + ': whole_film/unspecified uses null time bounds')
            if ready and issue['disposition'] == 'pending':
                errors.append(issue['id'] + ': unresolved issue in ready report')
        comparison = report['before_after']
        if comparison['status'] == 'included' and not comparison['pairs']:
            errors.append('included before/after requires pairs')
        if comparison['status'] == 'not_applicable' and comparison['pairs']:
            errors.append('not_applicable before/after cannot contain pairs')
        if ready and comparison['status'] == 'pending':
            errors.append('required before/after comparison is pending')
        for pair in comparison['pairs']:
            if pair['issue_id'] not in identifiers:
                errors.append('before/after refers to unknown issue ID')
            if pair['after_movie_sha256'] != report['movie']['sha256']:
                errors.append('before/after after-media mismatch')
            if not 0 <= _time(pair['start_s']) < _time(pair['end_s']) <= duration:
                errors.append('before/after interval outside movie')
    except (ValueError, TypeError, ZeroDivisionError, OverflowError) as error:
        errors.append('Invalid timestamp or exact time: ' + str(error))
    return errors


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report', type=Path)
    args = parser.parse_args(argv)
    try:
        errors = validate_report(load_json(args.report.read_bytes()))
        print(json.dumps({'report_standard': 'motionstudio.delivery-report', 'version': 1,
                          'valid': not errors, 'errors': errors,
                          'note': 'Validation is not listening, viewing, authenticity or owner approval.'}))
        return 1 if errors else 0
    except (OSError, ValueError, TypeError, KeyError) as error:
        print(json.dumps({'valid': False, 'error': str(error)}), file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
