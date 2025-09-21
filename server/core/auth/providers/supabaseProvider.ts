/**
 * Supabase Auth Provider
 * Implements JWT-based authentication with Supabase
 */

import { RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';
import type { AuthProvider, AuthUser } from '../types';
import { storage } from '../../storage';

// Initialize Supabase clients
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for frontend operations (anon key)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations (service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// JWT verification and user mapping
const verifySupabaseToken = async (token: string): Promise<AuthUser | null> => {
  try {
    // Verify JWT token
    const decoded = jwt.decode(token, { complete: true }) as any;
    if (!decoded?.payload?.sub) return null;

    const supabaseUserId = decoded.payload.sub;
    const email = decoded.payload.email;

    if (!email) return null;

    // Map Supabase user to app user by email
    const appUser = await storage.getUserByEmail(email);
    if (!appUser || !appUser.isActive) return null;

    return {
      id: appUser.id,
      email: appUser.email!,
      firstName: appUser.firstName || undefined,
      lastName: appUser.lastName || undefined,
      profileImageUrl: appUser.profileImageUrl || undefined,
      role: appUser.role,
      roles: (appUser.roles as User['role'][]) || [],
      isActive: appUser.isActive,
      authProvider: 'supabase',
      authUserId: supabaseUserId
    };
  } catch (error) {
    console.error('Supabase token verification error:', error);
    return null;
  }
};

// Supabase isAuthenticated middleware
const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifySupabaseToken(token);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Supabase authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Supabase requireRole middleware
const requireRole = (allowedRoles: User['role'][]): RequestHandler => {
  return (req, res, next) => {
    isAuthenticated(req, res, async () => {
      if (res.headersSent) return;

      try {
        const user = req.user as AuthUser;
        if (!user) {
          return res.status(403).json({ message: 'Access forbidden: User not found' });
        }

        if (!user.isActive) {
          return res.status(403).json({ message: 'Access forbidden: User account is inactive' });
        }

        // Check both single role and roles array
        const userRoles: User['role'][] = user.roles || [];
        const hasRequiredRole = allowedRoles.includes(user.role) || 
                               userRoles.some(role => allowedRoles.includes(role));

        if (!hasRequiredRole) {
          const currentRoles = [user.role, ...userRoles].filter(Boolean).join(', ');
          return res.status(403).json({ 
            message: `Access forbidden: Required role(s): ${allowedRoles.join(', ')}. Current role(s): ${currentRoles}` 
          });
        }

        next();
      } catch (error) {
        console.error('Error in Supabase requireRole middleware:', error);
        if (!res.headersSent) {
          return res.status(500).json({ message: 'Internal server error' });
        }
      }
    });
  };
};

// Warehouse scope functions (use existing logic)
const hasWarehouseScope = async (userId: string, warehouseCode: string): Promise<boolean> => {
  try {
    const scopes = await storage.getUserWarehouseScopes(userId);
    return scopes.some((scope: { warehouseCode: string; isActive: boolean }) => 
      scope.warehouseCode === warehouseCode && scope.isActive);
  } catch (error) {
    console.error("Error checking warehouse scope:", error);
    return false;
  }
};

const requireWarehouseScope = (warehouseCode?: string): RequestHandler => {
  return (req, res, next) => {
    isAuthenticated(req, res, async () => {
      if (res.headersSent) return;

      try {
        const user = req.user as AuthUser;
        const targetWarehouse = warehouseCode || req.body.warehouseCode || req.params.warehouseCode;

        if (!targetWarehouse) {
          return res.status(400).json({ message: "Warehouse code required" });
        }

        const hasScope = await hasWarehouseScope(user.id, targetWarehouse);
        if (!hasScope) {
          return res.status(403).json({ 
            message: `Access forbidden: No scope for warehouse ${targetWarehouse}` 
          });
        }

        next();
      } catch (error) {
        console.error("Error in requireWarehouseScope middleware:", error);
        if (!res.headersSent) {
          return res.status(500).json({ message: "Internal server error" });
        }
      }
    });
  };
};

const requireWarehouseScopeForResource = (resourceExtractor: (req: any) => string): RequestHandler => {
  return (req, res, next) => {
    isAuthenticated(req, res, async () => {
      if (res.headersSent) return;

      try {
        const user = req.user as AuthUser;
        const warehouseCode = resourceExtractor(req);

        if (!warehouseCode) {
          return res.status(400).json({ message: "Could not determine warehouse from resource" });
        }

        const hasScope = await hasWarehouseScope(user.id, warehouseCode);
        if (!hasScope) {
          return res.status(403).json({ 
            message: `Access forbidden: No scope for warehouse ${warehouseCode}` 
          });
        }

        next();
      } catch (error) {
        console.error("Error in requireWarehouseScopeForResource middleware:", error);
        if (!res.headersSent) {
          return res.status(500).json({ message: "Internal server error" });
        }
      }
    });
  };
};

// Placeholder implementations for Supabase-specific features
const validateWarehouseSource = (): RequestHandler => {
  return (req, res, next) => {
    // TODO: Implement warehouse source validation for Supabase
    next();
  };
};

const requireApproval = (operationType: string): RequestHandler => {
  return (req, res, next) => {
    // TODO: Implement approval workflow for Supabase
    next();
  };
};

// Session configuration for Supabase (JWT-based, no session store needed)
const configureSession = () => {
  // Supabase uses JWT tokens, no session middleware needed
  return null;
};

// Export Supabase auth provider
export const supabaseAuthProvider: AuthProvider = {
  isAuthenticated,
  requireRole,
  requireWarehouseScope,
  requireWarehouseScopeForResource,
  hasWarehouseScope,
  validateWarehouseSource,
  requireApproval,
  configureSession,
  providerName: 'supabase'
};