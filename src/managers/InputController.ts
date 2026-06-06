import * as THREE from 'three';

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
  /** Called when user clicks on an annotation marker */
  onAnnotationClick: (object: THREE.Object3D, isMultiSelect: boolean) => void;
  /** Called when user clicks on empty space (background) */
  onBackgroundClick: (isMultiSelect: boolean) => void;
  /** Called when a selected point annotation enters drag edit mode */
  onAnnotationDragStart?: (object: THREE.Object3D) => boolean;
  /** Called while a point annotation is dragged across the model surface */
  onAnnotationDragMove?: (point: THREE.Vector3) => void;
  /** Called when a point annotation drag session ends */
  onAnnotationDragEnd?: () => void;
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
  private isPickingMode = false;
  private isMeasurementMode = false;
  private enabled = true;
  private pointerDownCandidate: { object: THREE.Object3D; clientX: number; clientY: number; pointerId: number } | null = null;
  private activeDragPointerId: number | null = null;
  private suppressNextClick = false;

  constructor(private config: InputControllerConfig) {
    this.handleResize = this.handleResize.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);

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
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    this.config.domElement.removeEventListener('dblclick', this.handleDoubleClick);
    this.config.domElement.removeEventListener('click', this.handleClick);
    this.config.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.config.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.config.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.config.domElement.removeEventListener('pointercancel', this.handlePointerUp);
  }

  setPickingMode(enabled: boolean) {
    this.isPickingMode = enabled;
    this.updateCursor();
  }

  setMeasurementMode(enabled: boolean) {
    this.isMeasurementMode = enabled;
    this.updateCursor();
  }

  isPickingEnabled(): boolean {
    return this.isPickingMode;
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
    this.config.domElement.style.cursor = (this.isPickingMode || this.isMeasurementMode) ? 'crosshair' : 'auto';
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
    const intersects = this.raycaster.intersectObjects(markers, false);
    return intersects.length > 0 ? intersects[0].object : null;
  }

  handleResize() {
    // Input controller currently doesn't need to do much on resize 
    // as it calculates mouse position relative to rect on every event.
  }

  handleDoubleClick(event: MouseEvent) {
    if (!this.enabled) return;
    if (this.isMeasurementMode || this.isPickingMode) return;

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
    const point = this.getModelIntersectionPoint();
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

    if (this.isPickingMode) {
      const point = this.getModelIntersectionPoint();
      if (point) {
        this.config.onModelClick?.(point);
      }
      return;
    }

    // Check Annotations
    const markers = this.config.getAnnotations();
    const intersects = this.raycaster.intersectObjects(markers, false);

    const isMulti = event.ctrlKey || event.metaKey;

    if (intersects.length > 0) {
      this.config.onAnnotationClick(intersects[0].object, isMulti);
    } else {
      this.config.onBackgroundClick(isMulti);
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (!this.enabled || this.isPickingMode || this.isMeasurementMode) return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return;
    }

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
    const hitObject = this.getAnnotationIntersectionObject();
    if (!hitObject) {
      return;
    }

    this.pointerDownCandidate = {
      object: hitObject,
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
    };
  }

  private handlePointerMove(event: PointerEvent) {
    if (!this.enabled) return;

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
      event.preventDefault();
      return;
    }

    if (!this.pointerDownCandidate || event.pointerId !== this.pointerDownCandidate.pointerId) {
      return;
    }

    const dx = event.clientX - this.pointerDownCandidate.clientX;
    const dy = event.clientY - this.pointerDownCandidate.clientY;
    if ((dx * dx + dy * dy) < 9) {
      return;
    }

    const started = this.config.onAnnotationDragStart?.(this.pointerDownCandidate.object) ?? false;
    if (!started) {
      this.pointerDownCandidate = null;
      return;
    }

    this.activeDragPointerId = event.pointerId;
    this.config.domElement.setPointerCapture(event.pointerId);
    this.pointerDownCandidate = null;
    this.suppressNextClick = true;

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
    const point = this.getModelIntersectionPoint();
    if (point) {
      this.config.onAnnotationDragMove?.(point);
    }
    event.preventDefault();
  }

  private handlePointerUp(event: PointerEvent) {
    if (this.activeDragPointerId !== null && event.pointerId === this.activeDragPointerId) {
      this.updateMouseCoordinates(event);
      this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
      const point = this.getModelIntersectionPoint();
      if (point) {
        this.config.onAnnotationDragMove?.(point);
      }
      this.config.onAnnotationDragEnd?.();
      if (this.config.domElement.hasPointerCapture(event.pointerId)) {
        this.config.domElement.releasePointerCapture(event.pointerId);
      }
      this.activeDragPointerId = null;
      this.pointerDownCandidate = null;
      this.suppressNextClick = true;
      event.preventDefault();
      return;
    }

    if (this.pointerDownCandidate && event.pointerId === this.pointerDownCandidate.pointerId) {
      this.pointerDownCandidate = null;
    }
  }
}
