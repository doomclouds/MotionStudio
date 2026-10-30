"""Offline font restore. Requires exact user-provided inputs; never downloads."""
from pathlib import Path
import argparse, json, hashlib, io, sys
import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset


def require(ok, message):
    if not ok:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def restore(inputs, output):
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / 'font-inputs.json').read_text())
    require(fontTools.version == manifest['fontToolsVersion'], 'fontTools version mismatch')
    raw_out = Path(output).absolute()
    out = raw_out.resolve()
    require(not out.is_relative_to(root), 'output must be outside this package')
    require(not raw_out.exists() and not raw_out.is_symlink(), 'output already exists; overwrite refused')
    require(out.parent.is_dir(), 'external output parent must already exist')
    source = Path(inputs).resolve()
    require(source.is_dir(), 'input directory missing')
    # Preflight every input and every destination before creating anything.
    cached = {}
    names = set()
    for row in manifest['fonts']:
        for key in ('input', 'output'):
            name = row[key]
            require(isinstance(name, str) and Path(name).name == name and name not in ('.', '..'), 'unsafe font filename')
        require(row['output'] not in names, 'duplicate output filename')
        names.add(row['output'])
        src = source / row['input']
        require(src.is_file() and not src.is_symlink(), 'input must be regular non-symlink file: ' + row['input'])
        data = src.read_bytes()
        require(digest(data) == row['inputSha256'], 'input hash mismatch: ' + row['input'])
        cached[row['input']] = data
    # Generate and verify in memory. Invalid input/output hashes leave no output directory.
    ready = {}
    for row in manifest['fonts']:
        f = TTFont(io.BytesIO(cached[row['input']]), recalcTimestamp=False)
        if not row.get('fullFont'):
            options = subset.Options(); options.name_IDs = ['*']
            sub = subset.Subsetter(options=options)
            sub.populate(unicodes=manifest['unicodes']); sub.subset(f)
        instantiateVariableFont(f, row['axes'], inplace=True)
        buf = io.BytesIO(); f.save(buf); f.close(); data = buf.getvalue()
        require(digest(data) == row['outputSha256'], 'derived hash mismatch: ' + row['output'])
        ready[row['output']] = data
    # Exclusive creation refuses even a concurrently created destination.
    out.mkdir(exist_ok=False)
    created = []
    try:
        for name, data in ready.items():
            dst = out / name
            with dst.open('xb') as stream:
                created.append(dst); stream.write(data)
        for name in ready:
            print(name, 'verified')
    except BaseException:
        for dst in created:
            dst.unlink(missing_ok=True)
        out.rmdir()
        raise


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--inputs', required=True); ap.add_argument('--out', required=True)
    args = ap.parse_args()
    try:
        restore(args.inputs, args.out)
    except (ValueError, OSError) as error:
        sys.exit('REFUSED: ' + str(error))
