# Geometry WebAssembly Core

This directory builds the VCGlib geometry-processing core used by
ThreePresenter's Web Worker. It currently computes approximate surface paths
on one indexed triangle mesh.

```bash
npm run build:geometry-wasm
npm run test:geometry-wasm
npm run benchmark:geometry-wasm -- 100
```

The build uses a local Emscripten installation when available, otherwise the
pinned `emscripten/emsdk:3.1.64` image. CMake fetches the pinned VCGlib commit
and writes the generated JavaScript and WebAssembly files to
`src/geometry/generated/`. Set `VCGLIB_SOURCE_DIR` to use an existing local
VCGlib checkout.

The worker keeps one static mesh in memory. `ThreePresenter` can lazily flatten
its visible triangle meshes into a world-space snapshot and compute approximate
paths through arbitrary control points; endpoints are snapped to the nearest
surface triangles. Nexus streaming meshes, annotation replacement, and
persistence are not yet part of this boundary.
