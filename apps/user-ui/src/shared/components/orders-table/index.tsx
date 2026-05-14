"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState, useMemo } from "react";

// Payment status badge styles
const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  AUTHORIZED: "bg-purple-100 text-purple-700",
  REFUNDED: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// Delivery / order status badge styles
const ORDER_STATUS_STYLES: Record<string, string> = {
  ORDERED: "bg-blue-50 text-blue-600",
  PACKED: "bg-indigo-50 text-indigo-600",
  SHIPPED: "bg-sky-100 text-sky-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-600",
  DELIVERED: "bg-green-100 text-green-700",
};

// Human-readable label for delivery status
const ORDER_STATUS_LABELS: Record<string, string> = {
  ORDERED: "Ordered",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

const PAGE_SIZE = 8;

export default function OrdersTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/order/api/user-orders`);
      return res.data.orders;
    },
  });

  const allOrders: any[] = data || [];

  // Collect unique payment statuses for the filter dropdown
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    allOrders.forEach((o) => set.add(o.paymentStatus));
    return Array.from(set);
  }, [allOrders]);

  // Filter by search + payment status
  const filtered = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items?.[0]?.product?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All statuses" || order.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allOrders, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  }

  if (isLoading) return <p className="text-sm text-gray-500 py-8 text-center">Loading orders...</p>;

  return (
    <div>
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#e07b39] transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#e07b39] bg-white text-gray-700 min-w-[140px]"
        >
          <option>All statuses</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Order ID</th>
              <th className="py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Product</th>
              <th className="py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Payment Status</th>
              {/* ✅ New column */}
              <th className="py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Order Status</th>
              <th className="py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Total</th>
              <th className="py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
              <th className="py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                  No orders found.
                </td>
              </tr>
            ) : (
              paginated.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  {/* Order ID */}
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs">#{order.id?.slice(-6)}</td>

                  {/* Product thumbnail */}
                  <td className="py-3 px-4">
                    <Image
                      src={order.items?.[0]?.product?.images?.[0]?.url || "/placeholder.png"}
                      alt={order.items?.[0]?.product?.title || "Product"}
                      height={48}
                      width={48}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                    />
                  </td>

                  {/* Payment status badge */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        PAYMENT_STATUS_STYLES[order.paymentStatus] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>

                  {/* ✅ Order (delivery) status badge */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ORDER_STATUS_STYLES[order.deliveryStatus] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 font-semibold text-gray-800">${order.total?.toFixed(2)}</td>

                  {/* Date */}
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => router.push(`/order/${order.id}`)}
                      className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-[#fbf0e9] transition-colors hover:border-[#fbf0e9] hover:text-orange-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Order
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-xs text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-600">
              {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-gray-600">{filtered.length}</span> orders
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 rounded-lg border text-xs font-semibold transition ${
                  currentPage === page ? "bg-[#e07b39] border-[#e07b39] text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
