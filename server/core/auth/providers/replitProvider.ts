/**
 * Replit OIDC Auth Provider
 * Wraps existing Replit auth functionality for the abstraction layer
 */

import { RequestHandler } from 'express';
import { User } from '@shared/schema';
import type { AuthProvider, AuthUser } from '../types';
import { storage } from '../../storage';

// Import existing Replit auth functions
import * as replitAuth from '../replitAuth';

// Convert Replit user to normalized AuthUser
const normalizeReplitUser = async (replitUser: any): Promise<AuthUser | null> => {
  if (!replitUser?.claims?.sub) return null;
  
  try {
    // Get user data from storage
    const userData = await storage.getUser(replitUser.claims.sub);
    if (!userData) return null;

    return {
      id: userData.id,
      email: userData.email || replitUser.claims.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      role: userData.role,
      roles: userData.roles || [],
      isActive: userData.isActive,
      authProvider: 'replit',
      authUserId: replitUser.claims.sub
    };
  } catch (error) {
    console.error('Error normalizing Replit user:', error);
    return null;
  }
};

// Wrap existing isAuthenticated with normalization
const isAuthenticated: RequestHandler = (req, res, next) => {
  return replitAuth.isAuthenticated(req, res, async () => {
    try {
      // Normalize the user data
      const normalizedUser = await normalizeReplitUser(req.user);
      if (normalizedUser) {
        req.user = normalizedUser;
      }
      next();
    } catch (error) {
      console.error('Error in Replit auth normalization:', error);
      res.status(500).json({ message: 'Authentication error' });
    }
  });
};

// Wrap existing requireRole with normalization
const requireRole = (allowedRoles: User['role'][]): RequestHandler => {
  return (req, res, next) => {
    // Use existing requireRole but with our normalized user
    return replitAuth.requireRole(allowedRoles)(req, res, next);
  };
};

// Export Replit auth provider
export const replitAuthProvider: AuthProvider = {
  isAuthenticated,
  requireRole,
  requireWarehouseScope: replitAuth.requireWarehouseScope,
  requireWarehouseScopeForResource: replitAuth.requireWarehouseScopeForResource,
  hasWarehouseScope: replitAuth.hasWarehouseScope,
  validateWarehouseSource: replitAuth.validateWarehouseSource,
  requireApproval: replitAuth.requireApproval,
  configureSession: replitAuth.configureSession,
  providerName: 'replit'
};