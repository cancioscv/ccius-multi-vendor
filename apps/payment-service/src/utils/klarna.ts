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

export async function getKlarnaCurrency(stripe: Stripe, sellerStripeAccountId: string): Promise<string> {
  try {
    const account = await stripe.accounts.retrieve(sellerStripeAccountId);
    const country = account.country ?? "DE";
    return KLARNA_CURRENCY_MAP[country] ?? "eur"; // fallback to EUR
  } catch (err) {
    console.warn("Could not retrieve seller account country, defaulting to EUR:", err);
    return "eur";
  }
}
