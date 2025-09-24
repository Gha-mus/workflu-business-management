/**
 * Auth Provider Abstraction Layer
 * Unified auth interface for Supabase Authentication
 */

import { RequestHandler, Request, Response, NextFunction, Express } from 'express';
import type { AuthUser, AuthProvider, AuthenticatedRequest } from './types';

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

export const requireRole = (allowedRoles: string[]): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
  const provider = await getAuthProvider();
  return provider.requireRole(allowedRoles)(req, res, next);
};

export const requireSuperAdmin: RequestHandler = async (req, res, next) => {
  const provider = await getAuthProvider();
  // First check authentication
  provider.isAuthenticated(req, res, async () => {
    if (res.headersSent) return;

    try {
      const user = req.user as AuthUser;
      if (!user) {
        return res.status(403).json({ message: 'Access forbidden: User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Access forbidden: User account is inactive' });
      }

      if (!user.isSuperAdmin) {
        return res.status(403).json({ 
          message: 'Access forbidden: Super-admin privileges required' 
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireSuperAdmin middleware:', error);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
};

export const requireWarehouseScope = (warehouseCode?: string): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
  const provider = await getAuthProvider();
  return provider.requireWarehouseScope(warehouseCode)(req, res, next);
};

export const requireWarehouseScopeForResource = (resourceExtractor: (req: AuthenticatedRequest) => string): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
  const provider = await getAuthProvider();
  return provider.requireWarehouseScopeForResource(resourceExtractor)(req, res, next);
};

export const hasWarehouseScope = async (userId: string, warehouseCode: string) => {
  const provider = await getAuthProvider();
  return provider.hasWarehouseScope(userId, warehouseCode);
};

export const validateWarehouseSource = (): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
  const provider = await getAuthProvider();
  return provider.validateWarehouseSource()(req, res, next);
};

export const validateSalesReturn = (): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
  const provider = await getAuthProvider();
  return provider.validateSalesReturn()(req, res, next);
};

export const requireApproval = (operationType: string): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
  const provider = await getAuthProvider();
  return provider.requireApproval(operationType)(req, res, next);
};

// Export session setup function
export const setupAuth = async (app: Express) => {
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