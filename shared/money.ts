/**
 * Money utility functions and classes
 */

export class Money {
  constructor(public amount: number, public currency: string = 'USD') {}
  
  toString(): string {
    return MoneyUtils.format(this.amount, this.currency);
  }
  
  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(MoneyUtils.add(this.amount, other.amount), this.currency);
  }
  
  static fromString(value: string, currency: string = 'USD'): Money {
    const amount = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return new Money(isNaN(amount) ? 0 : amount, currency);
  }
}

export class MoneyUtils {
  /**
   * Format amount to currency string
   */
  static format(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Add two monetary amounts safely
   */
  static add(amount1: number, amount2: number): number {
    return Math.round((amount1 + amount2) * 100) / 100;
  }

  /**
   * Subtract two monetary amounts safely
   */
  static subtract(amount1: number, amount2: number): number {
    return Math.round((amount1 - amount2) * 100) / 100;
  }

  /**
   * Multiply amount by factor safely
   */
  static multiply(amount: number, factor: number): number {
    return Math.round(amount * factor * 100) / 100;
  }

  /**
   * Divide amount by divisor safely
   */
  static divide(amount: number, divisor: number): number {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return Math.round((amount / divisor) * 100) / 100;
  }

  /**
   * Convert amount between currencies using exchange rate
   */
  static convertCurrency(amount: number, exchangeRate: number): number {
    return Math.round(amount * exchangeRate * 100) / 100;
  }

  /**
   * Check if amount is valid (positive number)
   */
  static isValidAmount(amount: number): boolean {
    return typeof amount === 'number' && amount >= 0 && !isNaN(amount);
  }

  /**
   * Round to 2 decimal places
   */
  static round(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}