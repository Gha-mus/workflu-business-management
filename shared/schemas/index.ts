// Modular schema re-exports to eliminate monolithic imports
// Each domain exports only what it needs to prevent TypeScript inference failures

// ===== CORE EXPORTS =====
export {
  // Tables
  sessions,
  users,
  userWarehouseScopes,
  
  // Enums
  userRoleEnum,
  authProviderEnum,
  
  // Schemas
  userRoleUpdateSchema,
  insertUserSchema,
  insertUserWarehouseScopeSchema,
  
  // Types
  type User,
  type InsertUser,
  type UpsertUser,
  type UserWarehouseScope,
  type InsertUserWarehouseScope,
  
  // Relations
  usersRelations,
  userWarehouseScopesRelations,
} from "./core";

// ===== PURCHASES EXPORTS =====
export {
  // Tables
  suppliers,
  supplierQualityAssessments,
  orders,
  purchases,
  purchasePayments,
  
  // Enums
  qualityGradeEnum,
  paymentMethodEnum,
  fundingSourceEnum,
  purchaseStatusEnum,
  
  // Types
  type Supplier,
  type InsertSupplier,
  type SupplierQualityAssessment,
  type InsertSupplierQualityAssessment,
  type Order,
  type InsertOrder,
  type Purchase,
  type InsertPurchase,
  type PurchasePayment,
  type InsertPurchasePayment,
  
  // Relations
  suppliersRelations,
  supplierQualityAssessmentsRelations,
  ordersRelations,
  purchasesRelations,
  purchasePaymentsRelations,
} from "./purchases";

// ===== CAPITAL EXPORTS =====
export {
  // Tables
  capitalEntries,
  financialMetrics,
  
  // Enums
  capitalEntryTypeEnum,
  
  // Types
  type CapitalEntry,
  type InsertCapitalEntry,
  type FinancialMetric,
  type InsertFinancialMetric,
  
  // Relations
  capitalEntriesRelations,
} from "./capital";

// ===== WAREHOUSE EXPORTS =====
export {
  // Tables
  warehouseStock,
  filterRecords,
  qualityStandards,
  warehouseBatches,
  qualityInspections,
  inventoryConsumption,
  processingOperations,
  stockTransfers,
  inventoryAdjustments,
  
  // Enums
  warehouseStockStatusEnum,
  
  // Types
  type WarehouseStock,
  type InsertWarehouseStock,
  type FilterRecord,
  type InsertFilterRecord,
  type QualityStandard,
  type InsertQualityStandard,
  type WarehouseBatch,
  type InsertWarehouseBatch,
  type QualityInspection,
  type InsertQualityInspection,
  type InventoryConsumption,
  type InsertInventoryConsumption,
  type ProcessingOperation,
  type InsertProcessingOperation,
  type StockTransfer,
  type InsertStockTransfer,
  type InventoryAdjustment,
  type InsertInventoryAdjustment,
  
  // Relations
  warehouseStockRelations,
  filterRecordsRelations,
  qualityInspectionsRelations,
} from "./warehouse";

// ===== SHIPPING EXPORTS =====
export {
  // Tables
  carriers,
  shipments,
  shipmentItems,
  shipmentLegs,
  shippingCosts,
  deliveryTracking,
  arrivalCosts,
  
  // Enums
  shipmentMethodEnum,
  shipmentStatusEnum,
  
  // Types
  type Carrier,
  type InsertCarrier,
  type Shipment,
  type InsertShipment,
  type ShipmentItem,
  type InsertShipmentItem,
  type ShipmentLeg,
  type InsertShipmentLeg,
  type ShippingCost,
  type InsertShippingCost,
  type DeliveryTracking,
  type InsertDeliveryTracking,
  type ArrivalCost,
  type InsertArrivalCost,
  
  // Relations
  carriersRelations,
  shipmentsRelations,
  shipmentItemsRelations,
  shipmentLegsRelations,
} from "./shipping";

// ===== APPROVALS EXPORTS =====
export {
  // Tables
  approvalChains,
  approvalRequests,
  approvalGuards,
  auditLogs,
  
  // Enums
  approvalStatusEnum,
  approvalOperationTypeEnum,
  auditActionEnum,
  permissionScopeEnum,
  
  // Types
  type ApprovalChain,
  type InsertApprovalChain,
  type ApprovalRequest,
  type InsertApprovalRequest,
  type ApprovalGuard,
  type InsertApprovalGuard,
  type AuditLog,
  type InsertAuditLog,
  
  // Relations
  approvalChainsRelations,
  approvalRequestsRelations,
  approvalGuardsRelations,
  auditLogsRelations,
} from "./approvals";

// ===== SETTINGS EXPORTS =====
export {
  // Tables
  settings,
  settingsHistory,
  numberingSchemes,
  configurationSnapshots,
  
  // Types
  type Setting,
  type InsertSetting,
  type SettingsHistory,
  type InsertSettingsHistory,
  type NumberingScheme,
  type InsertNumberingScheme,
  type ConfigurationSnapshot,
  type InsertConfigurationSnapshot,
  
  // Relations
  settingsRelations,
  settingsHistoryRelations,
  configurationSnapshotsRelations,
} from "./settings";