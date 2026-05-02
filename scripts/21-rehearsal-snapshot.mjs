#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSnapshot } from './lib/rehearsal.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const result = createSnapshot(root, { kind: 'snapshot', label: 'known-good baseline before fresh rehearsal' });

console.log(`Snapshot created: ${result.snapshotPath}`);
console.log(`Manifest: ${result.manifestPath}`);
console.log(`Copied ${result.copied.length} source paths.`);
