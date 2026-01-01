import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
      'process': JSON.stringify({
        env: {
          NODE_ENV: mode === 'production' ? 'production' : 'development'
        }
      })
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: '../static-site/ai-smart-itinerary-planner',
      emptyOutDir: true,
      target: 'esnext',
      minify: 'esbuild', // 重新啟用壓縮
      sourcemap: false,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      },
      lib: {
        entry: path.resolve(__dirname, 'entry.tsx'),
        name: 'ItineraryPlanner',
        formats: ['es'],
        fileName: 'App',
      },
      rollupOptions: {
        external: ['react', 'react-dom'], // 外部化 React，因為我們從 esm.sh 載入
        output: {
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM'
          },
          preserveModules: false, // 確保所有代碼打包在一起
          // 確保正確處理循環依賴
          manualChunks: undefined,
        }
      },
    },
    base: '/ai-smart-itinerary-planner/',
  };
});
