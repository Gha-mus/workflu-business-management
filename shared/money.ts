/**
 * WorkFlu Money Utilities
 * 
 * Centralized financial operations using Decimal.js for precision
 * Eliminates parseFloat/Number usage for monetary values
 * Provides safe currency conversion and formatting
 */

import Decimal from 'decimal.js';

// Configure Decimal.js globally for money operations
Decimal.config({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
  modulo: Decimal.ROUND_DOWN,
  crypto: false
});

/**
 * Money class for safe financial operations
 */
export class Money {
  private readonly _amount: Decimal;
  private readonly _currency: string;

  constructor(amount: string | number | Decimal, currency: string = 'USD') {
    this._amount = new Decimal(amount);
    this._currency = currency.toUpperCase();
  }

  // Static factory methods
  static fromString(amount: string, currency: string = 'USD'): Money {
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    if (!cleaned || isNaN(Number(cleaned))) {
      return new Money(0, currency);
    }
    return new Money(cleaned, currency);
  }

  static fromNumber(amount: number, currency: string = 'USD'): Money {
    if (!isFinite(amount) || isNaN(amount)) {
      return new Money(0, currency);
    }
    return new Money(amount, currency);
  }

  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }

  // Getters
  get amount(): Decimal {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get isZero(): boolean {
    return this._amount.isZero();
  }

  get isPositive(): boolean {
    return this._amount.isPos();
  }

  get isNegative(): boolean {
    return this._amount.isNeg();
  }

  // Math operations (return new Money instances)
  add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot add different currencies: ${this._currency} and ${other._currency}`);
    }
    return new Money(this._amount.add(other._amount), this._currency);
  }

  subtract(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot subtract different currencies: ${this._currency} and ${other._currency}`);
    }
    return new Money(this._amount.sub(other._amount), this._currency);
  }

  multiply(factor: string | number | Decimal): Money {
    return new Money(this._amount.mul(new Decimal(factor)), this._currency);
  }

  divide(divisor: string | number | Decimal): Money {
    return new Money(this._amount.div(new Decimal(divisor)), this._currency);
  }

  // Comparison operations
  equals(other: Money): boolean {
    return this._currency === other._currency && this._amount.equals(other._amount);
  }

  lessThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot compare different currencies: ${this._currency} and ${other._currency}`);
    }
    return this._amount.lt(other._amount);
  }

  lessThanOrEqual(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot compare different currencies: ${this._currency} and ${other._currency}`);
    }
    return this._amount.lte(other._amount);
  }

  greaterThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot compare different currencies: ${this._currency} and ${other._currency}`);
    }
    return this._amount.gt(other._amount);
  }

  greaterThanOrEqual(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot compare different currencies: ${this._currency} and ${other._currency}`);
    }
    return this._amount.gte(other._amount);
  }

  // Conversion methods
  toString(): string {
    return this._amount.toFixed(2);
  }

  toNumber(): number {
    return this._amount.toNumber();
  }

  toDecimal(): Decimal {
    return this._amount;
  }

  // Format for database storage (string with precision)
  toDbString(): string {
    return this._amount.toFixed();
  }

  // Formatted display
  toDisplayString(showCurrency: boolean = true): string {
    const formatted = this._amount.toFixed(2);
    return showCurrency ? `${formatted} ${this._currency}` : formatted;
  }
}

/**
 * Currency conversion utilities
 */
export class CurrencyConverter {
  static convert(money: Money, toCurrency: string, exchangeRate: string | number | Decimal): Money {
    if (money.currency === toCurrency.toUpperCase()) {
      return money;
    }
    
    const rate = new Decimal(exchangeRate);
    const convertedAmount = money.amount.mul(rate);
    return new Money(convertedAmount, toCurrency);
  }

  static convertETBToUSD(amountETB: Money, usdEtbRate: string | number | Decimal): Money {
    if (amountETB.currency !== 'ETB') {
      throw new Error('Amount must be in ETB currency');
    }
    const rate = new Decimal(usdEtbRate);
    const usdAmount = amountETB.amount.div(rate);
    return new Money(usdAmount, 'USD');
  }

  static convertUSDToETB(amountUSD: Money, usdEtbRate: string | number | Decimal): Money {
    if (amountUSD.currency !== 'USD') {
      throw new Error('Amount must be in USD currency');
    }
    const rate = new Decimal(usdEtbRate);
    const etbAmount = amountUSD.amount.mul(rate);
    return new Money(etbAmount, 'ETB');
  }
}

/**
 * Safe parsing utilities to replace parseFloat/Number usage
 */
export const MoneyUtils = {
  /**
   * Safely parse string input to Money (replaces safeParseFloat)
   */
  parseMoneyInput(input: string | number | null | undefined, currency: string = 'USD'): Money {
    if (input === null || input === undefined || input === '') {
      return Money.zero(currency);
    }
    
    if (typeof input === 'number') {
      return Money.fromNumber(input, currency);
    }
    
    return Money.fromString(input, currency);
  },

  /**
   * Calculate total from weight and price per kg
   */
  calculateTotal(weight: string | number, pricePerKg: string | number, currency: string = 'USD'): Money {
    const weightMoney = this.parseMoneyInput(weight, currency);
    const priceMoney = this.parseMoneyInput(pricePerKg, currency);
    return weightMoney.multiply(priceMoney.amount);
  },

  /**
   * Calculate remaining balance after payment
   */
  calculateRemaining(total: Money, amountPaid: Money): Money {
    return total.subtract(amountPaid);
  },

  /**
   * Validate payment amount against remaining balance
   */
  validatePaymentAmount(paymentAmount: Money, remainingBalance: Money): {
    isValid: boolean;
    error?: string;
  } {
    if (paymentAmount.isZero || paymentAmount.isNegative) {
      return { isValid: false, error: 'Payment amount must be greater than 0' };
    }
    
    if (paymentAmount.greaterThan(remainingBalance)) {
      return { 
        isValid: false, 
        error: `Payment amount cannot exceed remaining balance of ${remainingBalance.toDisplayString()}` 
      };
    }
    
    return { isValid: true };
  },

  /**
   * Format currency for display
   */
  formatCurrency(amount: string | number | Money, currency?: string): string {
    if (amount instanceof Money) {
      return amount.toDisplayString();
    }
    
    const money = this.parseMoneyInput(amount, currency || 'USD');
    return money.toDisplayString();
  },

  /**
   * Safe exchange rate parsing
   */
  parseExchangeRate(rate: string | number | null | undefined): Decimal {
    if (rate === null || rate === undefined || rate === '') {
      throw new Error('Exchange rate cannot be empty');
    }
    
    let rateDecimal: Decimal;
    
    if (typeof rate === 'string') {
      const cleaned = rate.replace(/[^0-9.-]/g, '');
      if (!cleaned || isNaN(Number(cleaned))) {
        throw new Error(`Invalid exchange rate format: ${rate}`);
      }
      rateDecimal = new Decimal(cleaned);
    } else {
      if (!isFinite(rate) || isNaN(rate) || rate <= 0) {
        throw new Error(`Invalid exchange rate: ${rate}`);
      }
      rateDecimal = new Decimal(rate);
    }
    
    if (rateDecimal.isZero() || rateDecimal.isNeg()) {
      throw new Error('Exchange rate must be positive');
    }
    
    return rateDecimal;
  }
};

/**
 * Weight and measurement utilities integrated with Money
 */
export const WeightMoneyUtils = {
  /**
   * Calculate price per unit based on weight and total
   */
  calculatePricePerKg(totalAmount: Money, weightKg: string | number): Money {
    const weight = MoneyUtils.parseMoneyInput(weightKg, totalAmount.currency);
    if (weight.isZero) {
      throw new Error('Weight cannot be zero for price calculation');
    }
    return totalAmount.divide(weight.amount);
  },

  /**
   * Calculate total cost from weight and price per kg
   */
  calculateTotalCost(weightKg: string | number, pricePerKg: Money): Money {
    const weight = new Decimal(weightKg);
    return pricePerKg.multiply(weight);
  }
};

// Export types for TypeScript
export type MoneyInput = string | number | Money;
export type CurrencyCode = 'USD' | 'ETB';

// Default export for convenience
export default Money;