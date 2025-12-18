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
    this.config.domElement.style.cursor = enabled ? 'crosshair' : 'auto';
  }

  isPickingEnabled(): boolean {
    return this.isPickingMode;
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

  handleResize() {
    // Input controller currently doesn't need to do much on resize 
    // as it calculates mouse position relative to rect on every event.
  }

  handleDoubleClick(event: MouseEvent) {
    if (!this.enabled) return;

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());

    // Raycast against models
    const models = this.config.getModels();
    const modelObjects: THREE.Object3D[] = [];
    
    // Flatten hierarchy for safety, or assume getModels returns roots and we interact with children?
    // ThreePresenter logic was:
    // Object.values(models).forEach(model => model.traverse(child => if Mesh push))
    // We should replicate that or expect the getter to do it?
    // Let's do it here for safety if getModels returns roots.
    models.forEach(model => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          modelObjects.push(child);
        }
      });
    });

    const intersects = this.raycaster.intersectObjects(modelObjects, false);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.config.onModelDoubleClick(point);
    }
  }

  handleClick(event: MouseEvent) {
    if (!this.enabled) return;
    
    // In picking mode, single clicks are ignored (waiting for double click) OR handled differently?
    // ThreePresenter ignored single clicks in picking mode.
    if (this.isPickingMode) return;

    this.updateMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, this.config.getCamera());

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
