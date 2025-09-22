import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireSuperAdmin } from "../core/auth";
import { supabaseAdmin } from "../core/auth/providers/supabaseProvider";
import { auditService } from "../auditService";
import { insertUserSchema, userRoleUpdateSchema } from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";

// Rate limiter for delete operations - super admins get more lenient limits
const deleteRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // limit to 10 requests per windowMs
  message: { 
    success: false,
    code: "rate_limit_exceeded",
    message: "Too many deletion requests, please try again later" 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
      const { error: signOutError } = await admin.auth.signOutUser(user.authProviderUserId);
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
  deleteRateLimiter,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check for force deletion flag (super-admin privilege)
      const forceDelete = req.query.force === 'true' || req.headers['x-force-delete'] === 'true';
      
      // Get user from our database
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          code: "user_not_found",
          message: "User not found"
        });
      }

      // Check if user is already deleted/anonymized (idempotency)
      if (user.email?.includes("@anonymized.local") || user.firstName === "[DELETED]") {
        // Log the noop operation
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "delete",
          entityType: "user",
          entityId: id,
          operationType: "user_role_change",
          description: `Attempted to delete already-anonymized user (noop)`,
          oldValues: undefined,
          newValues: { mode: "noop", alreadyDeleted: true }
        });
        
        return res.json({ 
          success: true,
          mode: "noop",
          message: "User already deleted"
        });
      }

      // Prevent super-admin from deleting themselves
      if (req.user?.id === id) {
        // Log the self-deletion attempt
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "delete",
          entityType: "user",
          entityId: id,
          operationType: "user_role_change",
          description: `Super-admin attempted to delete their own account (blocked)`,
          oldValues: undefined,
          newValues: { blocked: true, reason: 'self_delete_forbidden' }
        });
        
        return res.status(400).json({ 
          success: false,
          code: "self_delete_forbidden",
          message: "Cannot delete your own account"
        });
      }

      // CRITICAL: Last super-admin protection
      if (user.isSuperAdmin) {
        const allUsers = await storage.getAllUsers();
        const activeSuperAdmins = allUsers.filter(u => 
          u.isActive && u.isSuperAdmin && u.id !== id
        );
        
        if (activeSuperAdmins.length === 0) {
          // Log the last super-admin deletion attempt
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "delete",
            entityType: "user",
            entityId: id,
            operationType: "user_role_change",
            description: `Attempted to delete last super-admin ${user.email} (blocked)`,
            oldValues: undefined,
            newValues: { blocked: true, reason: 'last_super_admin' }
          });
          
          return res.status(400).json({ 
            success: false,
            code: "last_admin_blocked",
            message: "Cannot delete the last active super-admin. At least one super-admin must remain."
          });
        }
      }

      // CRITICAL: Last admin protection - Check admin count AFTER theoretical deletion
      if (user.role === 'admin' && user.isActive) {
        const allUsers = await storage.getAllUsers();
        // Count remaining active admins AFTER this user would be deleted
        const remainingActiveAdmins = allUsers.filter(u => 
          u.isActive && u.role === 'admin' && u.id !== id
        );
        
        if (remainingActiveAdmins.length === 0 && !forceDelete) {
          // Log the last admin deletion attempt
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "delete",
            entityType: "user",
            entityId: id,
            operationType: "user_role_change",
            description: `Attempted to delete last admin ${user.email} (blocked, no force override)`,
            oldValues: undefined,
            newValues: { blocked: true, reason: 'last_admin_blocked' }
          });
          
          return res.status(400).json({ 
            success: false,
            code: "last_admin_blocked",
            message: "Cannot delete the last active admin user. At least one active admin must remain to manage the system. Use force=true to override (dangerous)."
          });
        }
      }

      // Check for business records linked to this user (unless force deletion is enabled)
      if (!forceDelete) {
        try {
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
            // Perform soft delete/anonymization instead of hard delete
            const updatedUser = await storage.updateUserStatus(id, false);
            
            // CRITICAL: Invalidate Supabase sessions on deactivation to prevent continued access
            if (process.env.AUTH_PROVIDER === 'supabase' && user.authProviderUserId) {
              const admin = supabaseAdmin();
              const { error: signOutError } = await admin.auth.signOutUser(user.authProviderUserId);
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
              description: `Super-admin soft-deleted/anonymized user ${user.email} (has linked business records, sessions invalidated)`,
              oldValues: user,
              newValues: { ...updatedUser, deletionReason: 'has_business_records', sessionsInvalidated: true }
            });

            return res.json({ 
              success: true,
              mode: "soft",
              message: "User anonymized due to linked records"
            });
          }
        } catch (auditError) {
          console.error("Error checking business records:", auditError);
          // If force delete is not enabled and we can't check, return error
          return res.status(500).json({
            success: false,
            code: "linked_records_found",
            message: "Unable to verify business records. Use force=true to override."
          });
        }
      }

      // No business records or force delete enabled, proceed with hard delete
      // First attempt to delete from Supabase if using Supabase auth
      let sessionsInvalidated = false;
      
      if (process.env.AUTH_PROVIDER === 'supabase' && user.authProviderUserId) {
        try {
          const admin = supabaseAdmin();
          
          // First invalidate all sessions
          const { error: signOutError } = await admin.auth.signOutUser(user.authProviderUserId);
          if (!signOutError) {
            sessionsInvalidated = true;
          }
          
          // Then delete the user
          const { error: deleteError } = await admin.auth.admin.deleteUser(user.authProviderUserId);
          
          if (deleteError) {
            // Check if it's a 404 "User not found" error - this is OK (idempotent deletion)
            if (deleteError.status === 404 || 
                deleteError.message?.toLowerCase().includes('user not found') ||
                deleteError.message?.toLowerCase().includes('not found')) {
              console.info(`Supabase user not found for ${user.email} - treating as already deleted`);
            } else {
              // Non-404 error - log warning but continue with local deletion
              console.warn(`Failed to delete Supabase user for ${user.email}, continuing with local deletion:`, deleteError);
            }
          }
        } catch (supabaseError: any) {
          // Unexpected error - log warning but continue with local deletion
          console.warn(`Unexpected error during Supabase deletion for ${user.email}, continuing with local deletion:`, supabaseError);
        }
      }

      // Always proceed with local database deletion regardless of Supabase result
      const context = auditService.extractRequestContext(req);
      const deletedUser = await storage.deleteUser(id, context);

      // Create comprehensive audit log for hard delete
      await auditService.logOperation(context, {
        action: "delete",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Super-admin permanently deleted user ${user.email} (${forceDelete ? 'force deletion' : 'no business records'})`,
        oldValues: user,
        newValues: { 
          deletionType: 'hard_delete',
          forceDelete,
          sessionsInvalidated,
          deletedBy: req.user?.id,
          timestamp: new Date().toISOString()
        }
      });

      res.json({ 
        success: true,
        mode: "hard",
        message: "User deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      
      // Log the failed deletion attempt
      try {
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "delete",
          entityType: "user",
          entityId: req.params.id,
          operationType: "user_role_change",
          description: `Failed to delete user: ${error}`,
          oldValues: undefined,
          newValues: { error: String(error), failed: true }
        });
      } catch (logError) {
        console.error("Failed to log deletion error:", logError);
      }
      
      res.status(500).json({ 
        success: false,
        code: "internal_error",
        message: "Failed to delete user"
      });
    }
  }
);

// POST /api/super-admin/users/:id/anonymize - Anonymize user data with PII removal (super-admin only)
superAdminRouter.post("/:id/anonymize",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get user data first
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // SECURITY: Prevent self-anonymization
      if (req.user?.id === id) {
        return res.status(400).json({ 
          error: "Cannot anonymize your own account" 
        });
      }

      // SECURITY: Prevent anonymizing super-admin users
      if (user.isSuperAdmin) {
        return res.status(400).json({ 
          error: "Cannot anonymize super-admin users for security reasons" 
        });
      }

      // SECURITY: Protect last active admin - check if this would leave system without admins
      if (user.role === 'admin' && user.isActive) {
        const activeAdminCount = await storage.countAdminUsers();
        if (activeAdminCount <= 1) {
          return res.status(400).json({ 
            error: "Cannot anonymize the last active admin user. At least one active admin must remain to manage the system." 
          });
        }
      }

      // Check for business records first
      const businessCheck = await storage.checkUserBusinessRecords(id);
      
      const context = auditService.extractRequestContext(req);
      
      if (businessCheck.hasRecords) {
        // Anonymize user data
        const anonymizedUser = await storage.anonymizeUserData(id, context);

        // Invalidate sessions if using Supabase
        if (process.env.AUTH_PROVIDER === 'supabase' && user.authProviderUserId) {
          const admin = supabaseAdmin();
          await admin.auth.signOutUser(user.authProviderUserId);
        }

        res.json({ 
          message: "User data anonymized successfully. All sessions have been invalidated.",
          action: "anonymize",
          anonymizedUser,
          businessRecords: businessCheck
        });
      } else {
        res.status(400).json({ 
          error: "User has no business records. Consider permanent deletion instead of anonymization.",
          suggestion: "Use DELETE /api/super-admin/users/:id for complete removal"
        });
      }
    } catch (error) {
      console.error("Error anonymizing user:", error);
      res.status(500).json({ error: "Failed to anonymize user data" });
    }
  }
);

// GET /api/super-admin/users/:id/business-records - Check user's business record dependencies (super-admin only)
superAdminRouter.get("/:id/business-records",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get user data first
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check comprehensive business records
      const businessCheck = await storage.checkUserBusinessRecords(id);
      
      res.json({ 
        userId: id,
        userEmail: user.email,
        businessRecords: businessCheck
      });
    } catch (error) {
      console.error("Error checking user business records:", error);
      res.status(500).json({ error: "Failed to check user business records" });
    }
  }
);

// POST /api/super-admin/users/bulk-cleanup - Bulk cleanup of multiple users (super-admin only)
superAdminRouter.post("/bulk-cleanup",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const bulkCleanupSchema = z.object({
        userIds: z.array(z.string()).min(1, "At least one user ID is required"),
        confirm: z.literal(true, {
          errorMap: () => ({ message: "Must confirm bulk cleanup operation by setting confirm: true" })
        })
      });

      const { userIds, confirm } = bulkCleanupSchema.parse(req.body);
      
      if (userIds.length > 50) {
        return res.status(400).json({ 
          error: "Cannot process more than 50 users at once for safety reasons" 
        });
      }

      // SECURITY: Prevent bulk cleanup if it includes the current user
      if (userIds.includes(req.user?.id || '')) {
        return res.status(400).json({ 
          error: "Cannot include your own account in bulk cleanup" 
        });
      }

      const context = auditService.extractRequestContext(req);
      const results = await storage.bulkCleanupUsers(userIds, context);

      // Create comprehensive audit log for bulk operation
      await auditService.logOperation(context, {
        action: "delete",
        entityType: "user",
        entityId: "bulk_operation",
        operationType: "user_role_change",
        description: `Super-admin performed bulk user cleanup: ${results.successful}/${results.processed} users processed successfully`,
        oldValues: { userIds, requestedCount: userIds.length },
        newValues: results
      });

      res.json({ 
        message: `Bulk cleanup completed: ${results.successful}/${results.processed} users processed successfully`,
        summary: results
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error in bulk user cleanup:", error);
      res.status(500).json({ error: "Failed to perform bulk user cleanup" });
    }
  }
);