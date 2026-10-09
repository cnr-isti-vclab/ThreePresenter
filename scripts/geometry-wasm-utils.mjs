import { readFile } from 'node:fs/promises';

import createOcraGeometryModule from '../src/geometry/generated/ocra-geometry.js';

export async function createGeometryCore() {
  const wasmBinary = await readFile(new URL(
    '../src/geometry/generated/ocra-geometry.wasm',
    import.meta.url,
  ));
  return createOcraGeometryModule({ wasmBinary });
}

function copyToHeap(module, values) {
  const pointer = module._malloc(values.byteLength);
  if (!pointer) throw new Error(`Unable to allocate ${values.byteLength} bytes`);
  const heap = values instanceof Float64Array ? module.HEAPF64 : module.HEAPU32;
  heap.set(values, pointer / values.BYTES_PER_ELEMENT);
  return pointer;
}

export function loadMesh(module, positions, indices) {
  const vertices = positions instanceof Float64Array ? positions : new Float64Array(positions);
  const faces = indices instanceof Uint32Array ? indices : new Uint32Array(indices);
  const vertexPointer = copyToHeap(module, vertices);
  const facePointer = copyToHeap(module, faces);
  try {
    return module._ocra_load_mesh(
      vertexPointer,
      vertices.length / 3,
      facePointer,
      faces.length / 3,
    );
  } finally {
    module._free(vertexPointer);
    module._free(facePointer);
  }
}

export function surfacePath(module, sourceFace, source, targetFace, target) {
  const result = module._ocra_compute_surface_path(sourceFace, ...source, targetFace, ...target);
  return readPath(module, result);
}

export function surfacePathBetweenPoints(module, source, target) {
  const result = module._ocra_compute_surface_path_between_points(...source, ...target);
  return readPath(module, result);
}

function readPath(module, result) {
  if (result !== 0) return { result, length: 0, points: new Float64Array() };

  const pointCount = module._ocra_path_point_count();
  const begin = module._ocra_path_data() / Float64Array.BYTES_PER_ELEMENT;
  return {
    result,
    length: module._ocra_path_length(),
    points: module.HEAPF64.slice(begin, begin + pointCount * 3),
  };
}
