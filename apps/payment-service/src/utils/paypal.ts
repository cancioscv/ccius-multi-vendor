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
  sessionId: string,
  userId: string,

  totalAmount: number,
  coupon: any,
  currency: string = "USD"
): Promise<{ orderId: string; approveUrl: string }> {
  const token = await getPayPalAccessToken();

  const discounted = coupon?.discountAmount ? totalAmount - coupon.discountAmount : totalAmount;

  const total = Math.max(discounted, 0).toFixed(2);

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: sessionId,
        custom_id: JSON.stringify({ sessionId, userId }),
        amount: {
          currency_code: currency,
          value: total,
        },
        // No payee, no payment_instruction — full amount to your platform
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
      "PayPal-Request-Id": `${sessionId}-${Date.now()}`,
    },
  });

  const approveUrl = res.data.links.find((l: any) => l.rel === "approve")?.href;

  if (!approveUrl) {
    throw new Error("PayPal did not return an approve URL.");
  }

  return { orderId: res.data.id, approveUrl };
}

// ── Capture a PayPal order after buyer approval ──
export async function capturePayPalOrder(paypalOrderId: string): Promise<any> {
  const token = await getPayPalAccessToken();

  // ── Check order status first ──
  const orderDetails = await getPayPalOrderDetails(paypalOrderId);
  console.log("PayPal order status before capture:", orderDetails.status);

  if (orderDetails.status === "COMPLETED") {
    console.log("Order already captured, returning existing data");
    return orderDetails; // idempotent — already done
  }

  if (orderDetails.status !== "APPROVED") {
    throw new Error(`Cannot capture order in status: ${orderDetails.status}. Expected APPROVED.`);
  }

  try {
    const res = await axios.post(
      `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `capture-${paypalOrderId}`,
          Prefer: "return=representation",
        },
      }
    );

    return res.data;
  } catch (error: any) {
    const paypalError = error.response?.data;
    throw new Error(`PayPal capture failed: ${paypalError?.message} — ${JSON.stringify(paypalError?.details)}`);
  }
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

export async function getPayPalOrderDetails(paypalOrderId: string): Promise<any> {
  const token = await getPayPalAccessToken();
  const res = await axios.get(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}
