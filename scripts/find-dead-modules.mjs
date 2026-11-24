// Reports source modules that nothing else in the app reaches.
//
// A file that only a test imports is reported separately: tests prove a module
// works, they do not make it part of the product.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';

const ROOT = resolve(process.cwd());
const SCAN = ['src', 'scripts', 'supabase/functions'];
const EXT = ['.js', '.jsx', '.ts', '.tsx'];
const ENTRY = [join(ROOT, 'src/index.jsx'), join(ROOT, 'index.html')];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = SCAN.flatMap((dir) => walk(join(ROOT, dir))).filter((f) => EXT.includes(f.slice(f.lastIndexOf('.'))) || f.endsWith('.jsonc'));

const isTest = (f) => /\.(test|spec)\.[jt]sx?$/.test(f);
const isModule = (f) => EXT.includes(f.slice(f.lastIndexOf('.')));

function resolveImport(from, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(from), spec);
  const candidates = [base, ...EXT.map((e) => base + e), ...EXT.map((e) => join(base, 'index' + e))];
  return candidates.find((c) => {
    try {
      return statSync(c).isFile();
    } catch {
      return false;
    }
  }) ?? null;
}

const importedBy = new Map();
const importPattern = /(?:import\s[^'"]*?from\s*|import\s*\(\s*|require\(\s*)['"]([^'"]+)['"]/g;

for (const file of files) {
  if (!isModule(file)) continue;
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const match of source.matchAll(importPattern)) {
    const target = resolveImport(file, match[1]);
    if (!target) continue;
    if (!importedBy.has(target)) importedBy.set(target, []);
    importedBy.get(target).push(file);
  }
}

const modules = files.filter(isModule);

// A test file is an entry point of its own: the runner imports it, not the app.
// Reporting them as orphans buried the real result under thirty lines of noise.
const isEntry = (f) => ENTRY.includes(f) || isTest(f) || /[\\/]setupTests\.[jt]s$/.test(f);

// Supabase functions are deployed as separate entry points; `index.ts` is what
// the platform runs, so nothing in the client imports it. Relative imports
// between function files still count, which is how `_lib/session.ts` is judged.
const isFunctionEntry = (f) => /^supabase\/functions\/[^/]+\/index\.ts$/.test(relative(ROOT, f).replace(/\\/g, '/'));

const orphans = modules.filter((f) => !isEntry(f) && !isFunctionEntry(f) && !importedBy.has(f));

const onlyTests = [];
for (const file of modules) {
  const importers = importedBy.get(file) ?? [];
  if (importers.length > 0 && importers.every(isTest)) onlyTests.push(file);
}

const fmt = (list) => list.map((f) => relative(ROOT, f).replace(/\\/g, '/')).sort();

console.log('ORPHANS (no importer at all):');
for (const f of fmt(orphans)) console.log('  ' + f);
console.log('\nONLY REACHED BY TESTS:');
for (const f of fmt(onlyTests)) console.log('  ' + f);
