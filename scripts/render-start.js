#!/usr/bin/env node
/**
 * Render.com start script: migrate DB, seed if empty, start API.
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(cmd, cwd = root) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

try {
  run('npx prisma db push --accept-data-loss', path.join(root, 'packages/db'));
  run('npx tsx prisma/seed.ts', path.join(root, 'packages/db'));
} catch (e) {
  console.warn('DB migrate/seed warning (may already exist):', e instanceof Error ? e.message : e);
}

require(path.join(root, 'apps/api/dist/main.js'));
