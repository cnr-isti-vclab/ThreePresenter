# ThreePresenter

A framework-agnostic 3D viewer library built on Three.js. 
It aims to provide easy integration of 3D model visualization and annotation capabilities into web applications.
It offers:

- Multi-format 3D model loading (GLB, PLY, OBJ, NXS)
- Annotation system (points, lines, areas)
- Basic Camera controls (perspective/orthographic)

## Features

### Core Capabilities
- Framework-agnostic (works with React, Vue, vanilla JS)
- TypeScript support with full type definitions
- Automatic model centering and scaling
- Standard Interactive camera controls (Turntable, Zoom, Pan, Double click Recentering)
- Environment lighting with HDRI support
- Ground plane with customizable grid with reference scale and shadow.

### Annotation System
- Point annotations with sphere markers
 
### File Format Support
- GLB/GLTF (PBR materials)
- PLY (point clouds, meshes)
- OBJ (with MTL materials)
- NXS (Nexus multiresolution)

## Installation

### For Development (Bundler Projects)
API Reference is available at:
https://cnr-isti-vclab.github.io/ThreePresenter/api/index.html

### Example Projects
See the `examples/` folder for working demos:



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
# Build ES module + type definitions
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
