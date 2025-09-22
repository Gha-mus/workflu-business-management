# Error Handler Migration Guide

## Overview
The application now has a comprehensive global error handler that automatically maps errors to appropriate HTTP status codes. This prevents generic 500 errors and provides better error reporting.

## How to Update Existing Routes

### Before (Old Pattern)
```typescript
router.get("/api/example", isAuthenticated, async (req, res) => {
  try {
    const data = await storage.getData();
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Failed to fetch data" });
  }
});
```

### After (New Pattern)
```typescript
router.get("/api/example", isAuthenticated, async (req, res, next) => {
  try {
    const data = await storage.getData();
    res.json(data);
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
});
```

## Key Changes
1. Add `next` parameter to route handlers
2. Replace `res.status(500).json(...)` with `next(error)`
3. Remove console.error() calls - the error handler will log appropriately

## Automatic Error Mapping

The error handler automatically maps these errors:

### PostgreSQL Errors
- `23503` (foreign key) → 409 Conflict
- `23505` (unique violation) → 409 Conflict  
- `23502` (not null) → 400 Bad Request
- `23514` (check constraint) → 400 Bad Request
- `22P02` (invalid text) → 400 Bad Request
- `22001` (string too long) → 400 Bad Request

### Application Errors
- Zod validation errors → 400 Bad Request (with detailed field errors)
- Authentication errors → 401 Unauthorized
- Not found errors → 404 Not Found
- Forbidden/permission errors → 403 Forbidden
- Rate limit errors → 429 Too Many Requests
- Timeout errors → 408 Request Timeout
- Database connection errors → 503 Service Unavailable

### Default Behavior
- Unknown errors → 500 Internal Server Error (only for truly unexpected errors)

## Benefits
1. **Consistent error responses** - All errors follow the same format
2. **Better debugging** - Error logs include appropriate severity levels
3. **Security** - Stack traces only shown in development
4. **User-friendly** - Specific error messages instead of generic 500s
5. **Database constraint awareness** - PostgreSQL errors properly mapped

## Example: Validation Error Response
```json
{
  "error": true,
  "message": "Validation error",
  "details": {
    "validation_errors": [
      { "path": "email", "message": "Invalid email format" },
      { "path": "age", "message": "Age must be positive" }
    ]
  }
}
```

## Migration Priority
Focus on updating routes that:
1. Handle database operations (likely to encounter constraint violations)
2. Process user input (validation errors)
3. Check permissions (authentication/authorization errors)
4. Fetch resources (not found errors)