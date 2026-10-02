import {defineConfig} from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  session: false,
  adapter: cloudflare({imageService: 'passthrough'}),
  integrations: [react()],
  vite: {resolve: {dedupe: ['react', 'react-dom', 'radix-ui']}},
});
