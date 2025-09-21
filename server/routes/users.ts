import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { supabaseAdmin } from "../core/auth/providers/supabaseProvider";
import { auditService } from "../auditService";
import { approvalWorkflowService } from "../approvalWorkflowService";
import { insertUserSchema, userRoleUpdateSchema } from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";
import { z } from "zod";

export const usersRouter = Router();

// GET /api/users
usersRouter.get("/",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
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
      
      // Create user in local database first
      const user = await storage.createUser(validatedData);

      // If using Supabase, create/invite user in Supabase as well
      if (process.env.AUTH_PROVIDER === 'supabase' && user.email) {
        try {
          const admin = supabaseAdmin();
          const { data, error } = await admin.auth.admin.createUser({
            email: user.email,
            password: req.body.temporaryPassword || generateTemporaryPassword(),
            email_confirm: true,
            user_metadata: {
              first_name: user.firstName,
              last_name: user.lastName,
              role: user.role
            }
          });

          if (error) {
            console.warn(`Supabase user creation failed for ${user.email}:`, error);
            // Don't fail the entire operation, just log the warning
          } else {
            console.log(`Created Supabase user for ${user.email} with ID: ${data.user?.id}`);
          }
        } catch (supabaseError) {
          console.warn("Supabase user creation error:", supabaseError);
          // Continue with local user creation even if Supabase fails
        }
      }

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "user",
        entityId: user.id,
        description: `Created user: ${user.email}${process.env.AUTH_PROVIDER === 'supabase' ? ' (with Supabase account)' : ''}`,
        previousState: null,
        newState: user
      });

      res.status(201).json({
        ...user,
        message: process.env.AUTH_PROVIDER === 'supabase' 
          ? "User created successfully. They will receive an email to set their password."
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

// Helper function to generate temporary password
function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '123!';
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
      await auditService.logAction({
        userId: req.user!.id,
        action: "UPDATE",
        entityType: "user",
        entityId: id,
        description: `Changed user role from ${previousUser?.role} to ${validatedData.role}`,
        previousState: previousUser,
        newState: updatedUser
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
      await auditService.logAction({
        userId: req.user!.id,
        action: "UPDATE",
        entityType: "user",
        entityId: id,
        description: `Changed user status to ${isActive ? 'active' : 'inactive'}`,
        previousState: previousUser,
        newState: updatedUser
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

// POST /api/users/:id/reset-password - Admin password reset (Supabase)
usersRouter.post("/:id/reset-password",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get user from our database
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if AUTH_PROVIDER is supabase
      if (process.env.AUTH_PROVIDER !== 'supabase') {
        return res.status(400).json({ message: "Password reset is only available when using Supabase authentication" });
      }

      // Send password reset email via Supabase Admin API
      const admin = supabaseAdmin();
      const { error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: user.email!,
        options: {
          redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/auth/reset-password`
        }
      });

      if (error) {
        console.error("Supabase password reset error:", error);
        return res.status(500).json({ message: "Failed to send password reset email" });
      }

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "ADMIN_ACTION",
        entityType: "user",
        entityId: id,
        description: `Admin initiated password reset for user ${user.email}`,
        previousState: null,
        newState: { action: 'password_reset_initiated' }
      });

      res.json({ message: "Password reset email sent successfully" });
    } catch (error) {
      console.error("Error initiating password reset:", error);
      res.status(500).json({ message: "Failed to initiate password reset" });
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
      await auditService.logAction({
        userId: req.user!.id,
        action: "UPDATE",
        entityType: "user",
        entityId: id,
        description: `Updated display name from '${previousUser.firstName} ${previousUser.lastName}' to '${firstName} ${lastName}'`,
        previousState: { firstName: previousUser.firstName, lastName: previousUser.lastName },
        newState: { firstName, lastName }
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