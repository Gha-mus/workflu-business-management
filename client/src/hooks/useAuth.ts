import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    userRole: user?.role,
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => roles.includes(user?.role || ''),
  };
}
