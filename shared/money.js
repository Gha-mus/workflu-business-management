/**
 * Money utility functions
 */

export class MoneyUtils {
  /**
   * Format amount to currency string
   */
  static format(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Add two monetary amounts safely
   */
  static add(amount1, amount2) {
    return Math.round((amount1 + amount2) * 100) / 100;
  }

  /**
   * Subtract two monetary amounts safely
   */
  static subtract(amount1, amount2) {
    return Math.round((amount1 - amount2) * 100) / 100;
  }

  /**
   * Multiply amount by factor safely
   */
  static multiply(amount, factor) {
    return Math.round(amount * factor * 100) / 100;
  }

  /**
   * Divide amount by divisor safely
   */
  static divide(amount, divisor) {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return Math.round((amount / divisor) * 100) / 100;
  }

  /**
   * Convert amount between currencies using exchange rate
   */
  static convertCurrency(amount, exchangeRate) {
    return Math.round(amount * exchangeRate * 100) / 100;
  }

  /**
   * Check if amount is valid (positive number)
   */
  static isValidAmount(amount) {
    return typeof amount === 'number' && amount >= 0 && !isNaN(amount);
  }

  /**
   * Round to 2 decimal places
   */
  static round(amount) {
    return Math.round(amount * 100) / 100;
  }
}