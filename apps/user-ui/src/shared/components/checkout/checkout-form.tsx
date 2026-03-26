"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CheckCircle, CreditCard, Loader2, ShieldCheck, XCircle, Clock, BanknoteIcon } from "lucide-react";
import { useRef, useState } from "react";
import SepaConfirmation from "@/app/components/SepaConfirmation";

interface Props {
  clientSecret: string;
  cartItems: any[];
  coupon: any;
  sessionId: string | null;
  paymentMethod: "stripe" | "klarna" | "sepa";
  currency?: string;
}

export default function CheckoutForm({ clientSecret, cartItems, coupon, sessionId, paymentMethod, currency }: Props) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "pending" | "failed" | null>(null); // "pending" status for sepa
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isSubmitting = useRef(false);

  const isKlarna = paymentMethod === "klarna";
  const isSepa = paymentMethod === "sepa";

  const currencySymbol = currency === "eur" ? "€" : "$";

  const currencyLabel = currency?.toUpperCase() ?? "EUR";

  const accent = isKlarna ? "#ff85a1" : isSepa ? "#1a6b3c" : "#7b4fff";
  const accentLight = isKlarna ? "#fff5f8" : isSepa ? "#f0faf4" : "#f4f0ff";
  const accentBorder = isKlarna ? "#ffb3c6" : isSepa ? "#b3e6c8" : "#e4d9ff";

  const total = cartItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const finalTotal = total - (coupon?.discountAmount || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ── Guard: prevent double submission ──
    if (isSubmitting.current) return;
    if (status === "success" || status === "pending") return;

    isSubmitting.current = true;
    setLoading(true);
    setErrorMsg(null);

    if (!stripe || !elements) {
      isSubmitting.current = false;
      setLoading(false);
      return;
    }

    try {
      // In handleSubmit — SEPA resolves as "processing" not "succeeded"
      const result = (await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?sessionId=${sessionId}`,
        },
        // For SEPA, don't redirect — handle inline
        redirect: isSepa ? "if_required" : ("always" as any),
      })) as any;

      if (result.error) {
        if (result.error.code === "payment_intent_unexpected_state") {
          setStatus(isSepa ? "pending" : "success");
        } else {
          setStatus("failed");
          setErrorMsg(result.error.message || "Something went wrong.");
        }
      } else if (result.paymentIntent?.status === "processing") {
        setStatus("pending"); // SEPA: debit initiated, awaiting bank settlement
      } else if (result.paymentIntent?.status === "succeeded") {
        setStatus("success");
      }
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  }

  // ── SEPA: replace entire page with confirmation screen ──
  if (isSepa && status === "pending") {
    return <SepaConfirmation total={finalTotal} currency={currency} />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Lato:wght@300;400;700&display=swap');
        .cf-root { font-family: 'Lato', sans-serif; }
        .cf-root h2 { font-family: 'Syne', sans-serif; }
        .pay-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.22s cubic-bezier(.4,0,.2,1);
          color: ${isKlarna ? "#1a1a2e" : "#fff"};
          background: ${accent};
        }
        .pay-btn:hover:not(:disabled) {
          filter: brightness(0.93);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px ${accent}44;
        }
        .pay-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 99px;
          background: ${accentLight};
          border: 1px solid ${accentBorder};
          color: ${isKlarna ? "#c44569" : "#6234e0"};
        }
      `}</style>

      <div className="cf-root flex justify-center items-start min-h-[80vh] px-4 py-12 bg-[#f7f7fb]">
        <form onSubmit={handleSubmit} className="bg-white w-full max-w-[520px] rounded-2xl shadow-sm overflow-hidden">
          {/* ── Header ── */}
          <div className="px-8 pt-8 pb-6" style={{ borderBottom: `1px solid ${accentBorder}`, background: accentLight }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-extrabold text-[#1a1a2e]">Secure Checkout</h2>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full border"
                style={{ background: accentLight, borderColor: accentBorder, color: accent }}
              >
                {isSepa ? "SEPA" : isKlarna ? "Klarna" : "Stripe"}
              </span>
            </div>
            <p className="text-xs text-[#9090b0] flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2ec27e]" />
              256-bit SSL encrypted · Powered by Stripe
            </p>
            {isSepa && (
              <p className="text-xs text-[#4a9e6e] mt-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Debit settles within 1–5 business days after authorization
              </p>
            )}
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* ── Order Summary ── */}
            <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: accentLight, border: `1px solid ${accentBorder}` }}>
              <p className="text-xs font-bold text-[#9090b0] uppercase tracking-widest mb-2">Order Summary</p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[#1a1a2e]">
                    <span className="text-[#7a7a9a]">
                      {item.quantity} × {item.title}
                    </span>
                    <span className="font-semibold">
                      {currencySymbol}
                      {(item.quantity * item.salePrice).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {coupon?.discountAmount > 0 && (
                <div className="flex justify-between text-[#2ec27e] font-semibold pt-2 border-t border-[#e0e0f0]">
                  <span>Discount</span>
                  <span>
                    − {currencySymbol}
                    {coupon.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-[#1a1a2e] text-base pt-2 border-t" style={{ borderColor: accentBorder }}>
                <span>Total</span>
                <span style={{ color: accent }}>
                  {currencySymbol}
                  {finalTotal.toFixed(2)}
                  {/* {isKlarna && <span className="text-xs font-normal text-[#9090b0] ml-1">{currencyLabel}</span>} */}
                  <span className="text-xs font-normal text-[#9090b0]">{currency?.toUpperCase()}</span>
                </span>
              </div>
            </div>

            {/* ── Stripe PaymentElement (renders Klarna UI automatically) ── */}
            <div>
              <p className="text-xs font-bold text-[#9090b0] uppercase tracking-widest mb-3">Payment Details</p>
              <PaymentElement
                options={{
                  layout: "tabs",
                }}
              />
            </div>

            {/* ── Submit ── */}
            <button type="submit" disabled={!stripe || loading || status === "pending"} className="pay-btn">
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : isSepa ? (
                <BanknoteIcon className="w-5 h-5" />
              ) : isKlarna ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M5 3h3v18H5V3zm9 0c0 4.5-2 8-5 10l6.5 8H19l-6-7.5C15.5 11 16.5 7 16.5 3H14z" />
                </svg>
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              {loading
                ? "Processing…"
                : isSepa
                ? `Authorize SEPA Debit · ${currencySymbol}${finalTotal.toFixed(2)}`
                : isKlarna
                ? "Continue with Klarna"
                : `Pay ${currencySymbol}${finalTotal.toFixed(2)}`}
            </button>

            {/* ── Status messages ── */}
            {errorMsg && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Success (non-SEPA) */}
            {status === "success" && !isSepa && (
              <div className="flex items-center gap-2 text-[#2ec27e] text-sm bg-[#edfaf3] border border-[#b2f0d4] rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Payment successful! Redirecting…
              </div>
            )}

            {isSepa && (
              <p className="text-[11px] text-[#b0b0c8] text-center leading-relaxed">
                By authorizing, you agree to this and future debits in accordance with the SEPA Direct Debit mandate terms.
              </p>
            )}

            {/* Klarna disclaimer */}
            {isKlarna && (
              <p className="text-[11px] text-[#b0b0c8] text-center leading-relaxed">
                By continuing you agree to Klarna's terms. Klarna will perform a soft credit check. Available in supported countries only.
              </p>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
