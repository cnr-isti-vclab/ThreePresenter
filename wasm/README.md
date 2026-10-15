# Geometry WebAssembly Core

This directory builds the VCGlib geometry-processing core used by
ThreePresenter's Web Worker. It currently computes approximate surface paths
on one indexed triangle mesh.

```bash
npm run build:geometry-wasm
npm run test:geometry-wasm
npm run benchmark:geometry-wasm -- 100
```

The build uses Emscripten on `PATH`, then the SDK at `EMSDK_DIR` (default
`/private/tmp/threepresenter-emsdk`), otherwise the pinned
`emscripten/emsdk:3.1.64` Docker image. CMake fetches the pinned VCGlib commit
and writes the generated JavaScript and WebAssembly files to
`src/geometry/generated/`. Set `VCGLIB_SOURCE_DIR` to use an existing local
VCGlib checkout.

The generated artifacts are `threepresenter-geometry.js` (Emscripten loader)
and `threepresenter-geometry.wasm` (compiled C++). The accompanying
`threepresenter-geometry.d.ts` is maintained manually. The C interface uses
the `threepresenter_` prefix and is consumed by the geometry worker; it has
no dependency on OCRA application code. Rebuild the WASM explicitly after
changing C++; `npm run build` and `npm run dev` reuse the generated artifacts.

The worker keeps one static mesh in memory. `ThreePresenter` can lazily flatten
its visible triangle meshes into a world-space snapshot and compute approximate
paths through arbitrary control points; endpoints are snapped to the nearest
surface triangles. Nexus streaming meshes, annotation replacement, and
persistence are not yet part of this boundary.
