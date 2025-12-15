# ThreePresenter Examples

Self-contained, standalone HTML examples demonstrating ThreePresenter API usage.

## Quick Start

### 1. Build the library first
```bash
cd ..
npm install
npm run build
```

This creates `dist/three-presenter.js` - ES module ready for browsers.

### 2. View the examples

Start a local server:
```bash
npx serve
# Open: http://localhost:3000/examples/
```

Or use any simple HTTP server.

## Examples

### Example 1: Minimal (`01-minimal.html`) ⭐

The absolute minimum code to load a 3D model.

**Features:**
- ✅ Just 10 lines of JavaScript
- 📦 Single model loading
- 🎮 Default camera controls

**Perfect for:** Getting started, embedding in existing pages

---

### Example 2: All UI Controls (`02-all-controls.html`)

Shows all available UI buttons and controls.

**Features:**
- 🏠 Home (reset camera)
- 💡 Lighting toggle
- 🌍 Environment lighting
- 📸 Screenshot capture
- 📦 Camera mode (perspective/orthographic)
- 📍 Annotation mode

**Perfect for:** Learning available features, UI customization

---

### Example 3: PLY with Material (`03-ply-material.html`)

Demonstrates loading PLY files with custom material properties.

**Features:**
- 🎨 Material property overrides (color, metalness, roughness)
- 📦 PLY format support
- 🔄 Fallback handling

**Perfect for:** Point clouds, custom styling, material workflows

## Code Snippets

### Minimal Setup
```javascript
import { ThreePresenter } from '../dist/three-presenter.js';
const presenter = new ThreePresenter('viewer');
presenter.loadScene({
  models: [{ id: 'model', file: 'venus.glb' }]
});
```

### With Material Override
```javascript
presenter.loadScene({
  models: [{
    id: 'model',
    file: 'bunny.ply',
    material: {
      color: '#ff4444',
      metalness: 0.2,
      roughness: 0.7
    }
  }]
});
```

### Enable UI Controls
```javascript
presenter.loadScene({ /* ... */ }).then(() => {
  presenter.setButtonVisible('home', true);
  presenter.setButtonVisible('light', true);
  presenter.setButtonVisible('screenshot', true);
});
```

## File Structure

```
examples/
├── README.md              # This file
├── 01-minimal.html        # Minimal example ⭐
├── 02-all-controls.html   # All UI buttons
├── 03-ply-material.html   # PLY + custom material
├── basic.html             # (Legacy dev mode)
├── standalone.html        # (Legacy standalone)
└── assets/
    └── venus.glb          # Sample 3D model
```

## Requirements

- Modern browser with ES module support
- Simple HTTP server (examples won't work with `file://` protocol)
- Built library (`npm run build`)

---

**All examples are self-contained** and work independently of the OCRA application.

