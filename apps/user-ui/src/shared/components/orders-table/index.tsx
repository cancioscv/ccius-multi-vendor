"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { ArrowUpRight, UserStar } from "lucide-react";
import Image from "next/image";
import { Button } from "@e-com/ui";

export default function OrdersTable() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/order/api/user-orders`);
      return res.data.orders;
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: (info: any) => info.getValue()?.slice(-6),
    },
    {
      accessorKey: "shop",
      header: "Product",
      cell: ({ row }: any) => {
        return (
          <Image
            src={row.original.items[0].product?.images[0]?.url || "/placeholder.png"}
            alt={row.original.items[0].product?.title || "Product image"}
            height={20}
            width={20}
            className="w-16 h-16 object-cover rounded-md border border-gray-200"
          />
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
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
      accessorKey: "total",
      header: "Total ($)",
      cell: (info: any) => `$${info.getValue()?.toFixed(2)}`,
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: (info: any) => new Date(info.getValue())?.toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-6">
          <Button
            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex gap-2"
            onClick={() => router.push(`/review/${row.original.items[0].productId}`)}
          >
            <UserStar size={18} /> Write Review
          </Button>
          <button onClick={() => router.push(`/order/${row.original.id}`)} className="text-blue-600 hover:underline text-xs flex items-center gap-1">
            Track Order <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <p className="text-sm text-gray-600">Loading orders...</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-b-gray-200 text-left">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="py-2 px-3 font-semibold text-gray-700">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-b-gray-200 hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="py-2 px-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data?.length === 0 && <p className="text-center h-[30vh] items-center flex justify-center">No orders available yet!</p>}
    </div>
  );
}
