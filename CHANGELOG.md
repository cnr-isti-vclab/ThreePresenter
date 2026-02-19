# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.2]: https://github.com/cnr-isti-vclab/ThreePresenter/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/cnr-isti-vclab/ThreePresenter/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/cnr-isti-vclab/ThreePresenter/releases/tag/v0.1.0
