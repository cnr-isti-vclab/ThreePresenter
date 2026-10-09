import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createGeometryCore,
  surfacePath,
  surfacePathBetweenPoints,
  loadMesh,
} from '../scripts/geometry-wasm-utils.mjs';

const positions = new Float64Array([
  0, 0, 0,
  1, 0, 0,
  1, 1, 0,
  0, 1, 0,
]);
const indices = new Uint32Array([
  0, 1, 2,
  0, 2, 3,
]);

test('computes an approximate path across adjacent triangles', async () => {
  const module = await createGeometryCore();
  assert.equal(loadMesh(module, positions, indices), 0);

  const source = [0.75, 0.25, 0];
  const target = [0.25, 0.75, 0];
  const path = surfacePath(module, 0, source, 1, target);

  assert.equal(path.result, 0);
  assert.ok(path.points.length >= 6);
  assert.deepEqual(Array.from(path.points.slice(0, 3)), source);
  assert.deepEqual(Array.from(path.points.slice(-3)), target);
  assert.ok(path.length >= Math.sqrt(0.5));
  assert.ok(path.length <= 2);
});

test('rejects a face outside the registered mesh', async () => {
  const module = await createGeometryCore();
  assert.equal(loadMesh(module, positions, indices), 0);
  assert.equal(surfacePath(module, 2, [0, 0, 0], 0, [0, 0, 0]).result, -2);
});

test('snaps arbitrary endpoints to the mesh before tracing', async () => {
  const module = await createGeometryCore();
  assert.equal(loadMesh(module, positions, indices), 0);

  const path = surfacePathBetweenPoints(module, [0.75, 0.25, 2], [0.25, 0.75, -3]);

  assert.equal(path.result, 0);
  assert.deepEqual(Array.from(path.points.slice(0, 3)), [0.75, 0.25, 0]);
  assert.deepEqual(Array.from(path.points.slice(-3)), [0.25, 0.75, 0]);
  assert.ok(path.length >= Math.sqrt(0.5));
  assert.ok(path.length <= 2);
});
