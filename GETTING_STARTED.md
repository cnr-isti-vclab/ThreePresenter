# Getting Started with ThreePresenter

The **easiest way** to use ThreePresenter in your project.

## For Complete Beginners

If you just want to add a 3D viewer to your website:

### 1. Download the files

After someone builds the library, you'll get a `dist/` folder. Copy these files to your project:
- `three-presenter.js` (the ES module library)
- `index.d.ts` (optional, for TypeScript)

### 2. Create your HTML file

```html
<!DOCTYPE html>
<html>
<head>
  <title>My 3D Viewer</title>
  <!-- Bootstrap for UI buttons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
  
  <style>
    body { margin: 0; }
    #viewer { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="viewer"></div>

  <!-- Import maps for Three.js -->
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
      }
    }
  </script>
  
  <!-- Load ThreePresenter as ES module -->
  <script type="module">
    import { ThreePresenter } from './three-presenter.js';

    // Create viewer
    const viewer = new ThreePresenter('viewer');

    // Load your 3D model
    viewer.loadScene({
      models: [{
        id: 'my-model',
        file: 'my-model.glb',  // Put your .glb file in the same folder
      }],
      environment: {
        showGround: true
      }
    });
  </script>
</body>
</html>
```

### 3. Put your 3D model

Create an `assets/` folder next to your HTML file and put your `.glb` file there.

### 4. Open it

You need a simple web server (can't just double-click the HTML file):

```bash
# Easy option: use npx
npx serve

# Or Python
python -m http.server 8000

# Or Node.js
npx http-server
```

Then open `http://localhost:3000` in your browser.

## For Developers with Build Tools

If you're using React, Vue, or any modern framework:

### 1. Install via npm
```bash
npm install three-presenter three
```

### 2. Import and use
```javascript
import { ThreePresenter } from 'three-presenter';

const viewer = new ThreePresenter('viewer');
await viewer.loadScene({
  models: [{ id: 'model', file: 'model.glb' }]
});
```

## Supported 3D Formats

- **GLB/GLTF** - Best for most models (recommended)
- **PLY** - Point clouds and scanned meshes
- **OBJ** - Classic format (with .mtl for materials)
- **NXS** - Multiresolution models

## Basic Controls

Once loaded:
- **Drag** to rotate
- **Scroll** to zoom
- **Right-drag** to pan
- Use the **buttons** (home, lighting, camera, etc.)

## Need Help?

Check the `examples/` folder for working demos:
- `standalone.html` - Modern ES modules
- `basic.html` - Development mode

## Common Issues

**"Can't load model"**
- Make sure your model file is in the `assets/` folder
- Check browser console for errors
- Verify file path is correct

**"Blank screen"**
- Did you include Three.js before ThreePresenter?
- Are you using a web server (not file://)?
- Check browser console for errors

**"UI buttons don't show"**
- Include Bootstrap CSS and Icons (see HTML example above)
