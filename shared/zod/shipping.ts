import { z } from 'zod';
import { ShipmentMethod, ShipmentStatus, CostType } from '../enums/shipping';

export const zShipmentMethod = z.enum(ShipmentMethod);
export const zShipmentStatus = z.enum(ShipmentStatus);
export const zCostType = z.enum(CostType);