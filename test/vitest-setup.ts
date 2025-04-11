import matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';

expect.extend(matchers);

// https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});
// For WalletConnect functions
vi.stubEnv('VITE_APP_NAME', 'Decent');
vi.stubEnv('VITE_APP_WALLET_CONNECT_PROJECT_ID', 'f090fd14ad8cf86ea088d4edb8e0b00a');

afterEach(() => {
  cleanup();
});
