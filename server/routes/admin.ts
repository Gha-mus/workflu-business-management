import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { supabaseAdmin } from "../core/auth/providers/supabaseProvider";
import { auditService } from "../auditService";
import { z } from "zod";
import rateLimit from "express-rate-limit";

// Rate limiter for delete operations - admins get standard limits
const deleteRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // limit to 5 requests per windowMs (stricter than super-admin)
  message: { 
    success: false,
    code: "rate_limit_exceeded",
    message: "Too many deletion requests, please try again later" 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminRouter = Router();

// POST /api/admin/users/:id/password - Set user password directly (admin only)
adminRouter.post("/users/:id/password",
  isAuthenticated,
  requireRole(["admin"]),
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
        description: `Admin set new password for user ${user.email} (refresh tokens invalidated)`,
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

// DELETE /api/admin/users/:id - Delete user account with safeguards (admin only)
adminRouter.delete("/users/:id",
  isAuthenticated,
  requireRole(["admin"]),
  deleteRateLimiter,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Force deletion is not allowed for regular admins - only super-admins can force delete
      
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

      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        // Log the self-deletion attempt
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "delete",
          entityType: "user",
          entityId: id,
          operationType: "user_role_change",
          description: `Admin attempted to delete their own account (blocked)`,
          oldValues: undefined,
          newValues: { blocked: true, reason: 'self_delete_forbidden' }
        });
        
        return res.status(400).json({ 
          success: false,
          code: "self_delete_forbidden",
          message: "Cannot delete your own account"
        });
      }

      // CRITICAL: Admin cannot delete super-admin users
      if (user.isSuperAdmin) {
        // Log the unauthorized deletion attempt
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "delete",
          entityType: "user",
          entityId: id,
          operationType: "user_role_change",
          description: `Admin attempted to delete super-admin ${user.email} (blocked - insufficient privileges)`,
          oldValues: undefined,
          newValues: { blocked: true, reason: 'insufficient_privileges' }
        });
        
        return res.status(403).json({ 
          success: false,
          code: "insufficient_privileges",
          message: "Cannot delete super-admin users. Only super-admins can delete other super-admins."
        });
      }

      // CRITICAL: Last admin protection - Check admin count AFTER theoretical deletion
      if (user.role === 'admin' && user.isActive) {
        const allUsers = await storage.getAllUsers();
        // Count remaining active admins AFTER this user would be deleted
        const remainingActiveAdmins = allUsers.filter(u => 
          u.isActive && u.role === 'admin' && u.id !== id
        );
        
        if (remainingActiveAdmins.length === 0) {
          // Log the last admin deletion attempt
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "delete",
            entityType: "user",
            entityId: id,
            operationType: "user_role_change",
            description: `Attempted to delete last admin ${user.email} (blocked)`,
            oldValues: undefined,
            newValues: { blocked: true, reason: 'last_admin_blocked' }
          });
          
          return res.status(400).json({ 
            success: false,
            code: "last_admin_blocked",
            message: "Cannot delete the last active admin user. At least one active admin must remain to manage the system."
          });
        }
      }

      // Check for business records linked to this user
      {
        const hasBusinessRecords = await checkUserHasBusinessRecords(id);
        if (hasBusinessRecords) {
          // Check if soft delete would leave no active admins
          if (user.role === 'admin' && user.isActive) {
            const allUsers = await storage.getAllUsers();
            const remainingActiveAdmins = allUsers.filter(u => 
              u.isActive && u.role === 'admin' && u.id !== id
            );
            
            if (remainingActiveAdmins.length === 0) {
              return res.status(400).json({ 
                success: false,
                code: "last_admin_blocked",
                message: "Cannot deactivate the last active admin user. At least one active admin must remain to manage the system."
              });
            }
          }
          
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
            description: `Admin soft-deleted/anonymized user ${user.email} (has linked business records, sessions invalidated)`,
            oldValues: user,
            newValues: { ...updatedUser, deletionReason: 'has_business_records', sessionsInvalidated: true }
          });

          return res.json({ 
            success: true,
            mode: "soft",
            message: "User anonymized due to linked records"
          });
        }
      }

      // No business records, proceed with hard delete
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
        description: `Admin permanently deleted user ${user.email} (no business records)`,
        oldValues: user,
        newValues: { 
          deletionType: 'hard_delete',
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

// Helper function to check if user has linked business records
async function checkUserHasBusinessRecords(userId: string): Promise<boolean> {
  try {
    // COMPREHENSIVE CHECK: Check core business modules for user involvement
    // This prevents hard deletion of users who have critical business data linked
    
    // Get key business records and check for user association
    const [
      capitalEntries,
      purchases,
      operatingExpenses
    ] = await Promise.all([
      storage.getCapitalEntries(),
      storage.getPurchases(), 
      storage.getOperatingExpenses()
    ]);

    // Check for user involvement in core business operations
    const hasCapitalEntries = capitalEntries.some((entry: any) => entry.createdBy === userId);
    const hasPurchases = purchases.some((purchase: any) => 
      purchase.createdBy === userId || purchase.userId === userId
    );
    const hasOperatingExpenses = operatingExpenses.some((expense: any) => 
      expense.createdBy === userId
    );

    // If ANY core business records exist, prevent hard deletion
    const hasBusinessRecords = hasCapitalEntries || hasPurchases || hasOperatingExpenses;
    
    // Note: This is a conservative check covering the most critical business operations.
    // For maximum safety, we err on the side of soft deletion to prevent data loss.
    return hasBusinessRecords;
  } catch (error) {
    console.error("Error checking user business records:", error);
    // If we can't check, err on the side of caution and prevent hard deletion
    return true;
  }
}