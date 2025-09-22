import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { supabaseAdmin } from "../core/auth/providers/supabaseProvider";
import { auditService } from "../auditService";
import { z } from "zod";

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
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get user from our database
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      // CRITICAL: Prevent deleting the last active admin (organization lockout protection)
      if (user.role === 'admin') {
        const activeAdminCount = await storage.countAdminUsers(); // This counts only active admins
        if (activeAdminCount <= 1) {
          return res.status(400).json({ 
            error: "Cannot delete the last active admin user. At least one active admin must remain to manage the system." 
          });
        }
      }

      // Check for business records linked to this user
      const hasBusinessRecords = await checkUserHasBusinessRecords(id);
      if (hasBusinessRecords) {
        // CRITICAL: Also check for last active admin on soft delete (deactivation)
        if (user.role === 'admin') {
          const activeAdminCount = await storage.countAdminUsers();
          if (activeAdminCount <= 1) {
            return res.status(400).json({ 
              error: "Cannot deactivate the last active admin user. At least one active admin must remain to manage the system." 
            });
          }
        }
        
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
          description: `Admin soft-deleted user ${user.email} (has linked business records, sessions invalidated)`,
          oldValues: user,
          newValues: { ...updatedUser, deletionReason: 'has_business_records' }
        });

        return res.json({ 
          message: "User has linked business records. Account has been deactivated and sessions invalidated.",
          action: "soft_delete",
          user: updatedUser
        });
      }

      // No business records, proceed with hard delete
      // First attempt to delete from Supabase if using Supabase auth and user has a Supabase ID
      let supabaseDeleted = false;
      let supabaseDeletionNote = '';
      
      if (process.env.AUTH_PROVIDER === 'supabase' && user.authProviderUserId) {
        try {
          const admin = supabaseAdmin();
          const { error: deleteError } = await admin.auth.admin.deleteUser(user.authProviderUserId);
          
          if (deleteError) {
            // Check if it's a 404 "User not found" error - this is OK (idempotent deletion)
            if (deleteError.status === 404 || 
                deleteError.message?.toLowerCase().includes('user not found') ||
                deleteError.message?.toLowerCase().includes('not found')) {
              // User doesn't exist in Supabase (legacy user or already deleted) - this is fine
              console.info(`Supabase user not found for ${user.email} (ID: ${user.authProviderUserId}) - treating as already deleted`);
              supabaseDeleted = true;
              supabaseDeletionNote = ' (Supabase account was already absent)';
            } else {
              // Non-404 error - log warning but continue with local deletion
              console.warn(`Failed to delete Supabase user for ${user.email}, continuing with local deletion:`, deleteError);
              supabaseDeletionNote = ' (Supabase deletion failed but local deletion proceeded)';
            }
          } else {
            // Successfully deleted from Supabase
            supabaseDeleted = true;
            supabaseDeletionNote = ' (Supabase account deleted)';
          }
        } catch (supabaseError: any) {
          // Unexpected error - log warning but continue with local deletion
          console.warn(`Unexpected error during Supabase deletion for ${user.email}, continuing with local deletion:`, supabaseError);
          supabaseDeletionNote = ' (Supabase deletion error but local deletion proceeded)';
        }
      } else if (process.env.AUTH_PROVIDER === 'supabase' && !user.authProviderUserId) {
        // Legacy user without Supabase account
        console.info(`User ${user.email} has no Supabase account (legacy user) - skipping Supabase deletion`);
        supabaseDeletionNote = ' (legacy user without Supabase account)';
      }

      // Always proceed with local database deletion regardless of Supabase result
      const context = auditService.extractRequestContext(req);
      const deletedUser = await storage.deleteUser(id, context);

      // Create audit log for hard delete
      await auditService.logOperation(context, {
        action: "delete",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Admin permanently deleted user ${user.email} (no business records)${supabaseDeletionNote}`,
        oldValues: user,
        newValues: undefined
      });

      res.json({ 
        message: `User account permanently deleted successfully${supabaseDeletionNote}`,
        action: "hard_delete",
        deletedUser
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
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