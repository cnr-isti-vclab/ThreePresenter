# ThreePresenter Examples

Simple standalone examples demonstrating ThreePresenter API usage.

## Quick Start

### 1. Build the library first
```bash
cd ..
npm install
npm run build
```

This creates:
- `dist/three-presenter.es.js` - ES module (for modern bundlers)
- `dist/three-presenter.umd.js` - UMD bundle (works in browsers)
- `dist/index.d.ts` - TypeScript definitions

### 2. View the examples

**Standalone examples** (work directly in browser with a simple server):
- `standalone.html` - ES module version ⭐ Recommended
- `umd.html` - UMD version (maximum compatibility)

Just open them with a simple server:
```bash
npx serve
```

**Development example** (requires dev server):
- `basic.html` - Imports TypeScript source directly (needs Vite)

For the dev example, run:
```bash
cd ..
npm run dev
# Then open: http://localhost:5173/examples/basic.html
```

## Examples

### 1. Standalone Example (`standalone.html`)

Modern ES module approach - works directly in browsers after build.

**Features:**
- ✅ No build tools needed (just open in browser with simple server)
- 🎮 Uses ES modules with import maps
- 📦 Loads from compiled `dist/` folder

### 2. UMD Example (`umd.html`)

Classic `<script>` tag approach for maximum compatibility.

**Features:**
- ✅ Works everywhere (even older browsers)
- 📦 Global variable access (`window.ThreePresenter`)
- 🔧 Perfect for simple projects or legacy codebases

### 3. Basic Example (`basic.html`)

Development mode - imports TypeScript source directly.

**Features:**
- 🎮 Interactive 3D viewer (drag to rotate, scroll to zoom)
- 📦 Declarative scene loading with `loadScene()`
- 🔧 Uses default `./assets` folder (no configuration needed)
- ✨ Model visibility control and stats retrieval

**Note:** Requires Vite dev server for TypeScript compilation.

## Usage Patterns

### ES Module (Modern)
```html
<script type="module">
  import { ThreePresenter } from '../dist/three-presenter.es.js';
  const viewer = new ThreePresenter('viewer');
</script>
```

### UMD (Classic)
```html
<script src="../dist/three-presenter.umd.js"></script>
<script>
  const { ThreePresenter } = window.ThreePresenter;
  const viewer = new ThreePresenter('viewer');
</script>
```

## File Structure

```
examples/
├── README.md           # This file
├── basic.html          # Development mode (TypeScript source)
├── standalone.html     # ES module bundle ⭐
├── umd.html           # UMD bundle
└── assets/
    └── venus.glb      # 3D model
```

## Coming Soon

- `advanced.html` - Annotations and custom UI controls
- `custom-resolver.html` - Custom file URL resolvers
- `react-example.tsx` - React integration

---

These examples are **standalone** and don't depend on the OCRA application.
