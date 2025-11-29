import { Injectable, BadRequestException } from '@nestjs/common';

// List of valid ISO 4217 currency codes we support
const VALID_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN',
  'BRL', 'KRW', 'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'NZD', 'THB', 'PHP',
  'IDR', 'MYR', 'VND', 'TWD', 'ZAR', 'PLN', 'CZK', 'ILS', 'AED', 'SAR',
  'RUB', 'TRY', 'ARS', 'CLP', 'COP', 'PEN', 'EGP', 'NGN', 'KES', 'PKR',
]);

// Mock exchange rates (relative to USD) for development
// In production, these would be fetched from an external API like Open Exchange Rates
const MOCK_USD_RATES: Record<string, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.15,
  BRL: 4.97,
  KRW: 1298.50,
  SGD: 1.34,
  HKD: 7.82,
  SEK: 10.42,
  NOK: 10.68,
  DKK: 6.87,
  NZD: 1.63,
  THB: 35.50,
  PHP: 55.80,
  IDR: 15650.00,
  MYR: 4.72,
  VND: 24350.00,
  TWD: 31.50,
  ZAR: 18.95,
  PLN: 4.03,
  CZK: 22.75,
  ILS: 3.72,
  AED: 3.67,
  SAR: 3.75,
  RUB: 92.50,
  TRY: 29.50,
  ARS: 365.00,
  CLP: 885.00,
  COP: 4150.00,
  PEN: 3.73,
  EGP: 30.90,
  NGN: 780.00,
  KES: 152.00,
  PKR: 285.00,
};

interface CachedRates {
  rates: Record<string, number>;
  timestamp: Date;
}

@Injectable()
export class ExchangeRatesService {
  private cache: CachedRates | null = null;
  private readonly cacheTtlMs = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // Initialize cache on startup
    this.refreshRates();
  }

  /**
   * Check if a currency code is valid
   */
  isValidCurrency(code: string): boolean {
    return VALID_CURRENCIES.has(code.toUpperCase());
  }

  /**
   * Get all exchange rates relative to a base currency
   */
  async getRates(base: string = 'USD'): Promise<{
    base: string;
    rates: Record<string, number>;
    timestamp: string;
  }> {
    const normalizedBase = base.toUpperCase();

    if (!this.isValidCurrency(normalizedBase)) {
      throw new BadRequestException(`Invalid currency code: ${base}`);
    }

    const rates = await this.fetchRatesWithCache();

    // If base is not USD, convert all rates
    if (normalizedBase !== 'USD') {
      const baseRateInUsd = rates[normalizedBase];
      if (!baseRateInUsd) {
        throw new BadRequestException(`Currency not supported: ${base}`);
      }

      const convertedRates: Record<string, number> = {};
      for (const [currency, usdRate] of Object.entries(rates)) {
        // Convert: 1 BASE = X TARGET
        // Rate from USD to TARGET divided by rate from USD to BASE
        convertedRates[currency] = this.roundRate(usdRate / baseRateInUsd);
      }

      return {
        base: normalizedBase,
        rates: convertedRates,
        timestamp: this.cache!.timestamp.toISOString(),
      };
    }

    return {
      base: 'USD',
      rates,
      timestamp: this.cache!.timestamp.toISOString(),
    };
  }

  /**
   * Get exchange rate between two specific currencies
   */
  async getRate(base: string, target: string): Promise<{
    base: string;
    target: string;
    rate: number;
    timestamp: string;
  }> {
    const normalizedBase = base.toUpperCase();
    const normalizedTarget = target.toUpperCase();

    if (!this.isValidCurrency(normalizedBase)) {
      throw new BadRequestException(`Invalid base currency code: ${base}`);
    }

    if (!this.isValidCurrency(normalizedTarget)) {
      throw new BadRequestException(`Invalid target currency code: ${target}`);
    }

    // Same currency = rate of 1
    if (normalizedBase === normalizedTarget) {
      return {
        base: normalizedBase,
        target: normalizedTarget,
        rate: 1,
        timestamp: new Date().toISOString(),
      };
    }

    const rates = await this.fetchRatesWithCache();

    const baseRateInUsd = rates[normalizedBase];
    const targetRateInUsd = rates[normalizedTarget];

    if (!baseRateInUsd) {
      throw new BadRequestException(`Currency not supported: ${base}`);
    }

    if (!targetRateInUsd) {
      throw new BadRequestException(`Currency not supported: ${target}`);
    }

    // Calculate cross rate: 1 BASE = X TARGET
    // If 1 USD = baseRateInUsd BASE, and 1 USD = targetRateInUsd TARGET
    // Then 1 BASE = targetRateInUsd / baseRateInUsd TARGET
    const rate = this.roundRate(targetRateInUsd / baseRateInUsd);

    return {
      base: normalizedBase,
      target: normalizedTarget,
      rate,
      timestamp: this.cache!.timestamp.toISOString(),
    };
  }

  /**
   * Fetch rates from cache or refresh if stale
   */
  private async fetchRatesWithCache(): Promise<Record<string, number>> {
    const now = Date.now();

    if (this.cache && now - this.cache.timestamp.getTime() < this.cacheTtlMs) {
      return this.cache.rates;
    }

    return this.refreshRates();
  }

  /**
   * Refresh rates from external API (or mock for dev)
   */
  private async refreshRates(): Promise<Record<string, number>> {
    // In production, this would fetch from an external API:
    // const response = await fetch('https://openexchangerates.org/api/latest.json?app_id=XXX');
    // const data = await response.json();
    // this.cache = { rates: data.rates, timestamp: new Date() };

    // For development, use mock rates
    this.cache = {
      rates: { ...MOCK_USD_RATES },
      timestamp: new Date(),
    };

    return this.cache.rates;
  }

  /**
   * Round rate to reasonable precision (4 decimal places for most, more for small rates)
   */
  private roundRate(rate: number): number {
    if (rate > 100) {
      return Math.round(rate * 100) / 100; // 2 decimals for large rates
    } else if (rate > 1) {
      return Math.round(rate * 10000) / 10000; // 4 decimals for normal rates
    } else {
      return Math.round(rate * 1000000) / 1000000; // 6 decimals for small rates
    }
  }
}
