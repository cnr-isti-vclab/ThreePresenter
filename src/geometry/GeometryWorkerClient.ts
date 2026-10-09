/// <reference types="vite/client" />

import GeometryWorker from './geometry.worker?worker&inline';
import type {
  SurfacePath,
  GeometryWorkerRequest,
  GeometryWorkerRequestPayload,
  GeometryWorkerResponse,
  GeometryWorkerSuccessResponse,
  MeshSurfacePoint,
  SurfaceMeshInput,
} from './GeometryWorkerProtocol';

interface PendingRequest {
  resolve: (response: GeometryWorkerSuccessResponse) => void;
  reject: (error: Error) => void;
}

export class GeometryWorkerClient {
  private readonly worker: Worker;
  private readonly pending = new Map<number, PendingRequest>();
  private nextRequestId = 1;

  constructor(worker: Worker = new GeometryWorker()) {
    this.worker = worker;
    this.worker.onmessage = (event: MessageEvent<GeometryWorkerResponse>) => {
      const pending = this.pending.get(event.data.requestId);
      if (!pending) return;
      this.pending.delete(event.data.requestId);
      if (event.data.ok) {
        pending.resolve(event.data);
      } else {
        pending.reject(new Error(event.data.error));
      }
    };
    this.worker.onerror = (event) => {
      const error = new Error(event.message || 'Geometry worker failed');
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    };
  }

  async registerMesh(input: SurfaceMeshInput): Promise<{ vertexCount: number; faceCount: number }> {
    const positions = new Float64Array(input.positions);
    const indices = new Uint32Array(input.indices);
    const response = await this.send({
      type: 'registerMesh',
      meshId: input.id,
      positions,
      indices,
    }, [positions.buffer, indices.buffer]);
    if (response.type !== 'meshRegistered') {
      throw new Error(`Unexpected geometry worker response: ${response.type}`);
    }
    return { vertexCount: response.vertexCount, faceCount: response.faceCount };
  }

  async surfacePath(
    meshId: string,
    source: MeshSurfacePoint,
    target: MeshSurfacePoint,
  ): Promise<SurfacePath> {
    const response = await this.send({ type: 'surfacePath', meshId, source, target });
    if (response.type !== 'surfacePath') {
      throw new Error(`Unexpected geometry worker response: ${response.type}`);
    }
    return { points: response.points, length: response.length };
  }

  async surfacePathBetweenPoints(
    meshId: string,
    source: [number, number, number],
    target: [number, number, number],
  ): Promise<SurfacePath> {
    const response = await this.send({
      type: 'surfacePathBetweenPoints',
      meshId,
      source,
      target,
    });
    if (response.type !== 'surfacePath') {
      throw new Error(`Unexpected geometry worker response: ${response.type}`);
    }
    return { points: response.points, length: response.length };
  }

  dispose(): void {
    this.worker.terminate();
    const error = new Error('Geometry worker disposed');
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }

  private send(
    request: GeometryWorkerRequestPayload,
    transfer: Transferable[] = [],
  ): Promise<GeometryWorkerSuccessResponse> {
    const requestId = this.nextRequestId++;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.worker.postMessage({ ...request, requestId } as GeometryWorkerRequest, transfer);
    });
  }
}

export type {
  SurfacePath,
  MeshSurfacePoint,
  SurfaceMeshInput,
} from './GeometryWorkerProtocol';
