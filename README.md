# ThreePresenter

A framework-agnostic 3D viewer library built on Three.js for web applications.

**Features:** Multi-format model loading (GLB, PLY, OBJ, NXS) • Point annotations • Camera controls • HDRI lighting • Ground plane with scale indicator

[API Documentation](https://cnr-isti-vclab.github.io/ThreePresenter/api/) • [Live Examples](https://cnr-isti-vclab.github.io/ThreePresenter/)

## Quick Start

```bash
npm install three-presenter three
```

```javascript
import { ThreePresenter } from 'three-presenter';

const viewer = new ThreePresenter({ mount: 'viewer' });
await viewer.loadScene({
  models: [{ id: 'model', file: 'model.glb' }],
  environment: { showGround: true }
});
```

## Development

```bash
npm install
npm run dev          # Start dev server at localhost:5173
npm run build        # Build library
npm run build:demo   # Build + copy to docs/dist for examples
```

View examples at `http://localhost:5173/docs/examples/`

## GitHub Pages Deployment

```bash
./setup-demo.sh              # Build library + setup docs
npm run serve                # Test locally at localhost:3000
git add docs/ && git push    # Deploy (enable Pages in repo settings)
```

## License

MIT • Developed by CNR-ISTI Visual Computing Lab
