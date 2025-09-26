import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;
      email?: string;
    };
  };
}

/**
 * Period Guard Middleware
 * Prevents operations on closed periods by checking the period status before allowing mutations.
 * This middleware should be applied to all mutation endpoints that involve financial data.
 */
export function periodGuard(options: {
  // Fields in request body that contain dates to check against closed periods
  dateFields?: string[];
  // Whether to allow admin users to bypass period restrictions
  allowAdminBypass?: boolean;
  // Custom period resolver function for complex scenarios
  periodResolver?: (req: AuthenticatedRequest) => Promise<string | null>;
} = {}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Only apply to mutation operations (POST, PATCH, PUT, DELETE)
      if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
        return next();
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Check if user has admin role and admin bypass is allowed
      if (options.allowAdminBypass) {
        try {
          const user = await storage.getUser(userId);
          if (user?.role === 'admin') {
            return next();
          }
        } catch (error) {
          console.error("Error checking user role for admin bypass:", error);
          // Continue with normal period checks on error
        }
      }

      // Determine which period(s) to check
      const periodsToCheck: string[] = [];
      
      if (options.periodResolver) {
        // Use custom period resolver
        const customPeriod = await options.periodResolver(req);
        if (customPeriod) {
          periodsToCheck.push(customPeriod);
        }
      } else {
        // Default behavior: check dates in request body
        const dateFields = options.dateFields || ['date', 'transactionDate', 'purchaseDate', 'entryDate'];
        
        for (const field of dateFields) {
          const dateValue = req.body?.[field];
          if (dateValue) {
            try {
              const date = new Date(dateValue);
              const period = await findPeriodForDate(date);
              if (period) {
                periodsToCheck.push(period.id);
              }
            } catch (error) {
              console.error(`Error parsing date field '${field}':`, error);
            }
          }
        }
      }

      // If no periods to check, allow the operation
      if (periodsToCheck.length === 0) {
        return next();
      }

      // Check if any of the periods are closed
      const closedPeriods = await checkPeriodsStatus(periodsToCheck);
      
      if (closedPeriods.length > 0) {
        const periodNames = closedPeriods.map(p => p.periodNumber).join(', ');
        
        return res.status(403).json({
          message: `Operation rejected: Cannot modify data in closed period(s): ${periodNames}`,
          error: "PERIOD_CLOSED",
          closedPeriods: closedPeriods.map(p => ({
            id: p.id,
            periodNumber: p.periodNumber,
            closedAt: p.closedAt,
            closedBy: p.closedBy
          }))
        });
      }

      // All periods are open, allow the operation
      next();
    } catch (error) {
      console.error("Period guard middleware error:", error);
      res.status(500).json({ 
        message: "Failed to validate period status",
        error: "PERIOD_CHECK_FAILED"
      });
    }
  };
}

/**
 * Find the period that contains a given date
 */
async function findPeriodForDate(date: Date): Promise<{ id: string; periodNumber: string } | null> {
  try {
    const periods = await storage.getPeriods();
    
    for (const period of periods) {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      
      if (date >= startDate && date <= endDate) {
        return {
          id: period.id,
          periodNumber: period.periodNumber
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error finding period for date:", error);
    return null;
  }
}

/**
 * Check if given periods are closed
 */
async function checkPeriodsStatus(periodIds: string[]): Promise<Array<{
  id: string;
  periodNumber: string;
  closedAt: Date | null;
  closedBy: string | null;
}>> {
  try {
    const closedPeriods = [];
    
    for (const periodId of periodIds) {
      const period = await storage.getPeriod(periodId);
      
      if (period?.status === 'closed') {
        closedPeriods.push({
          id: period.id,
          periodNumber: period.periodNumber,
          closedAt: period.closedAt,
          closedBy: period.closedBy
        });
      }
    }
    
    return closedPeriods;
  } catch (error) {
    console.error("Error checking periods status:", error);
    return [];
  }
}

/**
 * Specialized period guard for purchase operations
 * Checks the purchase date against closed periods
 */
export const purchasePeriodGuard = periodGuard({
  dateFields: ['date'],
  allowAdminBypass: true,
});

/**
 * Specialized period guard for capital entry operations
 * Checks the entry date against closed periods
 */
export const capitalEntryPeriodGuard = periodGuard({
  dateFields: ['date'],
  allowAdminBypass: true,
});

/**
 * Specialized period guard for warehouse operations
 * Uses the related purchase date to check periods
 */
export const warehousePeriodGuard = periodGuard({
  allowAdminBypass: true,
  periodResolver: async (req: AuthenticatedRequest) => {
    try {
      // For warehouse operations, we need to check the underlying purchase date
      const purchaseId = req.body?.purchaseId || req.params?.purchaseId;
      
      if (purchaseId) {
        const purchase = await storage.getPurchase(purchaseId);
        if (purchase) {
          const date = new Date(purchase.date);
          const period = await findPeriodForDate(date);
          return period?.id || null;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error resolving period for warehouse operation:", error);
      return null;
    }
  },
});

/**
 * Generic period guard for operations with flexible date checking
 */
export const genericPeriodGuard = periodGuard({
  dateFields: ['date', 'transactionDate', 'createdAt', 'updatedAt'],
  allowAdminBypass: true,
});

/**
 * Strict period guard that doesn't allow admin bypass
 * Used for critical financial operations
 */
export const strictPeriodGuard = periodGuard({
  dateFields: ['date'],
  allowAdminBypass: false,
});