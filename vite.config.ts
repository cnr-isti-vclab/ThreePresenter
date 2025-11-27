import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => `three-presenter.js`
    },
    rollupOptions: {
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
  }
});
