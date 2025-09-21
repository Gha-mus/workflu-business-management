/**
 * Supabase Auth Provider
 * Implements JWT-based authentication with Supabase
 */

import { RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
// JWT token verification is handled by Supabase admin client
import { User } from '@shared/schema';
import type { AuthProvider, AuthUser } from '../types';
import { storage } from '../../storage';

// Lazy initialization of Supabase clients
let supabaseClient: any = null;
let supabaseAdmin: any = null;

const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_ prefixed) environment variables.');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase admin configuration missing. Please set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdmin;
};

export { getSupabaseClient as supabaseClient, getSupabaseAdmin as supabaseAdmin };

// Secure JWT verification and user mapping
const verifySupabaseToken = async (token: string): Promise<AuthUser | null> => {
  try {
    // Use Supabase's secure user verification instead of JWT decode
    const admin = getSupabaseAdmin();
    const { data: { user }, error } = await admin.auth.getUser(token);
    
    if (error || !user) {
      console.error('Supabase token verification failed:', error);
      return null;
    }

    const supabaseUserId = user.id;
    const email = user.email;

    if (!email) return null;

    // Map Supabase user to app user by email
    const appUser = await storage.getUserByEmail(email);
    if (!appUser || !appUser.isActive) return null;

    const authUser = {
      id: appUser.id,
      email: appUser.email!,
      firstName: appUser.firstName || undefined,
      lastName: appUser.lastName || undefined,
      profileImageUrl: appUser.profileImageUrl || undefined,
      role: appUser.role,
      roles: (appUser.roles as User['role'][]) || [],
      isActive: appUser.isActive,
      authProvider: 'supabase' as const,
      authUserId: supabaseUserId
    };

    return authUser;
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

    // Add compatibility shim for legacy req.user.claims.sub access
    req.user = {
      ...user,
      claims: {
        sub: user.id,
        email: user.email
      }
    } as any;
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

// Warehouse source validation - migrated from Replit auth
const validateWarehouseSource = (): RequestHandler => {
  return (req: any, res: any, next: any) => {
    // Basic warehouse source validation - can be enhanced as needed
    try {
      const user = req.user as AuthUser;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      next();
    } catch (error) {
      console.error("Error in validateWarehouseSource:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Import existing middleware to delegate to
// Note: Replit auth dependencies removed during migration
import { requireApproval as approvalMiddleware } from '../../../approvalMiddleware';

const validateSalesReturn = (): RequestHandler => {
  return (req: any, res: any, next: any) => {
    // Sales return validation - migrated from Replit auth
    try {
      const user = req.user as AuthUser;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      next();
    } catch (error) {
      console.error("Error in validateSalesReturn:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

const requireApproval = (operationType: string): RequestHandler => {
  // Delegate to existing approval middleware
  return approvalMiddleware(operationType);
};

// Setup auth for Supabase (minimal setup since JWT-based)
const setupAuth = (app: any) => {
  // Supabase uses JWT tokens, minimal Express setup needed
  console.log('🔐 Supabase Auth: JWT-based authentication configured');
};

// Export Supabase auth provider
export const supabaseAuthProvider: AuthProvider = {
  isAuthenticated,
  requireRole,
  requireWarehouseScope,
  requireWarehouseScopeForResource,
  hasWarehouseScope,
  validateWarehouseSource,
  validateSalesReturn,
  requireApproval,
  setupAuth,
  providerName: 'supabase'
};