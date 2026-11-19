#!/usr/bin/env node
/** Validate harness; run actual app checks once scaffold exists. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function execute(executable, args) {
  console.log('\nRUN: ' + executable + ' ' + args.join(' '));
  execFileSync(executable, args, { cwd: root, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
}
try {
  execute(process.execPath, ['scripts/harness.mjs', 'validate']);
  if (!fs.existsSync(path.join(root, 'package.json'))) {
    console.log('\nNOT RUN: application lint/typecheck/test/build. The Next.js app is not scaffolded yet (PC-S1-01).');
    process.exit(0);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const script of ['lint', 'typecheck', 'test', 'build']) {
    if (!pkg.scripts?.[script]) throw new Error('Missing required application script: ' + script);
  }
  if (!fs.existsSync(path.join(root, 'package-lock.json'))) throw new Error('Missing npm package-lock.json; reproducible CI requires one.');
  if (!fs.existsSync(path.join(root, 'node_modules'))) execute('npm', ['ci']);
  for (const name of ['lint', 'typecheck', 'test', 'build']) execute('npm', ['run', name]);
  console.log('\nPASS: lint, typecheck, unit/contract tests and production build.');
  console.log('NOT COVERED: actual browser E2E, database, private storage or live deployment; run separate documented suites.');
} catch (error) {
  console.error('FAIL: ' + error.message);
  process.exit(1);
}
