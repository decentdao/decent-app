import { sentryVitePlugin } from '@sentry/vite-plugin';
import { viteWranglerSpa } from '@torchauth/vite-plugin-wrangler-spa';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import { checker } from 'vite-plugin-checker';
import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log(env.SENTRY_ORG);
  return {
    plugins: [
      react(),
      checker({ typescript: true }),
      viteWranglerSpa(),
      sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
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
  };
});
