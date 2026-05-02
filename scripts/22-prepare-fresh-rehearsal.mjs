#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEnvFile } from './lib/deployment.mjs';
import { clearDeploymentEnv, createSnapshot, moveAsideIfPresent, timestamp } from './lib/rehearsal.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const stamp = timestamp();
const snapshot = createSnapshot(root, { kind: 'fresh-rehearsal-baseline', label: 'baseline before fresh testnet rehearsal reset' });
const currentEnv = readEnvFile(path.join(root, '.env'));
const moved = [];

const nttProjectPath = path.resolve(root, currentEnv.NTT_PROJECT_DIR || 'ntt');
const movedNtt = moveAsideIfPresent(nttProjectPath, root, stamp);
if (movedNtt) moved.push(movedNtt);

const artifactsPath = path.join(root, 'artifacts');
if (fs.existsSync(artifactsPath)) {
  fs.rmSync(artifactsPath, { recursive: true, force: true });
  fs.mkdirSync(artifactsPath, { recursive: true });
  moved.push({ from: 'artifacts', to: `${snapshot.snapshotPath}/artifacts` });
}

const clearedEnvKeys = clearDeploymentEnv(root);

console.log(`Baseline snapshot created: ${snapshot.snapshotPath}`);
console.log(`Cleared ${clearedEnvKeys.length} deployment env keys.`);
if (moved.length) {
  console.log('Moved or archived existing deployment state:');
  for (const item of moved) console.log(`- ${item.from} -> ${item.to}`);
}
console.log('Fresh rehearsal state is ready. Re-run Doctor, then Initialize NTT project.');
