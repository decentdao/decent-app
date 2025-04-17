import '@fontsource/space-mono';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './assets/css/Markdown.css';
import './assets/css/sentry.css';
import './assets/css/Toast.css';
import './insights';
import { EnvironmentFeatureFlags } from './helpers/environmentFeatureFlags';
import { FEATURE_FLAGS, FeatureFlags } from './helpers/featureFlags';
import { runMigrations } from './hooks/utils/cache/runMigrations';
import { useNetworkConfigStore } from './providers/NetworkConfig/useNetworkConfigStore';
import Providers from './providers/Providers';
import { router } from './router';

function DecentRouterProvider() {
  const { addressPrefix } = useNetworkConfigStore();
  const urlParams = new URLSearchParams(window.location.search);
  const addressWithPrefix = urlParams.get('dao');

  const prefixAndAddress = addressWithPrefix?.split(':');
  const daoAddressStr = prefixAndAddress?.[1];

  return <RouterProvider router={router(addressPrefix, daoAddressStr)} />;
}

async function initializeApp() {
  await runMigrations();

  FeatureFlags.instance = new EnvironmentFeatureFlags(FEATURE_FLAGS);

  const root = document.getElementById('root');
  if (root !== null) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <Providers>
          <DecentRouterProvider />
        </Providers>
      </React.StrictMode>,
    );
  }
}

initializeApp();
