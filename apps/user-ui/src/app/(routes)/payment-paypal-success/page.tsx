"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useCartStore } from "@/store";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const method = searchParams.get("method"); // "paypal" or null
  const sessionId = searchParams.get("sessionId");
  const paypalOrderId = searchParams.get("token"); // PayPal appends ?token=ORDER_ID
  const cancelled = searchParams.get("cancelled");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // Clear cart
  useEffect(() => {
    useCartStore.setState({ cart: [] });
  }, []);

  // Add a guard before calling capture
  if (!paypalOrderId) {
    setStatus("error");
    setMessage("Missing PayPal order ID. Please contact support.");
    return;
  }

  console.log("Capturing PayPal order:", paypalOrderId);

  useEffect(() => {
    if (cancelled) {
      setStatus("error");
      setMessage("Payment was cancelled. Please try again.");
      return;
    }

    if (method === "paypal" && paypalOrderId && sessionId) {
      // Capture the PayPal payment now that buyer has approved
      axiosInstance
        .post("/payment/api/capture-paypal-payment", { paypalOrderId, sessionId })
        .then(() => {
          setStatus("success");
          setMessage("Your PayPal payment was successful!");
        })
        .catch(() => {
          setStatus("error");
          setMessage("Failed to capture PayPal payment. Please contact support.");
        });
    } else {
      // Stripe/Klarna: payment already processed via webhook
      setStatus("success");
      setMessage("Your payment was successful!");
    }
  }, [method, paypalOrderId, sessionId, cancelled]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin w-10 h-10 text-[#003087]" />
        <p className="text-[#9090b0] text-sm animate-pulse">Confirming your PayPal payment…</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh] px-4">
      <div className="text-center bg-white rounded-2xl shadow-sm p-12 max-w-sm w-full">
        {status === "success" ? (
          <>
            <CheckCircle className="w-14 h-14 text-[#2ec27e] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Payment Successful!</h2>
            <p className="text-sm text-[#9090b0] mb-6">{message}</p>
            <button
              onClick={() => router.push(`/profile?active=My+Orders`)}
              className="bg-[#003087] text-white px-6 py-2.5 rounded-lg hover:bg-[#002060] transition text-sm font-semibold"
            >
              View Orders
            </button>
          </>
        ) : (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Payment Failed</h2>
            <p className="text-sm text-[#9090b0] mb-6">{message}</p>
            <button
              onClick={() => router.push("/cart")}
              className="bg-[#7b4fff] text-white px-6 py-2.5 rounded-lg hover:bg-[#6234e0] transition text-sm font-semibold"
            >
              Back to Cart
            </button>
          </>
        )}
      </div>
    </div>
  );
}
