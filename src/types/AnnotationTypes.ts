/**
 * Annotation type definitions for ThreePresenter
 * 
 * This module defines the interfaces and types for the annotation system.
 * Annotations are independent from the scene and can be rendered on any 3D model.
 */

/**
 * Type of annotation geometry
 */
export type AnnotationType = 'point' | 'line' | 'area';

/**
 * Annotation geometry currently being created interactively.
 * `null` restores normal annotation selection/navigation.
 */
export type AnnotationCreationMode = 'point' | 'line' | null;

/**
 * Geometry data for an annotation
 * - Point: [x, y, z]
 * - Line/Area: Array of [x, y, z] points
 */
export type AnnotationGeometry = 
  | [number, number, number]  // Point
  | [number, number, number][]; // Line or Area

/**
 * Annotation data structure
 */
export interface Annotation {
  id: string;
  label: string;
  text?: string;
  description?: string;
  type: AnnotationType;
  geometry: AnnotationGeometry;
  /**
   * Optional normal vector.
   * Mainly populated for IIIF point annotations when provided by the selector.
   */
  normal?: [number, number, number];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

/**
 * Configuration options for AnnotationManager
 */
export interface AnnotationConfig {
  /** Color for unselected annotation markers (hex) */
  color?: number;
  /** Color for selected annotation markers (hex) */
  selectedColor?: number;
  /** Opacity for unselected markers (0-1) */
  opacity?: number;
  /** Opacity for selected markers (0-1) */
  selectedOpacity?: number;
  /** Target screen-space size in pixels for markers */
  markerSize?: number;
  /** Sphere geometry segments (lower = better performance) */
  sphereSegments?: number;
  /** Fill color for point markers (hex) */
  pointFillColor?: number;
  /** Stroke color for point markers (hex) */
  pointStrokeColor?: number;
  /** Fill color for selected point markers (hex) */
  selectedPointFillColor?: number;
  /** Stroke color for selected point markers (hex) */
  selectedPointStrokeColor?: number;
  /** Stroke width for point markers in texture pixels */
  pointStrokeWidth?: number;
  /** Point marker shadow alpha (0-1) */
  pointShadowOpacity?: number;
  /** Visible line width in screen pixels */
  lineWidth?: number;
  /** Width of the dark contrast stroke behind lines, in screen pixels */
  lineUnderlayWidth?: number;
  /** Color of the contrast stroke behind lines (hex) */
  lineUnderlayColor?: number;
  /** Invisible line width used for pointer selection, in screen pixels */
  lineHitWidth?: number;
  /** Screen-space size of vertices shown on a selected line */
  lineVertexSize?: number;
}

/**
 * Callback type for annotation selection changes
 */
export type SelectionChangeCallback = (selectedIds: string[]) => void;

/**
 * Callback type for annotation picking (point selection on model)
 */
export type PointPickedCallback = (point: [number, number, number]) => void;

/**
 * Callback fired after the user completes an annotation geometry.
 */
export type AnnotationGeometryCreatedCallback = (
  type: Exclude<AnnotationCreationMode, null>,
  geometry: AnnotationGeometry,
) => void;

/**
 * Callback fired whenever the interactive annotation creation mode changes.
 */
export type AnnotationCreationModeChangeCallback = (mode: AnnotationCreationMode) => void;

/**
 * Callback type for annotation geometry edit lifecycle.
 */
export type AnnotationEditCallback = (annotation: Annotation) => void;
