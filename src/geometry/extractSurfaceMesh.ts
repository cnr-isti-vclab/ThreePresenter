import * as THREE from 'three';

import type { SurfaceMeshInput } from './GeometryWorkerProtocol';

export interface ExtractedSurfaceMesh extends SurfaceMeshInput {
  meshCount: number;
  skippedMeshCount: number;
}

/** Flatten visible triangle meshes into one world-space geometry snapshot. */
export function extractSurfaceMesh(
  id: string,
  roots: readonly THREE.Object3D[],
): ExtractedSurfaceMesh {
  const positions: number[] = [];
  const indices: number[] = [];
  const vertex = new THREE.Vector3();
  let meshCount = 0;
  let skippedMeshCount = 0;

  for (const root of roots) {
    root.updateWorldMatrix(true, true);
    root.traverseVisible((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object instanceof THREE.InstancedMesh) {
        skippedMeshCount += 1;
        return;
      }

      const geometry = object.geometry;
      const position = geometry.getAttribute('position');
      const index = geometry.getIndex();
      const triangleIndexCount = index?.count ?? position?.count ?? 0;
      if (!position || position.itemSize < 3 || triangleIndexCount < 3 || triangleIndexCount % 3 !== 0) {
        skippedMeshCount += 1;
        return;
      }
      for (let indexOffset = 0; indexOffset < triangleIndexCount; indexOffset += 1) {
        const vertexIndex = index ? index.getX(indexOffset) : indexOffset;
        if (!Number.isInteger(vertexIndex) || vertexIndex < 0 || vertexIndex >= position.count) {
          skippedMeshCount += 1;
          return;
        }
      }

      const vertexOffset = positions.length / 3;
      for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex += 1) {
        object.getVertexPosition(vertexIndex, vertex).applyMatrix4(object.matrixWorld);
        positions.push(vertex.x, vertex.y, vertex.z);
      }
      for (let indexOffset = 0; indexOffset < triangleIndexCount; indexOffset += 1) {
        indices.push(vertexOffset + (index ? index.getX(indexOffset) : indexOffset));
      }
      meshCount += 1;
    });
  }

  return {
    id,
    positions: new Float64Array(positions),
    indices: new Uint32Array(indices),
    meshCount,
    skippedMeshCount,
  };
}
