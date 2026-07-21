import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // permite abrir la app desde el celular en tu misma red wifi
    host: true,
  },
})
