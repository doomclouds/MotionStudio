#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {parseCatalogArgs, queryCatalog} from '../lib/catalog-query.mjs';

try {
  const args = parseCatalogArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`Offline motion metadata catalog (JSON stdout only)\n\nlist [--kind KIND] [--status experimental] [--text TEXT] [--tag TAG] [--limit 1..100]\nfind --text TEXT | --tag TAG [same filters]\nshow --id CANONICAL_ID\n\nFilters are ANDed. Literal text is not suitability/confidence; includes counterexamples.\nNever executes examples, imports entries, opens links, writes files or uses the network.\n`);
  } else {
    const catalog = JSON.parse(await readFile(new URL('../catalog.json', import.meta.url), 'utf8'));
    process.stdout.write(`${JSON.stringify(queryCatalog(catalog, args.query), null, 2)}\n`);
  }
} catch (error) {
  process.stderr.write(`catalog query: ${error.message}\n`);
  process.exitCode = 2;
}
