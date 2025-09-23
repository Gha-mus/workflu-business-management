/**
 * Measurement Units Foundation for WorkFlu Coffee Trading System
 * 
 * Base Rules:
 * - All database storage in kilograms (kg) 
 * - C20 = 20kg carton (shipping unit)
 * - C8 = 8kg carton (sales unit)
 * - Conversions: 1 C20 = 2.5 C8, 1 C8 = 0.4 C20
 */

import { Decimal } from 'decimal.js';

// Carton types enum
export type CartonType = 'C20' | 'C8';

// Constants for carton weights
export const CARTON_WEIGHTS = {
  C20: 20, // kg per C20 carton
  C8: 8,   // kg per C8 carton
} as const;

// Conversion factors
export const CARTON_CONVERSIONS = {
  C20_TO_C8: 2.5,  // 1 C20 = 2.5 C8
  C8_TO_C20: 0.4,  // 1 C8 = 0.4 C20
} as const;

/**
 * Convert cartons to kilograms
 */
export function cartonsToKg(cartonCount: number, cartonType: CartonType): number {
  const weight = CARTON_WEIGHTS[cartonType];
  return new Decimal(cartonCount).mul(weight).toNumber();
}

/**
 * Convert kilograms to cartons (may return fractional cartons)
 */
export function kgToCartons(kg: number, cartonType: CartonType): number {
  const weight = CARTON_WEIGHTS[cartonType];
  return new Decimal(kg).div(weight).toNumber();
}

/**
 * Convert C20 cartons to C8 cartons
 */
export function c20ToC8(c20Count: number): number {
  return new Decimal(c20Count).mul(CARTON_CONVERSIONS.C20_TO_C8).toNumber();
}

/**
 * Convert C8 cartons to C20 cartons
 */
export function c8ToC20(c8Count: number): number {
  return new Decimal(c8Count).mul(CARTON_CONVERSIONS.C8_TO_C20).toNumber();
}

/**
 * Calculate equivalent cartons for display purposes
 */
export function calculateCartonEquivalents(kg: number): {
  kg: number;
  c20Equivalent: number;
  c8Equivalent: number;
} {
  return {
    kg,
    c20Equivalent: kgToCartons(kg, 'C20'),
    c8Equivalent: kgToCartons(kg, 'C8'),
  };
}

/**
 * Format carton display with proper precision
 */
export function formatCartonDisplay(cartonCount: number, cartonType: CartonType): string {
  const rounded = Math.round(cartonCount * 100) / 100; // Round to 2 decimal places
  return `${rounded} ${cartonType}`;
}

/**
 * Validate carton input (must be positive integer for actual cartons)
 */
export function validateCartonInput(cartonCount: number, allowDecimals = false): boolean {
  if (cartonCount < 0) return false;
  if (!allowDecimals && !Number.isInteger(cartonCount)) return false;
  return true;
}

/**
 * Validate kg input (must be positive, up to 3 decimal places)
 */
export function validateKgInput(kg: number): boolean {
  if (kg < 0) return false;
  // Check if more than 3 decimal places
  const decimal = new Decimal(kg);
  const rounded = decimal.toDecimalPlaces(3);
  return decimal.equals(rounded);
}

/**
 * Round kg to 3 decimal places (database precision)
 */
export function roundKg(kg: number): number {
  return new Decimal(kg).toDecimalPlaces(3).toNumber();
}

/**
 * Calculate pricing conversions
 */
export function calculatePricing(pricePerUnit: number, unitType: 'kg' | 'C8' | 'C20', targetUnit: 'kg' | 'C8' | 'C20'): number {
  if (unitType === targetUnit) return pricePerUnit;
  
  const price = new Decimal(pricePerUnit);
  
  // Convert to price per kg first
  let pricePerKg: Decimal;
  switch (unitType) {
    case 'kg':
      pricePerKg = price;
      break;
    case 'C8':
      pricePerKg = price.div(CARTON_WEIGHTS.C8);
      break;
    case 'C20':
      pricePerKg = price.div(CARTON_WEIGHTS.C20);
      break;
  }
  
  // Convert from price per kg to target unit
  switch (targetUnit) {
    case 'kg':
      return pricePerKg.toNumber();
    case 'C8':
      return pricePerKg.mul(CARTON_WEIGHTS.C8).toNumber();
    case 'C20':
      return pricePerKg.mul(CARTON_WEIGHTS.C20).toNumber();
  }
}

/**
 * Summary calculation for transactions
 */
export interface TransactionSummary {
  inputCartons: number;
  inputCartonType: CartonType;
  totalKg: number;
  equivalentC20: number;
  equivalentC8: number;
  pricePerKg?: number;
  pricePerC8?: number;
  pricePerC20?: number;
  totalAmount?: number;
}

export function calculateTransactionSummary(
  cartonCount: number,
  cartonType: CartonType,
  pricePerUnit?: number,
  priceUnitType?: 'kg' | 'C8' | 'C20'
): TransactionSummary {
  const totalKg = cartonsToKg(cartonCount, cartonType);
  const equivalents = calculateCartonEquivalents(totalKg);
  
  const summary: TransactionSummary = {
    inputCartons: cartonCount,
    inputCartonType: cartonType,
    totalKg: roundKg(totalKg),
    equivalentC20: equivalents.c20Equivalent,
    equivalentC8: equivalents.c8Equivalent,
  };
  
  if (pricePerUnit && priceUnitType) {
    summary.pricePerKg = calculatePricing(pricePerUnit, priceUnitType, 'kg');
    summary.pricePerC8 = calculatePricing(pricePerUnit, priceUnitType, 'C8');
    summary.pricePerC20 = calculatePricing(pricePerUnit, priceUnitType, 'C20');
    summary.totalAmount = new Decimal(summary.pricePerKg).mul(totalKg).toNumber();
  }
  
  return summary;
}

/**
 * Stock availability check
 */
export function checkStockAvailability(
  availableKg: number,
  requestedCartons: number,
  cartonType: CartonType
): {
  isAvailable: boolean;
  availableCartons: number;
  shortfallKg: number;
  shortfallCartons: number;
} {
  const requestedKg = cartonsToKg(requestedCartons, cartonType);
  const availableCartons = kgToCartons(availableKg, cartonType);
  
  const isAvailable = availableKg >= requestedKg;
  const shortfallKg = isAvailable ? 0 : requestedKg - availableKg;
  const shortfallCartons = isAvailable ? 0 : requestedCartons - availableCartons;
  
  return {
    isAvailable,
    availableCartons,
    shortfallKg: roundKg(shortfallKg),
    shortfallCartons,
  };
}