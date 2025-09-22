import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { log } from "../vite";

// PostgreSQL error code mapping to HTTP status codes
const POSTGRES_ERROR_CODES: Record<string, { status: number; message: string }> = {
  // Foreign key constraint violation
  '23503': { 
    status: 409, 
    message: 'Conflict: Cannot perform this operation due to existing relationships'
  },
  // Unique constraint violation
  '23505': { 
    status: 409, 
    message: 'Conflict: This record already exists'
  },
  // Not null constraint violation
  '23502': { 
    status: 400, 
    message: 'Bad Request: Required field missing'
  },
  // Check constraint violation
  '23514': { 
    status: 400, 
    message: 'Bad Request: Value does not meet validation requirements'
  },
  // Invalid text representation
  '22P02': { 
    status: 400, 
    message: 'Bad Request: Invalid data format'
  },
  // String data right truncation
  '22001': { 
    status: 400, 
    message: 'Bad Request: Data too long for field'
  },
  // Invalid datetime format
  '22007': { 
    status: 400, 
    message: 'Bad Request: Invalid date/time format'
  },
  // Division by zero
  '22012': { 
    status: 400, 
    message: 'Bad Request: Division by zero'
  },
  // Numeric value out of range
  '22003': { 
    status: 400, 
    message: 'Bad Request: Numeric value out of range'
  },
};

interface ErrorWithCode extends Error {
  code?: string;
  status?: number;
  statusCode?: number;
  pgCode?: string;
  constraint?: string;
  detail?: string;
}

/**
 * Maps various error types to appropriate HTTP status codes and messages
 */
export function mapErrorToResponse(error: ErrorWithCode): {
  status: number;
  message: string;
  details?: any;
} {
  // Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message
    }));
    
    return {
      status: 400,
      message: 'Validation error',
      details: { validation_errors: issues }
    };
  }

  // Authentication errors
  if (error.message?.toLowerCase().includes('unauthorized') || 
      error.message?.toLowerCase().includes('authentication') ||
      error.message?.toLowerCase().includes('not authenticated') ||
      error.message?.toLowerCase().includes('invalid token') ||
      error.message?.toLowerCase().includes('expired token') ||
      error.status === 401 || 
      error.statusCode === 401) {
    return {
      status: 401,
      message: error.message || 'Unauthorized: Authentication required'
    };
  }

  // Not found errors
  if (error.message?.toLowerCase().includes('not found') ||
      error.message?.toLowerCase().includes('does not exist') ||
      error.message?.toLowerCase().includes('no such') ||
      error.status === 404 || 
      error.statusCode === 404) {
    return {
      status: 404,
      message: error.message || 'Not Found: The requested resource does not exist'
    };
  }

  // Forbidden errors
  if (error.message?.toLowerCase().includes('forbidden') ||
      error.message?.toLowerCase().includes('permission denied') ||
      error.message?.toLowerCase().includes('access denied') ||
      error.message?.toLowerCase().includes('insufficient permissions') ||
      error.status === 403 || 
      error.statusCode === 403) {
    return {
      status: 403,
      message: error.message || 'Forbidden: You do not have permission to access this resource'
    };
  }

  // PostgreSQL errors
  const pgErrorCode = error.code || error.pgCode;
  if (pgErrorCode && POSTGRES_ERROR_CODES[pgErrorCode]) {
    const pgError = POSTGRES_ERROR_CODES[pgErrorCode];
    let message = pgError.message;
    
    // Add specific constraint information if available
    if (error.constraint) {
      message += ` (constraint: ${error.constraint})`;
    }
    if (error.detail) {
      message += ` - ${error.detail}`;
    }
    
    return {
      status: pgError.status,
      message: message
    };
  }

  // Database connection errors
  if (pgErrorCode === 'ECONNREFUSED' || 
      error.message?.includes('ECONNREFUSED') ||
      error.message?.toLowerCase().includes('database connection')) {
    return {
      status: 503,
      message: 'Service Unavailable: Unable to connect to database'
    };
  }

  // Rate limiting errors
  if (error.message?.toLowerCase().includes('rate limit') ||
      error.message?.toLowerCase().includes('too many requests') ||
      error.status === 429 || 
      error.statusCode === 429) {
    return {
      status: 429,
      message: error.message || 'Too Many Requests: Please try again later'
    };
  }

  // Timeout errors
  if (error.message?.toLowerCase().includes('timeout') ||
      error.code === 'ETIMEDOUT') {
    return {
      status: 408,
      message: 'Request Timeout: The operation took too long to complete'
    };
  }

  // Payload too large
  if (error.message?.toLowerCase().includes('payload too large') ||
      error.message?.toLowerCase().includes('request entity too large') ||
      error.status === 413 || 
      error.statusCode === 413) {
    return {
      status: 413,
      message: error.message || 'Payload Too Large: The request size exceeds the limit'
    };
  }

  // Method not allowed
  if (error.status === 405 || error.statusCode === 405) {
    return {
      status: 405,
      message: error.message || 'Method Not Allowed'
    };
  }

  // Bad request (general)
  if (error.status === 400 || error.statusCode === 400) {
    return {
      status: 400,
      message: error.message || 'Bad Request'
    };
  }

  // Conflict errors
  if (error.message?.toLowerCase().includes('conflict') ||
      error.message?.toLowerCase().includes('duplicate') ||
      error.status === 409 || 
      error.statusCode === 409) {
    return {
      status: 409,
      message: error.message || 'Conflict: The request conflicts with the current state'
    };
  }

  // Default to 500 only for truly unexpected errors
  return {
    status: error.status || error.statusCode || 500,
    message: error.message || 'Internal Server Error: An unexpected error occurred'
  };
}

/**
 * Global error handler middleware
 * This should be added at the very end of all middleware and routes
 */
export function errorHandler(
  error: ErrorWithCode,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  const errorResponse = mapErrorToResponse(error);
  
  // Log the error with appropriate level based on status code
  const logMessage = `[ERROR] ${req.method} ${req.path} - Status: ${errorResponse.status} - ${errorResponse.message}`;
  
  if (errorResponse.status >= 500) {
    // Log server errors with full stack trace
    console.error(logMessage);
    console.error('Stack trace:', error.stack);
    log(`❌ ${logMessage}`);
  } else if (errorResponse.status >= 400) {
    // Log client errors without stack trace
    console.warn(logMessage);
    log(`⚠️ ${logMessage}`);
  }

  // Send the error response
  res.status(errorResponse.status).json({
    error: true,
    message: errorResponse.message,
    ...(errorResponse.details && process.env.NODE_ENV === 'development' ? { details: errorResponse.details } : {}),
    ...(process.env.NODE_ENV === 'development' && errorResponse.status >= 500 ? { stack: error.stack } : {})
  });
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: true,
    message: `Not Found: Cannot ${req.method} ${req.path}`
  });
}