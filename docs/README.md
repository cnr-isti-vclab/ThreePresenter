# ThreePresenter Demo Site

This folder contains the GitHub Pages demo site for ThreePresenter.

## Structure

```
docs/
├── index.html          # Main demo page
├── dist/               # Built library files (copied from ../dist/)
│   ├── three-presenter.umd.js
│   ├── three-presenter.es.js
│   └── index.d.ts
└── assets/            # 3D model files
    └── venus.glb
```

## Setup for GitHub Pages

### 1. Build the library

```bash
cd ..
npm run build
```

### 2. Copy built files to docs/dist/

```bash
cp -r dist/* docs/dist/
```

### 3. Add your 3D models

Copy your `.glb`, `.ply`, or other model files to `docs/assets/`

### 4. Enable GitHub Pages

1. Go to your repo on GitHub
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main`
5. Folder: `/docs`
6. Save

### 5. Access your demo

Your demo will be live at:
```
https://cnr-isti-vclab.github.io/ThreePresenter/
```

## Updating the Demo

Whenever you make changes:

```bash
# 1. Build the library
npm run build

# 2. Copy to docs
cp -r dist/* docs/dist/

# 3. Commit and push
git add docs/
git commit -m "Update demo"
git push
```

GitHub Pages will automatically rebuild in a few minutes.

## Local Testing

Before pushing, test locally:

```bash
npx serve docs
```

Open http://localhost:3000

## Automation (Optional)

Add this to your package.json scripts:

```json
{
  "scripts": {
    "build:demo": "npm run build && cp -r dist/* docs/dist/",
    "serve:demo": "serve docs"
  }
}
```

Then just run:
```bash
npm run build:demo
npm run serve:demo
```
