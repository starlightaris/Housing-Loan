import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  // Built straight into the repo root so GitHub Pages can serve the branch root.
  // emptyOutDir is off because the root also holds app/, .git etc. – 'prebuild' removes old assets instead.
  build: { outDir: '..', emptyOutDir: false },
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: '127.0.0.1' },
})
