import Stripe from "stripe";

/**
 * Klarna currency map by Stripe account country.
 * https://docs.stripe.com/payments/klarna#supported-currencies
 */
const KLARNA_CURRENCY_MAP: Record<string, string> = {
  US: "usd",
  GB: "gbp",
  DE: "eur",
  AT: "eur",
  BE: "eur",
  FI: "eur",
  FR: "eur",
  IE: "eur",
  IT: "eur",
  NL: "eur",
  ES: "eur",
  SE: "sek",
  NO: "nok",
  DK: "dkk",
  CH: "chf",
  AU: "aud",
  NZ: "nzd",
  CA: "cad",
  PL: "pln",
  CZ: "czk",
  // Add more as Klarna expands
};

// Cache platform country — only fetched once per server lifetime
let platformCountryCache: string | null = null;
export async function getKlarnaCurrency(stripe: Stripe): Promise<string> {
  if (!platformCountryCache) {
    // Fetch YOUR platform account (no arguments = your own account)
    const account = await stripe.accounts.retrieve();
    platformCountryCache = account.country ?? "US";
    console.log(`Platform account country: ${platformCountryCache}`);
  }

  return KLARNA_CURRENCY_MAP[platformCountryCache] ?? "usd";
}
