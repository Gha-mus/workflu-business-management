import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireSuperAdmin } from "../core/auth";
import { supabaseAdmin } from "../core/auth/providers/supabaseProvider";
import { auditService } from "../auditService";
import { insertUserSchema, userRoleUpdateSchema } from "@shared/schema";
import { z } from "zod";

export const superAdminRouter = Router();

// POST /api/super-admin/users - Create user (super-admin only)
superAdminRouter.post("/",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Validate super-admin creation: only admin users can be granted super-admin privileges
      if (validatedData.isSuperAdmin && validatedData.role !== 'admin') {
        return res.status(400).json({ 
          message: "Super-admin privileges can only be granted to users with admin role" 
        });
      }
      
      // If using Supabase, create auth user first
      let supabaseUserId: string | undefined;
      const temporaryPassword = req.body.temporaryPassword || generateTemporaryPassword();
      
      if (process.env.AUTH_PROVIDER === 'supabase' && validatedData.email) {
        try {
          const admin = supabaseAdmin();
          const { data, error } = await admin.auth.admin.createUser({
            email: validatedData.email,
            password: temporaryPassword,
            email_confirm: true,
            user_metadata: {
              first_name: validatedData.firstName,
              last_name: validatedData.lastName,
              role: validatedData.role || 'worker'
            }
          });

          if (error) {
            console.error(`Supabase user creation failed for ${validatedData.email}:`, error);
            return res.status(400).json({ 
              message: `Failed to create authentication account: ${error.message}`,
              temporaryPassword: null 
            });
          }
          
          supabaseUserId = data.user?.id;
          console.log(`Created Supabase user for ${validatedData.email} with ID: ${supabaseUserId}`);
        } catch (supabaseError: any) {
          console.error("Supabase user creation error:", supabaseError);
          return res.status(400).json({ 
            message: `Authentication service error: ${supabaseError.message || 'Unknown error'}`,
            temporaryPassword: null 
          });
        }
      }
      
      // Create user in local database after Supabase success
      const user = await storage.createUser({
        email: validatedData.email ?? null,
        firstName: validatedData.firstName ?? null,
        lastName: validatedData.lastName ?? null,
        profileImageUrl: validatedData.profileImageUrl ?? null,
        role: validatedData.role || 'worker',
        isActive: validatedData.isActive ?? true,
        authProvider: process.env.AUTH_PROVIDER === 'supabase' ? 'supabase' : null,
        authProviderUserId: supabaseUserId || null,
        roles: validatedData.roles ? [...validatedData.roles] : null,
        isSuperAdmin: validatedData.isSuperAdmin || false
      });

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "create",
        entityType: "user",
        entityId: user.id,
        operationType: "user_role_change",
        description: `Super-admin created user: ${user.email} with role ${user.role}${process.env.AUTH_PROVIDER === 'supabase' ? ' (with Supabase account)' : ''}`,
        oldValues: undefined,
        newValues: user
      });

      res.status(201).json({
        ...user,
        temporaryPassword: process.env.AUTH_PROVIDER === 'supabase' ? temporaryPassword : undefined,
        message: process.env.AUTH_PROVIDER === 'supabase' 
          ? `User created successfully with temporary password: ${temporaryPassword}. Please save this password securely.`
          : "User created successfully."
      });
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  }
);

// Helper function to generate secure temporary password
function generateTemporaryPassword(): string {
  const crypto = require('crypto');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  const bytes = crypto.randomBytes(16);
  let password = '';
  for (let i = 0; i < bytes.length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// PUT /api/super-admin/users/:id/role - Change user role (super-admin only)
superAdminRouter.put("/:id/role",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = userRoleUpdateSchema.parse(req.body);
      
      const previousUser = await storage.getUser(id);
      if (!previousUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent super-admin from demoting themselves
      if (req.user?.id === id && (req.user as any).isSuperAdmin && validatedData.role !== 'admin') {
        return res.status(400).json({ 
          message: "Super-admin cannot demote their own account" 
        });
      }

      // CRITICAL: Last super-admin protection
      if (previousUser.isSuperAdmin && validatedData.role !== 'admin') {
        const allUsers = await storage.getAllUsers();
        const activeSuperAdmins = allUsers.filter(u => 
          u.isActive && u.isSuperAdmin && u.id !== id
        );
        
        if (activeSuperAdmins.length === 0) {
          return res.status(400).json({ 
            message: "Cannot demote the last active super-admin. At least one super-admin must remain." 
          });
        }
      }

      // CRITICAL: Last admin protection (for admin -> non-admin changes)
      if (previousUser.role === 'admin' && validatedData.role !== 'admin') {
        const activeAdminCount = await storage.countAdminUsers();
        if (activeAdminCount <= 1) {
          return res.status(400).json({ 
            message: "Cannot demote the last active admin user. At least one admin must remain to manage the system." 
          });
        }
      }

      const updatedUser = await storage.updateUserRole(id, validatedData.role);

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "update",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Super-admin changed user role from ${previousUser?.role} to ${validatedData.role}`,
        oldValues: previousUser,
        newValues: updatedUser
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  }
);

// PUT /api/super-admin/users/:id/super-admin - Grant/revoke super-admin privileges
superAdminRouter.put("/:id/super-admin",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const superAdminSchema = z.object({
        isSuperAdmin: z.boolean()
      });
      
      const { isSuperAdmin } = superAdminSchema.parse(req.body);
      
      const previousUser = await storage.getUser(id);
      if (!previousUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent super-admin from revoking their own privileges
      if (req.user?.id === id && (req.user as any).isSuperAdmin && !isSuperAdmin) {
        return res.status(400).json({ 
          message: "Super-admin cannot revoke their own super-admin privileges" 
        });
      }

      // CRITICAL: Last super-admin protection
      if (previousUser.isSuperAdmin && !isSuperAdmin) {
        const allUsers = await storage.getAllUsers();
        const activeSuperAdmins = allUsers.filter(u => 
          u.isActive && u.isSuperAdmin && u.id !== id
        );
        
        if (activeSuperAdmins.length === 0) {
          return res.status(400).json({ 
            message: "Cannot revoke super-admin privileges from the last active super-admin. At least one super-admin must remain." 
          });
        }
      }

      // If granting super-admin, ensure user is at least admin
      if (isSuperAdmin && previousUser.role !== 'admin') {
        return res.status(400).json({ 
          message: "Only admin users can be granted super-admin privileges. Please promote user to admin first." 
        });
      }

      const updatedUser = await storage.updateSuperAdminStatus(id, isSuperAdmin);

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "update",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Super-admin ${isSuperAdmin ? 'granted' : 'revoked'} super-admin privileges for ${previousUser.email}`,
        oldValues: { isSuperAdmin: previousUser.isSuperAdmin },
        newValues: { isSuperAdmin }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating super-admin status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update super-admin status" });
    }
  }
);

// POST /api/super-admin/users/:id/password - Set user password directly (super-admin only)
superAdminRouter.post("/:id/password",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const passwordSchema = z.object({
        password: z.string().min(6, "Password must be at least 6 characters")
      });
      
      const { password } = passwordSchema.parse(req.body);
      
      // Get user from our database
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if AUTH_PROVIDER is supabase
      if (process.env.AUTH_PROVIDER !== 'supabase') {
        return res.status(400).json({ error: "Direct password management is only available when using Supabase authentication" });
      }

      if (!user.authProviderUserId) {
        return res.status(400).json({ error: "User does not have a linked authentication account" });
      }

      // Update password via Supabase Admin API
      const admin = supabaseAdmin();
      const { error: updateError } = await admin.auth.admin.updateUserById(
        user.authProviderUserId,
        { password }
      );

      if (updateError) {
        console.error("Supabase password update error:", updateError);
        return res.status(500).json({ error: "Failed to update password" });
      }

      // Invalidate all refresh tokens to force re-login
      const { error: signOutError } = await admin.auth.admin.signOutUser(user.authProviderUserId);
      if (signOutError) {
        console.warn("Failed to invalidate refresh tokens:", signOutError);
        // Don't fail the request for this, just log the warning
      }

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "update",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Super-admin set new password for user ${user.email} (refresh tokens invalidated)`,
        oldValues: undefined,
        newValues: { action: 'password_updated', tokensInvalidated: !signOutError }
      });

      res.json({ 
        message: "Password updated successfully. User must log in again.",
        tokensInvalidated: !signOutError
      });
    } catch (error) {
      console.error("Error setting user password:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to set password" });
    }
  }
);

// DELETE /api/super-admin/users/:id - Delete user account (super-admin only)
superAdminRouter.delete("/:id",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get user from our database
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent super-admin from deleting themselves
      if (req.user?.id === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      // CRITICAL: Last super-admin protection
      if (user.isSuperAdmin) {
        const allUsers = await storage.getAllUsers();
        const activeSuperAdmins = allUsers.filter(u => 
          u.isActive && u.isSuperAdmin && u.id !== id
        );
        
        if (activeSuperAdmins.length === 0) {
          return res.status(400).json({ 
            error: "Cannot delete the last active super-admin. At least one super-admin must remain." 
          });
        }
      }

      // CRITICAL: Last admin protection
      if (user.role === 'admin') {
        const activeAdminCount = await storage.countAdminUsers();
        if (activeAdminCount <= 1) {
          return res.status(400).json({ 
            error: "Cannot delete the last active admin user. At least one active admin must remain to manage the system." 
          });
        }
      }

      // Check for business records linked to this user 
      // Use a simple business record check (similar to existing admin.ts)
      try {
        // For now, use the same simple check as in admin.ts
        // This checks core business operations for user involvement
        const [
          capitalEntries,
          purchases,
          operatingExpenses
        ] = await Promise.all([
          storage.getCapitalEntries(),
          storage.getPurchases(), 
          storage.getOperatingExpenses()
        ]);

        const hasCapitalEntries = capitalEntries.some((entry: any) => entry.createdBy === id);
        const hasPurchases = purchases.some((purchase: any) => 
          purchase.createdBy === id || purchase.userId === id
        );
        const hasOperatingExpenses = operatingExpenses.some((expense: any) => 
          expense.createdBy === id
        );

        const hasBusinessRecords = hasCapitalEntries || hasPurchases || hasOperatingExpenses;

        if (hasBusinessRecords) {
          // Perform soft delete instead of hard delete
          const updatedUser = await storage.updateUserStatus(id, false);
          
          // CRITICAL: Invalidate Supabase sessions on deactivation to prevent continued access
          if (process.env.AUTH_PROVIDER === 'supabase' && user.authProviderUserId) {
            const admin = supabaseAdmin();
            const { error: signOutError } = await admin.auth.admin.signOutUser(user.authProviderUserId);
            if (signOutError) {
              console.warn("Failed to invalidate sessions on user deactivation:", signOutError);
            }
          }
          
          // Create audit log for soft delete
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "update",
            entityType: "user",
            entityId: id,
            operationType: "user_role_change",
            description: `Super-admin soft-deleted user ${user.email} (has linked business records, sessions invalidated)`,
            oldValues: user,
            newValues: { ...updatedUser, deletionReason: 'has_business_records' }
          });

          return res.json({ 
            message: "User has linked business records. Account has been deactivated and sessions invalidated.",
            action: "soft_delete",
            user: updatedUser,
            businessRecordsFound: true
          });
        }
      } catch (auditError) {
        console.error("Error checking business records, defaulting to soft delete:", auditError);
        // If we can't check business records, err on the side of caution and do soft delete
        const updatedUser = await storage.updateUserStatus(id, false);
        
        // CRITICAL: Invalidate Supabase sessions on deactivation to prevent continued access
        if (process.env.AUTH_PROVIDER === 'supabase' && user.authProviderUserId) {
          const admin = supabaseAdmin();
          const { error: signOutError } = await admin.auth.admin.signOutUser(user.authProviderUserId);
          if (signOutError) {
            console.warn("Failed to invalidate sessions on user deactivation:", signOutError);
          }
        }
        
        // Create audit log for soft delete
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "update",
          entityType: "user",
          entityId: id,
          operationType: "user_role_change",
          description: `Super-admin soft-deleted user ${user.email} (business record check failed, sessions invalidated)`,
          oldValues: user,
          newValues: { ...updatedUser, deletionReason: 'audit_check_failed' }
        });

        return res.json({ 
          message: "Unable to verify business records. Account has been deactivated for safety and sessions invalidated.",
          action: "soft_delete",
          user: updatedUser
        });
      }

      // No business records, proceed with hard delete
      // First delete from Supabase if using Supabase auth
      if (process.env.AUTH_PROVIDER === 'supabase' && user.authProviderUserId) {
        const admin = supabaseAdmin();
        const { error: deleteError } = await admin.auth.admin.deleteUser(user.authProviderUserId);
        
        if (deleteError) {
          console.error("Supabase user deletion error:", deleteError);
          return res.status(500).json({ error: "Failed to delete authentication account" });
        }
      }

      // Delete from local database
      const context = auditService.extractRequestContext(req);
      const deletedUser = await storage.deleteUser(id, context);

      // Create audit log for hard delete
      await auditService.logOperation(context, {
        action: "delete",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Super-admin permanently deleted user ${user.email} (no business records)`,
        oldValues: user,
        newValues: undefined
      });

      res.json({ 
        message: "User account permanently deleted successfully.",
        action: "hard_delete",
        deletedUser
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);