import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getCurrentToken } from "./supabase";

// Track if we're already redirecting to prevent loops
let isRedirecting = false;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401 unauthorized by redirecting to login
    if (res.status === 401 && typeof window !== 'undefined') {
      // Only redirect once to prevent loops
      if (!isRedirecting && !window.location.pathname.includes('/auth/')) {
        isRedirecting = true;
        // Clear the query cache on auth failure
        queryClient.clear();
        // Small delay to prevent race conditions
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
      }
      // Return early to prevent further processing
      throw new Error('Authentication required');
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get headers with authentication
async function getAuthHeaders(additionalHeaders: Record<string, string> = {}) {
  try {
    const token = await getCurrentToken();
    
    // Log token attachment for debugging
    if (typeof window !== 'undefined') {
      console.debug(`Getting auth headers - Token exists: ${!!token}`);
    }
    
    const headers: Record<string, string> = {
      ...additionalHeaders
    };
    
    // Explicitly set Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.debug('Authorization header set with Bearer token');
    } else {
      console.warn('No auth token available for request');
    }
    
    return headers;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return additionalHeaders;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = await getAuthHeaders(
    data ? { "Content-Type": "application/json" } : {}
  );

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Keep for backward compatibility with session auth
  });

  await throwIfResNotOk(res);
  return res;
}

// JSON-parsing API request function specifically for AI endpoints and mutations
export async function apiRequestJson<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const headers = await getAuthHeaders(
    data ? { "Content-Type": "application/json" } : {}
  );

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Keep for backward compatibility with session auth
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    // Log the request for debugging
    console.debug(`Query request to: ${url}`);
    
    const headers = await getAuthHeaders({
      'Content-Type': 'application/json'
    });
    
    const res = await fetch(url, {
      headers,
      credentials: "include", // Keep for backward compatibility with session auth
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401 errors
        if (error?.message?.includes('401') || error?.message?.includes('Authentication')) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Reset redirect flag when navigating away from login page
if (typeof window !== 'undefined') {
  const originalPushState = window.history.pushState;
  window.history.pushState = function(...args) {
    isRedirecting = false;
    return originalPushState.apply(window.history, args);
  };
}
