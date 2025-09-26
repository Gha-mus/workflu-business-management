/**
 * Authentication hook
 */

import { useState, useEffect, createContext, useContext } from 'react';
import type { User } from '@shared/schema';

export interface AuthContextType {
  user: User | null;
  session: any; // Session data
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};