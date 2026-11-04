"""Native portable layout for repository-owned sources; no legacy path aliases."""
import os
from pathlib import Path
import re

def package_path(source):
    if source.startswith('skills/motion-film-director/'):
        return source.removeprefix('skills/motion-film-director/')
    if source.startswith('engine/'):
        return 'runtime/' + source.removeprefix('engine/')
    return source  # knowledge/design, shared scripts and root license retain their paths.

def source_bytes(root, source):
    path = root / source
    if path.is_symlink() or not path.is_file():
        raise ValueError('Missing/symlink source: ' + source)
    data = path.read_bytes()
    if path.suffix != '.md' or not (source.startswith(('skills/motion-film-director/', 'knowledge/design/', 'knowledge/sound/', 'engine/sound-elements/', 'engine/design-elements/families/print-poster/'))
                                    or source in {'engine/design-elements/CASE-COVERAGE.md', 'engine/motion-elements/README.md'}):
        return data
    destination = package_path(source)
    def replace(match):
        label, target = match[1], match[2]
        if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:',target) or target.startswith('#'):
            return match[0]  # Historical fixed-commit provenance is not rewritten.
        path, sep, anchor = target.partition('#')
        resolved = os.path.normpath(str(Path(source).parent / path))
        if resolved.startswith('portfolio/') or resolved in {'SOURCE-SCOPE.md', 'THIRD_PARTY_NOTICES.md'}:
            # Repository-only context: preserve its identity without a dangling package link.
            # Actual bundled LICENSE/NOTICE files remain unchanged and required.
            return label + '（仅完整仓库：' + resolved + '）'
        relative = os.path.relpath(package_path(resolved), Path(destination).parent)
        return '[' + label + '](' + relative + (sep + anchor if sep else '') + ')'
    return re.sub(r'\[([^]\n]+)\]\(([^)]+)\)',replace,data.decode()).encode()
