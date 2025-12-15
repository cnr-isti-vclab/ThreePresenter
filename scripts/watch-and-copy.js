#!/usr/bin/env node

/**
 * Watch mode: builds library and copies to docs/dist on every change
 * Usage: npm run dev:docs
 */

import { spawn } from 'child_process';
import { watch } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let isBuilding = false;

async function buildAndCopy() {
  if (isBuilding) {
    console.log('⏳ Build already in progress, skipping...');
    return;
  }

  isBuilding = true;
  console.log('\n🔨 Building library...');

  try {
    const { stdout, stderr } = await execAsync('npm run build:all');
    if (stderr && !stderr.includes('deprecated')) {
      console.error(stderr);
    }
    console.log('✅ Build complete! Refresh browser to see changes.\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
  } finally {
    isBuilding = false;
  }
}

console.log('👀 Watching src/ for changes...');
console.log('📂 Built files will be copied to docs/dist/');
console.log('🌐 Run "npm run serve" in another terminal to view at http://localhost:3000\n');

// Initial build
buildAndCopy();

// Watch for changes
const watcher = watch('./src', { recursive: true }, (eventType, filename) => {
  if (filename && (filename.endsWith('.ts') || filename.endsWith('.js'))) {
    console.log(`📝 Changed: ${filename}`);
    buildAndCopy();
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Stopping watch mode...');
  watcher.close();
  process.exit(0);
});
