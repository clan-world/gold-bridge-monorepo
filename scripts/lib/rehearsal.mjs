import fs from 'node:fs';
import path from 'node:path';
import { readEnvFile } from './deployment.mjs';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'cache', 'out', 'target']);

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function rehearsalRoot(root) {
  return path.join(root, '.rehearsals');
}

export function latestSnapshot(root) {
  const dir = rehearsalRoot(root);
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('gold-bridge-'))
      .map((entry) => {
        const fullPath = path.join(dir, entry.name);
        const manifest = readJson(path.join(fullPath, 'manifest.json'));
        return {
          path: path.relative(root, fullPath),
          createdAt: manifest?.createdAt || entry.name.replace(/^gold-bridge-/, ''),
          kind: manifest?.kind || 'snapshot',
          label: manifest?.label || entry.name,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return entries[0] || null;
  } catch {
    return null;
  }
}

export function createSnapshot(root, { kind = 'snapshot', label = 'operator snapshot' } = {}) {
  const stamp = timestamp();
  const snapshotDir = path.join(rehearsalRoot(root), `gold-bridge-${stamp}`);
  const currentEnv = readEnvFile(path.join(root, '.env'));
  const copied = [];
  fs.mkdirSync(snapshotDir, { recursive: true, mode: 0o700 });

  copyFileIfPresent(path.join(root, '.env'), path.join(snapshotDir, 'env', '.env'), copied, root);
  copyDirIfPresent(path.join(root, 'artifacts'), path.join(snapshotDir, 'artifacts'), copied, root);
  copyFileIfPresent(path.join(root, 'apps/web/src/generated/goldDeployment.ts'), path.join(snapshotDir, 'generated', 'goldDeployment.ts'), copied, root);

  const nttProjectDir = currentEnv.NTT_PROJECT_DIR || 'ntt';
  const nttProjectPath = path.resolve(root, nttProjectDir);
  copyDirIfPresent(nttProjectPath, path.join(snapshotDir, 'ntt-project'), copied, root);

  const manifest = {
    kind,
    label,
    createdAt: new Date().toISOString(),
    envPath: path.relative(root, path.join(root, '.env')),
    nttProjectDir,
    nttProjectPath,
    copied,
    addresses: {
      solanaToken: currentEnv.SOLANA_TOKEN_MINT || '',
      solanaManager: currentEnv.SOLANA_NTT_MANAGER_ADDRESS || '',
      solanaTransceiver: currentEnv.SOLANA_NTT_TRANSCEIVER_ADDRESS || '',
      baseToken: currentEnv.BASE_TOKEN_ADDRESS || '',
      baseManager: currentEnv.BASE_NTT_MANAGER_ADDRESS || '',
      baseTransceiver: currentEnv.BASE_NTT_TRANSCEIVER_ADDRESS || '',
      baseTimelock: currentEnv.BASE_TIMELOCK_ADDRESS || '',
      baseProxyAdmin: currentEnv.BASE_PROXY_ADMIN_ADDRESS || '',
    },
  };
  fs.writeFileSync(path.join(snapshotDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });

  return {
    snapshotPath: path.relative(root, snapshotDir),
    manifestPath: path.relative(root, path.join(snapshotDir, 'manifest.json')),
    copied,
    manifest,
  };
}

export function clearDeploymentEnv(root) {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return [];
  const clearKeys = new Set([
    'BASE_TOKEN_ADDRESS',
    'BASE_TOKEN_IMPLEMENTATION_ADDRESS',
    'BASE_TOKEN_V2_IMPLEMENTATION_ADDRESS',
    'BASE_PROXY_ADMIN_ADDRESS',
    'BASE_TIMELOCK_ADDRESS',
    'BASE_NTT_MANAGER_ADDRESS',
    'BASE_NTT_TRANSCEIVER_ADDRESS',
    'SOLANA_NTT_MANAGER_ADDRESS',
    'SOLANA_NTT_TRANSCEIVER_ADDRESS',
    'BASE_TOKEN_DEPLOY_TX',
    'BASE_SET_MINTER_TX',
    'SCHEDULE_SET_MINTER_TX',
    'EXECUTE_SET_MINTER_TX',
    'SOLANA_TO_BASE_PROOF_TX',
    'BASE_TO_SOLANA_APPROVE_TX',
    'BASE_TO_SOLANA_PROOF_TX',
    'VITE_BASE_TOKEN_ADDRESS',
    'VITE_BASE_NTT_MANAGER_ADDRESS',
    'VITE_BASE_NTT_TRANSCEIVER_ADDRESS',
    'VITE_SOLANA_NTT_MANAGER_ADDRESS',
    'VITE_SOLANA_NTT_TRANSCEIVER_ADDRESS',
  ]);
  const original = fs.readFileSync(envPath, 'utf8');
  const touched = [];
  const next = original.split(/\r?\n/).map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match || !clearKeys.has(match[1])) return line;
    touched.push(match[1]);
    return `${match[1]}=`;
  });
  fs.writeFileSync(envPath, `${next.join('\n').replace(/\n*$/, '')}\n`);
  return touched;
}

export function moveAsideIfPresent(sourcePath, root, stamp) {
  if (!fs.existsSync(sourcePath)) return null;
  const parent = path.dirname(sourcePath);
  const base = path.basename(sourcePath);
  const destination = path.join(parent, `${base}.baseline-${stamp}`);
  fs.renameSync(sourcePath, destination);
  return {
    from: path.relative(root, sourcePath),
    to: path.relative(root, destination),
  };
}

function copyFileIfPresent(source, destination, copied, root) {
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  fs.copyFileSync(source, destination);
  fs.chmodSync(destination, 0o600);
  copied.push(path.relative(root, source));
}

function copyDirIfPresent(source, destination, copied, root) {
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) return;
  fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    if (entry.name === '.rehearsals') continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirIfPresent(from, to, copied, root);
    else copyFileIfPresent(from, to, copied, root);
  }
  copied.push(path.relative(root, source));
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}
