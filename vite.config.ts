import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor'
          }

          if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdf-lib') || id.includes('node_modules/file-saver')) {
            return 'pdf-vendor'
          }

          if (id.includes('node_modules/html2canvas')) {
            return 'html2canvas-vendor'
          }
        },
      },
    },
  },
  base: '/CVUS/',
})