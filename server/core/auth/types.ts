/**
 * Shared Auth Types for Provider Abstraction
 */

import { RequestHandler } from 'express';
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
  authProvider: 'replit' | 'supabase';
  authUserId: string;  // Provider-specific user ID
}

// Auth provider interface
export interface AuthProvider {
  // Core middleware functions
  isAuthenticated: RequestHandler;
  requireRole: (allowedRoles: User['role'][]) => RequestHandler;
  requireWarehouseScope: (warehouseCode?: string) => RequestHandler;
  requireWarehouseScopeForResource: (resourceExtractor: (req: any) => string) => RequestHandler;
  hasWarehouseScope: (userId: string, warehouseCode: string) => Promise<boolean>;
  validateWarehouseSource: () => RequestHandler;
  requireApproval: (operationType: string) => RequestHandler;
  
  // Session configuration
  configureSession: () => any;
  
  // Provider-specific info
  providerName: 'replit' | 'supabase';
}

// Extended Express Request type with auth user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}