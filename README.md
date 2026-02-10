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
npm run dev      # Watch src/ + auto-rebuild + serve at localhost:5173
npm run build    # Build library for npm
npm run deploy   # Build everything for GitHub Pages
```

View examples at `http://localhost:5173/docs/` while `npm run dev` is running.

## Deployment

```bash
npm run deploy           # Build library + generate docs + prepare docs/dist
git add . && git push    # Deploy to GitHub Pages
```

## License

MIT • Developed by CNR-ISTI Visual Computing Lab
