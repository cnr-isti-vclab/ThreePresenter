#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const checks = [
  { relPath: 'docs/assets/smoke/sub.obj', maxBytes: 1024 * 1024 },
  { relPath: 'docs/assets/smoke/sub.mtl', maxBytes: 64 * 1024 },
  { relPath: 'docs/assets/smoke/sub_texture.jpg', maxBytes: 1024 * 1024 }
];

let failed = false;

function fail(message) {
  failed = true;
  console.error(`✗ ${message}`);
}

function pass(message) {
  console.log(`✓ ${message}`);
}

for (const item of checks) {
  const fullPath = join(root, item.relPath);
  if (!existsSync(fullPath)) {
    fail(`Missing required smoke asset: ${item.relPath}`);
    continue;
  }

  const { size } = statSync(fullPath);
  if (size <= 0) {
    fail(`Empty file: ${item.relPath}`);
    continue;
  }
  if (size > item.maxBytes) {
    fail(`Asset too large for smoke set (${item.relPath}, ${size} bytes > ${item.maxBytes})`);
    continue;
  }

  pass(`${item.relPath} exists (${size} bytes)`);
}

const objPath = join(root, 'docs/assets/smoke/sub.obj');
const mtlPath = join(root, 'docs/assets/smoke/sub.mtl');
const examplePath = join(root, 'docs/examples/08-obj-textured.html');

if (existsSync(objPath)) {
  const objText = readFileSync(objPath, 'utf-8');
  if (!/^\s*mtllib\s+sub\.mtl\s*$/m.test(objText)) {
    fail('sub.obj does not reference "sub.mtl" via mtllib');
  } else {
    pass('sub.obj references sub.mtl');
  }
}

if (existsSync(mtlPath)) {
  const mtlText = readFileSync(mtlPath, 'utf-8');
  if (!/^\s*map_Kd\s+sub_texture\.jpg\s*$/m.test(mtlText)) {
    fail('sub.mtl does not reference sub_texture.jpg via map_Kd');
  } else {
    pass('sub.mtl references sub_texture.jpg (map_Kd)');
  }
}

if (!existsSync(examplePath)) {
  fail('Missing demo page docs/examples/08-obj-textured.html');
} else {
  const exampleText = readFileSync(examplePath, 'utf-8');
  if (!exampleText.includes("new StaticBaseUrlResolver('../assets/smoke')")) {
    fail('OBJ demo page does not use the smoke asset resolver path');
  } else {
    pass('OBJ demo page uses smoke asset resolver path');
  }
  if (!exampleText.includes("file: 'sub.obj'")) {
    fail('OBJ demo page does not load sub.obj');
  } else {
    pass('OBJ demo page loads sub.obj');
  }
}

if (failed) {
  console.error('\nSmoke asset check failed.');
  process.exit(1);
}

console.log('\nAll smoke asset checks passed.');
