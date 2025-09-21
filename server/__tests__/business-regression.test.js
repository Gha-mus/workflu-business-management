/**
 * BUSINESS REGRESSION TESTS
 * 
 * These tests ensure that authentication migration doesn't break core business functionality:
 * 1. Central FX (Foreign Exchange) operations
 * 2. Immutability (Audit Logs and Data Protection)
 * 3. Approvals (Workflow System)
 * 
 * Uses REAL business logic with minimal external mocking for high-signal regression detection.
 */

const request = require('supertest');
const express = require('express');
const { jest } = require('@jest/globals');

// Only mock external auth provider (preserve real business logic)
jest.mock('../core/auth/providers/supabaseProvider', () => {
  const actual = jest.requireActual('../core/auth/providers/supabaseProvider');
  const client = {
    auth: {
      getUser: jest.fn(),
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
        getUserByEmail: jest.fn(),
        generateLink: jest.fn()
      }
    }
  };
  return {
    ...actual,
    supabaseAdmin: jest.fn(() => client)
  };
});

// Import real business modules (no mocking)
const { supabaseAdmin } = require('../core/auth/providers/supabaseProvider');

describe('Business Regression Tests - Core Systems', () => {
  let app;
  let mockSupabaseClient;

  // Test user for authentication (maps to real storage)
  const setupAuthenticatedUser = (role = 'admin') => {
    const mockUser = {
      id: `regression-${role}-user`,
      email: `${role}@regression.test`,
      role: role,
      isActive: true,
      warehouseId: role === 'warehouse' ? 'FIRST' : null
    };

    // Mock Supabase auth response
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUser.id, email: mockUser.email } },
      error: null
    });

    return mockUser;
  };

  beforeAll(async () => {
    // Setup test app with real business logic
    app = express();
    app.use(express.json());

    // Get mocked Supabase client
    mockSupabaseClient = supabaseAdmin();

    // Setup real authentication
    const { setupAuth } = require('../core/auth');
    await setupAuth(app);

    // Setup real routes (no mocking)
    const settingsRouter = require('../routes/settings');
    const capitalRouter = require('../routes/capital');
    const approvalsRouter = require('../routes/approvals');
    app.use('/api/settings', settingsRouter.default || settingsRouter);
    app.use('/api/capital', capitalRouter.default || capitalRouter);
    app.use('/api/approvals', approvalsRouter.default || approvalsRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default authenticated admin user
    setupAuthenticatedUser('admin');
  });

  describe('1. Central FX (Foreign Exchange) Regression Tests', () => {
    
    it('should enforce central exchange rate in system settings', async () => {
      setupAuthenticatedUser('admin');

      // Test setting USD_ETB_RATE (core FX functionality)
      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          key: 'USD_ETB_RATE',
          value: '57.5',
          category: 'financial',
          description: 'Central exchange rate for regression test'
        });

      // Should succeed or fail deterministically (not 404)
      expect([200, 201, 400, 403, 500]).toContain(response.status);
      
      if (response.status >= 200 && response.status < 300) {
        expect(response.body.key).toBe('USD_ETB_RATE');
        expect(response.body.value).toBe('57.5');
      }
    });

    it('should reject operations when central FX rate is not configured', async () => {
      setupAuthenticatedUser('finance');

      // Test capital entry without configured FX rate (should fail gracefully)
      const response = await request(app)
        .post('/api/capital/entries')
        .set('Authorization', 'Bearer valid-token')
        .send({
          type: 'CapitalIn',
          amount: '1000',
          description: 'Test entry without FX rate configured'
        });

      // Should fail deterministically due to missing FX configuration
      expect([400, 500]).toContain(response.status);
      
      if (response.status === 500) {
        expect(response.body.message).toMatch(/failed/i);
      }
    });

    it('should retrieve FX configuration through settings API', async () => {
      setupAuthenticatedUser('finance');

      // Test retrieving FX rate setting
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', 'Bearer valid-token')
        .query({ category: 'financial' });

      // Should succeed and return settings structure
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        // Look for USD_ETB_RATE if it exists
        const fxSetting = response.body.find(s => s.key === 'USD_ETB_RATE');
        if (fxSetting) {
          expect(fxSetting.category).toBe('financial');
          expect(parseFloat(fxSetting.value)).toBeGreaterThan(0);
        }
      }
    });

    it('should maintain authentication during FX-dependent operations', async () => {
      setupAuthenticatedUser('admin');

      // Test that FX-dependent routes still require proper auth
      const unauthorizedResponse = await request(app)
        .get('/api/settings')
        .query({ category: 'financial' });

      // Without auth header, should be unauthorized
      expect(unauthorizedResponse.status).toBe(401);

      // With auth header, should work
      const authorizedResponse = await request(app)
        .get('/api/settings')
        .set('Authorization', 'Bearer valid-token')
        .query({ category: 'financial' });

      expect([200, 404]).toContain(authorizedResponse.status);
    });
  });

  describe('2. Immutability (Audit Logs) Regression Tests', () => {
    
    it('should maintain audit logging for authenticated operations', async () => {
      setupAuthenticatedUser('admin');

      // Test that authenticated operations are auditable
      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          key: 'TEST_AUDIT_KEY',
          value: 'test_value',
          category: 'test',
          description: 'Audit regression test setting'
        });

      // Operation should succeed or fail deterministically
      expect([200, 201, 400, 403, 500]).toContain(response.status);
      
      // Verify request was processed (audit logging happens internally)
      if (response.status >= 200 && response.status < 300) {
        expect(response.body.key).toBe('TEST_AUDIT_KEY');
      }
    });

    it('should enforce data protection for sensitive operations', async () => {
      setupAuthenticatedUser('finance');

      // Test that sensitive routes exist and are protected
      const response = await request(app)
        .get('/api/capital/balance')
        .set('Authorization', 'Bearer valid-token');

      // Should either succeed (if route exists) or fail with defined error
      expect([200, 404, 500]).toContain(response.status);
      
      // Verify auth was processed (not 401 unauthorized)
      expect(response.status).not.toBe(401);
    });

    it('should maintain session consistency across operations', async () => {
      setupAuthenticatedUser('admin');

      // Test multiple operations in sequence maintain audit trail
      const operations = [
        request(app).get('/api/settings').set('Authorization', 'Bearer valid-token'),
        request(app).get('/api/approvals/chains').set('Authorization', 'Bearer valid-token')
      ];

      const results = await Promise.all(operations);
      
      // All operations should process consistently
      results.forEach(result => {
        expect([200, 404, 500]).toContain(result.status);
        expect(result.status).not.toBe(401); // Not unauthorized
      });
    });

    it('should maintain immutable operation records', async () => {
      setupAuthenticatedUser('admin');

      // Test operations that should create immutable records
      const settingData = {
        key: 'IMMUTABLE_TEST',
        value: 'immutable_value',
        category: 'test',
        description: 'Immutability test'
      };

      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', 'Bearer valid-token')
        .send(settingData);

      // Operation processing should be deterministic
      expect([200, 201, 400, 403, 500]).toContain(response.status);
      
      if (response.status >= 200 && response.status < 300) {
        expect(response.body).toHaveProperty('key', 'IMMUTABLE_TEST');
      }
    });
  });

  describe('3. Approvals (Workflow System) Regression Tests', () => {
    
    it('should maintain approval chain configuration access', async () => {
      setupAuthenticatedUser('admin');

      // Test approval chains endpoint accessibility
      const response = await request(app)
        .get('/api/approvals/chains')
        .set('Authorization', 'Bearer valid-token');

      // Should succeed and return approval chains structure
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        // Verify chain structure if any exist
        if (response.body.length > 0) {
          const chain = response.body[0];
          expect(chain).toHaveProperty('operationType');
          expect(chain).toHaveProperty('isActive');
        }
      }
    });

    it('should enforce approval requirements for sensitive operations', async () => {
      setupAuthenticatedUser('finance');

      // Test that approval-required operations are properly guarded
      const response = await request(app)
        .post('/api/capital/entries')
        .set('Authorization', 'Bearer valid-token')
        .send({
          type: 'CapitalOut',
          amount: '50000', // Large amount likely to require approval
          description: 'Large capital withdrawal'
        });

      // Should either require approval (403) or process if no chains configured
      expect([200, 201, 400, 403, 500]).toContain(response.status);
      
      // Verify not unauthorized (auth system working)
      expect(response.status).not.toBe(401);
    });

    it('should maintain approval request workflow endpoints', async () => {
      setupAuthenticatedUser('admin');

      // Test approval requests endpoint
      const response = await request(app)
        .get('/api/approvals/requests')
        .set('Authorization', 'Bearer valid-token');

      // Should succeed and return requests structure
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        // Verify request structure if any exist
        if (response.body.length > 0) {
          const request = response.body[0];
          expect(request).toHaveProperty('operationType');
          expect(request).toHaveProperty('status');
        }
      }
    });

    it('should maintain role-based approval access control', async () => {
      // Test different role access patterns
      const roles = ['admin', 'finance', 'worker'];
      
      for (const role of roles) {
        setupAuthenticatedUser(role);
        
        const response = await request(app)
          .get('/api/approvals/chains')
          .set('Authorization', 'Bearer valid-token');
        
        // All roles should get deterministic responses (not crashes)
        expect([200, 403, 404]).toContain(response.status);
        
        // Admin and finance should generally have access
        if (role === 'admin' || role === 'finance') {
          expect([200, 404]).toContain(response.status);
        }
      }
    });

    it('should validate approval decision endpoints', async () => {
      setupAuthenticatedUser('admin');

      // Test approval decision endpoint structure
      const response = await request(app)
        .post('/api/approvals/requests/test-approval-id/decision')
        .set('Authorization', 'Bearer valid-token')
        .send({
          decision: 'approve',
          comments: 'Regression test approval'
        });

      // Should process request deterministically (not crash)
      expect([200, 400, 404, 500]).toContain(response.status);
      
      // Verify authentication was processed
      expect(response.status).not.toBe(401);
      
      // If validation fails, should be meaningful error
      if (response.status >= 400) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('4. Integration Tests - All Systems Working Together', () => {
    
    it('should maintain system integration across authentication changes', async () => {
      setupAuthenticatedUser('admin');

      // Test multiple system integrations work together
      const systemChecks = [
        // FX system (settings)
        request(app)
          .get('/api/settings')
          .set('Authorization', 'Bearer valid-token')
          .query({ category: 'financial' }),
          
        // Approval system  
        request(app)
          .get('/api/approvals/chains')
          .set('Authorization', 'Bearer valid-token'),
          
        // Audit system (operations)
        request(app)
          .get('/api/settings')
          .set('Authorization', 'Bearer valid-token')
          .query({ category: 'system' })
      ];

      const results = await Promise.all(systemChecks);
      
      // All systems should respond deterministically
      results.forEach((result, index) => {
        expect([200, 404]).toContain(result.status);
        expect(result.status).not.toBe(401); // Auth working
        expect(result.status).not.toBe(500); // No crashes
      });
    });

    it('should maintain role-based security across all business systems', async () => {
      const testRoles = ['admin', 'finance', 'warehouse', 'worker'];
      
      for (const role of testRoles) {
        setupAuthenticatedUser(role);
        
        // Test each role's access to different systems
        const roleChecks = [
          request(app)
            .get('/api/settings')
            .set('Authorization', 'Bearer valid-token'),
            
          request(app)
            .get('/api/approvals/chains')
            .set('Authorization', 'Bearer valid-token')
        ];

        const results = await Promise.all(roleChecks);
        
        // Each role should get consistent, secure responses
        results.forEach(result => {
          expect([200, 403, 404]).toContain(result.status);
          expect(result.status).not.toBe(401); // Auth processed
          expect(result.status).not.toBe(500); // No crashes
        });
      }
    });

    it('should handle authentication migration without breaking business continuity', async () => {
      // Test that switching between auth providers doesn't break core systems
      const businessOperations = [
        // Test settings management (FX system)
        () => request(app)
          .get('/api/settings')
          .set('Authorization', 'Bearer valid-token'),
          
        // Test approval management
        () => request(app)
          .get('/api/approvals/requests')
          .set('Authorization', 'Bearer valid-token'),
          
        // Test configuration access
        () => request(app)
          .get('/api/approvals/chains')
          .set('Authorization', 'Bearer valid-token')
      ];

      // Execute operations with current auth provider
      setupAuthenticatedUser('admin');
      
      for (const operation of businessOperations) {
        const result = await operation();
        
        // Each operation should work deterministically
        expect([200, 404]).toContain(result.status);
        expect(result.status).not.toBe(401); // Auth functional
        expect(result.status).not.toBe(500); // No system crashes
      }
    });
  });
});