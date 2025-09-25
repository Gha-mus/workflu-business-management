// Shipping and logistics related enums

export const ShipmentMethod = ['air', 'sea', 'land', 'rail', 'multimodal'] as const;
export type ShipmentMethod = typeof ShipmentMethod[number];

export const ShipmentStatus = ['pending', 'in_transit', 'delivered', 'cancelled', 'delayed'] as const;
export type ShipmentStatus = typeof ShipmentStatus[number];

export const CostType = ['broker', 'delivery', 'customs', 'inspection', 'handling', 'other'] as const;
export type CostType = typeof CostType[number];

export const DeliveryTrackingStatus = ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'] as const;
export type DeliveryTrackingStatus = typeof DeliveryTrackingStatus[number];