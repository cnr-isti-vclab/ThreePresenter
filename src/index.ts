/**
 * Three Presenter - Modular 3D Viewer Components
 * 
 * Independent, reusable modules for building 3D viewers with Three.js.
 * 
 * ## Architecture Overview
 * 
 * The library follows a **Data-Driven Design** pattern, separating state from rendering logic:
 * 
 * - **Data (Model)**: The scene is defined by a pure JSON object ({@link SceneDescription}), making it easy to serialize and store.
 * - **Controller (Presenter)**: The {@link ThreePresenter} class acts as the manager, hydrating the data into an active 3D scene.
 * - **View**: The underlying {@link ThreePresenter.scene | THREE.Scene} and {@link ThreePresenter.models | models} are managed internally by the presenter.
 * 
 * Each {@link ThreePresenter} instance manages exactly one active scene at a time. To display multiple scenes simultaneously, instantiate multiple presenters attached to different DOM elements.
 * 
 * @see {@link https://github.com/cnr-isti-vclab/ThreePresenter | GitHub Repository}
 * @see {@link https://cnr-isti-vclab.github.io/ThreePresenter/ | Documentation & Examples}
 * @packageDocumentation
 */

// Export main ThreePresenter class
export { ThreePresenter } from './ThreePresenter';
export type { 
  SceneDescription, 
  ModelDefinition, 
  PresenterState, 
  LoadingProgress
} from './ThreePresenter';

// Export scene type definitions
export type {
  EnvironmentSettings,
  Annotation,
  AnnotationType,
  AnnotationGeometry
} from './types/SceneTypes';

// Export annotation system
export { AnnotationManager } from './managers/AnnotationManager';
export type {
  AnnotationConfig,
  SelectionChangeCallback,
  PointPickedCallback
} from './types/AnnotationTypes';

// Export file URL resolvers
export type {
  FileUrlResolver,
  FileResolverContext
} from './types/FileUrlResolver';

export {
  DefaultFileUrlResolver,
  StaticBaseUrlResolver,
  FunctionResolver
} from './types/FileUrlResolver';

// Export geometry utilities
export type { GeometryStats } from './utils/GeometryUtils';

export {
  calculateObjectStats,
  calculateSceneBoundingBox,
  getMaxDimension,
  calculateCameraDistance,
  calculateCenteringOffset,
  calculateSceneCenteringOffset,
  hasValidPosition,
  roundPosition,
  formatStats
} from './utils/GeometryUtils';

// Export UI controls builder
export { UIControlsBuilder, createButton, createButtonPanel } from './ui/UIControlsBuilder';
export type {
  ButtonConfig,
  ContainerConfig,
  UIControlsResult
} from './ui/UIControlsBuilder';

// Export camera manager
export { CameraManager, createCameraManager, calculateFrustumSize } from './managers/CameraManager';
export type {
  CameraConfig,
  CameraState
} from './managers/CameraManager';

// Export lighting manager
export { LightingManager } from './managers/LightingManager';
export type {
  LightingConfig,
  LightingState
} from './managers/LightingManager';

// Export model loader
export { ModelLoader, createModelLoader } from './managers/ModelLoader';
export type {
  LoaderConfig,
  MaterialProperties,
  ProgressCallback,
  LoadResult
} from './managers/ModelLoader';
