"""Build from a disposable index and smoke the portable three-core Skill in /tmp.
Does not alter the canonical Git index, install dependencies, or retain media.
"""
import hashlib, json, os, shutil, subprocess, tempfile, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def run(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, check=True, **kwargs)
def main():
    actual = Path(subprocess.check_output(['git', 'rev-parse', '--git-path', 'index'], cwd=ROOT).decode().strip())
    if not actual.is_absolute(): actual = ROOT / actual
    before = hashlib.sha256(actual.read_bytes()).hexdigest()
    with tempfile.TemporaryDirectory(prefix='motion-portable-smoke-') as temp:
        temp = Path(temp); index = temp / 'index'; shutil.copy2(actual, index)
        env = dict(os.environ, GIT_INDEX_FILE=str(index))
        # Only the explicitly authored source packages and synthetic wrapper test.
        sources = []
        for core in ('motion-timeline-core', 'motion-audio-core'):
            for path in (ROOT / 'engine' / core).rglob('*'):
                if path.is_file() and (path.suffix in {'.mjs', '.md', '.json'} or path.name == 'LICENSE'):
                    sources.append(str(path.relative_to(ROOT)))
        sources.extend(['skills/motion-film-director/scripts/test-audio-timeline.mjs', 'skills/motion-film-director/references/knowledge-decision-example/index.json', 'skills/motion-film-director/references/knowledge-decision-example/cases/plan.json'])
        sources.extend(subprocess.check_output(['git', 'diff', '--name-only'], cwd=ROOT).decode().splitlines())
        run(['git', 'add', '--', *sources], env=env)
        run(['python3', 'scripts/check-source-tree.py'], env=env)
        archive = temp / 'skill.zip'
        run(['python3', 'scripts/build-skill.py', '--output', str(archive)], env=env)
        with zipfile.ZipFile(archive) as z:
            names = z.namelist()
            for core in ('motion-render-core', 'motion-timeline-core', 'motion-audio-core'):
                assert any('/runtime/' + core + '/lib/' in n for n in names), core
            assert 'motion-film-director/LICENSE' in names
            for license_path in ('runtime/motion-audio-core/LICENSE', 'runtime/motion-timeline-core/LICENSE', 'runtime/motion-render-core/LICENSES/napi-rs-canvas-MIT.txt', 'LICENSES/huashu-motion-MIT.txt'):
                assert 'motion-film-director/' + license_path in names
            for name in names:
                rel = name.removeprefix('motion-film-director/')
                if rel in {'runtime-source.json', 'manifest.json'}: continue
                source = ROOT / ('engine/' + rel.removeprefix('runtime/') if rel.startswith('runtime/') else 'LICENSE' if rel == 'LICENSE' else 'skills/motion-film-director/' + rel)
                assert z.read(name) == source.read_bytes(), 'Stale packaged source: ' + name
            default_kb = json.loads(z.read('motion-film-director/research/video-knowledge/index.json'))
            assert all(default_kb[key] == [] for key in ('cases', 'techniques', 'legacy'))
            for rel in ('index.json', 'cases/plan.json'):
                assert 'motion-film-director/references/knowledge-decision-example/' + rel in names
            print('All packaged source bytes match current worktree; core licenses, synthetic KB example and empty default KB verified')
            assert not any(n.endswith(('.wav', '.mp4', '.mp3')) or '/node_modules/' in n for n in names)
            z.extractall(temp / 'fresh')
        skill = temp / 'fresh/motion-film-director'
        run(['node', '--test', str(skill / 'scripts/test-audio-timeline.mjs')])
        run(['node', str(skill / 'runtime/motion-audio-core/scripts/audio.mjs'), 'capabilities'], stdout=subprocess.DEVNULL)
    assert hashlib.sha256(actual.read_bytes()).hexdigest() == before, 'Canonical index changed'
    print('Portable three-core smoke passed; canonical index unchanged')
if __name__ == '__main__': main()
