import assert from 'node:assert/strict';
import test from 'node:test';

import * as THREE from 'three';

import { extractSurfaceMesh } from '../dist/geometry.js';

test('extracts visible indexed and non-indexed meshes in world coordinates', () => {
  const root = new THREE.Group();
  root.position.set(10, 0, 0);

  const indexedGeometry = new THREE.BufferGeometry();
  indexedGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
  ], 3));
  indexedGeometry.setIndex([0, 1, 2]);
  const indexedMesh = new THREE.Mesh(indexedGeometry);
  indexedMesh.position.set(0, 2, 0);
  root.add(indexedMesh);

  const nonIndexedGeometry = new THREE.BufferGeometry();
  nonIndexedGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    0, 0, 1,
    0, 1, 0,
  ], 3));
  const nonIndexedMesh = new THREE.Mesh(nonIndexedGeometry);
  nonIndexedMesh.position.set(0, 0, 3);
  root.add(nonIndexedMesh);

  const hiddenMesh = new THREE.Mesh(indexedGeometry);
  hiddenMesh.visible = false;
  root.add(hiddenMesh);

  const result = extractSurfaceMesh('scene', [root]);

  assert.equal(result.meshCount, 2);
  assert.equal(result.skippedMeshCount, 0);
  assert.deepEqual(Array.from(result.indices), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(Array.from(result.positions), [
    10, 2, 0,
    11, 2, 0,
    10, 3, 0,
    10, 0, 3,
    10, 0, 4,
    10, 1, 3,
  ]);
});

test('reports unsupported instanced meshes instead of extracting incorrect geometry', () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
  ], 3));
  const instances = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial(), 2);

  const result = extractSurfaceMesh('scene', [instances]);

  assert.equal(result.meshCount, 0);
  assert.equal(result.skippedMeshCount, 1);
  assert.equal(result.indices.length, 0);
});

test('skips meshes with invalid triangle indices', () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
  ], 3));
  geometry.setIndex([0, 1, 4]);

  const result = extractSurfaceMesh('scene', [new THREE.Mesh(geometry)]);

  assert.equal(result.meshCount, 0);
  assert.equal(result.skippedMeshCount, 1);
});
