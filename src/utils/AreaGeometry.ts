import * as THREE from 'three';

/**
 * Triangulate a boundary in the current authoring view.
 * The returned indices refer to the original 3D boundary vertices.
 */
export function triangulateProjectedBoundary(
  vertices: readonly THREE.Vector3[],
  project: (vertex: THREE.Vector3) => THREE.Vector3,
): number[] {
  if (vertices.length < 3) {
    return [];
  }

  const contour = vertices.map((vertex) => {
    const projected = project(vertex);
    return new THREE.Vector2(projected.x, projected.y);
  });

  return THREE.ShapeUtils.triangulateShape(contour, []).flat();
}

/**
 * Build the first area-fill prototype: the boundary triangles are mapped back
 * to their sampled 3D positions and depth-tested against the model.
 */
export function createProjectedAreaGeometry(
  vertices: readonly THREE.Vector3[],
  project: (vertex: THREE.Vector3) => THREE.Vector3,
): THREE.BufferGeometry | null {
  const indices = triangulateProjectedBoundary(vertices, project);
  if (indices.length === 0) {
    return null;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      vertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z]),
      3,
    ),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export interface ClipDepthRange {
  nearNdc: number;
  farNdc: number;
}

/**
 * Create a view-extruded volume whose projection is the supplied boundary.
 * The near/far planes use the active camera range unless a model-derived NDC
 * depth range is supplied by the presenter.
 */
export function createProjectedClipVolumeGeometry(
  vertices: readonly THREE.Vector3[],
  camera: THREE.Camera,
  depthRange?: ClipDepthRange | null,
): THREE.BufferGeometry | null {
  const projected = vertices.map((vertex) => vertex.clone().project(camera));
  const indices = triangulateProjectedBoundary(
    vertices,
    (vertex) => vertex.clone().project(camera),
  );
  if (
    indices.length === 0 ||
    projected.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))
  ) {
    return null;
  }

  const nearNdc = THREE.MathUtils.clamp(depthRange?.nearNdc ?? -1, -1, 1);
  const farNdc = THREE.MathUtils.clamp(depthRange?.farNdc ?? 1, -1, 1);
  if (nearNdc >= farNdc) {
    return null;
  }

  const nearVertices = projected.map((point) =>
    new THREE.Vector3(point.x, point.y, nearNdc).unproject(camera),
  );
  const farVertices = projected.map((point) =>
    new THREE.Vector3(point.x, point.y, farNdc).unproject(camera),
  );
  const positions = [...nearVertices, ...farVertices].flatMap((vertex) => [
    vertex.x,
    vertex.y,
    vertex.z,
  ]);
  const volumeIndices: number[] = [];
  const farOffset = vertices.length;

  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index];
    const b = indices[index + 1];
    const c = indices[index + 2];
    volumeIndices.push(a, b, c, farOffset + c, farOffset + b, farOffset + a);
  }

  for (let index = 0; index < vertices.length; index += 1) {
    const next = (index + 1) % vertices.length;
    volumeIndices.push(
      index,
      next,
      farOffset + next,
      index,
      farOffset + next,
      farOffset + index,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(volumeIndices);
  geometry.computeBoundingSphere();
  return geometry;
}
