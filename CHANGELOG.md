# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Restored OBJ model support in `ModelLoader` (`.obj` detection and parsing).
- `EnvironmentSettings.headLightOffset` typed support and runtime application in `ThreePresenter`.
- `DefaultUI` light-position button now cycles practical headlight presets.
- New smoke asset bundle under `docs/assets/smoke/` and demo page `08-obj-textured.html`.
- `npm run smoke:assets` and `npm run smoke` commands for quick smoke validation.
- `npm run build:docs` and `npm run serve:docs` commands for local docs testing.
- `MeasurementManager` with modal two-click distance measuring (`line + label + point markers`).
- New `10-measurements.html` example and `measure` button support in `DefaultUI`.
- Annotation payload now supports optional `text` and optional `normal` metadata.
- `parseIIIFManifest()` now extracts non-painting point annotations (label/text/position) and maps optional point normals from IIIF selectors.

### Fixed
- `DefaultUI` now correctly unregisters the `fullscreenchange` listener in `dispose()`.
- OBJ loader now resolves `mtllib` references, so `OBJ + MTL + texture` assets load correctly.
- `npm run build` now regenerates `docs/examples/examples.json` to avoid missing examples metadata in local preview.
- Examples page now resolves `examples.json` robustly across local and GitHub Pages paths.

## [0.1.2] - 2026-02-19

### Added
- `parseIIIFManifest()` — converts a IIIF Presentation API 4 manifest (containing a `Scene`) into a `SceneDescription`, supporting `Model` annotations, `PointSelector` positions, `RotateTransform`/`ScaleTransform`/`TranslateTransform`, and `backgroundColor`.
- Example `06-iiif-manifest.html` — pure client-side demo loading the IIIF/3d astronaut manifest directly from GitHub.

## [0.1.1] - 2025-02-01

### Added
- Nexus multiresolution streaming support (`nxs`/`nxz`) via `nexus3d`.
- `ScaleIndicator` — checkerboard ruler on the ground plane with configurable units and size.
- `DefaultUI` — standalone overlay with home, light, env, screenshot, camera, annotation, and fullscreen buttons.
- Interactive examples viewer at `docs/examples/` with live source code display and sidebar navigation.
- `StaticBaseUrlResolver` for resolving relative model paths against a base URL.
- Corto decoder worker bundled in `docs/`.


## [0.1.0] - 2025-01-01

### Added
- Initial release.
- `ThreePresenter` — main controller managing scene, camera, renderer, lighting, and model loading.
- Model loading for GLB, GLTF (with Draco), PLY, OBJ formats.
- `CameraManager`, `LightingManager`, `ModelLoader`, `InputController`, `RenderLoop`, `AnnotationManager`.
- `SceneDescription` / `ModelDefinition` JSON-driven scene configuration.
- Three.js viewport gizmo integration.
- GitHub Pages deployment via GitHub Actions.

[Unreleased]: https://github.com/cnr-isti-vclab/ThreePresenter/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/cnr-isti-vclab/ThreePresenter/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/cnr-isti-vclab/ThreePresenter/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/cnr-isti-vclab/ThreePresenter/releases/tag/v0.1.0
