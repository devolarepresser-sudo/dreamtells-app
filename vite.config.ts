import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: './',
    plugins: [react()],
    optimizeDeps: {
        // Evita que o Vite tente escanear arquivos de build dentro das pastas mobile
        entries: ['index.html', 'src/**/*.{ts,tsx}'],
        exclude: ['@capacitor/android', '@capacitor/ios']
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:10000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
