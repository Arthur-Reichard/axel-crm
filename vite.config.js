import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: '/axel-crm/',  // <-- clé pour GitHub Pages
  plugins: [react()],
})
