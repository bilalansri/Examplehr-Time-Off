import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';
import { createQueryClient } from '@/lib/query/client';

export function createStoryQueryClient(): QueryClient {
  return createQueryClient();
}

export function withQueryClient(client?: QueryClient): Decorator {
  const queryClient = client ?? createStoryQueryClient();
  return (Story) => (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  );
}

export function StoryShell({ children }: { children: ReactNode }) {
  return <div className="bg-slate-100 p-6">{children}</div>;
}
