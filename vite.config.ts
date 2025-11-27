import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ThreePresenter',
      formats: ['es', 'umd'],
      fileName: (format) => `three-presenter.${format}.js`
    },
    rollupOptions: {
      // Externalize three.js - users must include it separately
      external: ['three'],
      output: {
        globals: {
          three: 'THREE'
        }
      }
    },
    sourcemap: true,
    outDir: 'dist'
  }
});
