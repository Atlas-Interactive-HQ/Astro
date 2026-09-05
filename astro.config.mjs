// @ts-check
import { defineConfig } from 'astro/config';

// Static-first public site. `site` feeds canonical URLs only. DNS, hosting
// (Hostinger) and deployment are gated and live outside this repository.
export default defineConfig({
  site: 'https://astro.atlas-interactive.com',
  output: 'static',
  build: {
    format: 'directory',
  },
});
