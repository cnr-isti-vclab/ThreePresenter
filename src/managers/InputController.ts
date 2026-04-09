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
  /** Called when user single-clicks on a 3D model (used by modal tools like measurement) */
  onModelClick?: (point: THREE.Vector3) => void;
  /** Called when user clicks on an annotation marker */
  onAnnotationClick: (object: THREE.Object3D, isMultiSelect: boolean) => void;
  /** Called when user clicks on empty space (background) */
  onBackgroundClick: (isMultiSelect: boolean) => void;
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

  constructor(private config: InputControllerConfig) {
    this.handleResize = this.handleResize.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.attachListeners();
  }

  private attachListeners() {
    window.addEventListener('resize', this.handleResize);
    this.config.domElement.addEventListener('dblclick', this.handleDoubleClick);
    this.config.domElement.addEventListener('click', this.handleClick);
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    this.config.domElement.removeEventListener('dblclick', this.handleDoubleClick);
    this.config.domElement.removeEventListener('click', this.handleClick);
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

  handleResize() {
    // Input controller currently doesn't need to do much on resize 
    // as it calculates mouse position relative to rect on every event.
  }

  handleDoubleClick(event: MouseEvent) {
    if (!this.enabled) return;
    if (this.isMeasurementMode) return; // measurement uses single click picks

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());
    const point = this.getModelIntersectionPoint();
    if (point) {
      this.config.onModelDoubleClick(point);
    }
  }

  handleClick(event: MouseEvent) {
    if (!this.enabled) return;

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());

    // Measurement mode: pick points directly on models with single click
    if (this.isMeasurementMode) {
      const point = this.getModelIntersectionPoint();
      if (point) this.config.onModelClick?.(point);
      return;
    }

    // Annotation picking mode uses double-click on model points only
    if (this.isPickingMode) return;

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
}
