import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url)),
      '@static': fileURLToPath(new URL('./src/static', import.meta.url)),
      '@shared/ui': fileURLToPath(new URL('./src/shared/ui/index.ts', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
})
