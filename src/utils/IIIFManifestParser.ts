import type { SceneDescription, ModelDefinition, Annotation } from '../types/SceneTypes';

// ---------------------------------------------------------------------------
// Minimal IIIF Presentation API 4 types (only what we need)
// ---------------------------------------------------------------------------

interface IIIFLangMap { [lang: string]: string[] }
interface IIIFTransform { type: string; x?: number; y?: number; z?: number }

interface IIIFBody {
  // Direct model
  id?: string;
  type?: string;
  format?: string;
  label?: IIIFLangMap;
  value?: string;
  // SpecificResource wrapping a model
  source?: { id?: string; type?: string; format?: string; label?: IIIFLangMap };
  transform?: IIIFTransform[];
}

interface IIIFSelector {
  type: string;
  x?: number;
  y?: number;
  z?: number;
  nx?: number;
  ny?: number;
  nz?: number;
  normal?: [number, number, number] | { x?: number; y?: number; z?: number };
  normalX?: number;
  normalY?: number;
  normalZ?: number;
  [key: string]: unknown;
}

interface IIIFTarget {
  type?: string;
  source?: { id: string; type: string } | { id: string; type: string }[];
  selector?: IIIFSelector | IIIFSelector[];
}

interface IIIFAnnotation {
  id?: string;
  type: string;
  label?: IIIFLangMap;
  motivation: string | string[];
  body?: IIIFBody | IIIFBody[];
  target?: string | IIIFTarget | (string | IIIFTarget)[];
}

interface IIIFScene {
  type: string;
  backgroundColor?: string;
  items?: { type: string; items?: IIIFAnnotation[] }[];
}

interface IIIFManifest {
  type: string;
  items?: IIIFScene[];
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function firstLabel(label?: IIIFLangMap): string | undefined {
  if (!label) return undefined;
  const values = Object.values(label);
  return values.length > 0 && values[0].length > 0 ? values[0][0] : undefined;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function hasMotivation(anno: IIIFAnnotation, mot: string): boolean {
  return asArray(anno.motivation).includes(mot);
}

function asFiniteNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return undefined;
}

function isPointSelectorType(type: string): boolean {
  return type === 'PointSelector' || type.endsWith('PointSelector');
}

function selectorNormal(sel: IIIFSelector): [number, number, number] | undefined {
  let nx = asFiniteNumber(sel.nx ?? sel.normalX);
  let ny = asFiniteNumber(sel.ny ?? sel.normalY);
  let nz = asFiniteNumber(sel.nz ?? sel.normalZ);

  if (nx === undefined || ny === undefined || nz === undefined) {
    if (Array.isArray(sel.normal) && sel.normal.length >= 3) {
      nx = asFiniteNumber(sel.normal[0]);
      ny = asFiniteNumber(sel.normal[1]);
      nz = asFiniteNumber(sel.normal[2]);
    } else if (sel.normal && typeof sel.normal === 'object') {
      const n = sel.normal as { x?: unknown; y?: unknown; z?: unknown };
      nx = asFiniteNumber(n.x);
      ny = asFiniteNumber(n.y);
      nz = asFiniteNumber(n.z);
    }
  }

  if (nx === undefined || ny === undefined || nz === undefined) return undefined;
  return [nx, ny, nz];
}

function pointSelector(target: string | IIIFTarget | (string | IIIFTarget)[] | undefined)
    : { position: [number, number, number]; normal?: [number, number, number] } | undefined {
  for (const t of asArray(target)) {
    if (typeof t === 'string') continue;
    for (const sel of asArray(t.selector)) {
      if (!isPointSelectorType(sel.type)) continue;
      return {
        position: [sel.x ?? 0, sel.y ?? 0, sel.z ?? 0],
        normal: selectorNormal(sel)
      };
    }
  }
  return undefined;
}

function firstText(body?: IIIFBody | IIIFBody[]): string | undefined {
  for (const b of asArray(body)) {
    if (typeof b.value === 'string' && b.value.trim().length > 0) {
      return b.value;
    }
  }
  return undefined;
}

function firstBodyLabel(body?: IIIFBody | IIIFBody[]): string | undefined {
  for (const b of asArray(body)) {
    const l = firstLabel(b.label);
    if (l) return l;
  }
  return undefined;
}

function applyTransforms(
  transforms: IIIFTransform[],
  position: [number, number, number],
): { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] | number } {
  let pos: [number, number, number] = [...position];
  let rot: [number, number, number] = [0, 0, 0];
  let scale: [number, number, number] = [1, 1, 1];

  for (const t of transforms) {
    if (t.type === 'TranslateTransform') {
      pos = [pos[0] + (t.x ?? 0), pos[1] + (t.y ?? 0), pos[2] + (t.z ?? 0)];
    } else if (t.type === 'RotateTransform') {
      rot = [t.x ?? 0, t.y ?? 0, t.z ?? 0];
    } else if (t.type === 'ScaleTransform') {
      const sx = t.x ?? 1, sy = t.y ?? 1, sz = t.z ?? 1;
      scale = sx === sy && sy === sz ? [sx, sy, sz] : [sx, sy, sz];
    } else {
      console.warn(`[IIIFManifestParser] Unsupported transform type: ${t.type}`);
    }
  }

  // Uniform scale shorthand
  const finalScale: [number, number, number] | number =
    scale[0] === scale[1] && scale[1] === scale[2] ? scale[0] : scale;

  return { position: pos, rotation: rot, scale: finalScale };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts a IIIF Presentation API 4 manifest (containing a Scene) into a
 * ThreePresenter {@link SceneDescription}.
 *
 * Supported IIIF features:
 * - `type: "Model"` painting annotations → `ModelDefinition`
 * - `PointSelector` on the annotation target → `position`
 * - Non-painting point annotations → `SceneDescription.annotations` (label, text)
 * - Optional `PointSelector` normal (`nx,ny,nz` or `normal`) → `annotation.normal`
 * - `RotateTransform` on a SpecificResource body → `rotation` (degrees)
 * - `ScaleTransform` → `scale`
 * - `TranslateTransform` → added to `position`
 * - `backgroundColor` on the Scene → `environment.background`
 * - `label` on the Manifest or Model body → `title`
 *
 * Non-Model body types (Lights, Cameras, Audio) are silently skipped —
 * ThreePresenter will supply its own defaults.
 *
 * @param manifest - Parsed JSON object of a IIIF Manifest
 * @returns A {@link SceneDescription} ready to pass to `presenter.loadScene()`
 * @throws If the manifest is not a valid IIIF Manifest with at least one Scene
 *
 * @example
 * ```typescript
 * const res = await fetch('https://example.org/manifest.json');
 * const scene = parseIIIFManifest(await res.json());
 * await presenter.loadScene(scene);
 * ```
 */
export function parseIIIFManifest(manifest: unknown): SceneDescription {
  const m = manifest as IIIFManifest;

  if (m?.type !== 'Manifest')
    throw new Error('[IIIFManifestParser] Top-level type must be "Manifest"');

  const scene = asArray(m.items).find(i => i.type === 'Scene');
  if (!scene)
    throw new Error('[IIIFManifestParser] No Scene found in manifest.items');

  const models: ModelDefinition[] = [];
  const annotations: Annotation[] = [];
  const annotationIds = new Set<string>();

  for (const page of asArray(scene.items)) {
    for (const anno of asArray(page.items)) {
      if (hasMotivation(anno, 'painting')) {
        for (const body of asArray(anno.body)) {
          // Resolve the actual model source — body may be a direct Model or a
          // SpecificResource wrapping one.
          let modelId: string | undefined;
          let modelLabel: IIIFLangMap | undefined;
          let transforms: IIIFTransform[] = [];

          if (body.type === 'Model') {
            modelId = body.id;
            modelLabel = body.label;
          } else if (body.type === 'SpecificResource' && body.source?.type === 'Model') {
            modelId = body.source.id;
            modelLabel = body.source.label;
            transforms = body.transform ?? [];
          } else {
            // Light, Camera, AudioEmitter — skip
            continue;
          }

          if (!modelId) continue;

          const selector = pointSelector(anno.target);
          const basePos = selector?.position ?? [0, 0, 0];
          const { position, rotation, scale } = applyTransforms(transforms, basePos);

          const def: ModelDefinition = {
            id: `model_${models.length}`,
            file: modelId,
          };

          if (firstLabel(modelLabel)) def.title = firstLabel(modelLabel);
          if (position.some(v => v !== 0)) def.position = position;
          if (rotation.some(v => v !== 0)) { def.rotation = rotation; def.rotationUnits = 'deg'; }
          if (scale !== 1) def.scale = scale as [number, number, number];

          models.push(def);
        }
        continue;
      }

      const selector = pointSelector(anno.target);
      if (!selector) continue;

      const baseId = anno.id ?? `annotation_${annotations.length}`;
      let id = baseId;
      let i = 1;
      while (annotationIds.has(id)) {
        id = `${baseId}_${i++}`;
      }
      annotationIds.add(id);

      const label = firstLabel(anno.label) ?? firstBodyLabel(anno.body) ?? `Annotation ${annotations.length + 1}`;
      const text = firstText(anno.body);

      annotations.push({
        id,
        label,
        type: 'point',
        geometry: selector.position,
        normal: selector.normal,
        text
      });
    }
  }

  if (models.length === 0)
    console.warn('[IIIFManifestParser] No Model annotations found in the Scene');

  const sceneDesc: SceneDescription = { models };

  if (annotations.length > 0) {
    sceneDesc.annotations = annotations;
  }

  if (scene.backgroundColor)
    sceneDesc.environment = { background: scene.backgroundColor };

  return sceneDesc;
}
