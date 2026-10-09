// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { '@': '/src' },
    },
    build: {
        target: 'es2020',
        cssCodeSplit: true,
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    query: ['@tanstack/react-query'],
                    motion: ['framer-motion'],
                    charts: ['recharts'],
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
});