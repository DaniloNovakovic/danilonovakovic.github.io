import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { ridgeStageAuthoringCommitPlugin } from './src/dev/ridgeStageAuthoring/viteStageAuthoringCommitPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ridgeStageAuthoringCommitPlugin(), tailwindcss(), react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
