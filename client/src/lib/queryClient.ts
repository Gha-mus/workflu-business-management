/**
 * React Query client configuration
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * API request helper function - supports both overloads
 */
export async function apiRequestJson<T>(
  methodOrUrl: string,
  urlOrOptions?: string | RequestInit,
  bodyData?: any
): Promise<T> {
  let url: string;
  let options: RequestInit;

  // Handle two-parameter overload: apiRequestJson(url, options)
  if (typeof urlOrOptions === 'object' || urlOrOptions === undefined) {
    url = methodOrUrl;
    options = urlOrOptions as RequestInit || {};
  }
  // Handle three-parameter overload: apiRequestJson(method, url, data)
  else {
    const method = methodOrUrl;
    url = urlOrOptions as string;
    options = {
      method,
      body: bodyData ? JSON.stringify(bodyData) : undefined,
    };
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}