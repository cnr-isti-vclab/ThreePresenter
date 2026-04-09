import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { AnnotationManager } from './managers/AnnotationManager';
import { MeasurementManager, type MeasurementRecord } from './managers/MeasurementManager';
import type { FileUrlResolver } from './types/FileUrlResolver';
import { StaticBaseUrlResolver } from './types/FileUrlResolver';
import { calculateObjectStats, type GeometryStats } from './utils/GeometryUtils';
import { ScaleIndicator } from './utils/ScaleIndicator';

import { CameraManager } from './managers/CameraManager';
import { LightingManager } from './managers/LightingManager';
import { ModelLoader } from './managers/ModelLoader';
import { InputController } from './managers/InputController';
import { RenderLoop } from './managers/RenderLoop';
// Note: heavy three/examples and viewport gizmo are dynamically imported where needed
import type {
  SceneDescription,
  ModelDefinition,
  PresenterState
} from './types/SceneTypes';

export type { SceneDescription, ModelDefinition, PresenterState };
export { AnnotationManager };
export type { MeasurementRecord };

/**
 * Configuration options for ThreePresenter
 */
export interface ThreePresenterConfig {
  /** The container element or its ID */
  mount: HTMLDivElement | string;
  /** Optional file URL resolver */
  fileUrlResolver?: FileUrlResolver;
  /** Optional dependency injection for managers */
  managers?: {
    modelLoader?: ModelLoader;
    lightingManager?: LightingManager;
    cameraManager?: CameraManager;
    measurementManager?: MeasurementManager;
    renderLoop?: RenderLoop;
    // InputController and AnnotationManager are tightly coupled to the scene/renderer currently
  };
}

/**
 * Progress information for model loading
 */
export interface LoadingProgress {
  modelId: string;
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: 'loading' | 'parsing' | 'complete' | 'error';
}

/**
 * ThreePresenter - Main 3D Scene Presenter Component
 * 
 * Manages the complete 3D viewing experience including model loading, rendering,
 * camera controls, lighting, and user interactions.
 * 
 * @description
 * This class is responsible for:
 * - Loading and displaying 3D models from scene.json configuration
 * - Managing Three.js scene, camera, renderer, and controls
 * - Providing UI controls (visibility, lighting, camera reset, screenshots)
 * - Handling model transformations (position, rotation, scale)
 * - Supporting multiple 3D file formats (GLB, PLY, OBJ, etc.)
 * - Auto-centering and normalizing model sizes
 * 
 * @example
 * ```typescript
 * const presenter = new ThreePresenter(mountElement);
 * await presenter.loadScene(sceneDescription);
 * presenter.setModelVisibility('model_id', false);
 * ```
 * 
 * @see {@link https://cnr-isti-vclab.github.io/ThreePresenter/ | ThreePresenter Homepage}
 * @see {@link https://github.com/cnr-isti-vclab/ThreePresenter | GitHub Repository}
 */
export class ThreePresenter {
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  orthographicCamera: THREE.OrthographicCamera | null = null;
  perspectiveCamera: THREE.PerspectiveCamera;
  isOrthographic: boolean = false;
  controls: any;
  /**
   * Map of loaded runtime 3D objects, keyed by their model ID.
   * 
   * These are the actual {@link THREE.Object3D} instances in the scene.
   * Their initial state (visibility, position, etc.) is derived from the {@link ModelDefinition} configuration.
   */
  models: Record<string, THREE.Object3D> = {};  // Changed from meshes
  private bboxHelpers: Record<string, THREE.BoxHelper> = {};
  currentScene: SceneDescription | null = null;
  mount: HTMLDivElement;
  ground: THREE.GridHelper | null = null;
  scaleIndicator: ScaleIndicator | null = null;
  viewportGizmo: any = null;
  isPickingMode: boolean = false;
  isMeasurementMode: boolean = false;
  onPointPicked: ((point: [number, number, number]) => void) | null = null;
  onMeasurementCreated?: (measurement: MeasurementRecord) => void;
  // State change callbacks
  onLightChange?: (enabled: boolean) => void;
  onEnvChange?: (enabled: boolean) => void;
  onPickingModeChange?: (enabled: boolean) => void;
  onMeasurementModeChange?: (enabled: boolean) => void;
  onCameraModeChange?: (isOrthographic: boolean) => void;
  initialCameraPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 2);
  initialControlsTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  lightEnabled: boolean = true;
  modelStats: Record<string, GeometryStats> = {};
  sceneBBoxSize: THREE.Vector3 = new THREE.Vector3(2, 2, 2); // Store actual scene size for ground

  // File URL resolver for loading models
  private fileUrlResolver: FileUrlResolver;

  // Loading progress callbacks
  onLoadProgress?: (progress: LoadingProgress) => void;
  onLoadComplete?: (modelId: string) => void;
  onLoadError?: (modelId: string, error: Error) => void;

  // Managers
  private annotationManager: AnnotationManager;
  private measurementManager: MeasurementManager;
  private cameraManager: CameraManager;
  private lightingManager: LightingManager;
  private modelLoader: ModelLoader;
  private inputController: InputController;
  private renderLoop: RenderLoop;

  constructor(configOrMount: ThreePresenterConfig | string, fileUrlResolver?: FileUrlResolver) {
    let config: ThreePresenterConfig;

    // Handle legacy constructor signature: (mount, resolver)
    if (typeof configOrMount === 'string' || configOrMount instanceof HTMLDivElement) {
      config = {
        mount: configOrMount,
        fileUrlResolver: fileUrlResolver
      };
    } else {
      config = configOrMount;
    }

    // Support both element and element ID
    if (typeof config.mount === 'string') {
      const element = document.getElementById(config.mount);
      if (!element) {
        throw new Error(`Element with ID "${config.mount}" not found`);
      }
      this.mount = element as HTMLDivElement;
    } else {
      this.mount = config.mount;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x404040);
    const widthPx = this.mount.clientWidth;
    const heightPx = this.mount.clientHeight;
    const aspect = widthPx / heightPx;

    // Initialize file URL resolver
    this.fileUrlResolver = config.fileUrlResolver || new StaticBaseUrlResolver('./assets');

    // Initialize managers (use injected or create new)
    const managers = config.managers || {};

    // Camera Manager
    this.cameraManager = managers.cameraManager || new CameraManager(aspect, {
      fov: 40,
      near: 0.1,
      far: 1000,
      frustumSize: 2,
      initialPosition: new THREE.Vector3(0, 0, 2),
      initialTarget: new THREE.Vector3(0, 0, 0)
    });

    // Get cameras from manager
    this.perspectiveCamera = this.cameraManager.getPerspectiveCamera();
    this.orthographicCamera = this.cameraManager.getOrthographicCamera();
    this.camera = this.cameraManager.getActiveCamera();

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(widthPx, heightPx);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    if (getComputedStyle(this.mount).position === 'static') {
      this.mount.style.position = 'relative';
    }
    this.mount.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(widthPx, heightPx);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.labelRenderer.domElement.style.zIndex = '10';
    this.mount.appendChild(this.labelRenderer.domElement);

    // Filter out injected managers for initialization of other managers if needed

    // Lighting Manager (envMapIntensity not supported in config, handled by Presenter's loadEnvironmentMap)
    this.lightingManager = managers.lightingManager || new LightingManager(this.scene, {
      ambientIntensity: 0.2,
      headLightIntensity: 0.8
    });
    this.lightEnabled = this.lightingManager.isHeadLightEnabled();

    // Model Loader - ThreePresenter handles URL resolution, so Loader doesn't need resolver
    // We pass renderer to loader (optional, for decoding setup optionally)
    this.modelLoader = managers.modelLoader || new ModelLoader({
      dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
      autoComputeNormals: true
    }, this.renderer);

    // Initialize annotation manager (internal)
    // AnnotationManager takes (scene, config)
    this.annotationManager = new AnnotationManager(this.scene, {
      color: 0xffff00,
      selectedColor: 0xffff66,
      markerSize: 10
    });
    this.measurementManager = managers.measurementManager || new MeasurementManager(this.scene, {
      unit: 'units',
      precision: 3,
      lineColor: 0x00e0ff,
      pointColor: 0x00e0ff,
      pointRadius: 0.01
    });

    // Load environment map
    this.loadEnvironmentMap();

    // Input Controller setup
    this.inputController = new InputController({
      domElement: this.renderer.domElement,
      getCamera: () => this.camera,
      getModels: () => Object.values(this.models),
      getAnnotations: () => this.annotationManager.getAllMarkers(),
      onModelDoubleClick: (point: THREE.Vector3) => {
        if (this.isPickingMode) {
          const coords: [number, number, number] = [point.x, point.y, point.z];
          console.log('📍 Picked 3D point:', coords.map(v => v.toFixed(4)));
          this.onPointPicked?.(coords);
          this.exitPickingMode();
        } else {
          console.log('🎯 Recentering camera on point:', point);
          this.animateCameraTarget(point);
        }
      },
      onModelClick: (point: THREE.Vector3) => {
        if (!this.isMeasurementMode) return;
        const measurement = this.measurementManager.addPoint(point);
        if (measurement) {
          console.log(`📏 Measurement created: ${measurement.label}`);
          this.onMeasurementCreated?.(measurement);
        }
      },
      onAnnotationClick: (object, isMulti) => {
        const id = this.annotationManager.getAnnotationIdFromMarker(object as THREE.Mesh);
        if (id) {
          if (isMulti) this.annotationManager.toggleSelection(id);
          else this.annotationManager.select([id], false);
        }
      },
      onBackgroundClick: (isMulti) => {
        if (!isMulti) this.annotationManager.clearSelection();
      }
    });

    // Render Loop setup
    this.renderLoop = managers.renderLoop || new RenderLoop();
    this.renderLoop.addCallback(() => this.renderFrame());
    this.renderLoop.start();

    // Resize handler
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);

    // Dispose managers
    this.renderLoop.dispose();
    this.inputController.dispose();
    this.annotationManager.dispose();
    this.measurementManager.dispose();
    this.lightingManager.dispose();
    this.modelLoader.dispose();

    // Clean up scale indicator
    this.removeScaleIndicator();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.labelRenderer && this.labelRenderer.domElement.parentNode) {
      this.labelRenderer.domElement.parentNode.removeChild(this.labelRenderer.domElement);
    }

    if (this.viewportGizmo && this.viewportGizmo.dispose) {
      this.viewportGizmo.dispose();
      this.viewportGizmo = null;
    }
  }

  handleResize() {
    const w = this.mount.clientWidth;
    const h = this.mount.clientHeight;

    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);

    // Use camera manager to handle resize for both cameras
    this.cameraManager.handleResize(w, h);

    // Update camera reference
    this.camera = this.cameraManager.getActiveCamera();

    if (this.controls) this.controls.update();
    if (this.viewportGizmo) this.viewportGizmo.update();
  }



  /**
   * Toggle picking mode for annotation placement
   */
  togglePickingMode() {
    if (this.isPickingMode) {
      this.exitPickingMode();
    } else {
      this.enterPickingMode();
    }
  }

  /**
   * Enter picking mode
   */
  private enterPickingMode() {
    if (this.isMeasurementMode) this.exitMeasurementMode();
    this.isPickingMode = true;
    this.inputController.setPickingMode(true);
    this.inputController.setMeasurementMode(false);
    this.onPickingModeChange?.(true);
    console.log('✏️ Entered picking mode - double-click on model to pick a point');
  }

  /**
   * Exit picking mode
   */
  private exitPickingMode() {
    this.isPickingMode = false;
    this.inputController.setPickingMode(false);
    this.onPickingModeChange?.(false);
    console.log('✅ Exited picking mode');
  }

  /**
   * Toggle measurement mode (two-click distance tool)
   */
  toggleMeasurementMode() {
    if (this.isMeasurementMode) {
      this.exitMeasurementMode();
    } else {
      this.enterMeasurementMode();
    }
  }

  /**
   * Enter measurement mode
   */
  enterMeasurementMode() {
    if (this.isPickingMode) this.exitPickingMode();
    this.isMeasurementMode = true;
    this.inputController.setMeasurementMode(true);
    this.inputController.setPickingMode(false);
    this.onMeasurementModeChange?.(true);
    console.log('📏 Entered measurement mode - click two points on model');
  }

  /**
   * Exit measurement mode
   */
  exitMeasurementMode() {
    this.isMeasurementMode = false;
    this.inputController.setMeasurementMode(false);
    this.measurementManager.cancelPending();
    this.onMeasurementModeChange?.(false);
    console.log('✅ Exited measurement mode');
  }

  /**
   * Smoothly animate the camera controls target to a new position
   */
  private animateCameraTarget(targetPosition: THREE.Vector3) {
    if (!this.controls) return;

    const startTarget = this.controls.target.clone();
    const endTarget = targetPosition.clone();
    const duration = 500; // milliseconds
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Interpolate between start and end
      this.controls.target.lerpVectors(startTarget, endTarget, easeProgress);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private renderFrame() {
    if (this.controls) this.controls.update();

    // Update head light position to follow camera
    const target = (this.controls && this.controls.target)
      ? this.controls.target
      : new THREE.Vector3(0, 0, 0);
    this.lightingManager.updateHeadLight(this.camera, target);

    // Update annotation marker scales to maintain constant screen space size
    this.annotationManager.updateMarkerScales(this.camera, this.renderer.domElement.clientHeight);

    // Update Nexus objects for multiresolution streaming
    this.scene.traverse((object: THREE.Object3D) => {
      if ((object as any).update && typeof (object as any).update === 'function') {
        // NexusObject has an update method that needs the camera
        (object as any).update(this.camera);
      }
    });

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);

    // Render viewport gizmo if present
    if (this.viewportGizmo && typeof this.viewportGizmo.render === 'function') {
      this.viewportGizmo.update();
      this.viewportGizmo.render();
    }
  }

  /**
   * Load a new scene description
   * @param sceneDesc Scene description object defining models, environment, and settings
   * @param preserveCamera If true, keeps current camera position instead of reframing
   * 
   * @example
   * Load a simple scene with one model:
   * ```typescript
   * await presenter.loadScene({
   *   models: [{
   *     id: 'venus',
   *     file: 'venus.glb',
   *     rotation: [-90, 0, 0]
   *   }]
   * });
   * ```
   * 
   * @example
   * Load a complex scene with multiple models and environment settings:
   * ```typescript
   * await presenter.loadScene({
   *   rotationUnits: 'deg',
   *   models: [
   *     {
   *       id: 'building',
   *       file: 'building.glb',
   *       title: 'Main Building',
   *       position: [0, 0, 0],
   *       rotation: [0, 45, 0],
   *       scale: 1.5
   *     },
   *     {
   *       id: 'terrain',
   *       file: 'terrain.ply',
   *       position: [0, -5, 0]
   *     }
   *   ],
   *   environment: {
   *     showGround: true,
   *     background: '#87CEEB',
   *     headLightOffset: [15, 30]
   *   },
   *   annotations: [
   *     {
   *       id: 'entrance',
   *       label: 'Main Entrance',
   *       type: 'point',
   *       geometry: [10, 2, 5]
   *     }
   *   ]
   * });
   * ```
   */
  async loadScene(sceneDesc: SceneDescription, preserveCamera: boolean = false): Promise<void> {
    try {
      // Save current camera state if preserving
      let savedCameraPos: THREE.Vector3 | null = null;
      let savedCameraTarget: THREE.Vector3 | null = null;
      if (preserveCamera && this.controls) {
        savedCameraPos = this.camera.position.clone();
        savedCameraTarget = this.controls.target.clone();
        console.log('📷 Preserving camera position during scene reload');
      }

      this.currentScene = sceneDesc;

      // Clear existing scene
      this.clearScene();

      // Apply environment settings
      if (sceneDesc.environment) {
        this.applyEnvironmentSettings(sceneDesc.environment);
      }

      // Setup controls if enabled
      if (sceneDesc.enableControls !== false) {
        await this.setupControls();
      }

      // Load all models
      if (sceneDesc.models && sceneDesc.models.length > 0) {
        await this.loadAllModels(sceneDesc.models);

        if (!preserveCamera) {
          this.frameScene();
        } else {
          // Update scene bbox size for ground without reframing camera
          const sceneBBox = new THREE.Box3();
          Object.values(this.models).forEach(m => sceneBBox.expandByObject(m));
          const size = sceneBBox.getSize(new THREE.Vector3());
          this.sceneBBoxSize.copy(size);
        }

        // Recreate ground with correct size after framing scene
        if (sceneDesc.environment?.showGround) {
          this.removeGround();
          this.addGround();
        }
      }

      // Restore camera position if preserved
      if (preserveCamera && savedCameraPos && savedCameraTarget && this.controls) {
        this.camera.position.copy(savedCameraPos);
        this.controls.target.copy(savedCameraTarget);
        this.controls.update();
        console.log('📷 Camera position restored after scene reload');
      }

      // Render annotations if present
      if (sceneDesc.annotations && sceneDesc.annotations.length > 0) {
        this.annotationManager.render(sceneDesc.annotations);
      }

      console.log('✅ Scene loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load scene:', error);
      throw error;
    }
  }

  /**
   * Clear all models from the scene
   */
  private clearScene(): void {
    this.measurementManager.clear();
    Object.values(this.models).forEach(model => {
      this.scene.remove(model);
    });
    this.models = {};
    Object.values(this.bboxHelpers).forEach(h => {
      this.scene.remove(h);
      h.geometry.dispose();
    });
    this.bboxHelpers = {};
  }

  /**
   * Apply transforms from ModelDefinition to a loaded Object3D
   * - position: [x,y,z]
   * - rotation: [x,y,z] in radians or degrees (auto-detect)
   * - scale: single number or [x,y,z]
   */
  private applyTransforms(model: THREE.Object3D, def: ModelDefinition) {
    // Origin adjustment: shift model so its bbox centre lands at the world origin
    // before any explicit position offset is applied.
    if (def.origin === 'model_center') {
      model.updateWorldMatrix(false, true);
      const bbox = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      model.position.sub(center);
      console.log(`🎯 Model '${def.id}' origin set to model_center, offset:`, center);

      // Explicit position is an additional offset on top of the centering
      if (def.position && def.position.length === 3) {
        model.position.x += def.position[0];
        model.position.y += def.position[1];
        model.position.z += def.position[2];
      }
    } else {
      // Default 'model_coord': explicit position overwrites the file's own coordinates
      if (def.position && def.position.length === 3) {
        model.position.set(def.position[0], def.position[1], def.position[2]);
        console.log(`🎯 Model '${def.id}' origin set to model_coord, position:`, model.position);
      }
    }

    // Rotation - prefer explicit units (def.rotationUnits -> scene rotationUnits), otherwise auto-detect
    if (def.rotation && def.rotation.length === 3) {
      const r = def.rotation;
      const sceneUnits = this.currentScene?.rotationUnits;
      const units = def.rotationUnits || sceneUnits || null; // 'deg' | 'rad' | null
      let rx = r[0], ry = r[1], rz = r[2];
      if (units === 'deg') {
        const degToRad = Math.PI / 180;
        rx = r[0] * degToRad;
        ry = r[1] * degToRad;
        rz = r[2] * degToRad;
      } else if (units === 'rad') {
        // use as-is
      } else {
        // auto-detect degrees if values are large (> 2π)
        const maxAbs = Math.max(Math.abs(r[0]), Math.abs(r[1]), Math.abs(r[2]));
        const twoPi = Math.PI * 2;
        if (maxAbs > twoPi + 0.0001) {
          const degToRad = Math.PI / 180;
          rx = r[0] * degToRad;
          ry = r[1] * degToRad;
          rz = r[2] * degToRad;
        }
      }
      model.rotation.set(rx, ry, rz);
    }

    // Scale - accept number or vec3
    if (def.scale !== undefined) {
      if (typeof def.scale === 'number') {
        model.scale.set(def.scale, def.scale, def.scale);
      } else if (Array.isArray(def.scale) && def.scale.length === 3) {
        model.scale.set(def.scale[0], def.scale[1], def.scale[2]);
      }
    }
  }

  /**
   * Apply environment settings (ground, background, scale indicator)
   */
  private applyEnvironmentSettings(env: any): void {
    // Handle ground grid
    this.removeGround();
    if (env.showGround) {
      this.addGround();
    }

    // Handle background color
    if (env.background) {
      this.scene.background = new THREE.Color(env.background);
    }

    // Handle head light offset (degrees)
    if (Array.isArray(env.headLightOffset) && env.headLightOffset.length === 2) {
      this.setHeadLightOffset(env.headLightOffset[0], env.headLightOffset[1]);
    }

    // Handle scale indicator
    this.removeScaleIndicator();
    if (env.scaleIndicator?.enabled) {
      this.addScaleIndicator(env.scaleIndicator);
    }
  }

  /**
   * Setup orbit controls and viewport gizmo
   */
  private async setupControls(): Promise<void> {
    if (this.controls) return; // Already setup

    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    // Initial limits - will be updated after scene is loaded
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 1000;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Create and attach ViewportGizmo (dynamically import to avoid bundling it always)
    if (!this.viewportGizmo) {
      try {
        const { ViewportGizmo } = await import('three-viewport-gizmo');
        this.viewportGizmo = new ViewportGizmo(this.camera, this.renderer, {
          container: this.mount,
          size: 80
        });
        if (this.viewportGizmo.attachControls) this.viewportGizmo.attachControls(this.controls);
        console.log('✅ ViewportGizmo created and attached to controls');
      } catch (err) {
        console.warn('⚠️ Failed to load viewport gizmo dynamically:', err);
      }
    }
  }

  /**
   * Load all models from the scene description
   */
  private async loadAllModels(modelDefs: ModelDefinition[]): Promise<void> {
    const loadPromises = modelDefs.map(modelDef => this.loadModel(modelDef));
    await Promise.all(loadPromises);
  }

  /**
   * Load a single model.
   * 
   * This method performs the following steps for each model:
   * 1. **URL Resolution**: Resolves the full URL of the model file using the configured `FileUrlResolver`.
   * 2. **Loading**: Fetches and parses the model file (PLY, GLTF, GLB, etc.) using `ModelLoader`.
   *    - Automatically detects format from extension.
   *    - Applies material overrides (color, roughness, metalness) if specified.
   * 3. **Transformation**: Applies position, rotation, and scale transformations defined in the model definition.
   * 4. **Visibility**: Sets the initial visibility state.
   * 5. **Statistics**: Calculates geometry statistics (vertex count, bounding box, etc.).
   * 6. **Scene Addition**: Adds the model to the Three.js scene and registers it in the `models` map.
   * 
   * @param modelDef The model definition containing file path and properties.
   */
  private async loadModel(modelDef: ModelDefinition): Promise<void> {
    // Use the file URL resolver to get the full URL
    const projectId = this.currentScene?.projectId;
    const fullUrl = this.fileUrlResolver.resolve(modelDef.file, { projectId });

    console.log(`Loading model ${modelDef.id} from ${fullUrl}`);

    try {
      // Notify loading started
      this.onLoadProgress?.({
        modelId: modelDef.id,
        fileName: modelDef.file,
        loaded: 0,
        total: 0,
        percentage: 0,
        status: 'loading'
      });

      const model = await this.loadModelFile(fullUrl, modelDef);

      // Apply transforms (position, rotation, scale)
      this.applyTransforms(model, modelDef);
      if (modelDef.visible !== undefined) {
        model.visible = modelDef.visible;
      }

      // Calculate and store model statistics
      this.modelStats[modelDef.id] = calculateObjectStats(model);
      console.log(`📊 Model ${modelDef.id} stats:`, this.modelStats[modelDef.id]);

      // Store and add to scene
      this.models[modelDef.id] = model;
      this.scene.add(model);

      // Optionally draw a bounding box helper
      if (modelDef.showBoundingBox) {
        const rawColor = modelDef.boundingBoxColor ?? 0xffff00;
        const color = typeof rawColor === 'string' ? parseInt(rawColor.replace('#', ''), 16) : rawColor;
        const helper = new THREE.BoxHelper(model, color);
        this.scene.add(helper);
        this.bboxHelpers[modelDef.id] = helper;
      }

      console.log(`✅ Loaded model ${modelDef.id}`);

      // Notify completion
      this.onLoadProgress?.({
        modelId: modelDef.id,
        fileName: modelDef.file,
        loaded: 0,
        total: 0,
        percentage: 100,
        status: 'complete'
      });
      this.onLoadComplete?.(modelDef.id);
    } catch (error) {
      console.error(`❌ Failed to load model ${modelDef.id}:`, error);

      // Notify error
      this.onLoadProgress?.({
        modelId: modelDef.id,
        fileName: modelDef.file,
        loaded: 0,
        total: 0,
        percentage: 0,
        status: 'error'
      });
      this.onLoadError?.(modelDef.id, error as Error);

      throw error;
    }
  }

  /**
   * Load a model file based on its extension
   */
  private async loadModelFile(url: string, modelDef: ModelDefinition): Promise<THREE.Object3D> {
    // Use the ModelLoader to handle format detection and loading
    let materialOverrides: any = undefined;
    if (modelDef.material) {
      // If a runtime THREE.Material instance is provided, pass it through.
      if ((modelDef.material as any).isMaterial) {
        materialOverrides = modelDef.material as any;
      } else {
        // Otherwise, treat as MaterialProperties (serializable form) and convert
        const rawColor = (modelDef.material as any).color;
        materialOverrides = {
          color: rawColor ? (typeof rawColor === 'string' ? parseInt(rawColor.replace('#', ''), 16) : rawColor) : undefined,
          flatShading: (modelDef.material as any).flatShading,
          metalness: (modelDef.material as any).metalness,
          roughness: (modelDef.material as any).roughness
        };
      }
    }

    // Create progress callback
    const onProgress = (loaded: number, total: number, percentage: number) => {
      this.onLoadProgress?.({
        modelId: modelDef.id,
        fileName: modelDef.file,
        loaded,
        total,
        percentage,
        status: 'loading'
      });
    };

    const result = await this.modelLoader.loadFromUrl(url, materialOverrides, onProgress);
    console.log(`📦 Loaded ${result.format.toUpperCase()} model (${(result.byteSize / 1024).toFixed(2)} KB)`);

    return result.object;
  }

  /**
   * Frame the scene - position models and camera without scaling
   * Models without predefined positions are translated so:
   * - Bottom of bbox is at y=0
   * - Center of X and Z axes are at origin
   * Camera is positioned at appropriate distance based on scene size
   */
  private frameScene(): void {
    const allModels = Object.values(this.models);
    if (allModels.length === 0) return;

    // Calculate scene bounding box to determine camera position and ground size
    const sceneBBox = new THREE.Box3();
    allModels.forEach(m => sceneBBox.expandByObject(m));
    const size = sceneBBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    console.log('frameScene(): Scene bounding box size (original):', size, 'maxDim:', maxDim);

    // Store scene size for ground sizing
    this.sceneBBoxSize.copy(size);

    if (maxDim > 0) {
      const center = sceneBBox.getCenter(new THREE.Vector3());

      // Calculate translation needed to center scene
      const offsetX = -center.x;
      const offsetZ = -center.z;
      const offsetY = -sceneBBox.min.y;

      // Apply automatic positioning only to models without predefined positions
      allModels.forEach((model, idx) => {
        if (this.currentScene?.models) {
          const modelDef = this.currentScene.models[idx];
          if (modelDef) {
            // Only apply automatic positioning if position is not already defined
            if (!modelDef.position || modelDef.position.length !== 3) {
              const translation = new THREE.Vector3(offsetX, offsetY, offsetZ);
              model.position.add(translation);

              // Store the computed position in the model definition (rounded to 3 decimals)
              const pos = model.position;
              modelDef.position = [
                parseFloat(pos.x.toFixed(3)),
                parseFloat(pos.y.toFixed(3)),
                parseFloat(pos.z.toFixed(3))
              ];
              console.log(`📍 Model ${modelDef.id} auto-positioned to:`, modelDef.position);
            } else {
              console.log(`📍 Model ${modelDef.id} using predefined position:`, modelDef.position);
            }
          }
        }
      });

      // Recalculate bounding box after positioning
      sceneBBox.makeEmpty();
      allModels.forEach(m => sceneBBox.expandByObject(m));

      // Update bbox helpers now that models have been repositioned
      Object.values(this.bboxHelpers).forEach(h => h.update());

      // Use CameraManager to frame the scene (automatically sets near/far planes)
      this.cameraManager.frameBoundingBox(sceneBBox, this.controls);

      const targetY = size.y * 0.5;

      // Set reasonable zoom limits based on scene size
      if (this.controls) {
        this.controls.minDistance = maxDim * 0.1;
        this.controls.maxDistance = maxDim * 10;
      }

      // Store initial position
      this.initialCameraPosition.copy(this.camera.position);
      this.initialControlsTarget.copy(this.controls?.target || new THREE.Vector3(0, targetY, 0));

      console.log(`📷 Scene framed using CameraManager`);
    }
  }

  /**
   * Get current presenter state (for saving/persistence)
   */
  getState(): PresenterState {
    return {
      camera: {
        position: this.camera.position.toArray() as [number, number, number],
        target: this.controls?.target.toArray() as [number, number, number] || [0, 0, 0],
        fov: this.camera instanceof THREE.PerspectiveCamera ? this.camera.fov : 45,
      },
      rendering: {
        headLightEnabled: this.lightEnabled,
        envLightingEnabled: this.lightingManager.isEnvironmentLightingEnabled(),
      },
      modelVisibility: this.getModelVisibility(),
    };
  }

  /**
   * Apply transformations to a specific model without saving to scene
   * Useful for live preview while editing
   */
  applyModelTransform(
    modelId: string,
    position?: [number, number, number] | null,
    rotation?: [number, number, number] | null,
    scale?: number | [number, number, number] | null
  ): void {
    const model = this.models[modelId];
    if (!model) {
      console.warn(`Model ${modelId} not found`);
      return;
    }

    // Apply position
    if (position && position.length === 3) {
      model.position.set(position[0], position[1], position[2]);
    }

    // Apply rotation (always in radians for Three.js)
    if (rotation && rotation.length === 3) {
      model.rotation.set(rotation[0], rotation[1], rotation[2]);
    }

    // Apply scale
    if (scale !== undefined && scale !== null) {
      if (typeof scale === 'number') {
        model.scale.set(scale, scale, scale);
      } else if (Array.isArray(scale) && scale.length === 3) {
        model.scale.set(scale[0], scale[1], scale[2]);
      }
    }
  }

  /**
   * Restore presenter state (from saved/persistence)
   */
  setState(state: PresenterState): void {
    // Restore camera
    this.camera.position.fromArray(state.camera.position);
    if (this.controls) {
      this.controls.target.fromArray(state.camera.target);
      this.controls.update();
    }
    if (state.camera.fov && this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.fov = state.camera.fov;
      this.camera.updateProjectionMatrix();
    }

    // Restore rendering settings
    this.lightEnabled = state.rendering.headLightEnabled;
    this.lightingManager.setHeadLightEnabled(this.lightEnabled);
    this.onLightChange?.(this.lightEnabled);

    const envEnabled = state.rendering.envLightingEnabled;
    this.lightingManager.setEnvironmentLightingEnabled(envEnabled);
    this.onEnvChange?.(envEnabled);

    // Restore model visibility
    for (const [modelId, visible] of Object.entries(state.modelVisibility)) {
      this.setModelVisibility(modelId, visible);
    }
  }

  /**
   * Set visibility of a model by ID
   */
  setModelVisibility(modelId: string, visible: boolean): void {
    const model = this.models[modelId];
    if (model) {
      model.visible = visible;
      console.log(`👁️ Model '${modelId}' visibility set to ${visible}`);
    } else {
      console.warn(`⚠️ Model '${modelId}' not found in loaded models. Available models:`, Object.keys(this.models));
    }
  }

  /**
   * Get visibility of a specific model
   */
  getModelVisibilityById(modelId: string): boolean {
    const model = this.models[modelId];
    return model ? model.visible : false;
  }

  /**
   * Show or hide the bounding box helper for a model.
   * If the helper doesn't exist yet and `visible` is true, it is created on the fly.
   */
  setModelBoundingBoxVisible(modelId: string, visible: boolean, color: number | string = 0xffff00): void {
    const model = this.models[modelId];
    if (!model) {
      console.warn(`⚠️ setModelBoundingBoxVisible: model '${modelId}' not found`);
      return;
    }
    let helper = this.bboxHelpers[modelId];
    if (!helper && visible) {
      const c = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
      helper = new THREE.BoxHelper(model, c);
      this.scene.add(helper);
      this.bboxHelpers[modelId] = helper;
    }
    if (helper) {
      helper.visible = visible;
    }
  }

  /**
   * Get visibility of all models
   */
  private getModelVisibility(): Record<string, boolean> {
    const visibility: Record<string, boolean> = {};
    for (const [id, model] of Object.entries(this.models)) {
      visibility[id] = model.visible;
    }
    return visibility;
  }

  /**
   * Get the annotation manager instance for direct access to annotation API
   * @returns The AnnotationManager instance
   */
  getAnnotationManager(): AnnotationManager {
    return this.annotationManager;
  }

  /**
   * Get the measurement manager instance for direct access to measurement API
   */
  getMeasurementManager(): MeasurementManager {
    return this.measurementManager;
  }

  /**
   * Remove all measurement visuals from the scene
   */
  clearMeasurements(): void {
    this.measurementManager.clear();
  }

  /**
   * Read current persistent measurements
   */
  getMeasurements(): MeasurementRecord[] {
    return this.measurementManager.getAll();
  }

  /**
   * Set background color without reloading the scene
   * @param color Hex color string (e.g., '#404040')
   */
  setBackgroundColor(color: string): void {
    this.scene.background = new THREE.Color(color);
    // Update currentScene if it exists
    if (this.currentScene && this.currentScene.environment) {
      this.currentScene.environment.background = color;
    }
    console.log('🎨 Background color updated to:', color);
  }

  /**
   * Toggle ground visibility without reloading the scene
   * @param visible Whether the ground should be visible
   */
  setGroundVisible(visible: boolean): void {
    if (visible && !this.ground) {
      this.addGround();
    } else if (!visible && this.ground) {
      this.removeGround();
    }
    // Update currentScene if it exists
    if (this.currentScene && this.currentScene.environment) {
      this.currentScene.environment.showGround = visible;
    }
    console.log('🌍 Ground visibility set to:', visible);
  }

  /**
   * Set head light offset without reloading the scene
   * @param thetaDeg Horizontal angle in degrees
   * @param phiDeg Vertical angle in degrees
   */
  setHeadLightOffset(thetaDeg: number, phiDeg: number): void {
    this.lightingManager.setHeadLightOffsetFromDegrees(thetaDeg, phiDeg);
    const target = this.controls?.target || new THREE.Vector3(0, 0, 0);
    this.lightingManager.updateHeadLight(this.camera, target);
    console.log('💡 Head light offset updated to:', thetaDeg, phiDeg);
  }

  resetCamera() {
    // Use camera manager to reset camera
    this.cameraManager.resetCamera(this.controls);
    console.log('📷 Camera view reset to home position');
  }

  toggleLight() {
    this.lightEnabled = this.lightingManager.toggleHeadLight();
    console.log(`💡 Lighting ${this.lightEnabled ? 'enabled' : 'disabled'}`);
    this.onLightChange?.(this.lightEnabled);
  }

  toggleEnvLighting() {
    const enabled = this.lightingManager.toggleEnvironmentLighting();
    console.log(`🌍 Environment lighting ${enabled ? 'enabled' : 'disabled'}`);
    this.onEnvChange?.(enabled);
  }



  toggleCameraMode() {
    if (!this.orthographicCamera) return;

    // Use camera manager to toggle camera mode
    this.camera = this.cameraManager.toggleCameraMode(this.controls);
    this.isOrthographic = this.cameraManager.isOrthographicMode();

    // Update button opacity
    if (this.isOrthographic) {
      console.log('📦 Switched to orthographic camera');
    } else {
      console.log('📐 Switched to perspective camera');
    }

    this.onCameraModeChange?.(this.isOrthographic);

    // Dispose and recreate viewport gizmo with the new camera
    this.recreateViewportGizmo();
  }

  async recreateViewportGizmo() {
    // Dispose existing gizmo
    if (this.viewportGizmo && this.viewportGizmo.dispose) {
      try {
        this.viewportGizmo.dispose();
        console.log('🗑️ Disposed old viewport gizmo');
      } catch (err) {
        console.warn('Failed to dispose viewport gizmo:', err);
      }
      this.viewportGizmo = null;
    }

    // Create new gizmo with current camera
    try {
      const { ViewportGizmo } = await import('three-viewport-gizmo');
      this.viewportGizmo = new ViewportGizmo(this.camera, this.renderer, {
        container: this.mount,
        size: 80
      });
      if (this.viewportGizmo.attachControls && this.controls) {
        this.viewportGizmo.attachControls(this.controls);
      }
      console.log('✅ Recreated viewport gizmo with new camera');
    } catch (err) {
      console.warn('⚠️ Failed to recreate viewport gizmo:', err);
    }
  }

  takeScreenshot() {
    // Render the current frame to ensure we have the latest state
    this.renderer.render(this.scene, this.camera);

    // Get the canvas data as a data URL (PNG format)
    const dataURL = this.renderer.domElement.toDataURL('image/png');

    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `screenshot-${timestamp}.png`;
    link.href = dataURL;
    link.click();

    console.log('📸 Screenshot captured and downloaded');
  }

  /**
   * Calculate triangle and vertex counts for a loaded model
   * @param modelId - The ID of the model to analyze
   * @returns Object with triangle and vertex counts, or null if model not found
   */
  getModelStats(modelId: string): { triangles: number; vertices: number; bbox: { x: number; y: number; z: number }; textures: { count: number; dimensions: Array<{ width: number; height: number }> } } | null {
    return this.modelStats[modelId] || null;
  }

  private addGround() {
    // Create a grid helper at y = 0, sized based on actual scene dimensions
    // GridHelper(size, divisions, colorCenterLine, colorGrid)
    const maxDim = Math.max(this.sceneBBoxSize.x, this.sceneBBoxSize.z);
    const targetSize = maxDim * 2; // Make ground 2x the scene size for context
    // targetSize is approximated size that we would like to have. 
    // Then first we decide the size of the grid cell so that 
    // it is some power of 10 (values <1 like 0.1, 0.01 etc. are possible)
    const cellSize = Math.pow(10, Math.floor(Math.log10(targetSize / 10))); // Base cell size (1, 10, 100, etc.)
    
    const size = Math.ceil(targetSize / cellSize) * cellSize; // Round up to nearest cell size
  
    const divisions = Math.max(10, Math.min(50, Math.floor(size / 0.1))); // Adaptive divisions
    const colorCenterLine = 0xdddddd;
    const colorGrid = 0x888888;
    console.log('Adding ground grid with size:', size, 'divisions:', divisions);
    this.ground = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
    // GridHelper is created in XZ plane by default, which is what we want (y=0)
    this.scene.add(this.ground);
    console.log(`🌍 Ground grid created: size=${size.toFixed(2)}, divisions=${divisions}`);
  }

  private removeGround() {
    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground = null;
    }
  }

  private addScaleIndicator(config: any) {
    // Default configuration for scale indicator
    const indicatorConfig = {
      unit: config.unit ?? 'units',
      rulerSize: config.rulerSize ?? 1,
      segments: config.segments ?? 10,
      barHeight: config.barHeight,
      textHeight: config.textHeight,
      lightColor: config.lightColor ?? 0xffffff,
      darkColor: config.darkColor ?? 0x000000,
      textColor: config.textColor ?? 0x000000
    };

    this.scaleIndicator = new ScaleIndicator(this.scene, indicatorConfig);

    // Position the scale indicator
    const posX = config.posX ?? -(this.sceneBBoxSize.x / 2 + indicatorConfig.rulerSize / 2 + 0.2);
    const posZ = config.posZ ?? -(this.sceneBBoxSize.z / 2 + 0.2);
    this.scaleIndicator.setPosition(posX, 0, posZ);

    console.log(`📏 Scale indicator added at (${posX.toFixed(2)}, 0, ${posZ.toFixed(2)})`);
  }

  private removeScaleIndicator() {
    if (this.scaleIndicator) {
      this.scaleIndicator.remove();
      this.scaleIndicator = null;
    }
  }

  private async loadEnvironmentMap() {
    try {
      // Dynamically import EXRLoader
      // @ts-ignore - example loaders may not have types in the project
      const { EXRLoader } = await import('three/addons/loaders/EXRLoader.js');
      const exrLoader = new EXRLoader();
      // Load from public folder
      exrLoader.load(
        '/assets/brown_photostudio_02_256.exr',
        (texture: THREE.DataTexture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.lightingManager.setEnvironmentMap(texture);
          console.log('✅ Environment map loaded successfully');
        },
        undefined,
        (error: any) => {
          console.error('❌ Failed to load environment map:', error);
        }
      );
    } catch (err) {
      console.warn('EXRLoader dynamic import failed or not available:', err);
    }
  }

  /**
   * Selection management methods for annotations
   */

  /**
   * Selection management methods (delegate to AnnotationManager)
   */
}
