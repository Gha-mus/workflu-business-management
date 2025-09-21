# WorkFlu Authentication Guide

## Overview
WorkFlu uses Supabase Email/Password authentication with JWT tokens for secure access control.

## Authentication Architecture
- **Provider**: Supabase Auth with Email/Password
- **Token Type**: JWT (JSON Web Tokens)
- **Verification**: Local JWT verification using jose library
- **Session**: Stateless authentication with automatic token refresh
- **Roles**: admin, finance, purchasing, warehouse, sales, worker

## Environment Configuration

### Required Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Session Configuration
SESSION_SECRET=your_session_secret
AUTH_PROVIDER=supabase
```

## Admin Credentials
- Admin credentials should be securely stored and never committed to version control
- Contact system administrator for admin access
- Use environment variables or secure credential management systems

## User Management

### Creating New Users
1. Login as admin
2. Navigate to Users Management (/users)
3. Click "Create User"
4. Enter user details and role
5. System generates temporary password
6. Share temporary password securely with new user

### User Roles & Permissions
- **admin**: Full system access, user management
- **finance**: Financial operations, capital management
- **purchasing**: Purchase orders, supplier management
- **warehouse**: Inventory, warehouse operations
- **sales**: Sales orders, customer management
- **worker**: Basic operational access

## Troubleshooting Guide

### Common Issues

#### 1. User Cannot Login
**Symptoms**: 401 Unauthorized errors, login fails
**Solutions**:
- Verify user exists in both Supabase and local database
- Check user is active (not deactivated)
- Ensure correct password is being used
- Check JWT token expiration settings

#### 2. Missing Environment Variables
**Symptoms**: "Supabase configuration missing" errors
**Solutions**:
- Verify all 5 Supabase environment variables are set
- Check .env file is properly loaded
- Ensure no typos in variable names

#### 3. JWT Verification Failures
**Symptoms**: Valid tokens rejected, frequent logouts
**Solutions**:
- Verify SUPABASE_JWT_SECRET matches your Supabase project
- Check clock synchronization (60 second skew allowed)
- Ensure tokens are properly attached to requests

#### 4. Role-Based Access Issues
**Symptoms**: Users cannot access authorized pages
**Solutions**:
- Verify user role in database
- Check role requirements for specific routes
- Ensure role changes are approved and applied

#### 5. User Creation Failures
**Symptoms**: "Failed to create authentication account"
**Solutions**:
- Check Supabase service role key permissions
- Verify email is not already in use
- Ensure password meets Supabase requirements (min 6 chars)

## Security Best Practices

### Token Management
- Tokens auto-refresh before expiration
- 60-second clock skew tolerance configured
- Secure HTTP-only cookies for session backup

### Error Handling
- Consistent error responses: `{"error": "unauthorized"}`
- No internal error details exposed
- Silent fail for security-sensitive operations

### Password Security
- Temporary passwords generated with high entropy
- Users prompted to change on first login
- Passwords never logged or stored in plaintext

## API Authentication

### Request Headers
```javascript
// All authenticated requests require:
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Client Configuration
```javascript
// Frontend setup (client/src/lib/supabase.ts)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### Backend Verification
```javascript
// Server-side JWT verification (server/core/auth/providers/supabaseProvider.ts)
const { payload } = await jwtVerify(token, secret, {
  algorithms: ['HS256'],
  clockTolerance: 60
})
```

## Testing Authentication

### Manual Testing Checklist
- [ ] Admin can login with valid credentials
- [ ] Admin can create new users
- [ ] New users receive temporary passwords
- [ ] Users can login with temporary passwords
- [ ] Role-based access control works correctly
- [ ] Users can be deactivated/reactivated
- [ ] Token refresh works automatically
- [ ] Logout clears session properly

### Automated Testing
Run comprehensive authentication tests:
```bash
npm test
```

## Migration from OIDC

### Key Changes
1. Replaced Replit OIDC with Supabase Email/Password
2. Local JWT verification instead of remote validation
3. Stateless sessions with automatic refresh
4. Role-based access control preserved

### Cleanup Completed
- Removed all OIDC-related code
- Cleaned up debugging logs
- Updated all authentication middleware
- Fixed user creation flow

## Support & Maintenance

### Health Checks
- Authentication system status: `/api/health`
- User service status: `/api/users/health`

### Monitoring
- Failed login attempts logged
- User creation/modification audited
- Role changes tracked in audit logs

### Emergency Procedures
1. **Lock all accounts**: Set all users inactive in database
2. **Reset admin**: Update admin password in Supabase dashboard
3. **Rotate secrets**: Update JWT secret and restart services
4. **Audit access**: Review audit logs for suspicious activity

## Production Readiness Checklist
✅ JWT local verification with clock skew tolerance
✅ Consistent error responses
✅ Automatic token refresh
✅ Role-based access control
✅ User management with Supabase integration
✅ Audit logging for all operations
✅ Secure password generation
✅ Clean separation of auth concerns
✅ No debugging logs in production code
✅ Comprehensive testing coverage

## Contact
For authentication issues or questions, contact the system administrator.