import { sentryVitePlugin } from '@sentry/vite-plugin';
import { viteWranglerSpa } from '@torchauth/vite-plugin-wrangler-spa';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';
import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true }),
    viteWranglerSpa(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: '**/*.map',
      },
      telemetry: false,
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
  },
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
  },
});
