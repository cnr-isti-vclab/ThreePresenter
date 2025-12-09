#!/usr/bin/env node

// Dev runner: starts the watch-and-copy builder and the static server together
// Usage: npm run dev:live

const { spawn } = require('child_process');

function run(cmd, args, name) {
  const ps = spawn(cmd, args, { stdio: ['inherit', 'pipe', 'pipe'], shell: true });
  ps.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`));
  ps.stderr.on('data', d => process.stderr.write(`[${name} ERROR] ${d}`));
  ps.on('close', code => {
    console.log(`[${name}] exited with ${code}`);
  });
  return ps;
}

console.log('Starting dev runner: watch-and-copy + static server');

// Start watcher (build and copy)
const watcher = run('npm', ['run', 'dev:docs'], 'watch');

// Start static server (http-server) serving docs
const server = run('npx', ['http-server', 'docs', '-p', '3000', '--silent'], 'http-server');

// Forward SIGINT to children
process.on('SIGINT', () => {
  console.log('\nStopping dev runner...');
  watcher.kill('SIGINT');
  server.kill('SIGINT');
  process.exit(0);
});
