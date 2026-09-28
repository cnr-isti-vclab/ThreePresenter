import * as THREE from 'three';
import type { AnnotationCreationMode } from '../types/AnnotationTypes';

/**
 * Configuration for InputController initialization
 */
export interface InputControllerConfig {
  /** DOM element to attach input listeners to */
  domElement: HTMLElement;
  /** Callback to get current camera for raycasting */
  getCamera: () => THREE.Camera;
  /** Callback to get all selectable models in the scene */
  getModels: () => THREE.Object3D[];
  /** Callback to get all annotation markers in the scene */
  getAnnotations: () => THREE.Object3D[]; // Returns markers
  /** Called when user double-clicks on a 3D model */
  onModelDoubleClick: (point: THREE.Vector3) => void;
  /** Called when user single-clicks on a 3D model (used by modal tools like picking/measurement) */
  onModelClick?: (point: THREE.Vector3) => void;
  /** Called while a sequence annotation tool previews its next surface point */
  onAnnotationCreationPreview?: (point: THREE.Vector3 | null) => void;
  /** Called when a sequence annotation tool should commit its current draft */
  onAnnotationCreationComplete?: () => void;
  /** Called when a sequence annotation tool should discard its current draft */
  onAnnotationCreationCancel?: () => void;
  /** Called when user clicks on an annotation marker */
  onAnnotationClick: (object: THREE.Object3D, isMultiSelect: boolean) => void;
  /** Called when user clicks an editable line vertex handle */
  onAnnotationVertexSelect?: (object: THREE.Object3D, vertexIndex: number) => boolean;
  /** Called when user double-clicks an editable line segment */
  onAnnotationSegmentDoubleClick?: (
    object: THREE.Object3D,
    segmentIndex: number,
    point: THREE.Vector3,
  ) => boolean;
  /** Called when Delete or Backspace targets the selected line vertex */
  onAnnotationVertexDelete?: () => boolean;
  /** Called when user clicks on empty space (background) */
  onBackgroundClick: (isMultiSelect: boolean) => void;
  /** Returns true when the pointer-down target can start annotation dragging */
  canStartAnnotationDrag?: (object: THREE.Object3D, vertexIndex?: number) => boolean;
  /** Notifies when annotation drag should lock or unlock camera controls */
  onAnnotationDragLockChange?: (locked: boolean) => void;
  /** Called when a selected annotation or vertex enters drag edit mode */
  onAnnotationDragStart?: (object: THREE.Object3D, vertexIndex?: number) => boolean;
  /** Called while an annotation or vertex is dragged across the model surface */
  onAnnotationDragMove?: (point: THREE.Vector3) => void;
  /** Called when an annotation drag session ends */
  onAnnotationDragEnd?: () => void;
  /** Called when an annotation drag session is cancelled */
  onAnnotationDragCancel?: () => void;
}

interface AnnotationDragTarget {
  object: THREE.Object3D;
  vertexIndex?: number;
}

/**
 * InputController - Handles mouse/touch input and raycasting
 * 
 * This class provides a decoupled input handling system that:
 * - Performs raycasting against 3D models and annotations
 * - Detects clicks, double-clicks, and multi-select (Ctrl/Cmd + click)
 * - Manages picking mode (crosshair cursor for point selection)
 * - Handles window resizing for accurate picking
 * 
 * The controller communicates via callbacks, making it independent from
 * the main presenter and suitable for testing and custom implementations.
 * 
 * @example
 * ```typescript
 * const controller = new InputController({
 *   domElement: canvas,
 *   getCamera: () => camera,
 *   getModels: () => [model1, model2],
 *   getAnnotations: () => annotations.children,
 *   onModelDoubleClick: (point) => console.log('Clicked at', point),
 *   onAnnotationClick: (obj, isMulti) => handleAnnotationSelect(obj),
 *   onBackgroundClick: () => deselectAll()
 * });
 * 
 * // For creating new annotations via picking
 * controller.setPickingMode(true);
 * ```
 * 
 * @see {@link AnnotationManager} for annotation marker management
 * @see {@link ThreePresenter} for integration
 */
export class InputController {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private annotationCreationMode: AnnotationCreationMode = null;
  private isMeasurementMode = false;
  private enabled = true;
  private pointerDownCandidate: AnnotationDragTarget & {
    clientX: number;
    clientY: number;
    pointerId: number;
  } | null = null;
  private creationPointer: { pointerId: number; clientX: number; clientY: number; moved: boolean } | null = null;
  private activeDragPointerId: number | null = null;
  private suppressNextClick = false;
  private hoverCursor: string | null = null;

  constructor(private config: InputControllerConfig) {
    this.handleResize = this.handleResize.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.attachListeners();
  }

  private attachListeners() {
    window.addEventListener('resize', this.handleResize);
    this.config.domElement.addEventListener('dblclick', this.handleDoubleClick);
    this.config.domElement.addEventListener('click', this.handleClick);
    this.config.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.config.domElement.addEventListener('pointermove', this.handlePointerMove);
    this.config.domElement.addEventListener('pointerup', this.handlePointerUp);
    this.config.domElement.addEventListener('pointercancel', this.handlePointerUp);
    this.config.domElement.addEventListener('pointerleave', this.handlePointerLeave);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  dispose() {
    this.releaseCreationPointer();
    window.removeEventListener('resize', this.handleResize);
    this.config.domElement.removeEventListener('dblclick', this.handleDoubleClick);
    this.config.domElement.removeEventListener('click', this.handleClick);
    this.config.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.config.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.config.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.config.domElement.removeEventListener('pointercancel', this.handlePointerUp);
    this.config.domElement.removeEventListener('pointerleave', this.handlePointerLeave);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  setAnnotationCreationMode(mode: AnnotationCreationMode) {
    if (this.annotationCreationMode === 'line' && mode !== 'line') {
      this.releaseCreationPointer();
    }
    this.annotationCreationMode = mode;
    this.updateCursor();
  }

  getAnnotationCreationMode(): AnnotationCreationMode {
    return this.annotationCreationMode;
  }

  /** Backward-compatible point-picking mode wrapper. */
  setPickingMode(enabled: boolean) {
    if (enabled) {
      this.setAnnotationCreationMode('point');
    } else if (this.annotationCreationMode === 'point') {
      this.setAnnotationCreationMode(null);
    }
  }

  setMeasurementMode(enabled: boolean) {
    this.isMeasurementMode = enabled;
    this.updateCursor();
  }

  isPickingEnabled(): boolean {
    return this.annotationCreationMode === 'point';
  }

  isMeasurementEnabled(): boolean {
    return this.isMeasurementMode;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Helper to update mouse coordinates
   */
  private updateMouseCoordinates(event: MouseEvent) {
    const rect = this.config.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private updateCursor() {
    if (this.annotationCreationMode !== null || this.isMeasurementMode) {
      this.config.domElement.style.cursor = 'crosshair';
      return;
    }
    if (this.activeDragPointerId !== null) {
      this.config.domElement.style.cursor = 'grabbing';
      return;
    }
    this.config.domElement.style.cursor = this.hoverCursor ?? 'auto';
  }

  private getModelIntersectionPoint(): THREE.Vector3 | null {
    const models = this.config.getModels();
    const modelObjects: THREE.Object3D[] = [];

    models.forEach(model => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          modelObjects.push(child);
        }
      });
    });

    const intersects = this.raycaster.intersectObjects(modelObjects, false);
    return intersects.length > 0 ? intersects[0].point : null;
  }

  private getAnnotationIntersectionObject(): THREE.Object3D | null {
    const markers = this.config.getAnnotations();
    const intersects = this.raycaster.intersectObjects(markers, true);
    return intersects.length > 0 ? intersects[0].object : null;
  }

  private getAnnotationDragTarget(): AnnotationDragTarget | null {
    const handleTarget = this.getLineHandleAtPointer();
    if (
      handleTarget &&
      (this.config.canStartAnnotationDrag?.(handleTarget.object, handleTarget.vertexIndex) ?? false)
    ) {
      return handleTarget;
    }

    const markers = this.config.getAnnotations();
    const intersections = this.raycaster.intersectObjects(markers, true);
    for (const intersection of intersections) {
      const vertexIndex = Number.isInteger(intersection.object.userData.annotationVertexIndex)
        ? Number(intersection.object.userData.annotationVertexIndex)
        : intersection.index;
      if (this.config.canStartAnnotationDrag?.(intersection.object, vertexIndex) ?? false) {
        return { object: intersection.object, vertexIndex };
      }
    }
    return null;
  }

  private getLineHandleAtPointer(): AnnotationDragTarget | null {
    const camera = this.config.getCamera();
    const rect = this.config.domElement.getBoundingClientRect();
    const pointerX = (this.mouse.x + 1) * rect.width / 2;
    const pointerY = (1 - this.mouse.y) * rect.height / 2;
    let closestHandle: THREE.Sprite | null = null;
    let closestDistanceSquared = Infinity;

    for (const marker of this.config.getAnnotations()) {
      const descendants: THREE.Object3D[] = [];
      marker.traverse((child) => descendants.push(child));
      for (const child of descendants) {
        if (
          !(child instanceof THREE.Sprite) ||
          child.userData.annotationRole !== 'line-vertex-handle' ||
          !this.isObjectVisible(child)
        ) {
          continue;
        }

        const projected = child.getWorldPosition(new THREE.Vector3()).project(camera);
        if (projected.z < -1 || projected.z > 1) {
          continue;
        }
        const x = (projected.x + 1) * rect.width / 2;
        const y = (1 - projected.y) * rect.height / 2;
        const distanceSquared = (x - pointerX) ** 2 + (y - pointerY) ** 2;
        const hitRadius = Number(child.userData.annotationHitRadius ?? 9);
        if (distanceSquared <= hitRadius ** 2 && distanceSquared < closestDistanceSquared) {
          closestHandle = child;
          closestDistanceSquared = distanceSquared;
        }
      }
    }

    if (!closestHandle) {
      return null;
    }
    return {
      object: closestHandle,
      vertexIndex: Number(closestHandle.userData.annotationVertexIndex),
    };
  }

  private getLineSegmentAtPointer(): { object: THREE.Object3D; segmentIndex: number } | null {
    const intersections = this.raycaster.intersectObjects(this.config.getAnnotations(), true);
    for (const intersection of intersections) {
      if (
        intersection.object.userData.annotationRole === 'line-hit' &&
        Number.isInteger(intersection.faceIndex)
      ) {
        return {
          object: intersection.object,
          segmentIndex: Number(intersection.faceIndex),
        };
      }
    }
    return null;
  }

  private isObjectVisible(object: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = object;
    while (current) {
      if (!current.visible) {
        return false;
      }
      current = current.parent;
    }
    return true;
  }

  private updateHoverCursorFromEvent(event: MouseEvent | PointerEvent) {
    if (this.annotationCreationMode !== null || this.isMeasurementMode || this.activeDragPointerId !== null) {
      this.updateCursor();
      return;
    }

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
    const dragTarget = this.getAnnotationDragTarget();
    if (dragTarget) {
      this.hoverCursor = 'grab';
      this.updateCursor();
      return;
    }

    const hitObject = this.getAnnotationIntersectionObject();
    if (!hitObject) {
      this.hoverCursor = null;
      this.updateCursor();
      return;
    }

    this.hoverCursor = 'pointer';
    this.updateCursor();
  }

  handleResize() {
    // Input controller currently doesn't need to do much on resize 
    // as it calculates mouse position relative to rect on every event.
  }

  handleDoubleClick(event: MouseEvent) {
    if (!this.enabled) return;
    if (this.annotationCreationMode === 'line') {
      event.preventDefault();
      event.stopPropagation();
      this.config.onAnnotationCreationComplete?.();
      return;
    }
    if (this.isMeasurementMode || this.annotationCreationMode !== null) return;

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
    if (this.getLineHandleAtPointer()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const point = this.getModelIntersectionPoint();
    const segment = this.getLineSegmentAtPointer();
    if (
      point &&
      segment &&
      (this.config.onAnnotationSegmentDoubleClick?.(
        segment.object,
        segment.segmentIndex,
        point,
      ) ?? false)
    ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (point) {
      this.config.onModelDoubleClick(point);
    }
  }

  handleClick(event: MouseEvent) {
    if (!this.enabled) return;
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());

    // Measurement mode: pick points directly on models with single click
    if (this.isMeasurementMode) {
      const point = this.getModelIntersectionPoint();
      if (point) this.config.onModelClick?.(point);
      return;
    }

    if (this.annotationCreationMode !== null) {
      // Native dblclick dispatches a second click first. The first click places
      // the final vertex; ignore the second so it is not duplicated.
      if (event.detail > 1) {
        return;
      }
      const point = this.getModelIntersectionPoint();
      if (point) {
        this.config.onModelClick?.(point);
      }
      return;
    }

    // Check Annotations
    const handleTarget = this.getLineHandleAtPointer();
    if (
      handleTarget?.vertexIndex !== undefined &&
      (this.config.onAnnotationVertexSelect?.(
        handleTarget.object,
        handleTarget.vertexIndex,
      ) ?? false)
    ) {
      return;
    }

    const markers = this.config.getAnnotations();
    const intersects = this.raycaster.intersectObjects(markers, true);

    const isMulti = event.ctrlKey || event.metaKey;

    if (intersects.length > 0) {
      this.config.onAnnotationClick(intersects[0].object, isMulti);
    } else {
      this.config.onBackgroundClick(isMulti);
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (!this.enabled) return;
    if (this.annotationCreationMode === 'line') {
      if (event.button !== 0) {
        return;
      }
      this.creationPointer = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        moved: false,
      };
      this.config.domElement.setPointerCapture(event.pointerId);
      this.config.onAnnotationDragLockChange?.(true);
      return;
    }
    if (this.annotationCreationMode !== null || this.isMeasurementMode) return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return;
    }

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
    const dragTarget = this.getAnnotationDragTarget();
    if (!dragTarget) {
      return;
    }

    this.pointerDownCandidate = {
      ...dragTarget,
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
    };
    this.config.onAnnotationDragLockChange?.(true);
  }

  private handlePointerMove(event: PointerEvent) {
    if (!this.enabled) return;

    if (this.annotationCreationMode === 'line') {
      if (this.creationPointer?.pointerId === event.pointerId) {
        const dx = event.clientX - this.creationPointer.clientX;
        const dy = event.clientY - this.creationPointer.clientY;
        if ((dx * dx + dy * dy) >= 9) {
          this.creationPointer.moved = true;
        }
      }
      if (event.buttons === 0) {
        this.updateMouseCoordinates(event);
        this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
        this.config.onAnnotationCreationPreview?.(this.getModelIntersectionPoint());
      }
      this.updateCursor();
      return;
    }

    if (this.activeDragPointerId !== null) {
      if (event.pointerId !== this.activeDragPointerId) {
        return;
      }
      this.updateMouseCoordinates(event);
      this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
      const point = this.getModelIntersectionPoint();
      if (point) {
        this.config.onAnnotationDragMove?.(point);
      }
      this.hoverCursor = 'grabbing';
      this.updateCursor();
      event.preventDefault();
      return;
    }

    if (!this.pointerDownCandidate || event.pointerId !== this.pointerDownCandidate.pointerId) {
      this.updateHoverCursorFromEvent(event);
      return;
    }

    const dx = event.clientX - this.pointerDownCandidate.clientX;
    const dy = event.clientY - this.pointerDownCandidate.clientY;
    if ((dx * dx + dy * dy) < 9) {
      return;
    }

    const started = this.config.onAnnotationDragStart?.(
      this.pointerDownCandidate.object,
      this.pointerDownCandidate.vertexIndex,
    ) ?? false;
    if (!started) {
      this.pointerDownCandidate = null;
      this.config.onAnnotationDragLockChange?.(false);
      return;
    }

    this.activeDragPointerId = event.pointerId;
    this.config.domElement.setPointerCapture(event.pointerId);
    this.pointerDownCandidate = null;
    this.suppressNextClick = true;
    this.hoverCursor = 'grabbing';
    this.updateCursor();

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
    const point = this.getModelIntersectionPoint();
    if (point) {
      this.config.onAnnotationDragMove?.(point);
    }
    event.preventDefault();
  }

  private handlePointerUp(event: PointerEvent) {
    if (this.creationPointer?.pointerId === event.pointerId) {
      const moved = this.creationPointer.moved;
      this.releaseCreationPointer();
      if (moved) {
        this.suppressNextClick = true;
        event.preventDefault();
      }
      return;
    }

    if (this.activeDragPointerId !== null && event.pointerId === this.activeDragPointerId) {
      if (event.type === 'pointercancel') {
        this.config.onAnnotationDragCancel?.();
      } else {
        this.updateMouseCoordinates(event);
        this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
        const point = this.getModelIntersectionPoint();
        if (point) {
          this.config.onAnnotationDragMove?.(point);
        }
        this.config.onAnnotationDragEnd?.();
      }
      if (this.config.domElement.hasPointerCapture(event.pointerId)) {
        this.config.domElement.releasePointerCapture(event.pointerId);
      }
      this.activeDragPointerId = null;
      this.pointerDownCandidate = null;
      this.suppressNextClick = true;
      this.config.onAnnotationDragLockChange?.(false);
      this.updateHoverCursorFromEvent(event);
      event.preventDefault();
      return;
    }

    if (this.pointerDownCandidate && event.pointerId === this.pointerDownCandidate.pointerId) {
      this.pointerDownCandidate = null;
      this.config.onAnnotationDragLockChange?.(false);
      this.updateHoverCursorFromEvent(event);
    }
  }

  private handlePointerLeave() {
    if (this.annotationCreationMode !== null || this.isMeasurementMode || this.activeDragPointerId !== null) {
      if (this.annotationCreationMode === 'line') {
        this.config.onAnnotationCreationPreview?.(null);
      }
      return;
    }
    this.hoverCursor = null;
    this.updateCursor();
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.enabled) {
      return;
    }
    if (event.key === 'Escape' && this.activeDragPointerId !== null) {
      this.cancelActiveAnnotationDrag();
      event.preventDefault();
      return;
    }
    if (
      this.annotationCreationMode === null &&
      !this.isMeasurementMode &&
      this.activeDragPointerId === null &&
      (event.key === 'Delete' || event.key === 'Backspace') &&
      !this.isTextInputTarget(event.target) &&
      (this.config.onAnnotationVertexDelete?.() ?? false)
    ) {
      event.preventDefault();
      return;
    }
    if (this.annotationCreationMode !== 'line') {
      return;
    }
    if (event.key === 'Escape') {
      this.config.onAnnotationCreationCancel?.();
      event.preventDefault();
    } else if (event.key === 'Enter') {
      this.config.onAnnotationCreationComplete?.();
      event.preventDefault();
    }
  }

  private isTextInputTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  }

  private cancelActiveAnnotationDrag() {
    const pointerId = this.activeDragPointerId;
    if (pointerId === null) {
      return;
    }
    this.config.onAnnotationDragCancel?.();
    if (this.config.domElement.hasPointerCapture(pointerId)) {
      this.config.domElement.releasePointerCapture(pointerId);
    }
    this.activeDragPointerId = null;
    this.pointerDownCandidate = null;
    this.suppressNextClick = true;
    this.hoverCursor = null;
    this.config.onAnnotationDragLockChange?.(false);
    this.updateCursor();
  }

  private releaseCreationPointer() {
    if (!this.creationPointer) {
      return;
    }
    const pointerId = this.creationPointer.pointerId;
    this.creationPointer = null;
    if (this.config.domElement.hasPointerCapture(pointerId)) {
      this.config.domElement.releasePointerCapture(pointerId);
    }
    this.config.onAnnotationDragLockChange?.(false);
  }
}
