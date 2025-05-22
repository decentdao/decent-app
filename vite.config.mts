import { sentryVitePlugin } from '@sentry/vite-plugin';
import { viteWranglerSpa } from '@torchauth/vite-plugin-wrangler-spa';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import { checker } from 'vite-plugin-checker';
import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const plugins = [react(), checker({ typescript: true }), viteWranglerSpa()];
  if (env.SENTRY_ORG && env.SENTRY_PROJECT && env.SENTRY_AUTH_TOKEN) {
    console.log('Got Sentry credentials');
    console.log(`Will upload sourcemaps for ${env.SENTRY_ORG}/${env.SENTRY_PROJECT}\n`);
    plugins.push(
      sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          filesToDeleteAfterUpload: '**/*.map',
        },
        telemetry: false,
      }),
    );
  }
  return {
    plugins,
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
