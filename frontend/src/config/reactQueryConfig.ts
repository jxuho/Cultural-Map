import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Stays “fresh” for 5 minutes
      gcTime: 1000 * 60 * 30, // Stay in cache for 30 minutes
      refetchOnWindowFocus: false, // Disable automatic refetch when window is refocused
      retry: 2, // Retry 2 times on failure
    },
  },
});

export { queryClient };
