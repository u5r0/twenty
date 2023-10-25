import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import env from 'vite-plugin-env-compatible';
import svgr from 'vite-plugin-svgr';

// import 'dotenv/config';
const ENV_PREFIX = 'REACT_APP_';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    env({ prefix: ENV_PREFIX }),
    checker({ typescript: true }),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src/modules'),
    },
  },
  server: {
    port: 3001,
  },
  build: {
    outDir: 'build',
  },
});
