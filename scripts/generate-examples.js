#!/usr/bin/env node

// Generates examples.json by reading each example HTML file in docs/examples/, extracting metadata, and saving the source code
// This allows the Vite dev server to serve examples with live source code display without needing a separate build step for the examples
// This file is called by the dev-unified.js script after building the library and copying to docs/dist/ to ensure examples.json is always up to date with the latest source code changes

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, '../docs/examples');

// Convert Markdown description to inline HTML (strip surrounding <p> tags)
function mdToHtml(md) {
  const html = marked.parseInline(md ?? '');
  return html;
}

const examples = [
  { id: '01-minimal', title: 'Minimal Setup', description: 'Simplest possible viewer, it just loads a 3D model with two **[UI controls](#)**: home button and light control' },
  { id: '02-all-controls', title: 'All UI Controls', description: 'Complete UI button set' },
  { id: '03-ply-material', title: 'PLY + Custom Material', description: 'Material overrides for PLY' },
  { id: '04-scale-indicator', title: 'Scale Indicator', description: 'Ground plane with scale bar' },
  { id: '05-nexus', title: 'Nexus Multiresolution', description: 'Progressive streaming NXZ' },
  { id: '06-iiif-manifest', title: 'IIIF-3D Manifest', description: 'Loads a scene from a **[IIIF Presentation API 4](https://iiif.io/api/3d/)** manifest using `parseIIIFManifest()`' },
  { id: '07-external-controls', title: 'External Controls', description: 'Two models loaded side-by-side, with external buttons that toggle each model\'s visibility independently' },
  { id: '08-obj-textured', title: 'OBJ + MTL + Texture', description: 'Loads an OBJ model with external **MTL** and texture files from the smoke asset set' },
  { id: '09-point-picking', title: 'Point Picking', description: 'Minimal picking workflow: enable picking mode and read picked 3D coordinates via `onPointPicked`' }
];

const examplesJson = examples.map(ex => {
  const file = `${ex.id}.html`;
  const source = readFileSync(join(examplesDir, file), 'utf-8');
  return { ...ex, descriptionHtml: mdToHtml(ex.description ?? ''), file, source };
});

writeFileSync(
  join(examplesDir, 'examples.json'),
  JSON.stringify({
    _comment: 'AUTO-GENERATED — do not edit. Source of truth is scripts/generate-examples.js',
    examples: examplesJson
  }, null, 2)
);

console.log('✓ Generated examples.json');
