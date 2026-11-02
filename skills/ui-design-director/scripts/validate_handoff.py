#!/usr/bin/env python3
"""Bounded structural checks only; no media inspection or acceptance authentication."""
import json, math, re, sys

def finite_number(value):
    try:
        return type(value) in (int, float) and math.isfinite(value)
    except OverflowError:
        return False


def validate_details(d, objects, artifacts):
    """v0.2 declarations/references only; never opens locators or executes code."""
    errors = []
    def text(value):
        return isinstance(value, str) and bool(value.strip())
    def need(ok, message):
        if not ok:
            errors.append(message)
    def strings(value, label, known=None):
        valid = isinstance(value, list) and all(text(x) for x in value)
        need(valid, label + ' must be a list of nonempty strings')
        if valid:
            need(len(value) == len(set(value)), label + ' contains duplicate references')
            if known is not None:
                need(all(x in known for x in value), label + ' references unknown id')
    def shape(value, label, required, optional=()):
        if not isinstance(value, dict):
            errors.append(label + ' must be an object')
            return False
        need(all(k in value for k in required), label + ' missing required fields')
        need(not (set(value) - set(required) - set(optional)), label + ' has unknown fields')
        return True
    assets = set()
    for asset in d['assets']:
        if not shape(asset, 'asset', ('id', 'kind', 'locator', 'source', 'rights'),
                     ('sha256', 'font_identity', 'crop', 'object_ids', 'notes')):
            continue
        identifier = asset.get('id')
        need(text(identifier), 'asset needs nonempty id')
        if text(identifier):
            need(identifier not in assets, 'duplicate asset id')
            assets.add(identifier)
        need(asset.get('kind') in ('font', 'image', 'audio', 'data', 'other'), 'invalid asset kind')
        for key in ('locator', 'source'):
            need(text(asset.get(key)), 'asset needs ' + key + ' declaration')
        for key in ('font_identity', 'notes'):
            if key in asset:
                need(text(asset[key]), 'asset ' + key + ' must be nonempty text')
        if 'sha256' in asset:
            need(isinstance(asset['sha256'], str) and bool(re.fullmatch('[0-9a-f]{64}', asset['sha256'])), 'asset needs lowercase SHA-256')
        if 'object_ids' in asset:
            strings(asset['object_ids'], 'asset object_ids', objects)
        if 'crop' in asset and shape(asset['crop'], 'asset crop', ('x', 'y', 'width', 'height')):
            crop = asset['crop']
            need(all(finite_number(crop.get(k)) for k in ('x', 'y', 'width', 'height')) and
                 finite_number(crop.get('width')) and crop['width'] > 0 and
                 finite_number(crop.get('height')) and crop['height'] > 0, 'asset crop needs finite coordinates and positive size')
        rights = asset.get('rights')
        if shape(rights, 'asset rights', ('status',), ('reference', 'scope')):
            need(rights.get('status') in ('unknown', 'declared_permission', 'not_permitted'), 'invalid asset rights status')
            for key in ('reference', 'scope'):
                if key in rights:
                    need(text(rights[key]), 'asset rights ' + key + ' must be nonempty text')
            if rights.get('status') == 'declared_permission':
                need(text(rights.get('reference')) and text(rights.get('scope')), 'declared asset permission needs reference and scope')
    tokens = d['tokens']
    for identifier, token in tokens.items():
        need(text(identifier), 'token needs nonempty id')
        if shape(token, 'token', ('value',), ('role', 'unit')):
            value = token.get('value')
            need(text(value) or type(value) is bool or finite_number(value), 'token value must be nonempty text, boolean or finite number')
            for key in ('role', 'unit'):
                if key in token:
                    need(text(token[key]), 'token ' + key + ' must be nonempty text')
    implementation = d['implementation']
    if shape(implementation, 'implementation', ('family_ids', 'recipe_ids', 'caller_responsibilities', 'dependencies', 'support_domain'),
             ('object_ids', 'asset_ids', 'token_ids', 'notes')):
        for key in ('family_ids', 'recipe_ids', 'caller_responsibilities'):
            strings(implementation.get(key), 'implementation ' + key)
        for key, known in (('object_ids', objects), ('asset_ids', assets), ('token_ids', tokens)):
            if key in implementation:
                strings(implementation[key], 'implementation ' + key, known)
        if 'notes' in implementation:
            need(text(implementation['notes']), 'implementation notes must be nonempty text')
        dependencies = implementation.get('dependencies')
        need(isinstance(dependencies, list), 'dependencies must be a list')
        dependency_ids = set()
        for dependency in dependencies if isinstance(dependencies, list) else []:
            if not shape(dependency, 'dependency', ('id', 'kind', 'locator'), ('sha256', 'version', 'acquisition', 'notes')):
                continue
            identifier = dependency.get('id')
            need(text(identifier), 'dependency needs nonempty id')
            if text(identifier):
                need(identifier not in dependency_ids, 'duplicate dependency id')
                dependency_ids.add(identifier)
            need(dependency.get('kind') in ('renderer', 'data', 'model', 'design-module', 'font', 'runtime', 'other'), 'invalid dependency kind')
            need(text(dependency.get('locator')), 'dependency needs locator declaration')
            if 'sha256' in dependency:
                need(isinstance(dependency['sha256'], str) and bool(re.fullmatch('[0-9a-f]{64}', dependency['sha256'])), 'dependency needs lowercase SHA-256')
            for key in ('version', 'acquisition', 'notes'):
                if key in dependency:
                    need(text(dependency[key]), 'dependency ' + key + ' must be nonempty text')
            need('sha256' in dependency or text(dependency.get('version')), 'dependency needs hash or version declaration')
        domain = implementation.get('support_domain')
        if domain is not None and shape(domain, 'support_domain', ('description', 'tested_scope', 'untested_scope')):
            need(text(domain.get('description')), 'support_domain needs description')
            strings(domain.get('tested_scope'), 'support_domain tested_scope')
            strings(domain.get('untested_scope'), 'support_domain untested_scope')
    need('motion_receipt' in d, 'motion_receipt required (null when absent)')
    receipt = d.get('motion_receipt')
    if receipt is not None and shape(receipt, 'motion_receipt',
            ('design_version', 'consumer', 'object_map', 'adopted_artifacts', 'used_asset_ids', 'used_token_ids', 'deviations', 'revalidation_scope'), ('notes',)):
        need(receipt.get('design_version') == d['design_version'], 'motion_receipt design version mismatch')
        need(text(receipt.get('consumer')), 'motion_receipt needs consumer declaration')
        for key, known in (('used_asset_ids', assets), ('used_token_ids', tokens)):
            strings(receipt.get(key), 'motion_receipt ' + key, known)
        adopted = receipt.get('adopted_artifacts')
        need(isinstance(adopted, list), 'motion_receipt adopted_artifacts must be a list')
        adopted_ids = set()
        for adoption in adopted if isinstance(adopted, list) else []:
            if shape(adoption, 'adopted artifact', ('artifact_id', 'sha256')):
                identifier = adoption.get('artifact_id')
                artifact = artifacts.get(identifier) if text(identifier) else None
                need(artifact is not None, 'adopted artifact references unknown artifact')
                if text(identifier):
                    need(identifier not in adopted_ids, 'duplicate adopted artifact')
                    adopted_ids.add(identifier)
                if artifact is not None:
                    need(adoption.get('sha256') == artifact.get('sha256'), 'adopted artifact hash mismatch')
        strings(receipt.get('revalidation_scope'), 'motion_receipt revalidation_scope')
        if 'notes' in receipt:
            need(text(receipt['notes']), 'motion_receipt notes must be nonempty text')
        mappings = receipt.get('object_map')
        need(isinstance(mappings, list), 'motion_receipt object_map must be a list')
        pairs = set()
        for mapping in mappings if isinstance(mappings, list) else []:
            if shape(mapping, 'object mapping', ('object_id', 'motion_object_id')):
                source, target = mapping.get('object_id'), mapping.get('motion_object_id')
                need(text(source) and source in objects, 'object mapping references unknown UI object')
                need(text(target), 'object mapping needs declared Motion object id')
                if text(source) and text(target):
                    need((source, target) not in pairs, 'duplicate object mapping')
                    pairs.add((source, target))
        deviations = receipt.get('deviations')
        need(isinstance(deviations, list), 'motion_receipt deviations must be a list')
        for deviation in deviations if isinstance(deviations, list) else []:
            if shape(deviation, 'deviation', ('scope', 'reason', 'object_ids')):
                need(text(deviation.get('scope')) and text(deviation.get('reason')), 'deviation needs scope and reason')
                strings(deviation.get('object_ids'), 'deviation object_ids', objects)
    return errors


def validate(d):
    errors=[]
    def nonempty(v): return isinstance(v,str) and bool(v.strip())
    def need(ok,msg):
        if not ok: errors.append(msg)
    if not isinstance(d,dict): return ['root must be an object']
    need(d.get('schema_version')=='0.2','unsupported schema_version')
    for k in ('project_id','design_version'):
        need(isinstance(d.get(k),str) and bool(d[k].strip()),k+' must be nonempty')
    need(d.get('entry_mode') in ('direct','motion_delegated'),'invalid entry_mode')
    need(d.get('delivery_status') in ('draft','static_candidate'),'invalid delivery_status')
    lists=('states','objects','assets','artifacts','evidence','must_keep','safe_regions','motion_questions','unresolved_issues','history_evidence')
    for k in lists: need(isinstance(d.get(k),list),k+' must be a list')
    for k in ('brief','target','direction','content','tokens','implementation','gates','publish_permission'):
        need(isinstance(d.get(k),dict),k+' must be an object')
    if errors: return errors
    maps={}
    for kind in ('objects','artifacts','evidence'):
        maps[kind]={}
        for x in d[kind]:
            if not isinstance(x,dict) or not isinstance(x.get('id'),str) or not x['id']:
                errors.append(kind+' entries need nonempty id'); continue
            need(x['id'] not in maps[kind],kind+' duplicate id')
            maps[kind][x['id']]=x
    for x in maps['artifacts'].values():
        need(nonempty(x.get('locator')),'artifact needs readable locator declaration')
        need(x.get('media_type') in ('image','video','document'),'artifact needs media_type image/video/document')
        need(isinstance(x.get('sha256'),str) and bool(re.fullmatch('[0-9a-f]{64}',x['sha256'])),'artifact needs lowercase SHA-256')
    for x in maps['objects'].values():
        parent=x.get('parent')
        need(parent is None or (isinstance(parent,str) and parent in maps['objects']),'unknown or invalid object parent')
        for field,keys in (('bounds',('x','y','width','height')),('anchor',('x','y'))):
            v=x.get(field)
            need(isinstance(v,dict) and all(finite_number(v.get(k)) for k in keys),'object needs numeric '+field)
        need(type(x.get('z_order')) is int,'object needs integer z_order')
        need(isinstance(x.get('editable_source'),str) and bool(x['editable_source']),'object needs editable_source or explicit unavailable explanation')
        seen={x['id']}; current=parent
        while isinstance(current,str) and current in maps['objects']:
            if current in seen: errors.append('object parent cycle'); break
            seen.add(current);current=maps['objects'][current].get('parent')
    state_ids=set()
    for x in d['states']:
        if not isinstance(x,dict) or not nonempty(x.get('id')):
            errors.append('state needs string id');continue
        need(x['id'] not in state_ids,'duplicate state id');state_ids.add(x['id'])
        need(x.get('basis') in ('verified','illustrative','unknown'),'state needs basis')
        need(isinstance(x.get('description'),str) and bool(x['description']),'state needs description')
        need(isinstance(x.get('object_ids'),list) and all(isinstance(i,str) and i in maps['objects'] for i in x['object_ids']),'state needs known object_ids')
    for x in d['history_evidence']:
        need(isinstance(x,dict) and x.get('result')=='stale' and bool(x.get('design_version')),'historical evidence needs original version and stale result')
    for x in maps['evidence'].values():
        artifact_id=x.get('artifact_id')
        a=maps['artifacts'].get(artifact_id) if isinstance(artifact_id,str) else None
        need(a is not None,'evidence references unknown artifact')
        if a: need(x.get('artifact_sha256')==a.get('sha256'),'evidence hash mismatch')
        need(x.get('design_version')==d['design_version'],'stale evidence version')
        need(nonempty(x.get('scope')), 'evidence needs nonempty string scope')
        need(x.get('result') in ('pass','fail','not_assessed','blocked','stale'),'invalid evidence result')
        need(nonempty(x.get('method')) and nonempty(x.get('reviewer')),'evidence needs string method/reviewer')
    errors.extend(validate_details(d, maps['objects'], maps['artifacts']))
    if d['delivery_status']=='static_candidate':
        need(any(x.get('media_type')=='image' for x in maps['artifacts'].values()),'static_candidate needs actual image artifact')
        need(nonempty(d['brief'].get('primary_message')),'candidate needs primary_message')
        need(nonempty(d['content'].get('provenance_note')),'candidate needs content provenance_note')
        need(bool(d['objects']),'candidate needs object records')
        need(bool(d['states']),'candidate needs named state')
        for k in ('width','height'):
            v=d['target'].get(k); need(type(v) is int and v>0,'candidate target needs positive '+k)
    for gate in ('static_technical','static_visual','owner_acceptance','motion_viewing'):
        g=d['gates'].get(gate)
        if not isinstance(g,dict): errors.append('missing gate '+gate); continue
        need(g.get('status') in ('not_assessed','pass','fail','blocked','stale'),'invalid gate status')
        ids=g.get('evidence_ids')
        if not isinstance(ids,list) or any(not isinstance(i,str) for i in ids):
            errors.append('gate evidence_ids must be strings'); continue
        need(all(i in maps['evidence'] for i in ids),'unknown gate evidence')
        if g.get('status')=='pass':
            candidates=[maps['evidence'][i] for i in ids if i in maps['evidence']]
            relevant=[x for x in candidates if x.get('scope')==gate and x.get('result')=='pass']
            need(bool(relevant),'pass gate requires scoped pass evidence: '+gate)
            if gate=='static_visual': need(any(x.get('method')=='actual_image_viewing' and maps['artifacts'].get(x.get('artifact_id') if isinstance(x.get('artifact_id'),str) else None,{}).get('media_type')=='image' for x in relevant),'static_visual needs actual image viewing of image artifact')
            if gate=='owner_acceptance': need(any(x.get('method')=='user_feedback' for x in relevant),'owner acceptance needs user feedback')
            if gate=='motion_viewing': need(any(x.get('method')=='continuous_video_viewing' and maps['artifacts'].get(x.get('artifact_id') if isinstance(x.get('artifact_id'),str) else None,{}).get('media_type')=='video' for x in relevant),'motion gate needs continuous viewing of video artifact')
    permission=d['publish_permission']
    need(permission.get('status') in ('not_granted','granted','denied'),'invalid permission status')
    if permission.get('status')=='granted':
        auth=permission.get('authorization')
        need(isinstance(auth,dict) and all(nonempty(auth.get(k)) for k in ('by','reference','scope')),'granted needs authorization by/reference/scope strings')
    return errors

if __name__=='__main__':
    try:
        with open(sys.argv[1],encoding='utf-8') as f: errors=validate(json.load(f))
    except (OSError,ValueError,IndexError,TypeError) as e: errors=[str(e)]
    print(json.dumps({'structurally_valid':not errors,'errors':errors,'claim':'Structure only; no media inspection or authenticated acceptance.'},ensure_ascii=False,indent=2))
    sys.exit(bool(errors))
