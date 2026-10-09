export interface SurfaceMeshInput {
  id: string;
  positions: Float32Array | Float64Array;
  indices: Uint16Array | Uint32Array;
}

export interface MeshSurfacePoint {
  faceIndex: number;
  position: [number, number, number];
}

export interface SurfacePath {
  points: Float64Array;
  length: number;
}

export type GeometryWorkerRequest =
  | {
      requestId: number;
      type: 'registerMesh';
      meshId: string;
      positions: Float64Array;
      indices: Uint32Array;
    }
  | {
      requestId: number;
      type: 'surfacePath';
      meshId: string;
      source: MeshSurfacePoint;
      target: MeshSurfacePoint;
    }
  | {
      requestId: number;
      type: 'surfacePathBetweenPoints';
      meshId: string;
      source: [number, number, number];
      target: [number, number, number];
    };

type WithoutRequestId<Request> = Request extends { requestId: number }
  ? Omit<Request, 'requestId'>
  : never;

export type GeometryWorkerRequestPayload = WithoutRequestId<GeometryWorkerRequest>;

export type GeometryWorkerResponse =
  | {
      requestId: number;
      ok: true;
      type: 'meshRegistered';
      vertexCount: number;
      faceCount: number;
    }
  | {
      requestId: number;
      ok: true;
      type: 'surfacePath';
      points: Float64Array;
      length: number;
    }
  | {
      requestId: number;
      ok: false;
      error: string;
    };

export type GeometryWorkerSuccessResponse = Extract<GeometryWorkerResponse, { ok: true }>;
