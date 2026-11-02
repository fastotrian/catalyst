import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tw from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tw()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true
  }
})
