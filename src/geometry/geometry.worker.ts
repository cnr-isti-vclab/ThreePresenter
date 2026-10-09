/// <reference lib="webworker" />

import createOcraGeometryModule from './generated/ocra-geometry.js';
import type { OcraGeometryModule } from './generated/ocra-geometry.js';
import type {
  GeometryWorkerRequest,
  GeometryWorkerResponse,
} from './GeometryWorkerProtocol';

const wasmUrl = new URL('./generated/ocra-geometry.wasm', import.meta.url).href;
const modulePromise = loadWasmBinary(wasmUrl)
  .then((wasmBinary) => createOcraGeometryModule({ wasmBinary }));
let activeMeshId: string | null = null;

async function loadWasmBinary(url: string): Promise<Uint8Array> {
  if (url.startsWith('data:')) {
    const separator = url.indexOf(',');
    const metadata = url.slice(0, separator);
    const encoded = url.slice(separator + 1);
    const binary = metadata.endsWith(';base64') ? atob(encoded) : decodeURIComponent(encoded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load geometry-core WASM: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function checkResult(code: number, operation: string): void {
  if (code !== 0) {
    throw new Error(`${operation} failed with geometry-core error ${code}`);
  }
}

function withHeapArray<T extends Float64Array | Uint32Array>(
  module: OcraGeometryModule,
  value: T,
  callback: (pointer: number) => void,
): void {
  const pointer = module._malloc(value.byteLength);
  if (!pointer) {
    throw new Error(`Unable to allocate ${value.byteLength} bytes in geometry-core`);
  }
  try {
    const heap = value instanceof Float64Array ? module.HEAPF64 : module.HEAPU32;
    heap.set(value, pointer / value.BYTES_PER_ELEMENT);
    callback(pointer);
  } finally {
    module._free(pointer);
  }
}

async function handleRequest(request: GeometryWorkerRequest): Promise<GeometryWorkerResponse> {
  const module = await modulePromise;
  if (request.type === 'registerMesh') {
    if (request.positions.length % 3 !== 0 || request.indices.length % 3 !== 0) {
      throw new Error('Mesh positions and indices must describe triangles');
    }
    let result = -1;
    withHeapArray(module, request.positions, (positionPointer) => {
      withHeapArray(module, request.indices, (indexPointer) => {
        result = module._ocra_load_mesh(
          positionPointer,
          request.positions.length / 3,
          indexPointer,
          request.indices.length / 3,
        );
      });
    });
    checkResult(result, 'Mesh registration');
    activeMeshId = request.meshId;
    return {
      requestId: request.requestId,
      ok: true,
      type: 'meshRegistered',
      vertexCount: request.positions.length / 3,
      faceCount: request.indices.length / 3,
    };
  }

  if (activeMeshId !== request.meshId) {
    throw new Error(`Mesh ${request.meshId} is not registered in the geometry worker`);
  }
  const result = request.type === 'surfacePath'
    ? module._ocra_compute_surface_path(
      request.source.faceIndex,
      ...request.source.position,
      request.target.faceIndex,
      ...request.target.position,
    )
    : module._ocra_compute_surface_path_between_points(
      ...request.source,
      ...request.target,
    );
  checkResult(result, 'Surface path');
  const pointCount = module._ocra_path_point_count();
  const pointer = module._ocra_path_data();
  const points = new Float64Array(pointCount * 3);
  points.set(module.HEAPF64.subarray(pointer / 8, pointer / 8 + points.length));
  return {
    requestId: request.requestId,
    ok: true,
    type: 'surfacePath',
    points,
    length: module._ocra_path_length(),
  };
}

self.onmessage = (event: MessageEvent<GeometryWorkerRequest>) => {
  void handleRequest(event.data)
    .then((response) => {
      self.postMessage(response);
    })
    .catch((error: unknown) => {
      const response: GeometryWorkerResponse = {
        requestId: event.data.requestId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      self.postMessage(response);
    });
};
