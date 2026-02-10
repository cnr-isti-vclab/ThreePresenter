#!/usr/bin/env node

/**
 * Unified dev script: Watch + Build + Serve
 * Watches src/, rebuilds to docs/dist/, and serves with Vite
 */

import { spawn } from 'child_process';
import { watch } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let isBuilding = false;
let viteProcess = null;
let buildTimeout = null;

async function buildAndCopy() {
  if (isBuilding) {
    return;
  }

  isBuilding = true;
  console.log('\n🔨 Rebuilding library...');

  try {
    // Build library + copy to docs/dist + generate examples.json
    await execAsync('vite build && mkdir -p docs/dist && cp -r dist/* docs/dist/ && node scripts/generate-examples.js');
    console.log('✅ Build complete! Refresh browser.\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
  } finally {
    isBuilding = false;
  }
}

// Debounced build: wait 500ms after last change before building
function debouncedBuild() {
  if (buildTimeout) {
    clearTimeout(buildTimeout);
  }
  buildTimeout = setTimeout(() => {
    buildAndCopy();
  }, 500);
}

// Start Vite dev server
function startVite() {
  console.log('🚀 Starting Vite dev server...\n');
  viteProcess = spawn('npm', ['run', 'dev:vite'], { 
    stdio: 'inherit', 
    shell: true 
  });

  viteProcess.on('close', (code) => {
    console.log(`Vite exited with code ${code}`);
    process.exit(code);
  });
}

console.log('🎯 Unified Dev Mode');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('👀 Watching src/ for changes');
console.log('🔨 Auto-rebuilding to docs/dist/');
console.log('🌐 Serving with Vite dev server');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Initial build
buildAndCopy().then(() => {
  // Start Vite after initial build
  startVite();

  // Watch for changes (debounced to avoid build loops)
  const watcher = watch('./src', { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.ts')) {
      console.log(`📝 Changed: ${filename}`);
      debouncedBuild();
    }
  });

  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping dev server...');
    if (buildTimeout) clearTimeout(buildTimeout);
    watcher.close();
    if (viteProcess) viteProcess.kill('SIGINT');
    process.exit(0);
  });
});
