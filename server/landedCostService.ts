/**
 * Stage 4: Landed Cost Calculation Service
 * 
 * Implements comprehensive landed cost calculation per workflow_reference.json lines 640-645:
 * - landed_cost_total = purchase_cost + shipping_legs + arrival_costs
 * - avg_landed_cost_per_kg = landed_cost_total ÷ clean_weight_received
 * - 8kg_carton_cost = avg_landed_cost_per_kg × 8
 */

import { db } from "./db";
import { 
  purchases, 
  warehouseStock, 
  shipments, 
  shipmentLegs, 
  arrivalCosts, 
  shipmentInspections,
  supplyConsumption,
  type ShipmentLeg,
  type ArrivalCost
} from "@shared/schema";
import { eq, and, sum, sql } from "drizzle-orm";
import Decimal from "decimal.js";

export interface LandedCostBreakdown {
  orderId: string;
  shipmentId?: string;
  
  // Purchase cost (redistributed after filtering per Stage 3)
  purchaseCostUsd: number;
  purchaseCostPerKg: number;
  
  // Multi-leg shipping costs per workflow_reference.json lines 625-629
  shippingLegs: Array<{
    legNumber: number;
    carrierId: string;
    legBaseCost: number;
    transferCommission: number;
    legTotalCost: number;
  }>;
  totalShippingCostUsd: number;
  
  // Arrival costs per workflow_reference.json lines 631-632
  arrivalCosts: Array<{
    costType: string;
    amount: number;
    description: string;
  }>;
  totalArrivalCostUsd: number;
  
  // Packing/supplies costs from Stage 3 integration
  packingCostUsd: number;
  
  // Final calculations per workflow_reference.json lines 643-645
  totalLandedCostUsd: number; // Purchase + shipping + arrival + packing
  cleanWeightReceivedKg: number; // After inspection
  avgLandedCostPerKg: number; // Total ÷ clean weight
  costPer8kgCarton: number; // Avg × 8
  
  // Loss tracking per workflow_reference.json line 646
  damagedWeightKg: number;
  damagedLossUsd: number; // Avg cost × damaged weight
}

export interface LandedCostCalculationRequest {
  orderId?: string;
  shipmentId?: string;
  purchaseId?: string;
}

class LandedCostService {
  private static instance: LandedCostService;
  
  private constructor() {
    console.log("LandedCostService initialized for Stage 4 landed cost calculations");
  }
  
  public static getInstance(): LandedCostService {
    if (!LandedCostService.instance) {
      LandedCostService.instance = new LandedCostService();
    }
    return LandedCostService.instance;
  }
  
  /**
   * Calculate comprehensive landed cost for an order or shipment
   */
  async calculateLandedCost(request: LandedCostCalculationRequest): Promise<LandedCostBreakdown[]> {
    try {
      let results: LandedCostBreakdown[] = [];
      
      if (request.shipmentId) {
        // Calculate for specific shipment
        const breakdown = await this.calculateForShipment(request.shipmentId);
        if (breakdown) results.push(breakdown);
      } else if (request.orderId) {
        // Calculate for all shipments in order
        const shipmentIds = await this.getShipmentsByOrder(request.orderId);
        for (const shipmentId of shipmentIds) {
          const shipmentBreakdown = await this.calculateForShipment(shipmentId);
          if (shipmentBreakdown) results.push(shipmentBreakdown);
        }
      } else if (request.purchaseId) {
        // Calculate for all shipments from purchase
        const shipmentIds = await this.getShipmentsByPurchase(request.purchaseId);
        for (const shipmentId of shipmentIds) {
          const shipmentBreakdown = await this.calculateForShipment(shipmentId);
          if (shipmentBreakdown) results.push(shipmentBreakdown);
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error calculating landed cost:", error);
      throw new Error(`Failed to calculate landed cost: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Calculate landed cost for a specific shipment
   */
  private async calculateForShipment(shipmentId: string): Promise<LandedCostBreakdown | null> {
    try {
      // Get shipment details
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId));
      
      if (!shipment) return null;
      
      // Get purchase cost (after Stage 3 filtering redistribution)
      const [stock] = await db
        .select()
        .from(warehouseStock)
        .where(and(
          eq(warehouseStock.orderId, shipment.orderId),
          eq(warehouseStock.warehouse, 'FIRST') // Pre-shipping warehouse
        ));
      
      const [purchase] = await db
        .select()
        .from(purchases)
        .where(eq(purchases.orderId, shipment.orderId));
      
      if (!stock || !purchase) return null;
      
      // Calculate purchase cost for shipped quantity
      const shippedWeight = new Decimal(shipment.totalWeight);
      const purchaseCostPerKg = new Decimal(stock.unitCostCleanUsd || '0');
      const purchaseCostTotal = purchaseCostPerKg.mul(shippedWeight);
      
      // Get multi-leg shipping costs per workflow_reference.json lines 625-629
      const legs = await db
        .select()
        .from(shipmentLegs)
        .where(eq(shipmentLegs.shipmentId, shipmentId))
        .orderBy(shipmentLegs.legNumber);
      
      let totalShippingCost = new Decimal('0');
      const shippingLegsBreakdown = legs.map((leg: ShipmentLeg) => {
        const legCost = new Decimal(leg.legTotalCost);
        totalShippingCost = totalShippingCost.add(legCost);
        
        return {
          legNumber: leg.legNumber,
          carrierId: leg.carrierId,
          legBaseCost: new Decimal(leg.legBaseCost).toNumber(),
          transferCommission: new Decimal(leg.transferCommissionUsd || '0').toNumber(),
          legTotalCost: new Decimal(leg.legTotalCost).toNumber()
        };
      });
      
      // Get arrival costs per workflow_reference.json lines 631-632
      const arrivalCostRecords = await db
        .select()
        .from(arrivalCosts)
        .where(eq(arrivalCosts.shipmentId, shipmentId));
      
      let totalArrivalCost = new Decimal('0');
      const arrivalCostsBreakdown = arrivalCostRecords.map((cost: ArrivalCost) => {
        const costAmount = new Decimal(cost.amountUsd);
        totalArrivalCost = totalArrivalCost.add(costAmount);
        
        return {
          costType: cost.costType,
          amount: new Decimal(cost.amountUsd).toNumber(),
          description: cost.description
        };
      });
      
      // Get packing costs from Stage 3 supplies consumption
      const packingCost = await this.calculatePackingCosts(shipment.orderId);
      
      // Get inspection results for final weight calculations
      const [inspection] = await db
        .select()
        .from(shipmentInspections)
        .where(eq(shipmentInspections.shipmentId, shipmentId));
      
      const cleanWeight = inspection ? new Decimal(inspection.cleanWeightKg) : shippedWeight;
      const damagedWeight = inspection ? new Decimal(inspection.damagedWeightKg) : new Decimal('0');
      
      // Final landed cost calculation per workflow_reference.json lines 643-645
      const totalLandedCost = purchaseCostTotal
        .add(totalShippingCost)
        .add(totalArrivalCost)
        .add(packingCost);
      
      const avgLandedCostPerKg = cleanWeight.gt(0) 
        ? totalLandedCost.div(cleanWeight)
        : new Decimal('0');
      
      const costPer8kgCarton = avgLandedCostPerKg.mul(8);
      const damagedLoss = avgLandedCostPerKg.mul(damagedWeight);
      
      return {
        orderId: shipment.orderId,
        shipmentId: shipment.id,
        
        // Purchase costs
        purchaseCostUsd: purchaseCostTotal.toNumber(),
        purchaseCostPerKg: purchaseCostPerKg.toNumber(),
        
        // Shipping breakdown
        shippingLegs: shippingLegsBreakdown,
        totalShippingCostUsd: totalShippingCost.toNumber(),
        
        // Arrival costs
        arrivalCosts: arrivalCostsBreakdown,
        totalArrivalCostUsd: totalArrivalCost.toNumber(),
        
        // Packing costs
        packingCostUsd: packingCost.toNumber(),
        
        // Final calculations per workflow_reference.json
        totalLandedCostUsd: totalLandedCost.toNumber(),
        cleanWeightReceivedKg: cleanWeight.toNumber(),
        avgLandedCostPerKg: avgLandedCostPerKg.toNumber(),
        costPer8kgCarton: costPer8kgCarton.toNumber(),
        
        // Loss tracking
        damagedWeightKg: damagedWeight.toNumber(),
        damagedLossUsd: damagedLoss.toNumber()
      };
      
    } catch (error) {
      console.error(`Error calculating landed cost for shipment ${shipmentId}:`, error);
      return null;
    }
  }
  
  /**
   * Calculate packing costs from supplies consumption (Stage 3 integration)
   */
  private async calculatePackingCosts(orderId: string): Promise<Decimal> {
    try {
      const [result] = await db
        .select({
          totalCost: sum(supplyConsumption.totalCostUsd)
        })
        .from(supplyConsumption)
        .where(eq(supplyConsumption.orderId, orderId));
      
      return new Decimal(result?.totalCost || '0');
    } catch (error) {
      console.error(`Error calculating packing costs for order ${orderId}:`, error);
      return new Decimal('0');
    }
  }
  
  /**
   * Get all shipments for an order
   */
  private async getShipmentsByOrder(orderId: string): Promise<string[]> {
    const results = await db
      .select({ id: shipments.id })
      .from(shipments)
      .where(eq(shipments.orderId, orderId));
    
    return results.map((r: { id: string }) => r.id);
  }
  
  /**
   * Get all shipments for a purchase (via order)
   */
  private async getShipmentsByPurchase(purchaseId: string): Promise<string[]> {
    const [purchase] = await db
      .select({ orderId: purchases.orderId })
      .from(purchases)
      .where(eq(purchases.id, purchaseId));
    
    if (!purchase) return [];
    
    return this.getShipmentsByOrder(purchase.orderId);
  }
  
  /**
   * Get landed cost summary for multiple orders/shipments
   */
  async getLandedCostSummary(orderIds: string[]): Promise<{
    totalOrders: number;
    totalLandedCostUsd: number;
    avgLandedCostPerKg: number;
    avgCostPer8kgCarton: number;
    totalDamagedLossUsd: number;
  }> {
    try {
      let totalLandedCost = new Decimal('0');
      let totalCleanWeight = new Decimal('0');
      let totalDamagedLoss = new Decimal('0');
      let processedOrders = 0;
      
      for (const orderId of orderIds) {
        const breakdowns = await this.calculateLandedCost({ orderId });
        
        for (const breakdown of breakdowns) {
          totalLandedCost = totalLandedCost.add(breakdown.totalLandedCostUsd);
          totalCleanWeight = totalCleanWeight.add(breakdown.cleanWeightReceivedKg);
          totalDamagedLoss = totalDamagedLoss.add(breakdown.damagedLossUsd);
          processedOrders++;
        }
      }
      
      const avgLandedCostPerKg = totalCleanWeight.gt(0) 
        ? totalLandedCost.div(totalCleanWeight)
        : new Decimal('0');
      
      return {
        totalOrders: processedOrders,
        totalLandedCostUsd: totalLandedCost.toNumber(),
        avgLandedCostPerKg: avgLandedCostPerKg.toNumber(),
        avgCostPer8kgCarton: avgLandedCostPerKg.mul(8).toNumber(),
        totalDamagedLossUsd: totalDamagedLoss.toNumber()
      };
      
    } catch (error) {
      console.error("Error calculating landed cost summary:", error);
      throw new Error(`Failed to calculate landed cost summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const landedCostService = LandedCostService.getInstance();