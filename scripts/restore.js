// Restore the JSON store from a backups/ snapshot.
// Safety first: the live store is copied to backups/pre-restore-<stamp>.json
// before anything is overwritten. Usage:
//   npm run restore                  -> latest snapshot (live restore)
//   npm run restore -- --dry-run     -> validate latest snapshot, change nothing
//   npm run restore -- --file=<name> -> restore a named snapshot file
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const dataFile = path.join(repoRoot, 'server', 'data', 'furniture_store.json');
const backupsDir = path.join(repoRoot, 'backups');

function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.find((a) => a.startsWith('--file='));
const namedFile = fileArg ? fileArg.slice('--file='.length) : null;

function fail(msg) {
  console.error(`[restore] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(backupsDir)) fail(`Backups dir not found: ${backupsDir}`);

let snapshotFile;
if (namedFile) {
  snapshotFile = path.join(backupsDir, path.basename(namedFile));
  if (!fs.existsSync(snapshotFile)) fail(`Snapshot not found: ${snapshotFile}`);
} else {
  const snapshots = fs.readdirSync(backupsDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}-\d{4}-furniture_store\.json$/.test(f))
    .sort();
  if (!snapshots.length) fail('No snapshots found in backups/. Run npm run backup first.');
  snapshotFile = path.join(backupsDir, snapshots[snapshots.length - 1]);
}

// Validate before touching the live store
let store;
try {
  store = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
} catch (err) {
  fail(`Snapshot is not valid JSON: ${err.message}`);
}
if (!store || !Array.isArray(store.products)) {
  fail('Snapshot failed validation: missing products array. Aborting, live store untouched.');
}

const counts = {};
for (const key of ['products', 'quotes', 'orders', 'reviews', 'wishlist', 'newsletter', 'payments', 'auditLogs']) {
  counts[key] = Array.isArray(store[key]) ? store[key].length : 0;
}

if (dryRun) {
  console.log(`[restore] DRY RUN OK: ${path.basename(snapshotFile)} is valid (products=${counts.products}, orders=${counts.orders}, quotes=${counts.quotes}). Live store untouched.`);
  process.exit(0);
}

// Safety copy of the live store, then atomic swap
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
if (fs.existsSync(dataFile)) {
  const safety = path.join(backupsDir, `pre-restore-${stamp}-furniture_store.json`);
  fs.copyFileSync(dataFile, safety);
  console.log(`[restore] Live store safety copy: ${path.basename(safety)}`);
}

const tmp = `${dataFile}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
fs.renameSync(tmp, dataFile);
console.log(`[restore] Live store restored from ${path.basename(snapshotFile)} (products=${counts.products}, orders=${counts.orders}, quotes=${counts.quotes}).`);
