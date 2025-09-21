import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase, getCurrentToken } from "@/lib/supabase";
import type { User } from "@shared/schema";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);


  // Fetch user data from our backend using the session token
  const { data: user, isLoading: isUserLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    enabled: !!session?.access_token && sessionChecked && !isLoading,
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      
      setSession(session);
      setIsLoading(false);
      setSessionChecked(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      
      setSession(session);
      setIsLoading(false);
      
      // Only refetch user data if we got a new session
      if (event === 'SIGNED_IN' && session) {
        refetch();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - run once on mount

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return false;
    }
    // Navigate to login page after successful logout
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    return true;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };

  return {
    user,
    session,
    isLoading: isLoading || (sessionChecked && !!session && isUserLoading),
    isAuthenticated: !!session && !!user,
    userRole: user?.role,
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => roles.includes(user?.role || ''),
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
