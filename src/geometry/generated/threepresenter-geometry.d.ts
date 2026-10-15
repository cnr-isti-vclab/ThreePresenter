export interface ThreePresenterGeometryModule {
  HEAPF64: Float64Array;
  HEAPU32: Uint32Array;
  _malloc(size: number): number;
  _free(pointer: number): void;
  _threepresenter_load_mesh(
    positions: number,
    vertexCount: number,
    indices: number,
    faceCount: number,
  ): number;
  _threepresenter_clear_mesh(): void;
  _threepresenter_compute_surface_path(
    sourceFace: number,
    sourceX: number,
    sourceY: number,
    sourceZ: number,
    targetFace: number,
    targetX: number,
    targetY: number,
    targetZ: number,
  ): number;
  _threepresenter_compute_surface_path_between_points(
    sourceX: number,
    sourceY: number,
    sourceZ: number,
    targetX: number,
    targetY: number,
    targetZ: number,
  ): number;
  _threepresenter_path_data(): number;
  _threepresenter_path_point_count(): number;
  _threepresenter_path_length(): number;
}

export interface ThreePresenterGeometryModuleOptions {
  locateFile?: (path: string) => string;
  wasmBinary?: Uint8Array;
}

export default function createThreePresenterGeometryModule(
  options?: ThreePresenterGeometryModuleOptions,
): Promise<ThreePresenterGeometryModule>;
