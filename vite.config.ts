import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Pre-bundle nexus3d so Vite can transform CommonJS/UMD interop
  optimizeDeps: {
    include: ['nexus3d']
  },

  build: {
    // Disable minification during development/debug builds to make output
    // human-readable and easier to debug. Set `minify: false` so Vite
    // doesn't run esbuild/terser on the generated bundles.
    minify: false,

    // When a dependency mixes CJS/ES imports, allow transforms so the
    // runtime import interoperability is handled correctly.
    commonjsOptions: {
      transformMixedEsModules: true
    },

    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => `three-presenter.js`
    },

    rollupOptions: {
      plugins: [
        // Fix generated nexus3d chunks that import a default `three`.
        // During CommonJS->ESM conversion, Rollup may emit
        // `import THREE__default from "three";` which breaks in
        // native ESM environments where `three` has no default export.
        // This plugin rewrites that pattern into a namespace import
        // plus an alias so the generated bundle runs in browsers.
        {
          name: 'fix-nexus3d-three-default',
          renderChunk(code, chunk) {
            try {
              if (chunk && chunk.fileName && /nexus3D(?:\.min)?-.*\.js$/.test(chunk.fileName)) {
                const pat = /import\s+THREE__default\s+from\s+["']three["'];/g;
                if (pat.test(code)) {
                  const fixed = code.replace(pat, 'import * as THREE from "three";\nconst THREE__default = THREE;');
                  return { code: fixed, map: null };
                }
              }
            } catch (e) {
              // don't fail the build for plugin errors
            }
            return null;
          }
        }
      ],
      // Externalize three.js - users must include it separately
      // This keeps the bundle small and avoids version conflicts
      external: ['three', /^three\//],
      output: {
        // Preserve the 'three' import in the output
        paths: {
          three: 'three'
        }
      }
    },

    sourcemap: true,
    outDir: 'dist'
  },
  resolve: {
    alias: {
      // Alias 'three' to a shim that provides a default export for
      // better interop with the Nexus3D UMD/CJS bundle during debugging.
      // Remove or make conditional before publishing if you want 'three'
      // to remain external for library builds.
      'three': resolve(__dirname, 'src/shims/three-default.ts')
    }
  },

  // For SSR or other non-bundled contexts, prevent Vite from treating
  // nexus3d as external so it gets processed and interop helpers are applied.
  ssr: {
    noExternal: ['nexus3d']
  }
});
