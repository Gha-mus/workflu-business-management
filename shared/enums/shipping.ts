// Shipping and logistics related enums

export const ShipmentMethod = ['air', 'sea', 'land', 'rail', 'multimodal'] as const;
export type ShipmentMethod = typeof ShipmentMethod[number];

export const ShipmentStatus = ['pending', 'in_transit', 'delivered', 'cancelled', 'delayed'] as const;
export type ShipmentStatus = typeof ShipmentStatus[number];

export const CostType = ['broker', 'delivery', 'customs', 'inspection', 'handling', 'other'] as const;
export type CostType = typeof CostType[number];

export const DeliveryTrackingStatus = ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'] as const;
export type DeliveryTrackingStatus = typeof DeliveryTrackingStatus[number];

export const SettlementType = ['accept', 'claim', 'return', 'discount'] as const;
export type SettlementType = typeof SettlementType[number];

// Enum constants for use in code
export const SETTLEMENT_TYPE = {
  ACCEPT: 'accept' as const,
  CLAIM: 'claim' as const,
  RETURN: 'return' as const,
  DISCOUNT: 'discount' as const
} as const;