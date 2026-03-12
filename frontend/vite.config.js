import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ชุมนุมลูกเสืออาชีวศึกษา',
        short_name: 'Jamboree',
        description: 'ระบบจัดการชุมนุมลูกเสืออาชีวศึกษา',
        theme_color: '#1a3a2e',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: { proxy: { '/api': 'http://localhost:4000' },
host: true
}
  
})
