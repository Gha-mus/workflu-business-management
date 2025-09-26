/**
 * Shipping and delivery enums and constants
 */

export enum DeliveryTrackingStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  DELAYED = 'delayed',
  FAILED = 'failed'
}

export const DELIVERY_TRACKING_STATUS = DeliveryTrackingStatus;

export const deliveryStatusLabels: Record<DeliveryTrackingStatus, string> = {
  [DeliveryTrackingStatus.PENDING]: 'Pending',
  [DeliveryTrackingStatus.PICKED_UP]: 'Picked Up',
  [DeliveryTrackingStatus.IN_TRANSIT]: 'In Transit',
  [DeliveryTrackingStatus.DELIVERED]: 'Delivered',
  [DeliveryTrackingStatus.DELAYED]: 'Delayed',
  [DeliveryTrackingStatus.FAILED]: 'Failed'
};

export const deliveryStatusOptions = Object.entries(deliveryStatusLabels).map(([value, label]) => ({
  value,
  label
}));

export const deliveryStatusColors: Record<DeliveryTrackingStatus, string> = {
  [DeliveryTrackingStatus.PENDING]: 'orange',
  [DeliveryTrackingStatus.PICKED_UP]: 'blue',
  [DeliveryTrackingStatus.IN_TRANSIT]: 'purple',
  [DeliveryTrackingStatus.DELIVERED]: 'green',
  [DeliveryTrackingStatus.DELAYED]: 'yellow',
  [DeliveryTrackingStatus.FAILED]: 'red'
};