# Line and Area Annotations

This guide explains the current annotation data model, creation/editing flow, rendering, and surface adaptation. It describes the working tree through commit `09e7092`, including the pending control-only visibility check, selected-area adaptation API, and detailed view-projection diagnostics. Check the installed version before relying on these pending changes.

Start with [Architecture](ARCHITECTURE.md) for the overall component structure. Runnable examples are [line and area editing](examples/11-line-creation.html) and [geodesic paths](examples/12-geodesic-pathing.html).

## Data and Coordinate Ownership

An annotation has an `id`, `label`, `type`, and `geometry`, with optional text and other metadata. Lines and areas store arrays of `[x, y, z]` positions. These positions are world coordinates, including the model transforms in effect when picked. There is no model ID, triangle ID, or barycentric attachment in this annotation representation.

The boundary has two possible representations:

| Field | Meaning |
| --- | --- |
| `geometry` | Vertices used to render the boundary. A plain line contains the user controls; an adapted line may contain many generated samples. |
| `surfacePath.controlVertices` | The sparse points explicitly placed or inserted by the user, retained when the rendered boundary follows a surface. |
| `surfacePath.mode` | `view-projected` or `mesh-geodesic`, identifying how the dense boundary was generated. |

For example, a line can have two user controls and dozens of generated samples. Its editable handles and adaptation visibility checks use those two controls. If `surfacePath` is absent, every vertex in `geometry` is treated as a control. The library cannot recover which vertices were generated if an application discards that metadata.

An area uses a closed boundary but stores the first vertex only once. Rendering closes the last-to-first edge. Surface projection temporarily appends the first control to sample that edge, then removes the duplicated endpoint from storage.

The detailed contract is in [AnnotationTypes.ts](../src/types/AnnotationTypes.ts). A second annotation interface in [SceneTypes.ts](../src/types/SceneTypes.ts), currently exported as `Annotation` at the package root, lacks `surfacePath`. This is a current type-contract gap. Preserve `surfacePath` through application storage and callbacks even when a narrower scene type does not describe it.

## Creation and Application State

`setAnnotationCreationMode('line')` or `setAnnotationCreationMode('area')` enables drawing. Single clicks on the model add controls. Pointer movement updates a preview. Double-click or Enter completes a valid draft; Escape discards it. A line needs at least two controls. An area needs at least three distinct, non-collinear controls.

Completion emits `onAnnotationGeometryCreated(type, geometry, surfacePath)`. It does not automatically add a permanent annotation record. The application assigns an ID and supplies the updated annotation collection to `AnnotationManager.render()`. Drawing mode remains active until the application calls `setAnnotationCreationMode(null)` or changes modes.

`setLineSurfaceFollowEnabled(true)` applies to newly started line and area drafts. The shared draft code projects their segments onto the current visible model surface. Toggling it does not retroactively adapt existing annotations or change the setting captured by a draft already in progress.

The host should retain created records and updated records together:

```javascript
const annotations = [];
const manager = presenter.getAnnotationManager();
let nextId = 0;

presenter.onAnnotationGeometryCreated = (type, geometry, surfacePath) => {
  annotations.push({
    id: `annotation-${++nextId}`,
    label: type,
    type,
    geometry,
    surfacePath
  });
  manager.render(annotations);
};

manager.onAnnotationUpdated((updated) => {
  const index = annotations.findIndex(({ id }) => id === updated.id);
  if (index !== -1) annotations[index] = updated;
});
```

`render()` replaces the manager's annotation collection with copies and updates its markers. The manager edits its own data and publishes cloned updates. If the host fails to retain those updates, its next `render()` call can restore old geometry. `presenter.getState()` does not save these records. Persistent storage, IDs, undo history, and collaboration are host responsibilities.

## Selection and Editing

Normal interaction selects an annotation; Ctrl/Cmd supports multiple selection. Selected boundaries expose handles at the control vertices. Editing requires `setAnnotationEditingEnabled(true)` and appropriate selection; creation mode takes precedence over normal selection/edit gestures.

Dragging a handle raycasts onto the model surface and temporarily locks camera navigation. The manager captures the annotation at drag start. A completed edit publishes the updated record, while Escape restores the captured geometry. Double-clicking a boundary segment inserts a control; Delete/Backspace removes a selected control. Insertion on a dense rendered boundary is mapped back to the corresponding control interval.

Deletion preserves a minimum of two controls for a line and three for an area. Area edits also reject duplicate or wholly collinear controls. These checks are not a complete validity test for self-intersections, polygon holes, or arbitrary nonplanar regions.

Editing a `view-projected` boundary regenerates its sampled path using the current camera. Editing a `mesh-geodesic` boundary currently resets it to straight control geometry and clears `surfacePath`; the user must explicitly recompute the geodesic. Automatic view-path regeneration during editing does not use the same explicit visibility precheck as the Adapt button.

## View and Geodesic Adaptation

Both operations preserve user controls while replacing rendered boundary samples. They require editing to be enabled and exactly one matching annotation selected. Successful adaptation emits an annotation update for the host to retain.

### Adapt to the current view

Use `adaptSelectedLineToCurrentView()` for a line or `adaptSelectedAreaToCurrentView()` for a closed area boundary. The latter is a pending working-tree addition.

The current algorithm is:

1. Obtain the user controls from `surfacePath.controlVertices`, or from `geometry` for a plain boundary.
2. Verify that each control lies in the camera view and is not behind the first model-surface hit, allowing a small depth tolerance.
3. Project each adjacent control pair into screen space. Include last-to-first for an area.
4. Sample between those projections and raycast the front-most model surface. Sample spacing is approximately eight screen pixels, capped at 256 intervals per segment.
5. Store the resulting world-space samples while retaining the original controls and their exact endpoint positions.

For a single segment made with two clicks, only its two endpoints participate in the visibility precheck. For a polyline, each user control is an endpoint of one or more segments. Generated internal samples are excluded from this check in the current working tree.

When an intermediate ray misses the surface, the current implementation uses a straight interpolated fallback. It does not reject depth jumps, and it does not guarantee that the path follows one connected surface. Paths can cross silhouettes, gaps, or front-surface changes. This is a projection from the camera, not a shortest-path computation.

The public methods return a boolean. A false result can mean invalid selection, editing disabled, unavailable projection, or a rejected visibility check. The pending `getLastViewAdaptationFailure()` exposes the last projection diagnosis, including an off-camera control or its depth behind a visible surface. It is not a comprehensive structured result for every manager-level failure; callers should check selection and editing separately. Its stored message also describes the last projection attempt, so it should not be treated as persistent annotation state.

### Adapt to a mesh geodesic

`await adaptSelectedLineToGeodesic()` computes an approximate path between each adjacent control pair using the geometry worker and WASM backend. It uses a world-space snapshot of visible triangle meshes. It does not require controls to be visible from the camera. The backend snaps query endpoints to nearby triangles; the presenter preserves the user controls as the stored path endpoints.

This operation currently supports lines. Area adaptation uses the view-projection path; there is no corresponding selected-area geodesic API. A geodesic line is also not the same as the two-click measurement tool, which displays straight Euclidean distance.

The asynchronous adaptation verifies selection/editing state and unchanged controls before applying its result. Worker preparation and path computation may throw, so callers should use `try/catch`. See [example 12](examples/12-geodesic-pathing.html) and [WASM notes](../wasm/README.md).

## Boundary Rendering

`AnnotationManager` uses Three.js wide-line primitives for screen-space line widths. The rendered boundary includes a contrast stroke, a visible stroke, a separate dashed pass for portions behind the model, hit geometry for selection, and editable control handles. Area boundaries share these mechanisms.

Dashed internal sections are a depth visualization. Their presence does not by itself invalidate adaptation when the user controls are visible. Checking all dense vertices would prevent a line from being adapted precisely when a new view needs a different set of surface samples; commit `45f403f` originally used that stricter check, and the pending change limits it to controls.

`setAnnotationsVisible(false)` hides annotations and removes them from annotation picking targets while retaining their records and selection.

## Area Interior Rendering

Areas currently combine a closed boundary with experimental camera-dependent interior rendering. The boundary is the stored annotation; fill triangles and clipping volumes are derived render objects.

| Representation | Construction and purpose |
| --- | --- |
| Mesh-sampled fill | Projects the boundary into the current camera, samples a bounded grid inside it, raycasts the model, and triangulates cells whose corners have hits. |
| Projected-boundary fill | Fallback: triangulates the 2D projected boundary and uses the corresponding 3D boundary vertices. It can span curved surfaces or gaps. |
| Clip volume and stencil overlay | Extrudes the projected boundary through a model-derived camera depth range, then overlays model fragments using the stencil buffer. |

The sampled fill is preferred when available; the fallback is used if sampling cannot produce geometry. The stencil overlay is an additional rendering pass, and the sampled fill may remain visible with it.

Camera movement changes the projected region. The presenter refreshes clip volumes, temporarily hides surface fills, and schedules a fill rebuild after a 120 ms pause in camera changes. Depth ranges are cached and refreshed to reduce flicker and expensive repeated raycasts. This behavior was introduced incrementally by the area-rendering commits below.

These interiors are not durable selections of mesh triangles. They can change with the camera, are limited by sampling density, and may span disconnected depth layers. They do not provide an area value, exact surface coverage, or a general polygon-with-holes model. Persist the boundary/control data, not the generated fill or clip geometry.

## Diagnostics and Verification

Enable diagnostics with `debug: true` at construction or `setDebugEnabled(true)`. The bug-button menu controls statistics/timings, orange view-path samples, cyan geodesic samples, magenta geodesic controls, and area triangulation. Enabling debug after an operation may require repeating that operation to generate its path overlay.

The Node tests exercise draft handling, selection/edit guards, insertion/deletion, surface controls, clipping utilities, and worker geometry. Browser checks are still needed for screen-space picking, occlusion tolerance, stencil behavior, and camera-dependent fills. Reproduce failures with a known control count and confirm that the browser is loading the current bundle before interpreting sample indices.

## Implementation Map and History

- [AnnotationManager.ts](../src/managers/AnnotationManager.ts): copies/selection, drafts, control access, editing, path application, and marker geometry.
- [InputController.ts](../src/managers/InputController.ts): gestures, raycasts, keyboard actions, and camera-lock callbacks.
- [ThreePresenter.ts](../src/ThreePresenter.ts): integration, model-surface projectors, area rendering, and worker orchestration.
- [AreaGeometry.ts](../src/utils/AreaGeometry.ts): projected triangulation and clip-volume construction.
- [Geometry worker](../src/geometry/GeometryWorkerClient.ts): asynchronous surface-path requests.

| Commit | Why the behavior exists |
| --- | --- |
| `639bd65` | Added shared geometry-creation modes, transient line drafts, completion/cancellation, and callbacks. |
| `cbf0186` | Added selected-line vertex handles and surface dragging. |
| `bde0151` | Added insertion/deletion, edit snapshots, and cancellation. |
| `6b0b255` | Added a dashed depth pass so occluded boundary sections remain interpretable. |
| `aa8f410` | Extended shared drawing/editing to closed areas and introduced projected fill plus stencil clipping. |
| `b4d3a22` | Restricted clip depth using model-derived samples. |
| `bd91c7e` | Added mesh-sampled interior fill alongside the clip overlay. |
| `573a62f` | Cached depth ranges and delayed fill refresh to reduce flicker during camera changes. |
| `45f403f` | Added annotation visibility and explicit selected-line adaptation while preserving controls. |
| `09e7092` | Added approximate mesh geodesics and diagnostic overlays. |
| Pending working-tree changes | Limit explicit view-adaptation visibility checks to controls; add selected-area adaptation, detailed projection errors, and example controls. |

These references come from local Git commit subjects and bodies; `git show <hash>` provides the associated implementation changes.
