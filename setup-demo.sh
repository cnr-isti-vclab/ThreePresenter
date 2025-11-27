#!/bin/bash

# Setup script for GitHub Pages demo

echo "🚀 Setting up ThreePresenter GitHub Pages Demo"
echo ""

# Step 1: Build the library
echo "📦 Building library..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Step 2: Copy to docs/dist
echo "📋 Copying files to docs/dist/..."
cp -r dist/* docs/dist/

# Step 3: Copy example model if it exists
if [ -f "examples/assets/venus.glb" ]; then
    echo "🎨 Copying example model..."
    cp examples/assets/venus.glb docs/assets/
fi

echo ""
echo "✅ Demo site ready!"
echo ""
echo "📍 Test locally:"
echo "   npm run serve:demo"
echo ""
echo "📤 To publish to GitHub Pages:"
echo "   1. git add docs/"
echo "   2. git commit -m 'Update demo site'"
echo "   3. git push"
echo "   4. Enable GitHub Pages in repo settings (Settings → Pages → Source: main branch, /docs folder)"
echo ""
echo "🌐 Your demo will be at:"
echo "   https://cnr-isti-vclab.github.io/ThreePresenter/"
