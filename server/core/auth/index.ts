/**
 * Auth Provider Abstraction Layer
 * Allows switching between Replit OIDC and Supabase Auth via AUTH_PROVIDER env var
 */

import { RequestHandler } from 'express';
import { replitAuthProvider } from './providers/replitProvider';
import { supabaseAuthProvider } from './providers/supabaseProvider';
import type { AuthUser, AuthProvider } from './types';

// Get auth provider from environment variable
const AUTH_PROVIDER = process.env.AUTH_PROVIDER || 'replit';

// Select the appropriate auth provider
const authProvider: AuthProvider = AUTH_PROVIDER === 'supabase' 
  ? supabaseAuthProvider 
  : replitAuthProvider;

console.log(`🔐 Auth Provider: ${AUTH_PROVIDER.toUpperCase()}`);

// Export unified auth middleware functions
export const isAuthenticated: RequestHandler = authProvider.isAuthenticated;
export const requireRole = authProvider.requireRole;
export const requireWarehouseScope = authProvider.requireWarehouseScope;
export const requireWarehouseScopeForResource = authProvider.requireWarehouseScopeForResource;
export const hasWarehouseScope = authProvider.hasWarehouseScope;
export const validateWarehouseSource = authProvider.validateWarehouseSource;
export const requireApproval = authProvider.requireApproval;

// Export session configuration for the active provider
export const configureSession = authProvider.configureSession;

// Export auth provider info for debugging
export const getAuthProviderInfo = () => ({
  provider: AUTH_PROVIDER,
  isSupabase: AUTH_PROVIDER === 'supabase',
  isReplit: AUTH_PROVIDER === 'replit'
});

// Export types
export type { AuthUser };