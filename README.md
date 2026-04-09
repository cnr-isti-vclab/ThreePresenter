# ThreePresenter

A framework-agnostic 3D viewer built on Three.js for Cultural Heritage and scientific web applications. 

The library provides a simple high-level API for loading, visualizing, and showing 3D models in the browser, with a focus on ease of use, integration,  and extensibility. It supports multiple 3D formats, IIIF 3D, camera controls, lighting, and 3D annotations. 

OCRA is developed within the frame of the [ECHOES project](https://www.echoes-eccch.eu/).



[API Documentation](https://cnr-isti-vclab.github.io/ThreePresenter/api/) • [Live Examples](https://cnr-isti-vclab.github.io/ThreePresenter/)

## Quick Start

```bash
npm install three-presenter three
```

```javascript
import { ThreePresenter, StaticBaseUrlResolver } from 'three-presenter';

const viewer = new ThreePresenter({ 
  mount: 'viewer',  // or HTMLDivElement
  fileUrlResolver: new StaticBaseUrlResolver('./assets')
});

await viewer.loadScene({
  models: [{ id: 'model', file: 'model.glb' }],
  environment: { showGround: true }
});
```

**Optional UI Controls:**

```javascript
import { DefaultUI } from 'three-presenter';
const ui = new DefaultUI(viewer);
ui.setButtonVisible('home', true);
ui.setButtonVisible('screenshot', true);
```

## Development

Once you have cloned the repository, install dependencies and start the development server with:  
```bash
npm install
npm run dev      # Watch src/ + auto-rebuild + serve at localhost:8080
```
Other available commands:
```bash
npm run build    # Build library for npm
npm run build:docs   # Build library + refresh docs/dist + examples.json
npm run serve:docs   # Serve docs locally at localhost:8080
npm run deploy   # Build everything for GitHub Pages
npm run smoke    # Build + run smoke asset checks
```
View examples at `http://localhost:8080/docs/` while `npm run dev` is running.

### Deployment to GitHub Pages
It is done automatically by GitHub Action on push to the main branch.

### Deployment to npm
Make sure to update the version in `package.json` before publishing.
```bash
npm run build    # Build library for npm
npm publish       # Publish to npm registry
```
## Folder Structure
- `src/`: Source code for the ThreePresenter library.
- `docs/`: root of the website deployed onto github.io by github actions; it contains the generated API documentation (docs/api) and the sources of the examples ( [docs/examples/](https://github.com/cnr-isti-vclab/ThreePresenter/tree/main/docs/examples) that will appear on the website). 
- `dist/`: Compiled library for npm and GitHub Pages (gitignored).
- `assets/`: Sample models and textures for examples.

## License

MIT • Developed by CNR-ISTI Visual Computing Lab
