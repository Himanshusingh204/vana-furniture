const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '═════════════════════════════════════════════════════════════');
console.log('\x1b[33m%s\x1b[0m', '  VANA — ARCHITECTURAL WOODCRAFT & CAD FULL STACK PLATFORM   ');
console.log('\x1b[32m%s\x1b[0m', '  Factory: Basni Industrial Area, Jodhpur, Rajasthan, India  ');
console.log('\x1b[36m%s\x1b[0m', '═════════════════════════════════════════════════════════════\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Auto-free ports 5000 (API) and 5173 (Vite) if occupied by orphaned processes.
// A stale Vite on 5173 is worse than a dead port: the browser would keep
// serving the old bundle and the user would never see the fresh build.
try {
  if (isWindows) {
    execSync('powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction Stop | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {} exit 0"', { stdio: 'ignore' });
  } else {
    execSync('fuser -k 5000/tcp 5173/tcp >/dev/null 2>&1 || true');
  }
} catch (_) {}

// Pass full command string to avoid Node [DEP0190] DeprecationWarning with shell: true
const server = spawn(`${npmCmd} run dev`, {
  cwd: path.join(__dirname, '..', 'server'),
  stdio: 'inherit',
  shell: true
});

const client = spawn(`${npmCmd} run dev`, {
  cwd: path.join(__dirname, '..', 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\n\x1b[31m%s\x1b[0m', 'Shutting down services gracefully...');
  if (server) server.kill();
  if (client) client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
