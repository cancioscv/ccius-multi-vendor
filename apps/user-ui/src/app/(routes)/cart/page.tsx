"use client";

import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import { useCartStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@e-com/ui";

type PaymentMethod = "stripe" | "klarna" | "paypal" | "sepa";

// ─── Payment method config ─────────────────────────────────────────────────────
const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    id: "stripe",
    label: "Card",
    subtitle: "Stripe · Visa, Mastercard",
    icon: <CreditCard className="w-4 h-4 text-orange-500" />,
    activeColor: "text-orange-600",
    activeBg: "bg-orange-50",
    activeBorder: "border-orange-400",
  },
  {
    id: "klarna",
    label: "Klarna",
    subtitle: "Buy now, pay later",
    icon: (
      // Klarna K logo
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#1a1a2e]" fill="currentColor">
        <path d="M5 3h3v18H5V3zm9 0c0 4.5-2 8-5 10l6.5 8H19l-6-7.5C15.5 11 16.5 7 16.5 3H14z" />
      </svg>
    ),
    activeColor: "text-pink-600",
    activeBg: "bg-pink-50",
    activeBorder: "border-pink-300",
  },
  {
    id: "paypal",
    label: "PayPal",
    subtitle: "Fast · Secure · Buyer protection",
    icon: (
      // PayPal P logo
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#003087">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
      </svg>
    ),
    activeColor: "text-blue-800",
    activeBg: "bg-blue-50",
    activeBorder: "border-blue-300",
  },
  {
    id: "sepa",
    label: "SEPA Direct Debit",
    subtitle: "Bank transfer · EUR · 1–5 days",
    icon: (
      // Bank/SEPA icon
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1a6b3c">
        <path d="M2 10h20v2H2v-2zm0 4h20v2H2v-2zM12 2L2 7h20L12 2zM4 18h2v3H4v-3zm6 0h2v3h-2v-3zm6 0h2v3h-2v-3z" />
      </svg>
    ),
    activeColor: "text-green-800",
    activeBg: "bg-green-50",
    activeBorder: "border-green-300",
  },
];

// ─── Checkout button config ────────────────────────────────────────────────────
const CHECKOUT_BUTTON: Record<PaymentMethod, { label: string; className: string; icon: React.ReactNode }> = {
  stripe: {
    label: "Pay with Card",
    className: "bg-orange-500 hover:bg-orange-600 text-white",
    icon: <CreditCard className="w-4 h-4" />,
  },
  klarna: {
    label: "Continue with Klarna",
    className: "bg-pink-400 hover:bg-pink-500 text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M5 3h3v18H5V3zm9 0c0 4.5-2 8-5 10l6.5 8H19l-6-7.5C15.5 11 16.5 7 16.5 3H14z" />
      </svg>
    ),
  },
  paypal: {
    label: "Pay with PayPal",
    className: "bg-[#003087] hover:bg-[#002060] text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
      </svg>
    ),
  },
  sepa: {
    label: "Continue with SEPA",
    className: "bg-green-700 hover:bg-green-800 text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
        <path d="M2 10h20v2H2v-2zm0 4h20v2H2v-2zM12 2L2 7h20L12 2zM4 18h2v3H4v-3zm6 0h2v3h-2v-3zm6 0h2v3h-2v-3z" />
      </svg>
    ),
  },
};

// ─── Info badges per payment method ───────────────────────────────────────────
const PAYMENT_INFO: Partial<Record<PaymentMethod, React.ReactNode>> = {
  klarna: (
    <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-700 leading-relaxed">
      <strong>Klarna note:</strong> Prices are charged in <strong>EUR</strong>. Your cart total will be converted automatically.
    </div>
  ),
  paypal: (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 leading-relaxed">
      <strong>PayPal:</strong> You&apos;ll be redirected to PayPal to complete your payment securely.
    </div>
  ),
  sepa: (
    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 leading-relaxed">
      <strong>SEPA Direct Debit:</strong> EUR only. Your bank account will be debited within <strong>1–5 business days</strong> after you authorize
      the mandate.
    </div>
  ),
};

// ─── RadioDot ─────────────────────────────────────────────────────────────────
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${
        selected ? "border-orange-500 bg-orange-500" : "border-gray-300 bg-white"
      }`}
    >
      {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
      router.push("/login?callbackUrl=/cart");
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

  const checkoutBtn = CHECKOUT_BUTTON[paymentMethod];

  return (
    <div className="w-full pb-10">
      <div className="w-full m-auto">
        {/* ── Header ── */}
        <div className="pb-8 pt-6">
          <h1 className="text-[38px] font-bold text-gray-900 leading-tight mb-2">Shopping Cart</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="text-[#55585b] hover:text-orange-500 transition-colors">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-[#a8acb0]" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-orange-500 font-semibold">Cart</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {cart.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-400 text-lg mb-4">Your cart is empty.</p>
            <Link href="/" className="px-6 py-2.5 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="lg:flex items-start gap-8">
            {/* ── Cart Table ── */}
            <div className="w-full lg:w-[65%] bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 text-left pl-6 text-xs font-semibold text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">Price</th>
                    <th className="py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">Qty</th>
                    <th className="py-4 text-center pr-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                      {/* Product cell */}
                      <td className="flex items-center gap-4 p-4">
                        <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                          <Image
                            src={(item?.images as Record<string, any>)[0]?.url || "/placeholder.png"}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm leading-snug mb-1">{item.title}</p>
                          <p className="text-xs text-gray-400 mb-1.5">{item?.shop?.name}</p>
                          {item?.selectedOptions && (
                            <div className="flex items-center gap-2">
                              {item.selectedOptions?.color && (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-gray-200 inline-block flex-shrink-0"
                                  style={{ backgroundColor: item.selectedOptions.color }}
                                />
                              )}
                              {item.selectedOptions?.size && (
                                <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[11px] font-medium border border-orange-100">
                                  {item.selectedOptions.size}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Price cell */}
                      <td className="text-center px-4">
                        {item.id === discountedProductId ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="line-through text-gray-300 text-xs">${item.salePrice.toFixed(2)}</span>
                            <span className="text-green-600 font-bold text-sm">${((item.salePrice * (100 - discountPercent)) / 100).toFixed(2)}</span>
                            <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">-{discountPercent}%</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-800 text-sm">${item.salePrice.toFixed(2)}</span>
                        )}
                      </td>

                      {/* Qty cell */}
                      <td className="text-center px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => decreaseQuantity(item.id)}
                            className="w-7 h-7 rounded-full border border-gray-200 bg-white hover:bg-orange-500 hover:border-orange-500 hover:text-white flex items-center justify-center transition-all"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => increaseQuantity(item.id)}
                            className="w-7 h-7 rounded-full border border-gray-200 bg-white hover:bg-orange-500 hover:border-orange-500 hover:text-white flex items-center justify-center transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Remove cell */}
                      <td className="text-center pr-4">
                        <button
                          onClick={() => removeFromCart(item?.id, user, location, deviceInfo)}
                          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors mx-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Footer row: Continue Shopping + SSL badge ── */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Continue shopping
                </Link>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Secure checkout · SSL encrypted
                </span>
              </div>
            </div>

            {/* ── Summary Panel ── */}
            <div className="w-full lg:w-[35%] space-y-4 mt-6 lg:mt-0">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 text-base mb-4">Order Summary</h3>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-green-600 font-medium">
                    <span>Discount ({discountPercent}%)</span>
                    <span>- ${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Subtotal</span>
                  <span className="text-gray-800 font-semibold">${subTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 my-3" />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${(subTotal - discountAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Have a coupon?
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code..."
                    className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                    onKeyDown={(e) => e.key === "Enter" && applyCouponCode()}
                  />
                  <button
                    onClick={applyCouponCode}
                    className="px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition"
                  >
                    Apply
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                {discountAmount > 0 && (
                  <p className="text-green-600 text-xs mt-2 font-medium">✓ Coupon applied — saving ${discountAmount.toFixed(2)}</p>
                )}
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Shipping Address</h3>
                {addresses.length === 0 ? (
                  <p className="text-xs text-gray-400">Please add an address from your profile first.</p>
                ) : (
                  <select
                    className="w-full text-sm p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition bg-white text-gray-800"
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
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Payment Method</h3>

                <div className="flex flex-col gap-2.5">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          isSelected ? `${method.activeBorder} ${method.activeBg}` : "border-transparent bg-gray-50 hover:border-gray-200"
                        }`}
                      >
                        {/* Icon badge */}
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                          {method.icon}
                        </div>
                        {/* Labels */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isSelected ? method.activeColor : "text-gray-800"}`}>{method.label}</p>
                          <p className="text-[11px] text-gray-400">{method.subtitle}</p>
                        </div>
                        {/* Radio dot */}
                        <RadioDot selected={isSelected} />
                      </button>
                    );
                  })}
                </div>

                {/* Info badge for the selected method */}
                {PAYMENT_INFO[paymentMethod]}
              </div>

              {/* Checkout Button */}
              <button
                onClick={createPaymentSession}
                disabled={loading || addresses.length === 0}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${checkoutBtn.className}`}
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : checkoutBtn.icon}
                {loading ? "Redirecting..." : checkoutBtn.label}
              </button>

              {/* T&C note */}
              <p className="text-center text-xs text-gray-400">
                By placing your order you agree to our{" "}
                <Link href="/terms" className="underline hover:text-orange-500 transition-colors">
                  Terms &amp; Conditions
                </Link>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
