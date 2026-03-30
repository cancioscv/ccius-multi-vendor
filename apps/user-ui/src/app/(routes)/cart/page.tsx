"use client";

import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import { useCartStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type PaymentMethod = "stripe" | "klarna" | "paypal" | "sepa";
export default function CartPage() {
  const { user, isLoading } = useUser();
  const { location } = useLocationTracking();
  const { deviceInfo } = useDeviceTracking();

  const router = useRouter();
  const { cart, removeFromCart } = useCartStore();

  const [discountedProductId, setDiscountedProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [error, setError] = useState("");
  const [storedCouponCode, setStoredCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");

  useEffect(() => {
    if (isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading]);

  function decreaseQuantity(id: string | undefined) {
    useCartStore.setState((state: any) => ({
      cart: state.cart.map((item: any) => (item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item)),
    }));
  }
  function increaseQuantity(id: string | undefined) {
    useCartStore.setState((state: any) => ({
      cart: state.cart.map((item: any) => (item.id === id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item)),
    }));
  }

  const subTotal = cart.reduce((total: number, item: any) => total + item.quantity * item.salePrice, 0);

  async function applyCouponCode() {
    setError("");

    if (!couponCode.trim()) {
      setError("Coupon code is required!");
      return;
    }

    try {
      const res = await axiosInstance.put("/order/api/verify-coupon", {
        couponCode: couponCode.trim(),
        cart,
      });

      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim());
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discount);
        setDiscountedProductId(res.data.discountedProductId);
        setCouponCode("");
      } else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountedProductId("");
        setError(res.data.message || "Coupon not valid for any items in cart.");
      }
    } catch (error: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProductId("");
      setError(error?.response?.data?.message);
    }
  }

  async function createPaymentSession() {
    if (addresses?.length === 0) {
      toast.error("Please set your delivery address to create an order!");
      return;
    }
    setLoading(true);
    try {
      const couponPayload = {
        code: storedCouponCode,
        discountAmount,
        discountPercent,
        discountedProductId,
      };

      // ── Route to the correct session endpoint based on chosen method ──
      const endpointMap = {
        stripe: "/order/api/create-payment-session",
        klarna: "/payment/api/create-klarna-payment-session",
        paypal: "/payment/api/create-paypal-payment-session",
        sepa: "/payment/api/create-sepa-payment-session",
      };

      const res = await axiosInstance.post(endpointMap[paymentMethod], {
        cart,
        selectedAddressId,
        coupon: couponPayload,
      });

      const sessionId = res.data.sessionId;

      if (paymentMethod === "paypal") {
        // PayPal: create order immediately and redirect to PayPal
        const orderRes = await axiosInstance.post("/payment/api/create-paypal-order", {
          sessionId,
        });
        // Redirect to PayPal approval page
        window.location.href = orderRes.data.approveUrl;
      } else {
        // Stripe / Klarna: go to checkout page
        router.push(`/checkout?sessionId=${sessionId}&paymentMethod=${paymentMethod}`);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Get addresses
  const { data: addresses = [] } = useQuery<any[], Error>({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/shipping-addresses");
      return res.data.addresses;
    },
    enabled: !!user, // ✅ only fetch when user exists
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((addr) => addr.isDefault);
      setSelectedAddressId(defaultAddr ? defaultAddr.id : addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  return (
    <div className="w-full min-h-screen bg-[#f7f7fb]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Lato:wght@300;400;700&display=swap');
        .cart-root { font-family: 'Lato', sans-serif; }
        .cart-root h1 { font-family: 'Syne', sans-serif; }
        .payment-card {
          transition: all 0.22s cubic-bezier(.4,0,.2,1);
          border: 2px solid transparent;
          cursor: pointer;
          background: #fff;
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .payment-card:hover { border-color: #c7b8ff; box-shadow: 0 4px 20px rgba(120,80,255,0.08); }
        .payment-card.selected { border-color: #7b4fff; background: #f4f0ff; }
        .payment-card.klarna-card.selected { border-color: #ffb3c6; background: #fff5f8; }
        .qty-btn {
          width: 28px; height: 28px; border-radius: 50%;
          border: 1.5px solid #e2e2ef;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 16px; font-weight: 600;
          transition: background 0.15s, border-color 0.15s;
        }
        .qty-btn:hover { background: #7b4fff; border-color: #7b4fff; color: #fff; }
        .checkout-btn {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.04em;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.22s cubic-bezier(.4,0,.2,1);
        }
        .stripe-btn { background: #7b4fff; color: #fff; }
        .stripe-btn:hover:not(:disabled) { background: #6234e0; box-shadow: 0 6px 24px rgba(123,79,255,0.25); transform: translateY(-1px); }
        .klarna-btn { background: #ffb3c6; color: #1a1a2e; }
        .klarna-btn:hover:not(:disabled) { background: #ff85a1; box-shadow: 0 6px 24px rgba(255,130,160,0.28); transform: translateY(-1px); }
        .checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
        .coupon-input:focus { outline: none; border-color: #7b4fff; box-shadow: 0 0 0 3px rgba(123,79,255,0.12); }
        .remove-btn { color: #bbb; transition: color 0.15s; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; }
        .remove-btn:hover { color: #ff4d6d; }
      `}</style>

      <div className="cart-root md:w-[82%] w-[95%] mx-auto py-10">
        {/* Header */}
        <div className="pb-8">
          <h1 className="text-[42px] font-extrabold text-[#1a1a2e] leading-tight mb-2">Shopping Cart</h1>
          <div className="flex items-center gap-2 text-sm text-[#7a7a9a]">
            <Link href="/" className="hover:text-[#7b4fff] transition">
              Home
            </Link>
            <span>›</span>
            <span>Cart</span>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <ShoppingBag className="w-16 h-16 text-[#d0d0e8] mb-4" />
            <p className="text-[#7a7a9a] text-lg">Your cart is empty.</p>
            <Link href="/" className="mt-4 px-6 py-2.5 bg-[#7b4fff] text-white rounded-full text-sm font-semibold hover:bg-[#6234e0] transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="lg:flex items-start gap-8">
            {/* ── Cart Table ── */}
            <div className="w-full lg:w-[65%] bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f4f0ff] text-[#7b4fff] text-xs uppercase tracking-widest">
                    <th className="py-4 text-left pl-6 font-semibold">Product</th>
                    <th className="py-4 text-center font-semibold">Price</th>
                    <th className="py-4 text-center font-semibold">Qty</th>
                    <th className="py-4 text-center font-semibold pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item: any) => (
                    <tr key={item.id} className="border-b border-[#f0f0f8] hover:bg-[#fafafe] transition">
                      <td className="flex items-center gap-4 p-4">
                        <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-[#f4f0ff] flex-shrink-0">
                          <Image
                            src={(item?.images as Record<string, any>)[0]?.url || "/placeholder.png"}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1a2e] text-sm leading-snug mb-1">{item.title}</p>
                          {item?.selectedOptions && (
                            <div className="flex items-center gap-2 text-xs text-[#9090b0]">
                              {item.selectedOptions?.color && (
                                <span className="flex items-center gap-1">
                                  <span
                                    style={{ backgroundColor: item.selectedOptions.color }}
                                    className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                  />
                                </span>
                              )}
                              {item.selectedOptions?.size && (
                                <span className="bg-[#f4f0ff] text-[#7b4fff] px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  {item.selectedOptions.size}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="text-center px-4">
                        {item.id === discountedProductId ? (
                          <div className="flex flex-col items-center">
                            <span className="line-through text-[#b0b0c8] text-xs">${item.salePrice.toFixed(2)}</span>
                            <span className="text-[#2ec27e] font-bold text-sm">${((item.salePrice * (100 - discountPercent)) / 100).toFixed(2)}</span>
                            <span className="text-[10px] text-[#2ec27e] bg-[#edfaf3] px-2 py-0.5 rounded-full mt-0.5">-{discountPercent}%</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-[#1a1a2e] text-sm">${item.salePrice.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="text-center px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="qty-btn" onClick={() => decreaseQuantity(item.id)}>
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-[#1a1a2e]">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => increaseQuantity(item.id)}>
                            +
                          </button>
                        </div>
                      </td>

                      <td className="text-center pr-4">
                        <button className="remove-btn mx-auto" onClick={() => removeFromCart(item?.id, user, location, deviceInfo)}>
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Summary Panel ── */}
            <div className="w-full lg:w-[35%] space-y-4 mt-6 lg:mt-0">
              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-[#1a1a2e] text-base mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
                  Order Summary
                </h3>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-[#2ec27e] font-medium">
                    <span>Discount ({discountPercent}%)</span>
                    <span>- ${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-[#7a7a9a] mb-1">
                  <span>Subtotal</span>
                  <span className="text-[#1a1a2e] font-semibold">${subTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#f0f0f8] my-3" />
                <div className="flex justify-between text-[17px] font-bold text-[#1a1a2e]">
                  <span>Total</span>
                  <span>${(subTotal - discountAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-[#1a1a2e] text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7b4fff]" />
                  Have a coupon?
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code..."
                    className="coupon-input flex-1 text-sm px-3 py-2.5 border border-[#e2e2ef] rounded-lg transition"
                    onKeyDown={(e) => e.key === "Enter" && applyCouponCode()}
                  />
                  <button
                    onClick={applyCouponCode}
                    className="px-4 py-2.5 bg-[#7b4fff] text-white text-sm font-semibold rounded-lg hover:bg-[#6234e0] transition"
                  >
                    Apply
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                {discountAmount > 0 && (
                  <p className="text-[#2ec27e] text-xs mt-2 font-medium">✓ Coupon applied — saving ${discountAmount.toFixed(2)}</p>
                )}
              </div>

              {/* Address Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-[#1a1a2e] text-sm mb-3">Shipping Address</h3>
                {addresses.length === 0 ? (
                  <p className="text-xs text-[#9090b0]">Please add an address from your profile first.</p>
                ) : (
                  <select
                    className="w-full text-sm p-2.5 border border-[#e2e2ef] rounded-lg focus:outline-none focus:border-[#7b4fff] transition bg-white text-[#1a1a2e]"
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {addresses.map((address: any) => (
                      <option key={address.id} value={address.id}>
                        {address.street}, {address.zip} — {address.city}, {address.country}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* ── Payment Method Selector ── */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-[#1a1a2e] text-sm mb-3">Payment Method</h3>

                <div className="flex flex-col gap-3">
                  {/* Stripe Card */}
                  <div className={`payment-card ${paymentMethod === "stripe" ? "selected" : ""}`} onClick={() => setPaymentMethod("stripe")}>
                    <div className="w-8 h-8 rounded-lg bg-[#7b4fff]/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-[#7b4fff]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a2e]">Card</p>
                      <p className="text-[11px] text-[#9090b0]">Stripe · Visa, Mastercard</p>
                    </div>
                    <RadioDot selected={paymentMethod === "stripe"} color="#7b4fff" />
                  </div>

                  {/* Klarna Card */}
                  <div
                    className={`payment-card klarna-card ${paymentMethod === "klarna" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("klarna")}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ffb3c6]/30 flex items-center justify-center flex-shrink-0">
                      {/* Klarna K logo */}
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1a1a2e">
                        <path d="M5 3h3v18H5V3zm9 0c0 4.5-2 8-5 10l6.5 8H19l-6-7.5C15.5 11 16.5 7 16.5 3H14z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a2e]">Klarna</p>
                      <p className="text-[11px] text-[#9090b0]">Buy now, pay later</p>
                    </div>
                    <RadioDot selected={paymentMethod === "klarna"} color="#ff85a1" />
                  </div>

                  {/* PayPal Card */}
                  <div
                    className={`payment-card paypal-card ${paymentMethod === "paypal" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("paypal")}
                    role="button"
                    aria-pressed={paymentMethod === "paypal"}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#003087]/10 flex items-center justify-center flex-shrink-0">
                      {/* PayPal P logo */}
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#003087">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a2e]">PayPal</p>
                      <p className="text-[11px] text-[#9090b0]">Fast · Secure · Buyer protection</p>
                    </div>
                    <RadioDot selected={paymentMethod === "paypal"} color="#003087" />
                  </div>

                  {/* SEPA Card */}
                  <div
                    className={`payment-card sepa-card ${paymentMethod === "sepa" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("sepa")}
                    role="button"
                    aria-pressed={paymentMethod === "sepa"}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1a6b3c]/10 flex items-center justify-center flex-shrink-0">
                      {/* Bank/SEPA icon */}
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1a6b3c">
                        <path d="M2 10h20v2H2v-2zm0 4h20v2H2v-2zM12 2L2 7h20L12 2zM4 18h2v3H4v-3zm6 0h2v3h-2v-3zm6 0h2v3h-2v-3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a2e]">SEPA Direct Debit</p>
                      <p className="text-[11px] text-[#9090b0]">Bank transfer · EUR · 1–5 days</p>
                    </div>
                    <RadioDot selected={paymentMethod === "sepa"} color="#1a6b3c" />
                  </div>
                </div>
                {/* Klarna info badge */}
                {paymentMethod === "klarna" && (
                  <div className="mt-3 p-3 bg-[#fff5f8] border border-[#ffb3c6] rounded-xl text-xs text-[#c44569] leading-relaxed">
                    <strong>Klarna note:</strong> Prices are charged in <strong>EUR</strong>. Your cart total will be converted automatically.
                  </div>
                )}
                {/* PayPal info badge */}
                {paymentMethod === "paypal" && (
                  <div className="mt-3 p-3 bg-[#f0f4ff] border border-[#b3c6ff] rounded-xl text-xs text-[#003087] leading-relaxed">
                    <strong>PayPal:</strong> You'll be redirected to PayPal to complete your payment securely.
                  </div>
                )}
                {/* SEPA info badge */}
                {paymentMethod === "sepa" && (
                  <div className="mt-3 p-3 bg-[#f0faf4] border border-[#b3e6c8] rounded-xl text-xs text-[#1a6b3c] leading-relaxed">
                    <strong>SEPA Direct Debit:</strong> EUR only. Your bank account will be debited within <strong>1–5 business days</strong> after
                    you authorize the mandate.
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={createPaymentSession}
                disabled={loading || addresses.length === 0}
                className={`checkout-btn ${paymentMethod === "klarna" ? "klarna-btn" : "stripe-btn"}`}
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : paymentMethod === "klarna" ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M5 3h3v18H5V3zm9 0c0 4.5-2 8-5 10l6.5 8H19l-6-7.5C15.5 11 16.5 7 16.5 3H14z" />
                  </svg>
                ) : paymentMethod === "sepa" ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#ffffff">
                    <path d="M2 10h20v2H2v-2zm0 4h20v2H2v-2zM12 2L2 7h20L12 2zM4 18h2v3H4v-3zm6 0h2v3h-2v-3zm6 0h2v3h-2v-3z" />
                  </svg>
                ) : paymentMethod === "paypal" ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#ffffff">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                  </svg>
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                {loading
                  ? "Redirecting..."
                  : paymentMethod === "klarna"
                  ? "Continue with Klarna"
                  : paymentMethod === "sepa"
                  ? "Continue with SEPA"
                  : paymentMethod === "paypal"
                  ? "Pay with Paypal"
                  : "Pay with Card"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RadioDot({ selected, color }: { selected: boolean; color: string }) {
  return (
    <div
      className="ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all"
      style={{
        borderColor: selected ? color : "#d0d0e8",
        backgroundColor: selected ? color : "transparent",
      }}
    >
      {selected && (
        <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
          <circle cx="8" cy="8" r="8" fill={color} />
          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
