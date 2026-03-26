"use client";

import axiosInstance from "@/utils/axiosInstance";
import { loadStripe, Appearance } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import { XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CheckoutForm from "@/shared/components/checkout/checkout-form";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [coupon, setCoupon] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("eur");

  const hasFetched = useRef(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("sessionId");

  // ← Read paymentMethod from URL (set in CartPage)
  const paymentMethod = (searchParams.get("paymentMethod") ?? "stripe") as "stripe" | "klarna" | "sepa";

  useEffect(() => {
    // ── Guard: only run once even in React Strict Mode ──
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchSessionAndClientSecret = async () => {
      if (!sessionId) {
        setError("Invalid session. Please try again.");
        setLoading(false);
        return;
      }

      try {
        // Verify session (same endpoint for both methods)
        const res = await axiosInstance.get(`/order/api/verify-payment-session?sessionId=${sessionId}`);
        const { totalAmount, sellers, cart, coupon } = res.data.session;

        if (!sellers?.length || totalAmount === undefined || totalAmount === null) {
          throw new Error("Invalid payment session data.");
        }

        setCartItems(cart);
        setCoupon(coupon);

        const sellerStripeAccountId = sellers[0].stripeAccountId;

        const amount = coupon?.discountAmount ? totalAmount - coupon.discountAmount : totalAmount;

        const intentEndpointMap: Record<string, string> = {
          stripe: "/order/api/create-payment-intent",
          klarna: "/payment/api/create-klarna-payment-intent",
          sepa: "/payment/api/create-sepa-payment-intent",
        };

        const intentEndpoint = intentEndpointMap[paymentMethod];

        const intentRes = await axiosInstance.post(intentEndpoint ?? intentEndpointMap.stripe, {
          amount,
          sellerStripeAccountId,
          sessionId,
        });

        setClientSecret(intentRes.data.clientSecret);
        setCurrency(intentRes.data.currency ?? "eur");
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong while preparing your payment.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndClientSecret();
  }, [sessionId, paymentMethod]);

  const appearance: Appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: paymentMethod === "klarna" ? "#ff85a1" : paymentMethod === "sepa" ? "#1a6b3c" : "#7b4fff",
      borderRadius: "10px",
      fontFamily: "Lato, sans-serif",
    },
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh] gap-4">
        <div className="relative w-14 h-14">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#f0f0f8] border-t-[#7b4fff]" />
        </div>
        <p className="text-[#9090b0] text-sm animate-pulse">Preparing your checkout…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl shadow-sm p-10">
          <XCircle className="text-red-400 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Payment Error</h2>
          <p className="text-sm text-[#9090b0] mb-6">{error}</p>
          <button
            onClick={() => router.push("/cart")}
            className="bg-[#7b4fff] text-white px-6 py-2.5 rounded-lg hover:bg-[#6234e0] transition text-sm font-semibold"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return clientSecret ? (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <CheckoutForm
        clientSecret={clientSecret}
        cartItems={cartItems}
        coupon={coupon}
        sessionId={sessionId}
        paymentMethod={paymentMethod}
        currency={currency}
      />
    </Elements>
  ) : null;
}
