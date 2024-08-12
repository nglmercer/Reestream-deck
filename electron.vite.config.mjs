import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: [
          'express',
          "socket.io",
          "cors", // Aquí defines los módulos que deben ser tratados como externos
          // Puedes agregar más módulos de Node.js aquí si es necesario
        ]
      }
    },
    optimizeDeps: {
      include: [
        './src/main/audioController.js',
        './src/main/keynut.js'
        // Añade aquí otros archivos que necesites incluir
      ]
    }
  },
  
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        
      }
    },
    plugins: [react()]
  }
})
