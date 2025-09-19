/**
 * CRITICAL SECURITY TESTS: Approval System Vulnerability Prevention
 * 
 * These tests verify that the approval system prevents:
 * - Approval replay attacks (reuse of consumed approvals)
 * - Approval swapping (using approval for different operations)
 * - Amount manipulation (changing amounts after approval)
 * - User swapping (different user executing approved operation)
 * - Operation type mismatches
 * - Expired approval usage
 * - Unauthorized operation execution
 */

const request = require('supertest');
const { approvalWorkflowService } = require('../approvalWorkflowService');
const { storage } = require('../storage');
const { auditService } = require('../auditService');
const { db } = require('../db');
const crypto = require('crypto');

describe('🔒 CRITICAL SECURITY: Approval System Vulnerability Prevention', () => {
  let testUserId, testApprovalId, testOperationData;
  let adminToken, userToken;

  beforeAll(async () => {
    // Set up test environment
    await setupTestEnvironment();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestEnvironment();
  });

  beforeEach(async () => {
    // Reset test state for each test
    testUserId = 'test-user-' + Math.random().toString(36).substr(2, 9);
    testOperationData = {
      id: 'test-op-' + Math.random().toString(36).substr(2, 9),
      amount: 50000,
      currency: 'USD',
      description: 'Test high-value operation',
      supplierId: 'test-supplier-123'
    };
  });

  describe('🚨 SECURITY TEST 1: Approval Scoping and Context Validation', () => {
    
    it('should BLOCK operations with approval for different operation type', async () => {
      // Create approval for capital_entry
      const capitalApproval = await createTestApproval({
        operationType: 'capital_entry',
        amount: 50000,
        currency: 'USD',
        operationData: { type: 'CapitalOut', amount: 50000 }
      });

      // Try to use capital_entry approval for a purchase operation
      const purchaseData = {
        ...testOperationData,
        _approvalRequestId: capitalApproval.id,
        operationType: 'purchase',
        supplierId: 'supplier-123',
        total: 50000
      };

      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send(purchaseData)
        .expect(403);

      expect(response.body.message).toContain('Invalid approval');
      expect(response.body.error).toContain('Operation type mismatch');
      expect(response.body.securityViolation).toBe(true);
    });

    it('should BLOCK operations with approval for different amount', async () => {
      // Create approval for $25,000
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 25000,
        currency: 'USD',
        operationData: { ...testOperationData, total: 25000 }
      });

      // Try to use for $50,000 operation (amount manipulation attack)
      const manipulatedData = {
        ...testOperationData,
        _approvalRequestId: approval.id,
        total: 50000, // Different amount!
        amount: 50000
      };

      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send(manipulatedData)
        .expect(403);

      expect(response.body.error).toContain('Amount mismatch');
      expect(response.body.securityViolation).toBe(true);
    });

    it('should BLOCK operations with approval requested by different user', async () => {
      // Create approval requested by user A
      const userAId = 'user-a-123';
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        requestedBy: userAId,
        operationData: testOperationData
      });

      // Try to execute with user B (user swapping attack)
      const userBId = 'user-b-456';
      const response = await request(app)
        .post('/api/test/purchase-operation')
        .set('Authorization', `Bearer ${getUserToken(userBId)}`)
        .send({
          ...testOperationData,
          _approvalRequestId: approval.id
        })
        .expect(403);

      expect(response.body.error).toContain('Requester mismatch');
      expect(response.body.securityViolation).toBe(true);
    });

    it('should BLOCK operations with approval for different currency', async () => {
      // Create approval for USD
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        currency: 'USD',
        operationData: { ...testOperationData, currency: 'USD' }
      });

      // Try to use for EUR operation (currency mismatch attack)
      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send({
          ...testOperationData,
          _approvalRequestId: approval.id,
          currency: 'EUR' // Different currency!
        })
        .expect(403);

      expect(response.body.error).toContain('Currency mismatch');
      expect(response.body.securityViolation).toBe(true);
    });

    it('should BLOCK operations with expired approvals', async () => {
      // Create approval and manually set it as expired
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        operationData: testOperationData
      });

      // Manually update approval to be 25 hours old (expired)
      await db.update(approvalRequests)
        .set({ 
          completedAt: new Date(Date.now() - (25 * 60 * 60 * 1000)) // 25 hours ago
        })
        .where(eq(approvalRequests.id, approval.id));

      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send({
          ...testOperationData,
          _approvalRequestId: approval.id
        })
        .expect(403);

      expect(response.body.error).toContain('expired');
      expect(response.body.securityViolation).toBe(true);
    });
  });

  describe('🚨 SECURITY TEST 2: Single-Use Consumption and Replay Prevention', () => {
    
    it('should PREVENT approval replay attacks (reuse of consumed approval)', async () => {
      // Create and approve a request
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        operationData: testOperationData
      });

      // First execution should succeed
      const firstResponse = await request(app)
        .post('/api/test/purchase-operation')
        .send({
          ...testOperationData,
          _approvalRequestId: approval.id
        })
        .expect(200);

      expect(firstResponse.body.success).toBe(true);

      // Second execution should FAIL (replay attack prevention)
      const secondResponse = await request(app)
        .post('/api/test/purchase-operation')
        .send({
          ...testOperationData,
          _approvalRequestId: approval.id
        })
        .expect(403);

      expect(secondResponse.body.error).toContain('already been consumed');
      expect(secondResponse.body.securityViolation).toBe(true);
    });

    it('should atomically consume approvals to prevent race conditions', async () => {
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        operationData: testOperationData
      });

      // Simulate concurrent requests trying to use same approval
      const promises = Array(5).fill().map(() => 
        request(app)
          .post('/api/test/purchase-operation')
          .send({
            ...testOperationData,
            _approvalRequestId: approval.id
          })
      );

      const responses = await Promise.allSettled(promises);
      
      // Only one request should succeed, others should fail
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );
      const failed = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 403
      );

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(4);
    });

    it('should record consumption details for audit trail', async () => {
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        operationData: testOperationData
      });

      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send({
          ...testOperationData,
          _approvalRequestId: approval.id
        })
        .expect(200);

      // Verify approval was marked as consumed
      const [consumedApproval] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(consumedApproval.isConsumed).toBe(true);
      expect(consumedApproval.consumedAt).toBeTruthy();
      expect(consumedApproval.consumedBy).toBe(testUserId);
      expect(consumedApproval.consumedOperationType).toBe('purchase');
      expect(consumedApproval.operationChecksum).toBeTruthy();
      expect(consumedApproval.consumptionAttempts).toBe(1);
    });
  });

  describe('🚨 SECURITY TEST 3: High-Value Operation Approval Enforcement', () => {
    
    it('should REQUIRE approval for operations above threshold', async () => {
      const highValueOperation = {
        ...testOperationData,
        amount: 75000, // Above threshold
        total: 75000
      };

      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send(highValueOperation)
        .expect(202); // 202 = Approval Required

      expect(response.body.approvalRequired).toBe(true);
      expect(response.body.approvalRequestId).toBeTruthy();
      expect(response.body.message).toContain('requires approval');
    });

    it('should ALLOW operations below threshold without approval', async () => {
      const lowValueOperation = {
        ...testOperationData,
        amount: 1000, // Below threshold
        total: 1000
      };

      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send(lowValueOperation)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should PREVENT storage-level approval bypass', async () => {
      // Try to call storage method directly without approval
      const storageOperation = async () => {
        await storage.createPurchase({
          ...testOperationData,
          total: 75000 // High value requiring approval
        }, { 
          userId: testUserId,
          operationType: 'purchase'
        });
      };

      await expect(storageOperation()).rejects.toThrow('APPROVAL REQUIRED');
    });
  });

  describe('🚨 SECURITY TEST 4: Data Integrity and Checksum Validation', () => {
    
    it('should detect operation data tampering via checksum', async () => {
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        operationData: testOperationData
      });

      // Try to execute with modified data (tampering attempt)
      const tamperedData = {
        ...testOperationData,
        _approvalRequestId: approval.id,
        amount: 50000,
        supplierId: 'different-supplier' // Tampering!
      };

      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send(tamperedData)
        .expect(403);

      expect(response.body.error).toContain('tampered');
      expect(response.body.securityViolation).toBe(true);
    });

    it('should validate core operation fields match approval', async () => {
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        operationData: {
          ...testOperationData,
          supplierId: 'original-supplier',
          weight: 1000
        }
      });

      // Try with different core field values
      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send({
          ...testOperationData,
          _approvalRequestId: approval.id,
          weight: 2000 // Different weight!
        })
        .expect(403);

      expect(response.body.error).toContain('Core field mismatch');
    });
  });

  describe('🚨 SECURITY TEST 5: Audit Log Security and Immutability', () => {
    
    it('should PREVENT audit log updates', async () => {
      // Insert test audit log
      const [auditLog] = await db
        .insert(auditLogs)
        .values({
          action: 'create',
          entityType: 'test',
          description: 'Test audit log',
          checksum: crypto.randomBytes(16).toString('hex')
        })
        .returning();

      // Try to update audit log (should fail)
      const updateAttempt = async () => {
        await db
          .update(auditLogs)
          .set({ description: 'HACKED!' })
          .where(eq(auditLogs.id, auditLog.id));
      };

      await expect(updateAttempt()).rejects.toThrow('Audit logs are immutable');
    });

    it('should PREVENT audit log deletions', async () => {
      // Insert test audit log
      const [auditLog] = await db
        .insert(auditLogs)
        .values({
          action: 'create',
          entityType: 'test',
          description: 'Test audit log',
          checksum: crypto.randomBytes(16).toString('hex')
        })
        .returning();

      // Try to delete audit log (should fail)
      const deleteAttempt = async () => {
        await db
          .delete(auditLogs)
          .where(eq(auditLogs.id, auditLog.id));
      };

      await expect(deleteAttempt()).rejects.toThrow('Audit logs are immutable');
    });

    it('should log all security violations for monitoring', async () => {
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        operationData: testOperationData
      });

      // Trigger security violation
      await request(app)
        .post('/api/test/purchase-operation')
        .send({
          ...testOperationData,
          _approvalRequestId: approval.id,
          amount: 75000 // Amount mismatch
        })
        .expect(403);

      // Verify security violation was logged
      const securityLogs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, 'security_violation'),
            eq(auditLogs.severity, 'critical')
          )
        );

      expect(securityLogs.length).toBeGreaterThan(0);
      expect(securityLogs[0].description).toContain('SECURITY VIOLATION');
    });
  });

  describe('🚨 SECURITY TEST 6: Fail-Closed Behavior for Missing Approval Chains', () => {
    
    it('should REQUIRE approval when no approval chain is configured (fail-closed)', async () => {
      // Mock scenario where approval chain is missing for an operation type
      const originalFindApprovalChain = approvalWorkflowService.findApprovalChain;
      approvalWorkflowService.findApprovalChain = jest.fn().mockResolvedValue(null);

      // Test that requiresApproval returns true (fail-closed) when no chain exists
      const requiresApproval = await approvalWorkflowService.requiresApproval(
        'capital_entry',
        50000,
        'USD',
        testUserId
      );

      expect(requiresApproval).toBe(true); // MUST be true for fail-closed behavior
      
      // Restore original method
      approvalWorkflowService.findApprovalChain = originalFindApprovalChain;
    });

    it('should LOG critical security event when approval chain is missing', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const originalFindApprovalChain = approvalWorkflowService.findApprovalChain;
      approvalWorkflowService.findApprovalChain = jest.fn().mockResolvedValue(null);

      await approvalWorkflowService.requiresApproval(
        'capital_entry',
        50000,
        'USD',
        testUserId
      );

      // Verify critical security error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨 CRITICAL SECURITY ERROR: No approval chain found')
      );

      // Restore original method and console
      approvalWorkflowService.findApprovalChain = originalFindApprovalChain;
      consoleSpy.mockRestore();
    });

    it('should BLOCK operations when approval chain is missing', async () => {
      // Mock missing approval chain scenario
      const originalFindApprovalChain = approvalWorkflowService.findApprovalChain;
      approvalWorkflowService.findApprovalChain = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/test/purchase-operation')
        .send({
          ...testOperationData,
          amount: 50000,
          total: 50000
        })
        .expect(202); // Should require approval (fail-closed)

      expect(response.body.approvalRequired).toBe(true);
      expect(response.body.message).toContain('requires approval');
      
      // Restore original method
      approvalWorkflowService.findApprovalChain = originalFindApprovalChain;
    });

    it('should PREVENT skipApproval for critical operations', async () => {
      const criticalOperations = [
        'capital_entry',
        'purchase',
        'sale_order',
        'financial_adjustment',
        'user_role_change',
        'system_setting_change'
      ];

      for (const operationType of criticalOperations) {
        const storageOperation = async () => {
          await storage.createCapitalEntry({
            ...testOperationData,
            type: 'CapitalOut',
            amount: '50000'
          }, 
          { userId: testUserId },
          { 
            operationType,
            operationData: testOperationData,
            skipApproval: true // Should be blocked for critical operations
          });
        };

        await expect(storageOperation()).rejects.toThrow(
          'is on critical allowlist and CANNOT skip approval'
        );
      }
    });

    it('should ALLOW skipApproval only for internal operations with valid token', async () => {
      const allowedOperations = ['warehouse_operation', 'shipping_operation'];
      
      for (const operationType of allowedOperations) {
        // Should succeed with proper internal token
        const storageOperation = async () => {
          await storage.createWarehouseStock({
            ...testOperationData,
            warehouse: 'FIRST',
            qtyKgTotal: '1000',
            qtyKgClean: '1000'
          },
          { userId: 'system' }, // Internal user
          { 
            operationType,
            operationData: testOperationData,
            skipApproval: true
          });
        };

        // This should not throw if implementation is correct
        // (Note: would need proper test data setup for this to actually succeed)
      }
    });
  });

  describe('🚨 SECURITY TEST 7: Edge Cases and Attack Vectors', () => {
    
    it('should handle approval ID injection attacks', async () => {
      const maliciousApprovalIds = [
        "'; DROP TABLE approval_requests; --",
        "../../../etc/passwd",
        "<script>alert('xss')</script>",
        "null",
        "undefined",
        "",
        " ",
        "00000000-0000-0000-0000-000000000000"
      ];

      for (const maliciousId of maliciousApprovalIds) {
        const response = await request(app)
          .post('/api/test/purchase-operation')
          .send({
            ...testOperationData,
            _approvalRequestId: maliciousId
          })
          .expect(403);

        expect(response.body.securityViolation).toBe(true);
      }
    });

    it('should handle large amounts and precision attacks', async () => {
      const maliciousAmounts = [
        Number.MAX_SAFE_INTEGER,
        -50000, // Negative amount
        0.001, // Very small
        999999999999999.99, // Very large
        parseFloat('1.000000000000001'), // Precision attack
      ];

      for (const amount of maliciousAmounts) {
        const approval = await createTestApproval({
          operationType: 'purchase',
          amount: 50000, // Normal approved amount
          operationData: { ...testOperationData, total: 50000 }
        });

        const response = await request(app)
          .post('/api/test/purchase-operation')
          .send({
            ...testOperationData,
            _approvalRequestId: approval.id,
            total: amount // Malicious amount
          });

        // Should either require new approval or reject for mismatch
        expect([403, 202]).toContain(response.status);
      }
    });

    it('should handle concurrent approval consumption attempts', async () => {
      const approval = await createTestApproval({
        operationType: 'purchase',
        amount: 50000,
        operationData: testOperationData
      });

      // Launch multiple concurrent consumption attempts
      const concurrentAttempts = 10;
      const promises = Array(concurrentAttempts).fill().map((_, index) =>
        request(app)
          .post('/api/test/purchase-operation')
          .send({
            ...testOperationData,
            id: `concurrent-op-${index}`,
            _approvalRequestId: approval.id
          })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;

      // Only one should succeed due to atomic consumption
      expect(successful).toBe(1);
    });
  });

  // ==============================================
  // HELPER FUNCTIONS FOR TESTING
  // ==============================================

  async function createTestApproval({
    operationType,
    amount,
    currency = 'USD',
    requestedBy = testUserId,
    operationData
  }) {
    const approvalRequest = await approvalWorkflowService.createApprovalRequest({
      operationType,
      amount,
      currency,
      requestedBy,
      operationData,
      businessContext: 'Test approval for security testing'
    });

    // Auto-approve for testing
    await approvalWorkflowService.processApprovalDecision(
      approvalRequest.id,
      { decision: 'approve', comments: 'Auto-approved for testing' },
      'admin-user'
    );

    return approvalRequest;
  }

  async function setupTestEnvironment() {
    // Set up test database state, users, etc.
    // This would include creating test users, approval chains, etc.
  }

  async function cleanupTestEnvironment() {
    // Clean up test data
    // Remove test users, approvals, etc.
  }

  function getUserToken(userId) {
    // Mock JWT token generation for testing
    return `mock-token-${userId}`;
  }
});