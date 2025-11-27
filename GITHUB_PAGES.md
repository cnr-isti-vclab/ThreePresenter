# GitHub Pages Setup - Quick Guide

## TL;DR

```bash
# 1. Build and setup demo
./setup-demo.sh

# 2. Test locally
npm run serve:demo

# 3. Push to GitHub
git add docs/
git commit -m "Add GitHub Pages demo"
git push

# 4. Enable in GitHub Settings → Pages → Source: main, /docs
```

Your site will be live at: `https://cnr-isti-vclab.github.io/ThreePresenter/`

---

## Detailed Steps

### Initial Setup (One Time)

1. **Build the library and demo:**
   ```bash
   ./setup-demo.sh
   ```

2. **Test locally:**
   ```bash
   npm run serve:demo
   # Open http://localhost:3000
   ```

3. **Add your 3D model:**
   ```bash
   # Copy your .glb file to docs/assets/
   cp path/to/your/model.glb docs/assets/
   ```

4. **Commit and push:**
   ```bash
   git add docs/
   git commit -m "Add GitHub Pages demo site"
   git push
   ```

5. **Enable GitHub Pages:**
   - Go to: https://github.com/cnr-isti-vclab/ThreePresenter/settings/pages
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/docs**
   - Click **Save**

6. **Wait 1-2 minutes** and visit:
   ```
   https://cnr-isti-vclab.github.io/ThreePresenter/
   ```

### Updating the Demo

Whenever you make changes to the library:

```bash
# Quick way:
npm run build:demo

# Or with the script:
./setup-demo.sh

# Then commit and push:
git add docs/dist/
git commit -m "Update demo"
git push
```

### Customizing the Demo

Edit `docs/index.html` to:
- Change the model displayed
- Modify the page design
- Add more examples
- Update text/descriptions

### Troubleshooting

**404 Page Not Found:**
- Check GitHub Pages is enabled in Settings
- Verify `/docs` folder is selected
- Wait a few minutes for deployment

**Model not loading:**
- Make sure model file is in `docs/assets/`
- Check browser console for errors
- Verify file path in `index.html` matches your file name

**Changes not showing:**
- Clear browser cache
- Wait 1-2 minutes for GitHub to rebuild
- Check commit was pushed to GitHub

### File Structure

```
docs/
├── index.html          # Your demo page (customize this!)
├── .nojekyll          # Tells GitHub to serve as-is
├── dist/              # Built library (auto-generated)
│   ├── three-presenter.js
│   └── index.d.ts
└── assets/            # Your 3D models (add files here)
    └── venus.glb
```

### Manual Build (Without Script)

```bash
# 1. Build
npm run build

# 2. Copy to docs
cp -r dist/* docs/dist/

# 3. Copy model
cp examples/assets/venus.glb docs/assets/

# 4. Test
npx serve docs

# 5. Deploy
git add docs/ && git commit -m "Update" && git push
```
