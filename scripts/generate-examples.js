#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, '../docs/examples');

const examples = [
  { id: '01-minimal', title: 'Minimal Setup', description: 'Simplest possible viewer' },
  { id: '02-all-controls', title: 'All UI Controls', description: 'Complete UI button set' },
  { id: '03-ply-material', title: 'PLY + Custom Material', description: 'Material overrides for PLY' },
  { id: '04-scale-indicator', title: 'Scale Indicator', description: 'Ground plane with scale bar' }
];

const examplesJson = examples.map(ex => {
  const file = `${ex.id}.html`;
  const source = readFileSync(join(examplesDir, file), 'utf-8');
  return { ...ex, file, source };
});

writeFileSync(
  join(examplesDir, 'examples.json'),
  JSON.stringify(examplesJson, null, 2)
);

console.log('✓ Generated examples.json');
