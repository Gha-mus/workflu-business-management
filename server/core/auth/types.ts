/**
 * Shared Auth Types for Provider Abstraction
 */

import { RequestHandler, Request, Express } from 'express';
import { User } from '@shared/schema';

// Normalized auth user interface
export interface AuthUser {
  id: string;          // App user ID (maps to users.id)
  email: string;       // User email
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: User['role'];
  roles?: User['role'][];
  isActive: boolean;
  isSuperAdmin: boolean; // Super-admin protection flag
  authProvider: 'supabase';
  authUserId: string;  // Provider-specific user ID
}

// Auth provider interface
export interface AuthProvider {
  // Core middleware functions
  isAuthenticated: RequestHandler;
  requireRole: (allowedRoles: Array<'admin' | 'finance' | 'purchasing' | 'warehouse' | 'sales' | 'worker'>) => RequestHandler;
  requireWarehouseScope: (warehouseCode?: string) => RequestHandler;
  requireWarehouseScopeForResource: (resourceExtractor: (req: AuthenticatedRequest) => string) => RequestHandler;
  hasWarehouseScope: (userId: string, warehouseCode: string) => Promise<boolean>;
  validateWarehouseSource: () => RequestHandler;
  validateSalesReturn: () => RequestHandler;
  requireApproval: (operationType: string) => RequestHandler;
  
  // Session setup
  setupAuth: (app: Express) => void;
  
  // Provider-specific info
  providerName: 'supabase';
}

// Extended Express Request type with auth user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Authenticated request type for route handlers
export interface AuthenticatedRequest extends Request {
  user: AuthUser; // user is guaranteed to exist after authentication middleware
}

// Optional authenticated request type for routes that may or may not require auth
export interface OptionalAuthRequest extends Request {
  user?: AuthUser;
}