import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { vi, test, expect } from 'vitest';
import { FeatureFlagKey } from '../src/helpers/featureFlags';
import Providers from '../src/providers/Providers';
import { router } from '../src/router';

test('full app rendering', async () => {
  vi.mock('../src/helpers/environmentFeatureFlags', async () => {
    //const originalModule = await vi.importActual('./src/helpers/environmentFeatureFlags');

    return {
      default: vi.fn().mockImplementation((key: FeatureFlagKey) => {
        return false;
      }),
    };
  });

  const addressPrefix = 'sep';
  const urlParams = new URLSearchParams(window.location.search);
  const addressWithPrefix = urlParams.get('dao');

  const prefixAndAddress = addressWithPrefix?.split(':');
  const daoAddressStr = prefixAndAddress?.[1];

  render(<RouterProvider router={router(addressPrefix, daoAddressStr)} />, {
    wrapper: Providers,
  });
  //const user = userEvent.setup();

  // verify page content for default route
  expect(screen.getByText(/My DAOs/i)).toBeInTheDocument();
  expect(screen.getByText(/Getting Started/i)).toBeInTheDocument();
  expect(screen.getByText(/Create DAO/i)).toBeInTheDocument();
});
