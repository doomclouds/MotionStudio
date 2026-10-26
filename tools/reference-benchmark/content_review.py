#!/usr/bin/env python3
"""Offline evidence-contract validation; never performs semantic video evaluation."""
import argparse
import hashlib
import html
import json
import math
from pathlib import Path
import re
import subprocess
import sys

DEFAULT_SCHEMA = Path(__file__).resolve().parents[2] / 'reference-benchmark-research/content/content-review.schema.json'


def sha256(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(path)], capture_output=True, text=True, timeout=30)
    if r.returncode:
        raise ValueError('ffprobe 无法读取媒体: ' + str(path))
    data = json.loads(r.stdout)
    duration = float(data.get('format', {}).get('duration', 'nan'))
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError('媒体时长未知或无效: ' + str(path))
    return {'duration_s': duration, 'has_audio': any(x.get('codec_type') == 'audio' for x in data['streams']), 'has_video': any(x.get('codec_type') == 'video' for x in data['streams'])}


def validate(review, base_dir, synthetic=False, schema_path=DEFAULT_SCHEMA):
    errors = []
    try:
        import jsonschema
    except ImportError:
        return {'valid': False, 'errors': ['缺少 jsonschema；未安装依赖、未执行校验。'], 'assessment_performed': False}
    schema = json.loads(Path(schema_path).read_text())
    errors += [f"schema {'.'.join(map(str, e.absolute_path))}: {e.message}" for e in jsonschema.Draft202012Validator(schema).iter_errors(review)]
    if errors:
        return {'valid': False, 'errors': errors, 'assessment_performed': False}
    if synthetic != review['is_synthetic_example']:
        errors.append('synthetic 标记与运行模式不符；虚构示例禁止进入真实 review 模式。')
    tables = {}
    global_ids = set()
    for name in ('assets', 'targets', 'evidence', 'events', 'issues', 'audience_questions'):
        tables[name] = {}
        for item in review[name]:
            key = item['id']
            if not key or key in global_ids:
                errors.append(f'ID 为空或重复: {name}/{key}')
            global_ids.add(key)
            tables[name][key] = item
    def refs(ids, table, where):
        for key in ids:
            if key not in tables[table]:
                errors.append(f'引用不存在: {where} -> {table}/{key}')
    metadata = {}
    for a in review['assets']:
        if synthetic:
            metadata[a['id']] = {'binding': 'synthetic_not_verified', 'duration_s': None, 'has_audio': None, 'has_video': None}
            continue
        path = Path(a['path'])
        if not path.is_absolute():
            path = Path(base_dir) / path
        try:
            if not re.fullmatch(r'[0-9a-fA-F]{64}', a['sha256']):
                raise ValueError('必须提供真实 SHA-256')
            if sha256(path).lower() != a['sha256'].lower():
                raise ValueError('SHA-256 不匹配')
            metadata[a['id']] = {'binding': 'hash_verified', 'duration_s': None, 'has_audio': None, 'has_video': None}
            if a['role'] != 'brief':
                metadata[a['id']].update(probe(path))
        except (OSError, ValueError, subprocess.SubprocessError) as e:
            errors.append(f"媒体绑定失败 {a['id']}: {e}")
    for section in ('evidence', 'events'):
        for x in review[section]:
            refs([x['asset_id']], 'assets', x['id'])
            span = x['interval']
            start, end = span['start_s'], span['end_s']
            if not math.isfinite(start) or not math.isfinite(end) or end < start:
                errors.append('时间窗无效: ' + x['id'])
            meta = metadata.get(x['asset_id'], {})
            duration = meta.get('duration_s')
            if duration is not None and end > duration + 1e-6:
                errors.append('时间超出媒体时长: ' + x['id'])
            asset = tables['assets'].get(x['asset_id'], {})
            if asset.get('role') == 'brief' and (start != 0 or end != 0):
                errors.append('简报非时域证据必须使用 [0,0]: ' + x['id'])
            if section == 'evidence':
                if not synthetic and x['provenance'] == 'synthetic':
                    errors.append('真实模式禁止 synthetic 证据: ' + x['id'])
                if x['modality'] in ('visual', 'audiovisual') and meta.get('has_video') is False:
                    errors.append('无视频轨却声明视觉证据: ' + x['id'])
                if x['modality'] in ('audio', 'audiovisual') and meta.get('has_audio') is False:
                    errors.append('无音轨却声明音频证据: ' + x['id'])
            else:
                refs(x['evidence_ids'], 'evidence', x['id'])
                if x['epistemic_status'] == 'observed':
                    es = [tables['evidence'].get(i, {}) for i in x['evidence_ids']]
                    valid = [e for e in es if e.get('asset_id') == x['asset_id'] and e.get('modality') in ('visual', 'audio', 'audiovisual') and e.get('provenance') in ('human_observation', 'instrument_measurement') and e.get('interval', {}).get('start_s', math.inf) <= end and e.get('interval', {}).get('end_s', -1) >= start]
                    if not valid or any(e.get('provenance') in ('planned', 'synthetic') or e.get('modality') in ('brief', 'author_statement') for e in es):
                        errors.append('observed 必须绑定同资产同时间真实观察，禁止计划/意图/虚构混入: ' + x['id'])
    for x in review['targets']:
        refs(x['evidence_ids'], 'evidence', x['id'])
    for i, x in enumerate(review['relations']):
        refs([x['from_event'], x['to_event']], 'events', f'relation/{i}')
        refs(x['evidence_ids'], 'evidence', f'relation/{i}')
        if x['type'].startswith('hypothesized_') and (not x['mechanism_or_rationale'].strip() or not x['alternative_explanations']):
            errors.append(f'关系假设需机制与替代解释: relation/{i}')
    for x in review['issues']:
        refs([x['target_id']], 'targets', x['id'])
        refs(x['event_ids'], 'events', x['id'])
        refs(x['evidence_ids'], 'evidence', x['id'])
        for hypothesis in x['cause_hypotheses']:
            refs(hypothesis['supporting_evidence_ids'], 'evidence', x['id'])
        refs(x['retest']['result_evidence_ids'], 'evidence', x['id'])
        if x['retest']['status'] != 'not_run' and not x['retest']['result_evidence_ids']:
            errors.append('已复验状态缺少结果证据: ' + x['id'])
    for x in review['audience_questions']:
        refs([x['target_id']], 'targets', x['id'])
        refs(x['evidence_ids'], 'evidence', x['id'])
        if x['interpretation'] != 'not_tested' and (not x['answer_verbatim'].strip() or not any(tables['evidence'].get(i, {}).get('modality') == 'viewer_response' for i in x['evidence_ids'])):
            errors.append('观众判断缺少原话或观众响应证据: ' + x['id'])
    return {'valid': not errors, 'errors': errors, 'execution_mode': 'synthetic' if synthetic else 'real', 'declared_review_status': review['status'], 'assessment_performed': False, 'explanation': '仅校验证据结构与媒体绑定；不自动观察视频、验证语义或评判质量。', 'audio_visual_semantic_assessment': None, 'overall_quality_score': None, 'assets': metadata, 'submitted_annotations_not_independently_verified': {k: review[k] for k in ('targets', 'evidence', 'events', 'relations', 'issues', 'audience_questions')}, 'counts': {k: len(v) for k, v in tables.items()}}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('review', type=Path)
    parser.add_argument('--base-dir', type=Path, help='相对媒体路径根目录，默认注释 JSON 所在目录')
    parser.add_argument('--schema', type=Path, default=DEFAULT_SCHEMA)
    parser.add_argument('--synthetic', action='store_true', help='仅校验教学示例，绝不出具真实评估')
    parser.add_argument('--output-json', type=Path)
    parser.add_argument('--output-html', type=Path)
    args = parser.parse_args(argv)
    try:
        review = json.loads(args.review.read_text())
        result = validate(review, args.base_dir or args.review.parent, args.synthetic, args.schema)
    except (OSError, ValueError) as e:
        result = {'valid': False, 'errors': [str(e)], 'assessment_performed': False}
    rendered = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False)
    for path, contents in ((args.output_json, rendered + '\n'), (args.output_html, '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>内容审查契约校验</title><body><h1>内容审查契约校验</h1><p>非自动内容评分；未执行视频语义实测。模式：' + ('虚构教学示例' if args.synthetic else '真实资产绑定校验') + '</p><pre>' + html.escape(rendered) + '</pre></body></html>')):
        if path:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(contents)
    print(rendered)
    return 0 if result['valid'] else 2


if __name__ == '__main__':
    sys.exit(main())
