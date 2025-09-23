import { ZodError } from 'zod';

/**
 * Base error class for all application errors
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  abstract readonly isOperational: boolean;
  
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = this.constructor.name;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Capture stack trace if supported
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';
  readonly isOperational = true;

  constructor(message: string, public readonly fieldErrors?: Record<string, string[]>) {
    super(message, fieldErrors);
  }

  static fromZodError(error: ZodError): ValidationError {
    const fieldErrors: Record<string, string[]> = {};
    
    error.errors.forEach(issue => {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    });

    return new ValidationError('Validation failed', fieldErrors);
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'AUTHENTICATION_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = 'AUTHORIZATION_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';
  readonly isOperational = true;

  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;
    super(message);
  }
}

/**
 * Conflict errors (409) - for unique constraint violations, etc.
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICT';
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Business rule violations (422)
 */
export class BusinessRuleError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'BUSINESS_RULE_VIOLATION';
  readonly isOperational = true;

  constructor(message: string, public readonly ruleCode?: string) {
    super(message, { ruleCode });
  }
}

/**
 * Approval workflow errors (422)
 */
export class ApprovalError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'APPROVAL_REQUIRED';
  readonly isOperational = true;

  constructor(
    message: string, 
    public readonly operationType: string,
    public readonly requiredLevel?: string
  ) {
    super(message, { operationType, requiredLevel });
  }
}

/**
 * Period management errors (422)
 */
export class PeriodError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'PERIOD_ERROR';
  readonly isOperational = true;

  constructor(message: string, public readonly periodStatus?: string) {
    super(message, { periodStatus });
  }
}

/**
 * Financial operation errors (422)
 */
export class FinancialError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'FINANCIAL_ERROR';
  readonly isOperational = true;

  constructor(message: string, public readonly errorType?: string) {
    super(message, { errorType });
  }
}

/**
 * Inventory operation errors (422)
 */
export class InventoryError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'INVENTORY_ERROR';
  readonly isOperational = true;

  constructor(message: string, public readonly inventoryIssue?: string) {
    super(message, { inventoryIssue });
  }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = 'RATE_LIMIT_EXCEEDED';
  readonly isOperational = true;

  constructor(message: string = 'Rate limit exceeded', public readonly retryAfter?: number) {
    super(message, { retryAfter });
  }
}

/**
 * Internal server errors (500)
 */
export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = 'INTERNAL_SERVER_ERROR';
  readonly isOperational = false;

  constructor(message: string = 'Internal server error', details?: any) {
    super(message, details);
  }
}

/**
 * Service unavailable errors (503)
 */
export class ServiceUnavailableError extends AppError {
  readonly statusCode = 503;
  readonly errorCode = 'SERVICE_UNAVAILABLE';
  readonly isOperational = true;

  constructor(message: string = 'Service temporarily unavailable', public readonly service?: string) {
    super(message, { service });
  }
}

/**
 * Error type guards for type safety
 */
export const ErrorTypeGuards = {
  isAppError: (error: any): error is AppError => {
    return error instanceof AppError;
  },
  
  isValidationError: (error: any): error is ValidationError => {
    return error instanceof ValidationError;
  },
  
  isAuthenticationError: (error: any): error is AuthenticationError => {
    return error instanceof AuthenticationError;
  },
  
  isAuthorizationError: (error: any): error is AuthorizationError => {
    return error instanceof AuthorizationError;
  },
  
  isNotFoundError: (error: any): error is NotFoundError => {
    return error instanceof NotFoundError;
  },
  
  isBusinessRuleError: (error: any): error is BusinessRuleError => {
    return error instanceof BusinessRuleError;
  },
  
  isApprovalError: (error: any): error is ApprovalError => {
    return error instanceof ApprovalError;
  },
  
  isPeriodError: (error: any): error is PeriodError => {
    return error instanceof PeriodError;
  },
  
  isFinancialError: (error: any): error is FinancialError => {
    return error instanceof FinancialError;
  },
  
  isInventoryError: (error: any): error is InventoryError => {
    return error instanceof InventoryError;
  }
};

/**
 * Helper functions for creating common errors
 */
export const ErrorHelpers = {
  notFound: (resource: string, id?: string) => new NotFoundError(resource, id),
  
  validation: (message: string, fieldErrors?: Record<string, string[]>) => 
    new ValidationError(message, fieldErrors),
  
  unauthorized: (message?: string) => new AuthenticationError(message),
  
  forbidden: (message?: string) => new AuthorizationError(message),
  
  conflict: (message: string) => new ConflictError(message),
  
  businessRule: (message: string, ruleCode?: string) => 
    new BusinessRuleError(message, ruleCode),
  
  approvalRequired: (message: string, operationType: string, requiredLevel?: string) =>
    new ApprovalError(message, operationType, requiredLevel),
  
  periodClosed: (message: string = 'Operation not allowed in closed period') =>
    new PeriodError(message, 'closed'),
  
  insufficientFunds: (message: string = 'Insufficient funds for operation') =>
    new FinancialError(message, 'insufficient_funds'),
  
  insufficientStock: (message: string = 'Insufficient stock for operation') =>
    new InventoryError(message, 'insufficient_stock'),
  
  internal: (message?: string, details?: any) => new InternalServerError(message, details)
};