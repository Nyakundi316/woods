import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { initSentry, sendSentryTestEvent } from '@/lib/sentry';

initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default
      retry: 2,
    },
  },
});

function RootLayout() {
  useEffect(() => {
    // Fire a test event on first boot so Phase 0 DoD is verifiable.
    sendSentryTestEvent();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
