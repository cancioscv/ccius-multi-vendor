const PAYPAL_CURRENCY_MAP: Record<string, string> = {
  US: "USD",
  DE: "EUR",
  AT: "EUR",
  BE: "EUR",
  FI: "EUR",
  FR: "EUR",
  IE: "EUR",
  IT: "EUR",
  NL: "EUR",
  ES: "EUR",
  PT: "EUR",
  GB: "GBP",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  CH: "CHF",
  AU: "AUD",
  NZ: "NZD",
  CA: "CAD",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  BR: "BRL",
  MX: "MXN",
  JP: "JPY",
  HK: "HKD",
  SG: "SGD",
  IN: "INR",
};

export function getPayPalCurrency(country?: string | null): string {
  if (!country) return "USD";
  return PAYPAL_CURRENCY_MAP[country.toUpperCase()] ?? "USD";
}
