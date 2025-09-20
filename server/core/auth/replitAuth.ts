import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import type { User } from "@shared/schema";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "../storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const userData = {
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  };

  // Check if this is a new user or existing user
  const existingUser = await storage.getUser(claims["sub"]);
  
  // If user doesn't exist, check admin bootstrap logic
  if (!existingUser) {
    const adminCount = await storage.countAdminUsers();
    
    // Admin Bootstrap: If no admins exist, make this user an admin
    if (adminCount === 0) {
      console.log(`Admin bootstrap: Promoting user ${userData.email} to admin (first user)`);
      await storage.upsertUser({ ...userData, role: 'admin' });
      return;
    }
  }

  // Regular user creation/update
  await storage.upsertUser(userData);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

/**
 * Role-based access control middleware
 * Checks if the authenticated user has one of the required roles
 */
// Stage 8: Helper function for warehouse scoping enforcement
export async function hasWarehouseScope(userId: string, warehouseCode: string): Promise<boolean> {
  try {
    const scopes = await storage.getUserWarehouseScopes(userId);
    return scopes.some((scope: { warehouseCode: string; isActive: boolean }) => 
      scope.warehouseCode === warehouseCode && scope.isActive);
  } catch (error) {
    console.error("Error checking warehouse scope:", error);
    return false;
  }
}

// Stage 6: Sales warehouse source validation middleware (FIRST/FINAL enforcement)
export function validateWarehouseSource(): RequestHandler {
  return async (req, res, next) => {
    try {
      const body = req.body;
      
      // Stage 6: Validate warehouse source rules from workflow_reference.json
      if (body.warehouseStockId) {
        const warehouseStock = await storage.getWarehouseStockItem(body.warehouseStockId);
        if (!warehouseStock) {
          return res.status(404).json({ message: "Warehouse stock item not found" });
        }

        // HARDENED FIRST/FINAL validation per Stage 6 requirements (warehouse-type based, not status-dependent)
        const warehouse = warehouseStock.warehouse;
        const status = warehouseStock.status;
        
        // Stage 6 Core Rule: FIRST warehouse can only sell non-clean products
        if (warehouse === 'FIRST' && status !== 'NON_CLEAN') {
          // Allow NON_CLEAN status from FIRST warehouse
          if (status !== 'NON_CLEAN') {
            return res.status(400).json({ 
              message: "FIRST warehouse can only sell non-clean products (NON_CLEAN status)",
              field: "warehouseStockId",
              warehouse: warehouse,
              status: status,
              compliance: "Stage 6 - workflow_reference.json FIRST warehouse rule"
            });
          }
        }
        
        // Stage 6 Core Rule: FINAL warehouse can only sell clean products
        if (warehouse === 'FINAL' && status !== 'READY_FOR_SALE') {
          // Allow READY_FOR_SALE status from FINAL warehouse
          if (status !== 'READY_FOR_SALE') {
            return res.status(400).json({ 
              message: "FINAL warehouse can only sell clean products (READY_FOR_SALE status)", 
              field: "warehouseStockId",
              warehouse: warehouse,
              status: status,
              compliance: "Stage 6 - workflow_reference.json FINAL warehouse rule"
            });
          }
        }
        
        // Additional validation: Prevent cross-warehouse violations
        if (warehouse !== 'FIRST' && warehouse !== 'FINAL') {
          return res.status(400).json({ 
            message: "Invalid warehouse type. Only FIRST and FINAL warehouses are supported",
            field: "warehouseStockId",
            warehouse: warehouse,
            status: status
          });
        }
        
        // Store validated warehouse info for downstream use
        req.warehouseInfo = { warehouse, status };
      }

      next();
    } catch (error) {
      console.error("Error in validateWarehouseSource middleware:", error);
      return res.status(500).json({ message: "Internal server error during warehouse validation" });
    }
  };
}

// Stage 6: Sales return validation middleware (SECURITY: always enforces validation, prevents bypass)
export function validateSalesReturn(): RequestHandler {
  return async (req, res, next) => {
    try {
      const body = req.body;
      
      // SECURITY FIX: Always enforce validation using req.params.id to prevent bypass
      const originalSalesOrderId = req.params.id || body.originalSalesOrderId;
      const originalSalesOrderItemId = body.originalSalesOrderItemId;
      
      if (!originalSalesOrderId && !originalSalesOrderItemId) {
        return res.status(400).json({ 
          message: "Original sales order ID or item ID is required for return validation",
          field: "originalSalesOrderId",
          compliance: "Stage 6 - workflow_reference.json return validation requirement"
        });
      }
      
      // HARDENED: Fetch original sale from storage to prevent bypassing
      let originalWarehouse: string | undefined;
      
      if (originalSalesOrderId) {
        const originalOrder = await storage.getSalesOrderWithDetails(originalSalesOrderId);
        if (!originalOrder) {
          return res.status(404).json({ message: "Original sales order not found" });
        }
        
        // For specific item returns, validate against the exact item
        if (originalSalesOrderItemId) {
          const specificItem = originalOrder.items?.find(item => item.id === originalSalesOrderItemId);
          if (!specificItem) {
            return res.status(404).json({ message: "Specific sales order item not found in order" });
          }
          if (specificItem.warehouseStock) {
            originalWarehouse = specificItem.warehouseStock.warehouse;
          }
        } else {
          // For order-level returns, get warehouse from first item (multi-item returns need item-specific validation)
          if (originalOrder.items && originalOrder.items.length > 0) {
            const firstItem = originalOrder.items[0];
            if (firstItem.warehouseStock) {
              originalWarehouse = firstItem.warehouseStock.warehouse;
            }
          }
        }
      } else if (originalSalesOrderItemId) {
        const originalItem = await storage.getSalesOrderItem(originalSalesOrderItemId);
        if (!originalItem || !originalItem.warehouseStockId) {
          return res.status(404).json({ message: "Original sales order item not found" });
        }
        
        const warehouseStock = await storage.getWarehouseStockItem(originalItem.warehouseStockId);
        if (warehouseStock) {
          originalWarehouse = warehouseStock.warehouse;
        }
      }
      
      // Enforce same warehouse return rule
      const returnWarehouse = body.returnToWarehouse;
      if (originalWarehouse && returnWarehouse && originalWarehouse !== returnWarehouse) {
        return res.status(400).json({ 
          message: `Returns must go back to the same warehouse: ${originalWarehouse}`,
          field: "returnToWarehouse",
          expectedWarehouse: originalWarehouse,
          providedWarehouse: returnWarehouse,
          compliance: "Stage 6 - workflow_reference.json same warehouse return rule"
        });
      }

      next();
    } catch (error) {
      console.error("Error in validateSalesReturn middleware:", error);
      return res.status(500).json({ message: "Internal server error during return validation" });
    }
  };
}

// Stage 8: Secure warehouse scoping enforcement for ID-based routes (prevents warehouse spoofing)
export function requireWarehouseScopeForResource(
  fetchResourceFn: (id: string) => Promise<{ warehouse?: string; warehouseLocation?: string } | undefined>
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required for warehouse access" });
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({ message: "Resource ID required for warehouse scope validation" });
      }

      // SECURITY: Fetch resource server-side to get actual warehouse (prevents spoofing)
      const resource = await fetchResourceFn(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      const warehouseCode = resource.warehouse || resource.warehouseLocation;
      if (!warehouseCode) {
        return res.status(400).json({ message: "Resource warehouse location not available" });
      }

      // Check warehouse scope against server-resolved warehouse
      const hasScope = await hasWarehouseScope(userId, warehouseCode);
      if (!hasScope) {
        return res.status(403).json({ 
          message: `Access forbidden: No active scope for warehouse '${warehouseCode}'` 
        });
      }

      next();
    } catch (error) {
      console.error("Error in requireWarehouseScopeForResource middleware:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Stage 8: Warehouse scoping enforcement middleware
export function requireWarehouseScope(warehouseParamKeys: string[] = ['warehouse', 'warehouseCode', 'sourceWarehouse', 'targetWarehouse']): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required for warehouse access" });
      }

      // Extract warehouse code from params, body, or query
      let warehouseCode: string | undefined;
      for (const key of warehouseParamKeys) {
        warehouseCode = req.params[key] || req.body?.[key] || req.query[key];
        if (warehouseCode) break;
      }

      if (!warehouseCode) {
        return res.status(400).json({ 
          message: `Warehouse code required in one of: ${warehouseParamKeys.join(', ')}` 
        });
      }

      // Check warehouse scope
      const hasScope = await hasWarehouseScope(userId, warehouseCode);
      if (!hasScope) {
        return res.status(403).json({ 
          message: `Access forbidden: No active scope for warehouse '${warehouseCode}'` 
        });
      }

      next();
    } catch (error) {
      console.error("Error in requireWarehouseScope middleware:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

export function requireRole(allowedRoles: User['role'][]): RequestHandler {
  return (req, res, next) => {
    // Use proper callback pattern with isAuthenticated
    isAuthenticated(req, res, async () => {
      // Return early if response headers have already been sent
      if (res.headersSent) {
        return;
      }

      try {
        const user = req.user as any;
        const userId = user.claims.sub;
        
        // Fetch user data from storage to get role
        const userData = await storage.getUser(userId);
        
        if (!userData) {
          return res.status(403).json({ message: "Access forbidden: User not found" });
        }

        if (!userData.isActive) {
          return res.status(403).json({ message: "Access forbidden: User account is inactive" });
        }

        // Stage 8: Support role combination - check both single role and roles array
        const userRoles: User['role'][] = Array.isArray(userData.roles) ? 
          userData.roles.filter((r): r is User['role'] => 
            ['admin','finance','purchasing','warehouse','sales','worker'].includes(r as any)) as User['role'][] : [];
        const hasRequiredRole = allowedRoles.includes(userData.role) || 
                               userRoles.some(role => allowedRoles.includes(role));
        
        if (!hasRequiredRole) {
          const currentRoles = [userData.role, ...userRoles].filter(Boolean).join(', ');
          return res.status(403).json({ 
            message: `Access forbidden: Required role(s): ${allowedRoles.join(', ')}. Current role(s): ${currentRoles}` 
          });
        }

        // User has required role, continue
        next();
      } catch (error) {
        console.error("Error in requireRole middleware:", error);
        // Check if headers have been sent before responding
        if (!res.headersSent) {
          return res.status(500).json({ message: "Internal server error" });
        }
      }
    });
  };
}
