#!/usr/bin/env node

// Generates examples.json by reading each example HTML file in docs/examples/, extracting metadata, and saving the source code
// This allows the Vite dev server to serve examples with live source code display without needing a separate build step for the examples
// This file is called by the dev-unified.js script after building the library and copying to docs/dist/ to ensure examples.json is always up to date with the latest source code changes

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, '../docs/examples');

const examples = [
  { id: '01-minimal', title: 'Minimal Setup', description: 'Simplest possible viewer' },
  { id: '02-all-controls', title: 'All UI Controls', description: 'Complete UI button set' },
  { id: '03-ply-material', title: 'PLY + Custom Material', description: 'Material overrides for PLY' },
  { id: '04-scale-indicator', title: 'Scale Indicator', description: 'Ground plane with scale bar' },
  { id: '05-nexus', title: 'Nexus Multiresolution', description: 'Progressive streaming NXZ' },
  { id: '06-iiif-manifest', title: 'IIIF-3D Manifest', description: 'Load from a IIIF Presentation API 4 manifest' }
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
