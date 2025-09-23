/**
 * Stage 7: Revenue Enhancement Service
 * 
 * Implements missing Stage 7 requirements:
 * - Dual balance display (Accounting Revenue vs Withdrawable Balance)
 * - Transfer fee recording into Operating Expenses during reinvestment
 * - Triple impact reinvestment workflow (Revenue Ledger: -ReinvestOut -TransferFee, Working Capital: +CapitalIn, Operating Expenses: +TransferFee)
 */

import { db } from "./db";
import { 
  revenueTransactions,
  capitalEntries,
  operatingExpenses,
  salesOrders,
  customers
} from "@shared/schema";
import { eq, and, sum, sql, gte, lte } from "drizzle-orm";
import Decimal from "decimal.js";
import { notificationService } from "./notificationService";
import { auditService } from "./auditService";
import { configurationService } from "./configurationService";
import { nanoid } from "nanoid";

export interface DualBalanceReport {
  accountingRevenue: {
    totalSales: number;
    totalRefunds: number;
    netAccountingRevenue: number;
  };
  withdrawableBalance: {
    totalCollections: number;
    totalWithdrawals: number;
    totalReinvestments: number;
    totalTransferFees: number;
    netWithdrawableBalance: number;
  };
  variance: {
    accountingVsWithdrawable: number;
    outstandingReceivables: number;
    uncollectedSales: number;
  };
  cashFlow: {
    currentMonthCollections: number;
    currentMonthWithdrawals: number;
    projectedCollections: number;
  };
}

export interface TripleImpactReinvestment {
  reinvestmentAmount: number;
  transferFeeAmount: number;
  transferFeePercent: number;
  currency: string;
  exchangeRate?: number;
  description: string;
  approvedBy: string;
  transferDetails: {
    transferMethod: string;
    bankReference?: string;
    processingFee?: number;
  };
}

export interface RevenueRebalancing {
  totalRevenueLedgerBalance: number;
  totalWithdrawableBalance: number;
  discrepancy: number;
  rebalancingEntries: Array<{
    entryType: string;
    amount: number;
    reason: string;
  }>;
  finalBalances: {
    revenueLedger: number;
    withdrawable: number;
  };
}

class RevenueEnhancementService {
  private static instance: RevenueEnhancementService;

  private constructor() {
    console.log("RevenueEnhancementService initialized for Stage 7 dual balance and reinvestment enhancements");
  }

  public static getInstance(): RevenueEnhancementService {
    if (!RevenueEnhancementService.instance) {
      RevenueEnhancementService.instance = new RevenueEnhancementService();
    }
    return RevenueEnhancementService.instance;
  }

  /**
   * Calculate dual balance report (Accounting vs Withdrawable)
   */
  async calculateDualBalanceReport(): Promise<DualBalanceReport> {
    try {
      // Calculate accounting revenue (total sales net of returns)
      const accountingData = await db
        .select({
          totalSales: sum(sql`CASE WHEN transaction_type = 'customer_receipt' THEN CAST(amount_usd AS DECIMAL) ELSE 0 END`),
          totalRefunds: sum(sql`CASE WHEN transaction_type = 'customer_refund' THEN CAST(amount_usd AS DECIMAL) ELSE 0 END`),
        })
        .from(revenueTransactions);

      const totalSales = new Decimal(accountingData[0]?.totalSales || '0');
      const totalRefunds = new Decimal(accountingData[0]?.totalRefunds || '0');
      const netAccountingRevenue = totalSales.sub(totalRefunds);

      // Calculate withdrawable balance (cash collections - withdrawals - transfers - fees)
      const cashFlowData = await db
        .select({
          totalCollections: sum(sql`CASE WHEN transaction_type = 'customer_receipt' THEN CAST(amount_usd AS DECIMAL) ELSE 0 END`),
          totalWithdrawals: sum(sql`CASE WHEN transaction_type = 'withdrawal' THEN CAST(amount_usd AS DECIMAL) ELSE 0 END`),
          totalReinvestments: sum(sql`CASE WHEN transaction_type = 'reinvest_out' THEN CAST(amount_usd AS DECIMAL) ELSE 0 END`),
          totalTransferFees: sum(sql`CASE WHEN transaction_type = 'transfer_fee' THEN CAST(amount_usd AS DECIMAL) ELSE 0 END`),
        })
        .from(revenueTransactions);

      const totalCollections = new Decimal(cashFlowData[0]?.totalCollections || '0');
      const totalWithdrawals = new Decimal(cashFlowData[0]?.totalWithdrawals || '0');
      const totalReinvestments = new Decimal(cashFlowData[0]?.totalReinvestments || '0');
      const totalTransferFees = new Decimal(cashFlowData[0]?.totalTransferFees || '0');
      const netWithdrawableBalance = totalCollections.sub(totalWithdrawals).sub(totalReinvestments).sub(totalTransferFees);

      // Calculate variance and outstanding receivables
      const outstandingReceivables = await this.calculateOutstandingReceivables();
      const accountingVsWithdrawable = netAccountingRevenue.sub(netWithdrawableBalance);
      const uncollectedSales = netAccountingRevenue.sub(totalCollections);

      // Calculate current month cash flow
      const currentMonth = new Date();
      currentMonth.setDate(1); // First day of current month
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthlyData = await db
        .select({
          currentMonthCollections: sum(sql`CASE WHEN transaction_type = 'customer_receipt' AND created_at >= ${currentMonth} AND created_at < ${nextMonth} THEN CAST(amount_usd AS DECIMAL) ELSE 0 END`),
          currentMonthWithdrawals: sum(sql`CASE WHEN transaction_type = 'withdrawal' AND created_at >= ${currentMonth} AND created_at < ${nextMonth} THEN CAST(amount_usd AS DECIMAL) ELSE 0 END`),
        })
        .from(revenueTransactions);

      const currentMonthCollections = new Decimal(monthlyData[0]?.currentMonthCollections || '0');
      const currentMonthWithdrawals = new Decimal(monthlyData[0]?.currentMonthWithdrawals || '0');
      const projectedCollections = outstandingReceivables * 0.8; // Assume 80% collection rate

      return {
        accountingRevenue: {
          totalSales: totalSales.toNumber(),
          totalRefunds: totalRefunds.toNumber(),
          netAccountingRevenue: netAccountingRevenue.toNumber(),
        },
        withdrawableBalance: {
          totalCollections: totalCollections.toNumber(),
          totalWithdrawals: totalWithdrawals.toNumber(),
          totalReinvestments: totalReinvestments.toNumber(),
          totalTransferFees: totalTransferFees.toNumber(),
          netWithdrawableBalance: netWithdrawableBalance.toNumber(),
        },
        variance: {
          accountingVsWithdrawable: accountingVsWithdrawable.toNumber(),
          outstandingReceivables,
          uncollectedSales: uncollectedSales.toNumber(),
        },
        cashFlow: {
          currentMonthCollections: currentMonthCollections.toNumber(),
          currentMonthWithdrawals: currentMonthWithdrawals.toNumber(),
          projectedCollections,
        },
      };
    } catch (error) {
      console.error("Error calculating dual balance report:", error);
      throw new Error(`Failed to calculate dual balance report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process triple impact reinvestment workflow
   */
  async processTripleImpactReinvestment(
    reinvestment: TripleImpactReinvestment,
    userId: string
  ): Promise<string> {
    try {
      console.log(`Processing triple impact reinvestment: $${reinvestment.reinvestmentAmount} + fees $${reinvestment.transferFeeAmount}`);

      // Validate sufficient withdrawable balance
      const balanceReport = await this.calculateDualBalanceReport();
      const totalRequired = reinvestment.reinvestmentAmount + reinvestment.transferFeeAmount;
      
      if (balanceReport.withdrawableBalance.netWithdrawableBalance < totalRequired) {
        throw new Error(`Insufficient withdrawable balance: Required $${totalRequired}, Available $${balanceReport.withdrawableBalance.netWithdrawableBalance}`);
      }

      // Get exchange rate
      const exchangeRate = reinvestment.currency === 'USD' ? 1.0 : 
        (reinvestment.exchangeRate || await configurationService.getCentralExchangeRate());

      const reinvestmentId = `REINV-${nanoid(8)}`;

      // IMPACT 1: Revenue Ledger - Create ReinvestOut entry
      const [reinvestOutEntry] = await db
        .insert(revenueTransactions)
        .values({
          transactionNumber: `${reinvestmentId}-OUT`,
          transactionType: 'reinvest_out',
          amount: reinvestment.reinvestmentAmount.toString(),
          currency: reinvestment.currency,
          exchangeRate: exchangeRate.toString(),
          amountUsd: (reinvestment.reinvestmentAmount / exchangeRate).toString(),
          description: `${reinvestment.description} - Reinvestment to capital`,
          transactionDate: new Date(),
          createdBy: userId,
        })
        .returning();

      // IMPACT 2: Revenue Ledger - Create TransferFee entry
      const [transferFeeEntry] = await db
        .insert(revenueTransactions)
        .values({
          transactionNumber: `${reinvestmentId}-FEE`,
          transactionType: 'transfer_fee',
          amount: reinvestment.transferFeeAmount.toString(),
          currency: reinvestment.currency,
          exchangeRate: exchangeRate.toString(),
          amountUsd: (reinvestment.transferFeeAmount / exchangeRate).toString(),
          description: `Transfer fee for reinvestment ${reinvestmentId}`,
          transferMethod: reinvestment.transferDetails.transferMethod,
          bankReference: reinvestment.transferDetails.bankReference,
          transactionDate: new Date(),
          createdBy: userId,
        })
        .returning();

      // IMPACT 3: Working Capital - Create CapitalIn entry
      const [capitalEntry] = await db
        .insert(capitalEntries)
        .values({
          entryId: `${reinvestmentId}-CAP`,
          amount: (reinvestment.reinvestmentAmount / exchangeRate).toString(),
          type: 'CapitalIn',
          reference: reinvestOutEntry.id,
          description: `Revenue reinvestment: ${reinvestment.description}`,
          paymentCurrency: reinvestment.currency,
          exchangeRate: exchangeRate.toString(),
          fundingSource: 'reinvestment',
          isValidated: true,
          validatedBy: userId,
          validatedAt: new Date(),
          createdBy: userId,
        })
        .returning();

      // IMPACT 4: Operating Expenses - Record transfer fee as expense
      const [expenseEntry] = await db
        .insert(operatingExpenses)
        .values({
          expenseNumber: `${reinvestmentId}-EXP`,
          expenseType: 'bank_transfer_fees',
          amount: reinvestment.transferFeeAmount.toString(),
          currency: reinvestment.currency,
          exchangeRate: exchangeRate.toString(),
          amountUsd: (reinvestment.transferFeeAmount / exchangeRate).toString(),
          description: `Transfer fee for revenue reinvestment ${reinvestmentId}`,
          fundingSource: 'external', // Fee comes from revenue, not capital
          expenseDate: new Date(),
          createdBy: userId,
        })
        .returning();

      // Log the triple impact transaction
      await auditService.logOperation(
        {
          userId,
          userName: 'Revenue Enhancement Service',
          source: 'revenue_enhancement',
          severity: 'info',
        },
        {
          entityType: 'revenue_transactions',
          entityId: reinvestOutEntry.id,
          action: 'create',
          operationType: 'revenue_management',
          description: `Triple impact reinvestment: $${reinvestment.reinvestmentAmount} + fees $${reinvestment.transferFeeAmount}`,
          newValues: {
            reinvestmentId,
            reinvestmentAmount: reinvestment.reinvestmentAmount,
            transferFeeAmount: reinvestment.transferFeeAmount,
            impact1_revenueOut: reinvestOutEntry.id,
            impact2_transferFee: transferFeeEntry.id,
            impact3_capitalIn: capitalEntry.id,
            impact4_expenseFee: expenseEntry.id,
            exchangeRate,
            approvedBy: reinvestment.approvedBy,
          },
          businessContext: `Triple impact reinvestment with complete accounting treatment`,
        }
      );

      // Send notification
      await notificationService.createBusinessAlert({
        userId,
        alertType: 'business_alert',
        alertCategory: 'financial_health',
        priority: 'medium',
        title: 'Revenue Reinvestment Completed',
        message: `Successfully reinvested $${reinvestment.reinvestmentAmount} to working capital (fees: $${reinvestment.transferFeeAmount})`,
        entityType: 'revenue_transactions',
        entityId: reinvestOutEntry.id,
        actionUrl: `/revenue/reinvestments/${reinvestmentId}`,
        templateData: {
          reinvestmentAmount: reinvestment.reinvestmentAmount.toString(),
          transferFeeAmount: reinvestment.transferFeeAmount.toString(),
          actionUrl: `/revenue/reinvestments/${reinvestmentId}`,
        },
      });

      return reinvestmentId;
    } catch (error) {
      console.error("Error processing triple impact reinvestment:", error);
      throw new Error(`Failed to process triple impact reinvestment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rebalance revenue ledger and withdrawable balance
   */
  async rebalanceRevenueLedger(userId: string): Promise<RevenueRebalancing> {
    try {
      console.log("Rebalancing revenue ledger and withdrawable balance");

      const balanceReport = await this.calculateDualBalanceReport();
      const discrepancy = balanceReport.variance.accountingVsWithdrawable;

      if (Math.abs(discrepancy) < 0.01) {
        // No rebalancing needed
        return {
          totalRevenueLedgerBalance: balanceReport.accountingRevenue.netAccountingRevenue,
          totalWithdrawableBalance: balanceReport.withdrawableBalance.netWithdrawableBalance,
          discrepancy: 0,
          rebalancingEntries: [],
          finalBalances: {
            revenueLedger: balanceReport.accountingRevenue.netAccountingRevenue,
            withdrawable: balanceReport.withdrawableBalance.netWithdrawableBalance,
          },
        };
      }

      const rebalancingEntries = [];

      if (discrepancy > 0) {
        // Accounting revenue > Withdrawable balance (likely uncollected receivables)
        const adjustmentId = `ADJ-${nanoid(8)}`;
        
        // Create reclass entry to adjust withdrawable balance
        await db
          .insert(revenueTransactions)
          .values({
            transactionNumber: adjustmentId,
            transactionType: 'reclass',
            amount: Math.abs(discrepancy).toString(),
            currency: 'USD',
            exchangeRate: '1.0000',
            amountUsd: Math.abs(discrepancy).toString(),
            description: 'Revenue ledger rebalancing - Outstanding receivables adjustment',
            transactionDate: new Date(),
            createdBy: userId,
          });

        rebalancingEntries.push({
          entryType: 'receivables_adjustment',
          amount: Math.abs(discrepancy),
          reason: 'Outstanding receivables not yet collected',
        });
      } else {
        // Withdrawable balance > Accounting revenue (likely unrecorded sales)
        const adjustmentId = `ADJ-${nanoid(8)}`;
        
        // Create reverse reclass entry
        await db
          .insert(revenueTransactions)
          .values({
            transactionNumber: adjustmentId,
            transactionType: 'reverse',
            amount: Math.abs(discrepancy).toString(),
            currency: 'USD',
            exchangeRate: '1.0000',
            amountUsd: Math.abs(discrepancy).toString(),
            description: 'Revenue ledger rebalancing - Unrecorded sales adjustment',
            transactionDate: new Date(),
            createdBy: userId,
          });

        rebalancingEntries.push({
          entryType: 'unrecorded_sales_adjustment',
          amount: Math.abs(discrepancy),
          reason: 'Cash collected for unrecorded sales',
        });
      }

      // Calculate final balances after rebalancing
      const finalRevenueLedger = balanceReport.accountingRevenue.netAccountingRevenue;
      const finalWithdrawable = balanceReport.withdrawableBalance.netWithdrawableBalance + 
        (discrepancy > 0 ? discrepancy : -Math.abs(discrepancy));

      // Log the rebalancing
      await auditService.logOperation(
        {
          userId,
          userName: 'Revenue Enhancement Service',
          source: 'revenue_enhancement',
          severity: 'info',
        },
        {
          entityType: 'revenue_transactions',
          entityId: 'rebalancing',
          action: 'create',
          operationType: 'revenue_rebalancing',
          description: `Revenue ledger rebalancing: ${Math.abs(discrepancy).toFixed(2)} USD`,
          newValues: {
            originalDiscrepancy: discrepancy,
            rebalancingEntries,
            finalRevenueLedger,
            finalWithdrawable,
          },
          businessContext: `Revenue ledger rebalancing to align accounting and cash positions`,
        }
      );

      return {
        totalRevenueLedgerBalance: balanceReport.accountingRevenue.netAccountingRevenue,
        totalWithdrawableBalance: balanceReport.withdrawableBalance.netWithdrawableBalance,
        discrepancy,
        rebalancingEntries,
        finalBalances: {
          revenueLedger: finalRevenueLedger,
          withdrawable: finalWithdrawable,
        },
      };
    } catch (error) {
      console.error("Error rebalancing revenue ledger:", error);
      throw new Error(`Failed to rebalance revenue ledger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private async calculateOutstandingReceivables(): Promise<number> {
    try {
      const receivablesData = await db
        .select({
          totalOutstanding: sum(sql`CAST(${salesOrders.balanceDue} AS DECIMAL)`),
        })
        .from(salesOrders)
        .where(and(
          eq(salesOrders.status, 'confirmed'),
          gte(sql`CAST(${salesOrders.balanceDue} AS DECIMAL)`, 0.01)
        ));

      return new Decimal(receivablesData[0]?.totalOutstanding || '0').toNumber();
    } catch (error) {
      console.error("Error calculating outstanding receivables:", error);
      return 0;
    }
  }
}

// Export singleton instance
export const revenueEnhancementService = RevenueEnhancementService.getInstance();