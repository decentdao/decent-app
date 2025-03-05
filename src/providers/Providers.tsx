import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { WagmiProvider } from 'wagmi';
import { theme } from '../assets/theme';
import { ErrorBoundary } from '../components/ui/utils/ErrorBoundary';
import { TopErrorFallback } from '../components/ui/utils/TopErrorFallback';
import { AppProvider } from './App/AppProvider';
import { queryClient, wagmiConfig } from './NetworkConfig/web3-modal.config';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider
      theme={theme}
      resetCSS
    >
      <ErrorBoundary
        fallback={<TopErrorFallback />}
        showDialog
      >
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              <Toaster
                position="bottom-center"
                richColors
                pauseWhenPageIsHidden
                theme="dark"
                closeButton
                toastOptions={{ className: 'sonner-toast' }}
              />
              {children}
            </AppProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ErrorBoundary>
    </ChakraProvider>
  );
}
