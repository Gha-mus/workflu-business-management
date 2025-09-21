import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { auditService } from "../auditService";
import { approvalWorkflowService } from "../approvalWorkflowService";
import { insertUserSchema, userRoleUpdateSchema } from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";

export const usersRouter = Router();

// GET /api/users
usersRouter.get("/",
  isAuthenticated,
  requireRole(["admin", "manager"]),
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

// POST /api/users
usersRouter.post("/",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "user",
        entityId: user.id,
        description: `Created user: ${user.email}`,
        previousState: null,
        newState: user
      });

      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  }
);

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
  requireRole(["admin", "manager"]),
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
      const { status } = req.body;
      
      const previousUser = await storage.getUser(id);
      const updatedUser = await storage.updateUserStatus(id, status);

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "UPDATE",
        entityType: "user",
        entityId: id,
        description: `Changed user status to ${status}`,
        previousState: previousUser,
        newState: updatedUser
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  }
);