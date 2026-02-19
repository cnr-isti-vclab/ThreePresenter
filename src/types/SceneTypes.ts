import type * as THREE from 'three';

/**
 * Shared type definitions for scene description and presenter state
 * Used by both frontend and backend
 */

/**
 * Annotation type - can be point, line, or area
 */
export type AnnotationType = 'point' | 'line' | 'area';

/**
 * Geometry for different annotation types
 * - Point: single 3D coordinate [x, y, z]
 * - Line: array of 3D coordinates [[x1,y1,z1], [x2,y2,z2], ...]
 * - Area: array of 3D coordinates forming a closed polygon
 */
export type AnnotationGeometry = 
  | [number, number, number]           // Point
  | [number, number, number][]         // Line or Area (array of points)

/**
 * A single annotation in the scene
 */
export interface Annotation {
  /** Unique identifier for the annotation */
  id: string;
  /** User-visible label/name for the annotation */
  label: string;
  /** Type of annotation */
  type: AnnotationType;
  /** Geometric data for the annotation */
  geometry: AnnotationGeometry;
  /** Optional creation timestamp */
  createdAt?: string;
  /** Optional user who created it */
  createdBy?: string;
}

/**
 * Serialisable material properties used in scene.json (hex color string expected)
 */
export interface MaterialProperties {
  /** Hex color string, e.g. "#ffffff" */
  color?: string | number;
  flatShading?: boolean;
  metalness?: number;
  roughness?: number;
}

/**
 * Describes a single 3D model in the scene.
 * 
 * This is a **configuration object**. It defines how a model should be loaded and initialized.
 * Once loaded, the actual runtime object is stored in {@link ThreePresenter.models} as a {@link THREE.Object3D}.
 */
export interface ModelDefinition {
  /** Unique identifier for the model */
  id: string;
  /** Filename of the model (e.g., "model.glb", "mesh.ply") */
  file: string;
  /** Human-friendly title for the model (defaults to filename base) */
  title?: string;
  /** Position in 3D space [x, y, z], defaults to [0, 0, 0] */
  position?: [number, number, number];
  /** Rotation in radians [x, y, z], defaults to [0, 0, 0] */
  rotation?: [number, number, number];
  /** Optional explicit rotation units for this model. If provided, overrides scene-level setting. */
  rotationUnits?: 'deg' | 'rad';
  /**
   * Controls how the model's local origin is treated before placing it in the scene.
   * - `'model_coord'` (default): no adjustment; the model is placed using its original coordinates.
   * - `'model_center'`: translates the model so that its bounding-box centre falls at the world origin
   *   before any explicit `position` offset is applied.
   */
  origin?: 'model_coord' | 'model_center';
  /** When true, draws a wireframe bounding box around the model in the scene. */
  showBoundingBox?: boolean;
  /** Color of the bounding box wireframe. Accepts a hex number (0xff0000) or CSS hex string ('#ff0000'). Defaults to 0xffff00. */
  boundingBoxColor?: number | string;
  /** Scale factors [x, y, z], defaults to [1, 1, 1] */
  scale?: number | [number, number, number];
  /** Whether the model is visible, defaults to true */
  visible?: boolean;
  /** Optional material property overrides or a runtime THREE.Material instance
   *  - As properties (serializable): use color (hex string), metalness, roughness, flatShading.
   *  - As runtime material instance: provide a THREE.Material that will be set on the loaded mesh(es).
   */
  material?: MaterialProperties | (THREE.Material & { isMaterial?: true });
}

/**
 * Describes environment settings for the scene
 */
export interface EnvironmentSettings {
  /** Whether to show the ground grid */
  showGround?: boolean;
  /** Background color as hex string (e.g., "#404040") */
  background?: string;
  /** Scale indicator configuration for measuring objects */
  scaleIndicator?: {
    /** Whether to show the scale indicator ruler */
    enabled?: boolean;
    /** Unit label (e.g., 'meters', 'cm', 'inches') */
    unit?: string;
    /** Size of the ruler in world units */
    rulerSize?: number;
    /** Number of checkerboard segments (default: 10) */
    segments?: number;
    /** Height of the bar (default: rulerSize/10) */
    barHeight?: number;
    /** X position of the ruler on the ground */
    posX?: number;
    /** Z position of the ruler on the ground */
    posZ?: number;
    /** Light square color (default: 0xffffff - white) */
    lightColor?: number;
    /** Dark square color (default: 0x000000 - black) */
    darkColor?: number;
  };
}

/**
 * Complete scene description - what models exist and their properties
 * Stored as scene.json alongside the model files
 * 
 * @example
 * Basic scene with a single model:
 * ```json
 * {
 *   "models": [
 *     {
 *       "id": "statue",
 *       "file": "venus.glb",
 *       "title": "Venus de Milo",
 *       "rotation": [-90, 0, 0]
 *     }
 *   ]
 * }
 * ```
 * 
 * @example
 * Complete scene with multiple models, environment, and annotations:
 * ```json
 * {
 *   "projectId": "my-project",
 *   "rotationUnits": "deg",
 *   "models": [
 *     {
 *       "id": "main-model",
 *       "file": "building.glb",
 *       "title": "Main Building",
 *       "position": [0, 0, 0],
 *       "rotation": [0, 45, 0],
 *       "scale": 1.5,
 *       "visible": true,
 *       "material": {
 *         "color": "#ffffff",
 *         "metalness": 0.2,
 *         "roughness": 0.8
 *       }
 *     },
 *     {
 *       "id": "context",
 *       "file": "terrain.ply",
 *       "title": "Terrain",
 *       "position": [0, -5, 0],
 *       "visible": true
 *     }
 *   ],
 *   "environment": {
 *     "showGround": true,
 *     "background": "#87CEEB",
 *     "headLightOffset": [15, 30]
 *   },
 *   "enableControls": true,
 *   "annotations": [
 *     {
 *       "id": "entrance",
 *       "label": "Main Entrance",
 *       "type": "point",
 *       "geometry": [10, 2, 5]
 *     },
 *     {
 *       "id": "path",
 *       "label": "Walking Path",
 *       "type": "line",
 *       "geometry": [[0, 0, 0], [10, 0, 5], [20, 0, 10]]
 *     }
 *   ]
 * }
 * ```
 */
export interface SceneDescription {
  /** Project ID for resolving file URLs */
  projectId?: string;
  /** List of 3D models in the scene */
  models: ModelDefinition[];
  /** Environment and rendering settings */
  environment?: EnvironmentSettings;
  /** Whether trackball/orbit controls are enabled */
  enableControls?: boolean;
  /** Optional scene-level default for rotation units (overridden by model.rotationUnits) */
  rotationUnits?: 'deg' | 'rad';
  /** Array of annotations in the scene */
  annotations?: Annotation[];
}

/**
 * Camera state for saving/restoring view
 */
export interface CameraState {
  /** Camera position [x, y, z] */
  position: [number, number, number];
  /** Camera look-at target [x, y, z] */
  target: [number, number, number];
  /** Field of view in degrees */
  fov?: number;
}

/**
 * Rendering settings state
 */
export interface RenderingState {
  /** Whether the head light is enabled */
  headLightEnabled: boolean;
  /** Whether environment lighting (HDR) is enabled */
  envLightingEnabled: boolean;
}

/**
 * Complete presenter state - how the user is currently viewing the scene
 * Can be saved per-user in database or localStorage
 */
export interface PresenterState {
  /** Current camera position and orientation */
  camera: CameraState;
  /** Current rendering settings */
  rendering: RenderingState;
  /** Visibility state for each model by ID */
  modelVisibility: Record<string, boolean>;
}
