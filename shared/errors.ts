import { ZodError } from "zod";

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode || this.getDefaultErrorCode(statusCode);
    this.details = details;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  private getDefaultErrorCode(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED', 
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE'
    };
    return statusMap[status] || 'UNKNOWN_ERROR';
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Create ValidationError from Zod validation error
   */
  static fromZodError(error: ZodError): ValidationError {
    const details = error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));

    const message = `Validation failed: ${details.map(d => `${d.path}: ${d.message}`).join(', ')}`;
    
    return new ValidationError(message, {
      type: 'zod_validation',
      issues: details,
      originalError: error
    });
  }
}

/**
 * Business rule violation error
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION', details);
    this.name = 'BusinessRuleError';
    Object.setPrototypeOf(this, BusinessRuleError.prototype);
  }
}

/**
 * Approval-related error
 */
export class ApprovalError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 403, 'APPROVAL_REQUIRED', details);
    this.name = 'ApprovalError';
    Object.setPrototypeOf(this, ApprovalError.prototype);
  }
}

/**
 * Type guards for error checking
 */
export class ErrorTypeGuards {
  /**
   * Check if error is an instance of AppError
   */
  static isAppError(error: any): error is AppError {
    return error instanceof AppError;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: any): error is ValidationError {
    return error instanceof ValidationError;
  }

  /**
   * Check if error is a business rule error
   */
  static isBusinessRuleError(error: any): error is BusinessRuleError {
    return error instanceof BusinessRuleError;
  }

  /**
   * Check if error is an approval error
   */
  static isApprovalError(error: any): error is ApprovalError {
    return error instanceof ApprovalError;
  }
}

/**
 * Error helper utilities
 */
export class ErrorHelpers {
  /**
   * Extract error message safely
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse(error: unknown) {
    if (ErrorTypeGuards.isAppError(error)) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.errorCode,
          statusCode: error.statusCode,
          details: error.details
        }
      };
    }

    return {
      success: false,
      error: {
        message: this.getErrorMessage(error),
        code: 'UNKNOWN_ERROR',
        statusCode: 500
      }
    };
  }

  /**
   * Log error with context
   */
  static logError(error: unknown, context?: string) {
    const message = this.getErrorMessage(error);
    const logPrefix = context ? `[${context}]` : '[ERROR]';
    
    if (error instanceof Error && error.stack) {
      console.error(`${logPrefix} ${message}`);
      console.error('Stack trace:', error.stack);
    } else {
      console.error(`${logPrefix} ${message}`);
    }
  }
}

// Export all error types and utilities
export default {
  AppError,
  ValidationError,
  BusinessRuleError,
  ApprovalError,
  ErrorTypeGuards,
  ErrorHelpers
};