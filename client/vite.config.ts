import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || '//api.recipes.elliotdavies.co.uk')
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
