/**
 * AnnotationManager - Independent annotation rendering and selection system
 * 
 * This module manages 3D annotation markers in a Three.js scene.
 * It handles rendering, selection, screen-space sizing, and picking mode.
 * 
 * Features:
 * - Render annotations as 3D spheres
 * - Multi-select support (Ctrl/Cmd + click)
 * - Screen-space consistent sizing (perspective & orthographic)
 * - Picking mode for creating new annotations
 * - Visual feedback for selection state
 * 
 * @example
 * ```typescript
 * const manager = new AnnotationManager(scene, {
 *   color: 0xffff00,
 *   selectedColor: 0xffff66,
 *   markerSize: 10
 * });
 * 
 * manager.render(annotations);
 * manager.select(['id1', 'id2'], false);
 * manager.onSelectionChange((ids) => console.log('Selected:', ids));
 * ```
 */

import * as THREE from 'three';
import type {
  Annotation,
  AnnotationConfig,
  SelectionChangeCallback,
  PointPickedCallback,
  AnnotationEditCallback,
} from '../types/AnnotationTypes';

/**
 * Default configuration for annotation rendering
 */
const DEFAULT_CONFIG: Required<AnnotationConfig> = {
  color: 0xffff00,           // Yellow
  selectedColor: 0xffff66,   // Brighter yellow
  opacity: 0.9,              // Slightly transparent
  selectedOpacity: 1.0,      // Fully opaque
  markerSize: 10,            // 10 pixels
  sphereSegments: 16,        // Good balance of quality/performance
  pointFillColor: 0x000000,
  pointStrokeColor: 0xffffff,
  selectedPointFillColor: 0xdbeafe,
  selectedPointStrokeColor: 0x1e3a8a,
  pointStrokeWidth: 6,
  pointShadowOpacity: 0.8,
};

const POINT_TEXTURE_SIZE = 128;
const POINT_TEXTURE_RADIUS = 24;

/**
 * AnnotationManager - Manages annotation markers in a Three.js scene
 */
export class AnnotationManager {
  private scene: THREE.Scene;
  private config: Required<AnnotationConfig>;
  
  // Annotation state
  private markers: Map<string, THREE.Object3D> = new Map();
  private annotations: Map<string, Annotation> = new Map();
  private selectedIds: Set<string> = new Set();
  private activePointEditId: string | null = null;
  
  // Callbacks
  private selectionCallbacks: SelectionChangeCallback[] = [];
  private pickCallback: PointPickedCallback | null = null;
  private editStartCallbacks: AnnotationEditCallback[] = [];
  private updateCallbacks: AnnotationEditCallback[] = [];
  
  /**
   * Create a new AnnotationManager
   * @param scene - The Three.js scene to add markers to
   * @param config - Optional configuration for appearance and behavior
   */
  constructor(scene: THREE.Scene, config: AnnotationConfig = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Render annotations in the scene
   * @param annotations - Array of annotations to render
   */
  render(annotations: Annotation[]): void {
    this.annotations = new Map(annotations.map((annotation) => [annotation.id, this.cloneAnnotation(annotation)]));
    // Remove markers that no longer exist
    const currentIds = new Set(annotations.map(a => a.id));
    for (const [id] of this.markers.entries()) {
      if (!currentIds.has(id)) {
        this.removeMarker(id);
      }
    }

    // Add or update markers
    annotations.forEach(annotation => {
      let marker = this.markers.get(annotation.id);
      const isSelected = this.selectedIds.has(annotation.id);
      
      if (marker && marker.userData.annotationType === annotation.type) {
        this.updateMarkerGeometry(marker, annotation);
        this.updateMarkerAppearance(marker, isSelected);
      } else {
        if (marker) {
          this.removeMarker(annotation.id);
        }
        marker = this.createMarker(annotation, isSelected);
        this.markers.set(annotation.id, marker);
        this.scene.add(marker);
      }
    });

    console.log(`🎯 AnnotationManager: Rendered ${annotations.length} annotation(s)`);
  }

  /**
   * Select one or more annotations
   * @param ids - Array of annotation IDs to select
   * @param additive - If true, add to selection; if false, replace selection
   */
  select(ids: string[], additive: boolean = false): void {
    if (!additive) {
      this.selectedIds.clear();
    }
    
    ids.forEach(id => this.selectedIds.add(id));
    this.updateAllMarkerAppearances();
    this.notifySelectionChange();
    
    console.log(`✅ AnnotationManager: Selected ${ids.length} annotation(s) (total: ${this.selectedIds.size})`);
  }

  /**
   * Toggle selection state of an annotation
   * @param id - Annotation ID to toggle
   */
  toggleSelection(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
      console.log(`❌ AnnotationManager: Deselected ${id}`);
    } else {
      this.selectedIds.add(id);
      console.log(`✅ AnnotationManager: Selected ${id}`);
    }
    
    this.updateAllMarkerAppearances();
    this.notifySelectionChange();
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    if (this.selectedIds.size > 0) {
      this.selectedIds.clear();
      this.updateAllMarkerAppearances();
      this.notifySelectionChange();
      console.log('🗑️ AnnotationManager: Cleared selection');
    }
  }

  /**
   * Get array of selected annotation IDs
   */
  getSelected(): string[] {
    return Array.from(this.selectedIds);
  }

  /**
   * Check if an annotation is selected
   */
  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  /**
   * Update marker scales for consistent screen-space size
   * Should be called in the render loop
   * @param camera - Current camera (perspective or orthographic)
   * @param canvasHeight - Height of the canvas in pixels
   */
  updateMarkerScales(camera: THREE.Camera, canvasHeight: number): void {
    const pixelSize = this.config.markerSize;
    
    for (const marker of this.markers.values()) {
      if (marker.userData.annotationType !== 'point') {
        continue;
      }
      let scale: number;
      
      if (camera instanceof THREE.PerspectiveCamera) {
        // Perspective: scale based on distance and FOV
        const distance = camera.position.distanceTo(marker.position);
        const fovRadians = camera.fov * Math.PI / 180;
        scale = distance * Math.tan(fovRadians / 2) * 2 * pixelSize / canvasHeight;
      } else if (camera instanceof THREE.OrthographicCamera) {
        // Orthographic: scale based on frustum size (no perspective)
        const visibleHeight = camera.top - camera.bottom;
        scale = visibleHeight * pixelSize / canvasHeight;
      } else {
        // Fallback for unknown camera types
        scale = 0.01;
      }

      if (marker instanceof THREE.Sprite) {
        const visibleDiameter = (POINT_TEXTURE_RADIUS * 2) + this.config.pointStrokeWidth;
        const spriteScaleMultiplier = (2 * POINT_TEXTURE_SIZE) / visibleDiameter;
        scale *= spriteScaleMultiplier;
        this.applyPointVisualOffset(marker, camera, scale);
      }

      marker.scale.set(scale, scale, scale);
    }
  }

  /**
   * Get the marker mesh for an annotation (for raycasting)
   */
  getMarker(id: string): THREE.Object3D | undefined {
    return this.markers.get(id);
  }

  /**
   * Get all marker meshes (for raycasting)
   */
  getAllMarkers(): THREE.Object3D[] {
    return Array.from(this.markers.values());
  }

  /**
   * Find annotation ID from a marker mesh
   */
  getAnnotationIdFromMarker(marker: THREE.Object3D): string | null {
    let current: THREE.Object3D | null = marker;
    while (current) {
      if (typeof current.userData.annotationId === 'string') {
        return current.userData.annotationId;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * Register a callback for selection changes
   * @param callback - Function to call when selection changes
   * @returns Unsubscribe function
   */
  onSelectionChange(callback: SelectionChangeCallback): () => void {
    this.selectionCallbacks.push(callback);
    return () => {
      const index = this.selectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.selectionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register a callback for annotation edit start.
   */
  onAnnotationEditStart(callback: AnnotationEditCallback): () => void {
    this.editStartCallbacks.push(callback);
    return () => {
      const index = this.editStartCallbacks.indexOf(callback);
      if (index > -1) {
        this.editStartCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register a callback for completed annotation geometry updates.
   */
  onAnnotationUpdated(callback: AnnotationEditCallback): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Enable picking mode for creating new annotations
   * @param callback - Function to call when a point is picked
   */
  enablePicking(callback: PointPickedCallback): void {
    this.pickCallback = callback;
    console.log('✏️ AnnotationManager: Picking mode enabled');
  }

  /**
   * Disable picking mode
   */
  disablePicking(): void {
    this.pickCallback = null;
    console.log('✏️ AnnotationManager: Picking mode disabled');
  }

  /**
   * Check if picking mode is active
   */
  isPickingMode(): boolean {
    return this.pickCallback !== null;
  }

  /**
   * Notify picking callback with a point
   * @param point - 3D point coordinates
   */
  notifyPointPicked(point: [number, number, number]): void {
    if (this.pickCallback) {
      this.pickCallback(point);
      console.log('📍 AnnotationManager: Point picked:', point);
    }
  }

  /**
   * Update configuration
   * @param config - Partial configuration to merge with current config
   */
  updateConfig(config: Partial<AnnotationConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateAllMarkerAppearances();
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<AnnotationConfig> {
    return { ...this.config };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Remove all markers from scene
    for (const [id] of this.markers.entries()) {
      this.removeMarker(id);
    }
    
    // Clear callbacks
    this.selectionCallbacks = [];
    this.pickCallback = null;
    this.editStartCallbacks = [];
    this.updateCallbacks = [];
    this.activePointEditId = null;
    
    console.log('🗑️ AnnotationManager: Disposed');
  }

  // ==================== Private Methods ====================

  /**
   * Returns true when a selected point annotation can enter drag editing.
   */
  canEditPointFromMarker(marker: THREE.Object3D): boolean {
    const annotationId = this.getAnnotationIdFromMarker(marker);
    if (!annotationId) {
      return false;
    }
    const annotation = this.annotations.get(annotationId);
    return Boolean(annotation && annotation.type === 'point' && this.selectedIds.has(annotationId));
  }

  /**
   * Start a point-drag editing session from a marker object.
   */
  beginPointEditFromMarker(marker: THREE.Object3D): boolean {
    const annotationId = this.getAnnotationIdFromMarker(marker);
    if (!annotationId) {
      return false;
    }
    const annotation = this.annotations.get(annotationId);
    if (!annotation || annotation.type !== 'point' || !this.selectedIds.has(annotationId)) {
      return false;
    }
    this.activePointEditId = annotationId;
    this.notifyAnnotationEditStart(annotation);
    return true;
  }

  /**
   * Move the point under edit.
   */
  moveActivePoint(point: [number, number, number]): void {
    if (!this.activePointEditId) {
      return;
    }
    const annotation = this.annotations.get(this.activePointEditId);
    if (!annotation || annotation.type !== 'point') {
      return;
    }
    annotation.geometry = [...point] as [number, number, number];
    const marker = this.markers.get(this.activePointEditId);
    if (marker) {
      this.updateMarkerGeometry(marker, annotation);
    }
  }

  /**
   * Finalise the current point edit session and emit update.
   */
  endPointEdit(): void {
    if (!this.activePointEditId) {
      return;
    }
    const annotation = this.annotations.get(this.activePointEditId);
    this.activePointEditId = null;
    if (!annotation) {
      return;
    }
    this.notifyAnnotationUpdated(annotation);
  }

  /**
   * Create a new renderable annotation object.
   */
  private createMarker(annotation: Annotation, isSelected: boolean): THREE.Object3D {
    switch (annotation.type) {
      case 'line':
        return this.createLineMarker(annotation, isSelected, false);
      case 'area':
        return this.createLineMarker(annotation, isSelected, true);
      case 'point':
      default:
        return this.createPointMarker(annotation, isSelected);
    }
  }

  /**
   * Create a new point marker mesh.
   */
  private createPointMarker(annotation: Annotation, isSelected: boolean): THREE.Sprite {
    const texture = this.createPointTexture(isSelected);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });

    const mesh = new THREE.Sprite(material);
    const point = annotation.geometry as [number, number, number];
    mesh.userData.annotationAnchor = new THREE.Vector3(point[0], point[1], point[2]);
    mesh.position.copy(mesh.userData.annotationAnchor);
    mesh.userData.annotationId = annotation.id;
    mesh.userData.annotationType = annotation.type;
    mesh.renderOrder = 10;

    return mesh;
  }

  /**
   * Create a line or polygon-outline marker.
   */
  private createLineMarker(
    annotation: Annotation,
    isSelected: boolean,
    closed: boolean
  ): THREE.Line {
    const vertices = this.toVertexVectors(annotation.geometry);
    const points = closed && vertices.length > 2
      ? [...vertices, vertices[0].clone()]
      : vertices;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: isSelected ? this.config.selectedColor : this.config.color,
      transparent: true,
      opacity: isSelected ? this.config.selectedOpacity : this.config.opacity,
      depthTest: true,
      depthWrite: false,
    });
    const line = new THREE.Line(geometry, material);
    line.userData.annotationId = annotation.id;
    line.userData.annotationType = annotation.type;
    return line;
  }

  /**
   * Update a marker's geometry without recreating it.
   */
  private updateMarkerGeometry(marker: THREE.Object3D, annotation: Annotation): void {
    if (annotation.type === 'point') {
      const point = annotation.geometry as [number, number, number];
      if (marker instanceof THREE.Sprite) {
        marker.userData.annotationAnchor = new THREE.Vector3(point[0], point[1], point[2]);
        marker.position.copy(marker.userData.annotationAnchor);
      } else {
        marker.position.set(point[0], point[1], point[2]);
      }
      return;
    }

    const line = marker as THREE.Line;
    const oldGeometry = line.geometry;
    const vertices = this.toVertexVectors(annotation.geometry);
    const points = annotation.type === 'area' && vertices.length > 2
      ? [...vertices, vertices[0].clone()]
      : vertices;
    line.geometry = new THREE.BufferGeometry().setFromPoints(points);
    oldGeometry.dispose();
  }

  /**
   * Update a marker's appearance based on selection state.
   */
  private updateMarkerAppearance(marker: THREE.Object3D, isSelected: boolean): void {
    if (marker instanceof THREE.Sprite) {
      const material = marker.material;
      material.map?.dispose();
      material.map = this.createPointTexture(isSelected);
      material.needsUpdate = true;
      return;
    }

    const color = isSelected ? this.config.selectedColor : this.config.color;
    const opacity = isSelected ? this.config.selectedOpacity : this.config.opacity;
    marker.traverse((child) => {
      const material = (child as THREE.Mesh | THREE.Line).material;
      if (!material) {
        return;
      }
      if (Array.isArray(material)) {
        material.forEach((entry) => this.applyMaterialAppearance(entry, color, opacity));
      } else {
        this.applyMaterialAppearance(material, color, opacity);
      }
    });
  }

  private applyMaterialAppearance(material: THREE.Material, color: number, opacity: number): void {
    const maybeColor = material as THREE.Material & { color?: THREE.Color; opacity?: number; transparent?: boolean };
    if (maybeColor.color) {
      maybeColor.color.setHex(color);
    }
    if (typeof maybeColor.opacity === 'number') {
      maybeColor.opacity = opacity;
    }
    if ('transparent' in maybeColor) {
      maybeColor.transparent = opacity < 1;
    }
  }

  /**
   * Update all markers' appearances based on current selection
   */
  private updateAllMarkerAppearances(): void {
    for (const [id, marker] of this.markers.entries()) {
      const isSelected = this.selectedIds.has(id);
      this.updateMarkerAppearance(marker, isSelected);
    }
  }

  /**
   * Remove a marker from the scene
   */
  private removeMarker(id: string): void {
    const marker = this.markers.get(id);
    if (marker) {
      this.scene.remove(marker);
      if (marker instanceof THREE.Sprite) {
        marker.material.map?.dispose();
        marker.material.dispose();
      }
      marker.traverse((child) => {
        const geometry = (child as THREE.Mesh | THREE.Line).geometry;
        if (geometry) {
          geometry.dispose();
        }
        const material = (child as THREE.Mesh | THREE.Line).material;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material?.dispose();
        }
      });
      this.markers.delete(id);
      this.annotations.delete(id);
    }
  }

  private createPointTexture(isSelected: boolean): THREE.CanvasTexture {
    const size = POINT_TEXTURE_SIZE;
    const center = size / 2;
    const radius = POINT_TEXTURE_RADIUS;
    const strokeWidth = this.config.pointStrokeWidth;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to create annotation point texture context');
    }

    context.clearRect(0, 0, size, size);
    context.shadowColor = `rgba(0,0,0,${this.config.pointShadowOpacity})`;
    context.shadowBlur = 10;
    context.shadowOffsetX = 1.5;
    context.shadowOffsetY = 1.5;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fillStyle = this.toCanvasColor(
      isSelected ? this.config.selectedPointFillColor : this.config.pointFillColor,
      isSelected ? 0.5 : 0.3,
    );
    context.fill();
    context.shadowColor = 'transparent';
    context.lineWidth = strokeWidth;
    context.strokeStyle = this.toCanvasColor(
      isSelected ? this.config.selectedPointStrokeColor : this.config.pointStrokeColor,
      1,
    );
    context.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private toCanvasColor(hex: number, alpha: number): string {
    const color = new THREE.Color(hex);
    return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha})`;
  }

  private cloneAnnotation(annotation: Annotation): Annotation {
    return {
      ...annotation,
      geometry: Array.isArray(annotation.geometry[0])
        ? (annotation.geometry as [number, number, number][]).map((point) => [...point] as [number, number, number])
        : ([...(annotation.geometry as [number, number, number])] as [number, number, number]),
      normal: annotation.normal ? [...annotation.normal] as [number, number, number] : undefined,
    };
  }

  private applyPointVisualOffset(
    marker: THREE.Sprite,
    camera: THREE.Camera,
    scale: number,
  ): void {
    const anchor = marker.userData.annotationAnchor as THREE.Vector3 | undefined;
    if (!anchor) {
      return;
    }

    const offsetDistance = scale * 0.18;
    if (camera instanceof THREE.PerspectiveCamera) {
      const directionToCamera = camera.position.clone().sub(anchor);
      if (directionToCamera.lengthSq() === 0) {
        marker.position.copy(anchor);
        return;
      }
      directionToCamera.normalize().multiplyScalar(offsetDistance);
      marker.position.copy(anchor).add(directionToCamera);
      return;
    }

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    marker.position.copy(anchor).add(forward.multiplyScalar(-offsetDistance));
  }

  private toVertexVectors(geometry: Annotation['geometry']): THREE.Vector3[] {
    if (!Array.isArray(geometry) || geometry.length === 0) {
      return [];
    }

    if (
      geometry.length === 3 &&
      typeof geometry[0] === 'number' &&
      typeof geometry[1] === 'number' &&
      typeof geometry[2] === 'number'
    ) {
      const point = geometry as [number, number, number];
      return [new THREE.Vector3(point[0], point[1], point[2])];
    }

    return (geometry as [number, number, number][])
      .map((point) => new THREE.Vector3(point[0], point[1], point[2]));
  }

  /**
   * Notify all selection change callbacks
   */
  private notifySelectionChange(): void {
    const selectedIds = this.getSelected();
    this.selectionCallbacks.forEach(callback => {
      try {
        callback(selectedIds);
      } catch (error) {
        console.error('Error in selection change callback:', error);
      }
    });
  }

  private notifyAnnotationEditStart(annotation: Annotation): void {
    const payload = this.cloneAnnotation(annotation);
    this.editStartCallbacks.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('Error in annotation edit start callback:', error);
      }
    });
  }

  private notifyAnnotationUpdated(annotation: Annotation): void {
    const payload = this.cloneAnnotation(annotation);
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('Error in annotation updated callback:', error);
      }
    });
  }
}
