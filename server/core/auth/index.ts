/**
 * Auth Provider Abstraction Layer
 * Unified auth interface for Supabase Authentication
 */

import { RequestHandler } from 'express';
import type { AuthUser, AuthProvider } from './types';

// Get auth provider from environment variable
const AUTH_PROVIDER = process.env.AUTH_PROVIDER || 'supabase';

// Lazy load auth providers to avoid crashes when switching providers
let authProvider: AuthProvider | null = null;

async function getAuthProvider(): Promise<AuthProvider> {
  if (!authProvider) {
    const { supabaseAuthProvider } = await import('./providers/supabaseProvider');
    authProvider = supabaseAuthProvider;
  }
  return authProvider;
}

console.log(`🔐 Auth Provider: ${AUTH_PROVIDER.toUpperCase()}`);

// Export unified auth middleware functions with lazy loading
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const provider = await getAuthProvider();
  return provider.isAuthenticated(req, res, next);
};

export const requireRole = (allowedRoles: any[]) => async (req: any, res: any, next: any) => {
  const provider = await getAuthProvider();
  return provider.requireRole(allowedRoles)(req, res, next);
};

export const requireWarehouseScope = (warehouseCode?: string) => async (req: any, res: any, next: any) => {
  const provider = await getAuthProvider();
  return provider.requireWarehouseScope(warehouseCode)(req, res, next);
};

export const requireWarehouseScopeForResource = (resourceExtractor: (req: any) => string) => async (req: any, res: any, next: any) => {
  const provider = await getAuthProvider();
  return provider.requireWarehouseScopeForResource(resourceExtractor)(req, res, next);
};

export const hasWarehouseScope = async (userId: string, warehouseCode: string) => {
  const provider = await getAuthProvider();
  return provider.hasWarehouseScope(userId, warehouseCode);
};

export const validateWarehouseSource = () => async (req: any, res: any, next: any) => {
  const provider = await getAuthProvider();
  return provider.validateWarehouseSource()(req, res, next);
};

export const validateSalesReturn = () => async (req: any, res: any, next: any) => {
  const provider = await getAuthProvider();
  return provider.validateSalesReturn()(req, res, next);
};

export const requireApproval = (operationType: string) => async (req: any, res: any, next: any) => {
  const provider = await getAuthProvider();
  return provider.requireApproval(operationType)(req, res, next);
};

// Export session setup function
export const setupAuth = async (app: any) => {
  const provider = await getAuthProvider();
  return provider.setupAuth(app);
};

// Export auth provider info for debugging
export const getAuthProviderInfo = () => ({
  provider: AUTH_PROVIDER,
  isSupabase: true,
  isReplit: false
});

// Export types
export type { AuthUser };