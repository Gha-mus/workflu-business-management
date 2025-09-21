/**
 * PRODUCTION AUTHENTICATION TESTS
 * 
 * Real integration tests using actual auth middleware and routes
 * with comprehensive mocking of external services only.
 */

const request = require('supertest');
const express = require('express');

// Import mocked services
const { storage } = require('../core/storage');
const { supabaseAdmin } = require('../core/auth/providers/supabaseProvider');
const { auditService } = require('../auditService');

describe('🔐 PRODUCTION AUTH: Complete Integration Tests', () => {
  let app;
  let mockSupabaseClient;

  // Helper function for setting up authenticated users (moved to global scope)
  const setupAuthenticatedUser = (role = 'worker') => {
    const mockUser = {
      id: `${role}-id`,
      email: `${role}@test.com`,
      firstName: 'Test',
      lastName: role.charAt(0).toUpperCase() + role.slice(1),
      role: role,
      isActive: true,
      authProvider: 'supabase'
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { 
        user: { 
          id: 'supabase-user-id', 
          email: `${role}@test.com` 
        } 
      },
      error: null
    });

    storage.getUserByEmail.mockResolvedValue(mockUser);
    
    return mockUser;
  };

  beforeAll(async () => {
    // Setup test app with real authentication middleware
    app = express();
    app.use(express.json());

    // Import and setup real authentication
    const { setupAuth } = require('../core/auth');
    await setupAuth(app);

    // Import and setup real routes (handle both ESM and CJS exports)
    const usersRouter = require('../routes/users');
    app.use('/api/users', usersRouter.default || usersRouter);

    // Get mocked Supabase instance
    mockSupabaseClient = supabaseAdmin();
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default Supabase mock behaviors
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' }
    });

    mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-supabase-id', email: 'newuser@test.com' } },
      error: null
    });

    mockSupabaseClient.auth.admin.generateLink.mockResolvedValue({
      data: { properties: { action_link: 'https://reset-link.com' } },
      error: null
    });

    // Setup default storage mock behaviors
    storage.getUserByEmail.mockResolvedValue(null);
    storage.getUser.mockResolvedValue(null);
    storage.getUsers.mockResolvedValue([]);
    storage.createUser.mockResolvedValue({
      id: 'new-user-id',
      email: 'newuser@test.com',
      firstName: 'New',
      lastName: 'User',
      role: 'worker',
      isActive: true
    });
    storage.updateUserStatus.mockResolvedValue({
      id: 'user-id',
      isActive: false
    });
    storage.updateUserRole.mockResolvedValue({
      id: 'user-id',
      role: 'finance'
    });
    storage.updateDisplayName.mockResolvedValue({
      id: 'user-id',
      firstName: 'Updated',
      lastName: 'Name'
    });
  });

  describe('Provider Selection and Lazy Loading', () => {
    
    it('should load only Supabase provider when AUTH_PROVIDER=supabase', () => {
      // Verify that the test environment has the correct provider
      expect(process.env.AUTH_PROVIDER).toBe('supabase');
      
      // Verify auth module loads without errors
      const authModule = require('../core/auth');
      expect(authModule).toBeDefined();
      expect(authModule.setupAuth).toBeInstanceOf(Function);
    });

    it('should NOT import Replit provider when AUTH_PROVIDER=supabase', async () => {
      // Mock the Replit provider to verify it's not imported
      jest.doMock('../core/auth/providers/replitProvider', () => {
        throw new Error('Replit provider should not be imported when AUTH_PROVIDER=supabase');
      });
      
      // Reset modules for isolated test
      await jest.isolateModules(async () => {
        process.env.AUTH_PROVIDER = 'supabase';
        
        // Auth module should load successfully
        const authModule = require('../core/auth');
        expect(authModule).toBeDefined();
        
        // Force lazy loading by setting up auth (this triggers provider import)
        const express = require('express');
        const testApp = express();
        
        await expect(authModule.setupAuth(testApp)).resolves.not.toThrow();
      });
      
      // Clean up mock
      jest.dontMock('../core/auth/providers/replitProvider');
    });
  });

  describe('Authentication Middleware Integration', () => {
    
    it('should reject requests without Authorization header', async () => {
      await request(app)
        .get('/api/users/me')
        .expect(401);
    });

    it('should reject malformed Authorization headers', async () => {
      const malformedHeaders = [
        'Bearer',
        'Basic token123', 
        'token123',
        'Bearer '
      ];

      for (const header of malformedHeaders) {
        await request(app)
          .get('/api/users/me')
          .set('Authorization', header)
          .expect(401);
      }
    });

    it('should reject invalid tokens via Supabase validation', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' }
      });

      await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('invalid-token');
    });

    it('should reject expired tokens via Supabase validation', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' }
      });

      await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('expired-token');
    });

    it('should reject tokens for inactive users', async () => {
      // Mock Supabase to return valid user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'supabase-user-id', 
            email: 'inactive@test.com' 
          } 
        },
        error: null
      });

      // Mock storage to return inactive user
      storage.getUserByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'inactive@test.com',
        isActive: false,
        role: 'worker'
      });

      await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(401);

      expect(storage.getUserByEmail).toHaveBeenCalledWith('inactive@test.com');
    });

    it('should accept valid tokens for active users', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'active@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'worker',
        isActive: true,
        authProvider: 'supabase'
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'supabase-user-id', 
            email: 'active@test.com' 
          } 
        },
        error: null
      });

      storage.getUserByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.email).toBe('active@test.com');
      expect(response.body.role).toBe('worker');
    });
  });

  describe('RBAC Integration with Real Routes', () => {

    it('should allow admin users to access user list', async () => {
      setupAuthenticatedUser('admin');
      storage.getUsers.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(storage.getUsers).toHaveBeenCalled();
    });

    it('should block non-admin users from user list', async () => {
      const nonAdminRoles = ['finance', 'purchasing', 'warehouse', 'sales', 'worker'];

      for (const role of nonAdminRoles) {
        setupAuthenticatedUser(role);

        await request(app)
          .get('/api/users')
          .set('Authorization', 'Bearer non-admin-token')
          .expect(403);
      }
    });

    it('should allow admin to create users with Zod validation', async () => {
      setupAuthenticatedUser('admin');

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', 'Bearer admin-token')
        .send({
          email: 'newuser@test.com',
          firstName: 'New',
          lastName: 'User',
          role: 'worker'
        })
        .expect(201);

      expect(response.body.email).toBe('newuser@test.com');
      expect(storage.createUser).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalled();
      expect(auditService.logOperation).toHaveBeenCalled();
    });

    it('should validate user creation data with Zod', async () => {
      setupAuthenticatedUser('admin');

      // Test invalid email
      await request(app)
        .post('/api/users')
        .set('Authorization', 'Bearer admin-token')
        .send({
          email: 'invalid-email',
          firstName: 'Test',
          lastName: 'User',
          role: 'worker'
        })
        .expect(400);

      // Test missing required fields
      await request(app)
        .post('/api/users')
        .set('Authorization', 'Bearer admin-token')
        .send({
          email: 'test@test.com'
          // Missing firstName, lastName, role
        })
        .expect(400);

      // Test invalid role
      await request(app)
        .post('/api/users')
        .set('Authorization', 'Bearer admin-token')
        .send({
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'invalid_role'
        })
        .expect(400);
    });
  });

  describe('Admin Actions Integration', () => {
    
    beforeEach(() => {
      setupAuthenticatedUser('admin');
    });

    it('should allow admin to update user status with validation', async () => {
      const existingUser = { id: 'target-user-id', isActive: true };
      storage.getUser.mockResolvedValue(existingUser);

      const response = await request(app)
        .put('/api/users/target-user-id/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ isActive: false })
        .expect(200);

      expect(storage.getUser).toHaveBeenCalledWith('target-user-id');
      expect(storage.updateUserStatus).toHaveBeenCalledWith('target-user-id', false);
      expect(auditService.logOperation).toHaveBeenCalled();
    });

    it('should validate status update data', async () => {
      // Invalid status value
      await request(app)
        .put('/api/users/target-user-id/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ isActive: 'invalid' })
        .expect(400);

      // Missing status field
      await request(app)
        .put('/api/users/target-user-id/status')
        .set('Authorization', 'Bearer admin-token')
        .send({})
        .expect(400);
    });

    it('should handle user not found for status update', async () => {
      storage.getUser.mockResolvedValue(null);

      await request(app)
        .put('/api/users/nonexistent-id/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ isActive: false })
        .expect(404);
    });

    it('should allow admin to reset passwords via Supabase', async () => {
      const existingUser = { 
        id: 'target-user-id', 
        email: 'user@test.com',
        isActive: true 
      };
      storage.getUser.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/users/target-user-id/reset-password')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(storage.getUser).toHaveBeenCalledWith('target-user-id');
      expect(mockSupabaseClient.auth.admin.generateLink).toHaveBeenCalledWith({
        type: 'recovery',
        email: 'user@test.com',
        options: {
          redirectTo: 'http://localhost:5000/auth/reset-password'
        }
      });
      expect(auditService.logOperation).toHaveBeenCalled();
      expect(response.body.message).toContain('Password reset email sent');
    });

    it('should allow admin to update user roles', async () => {
      const existingUser = { 
        id: 'target-user-id',
        role: 'worker'
      };
      storage.getUser.mockResolvedValue(existingUser);

      const response = await request(app)
        .put('/api/users/target-user-id/role')
        .set('Authorization', 'Bearer admin-token')
        .send({ role: 'finance' })
        .expect(200);

      expect(storage.getUser).toHaveBeenCalledWith('target-user-id');
      expect(storage.updateUserRole).toHaveBeenCalledWith('target-user-id', 'finance');
      expect(auditService.logOperation).toHaveBeenCalled();
    });

    it('should update display names with validation', async () => {
      const existingUser = { 
        id: 'target-user-id',
        firstName: 'Old',
        lastName: 'Name'
      };
      storage.getUser.mockResolvedValue(existingUser);

      const response = await request(app)
        .put('/api/users/target-user-id/display-name')
        .set('Authorization', 'Bearer admin-token')
        .send({ firstName: 'New', lastName: 'Name' })
        .expect(200);

      expect(storage.updateDisplayName).toHaveBeenCalledWith('target-user-id', 'New', 'Name');
      expect(auditService.logOperation).toHaveBeenCalled();
    });

    it('should validate display name data', async () => {
      const invalidData = [
        { firstName: '', lastName: 'Valid' },
        { firstName: 'Valid', lastName: '' },
        { lastName: 'Missing First' },
        { firstName: 'Missing Last' },
        {}
      ];

      for (const data of invalidData) {
        await request(app)
          .put('/api/users/target-user-id/display-name')
          .set('Authorization', 'Bearer admin-token')
          .send(data)
          .expect(400);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    
    it('should handle Supabase service errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Supabase service error'));

      await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer token')
        .expect(401);
    });

    it('should handle storage errors gracefully', async () => {
      setupAuthenticatedUser('admin');
      storage.updateUserStatus.mockRejectedValue(new Error('Database error'));

      await request(app)
        .put('/api/users/nonexistent-id/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ isActive: false })
        .expect(500);
    });

    it('should handle concurrent authentication requests', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'concurrent@test.com',
        role: 'worker',
        isActive: true
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'supabase-user-id', 
            email: 'concurrent@test.com' 
          } 
        },
        error: null
      });

      storage.getUserByEmail.mockResolvedValue(mockUser);

      // Make concurrent requests
      const requests = Array(5).fill(null).map(() => 
        request(app)
          .get('/api/users/me')
          .set('Authorization', 'Bearer concurrent-token')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.body.email).toBe('concurrent@test.com');
      });
    });
  });
});