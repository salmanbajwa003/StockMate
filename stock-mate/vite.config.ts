import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000', // 👈 your backend server
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split MUI into separate chunk
          'mui-core': ['@mui/material', '@mui/icons-material'],
          'mui-date-pickers': ['@mui/x-date-pickers'],
          // Split React Router
          'react-router': ['react-router-dom'],
          // Split vendor libraries
          vendor: ['axios', 'dayjs'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit to 600 KB
  },
});
