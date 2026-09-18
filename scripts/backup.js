const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const dataFile = path.join(repoRoot, 'server', 'data', 'furniture_store.json');
const backupsDir = path.join(repoRoot, 'backups');
const cadDir = path.join(repoRoot, 'server', 'uploads', 'cad');

function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  console.error(`[backup] Data file not found: ${dataFile}`);
  process.exit(1);
}

const backupFile = path.join(backupsDir, `${stamp}-furniture_store.json`);
fs.copyFileSync(dataFile, backupFile);

let store = {};
try {
  store = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
} catch (err) {
  console.error('[backup] Failed to parse store JSON:', err.message);
  process.exit(1);
}

const count = (key) => (Array.isArray(store[key]) ? store[key].length : 0);

let cadFiles = 0;
try {
  if (fs.existsSync(cadDir)) {
    cadFiles = fs.readdirSync(cadDir).filter((f) => {
      try {
        return fs.statSync(path.join(cadDir, f)).isFile();
      } catch (_) {
        return false;
      }
    }).length;
  }
} catch (_) {
  cadFiles = 0;
}

const inventory = {
  timestamp: now.toISOString(),
  stamp,
  backup_file: path.basename(backupFile),
  counts: {
    products: count('products'),
    quotes: count('quotes'),
    orders: count('orders'),
    reviews: count('reviews'),
    wishlist: count('wishlist'),
    newsletter: count('newsletter'),
    payments: count('payments')
  },
  cad_upload_files: cadFiles
};

const inventoryFile = path.join(backupsDir, `inventory-${stamp}.json`);
fs.writeFileSync(inventoryFile, JSON.stringify(inventory, null, 2), 'utf8');

console.log(`[backup] Store copied to ${backupFile}`);
console.log(`[backup] Inventory written to ${inventoryFile}`);

// Rotation: keep the 10 most recent store snapshots (+ their inventories)
try {
  const snapshots = fs.readdirSync(backupsDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}-\d{4}-furniture_store\.json$/.test(f))
    .sort()
    .reverse();
  for (const old of snapshots.slice(10)) {
    fs.unlinkSync(path.join(backupsDir, old));
    const inv = path.join(backupsDir, old.replace('-furniture_store.json', '').replace(/^(\d{4}-\d{2}-\d{2}-\d{4})$/, 'inventory-$1.json'));
    if (fs.existsSync(inv)) fs.unlinkSync(inv);
    console.log(`[backup] Rotated out ${old}`);
  }
} catch (err) {
  console.error('[backup] Rotation warning:', err.message);
}
