import axios from "axios";

const PAYPAL_BASE = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

// ── Get OAuth2 access token (cached in memory) ──
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");

  const res = await axios.post(`${PAYPAL_BASE}/v1/oauth2/token`, "grant_type=client_credentials", {
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  cachedToken = {
    token: res.data.access_token,
    expiresAt: Date.now() + (res.data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

// ── Create a PayPal order with platform fee split ──
// PayPal doesn't have Stripe Connect, so we handle the 10% fee
// by capturing the full amount to our platform and paying out
// sellers separately — OR by using PayPal's Marketplace/Partner API.
// For a clean production setup we use PayPal Orders v2 with
// purchase_units split: platform gets 10%, seller gets 90%.
export async function createPayPalOrder(
  amountUsd: number, // total in dollars (not cents — PayPal uses decimals)
  sessionId: string,
  userId: string,
  sellerPayPalEmail: string // seller's PayPal account email
): Promise<{ orderId: string; approveUrl: string }> {
  const token = await getPayPalAccessToken();

  const total = amountUsd.toFixed(2);
  const platformFee = (amountUsd * 0.1).toFixed(2);
  // const sellerAmount = (amountUsd * 0.9).toFixed(2);

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: sessionId,
        custom_id: JSON.stringify({ sessionId, userId }), // stored for webhook
        amount: {
          currency_code: "USD",
          value: total,
          breakdown: {
            item_total: { currency_code: "USD", value: total },
          },
        },
        // PayPal Marketplace: split payment to seller
        // Requires PayPal Partner/Marketplace approval on your account.
        // If not approved yet, remove payment_instruction and handle manually.
        payment_instruction: {
          disbursement_mode: "INSTANT",
          platform_fees: [
            {
              amount: {
                currency_code: "USD",
                value: platformFee, // 10% to platform
              },
            },
          ],
        },
        payee: {
          email_address: sellerPayPalEmail, // 90% goes to seller
        },
      },
    ],
    application_context: {
      brand_name: "Ccius",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-paypal-success?method=paypal&sessionId=${sessionId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?sessionId=${sessionId}&paymentMethod=paypal&cancelled=true`,
    },
  };

  const res = await axios.post(`${PAYPAL_BASE}/v2/checkout/orders`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `${sessionId}-${Date.now()}`, // idempotency key
    },
  });

  const approveUrl = res.data.links.find((l: any) => l.rel === "approve")?.href;

  return { orderId: res.data.id, approveUrl };
}

// ── Capture a PayPal order after buyer approval ──
export async function capturePayPalOrder(paypalOrderId: string): Promise<any> {
  const token = await getPayPalAccessToken();

  const res = await axios.post(
    `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data;
}

// ── Verify PayPal webhook signature ──
export async function verifyPayPalWebhook(headers: Record<string, string>, rawBody: string): Promise<boolean> {
  const token = await getPayPalAccessToken();

  try {
    const res = await axios.post(
      `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
      {
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(rawBody),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.verification_status === "SUCCESS";
  } catch {
    return false;
  }
}
