import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getCurrentToken } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get headers with authentication
async function getAuthHeaders(additionalHeaders: Record<string, string> = {}) {
  const token = await getCurrentToken();
  
  return {
    ...additionalHeaders,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
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
    const headers = await getAuthHeaders();
    
    const res = await fetch(queryKey.join("/") as string, {
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
