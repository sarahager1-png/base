import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  logLevel: 'error',
  define: {
    'import.meta.env.VITE_BASE44_APP_BASE_URL': JSON.stringify('https://app.base44.com'),
    'import.meta.env.VITE_BASE44_APP_ID': JSON.stringify('69794b7749148839a583cd2b'),
    'import.meta.env.VITE_BASE44_API_KEY': JSON.stringify('4002c112b24e443bb2433c938c6fcd02'),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }),
    react(),
  ]
});
