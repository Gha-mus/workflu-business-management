import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { supabaseAdmin } from "../core/auth/providers/supabaseProvider";
import { auditService } from "../auditService";
import { approvalWorkflowService } from "../approvalWorkflowService";
import { insertUserSchema, userRoleUpdateSchema } from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";
import { z } from "zod";
import { isSystemUser } from "../core/systemUserGuard";
import rateLimit from "express-rate-limit";

// Rate limiter for password reset operations
const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 3, // limit to 3 password reset requests per windowMs per IP
  message: { 
    success: false,
    code: "rate_limit_exceeded",
    message: "Too many password reset requests, please try again later" 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const usersRouter = Router();

// GET /api/users
usersRouter.get("/",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Filter out system user from the UI using centralized guard
      const filteredUsers = users.filter(user => !isSystemUser(user));
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
);

// GET /api/users/me
usersRouter.get("/me", isAuthenticated, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Failed to fetch current user" });
  }
});

// POST /api/users - Create user with optional Supabase integration
usersRouter.post("/",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
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
        roles: validatedData.roles ? [...validatedData.roles] : null
      });

      // Note: Supabase user was already created above before local database user

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "create",
        entityType: "user",
        entityId: user.id,
        operationType: "user_role_change",
        description: `Created user: ${user.email}${process.env.AUTH_PROVIDER === 'supabase' ? ' (with Supabase account)' : ''}`,
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

// PUT /api/users/:id/role
usersRouter.put("/:id/role",
  isAuthenticated,
  requireRole(["admin"]),
  requireApproval("user_role_change"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = userRoleUpdateSchema.parse(req.body);
      
      const previousUser = await storage.getUser(id);
      const updatedUser = await storage.updateUserRole(id, validatedData.role);

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "update",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Changed user role from ${previousUser?.role} to ${validatedData.role}`,
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

// GET /api/users/:id
usersRouter.get("/:id",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }
);

// PUT /api/users/:id/status
usersRouter.put("/:id/status",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const statusSchema = z.object({
        isActive: z.boolean()
      });
      
      const { isActive } = statusSchema.parse(req.body);
      
      const previousUser = await storage.getUser(id);
      if (!previousUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUserStatus(id, isActive);

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "update",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Changed user status to ${isActive ? 'active' : 'inactive'}`,
        oldValues: previousUser,
        newValues: updatedUser
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user status" });
    }
  }
);

// POST /api/users/:id/reset-password - Admin password reset (Supabase) with improved validation
usersRouter.post("/:id/reset-password",
  isAuthenticated,
  requireRole(["admin"]),
  passwordResetRateLimiter,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get user from our database
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          code: "user_not_found",
          message: "User not found" 
        });
      }

      // Validate user has an email address
      if (!user.email || user.email.trim() === '') {
        return res.status(400).json({ 
          success: false,
          code: "email_missing",
          message: "User does not have a valid email address" 
        });
      }

      // Check if AUTH_PROVIDER is supabase
      if (process.env.AUTH_PROVIDER !== 'supabase') {
        return res.status(400).json({ 
          success: false,
          code: "auth_provider_mismatch",
          message: "Password reset is only available when using Supabase authentication" 
        });
      }

      // Use Supabase's direct email sending for password reset
      const client = supabaseClient();
      const { error } = await client.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/auth/reset-password`
      });

      if (error) {
        console.error("Supabase password reset error:", error);
        return res.status(500).json({ 
          success: false,
          code: "reset_email_failed",
          message: "Failed to send password reset email through Supabase" 
        });
      }

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "update",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Admin initiated password reset for user ${user.email} via Supabase SMTP`,
        oldValues: undefined,
        newValues: { action: 'password_reset_initiated_supabase' }
      });

      res.json({ 
        success: true,
        message: "Password reset email sent successfully via Supabase" 
      });
    } catch (error) {
      console.error("Error initiating password reset:", error);
      res.status(500).json({ 
        success: false,
        code: "internal_error",
        message: "Failed to initiate password reset" 
      });
    }
  }
);

// PUT /api/users/:id/display-name - Update user display name
usersRouter.put("/:id/display-name",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const displayNameSchema = z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required")
      });
      
      const { firstName, lastName } = displayNameSchema.parse(req.body);
      
      const previousUser = await storage.getUser(id);
      if (!previousUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateDisplayName(id, firstName, lastName);

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "update",
        entityType: "user",
        entityId: id,
        operationType: "user_role_change",
        description: `Updated display name from '${previousUser.firstName} ${previousUser.lastName}' to '${firstName} ${lastName}'`,
        oldValues: { firstName: previousUser.firstName, lastName: previousUser.lastName },
        newValues: { firstName, lastName }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating display name:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update display name" });
    }
  }
);