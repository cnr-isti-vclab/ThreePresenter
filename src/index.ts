/**
 * Three Presenter - Modular 3D Viewer Components
 * 
 * Independent, reusable modules for building 3D viewers with Three.js.
 * 
 * ## Architecture Overview
 * 
 * The library follows a **Data-Driven Design** pattern, separating state from rendering logic, and uses **Dependency Injection** for modularity.
 * 
 * ### Core Components
 * 
 * - **{@link ThreePresenter}**: The main controller that orchestrates the 3D scene, manages state, and coordinates other components.
 * - **{@link SceneDescription}**: A pure JSON object defining the scene (models, environment), decoupled from the runtime state.
 * 
 * ### Subsystems
 * 
 * The functionality is split into specialized managers to avoid a monolithic design:
 * 
 * - **{@link InputController}**: Handles all user input (mouse, touch, keyboard) and raycasting. It is decoupled from the presenter and communicates via callbacks.
 * - **{@link DefaultUI}**: A standalone UI overlay that consumes the presenter's state and methods. It demonstrates how to build a UI on top of the library without tight coupling.
 * - **{@link RenderLoop}**: Encapsulates the `requestAnimationFrame` loop, allowing for efficient rendering control.
 * - **Managers**: Specialized classes for internal logic:
 *   - **{@link ModelLoader}**: Handles loading of heterogenous 3D formats (GLB, PLY, NXS).
 *   - **{@link LightingManager}**: Manages scene lighting and environment maps.
 *   - **{@link CameraManager}**: Handles camera switching (Persp/Ortho) and controls.
 *   - **{@link AnnotationManager}**: Manages 3D annotations and their lifecycle.
 *   - **{@link MeasurementManager}**: Manages modal two-point distance measurements.
 * 
 * ### Dependency Injection
 * 
 * The `ThreePresenter` constructor accepts a `managers` object, allowing you to inject custom implementations of core subsystems (like `ModelLoader` or `LightingManager`) for testing or customization.
 * 
 * @example
 * ```typescript
 * // Custom composition
 * const presenter = new ThreePresenter({
 *   mount: 'viewer',
 *   managers: {
 *      renderLoop: new CustomRenderLoop()
 *   }
 * });
 * ```
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
  LoadingProgress,
  ThreePresenterConfig
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

// Export measurement system
export { MeasurementManager } from './managers/MeasurementManager';
export type {
  MeasurementConfig,
  MeasurementRecord
} from './managers/MeasurementManager';

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

// Export scale indicator
export { ScaleIndicator } from './utils/ScaleIndicator';
export type { ScaleIndicatorConfig } from './utils/ScaleIndicator';

// Export UI controls builder
export { UIControlsBuilder, createButton, createButtonPanel } from './ui/UIControlsBuilder';
export { DefaultUI } from './ui/DefaultUI';
export type { DefaultUIConfig } from './ui/DefaultUI';
export type {
  ButtonConfig,
  ContainerConfig,
  UIControlsResult
} from './ui/UIControlsBuilder';

// Export camera manager
export { CameraManager, createCameraManager } from './managers/CameraManager';
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

// Export input controller
export { InputController } from './managers/InputController';
export type { InputControllerConfig } from './managers/InputController';

// Export render loop
export { RenderLoop } from './managers/RenderLoop';

// Export IIIF manifest parser
export { parseIIIFManifest } from './utils/IIIFManifestParser';
