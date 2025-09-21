/**
 * FINAL PRODUCTION BUSINESS REGRESSION TESTS
 * 
 * Deterministic tests ensuring authentication migration doesn't break core business systems.
 * Uses exact server initialization path and specific behavioral assertions.
 */

const request = require('supertest');
const { jest } = require('@jest/globals');

// Mock exact Supabase provider functions used by middleware
jest.mock('../core/auth/providers/supabaseProvider', () => {
  const actual = jest.requireActual('../core/auth/providers/supabaseProvider');
  const mockClient = {
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
    supabaseAdmin: jest.fn(() => mockClient),
    supabaseClient: jest.fn(() => mockClient)
  };
});

// Mock storage to provide deterministic fixtures
jest.mock('../core/storage', () => {
  const actual = jest.requireActual('../core/storage');
  return {
    ...actual,
    storage: {
      // User management
      getUserByEmail: jest.fn(),
      getUser: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      
      // Settings management (critical for FX) - match real API
      getSettings: jest.fn(),
      getSetting: jest.fn(),
      updateSetting: jest.fn(),
      getSystemSetting: jest.fn(),
      setSystemSetting: jest.fn(),
      getSystemSettings: jest.fn(),
      
      // Approval system - complete coverage
      getApprovalChains: jest.fn(),
      getApprovalRequests: jest.fn(),
      createApprovalRequest: jest.fn(),
      updateApprovalRequest: jest.fn(),
      getApprovalRequest: jest.fn(),
      
      // Capital entries (FX dependent)
      createCapitalEntry: jest.fn(),
      getCapitalBalance: jest.fn(),
      
      // Audit trail
      createAuditLog: jest.fn(),
      getAuditLogs: jest.fn()
    }
  };
});

describe('Final Production Business Regression Tests', () => {
  let app;
  let mockSupabaseClient;
  let mockStorage;

  beforeAll(async () => {
    const express = require('express');
    
    // Create app exactly like production server
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Add request logging middleware (same as production)
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (req.path.startsWith("/api")) {
          console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
        }
      });
      next();
    });

    // Get mocked clients (both admin and regular)
    const { supabaseAdmin, supabaseClient } = require('../core/auth/providers/supabaseProvider');
    mockSupabaseClient = supabaseAdmin(); // Primary mock client
    
    const { storage } = require('../core/storage');
    mockStorage = storage;

    // Setup authentication exactly like production
    const { setupAuth } = require('../core/auth');
    await setupAuth(app);

    // Setup all routes exactly like production
    const { setupModuleRoutes } = require('../routes/index');
    setupModuleRoutes(app);
  });

  // Setup deterministic test user
  const setupAuthenticatedUser = (role = 'admin', userId = 'test-user-admin') => {
    const user = {
      id: userId,
      email: `${role}@test.regression`,
      role: role,
      isActive: true,
      warehouseId: role === 'warehouse' ? 'FIRST' : null
    };

    // Mock Supabase response (exact middleware path)
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: user.id, email: user.email } },
      error: null
    });

    // Mock storage user lookup
    mockStorage.getUserByEmail.mockResolvedValue(user);
    mockStorage.getUser.mockResolvedValue(user);
    
    // Mock regular supabase client if needed
    const { supabaseClient } = require('../core/auth/providers/supabaseProvider');
    const regularClient = supabaseClient();
    regularClient.auth.getUser.mockResolvedValue({
      data: { user: { id: user.id, email: user.email } },
      error: null
    });

    return user;
  };

  // Seed deterministic FX rate
  const seedCentralFXRate = (rate = '57.5') => {
    const setting = {
      id: 'fx-rate-setting',
      key: 'USD_ETB_RATE',
      value: rate,
      category: 'financial',
      description: 'Central exchange rate'
    };

    mockStorage.getSystemSetting.mockImplementation((key, category) => {
      if (key === 'USD_ETB_RATE' && (!category || category === 'financial')) {
        return Promise.resolve(setting);
      }
      return Promise.resolve(null);
    });

    mockStorage.getSystemSettings.mockImplementation(() => {
      return Promise.resolve([setting]);
    });
    
    // Mock real settings API calls
    mockStorage.getSettings.mockImplementation(() => {
      return Promise.resolve([setting]);
    });
    
    mockStorage.getSetting.mockImplementation((key) => {
      if (key === 'USD_ETB_RATE') {
        return Promise.resolve(setting);
      }
      return Promise.resolve(null);
    });

    return setting;
  };

  // Seed approval chains
  const seedApprovalChains = () => {
    const chains = [
      {
        id: 'capital-chain',
        operationType: 'capital_entry',
        minAmount: 0,
        maxAmount: null,
        isActive: true,
        priority: 10
      },
      {
        id: 'purchase-chain',
        operationType: 'purchase', 
        minAmount: 0,
        maxAmount: null,
        isActive: true,
        priority: 10
      }
    ];

    mockStorage.getApprovalChains.mockResolvedValue(chains);
    mockStorage.getApprovalRequests.mockResolvedValue([]); // Empty requests initially
    return chains;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: admin user with FX rate configured
    setupAuthenticatedUser('admin');
    seedCentralFXRate('57.5');
    seedApprovalChains();
  });

  describe('1. Central FX System - Deterministic Behavior', () => {
    
    it('should enforce central FX rate when configured', async () => {
      setupAuthenticatedUser('admin');
      seedCentralFXRate('58.0'); // Specific rate

      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      const fxSetting = response.body.find(s => s.key === 'USD_ETB_RATE');
      expect(fxSetting).toBeDefined();
      expect(fxSetting.value).toBe('58.0'); // Exact value
      expect(fxSetting.category).toBe('financial');
      expect(mockStorage.getSettings).toHaveBeenCalled();
    });

    it('should block capital operations without FX rate', async () => {
      setupAuthenticatedUser('finance');
      
      // Remove FX rate (simulate missing configuration)
      mockStorage.getSystemSetting.mockResolvedValue(null);
      
      // Mock ConfigurationService to throw error when no rate
      const { ConfigurationService } = require('../configurationService');
      const mockConfigService = {
        getCentralExchangeRate: jest.fn().mockRejectedValue(
          new Error('Central exchange rate not configured. Please set USD_ETB_RATE in settings.')
        )
      };
      ConfigurationService.getInstance = jest.fn(() => mockConfigService);

      const response = await request(app)
        .post('/api/capital/entries')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'CapitalIn',
          amount: '1000',
          description: 'Entry without FX rate'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toMatch(/failed|error/i);
      expect(mockConfigService.getCentralExchangeRate).toHaveBeenCalled();
    });

    it('should use central FX rate in capital operations', async () => {
      setupAuthenticatedUser('finance');
      seedCentralFXRate('59.0');

      // Mock successful capital entry creation
      const createdEntry = {
        id: 'capital-123',
        entryId: 'CAP-2024-001',
        type: 'CapitalIn',
        amount: '1000',
        exchangeRate: '59.0', // Should use central rate
        description: 'Test entry'
      };
      
      mockStorage.createCapitalEntry.mockResolvedValue(createdEntry);
      
      // Mock configuration service
      const { ConfigurationService } = require('../configurationService');
      const mockConfigService = {
        getCentralExchangeRate: jest.fn().mockResolvedValue(59.0),
        generateEntityNumber: jest.fn().mockResolvedValue('CAP-2024-001')
      };
      ConfigurationService.getInstance = jest.fn(() => mockConfigService);

      const response = await request(app)
        .post('/api/capital/entries')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'CapitalIn',
          amount: '1000',
          description: 'Test capital entry'
        });

      expect(response.status).toBe(201);
      expect(response.body.exchangeRate).toBe('59.0'); // Exact central rate
      expect(mockConfigService.getCentralExchangeRate).toHaveBeenCalled();
      expect(mockStorage.createCapitalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          exchangeRate: '59.0' // Central rate enforced
        })
      );
    });
  });

  describe('2. Immutability System - Audit Trail Verification', () => {
    
    it('should create audit logs for critical operations', async () => {
      setupAuthenticatedUser('admin');
      
      // Mock audit service (match real import pattern)
      const { auditService } = require('../auditService');
      auditService.logAction = jest.fn().mockResolvedValue({
        id: 'audit-123',
        checksum: 'deterministic-checksum'
      });

      // Create setting (should trigger audit)
      mockStorage.updateSetting.mockResolvedValue({
        id: 'setting-123',
        key: 'TEST_SETTING',
        value: 'test_value',
        category: 'test'
      });

      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', 'Bearer test-token')
        .send({
          key: 'TEST_SETTING',
          value: 'test_value',
          category: 'test'
        });

      expect(response.status).toBe(200); // Real API returns 200 for updates
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-admin',
          action: 'UPDATE',
          entityType: 'setting'
        })
      );
    });

    it('should enforce role-based data protection', async () => {
      // Test unauthorized access
      setupAuthenticatedUser('worker'); // Lower privilege
      
      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', 'Bearer test-token')
        .send({
          key: 'CRITICAL_SETTING',
          value: 'unauthorized_change',
          category: 'financial'
        });

      expect(response.status).toBe(403); // Blocked
      expect(mockStorage.setSystemSetting).not.toHaveBeenCalled();
    });

    it('should maintain session integrity across operations', async () => {
      setupAuthenticatedUser('admin');
      
      // Sequential operations should maintain same user context
      const operations = [
        () => request(app).get('/api/settings').set('Authorization', 'Bearer test-token'),
        () => request(app).get('/api/approvals/chains').set('Authorization', 'Bearer test-token')
      ];

      for (const operation of operations) {
        const result = await operation();
        expect(result.status).toBe(200);
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      }
    });
  });

  describe('3. Approval System - Workflow Enforcement', () => {
    
    it('should return configured approval chains', async () => {
      setupAuthenticatedUser('admin');
      const chains = seedApprovalChains();

      const response = await request(app)
        .get('/api/approvals/chains')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].operationType).toBe('capital_entry');
      expect(response.body[1].operationType).toBe('purchase');
      expect(mockStorage.getApprovalChains).toHaveBeenCalled();
    });

    it('should enforce role-based approval access', async () => {
      setupAuthenticatedUser('worker'); // Should not access approvals
      
      const response = await request(app)
        .get('/api/approvals/chains')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403); // Blocked by role
    });

    it('should handle approval decision processing', async () => {
      setupAuthenticatedUser('admin');
      
      // Mock approval workflow service
      const { approvalWorkflowService } = require('../approvalWorkflowService');
      const mockWorkflowService = {
        processApprovalDecision: jest.fn().mockResolvedValue({
          id: 'approval-123',
          status: 'approved',
          decision: 'approve'
        })
      };
      approvalWorkflowService.processApprovalDecision = mockWorkflowService.processApprovalDecision;

      const response = await request(app)
        .post('/api/approvals/requests/approval-123/decision')
        .set('Authorization', 'Bearer test-token')
        .send({
          decision: 'approve',
          comments: 'Regression test approval'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('approved');
      expect(mockWorkflowService.processApprovalDecision).toHaveBeenCalledWith(
        'approval-123',
        'test-user-admin',
        { decision: 'approve', comments: 'Regression test approval' }
      );
    });
  });

  describe('4. System Integration - End-to-End Verification', () => {
    
    it('should maintain authentication across all business systems', async () => {
      setupAuthenticatedUser('admin');
      
      const endpoints = [
        '/api/settings',
        '/api/approvals/chains',
        '/api/approvals/requests'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', 'Bearer test-token');

        expect(response.status).toBe(200);
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      }
    });

    it('should process business operations deterministically', async () => {
      setupAuthenticatedUser('finance');
      seedCentralFXRate('60.0');
      
      // Mock complete business flow
      const { ConfigurationService } = require('../configurationService');
      const mockConfigService = {
        getCentralExchangeRate: jest.fn().mockResolvedValue(60.0)
      };
      ConfigurationService.getInstance = jest.fn(() => mockConfigService);

      mockStorage.createCapitalEntry.mockResolvedValue({
        id: 'capital-456',
        exchangeRate: '60.0',
        amount: '2000'
      });

      const response = await request(app)
        .post('/api/capital/entries')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'CapitalIn',
          amount: '2000',
          description: 'Integration test entry'
        });

      // Verify complete flow
      expect(response.status).toBe(201);
      expect(response.body.exchangeRate).toBe('60.0'); // FX system
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled(); // Auth system
      expect(mockConfigService.getCentralExchangeRate).toHaveBeenCalled(); // FX system
      expect(mockStorage.createCapitalEntry).toHaveBeenCalled(); // Storage system
    });

    it('should maintain system stability under concurrent load', async () => {
      setupAuthenticatedUser('admin');
      
      // Concurrent requests should all succeed
      const concurrentRequests = Array.from({ length: 5 }, () =>
        request(app)
          .get('/api/settings')
          .set('Authorization', 'Bearer test-token')
      );

      const results = await Promise.all(concurrentRequests);
      
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(Array.isArray(result.body)).toBe(true);
      });

      // All should use same user context
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(5);
    });
  });
});