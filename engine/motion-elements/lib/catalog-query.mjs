/** Offline metadata selection only. Never imports entries or dereferences evidence/links. */
export const KINDS = Object.freeze(['motion', 'transition', 'composition', 'recipe', 'geometry', 'reveal', 'fragment', 'raster']);
export const STATUSES = Object.freeze(['experimental']);
export const QUERY_LIMITS = Object.freeze({defaultLimit: 20, maxLimit: 100, maxText: 256, maxTag: 64, maxId: 128});
const own = (o, k) => Object.hasOwn(o, k);
const normalize = s => s.normalize('NFC').trim().toLowerCase();
function string(value, name, max) {
  if (typeof value !== 'string' || value.length > max || !value.trim() || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${name} must be nonempty text, at most ${max} UTF-16 units, without control characters`);
  }
  return value;
}
function options(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) throw new TypeError('query must be a plain object');
  for (const key of Reflect.ownKeys(input)) if (!['id', 'kind', 'status', 'text', 'tag', 'limit'].includes(key)) throw new TypeError(`unknown query option: ${String(key)}`);
  const q = {};
  for (const key of ['kind', 'status']) if (own(input, key)) {
    if (!(key === 'kind' ? KINDS : STATUSES).includes(input[key])) throw new TypeError(`invalid ${key}`);
    q[key] = input[key];
  }
  if (own(input, 'id')) {
    q.id = string(input.id, 'id', QUERY_LIMITS.maxId);
    if (!/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/.test(q.id)) throw new TypeError('id must be an exact canonical ID');
  }
  for (const key of ['text', 'tag']) if (own(input, key)) q[key] = normalize(string(input[key], key, key === 'text' ? QUERY_LIMITS.maxText : QUERY_LIMITS.maxTag));
  q.limit = own(input, 'limit') ? input.limit : QUERY_LIMITS.defaultLimit;
  if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > QUERY_LIMITS.maxLimit) throw new TypeError('limit must be an integer from 1 to 100');
  return q;
}

/** Input is parsed static catalog JSON; returns detached JSON metadata, not evaluated examples. */
export function queryCatalog(catalog, input = {}) {
  const q = options(input);
  if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.elements)) throw new TypeError('expected catalog schemaVersion 1');
  const ids = new Set();
  const matches = [];
  for (const element of catalog.elements) {
    if (!element || typeof element.id !== 'string' || ids.has(element.id)) throw new TypeError('catalog IDs must be unique strings');
    ids.add(element.id);
    const reasons = [];
    let skip = false;
    for (const key of ['id', 'kind', 'status']) if (own(q, key)) {
      if (element[key] !== q[key]) { skip = true; break; }
      reasons.push({filter: key, value: q[key], match: 'exact'});
    }
    if (skip) continue;
    if (own(q, 'tag')) {
      if (!(element.tags ?? []).some(t => normalize(t) === q.tag)) continue;
      reasons.push({filter: 'tag', value: q.tag, match: 'normalized-exact'});
    }
    if (own(q, 'text')) {
      const fields = [];
      for (const field of ['id', 'summary', 'api', 'tags', 'applicability', 'counterexamples']) {
        const values = Array.isArray(element[field]) ? element[field] : [element[field]];
        if (values.some(v => typeof v === 'string' && normalize(v).includes(q.text))) fields.push(field);
      }
      if (!fields.length) continue;
      reasons.push({filter: 'text', value: q.text, match: 'normalized-literal-substring', fields});
    }
    if (!reasons.length) reasons.push({filter: 'all', match: 'unfiltered'});
    matches.push({element: JSON.parse(JSON.stringify(element)), reasons});
  }
  matches.sort((a, b) => a.element.id < b.element.id ? -1 : a.element.id > b.element.id ? 1 : 0);
  return {
    schemaVersion: 1,
    semantics: 'Metadata filters only; literal text may match counterexamples. Not an AI confidence, suitability or artistic score.',
    query: q,
    total: matches.length,
    truncated: matches.length > q.limit,
    results: matches.slice(0, q.limit),
  };
}

export function parseCatalogArgs(args) {
  if (!Array.isArray(args) || args.some(a => typeof a !== 'string') || args.length > 13) throw new TypeError('expected at most 13 CLI arguments');
  if (args.some(a => a.length > QUERY_LIMITS.maxText || /[\u0000-\u001f\u007f]/u.test(a))) throw new TypeError('CLI arguments must be at most 256 UTF-16 units without control characters');
  if (args.length === 1 && args[0] === '--help') return {help: true};
  const [command, ...rest] = args;
  if (!['list', 'find', 'show'].includes(command)) throw new TypeError('command must be list, find or show (or --help)');
  const q = {};
  if (rest.length % 2) throw new TypeError('each option requires one value');
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i];
    if (!['--id', '--kind', '--status', '--text', '--tag', '--limit'].includes(flag)) throw new TypeError(`unknown option: ${flag}`);
    const key = flag.slice(2);
    if (own(q, key)) throw new TypeError(`duplicate option: ${flag}`);
    const value = rest[i + 1];
    if (key === 'limit' && !/^(?:[1-9][0-9]?|100)$/.test(value)) throw new TypeError('limit must be a decimal integer from 1 to 100');
    q[key] = key === 'limit' ? Number(value) : value;
  }
  if (command === 'show' && (!own(q, 'id') || Object.keys(q).length !== 1)) throw new TypeError('show requires only --id');
  if (command !== 'show' && own(q, 'id')) throw new TypeError('--id is only supported by show');
  if (command === 'find' && !own(q, 'text') && !own(q, 'tag')) throw new TypeError('find requires --text or --tag');
  return {command, query: options(q)};
}
