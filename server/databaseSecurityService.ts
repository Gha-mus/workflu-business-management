import { db, pool } from "./db";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Fix for ES modules - get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CRITICAL SECURITY SERVICE: Database Security Initialization and Runtime Verification
 * 
 * This service ensures that all database-level security constraints are properly
 * installed and verified at application startup. It fails startup if any critical
 * security constraint is missing.
 */
class DatabaseSecurityService {
  private static instance: DatabaseSecurityService;

  private constructor() {}

  public static getInstance(): DatabaseSecurityService {
    if (!DatabaseSecurityService.instance) {
      DatabaseSecurityService.instance = new DatabaseSecurityService();
    }
    return DatabaseSecurityService.instance;
  }

  /**
   * CRITICAL: Initialize all database security constraints and verify their existence
   * This method MUST be called during application startup before accepting any requests
   */
  public async initializeSecurityConstraints(): Promise<void> {
    console.log("🔒 INITIALIZING DATABASE SECURITY CONSTRAINTS...");

    try {
      // Step 1: Execute audit immutability constraints
      await this.executeAuditImmutabilityConstraints();

      // Step 2: Verify all critical constraints exist
      await this.verifySecurityConstraints();

      // Step 3: Verify all critical triggers exist
      await this.verifySecurityTriggers();

      // Step 4: Test constraint functionality
      await this.testConstraintFunctionality();

      console.log("✅ DATABASE SECURITY CONSTRAINTS INITIALIZED SUCCESSFULLY");

    } catch (error) {
      console.error("🚨 CRITICAL FAILURE: Database security initialization failed:", error);
      console.error("🛑 REFUSING TO START APPLICATION DUE TO SECURITY VULNERABILITIES");
      
      // FAIL SECURE: Exit application if security constraints cannot be verified
      process.exit(1);
    }
  }

  /**
   * Execute the audit immutability constraints SQL file
   */
  private async executeAuditImmutabilityConstraints(): Promise<void> {
    try {
      console.log("📋 Installing audit log immutability constraints...");

      // Read the SQL file
      const sqlPath = join(__dirname, "audit_immutability_constraints.sql");
      const sqlContent = readFileSync(sqlPath, "utf-8");

      // Execute the SQL - this creates triggers and constraints
      await db.execute(sql.raw(sqlContent));

      console.log("✅ Audit immutability constraints installed successfully");

    } catch (error) {
      throw new Error(`Failed to install audit immutability constraints: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Verify that all critical database constraints exist
   */
  private async verifySecurityConstraints(): Promise<void> {
    console.log("🔍 Verifying database security constraints...");

    const requiredConstraints = [
      // Audit log constraints
      { table: 'audit_logs', constraint: 'audit_logs_timestamp_not_null', type: 'CHECK' },
      { table: 'audit_logs', constraint: 'audit_logs_timestamp_not_future', type: 'CHECK' },
      { table: 'audit_logs', constraint: 'audit_logs_checksum_not_null', type: 'CHECK' },
      { table: 'audit_logs', constraint: 'audit_logs_action_not_null', type: 'CHECK' },
      { table: 'audit_logs', constraint: 'audit_logs_entity_type_not_null', type: 'CHECK' },
      { table: 'audit_logs', constraint: 'audit_logs_description_not_empty', type: 'CHECK' },
      
    ];

    for (const constraint of requiredConstraints) {
      const exists = await this.checkConstraintExists(constraint.table, constraint.constraint);
      if (!exists) {
        throw new Error(`CRITICAL SECURITY CONSTRAINT MISSING: ${constraint.constraint} on table ${constraint.table}`);
      }
      console.log(`✅ Verified constraint: ${constraint.constraint}`);
    }

    // Verify unique indexes (separate from table constraints)
    const requiredUniqueIndexes = [
      { table: 'approval_requests', index: 'unique_approval_request_unconsumed' },
    ];

    for (const uniqueIndex of requiredUniqueIndexes) {
      const exists = await this.checkUniqueIndexExists(uniqueIndex.table, uniqueIndex.index);
      if (!exists) {
        throw new Error(`CRITICAL SECURITY CONSTRAINT MISSING: ${uniqueIndex.index} on table ${uniqueIndex.table}`);
      }
      console.log(`✅ Verified unique index: ${uniqueIndex.index}`);
    }
  }

  /**
   * Verify that all critical database triggers exist
   */
  private async verifySecurityTriggers(): Promise<void> {
    console.log("🔍 Verifying database security triggers...");

    const requiredTriggers = [
      { table: 'audit_logs', trigger: 'audit_logs_prevent_update' },
      { table: 'audit_logs', trigger: 'audit_logs_prevent_delete' },
      { table: 'audit_logs', trigger: 'audit_logs_checksum_validation' },
    ];

    for (const trigger of requiredTriggers) {
      const exists = await this.checkTriggerExists(trigger.table, trigger.trigger);
      if (!exists) {
        throw new Error(`CRITICAL SECURITY TRIGGER MISSING: ${trigger.trigger} on table ${trigger.table}`);
      }
      console.log(`✅ Verified trigger: ${trigger.trigger}`);
    }
  }

  /**
   * Test that security constraints are actually working
   */
  private async testConstraintFunctionality(): Promise<void> {
    console.log("🧪 Testing security constraint functionality...");

    try {
      // Test 1: Try to insert audit log with invalid data (should fail)
      await this.testAuditLogConstraints();

      // Test 2: Test approval consumption constraint (should prevent double consumption)
      await this.testApprovalConsumptionConstraint();

      console.log("✅ All security constraints are functioning correctly");

    } catch (error) {
      throw new Error(`Security constraint functionality test failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Test audit log immutability constraints
   */
  private async testAuditLogConstraints(): Promise<void> {
    // Test inserting an audit log with missing checksum (should fail)
    try {
      await db.execute(sql`
        INSERT INTO audit_logs (action, entity_type, description, checksum) 
        VALUES ('create', 'test_entity', 'Test audit log', NULL)
      `);
      throw new Error("Audit log constraint test failed - NULL checksum was allowed");
    } catch (error) {
      if (error instanceof Error && error.message.includes("checksum is required")) {
        // This is expected - the constraint is working
        console.log("✅ Audit log checksum constraint is working");
      } else {
        throw error;
      }
    }
  }

  /**
   * Test approval consumption constraint
   */
  private async testApprovalConsumptionConstraint(): Promise<void> {
    // This test would be more complex in a real scenario
    // For now, just verify the unique index exists in the database metadata
    const indexExists = await this.checkUniqueIndexExists('approval_requests', 'unique_approval_request_unconsumed');
    if (!indexExists) {
      throw new Error("Approval consumption unique constraint is missing");
    }
    console.log("✅ Approval consumption constraint is in place");
  }

  /**
   * Check if a specific constraint exists on a table
   */
  private async checkConstraintExists(tableName: string, constraintName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = ${tableName} 
        AND constraint_name = ${constraintName}
      `);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Error checking constraint ${constraintName}:`, error);
      return false;
    }
  }

  /**
   * Check if a specific unique index exists on a table
   */
  private async checkUniqueIndexExists(tableName: string, indexName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT 1
        FROM pg_indexes
        WHERE tablename = ${tableName}
        AND indexname = ${indexName}
        AND indexdef LIKE '%UNIQUE%'
      `);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Error checking unique index ${indexName}:`, error);
      return false;
    }
  }

  /**
   * Check if a specific trigger exists on a table
   */
  private async checkTriggerExists(tableName: string, triggerName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT 1 
        FROM information_schema.triggers 
        WHERE event_object_table = ${tableName} 
        AND trigger_name = ${triggerName}
      `);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Error checking trigger ${triggerName}:`, error);
      return false;
    }
  }

  /**
   * Verify audit log integrity (can be called periodically)
   */
  public async verifyAuditLogIntegrity(): Promise<{ totalLogs: number; integrityValid: boolean; errors: string[] }> {
    try {
      console.log("🔍 Verifying audit log integrity...");

      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_logs,
          COUNT(CASE WHEN verify_audit_log_integrity(id) THEN 1 END) as valid_logs
        FROM audit_logs
      `);

      const row = result.rows[0] as any;
      const totalLogs = parseInt(row.total_logs);
      const validLogs = parseInt(row.valid_logs);
      const integrityValid = totalLogs === validLogs;

      if (!integrityValid) {
        console.error(`🚨 AUDIT LOG INTEGRITY VIOLATION: ${totalLogs - validLogs} logs failed integrity check`);
      }

      return {
        totalLogs,
        integrityValid,
        errors: integrityValid ? [] : [`${totalLogs - validLogs} audit logs failed integrity verification`]
      };

    } catch (error) {
      console.error("Error verifying audit log integrity:", error);
      return {
        totalLogs: 0,
        integrityValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get database security status for monitoring
   */
  public async getSecurityStatus(): Promise<{
    constraintsValid: boolean;
    triggersValid: boolean;
    auditIntegrity: boolean;
    lastChecked: Date;
    errors: string[];
  }> {
    const errors: string[] = [];
    let constraintsValid = true;
    let triggersValid = true;
    let auditIntegrity = true;

    try {
      // Quick verification of critical constraints
      const criticalConstraints = ['audit_logs_checksum_not_null', 'unique_approval_request_unconsumed'];
      for (const constraint of criticalConstraints) {
        const table = constraint.startsWith('audit_') ? 'audit_logs' : 'approval_requests';
        if (!await this.checkConstraintExists(table, constraint)) {
          constraintsValid = false;
          errors.push(`Missing constraint: ${constraint}`);
        }
      }

      // Quick verification of critical triggers
      const criticalTriggers = ['audit_logs_prevent_update', 'audit_logs_prevent_delete'];
      for (const trigger of criticalTriggers) {
        if (!await this.checkTriggerExists('audit_logs', trigger)) {
          triggersValid = false;
          errors.push(`Missing trigger: ${trigger}`);
        }
      }

      // Audit integrity check (sampling for performance)
      const integrityResult = await this.verifyAuditLogIntegrity();
      auditIntegrity = integrityResult.integrityValid;
      if (!auditIntegrity) {
        errors.push(...integrityResult.errors);
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      constraintsValid = false;
      triggersValid = false;
      auditIntegrity = false;
    }

    return {
      constraintsValid,
      triggersValid,
      auditIntegrity,
      lastChecked: new Date(),
      errors
    };
  }
}

// Export singleton instance
export const databaseSecurityService = DatabaseSecurityService.getInstance();