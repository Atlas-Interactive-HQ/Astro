// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

const seInternal = fileURLToPath(
  new URL('./node_modules/@fusionstrings/swisseph-wasm/esm/lib/swisseph_wasm.internal.js', import.meta.url),
);

// Static-first public site. `site` feeds canonical URLs only. DNS, hosting
// (Hostinger) and deployment are gated and live outside this repository.
export default defineConfig({
  site: 'https://astro.atlas-interactive.com',
  output: 'static',
  build: {
    format: 'directory',
  },
  vite: {
    assetsInclude: ['**/*.wasm'],
    resolve: {
      alias: {
        '@se-internal': seInternal,
      },
    },
  },
});
