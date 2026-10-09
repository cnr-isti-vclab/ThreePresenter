export interface OcraGeometryModule {
  HEAPF64: Float64Array;
  HEAPU32: Uint32Array;
  _malloc(size: number): number;
  _free(pointer: number): void;
  _ocra_load_mesh(
    positions: number,
    vertexCount: number,
    indices: number,
    faceCount: number,
  ): number;
  _ocra_clear_mesh(): void;
  _ocra_compute_surface_path(
    sourceFace: number,
    sourceX: number,
    sourceY: number,
    sourceZ: number,
    targetFace: number,
    targetX: number,
    targetY: number,
    targetZ: number,
  ): number;
  _ocra_compute_surface_path_between_points(
    sourceX: number,
    sourceY: number,
    sourceZ: number,
    targetX: number,
    targetY: number,
    targetZ: number,
  ): number;
  _ocra_path_data(): number;
  _ocra_path_point_count(): number;
  _ocra_path_length(): number;
}

export interface OcraGeometryModuleOptions {
  locateFile?: (path: string) => string;
  wasmBinary?: Uint8Array;
}

export default function createOcraGeometryModule(
  options?: OcraGeometryModuleOptions,
): Promise<OcraGeometryModule>;
