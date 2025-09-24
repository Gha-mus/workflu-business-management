import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core";
import { orders } from "./purchases";
import { warehouseStock } from "./warehouse";

// ===== SHIPPING ENUMS =====
export const shipmentMethodEnum = pgEnum('shipment_method', ['air', 'sea', 'land', 'rail', 'multimodal']);
export const shipmentStatusEnum = pgEnum('shipment_status', ['pending', 'in_transit', 'delivered', 'cancelled', 'delayed']);

// ===== SHIPPING TABLES =====

// Carriers table
export const carriers = pgTable("carriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  contactPerson: varchar("contact_person"),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  serviceTypes: text("service_types").array(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  isPreferred: boolean("is_preferred").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipments table
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentNumber: varchar("shipment_number").notNull().unique(),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  carrierId: varchar("carrier_id").notNull().references(() => carriers.id),
  method: shipmentMethodEnum("method").notNull(),
  status: shipmentStatusEnum("status").notNull().default('pending'),
  originAddress: text("origin_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  estimatedDepartureDate: timestamp("estimated_departure_date"),
  actualDepartureDate: timestamp("actual_departure_date"),
  estimatedArrivalDate: timestamp("estimated_arrival_date"),
  actualArrivalDate: timestamp("actual_arrival_date"),
  trackingNumber: varchar("tracking_number"),
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }).notNull(),
  totalVolume: decimal("total_volume", { precision: 10, scale: 2 }),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  totalValueUsd: decimal("total_value_usd", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipment items table (links shipments to warehouse stock)
export const shipmentItems = pgTable("shipment_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  warehouseStockId: varchar("warehouse_stock_id").notNull().references(() => warehouseStock.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  packingDetails: text("packing_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipment legs table - Multi-leg shipping support
export const shipmentLegs = pgTable("shipment_legs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  legNumber: integer("leg_number").notNull(),
  carrierId: varchar("carrier_id").notNull().references(() => carriers.id),
  method: shipmentMethodEnum("method").notNull(),
  status: shipmentStatusEnum("status").notNull().default('pending'),
  
  // Weight details
  netWeightKg: decimal("net_weight_kg", { precision: 10, scale: 2 }).notNull(),
  grossWeightKg: decimal("gross_weight_kg", { precision: 10, scale: 2 }).notNull(),
  tareWeightKg: decimal("tare_weight_kg", { precision: 10, scale: 2 }).notNull(),
  packageCount: integer("package_count").notNull(),
  
  // Route details
  originPort: varchar("origin_port").notNull(),
  destinationPort: varchar("destination_port").notNull(),
  departureDate: timestamp("departure_date"),
  arrivalDate: timestamp("arrival_date"),
  transitDays: integer("transit_days"),
  
  // Documentation
  vesselVoyage: varchar("vessel_voyage"),
  containerNumber: varchar("container_number"),
  sealNumber: varchar("seal_number"),
  billOfLadingNumber: varchar("bill_of_lading_number"),
  
  // Commission and cost tracking
  commissionRatePercent: decimal("commission_rate_percent", { precision: 5, scale: 2 }),
  commissionAmountUsd: decimal("commission_amount_usd", { precision: 12, scale: 2 }),
  freightCostUsd: decimal("freight_cost_usd", { precision: 12, scale: 2 }),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipping costs table
export const shippingCosts = pgTable("shipping_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  costType: varchar("cost_type").notNull(), // freight, insurance, customs, handling, other
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  paymentMethod: varchar("payment_method"),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  fundingSource: varchar("funding_source").notNull(),
  paidDate: timestamp("paid_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery tracking table
export const deliveryTracking = pgTable("delivery_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  status: varchar("status").notNull(),
  location: varchar("location"),
  description: text("description"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isCustomerNotified: boolean("is_customer_notified").notNull().default(false),
  proofOfDelivery: text("proof_of_delivery"),
  exceptionDetails: text("exception_details"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Arrival costs table - Stage 4 landed cost calculations
export const arrivalCosts = pgTable("arrival_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  costType: varchar("cost_type").notNull(), // unloading, storage, inspection, documentation, local_transport
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  paymentMethod: varchar("payment_method"),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  fundingSource: varchar("funding_source").notNull(),
  paidDate: timestamp("paid_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== SHIPPING RELATIONS =====
export const carriersRelations = relations(carriers, ({ many }) => ({
  shipments: many(shipments),
  shipmentLegs: many(shipmentLegs),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
  carrier: one(carriers, {
    fields: [shipments.carrierId],
    references: [carriers.id],
  }),
  createdBy: one(users, {
    fields: [shipments.createdBy],
    references: [users.id],
  }),
  items: many(shipmentItems),
  legs: many(shipmentLegs),
  costs: many(shippingCosts),
  tracking: many(deliveryTracking),
  arrivalCosts: many(arrivalCosts),
}));

export const shipmentItemsRelations = relations(shipmentItems, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentItems.shipmentId],
    references: [shipments.id],
  }),
  warehouseStock: one(warehouseStock, {
    fields: [shipmentItems.warehouseStockId],
    references: [warehouseStock.id],
  }),
}));

export const shipmentLegsRelations = relations(shipmentLegs, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentLegs.shipmentId],
    references: [shipments.id],
  }),
  carrier: one(carriers, {
    fields: [shipmentLegs.carrierId],
    references: [carriers.id],
  }),
}));

// ===== SHIPPING TYPES =====

// Carrier types
export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;

// Shipment types
export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;

// Shipment item types
export const insertShipmentItemSchema = createInsertSchema(shipmentItems).omit({
  id: true,
  createdAt: true,
});

export type ShipmentItem = typeof shipmentItems.$inferSelect;
export type InsertShipmentItem = z.infer<typeof insertShipmentItemSchema>;

// Shipment leg types
export const insertShipmentLegSchema = createInsertSchema(shipmentLegs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ShipmentLeg = typeof shipmentLegs.$inferSelect;
export type InsertShipmentLeg = z.infer<typeof insertShipmentLegSchema>;

// Shipping cost types
export const insertShippingCostSchema = createInsertSchema(shippingCosts).omit({
  id: true,
  createdAt: true,
});

export type ShippingCost = typeof shippingCosts.$inferSelect;
export type InsertShippingCost = z.infer<typeof insertShippingCostSchema>;

// Delivery tracking types
export const insertDeliveryTrackingSchema = createInsertSchema(deliveryTracking).omit({
  id: true,
  createdAt: true,
});

export type DeliveryTracking = typeof deliveryTracking.$inferSelect;
export type InsertDeliveryTracking = z.infer<typeof insertDeliveryTrackingSchema>;

// Arrival cost types
export const insertArrivalCostSchema = createInsertSchema(arrivalCosts).omit({
  id: true,
  createdAt: true,
});

export type ArrivalCost = typeof arrivalCosts.$inferSelect;
export type InsertArrivalCost = z.infer<typeof insertArrivalCostSchema>;