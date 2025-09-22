import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { supabaseAdmin, supabaseClient } from "../core/auth/providers/supabaseProvider";
import { auditService } from "../auditService";
import { approvalWorkflowService } from "../approvalWorkflowService";
import { insertUserSchema, userRoleUpdateSchema } from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";
import { z } from "zod";
import { isSystemUser } from "../core/systemUserGuard";
import rateLimit from "express-rate-limit";
import { notificationService } from "../notificationService";

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
        isSuperAdmin: false, // Default to false for new users
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
        // Create audit log for failed admin reset attempt
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "password_reset_failed",
          entityType: "user",
          entityId: id,
          operationType: "security_operation",
          description: `Admin password reset failed for user ID ${id}: User not found`,
          oldValues: undefined,
          newValues: { userId: id, error: "user_not_found", initiatedBy: req.user?.email }
        });
        
        return res.status(404).json({ 
          success: false,
          code: "user_not_found",
          message: "User not found" 
        });
      }

      // Validate user has an email address
      if (!user.email || user.email.trim() === '') {
        // Create audit log for failed admin reset attempt
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "password_reset_failed",
          entityType: "user",
          entityId: id,
          operationType: "security_operation",
          description: `Admin password reset failed for user ${user.firstName} ${user.lastName}: No valid email address`,
          oldValues: undefined,
          newValues: { userId: id, error: "email_missing", initiatedBy: req.user?.email }
        });
        
        return res.status(400).json({ 
          success: false,
          code: "email_missing",
          message: "User does not have a valid email address" 
        });
      }

      // Check if AUTH_PROVIDER is supabase
      if (process.env.AUTH_PROVIDER !== 'supabase') {
        // Create audit log for failed admin reset attempt
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "password_reset_failed",
          entityType: "user",
          entityId: id,
          operationType: "security_operation",
          description: `Admin password reset failed for ${user.email}: Auth provider mismatch (${process.env.AUTH_PROVIDER})`,
          oldValues: undefined,
          newValues: { userId: id, email: user.email, error: "auth_provider_mismatch", currentProvider: process.env.AUTH_PROVIDER, initiatedBy: req.user?.email }
        });
        
        return res.status(400).json({ 
          success: false,
          code: "auth_provider_mismatch",
          message: "Password reset is only available when using Supabase authentication" 
        });
      }

      // Generate password reset link using Supabase admin (bypasses rate limits)
      try {
        const admin = supabaseAdmin();
        const { data, error } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email: user.email,
          options: {
            redirectTo: `${req.get('origin') || 'http://localhost:5000'}/auth/reset-password`
          }
        });

        if (error) {
          console.error(`Admin password reset failed for ${user.email}:`, error);
          
          // Check for rate limiting in error object
          const errorMessage = error.message?.toLowerCase() || '';
          const isRateLimit = error.status === 429 || 
                            errorMessage.includes('rate') || 
                            errorMessage.includes('limit') || 
                            errorMessage.includes('too many requests');
          
          // Create audit log for failed admin reset attempt
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "password_reset_failed",
            entityType: "user",
            entityId: user.id,
            operationType: "security_operation",
            description: `Admin password reset failed for ${user.email}: ${error.message}`,
            oldValues: undefined,
            newValues: { email: user.email, error: error.message, isRateLimit, initiatedBy: req.user?.email }
          });
          
          if (isRateLimit) {
            return res.status(429).json({ 
              success: false,
              code: "supabase_rate_limited",
              message: "Too many reset requests. Please try again later." 
            });
          }
          
          return res.status(500).json({ 
            success: false,
            code: "link_generation_failed",
            message: `Failed to generate password reset link: ${error.message}`,
            details: {
              supabaseError: error.message,
              errorCode: error.code,
              status: error.status
            }
          });
        }

        if (!data?.properties?.action_link) {
          console.error(`No action link returned for admin reset: ${user.email}`);
          
          // Create audit log for failed admin reset attempt
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "password_reset_failed",
            entityType: "user",
            entityId: user.id,
            operationType: "security_operation",
            description: `Admin password reset failed for ${user.email}: No action link returned`,
            oldValues: undefined,
            newValues: { email: user.email, error: "no_action_link", initiatedBy: req.user?.email }
          });
          
          return res.status(500).json({ 
            success: false,
            code: "no_action_link",
            message: "No action link returned from Supabase admin generateLink",
            details: {
              supabaseResponse: data,
              error: "no_action_link"
            }
          });
        }

        // Send email via our own SMTP service (bypasses Supabase email rate limits)
        try {
          await notificationService.sendPasswordResetEmail(user.email, data.properties.action_link);
        } catch (smtpError: any) {
          console.error(`SMTP error sending admin reset email to ${user.email}:`, smtpError);
          
          // Create audit log for SMTP failure
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "password_reset_failed",
            entityType: "user",
            entityId: user.id,
            operationType: "security_operation",
            description: `Admin password reset SMTP failure for ${user.email}: ${smtpError.message}`,
            oldValues: undefined,
            newValues: { email: user.email, error: smtpError.message, errorType: "smtp", initiatedBy: req.user?.email }
          });
          
          return res.status(500).json({ 
            success: false,
            code: "smtp_error",
            message: `Failed to send password reset email: ${smtpError.message}`,
            details: {
              smtpError: smtpError.message,
              errorCode: smtpError.code,
              stack: smtpError.stack
            }
          });
        }
        
      } catch (supabaseError: any) {
        console.error(`Supabase admin link generation failed for ${user.email}:`, supabaseError);
        
        // Check for specific Supabase rate limiting errors in thrown exceptions
        const errorMessage = supabaseError.message?.toLowerCase() || '';
        const isRateLimit = errorMessage.includes('rate') || 
                          errorMessage.includes('limit') || 
                          errorMessage.includes('too many requests') ||
                          supabaseError.status === 429;
        
        // Create audit log for failed admin reset attempt
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "password_reset_failed",
          entityType: "user",
          entityId: user.id,
          operationType: "security_operation",
          description: `Admin password reset exception for ${user.email}: ${supabaseError.message}`,
          oldValues: undefined,
          newValues: { email: user.email, error: supabaseError.message, isRateLimit, initiatedBy: req.user?.email }
        });
        
        if (isRateLimit) {
          return res.status(429).json({ 
            success: false,
            code: "supabase_rate_limited",
            message: "Too many reset requests. Please try again later." 
          });
        }
        
        return res.status(500).json({ 
          success: false,
          code: "service_error",
          message: `Admin link generation exception: ${supabaseError.message}`,
          details: {
            error: supabaseError.message,
            stack: supabaseError.stack,
            code: supabaseError.code,
            status: supabaseError.status
          }
        });
      }

      // Create audit log
      const context = auditService.extractRequestContext(req);
      await auditService.logOperation(context, {
        action: "password_reset_initiated",
        entityType: "user",
        entityId: id,
        operationType: "security_operation",
        description: `Admin initiated password reset for user ${user.email} via admin link generation + SMTP`,
        oldValues: undefined,
        newValues: { email: user.email, resetLinkGenerated: true, initiatedBy: req.user?.email }
      });

      res.json({ 
        success: true,
        message: "Password reset email sent successfully via admin link generation" 
      });
    } catch (error) {
      console.error("Error initiating password reset:", error);
      res.status(500).json({ 
        success: false,
        code: "internal_error",
        message: `Internal error during admin password reset: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
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

// POST /api/users/reset-password - Server-side password reset with admin link generation
usersRouter.post("/reset-password",
  passwordResetRateLimiter,
  async (req, res) => {
    try {
      const resetPasswordSchema = z.object({
        email: z.string().email("Valid email is required")
      });
      
      const { email } = resetPasswordSchema.parse(req.body);
      
      // Check if user exists in our database
      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        // Don't reveal if email exists or not for security
        return res.status(200).json({ 
          success: true, 
          message: "If an account with this email exists, a password reset link has been sent." 
        });
      }
      
      // Check if user has Supabase authentication (don't reveal this in response to prevent enumeration)
      if (existingUser.authProvider !== 'supabase' || !existingUser.authProviderUserId) {
        console.log(`Password reset attempted for non-Supabase account: ${email} (provider: ${existingUser.authProvider})`);
        
        // Create audit log for failed reset attempt
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "password_reset_failed",
          entityType: "user",
          entityId: existingUser.id,
          operationType: "security_operation",
          description: `Password reset blocked for ${email} - incompatible auth provider: ${existingUser.authProvider}`,
          oldValues: undefined,
          newValues: { email, reason: "invalid_auth_provider" }
        });
        
        // Return generic success message to prevent enumeration
        return res.status(200).json({ 
          success: true, 
          message: "If an account with this email exists, a password reset link has been sent." 
        });
      }
      
      try {
        // Generate password reset link using Supabase admin (bypasses rate limits)
        const admin = supabaseAdmin();
        const { data, error } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${req.get('origin') || 'http://localhost:5000'}/auth/reset-password`
          }
        });
        
        if (error) {
          console.error(`Failed to generate reset link for ${email}:`, error);
          
          // Check for rate limiting in error object
          const errorMessage = error.message?.toLowerCase() || '';
          const isRateLimit = error.status === 429 || 
                            errorMessage.includes('rate') || 
                            errorMessage.includes('limit') || 
                            errorMessage.includes('too many requests');
          
          // Log internal details but always return generic 200 to prevent enumeration
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "password_reset_failed",
            entityType: "user",
            entityId: existingUser.id,
            operationType: "security_operation",
            description: `Password reset link generation failed for ${email}: ${error.message}`,
            oldValues: undefined,
            newValues: { email, error: error.message, isRateLimit }
          });
          
          return res.status(200).json({ 
            success: true,
            message: "If an account with this email exists, a password reset link has been sent." 
          });
        }
        
        if (!data?.properties?.action_link) {
          console.error(`No action link returned for ${email}`);
          
          // Log internal details but return generic 200 to prevent enumeration
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "password_reset_failed",
            entityType: "user",
            entityId: existingUser.id,
            operationType: "security_operation",
            description: `Password reset failed for ${email}: No action link returned from Supabase`,
            oldValues: undefined,
            newValues: { email, error: "no_action_link" }
          });
          
          return res.status(200).json({ 
            success: true,
            message: "If an account with this email exists, a password reset link has been sent." 
          });
        }
        
        // Send email via our own SMTP service (bypasses Supabase email rate limits)
        try {
          await notificationService.sendPasswordResetEmail(email, data.properties.action_link);
        } catch (smtpError: any) {
          console.error(`SMTP error sending public reset email to ${email}:`, smtpError);
          
          // Create audit log for SMTP failure but return generic 200 to prevent enumeration
          const context = auditService.extractRequestContext(req);
          await auditService.logOperation(context, {
            action: "password_reset_failed",
            entityType: "user",
            entityId: existingUser.id,
            operationType: "security_operation",
            description: `Public password reset SMTP failure for ${email}: ${smtpError.message}`,
            oldValues: undefined,
            newValues: { email, error: smtpError.message, errorType: "smtp" }
          });
          
          // For public route, return generic message to prevent enumeration
          return res.status(200).json({ 
            success: true,
            message: "If an account with this email exists, a password reset link has been sent." 
          });
        }
        
        // Create audit log for password reset action (even for unauthenticated requests)
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "password_reset_initiated",
          entityType: "user",
          entityId: existingUser.id,
          operationType: "security_operation",
          description: `Password reset link generated and sent to ${email}${req.user ? ` by admin user ${req.user.email}` : ' via self-service'}`,
          oldValues: undefined,
          newValues: { email, resetLinkGenerated: true, initiatedBy: req.user?.email || 'self-service' }
        });
        
        console.log(`✅ Password reset link sent to ${email} via admin generation`);
        
        res.status(200).json({ 
          success: true, 
          message: "If an account with this email exists, a password reset link has been sent." 
        });
        
      } catch (supabaseError: any) {
        console.error(`Supabase admin link generation failed for ${email}:`, supabaseError);
        
        // Check for specific Supabase rate limiting errors
        const errorMessage = supabaseError.message?.toLowerCase() || '';
        const isRateLimit = errorMessage.includes('rate') || 
                          errorMessage.includes('limit') || 
                          errorMessage.includes('too many requests') ||
                          supabaseError.status === 429;
        
        // Log internal details but always return generic 200 to prevent enumeration
        const context = auditService.extractRequestContext(req);
        await auditService.logOperation(context, {
          action: "password_reset_failed",
          entityType: "user",
          entityId: existingUser.id,
          operationType: "security_operation",
          description: `Password reset exception for ${email}: ${supabaseError.message}`,
          oldValues: undefined,
          newValues: { email, error: supabaseError.message, isRateLimit }
        });
        
        // Always return generic 200 response to prevent email enumeration
        return res.status(200).json({ 
          success: true,
          message: "If an account with this email exists, a password reset link has been sent." 
        });
      }
      
    } catch (error) {
      console.error("Error in password reset endpoint:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          code: "validation_error",
          message: "Invalid email format", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        success: false,
        code: "internal_error",
        message: `Internal server error in public password reset: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    }
  }
);