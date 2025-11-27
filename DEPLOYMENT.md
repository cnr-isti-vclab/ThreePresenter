# Deployment Guide

This guide explains how to build and deploy ThreePresenter for different use cases.

## Building for Production

```bash
npm install
npm run build
```

This creates three key files in `dist/`:
- **`three-presenter.es.js`** - ES module for modern bundlers (Vite, Webpack, etc.)
- **`three-presenter.umd.js`** - UMD bundle for direct browser usage
- **`index.d.ts`** - TypeScript type definitions

## Deployment Options

### Option 1: NPM Package (Recommended for Libraries)

For publishing to npm:

```bash
# Update version in package.json
npm version patch  # or minor, major

# Publish to npm
npm publish
```

Users can then:
```bash
npm install three-presenter three
```

```javascript
import { ThreePresenter } from 'three-presenter';
```

### Option 2: CDN (Easiest for End Users)

After publishing to npm, users can load directly from CDN:

**ES Module:**
```html
<script type="module">
  import { ThreePresenter } from 'https://cdn.jsdelivr.net/npm/three-presenter/dist/three-presenter.es.js';
  // or
  import { ThreePresenter } from 'https://unpkg.com/three-presenter/dist/three-presenter.es.js';
</script>
```

**UMD:**
```html
<script src="https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three-presenter/dist/three-presenter.umd.js"></script>
```

### Option 3: Local Files (Simple Projects)

For users who want to download and use locally:

1. **Download the library:**
   - Copy the entire `dist/` folder
   - Or just the files you need

2. **Include in HTML:**
   ```html
   <!-- ES Module -->
   <script type="module">
     import { ThreePresenter } from './path/to/three-presenter.es.js';
   </script>
   
   <!-- OR UMD -->
   <script src="./path/to/three-presenter.umd.js"></script>
   ```

### Option 4: Direct Distribution

Create a zip file for download:

```bash
npm run build
cd dist
zip -r three-presenter-v0.1.0.zip .
```

Users can:
1. Download and extract the zip
2. Include the appropriate file in their HTML
3. No build tools required!

## For Different Use Cases

### React/Vue/Svelte Projects
Users should install via npm and import:
```javascript
import { ThreePresenter } from 'three-presenter';
```

### Vanilla JavaScript (No Bundler)
Use the UMD bundle:
```html
<script src="three-presenter.umd.js"></script>
<script>
  const viewer = new ThreePresenter.ThreePresenter('viewer');
</script>
```

### Modern JavaScript (ES Modules)
Use the ES module:
```html
<script type="module">
  import { ThreePresenter } from './three-presenter.es.js';
</script>
```

### TypeScript Projects
Types are included automatically when installed via npm.

## File Size Optimization

The library is small (~50-100KB) because it uses Three.js as a peer dependency.

**Users must include Three.js separately:**
```html
<!-- From CDN -->
<script src="https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js"></script>

<!-- OR in package.json -->
{
  "dependencies": {
    "three": "^0.180.0"
  }
}
```

## Distribution Checklist

Before publishing:
- [ ] Update version in `package.json`
- [ ] Run `npm run build`
- [ ] Test examples in `examples/` folder
- [ ] Update CHANGELOG.md
- [ ] Create git tag: `git tag v0.1.0`
- [ ] Push to GitHub: `git push --tags`
- [ ] Publish to npm: `npm publish`

## Server Requirements

### For Examples
The example HTML files work with any static file server:

```bash
# Option 1: npx serve
npx serve

# Option 2: Python
python -m http.server 8000

# Option 3: Node.js http-server
npx http-server
```

**Note:** You need a server (not just opening `file://`) because:
- ES modules require HTTP/HTTPS protocol
- CORS restrictions on local files

### For Production
Any static hosting works:
- GitHub Pages
- Netlify
- Vercel
- S3 + CloudFront
- Any web server (Apache, Nginx, etc.)

## Quick Test

After building, test it works:

```bash
# Build
npm run build

# Serve examples
npx serve

# Open in browser
# http://localhost:3000/examples/standalone.html
```

You should see the 3D viewer with no build tools needed!
