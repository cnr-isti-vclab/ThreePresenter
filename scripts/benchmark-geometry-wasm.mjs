import { performance } from 'node:perf_hooks';

import {
  createGeometryCore,
  surfacePathBetweenPoints,
  loadMesh,
} from './geometry-wasm-utils.mjs';

const resolution = Math.max(2, Number.parseInt(process.argv[2] ?? '50', 10));
const positions = new Float64Array((resolution + 1) ** 2 * 3);
const indices = new Uint32Array(resolution * resolution * 6);

for (let y = 0; y <= resolution; y += 1) {
  for (let x = 0; x <= resolution; x += 1) {
    const offset = (y * (resolution + 1) + x) * 3;
    positions[offset] = x / resolution;
    positions[offset + 1] = y / resolution;
  }
}

let index = 0;
for (let y = 0; y < resolution; y += 1) {
  for (let x = 0; x < resolution; x += 1) {
    const lowerLeft = y * (resolution + 1) + x;
    const lowerRight = lowerLeft + 1;
    const upperLeft = lowerLeft + resolution + 1;
    const upperRight = upperLeft + 1;
    indices.set([lowerLeft, lowerRight, upperRight, lowerLeft, upperRight, upperLeft], index);
    index += 6;
  }
}

const wasmInitStarted = performance.now();
const module = await createGeometryCore();
const wasmInitMilliseconds = performance.now() - wasmInitStarted;
const loadStarted = performance.now();
const loadResult = loadMesh(module, positions, indices);
const meshInitMilliseconds = performance.now() - loadStarted;
if (loadResult !== 0) throw new Error(`Mesh registration failed with ${loadResult}`);

const pathStarted = performance.now();
const path = surfacePathBetweenPoints(
  module,
  [0.75 / resolution, 0.25 / resolution, 0],
  [1 - 0.75 / resolution, 1 - 0.25 / resolution, 0],
);
const pathMilliseconds = performance.now() - pathStarted;
if (path.result !== 0) throw new Error(`Path computation failed with ${path.result}`);

console.log(JSON.stringify({
  resolution,
  vertices: positions.length / 3,
  faces: indices.length / 3,
  pathPoints: path.points.length / 3,
  pathLength: path.length,
  wasmInitMilliseconds,
  meshInitMilliseconds,
  pathMilliseconds,
}, null, 2));
