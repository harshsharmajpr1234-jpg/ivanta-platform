'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastViewport } from '@/components/ui/toast';
import { GuestCartBridge } from '@/hooks/use-guest-cart';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <GuestCartBridge />
      <ToastViewport />
    </QueryClientProvider>
  );
}
