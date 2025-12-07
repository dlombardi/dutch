// Shared currency definitions for Evn

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", decimalPlaces: 2 },
  { code: "EUR", name: "Euro", symbol: "\u20AC", decimalPlaces: 2 },
  { code: "GBP", name: "British Pound", symbol: "\u00A3", decimalPlaces: 2 },
  { code: "JPY", name: "Japanese Yen", symbol: "\u00A5", decimalPlaces: 0 },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", decimalPlaces: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimalPlaces: 2 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimalPlaces: 2 },
  { code: "CNY", name: "Chinese Yuan", symbol: "\u00A5", decimalPlaces: 2 },
  { code: "INR", name: "Indian Rupee", symbol: "\u20B9", decimalPlaces: 2 },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", decimalPlaces: 2 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", decimalPlaces: 2 },
  { code: "KRW", name: "South Korean Won", symbol: "\u20A9", decimalPlaces: 0 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimalPlaces: 2 },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", decimalPlaces: 2 },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", decimalPlaces: 2 },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", decimalPlaces: 2 },
  { code: "DKK", name: "Danish Krone", symbol: "kr", decimalPlaces: 2 },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", decimalPlaces: 2 },
  { code: "ZAR", name: "South African Rand", symbol: "R", decimalPlaces: 2 },
  { code: "THB", name: "Thai Baht", symbol: "\u0E3F", decimalPlaces: 2 },
  { code: "PHP", name: "Philippine Peso", symbol: "\u20B1", decimalPlaces: 2 },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", decimalPlaces: 0 },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", decimalPlaces: 2 },
  { code: "PLN", name: "Polish Zloty", symbol: "z\u0142", decimalPlaces: 2 },
  { code: "CZK", name: "Czech Koruna", symbol: "K\u010D", decimalPlaces: 2 },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", decimalPlaces: 0 },
  { code: "ILS", name: "Israeli Shekel", symbol: "\u20AA", decimalPlaces: 2 },
  { code: "TRY", name: "Turkish Lira", symbol: "\u20BA", decimalPlaces: 2 },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "\u062F.\u0625",
    decimalPlaces: 2,
  },
  { code: "SAR", name: "Saudi Riyal", symbol: "\uFDFC", decimalPlaces: 2 },
];

// Create a lookup map for O(1) access by code
const currencyMap = new Map<string, Currency>(
  CURRENCIES.map((c) => [c.code, c]),
);

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return currencyMap.get(code);
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  return currencyMap.get(code)?.symbol ?? code;
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

/**
 * Get default currency
 */
export function getDefaultCurrency(): Currency {
  return CURRENCIES[0]; // USD
}

/**
 * Search currencies by code, name, or symbol
 */
export function searchCurrencies(query: string): Currency[] {
  if (!query.trim()) return CURRENCIES;
  const search = query.toLowerCase();
  return CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search) ||
      c.name.toLowerCase().includes(search) ||
      c.symbol.toLowerCase().includes(search),
  );
}
