"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Package, Truck, MapPin, CheckCircle2, ShoppingBag, Download, MessageCircle, CreditCard, Star, Clock } from "lucide-react";

const ORDER_STEPS = [
  { key: "ORDERED", label: "Ordered", Icon: ShoppingBag },
  { key: "PACKED", label: "Packed", Icon: Package },
  { key: "SHIPPED", label: "Shipped", Icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", Icon: MapPin },
  { key: "DELIVERED", label: "Delivered", Icon: CheckCircle2 },
];

const STATUS_ORDER = ["ORDERED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  REFUNDED: "bg-purple-100 text-purple-700 border-purple-200",
};

// ─── Review button — fetches its own review state independently ───────────────
// This is the key fix: instead of relying on the review data embedded in the
// order payload (which is stale after the user submits a review and navigates
// back), each button queries /product/api/review/:productId fresh on mount.
// The queryKey ["reviews", productId] is the same key used by the review page
// and by ReviewForm, so React Query's cache is already warm when the user
// navigates back — no extra network request in the happy path.
function ReviewButton({ productId, orderId, deliveryStatus }: { productId: string; orderId: string; deliveryStatus: string }) {
  const router = useRouter();
  const isDelivered = deliveryStatus === "DELIVERED";

  // Fetch this user's own review for this product.
  // staleTime: 0 ensures we always revalidate when this component mounts,
  // so navigating back from the review page picks up the newly created review.
  const { data: reviewData, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/product/api/review/${productId}`);
      return res.data.review ?? null;
    },
    enabled: isDelivered, // no point fetching if order not delivered
    staleTime: 0, // always revalidate on mount — catches reviews just written
  });

  const reviewUrl = `/review/${productId}?orderId=${orderId}`;

  if (!isDelivered) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 cursor-not-allowed select-none">
        <Clock className="w-3.5 h-3.5" />
        Review available after delivery
      </div>
    );
  }

  // While the review check is in-flight, show a neutral placeholder
  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 select-none">
        <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  if (reviewData) {
    // User already has a review for this product
    return (
      <div className="flex flex-col items-end gap-0.5">
        <button
          onClick={() => router.push(reviewUrl)}
          className="flex items-center gap-1 text-xs text-white bg-[#e07b39] border border-[#e07b39] rounded-lg px-2.5 py-1.5 hover:bg-[#c96a2a] transition"
        >
          <Star className="w-3.5 h-3.5" /> Edit Review
        </button>
        <span className="text-[10px] text-gray-400">
          Reviewed on{" "}
          {new Date(reviewData.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    );
  }

  // Delivered, no review yet
  return (
    <button
      onClick={() => router.push(reviewUrl)}
      className="flex items-center gap-1 text-xs text-white bg-[#e07b39] border border-[#e07b39] rounded-lg px-2.5 py-1.5 hover:bg-[#c96a2a] transition"
    >
      <Star className="w-3.5 h-3.5" /> Write Review
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/order/api/order-details/${orderId}`);
      return res.data.order;
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#e07b39] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Order not found.</p>
          <Link href="/profile?active=My+Orders" className="text-[#e07b39] text-sm hover:underline">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_ORDER.indexOf(order.deliveryStatus);
  const subtotal = order.items?.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) ?? order.total;
  const shipping = order.total - subtotal > 0 ? order.total - subtotal : 5;
  const tax = 0;

  return (
    <div className="min-h-screen bg-[#f5f5f0] py-6">
      <div className="mx-auto">
        {/* Back */}
        <button
          onClick={() => router.push("/profile?active=My+Orders")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        {/* Order Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Order</p>
              <h1 className="text-2xl font-bold text-gray-900 font-mono">#{order.id?.slice(-6)}</h1>
              <p className="text-sm text-gray-400 mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                · {order.items?.length ?? 0} items
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Payment status badge */}
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  PAYMENT_STATUS_STYLES[order.paymentStatus] || "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {order.paymentStatus}
              </span>
              {/* Invoice button */}
              <button className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                <Download className="w-4 h-4" /> Invoice
              </button>
              {/* Contact seller */}
              <button className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                <MessageCircle className="w-4 h-4" /> Contact seller
              </button>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="mt-8 px-2">
            <div className="relative flex items-center justify-between">
              {/* Progress line background */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              {/* Progress line fill */}
              <div
                className="absolute top-5 left-0 h-0.5 bg-[#e07b39] z-0 transition-all duration-500"
                style={{
                  width: currentStepIndex === -1 ? "0%" : `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%`,
                }}
              />
              {ORDER_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isActive = index === currentStepIndex;
                const StepIcon = step.Icon;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                        isCompleted || isActive ? "bg-[#e07b39] border-[#e07b39]" : "bg-white border-gray-200"
                      }`}
                    >
                      <StepIcon className={`w-4 h-4 ${isCompleted || isActive ? "text-white" : "text-gray-300"}`} />
                    </div>
                    <span
                      className={`text-xs font-medium text-center max-w-[60px] leading-tight ${
                        isCompleted || isActive ? "text-[#e07b39]" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Grid: Items + Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Order Items */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-start gap-4 border-t border-gray-100 pt-2.5 pb-2">
                  <Image
                    src={item.product?.images?.[0]?.url || "/placeholder.png"}
                    alt={item.product?.title || "Product"}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.product?.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.product?.shop?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qty: {item.quantity}
                      {item.selectedOptions?.size && ` · Size: ${item.selectedOptions.size}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-gray-900 text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    {/* ✅ Each ReviewButton fetches its own fresh review state */}
                    <ReviewButton productId={item.productId} orderId={order.id} deliveryStatus={order.deliveryStatus} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Summary + Address + Payment */}
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Shipping Address</h3>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-800">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.zip} {order.shippingAddress.city}, {order.shippingAddress.country}
                  </p>
                  {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Payment</h3>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-6 bg-blue-100 rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">{order.paymentMethod || "Card"} ···· ****</p>
                  <p className="text-xs text-gray-400">
                    Paid on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
