import { useCartStore } from "@/store";
import { BanknoteIcon, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  total: number;
  currency: string | undefined;
}
export default function SepaConfirmation({ total, currency }: Props) {
  const router = useRouter();
  const currencySymbol = currency === "eur" ? "€" : "$";

  // Clear cart
  useEffect(() => {
    useCartStore.setState({ cart: [] });
  }, []);

  return (
    <div className="flex justify-center items-start min-h-[80vh] px-4 py-12 bg-[#f7f7fb]">
      <div className="bg-white w-full max-w-[520px] rounded-2xl shadow-sm overflow-hidden">
        {/* Green header */}
        <div className="bg-[#f0faf4] border-b border-[#b3e6c8] px-8 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-[#1a6b3c]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#1a6b3c]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
            Mandate Authorized
          </h2>
          <p className="text-sm text-[#4a9e6e]">Your SEPA Direct Debit has been initiated</p>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* What happens next — timeline */}
          <div>
            <p className="text-xs font-bold text-[#9090b0] uppercase tracking-widest mb-3">What happens next</p>
            <div className="space-y-0">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#1a6b3c] flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="w-0.5 h-8 bg-[#b3e6c8] mt-1" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold text-[#1a1a2e]">Mandate authorized</p>
                  <p className="text-xs text-[#9090b0]">Right now — your bank account debit has been approved</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#e8f4fd] border-2 border-[#b3d4f0] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#4a90c4]" />
                  </div>
                  <div className="w-0.5 h-8 bg-[#e2e2ef] mt-1" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold text-[#1a1a2e]">Bank processes debit</p>
                  <p className="text-xs text-[#9090b0]">Within 1–5 business days</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#f4f0ff] border-2 border-[#d0c4ff] flex items-center justify-center flex-shrink-0">
                    <BanknoteIcon className="w-3.5 h-3.5 text-[#7b4fff]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a2e]">Order confirmed by email</p>
                  <p className="text-xs text-[#9090b0]">You'll receive a confirmation once payment settles</p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount summary */}
          <div className="bg-[#f7f7fb] rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm text-[#7a7a9a]">Amount to be debited</span>
            <span className="text-lg font-bold text-[#1a1a2e]">
              {currencySymbol}
              {total.toFixed(2)} <span className="text-xs font-normal text-[#9090b0]">{currency?.toUpperCase()}</span>
            </span>
          </div>

          {/* Important note */}
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-4 text-xs text-[#92610a] leading-relaxed">
            <strong>Important:</strong> Do not attempt to pay again. Your mandate has been recorded and the debit will be processed automatically by
            your bank. If you have any questions, contact our support team.
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push(`/profile?active=My+Orders`)}
            className="w-full py-3 bg-[#1a6b3c] text-white rounded-xl font-semibold hover:bg-[#145c30] transition text-sm"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            View My Orders
          </button>

          <button onClick={() => router.push("/")} className="w-full py-2.5 text-[#7a7a9a] text-sm hover:text-[#1a1a2e] transition">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
