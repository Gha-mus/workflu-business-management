import { db } from "./db";
import { approvalChains } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { approvalWorkflowService } from "./approvalWorkflowService";

/**
 * CRITICAL SECURITY SERVICE: Approval Chain Startup Validation
 * 
 * This service ensures that ALL critical operations have proper approval chains
 * configured before the application starts. It fails startup if any critical
 * approval chain is missing, preventing security bypass vulnerabilities.
 */
class ApprovalStartupValidator {
  private static instance: ApprovalStartupValidator;

  // CRITICAL: All operation types that MUST have approval chains before startup
  private static readonly REQUIRED_APPROVAL_CHAINS: ReadonlyArray<{
    operationType: string;
    description: string;
    criticalityLevel: 'critical' | 'high' | 'medium';
    requiredRoles: string[];
    maxAutoApprovalAmount?: number;
  }> = [
    {
      operationType: 'capital_entry',
      description: 'Capital entries and financial adjustments',
      criticalityLevel: 'critical',
      requiredRoles: ['admin', 'finance'],
      maxAutoApprovalAmount: 1000 // USD
    },
    {
      operationType: 'purchase',
      description: 'Purchase orders and supplier payments',
      criticalityLevel: 'critical', 
      requiredRoles: ['admin', 'finance', 'purchasing'],
      maxAutoApprovalAmount: 5000 // USD
    },
    {
      operationType: 'sale_order',
      description: 'Sales orders and customer transactions',
      criticalityLevel: 'critical',
      requiredRoles: ['admin', 'sales', 'finance'],
      maxAutoApprovalAmount: 10000 // USD
    },
    {
      operationType: 'financial_adjustment',
      description: 'Financial adjustments and corrections',
      criticalityLevel: 'critical',
      requiredRoles: ['admin', 'finance']
    },
    {
      operationType: 'user_role_change',
      description: 'User role and permission changes',
      criticalityLevel: 'critical',
      requiredRoles: ['admin']
    },
    {
      operationType: 'system_setting_change',
      description: 'System configuration changes',
      criticalityLevel: 'critical',
      requiredRoles: ['admin']
    },
    {
      operationType: 'warehouse_operation',
      description: 'Warehouse stock movements and adjustments',
      criticalityLevel: 'high',
      requiredRoles: ['admin', 'warehouse'],
      maxAutoApprovalAmount: 2000 // USD value
    },
    {
      operationType: 'shipping_operation',
      description: 'Shipping and logistics operations',
      criticalityLevel: 'medium',
      requiredRoles: ['admin', 'warehouse', 'sales'],
      maxAutoApprovalAmount: 1500 // USD value
    }
  ];

  private constructor() {}

  public static getInstance(): ApprovalStartupValidator {
    if (!ApprovalStartupValidator.instance) {
      ApprovalStartupValidator.instance = new ApprovalStartupValidator();
    }
    return ApprovalStartupValidator.instance;
  }

  /**
   * CRITICAL: Validate all approval chains are configured before application startup
   * This method MUST be called during application initialization
   */
  public async validateApprovalChainConfiguration(): Promise<void> {
    console.log("🔒 VALIDATING APPROVAL CHAIN CONFIGURATION FOR STARTUP...");

    const validationResults: {
      operationType: string;
      hasChain: boolean;
      chainDetails?: any;
      errors: string[];
      warnings: string[];
    }[] = [];

    let hasCriticalMissingChains = false;
    let hasHighPriorityMissingChains = false;

    for (const requirement of ApprovalStartupValidator.REQUIRED_APPROVAL_CHAINS) {
      console.log(`🔍 Checking approval chain for: ${requirement.operationType} (${requirement.criticalityLevel})`);

      try {
        // Check if approval chain exists for this operation type
        const existingChains = await db
          .select()
          .from(approvalChains)
          .where(
            and(
              eq(approvalChains.operationType, requirement.operationType as any),
              eq(approvalChains.isActive, true)
            )
          );

        const result = {
          operationType: requirement.operationType,
          hasChain: existingChains.length > 0,
          chainDetails: existingChains.length > 0 ? existingChains[0] : null,
          errors: [] as string[],
          warnings: [] as string[]
        };

        if (existingChains.length === 0) {
          const errorMsg = `❌ MISSING APPROVAL CHAIN: No active approval chain found for '${requirement.operationType}'`;
          result.errors.push(errorMsg);

          if (requirement.criticalityLevel === 'critical') {
            hasCriticalMissingChains = true;
            console.error(`🚨 ${errorMsg} [CRITICAL]`);
          } else if (requirement.criticalityLevel === 'high') {
            hasHighPriorityMissingChains = true;
            console.error(`⚠️ ${errorMsg} [HIGH PRIORITY]`);
          } else {
            console.warn(`⚠️ ${errorMsg} [MEDIUM PRIORITY]`);
          }
        } else {
          // Validate chain configuration
          await this.validateChainConfiguration(requirement, existingChains[0], result);
          console.log(`✅ FOUND: ${requirement.operationType} has ${existingChains.length} active chain(s)`);
        }

        validationResults.push(result);

      } catch (error) {
        const errorMsg = `Database error checking approval chain for ${requirement.operationType}: ${error instanceof Error ? error.message : error}`;
        validationResults.push({
          operationType: requirement.operationType,
          hasChain: false,
          errors: [errorMsg],
          warnings: []
        });

        hasCriticalMissingChains = true;
        console.error(`🚨 ${errorMsg}`);
      }
    }

    // Generate comprehensive report
    await this.generateValidationReport(validationResults);

    // CRITICAL: Fail startup if critical approval chains are missing
    if (hasCriticalMissingChains) {
      const errorMsg = "🚨 STARTUP BLOCKED: Critical approval chains are missing. Application cannot start in an insecure state.";
      console.error(errorMsg);
      console.error("🛑 REFUSING TO START - FIX APPROVAL CHAIN CONFIGURATION BEFORE RESTART");
      
      // Log this as a critical security event
      try {
        console.error('SECURITY EVENT: startup_validation_failure - Critical approval chains missing at startup');
      } catch (logError) {
        console.error('Failed to log startup validation failure:', logError);
      }

      throw new Error(errorMsg);
    }

    // Warn about high priority missing chains but allow startup
    if (hasHighPriorityMissingChains) {
      console.warn("⚠️ WARNING: Some high-priority approval chains are missing. Consider adding them soon.");
      console.warn("🔶 APPLICATION STARTING IN DEGRADED APPROVAL MODE");
    }

    console.log("✅ APPROVAL CHAIN VALIDATION COMPLETED SUCCESSFULLY");
  }

  /**
   * Validate individual chain configuration
   */
  private async validateChainConfiguration(
    requirement: typeof ApprovalStartupValidator.REQUIRED_APPROVAL_CHAINS[0],
    chain: any,
    result: any
  ): Promise<void> {
    // Check if required roles are properly configured
    const chainRoles = chain.requiredRoles || [];
    const missingRoles = requirement.requiredRoles.filter(role => !chainRoles.includes(role));
    
    if (missingRoles.length > 0) {
      result.warnings.push(`Missing required roles in approval chain: ${missingRoles.join(', ')}`);
    }

    // Validate auto-approval thresholds
    if (requirement.maxAutoApprovalAmount) {
      const chainAutoThreshold = chain.autoApproveBelow ? parseFloat(chain.autoApproveBelow) : 0;
      if (chainAutoThreshold > requirement.maxAutoApprovalAmount) {
        result.warnings.push(
          `Auto-approval threshold ($${chainAutoThreshold}) exceeds recommended maximum ($${requirement.maxAutoApprovalAmount})`
        );
      }
    }

    // Check if chain has proper priority set
    if (!chain.priority || chain.priority < 1) {
      result.warnings.push("Approval chain priority not properly configured");
    }
  }

  /**
   * Generate comprehensive validation report
   */
  private async generateValidationReport(validationResults: any[]): Promise<void> {
    console.log("\n📊 APPROVAL CHAIN VALIDATION REPORT:");
    console.log("=====================================");

    let totalChains = 0;
    let missingChains = 0;
    let criticalMissing = 0;
    let highPriorityMissing = 0;
    let totalWarnings = 0;

    for (const result of validationResults) {
      totalChains++;
      
      if (!result.hasChain) {
        missingChains++;
        const requirement = ApprovalStartupValidator.REQUIRED_APPROVAL_CHAINS.find(
          r => r.operationType === result.operationType
        );
        
        if (requirement?.criticalityLevel === 'critical') {
          criticalMissing++;
        } else if (requirement?.criticalityLevel === 'high') {
          highPriorityMissing++;
        }
      }

      totalWarnings += result.warnings.length;

      console.log(`\n${result.hasChain ? '✅' : '❌'} ${result.operationType}`);
      if (result.errors.length > 0) {
        result.errors.forEach((error: string) => console.log(`   ERROR: ${error}`));
      }
      if (result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => console.log(`   WARNING: ${warning}`));
      }
      if (result.chainDetails) {
        console.log(`   Chain: ${result.chainDetails.name} (Priority: ${result.chainDetails.priority})`);
      }
    }

    console.log("\n📈 SUMMARY:");
    console.log(`   Total Operations: ${totalChains}`);
    console.log(`   Configured Chains: ${totalChains - missingChains}`);
    console.log(`   Missing Chains: ${missingChains}`);
    console.log(`   Critical Missing: ${criticalMissing}`);
    console.log(`   High Priority Missing: ${highPriorityMissing}`);
    console.log(`   Total Warnings: ${totalWarnings}`);
    console.log("=====================================\n");
  }

  /**
   * Get current approval chain coverage status (for admin diagnostics)
   */
  public async getApprovalChainCoverage(): Promise<{
    totalOperations: number;
    configuredChains: number;
    missingChains: string[];
    criticalMissing: string[];
    warnings: Array<{ operationType: string; warnings: string[] }>;
    lastValidated: Date;
  }> {
    const missingChains: string[] = [];
    const criticalMissing: string[] = [];
    const warnings: Array<{ operationType: string; warnings: string[] }> = [];
    let configuredCount = 0;

    for (const requirement of ApprovalStartupValidator.REQUIRED_APPROVAL_CHAINS) {
      try {
        const existingChains = await db
          .select()
          .from(approvalChains)
          .where(
            and(
              eq(approvalChains.operationType, requirement.operationType as any),
              eq(approvalChains.isActive, true)
            )
          );

        if (existingChains.length === 0) {
          missingChains.push(requirement.operationType);
          if (requirement.criticalityLevel === 'critical') {
            criticalMissing.push(requirement.operationType);
          }
        } else {
          configuredCount++;
          
          // Check for configuration warnings
          const chainWarnings: string[] = [];
          const chain = existingChains[0];
          const chainRoles = chain.requiredRoles || [];
          const missingRoles = requirement.requiredRoles.filter(role => !chainRoles.includes(role as any));
          
          if (missingRoles.length > 0) {
            chainWarnings.push(`Missing required roles: ${missingRoles.join(', ')}`);
          }

          if (chainWarnings.length > 0) {
            warnings.push({
              operationType: requirement.operationType,
              warnings: chainWarnings
            });
          }
        }
      } catch (error) {
        missingChains.push(requirement.operationType);
        criticalMissing.push(requirement.operationType);
      }
    }

    return {
      totalOperations: ApprovalStartupValidator.REQUIRED_APPROVAL_CHAINS.length,
      configuredChains: configuredCount,
      missingChains,
      criticalMissing,
      warnings,
      lastValidated: new Date()
    };
  }
}

// Export singleton instance
export const approvalStartupValidator = ApprovalStartupValidator.getInstance();