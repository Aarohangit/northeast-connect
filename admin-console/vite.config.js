import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.ADMIN_BASE || '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
})
