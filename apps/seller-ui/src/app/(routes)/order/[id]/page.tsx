"use client";

import axiosInstance from "@/utils/axiosInstance";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FLAT = "FLAT",
}
const deliveryStatuses = ["ORDERED", "PACKED", "SHIPPED", "OUT_OF_DELIVERY", "DELIVERED"]; // TODO: Refactore
// const deliveryStatuses = [
//   { label: "Ordered", value: "ORDERED"},
//   { label: "Packed", value: "PACKED"},
//   { label: "Shipped", value: "SHIPPED"},
//   { label: "Out of Delivery", value: "OUT_OF_DELIVERY"},
//   { label: "Delivered", value: "DELIVERED"},
// ]

export default function OrderDetails() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  async function getOrderDetails() {
    try {
      const res = await axiosInstance.get(`/order/api/order-details/${orderId}`);
      setOrder(res.data.order);
    } catch (err) {
      setLoading(false);
      console.error("Failed to fetch order details", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeliveryStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await axiosInstance.put(`/order/api/update-delivery-status/${order.id}`, {
        deliveryStatus: newStatus,
      });
      setOrder((prev: any) => ({ ...prev, deliveryStatus: newStatus }));
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    if (orderId) {
      getOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[40vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-sm text-red-500">Order not found.</p>;
  }
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="my-4">
        <span className="text-white flex items-center gap-2 font-semibold cursor-pointer" onClick={() => router.push("/dashboard/orders")}>
          <ArrowLeft />
          Go Back to Dashboard
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-200 mb-4">Order #{order.id.slice(-6)}</h1>

      {/* Status Selector */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-300 mr-3">Update Delivery Status:</label>
        <select
          value={order.deliveryStatus}
          onChange={handleDeliveryStatusChange}
          disabled={updating}
          className="border bg-transparent text-gray-200 border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          {deliveryStatuses.map((status) => {
            const currentIndex = deliveryStatuses.indexOf(order.deliveryStatus);
            const statusIndex = deliveryStatuses.indexOf(status);

            return (
              <option key={status} value={status} disabled={statusIndex < currentIndex}>
                {status}
              </option>
            );
          })}
        </select>
      </div>

      {/* Delivery Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
          {deliveryStatuses.map((step, index) => {
            const current = step === order.deliveryStatus;
            const passed = deliveryStatuses.indexOf(order.deliveryStatus) >= index;
            return (
              <div key={step} className={`flex-1 text-left ${current ? "text-blue-600" : passed ? "text-green-600" : "text-gray-400"}`}>
                {step}
              </div>
            );
          })}
        </div>
        <div className="flex items-center">
          {deliveryStatuses.map((step, index) => {
            const reached = index <= deliveryStatuses.indexOf(order.deliveryStatus);
            return (
              <div key={step} className="flex-1 flex items-center">
                <div className={`w-4 h-4 rounded-full ${reached ? "bg-blue-600" : "bg-gray-300"}`} />
                {index !== deliveryStatuses.length - 1 && <div className={`flex-1 h-1 ${reached ? "bg-blue-500" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Info */}
      <div className="mb-6 space-y-1 text-sm text-gray-200">
        <p>
          <span className="font-semibold">Payment Status:</span> <span className="text-green-600 font-medium">{order.paymentStatus}</span>
        </p>
        <p>
          <span className="font-semibold">Total Paid:</span> <span className="font-medium">${order.total.toFixed(2)}</span>
        </p>

        {order.discountAmount > 0 && (
          <p>
            <span className="font-semibold">Discount Applied:</span>{" "}
            <span className="text-green-400">
              -${order.discountAmount.toFixed(2)} (
              {order.couponCode?.discountType === DiscountType.PERCENTAGE
                ? `${order.couponCode.discountValue}%`
                : `$${order.couponCode.discountValue}`}{" "}
              off)
            </span>
          </p>
        )}

        {order.couponCode && (
          <p>
            <span className="font-semibold">Coupon Used:</span> <span className="text-blue-400">{order.couponCode.publicName}</span>
          </p>
        )}

        <p>
          <span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="mb-6 text-sm text-gray-300">
          <h2 className="text-md font-semibold mb-2">Shipping Address</h2>
          <p>{order.shippingAddress.name}</p>
          <p>
            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.zip}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div key={item.productId} className="border border-gray-200 rounded-md p-4 flex items-center gap-4">
              <img
                src={item.product?.images[0]?.url || "/placeholder.png"}
                alt={item.product?.title || "Product image"}
                className="w-16 h-16 object-cover rounded-md border border-gray-200"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-200">{item.product?.title || "Unnamed Product"}</p>
                <p className="text-sm text-gray-300">Quantity: {item.quantity}</p>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {Object.entries(item.selectedOptions).map(
                      ([key, value]: [string, any]) =>
                        value && (
                          <span key={key} className="mr-3">
                            <span className="font-medium capitalize">{key}:</span> {value}
                          </span>
                        )
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-200">${item.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
