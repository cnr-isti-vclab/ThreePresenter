# ThreePresenter

A framework-agnostic 3D viewer library built on Three.js.

## Overview

ThreePresenter is an independent, reusable 3D visualization library that provides:

- 🎨 Multi-format 3D model loading (GLB, PLY, OBJ, NXS)
- 📍 Annotation system (points, lines, areas)
- 📷 Camera controls (perspective/orthographic)
- 💡 Lighting & environment management
- 🎛️ UI controls builder
- 📸 Screenshot capture
- 🔧 Extensible architecture

## Features

### Core Capabilities
- Framework-agnostic (works with React, Vue, vanilla JS)
- TypeScript support with full type definitions
- Automatic model centering and scaling
- Interactive camera controls (OrbitControls)
- Environment lighting with HDRI support
- Ground plane with customizable grid

### Annotation System
- Point annotations with sphere markers
- Line annotations with connected paths
- Area annotations with filled polygons
- Click-to-pick 3D points
- Multi-selection support

### File Format Support
- GLB/GLTF (PBR materials)
- PLY (point clouds, meshes)
- OBJ (with MTL materials)
- NXS (Nexus multiresolution)

## Installation

### For Development (Bundler Projects)

Currently bundled with OCRA. Future: available on npm.

```bash
npm install three-presenter three
```

### For Browsers (No Build Tools)

After building, you can use the library directly in HTML:

**ES Modules (Modern):**
```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
  }
}
</script>

<script type="module">
  import { ThreePresenter } from './dist/three-presenter.es.js';
  const viewer = new ThreePresenter('viewer');
</script>
```

**UMD Bundle (Classic):**
```html
<script src="https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js"></script>
<script src="./dist/three-presenter.umd.js"></script>

<script>
  const { ThreePresenter } = window.ThreePresenter;
  const viewer = new ThreePresenter('viewer');
</script>
```

## Building the Library

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates:
- `dist/three-presenter.es.js` - ES module for bundlers
- `dist/three-presenter.umd.js` - UMD bundle for browsers
- `dist/index.d.ts` - TypeScript type definitions

## Quick Start

### Basic Usage

```typescript
import { ThreePresenter } from 'three-presenter';

// Create viewer
const viewer = new ThreePresenter(document.getElementById('viewer'));

// Load scene
await viewer.loadScene({
  projectId: 'my-project',
  models: [
    {
      id: 'model1',
      filename: 'model.glb',
      visible: true,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1
    }
  ],
  environment: {
    background: '#404040',
    groundVisible: true,
    hdriPath: 'environment.exr'
  }
});

// Control visibility
viewer.setModelVisibility('model1', false);

// Cleanup
viewer.dispose();
```

### Custom URL Resolver

```typescript
import { ThreePresenter, StaticBaseUrlResolver } from 'three-presenter';

const viewer = new ThreePresenter(
  container,
  new StaticBaseUrlResolver('https://cdn.example.com/models/')
);
```

### Annotations

```typescript
// Render annotations
viewer.getAnnotationManager().renderAnnotations([
  {
    id: 'point1',
    label: 'Feature A',
    type: 'point',
    geometry: [0, 1, 0],
    color: '#ff0000'
  }
]);

// Enable point picking
viewer.getAnnotationManager().setOnPointPicked((point) => {
  console.log('Picked point:', point);
});
```

## API Reference

See [API Documentation](../../docs/api/) for complete reference.

## Examples

See the `examples/` directory for standalone demos:
- `standalone.html` - ES module bundle (recommended) ⭐
- `umd.html` - UMD bundle (maximum compatibility)
- `basic.html` - Development mode with TypeScript source

To run examples:
```bash
# Build first
npm run build

# Then serve
npx serve

# Or for development
npm run dev
```

## Architecture

ThreePresenter uses a modular architecture:

```
src/
├── ThreePresenter.ts       # Main orchestrator
├── managers/               # Subsystems
│   ├── AnnotationManager.ts
│   ├── CameraManager.ts
│   ├── LightingManager.ts
│   └── ModelLoader.ts
├── ui/                     # UI components
│   └── UIControlsBuilder.ts
├── utils/                  # Utilities
│   └── GeometryUtils.ts
└── types/                  # Type definitions
```

## Development

### Setup
```bash
npm install
```

### Building
```bash
# Build ES and UMD bundles + type definitions
npm run build

# Watch mode (rebuilds on changes)
npm run dev
```

### Running Examples
```bash
# Development mode (with hot reload)
npm run dev
# Open http://localhost:5173/examples/basic.html

# Or with standalone examples (after build)
npx serve
# Open http://localhost:3000/examples/standalone.html
```

## License

MIT

## Credits

Developed by CNR-ISTI Visual Computing Lab for the OCRA project.
