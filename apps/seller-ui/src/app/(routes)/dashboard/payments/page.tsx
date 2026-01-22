"use client";

import Breadcrumbs from "@/shared/components/breadcrumbs";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

async function getOrders() {
  const res = await axiosInstance.get("/order/api/seller-orders");
  return res.data.orders;
}

// TODO: pass this dynamic path to detail order page
function getPathSegment(path: string) {
  const paths = path.split("/");
  const filteredPaths = paths.filter((segment) => segment.length > 0);
  return filteredPaths.pop();
}
export default function PaymentsPage() {
  const [globalFilter, setGlobalFilter] = useState("");

  const pathname = usePathname();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: getOrders,
    staleTime: 1000 * 60 * 5,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Order ID",
        cell: ({ row }: any) => <span className="text-white text-sm">#{row.original.id.slice(-6).toUpperCase()}</span>,
      },
      {
        accessorKey: "user.name",
        header: "Buyer",
        cell: ({ row }: any) => <span className="text-white">{row.original.user?.name || "Guest"}</span>,
      },
      {
        header: "Seller Earning",
        cell: ({ row }: any) => {
          const sellerShare = row.original.total * 0.9;
          return <span className="text-green-400 font-medium">${sellerShare.toFixed(2)}</span>;
        },
      },
      {
        header: "Admin Fee",
        cell: ({ row }: any) => {
          const adminFee = row.original.total * 0.1;
          return <span className="text-yellow-400">${adminFee.toFixed(2)}</span>;
        },
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment Status",
        cell: ({ row }: any) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.original.paymentStatus === "PAID" ? "bg-green-600 text-white" : "bg-yellow-500 text-white"
            }`}
          >
            {row.original.paymentStatus}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }: any) => {
          const date = new Date(row.original.createdAt).toLocaleDateString();
          return <span className="text-white text-sm">{date}</span>;
        },
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <Link href={`/order/${row.original.id}`} className="text-blue-400 hover:text-blue-300 transition">
            <Eye size={18} />
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });
  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">Payments</h2>
      <Breadcrumbs title="Payments" />

      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search payments..."
          className="w-full bg-transparent text-white outline-none"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading payments...</p>
        ) : (
          <table className="w-full text-white text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-800">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 text-left">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-800 hover:bg-gray-900 transition">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
