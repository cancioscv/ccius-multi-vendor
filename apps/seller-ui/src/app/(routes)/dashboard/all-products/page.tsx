"use client";

import DeleteProductModal from "@/shared/components/modals/delete-product";
import ProductAnalyticsModal from "@/shared/components/modals/product-analytics";
import axiosInstance from "@/utils/axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";

import { Search, Pencil, Trash2, Eye, Plus, BarChart, Star, ChevronRight, ArchiveRestore } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

async function fetchProducts() {
  const res = await axiosInstance.get("/product/api/shop-products");
  return res?.data?.products;
}

async function deleteProduct(productId: string) {
  return await axiosInstance.delete(`/product/api/delete-product/${productId}`);
}

async function restoreProduct(productId: string) {
  return await axiosInstance.put(`/product/api/restore-product/${productId}`);
}

export default function SellerProductsPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>();

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["seller-products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      setShowDeleteModal(false);
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      setShowDeleteModal(false);
    },
  });

  const columns = useMemo(() => {
    return [
      {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }: any) => (
          <Image
            src={row.original.images[0]?.url || "/placeholder.png"}
            alt={row.original.images[0]?.url || ""}
            width={200}
            height={200}
            className="w-12 h-12 rounded-md object-cover"
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Product Name",
        cell: ({ row }: any) => {
          const truncatedTitle = row.original.title.length > 25 ? `${row.original.title.substring(0, 25)}...` : row.original.title;

          return (
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="text-blue-400 hover:underline"
              title={row.original.title}
            >
              {truncatedTitle}
            </Link>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }: any) => <span>${row.original.salePrice}</span>,
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }: any) => <span className={row.original.stock < 10 ? "text-red-500" : "text-white"}>{row.original.stock}</span>,
      },
      {
        accessorKey: "category",
        header: "Category",
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-1 text-yellow-400">
            <Star fill="#FDE047" size={18} /> <span className="text-white">{row.original.ratings || 5}</span>
          </div>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex gap-3">
            {/* TODO: Add Tooltips to icons */}
            <Link href={`/product/${row.original.id}`} className="text-blue-400 hover:text-blue-300 transition">
              <Eye size={18} />
            </Link>
            <Link href={`/product/edit/${row.original.id}`} className="text-yellow-400 hover:text-yellow-300 transition">
              <Pencil size={18} />
            </Link>
            <button className="text-green-400 hover:text-green-300 transition" onClick={() => openAnalytics(row.original)}>
              <BarChart size={18} />
            </button>
            {row.original.isDeleted ? (
              <button className="text-green-400 hover:text-green-300 transition" onClick={() => openDeleteModal(row.original)}>
                <ArchiveRestore size={18} />
              </button>
            ) : (
              <button className="text-red-400 hover:text-red-300 transition" onClick={() => openDeleteModal(row.original)}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ),
      },
    ];
  }, []);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  function openAnalytics(product: any) {
    setAnalyticsData(product);
    setShowAnalytics(true);
  }

  function openDeleteModal(product: any) {
    setShowDeleteModal(true);
    setSelectedProduct(product);
  }

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">All Products</h2>
        <Link
          href="/dashboard/create-product"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
        >
          <Plus size={18} className="mr-2" /> Add Product
        </Link>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center mb-4">
        <Link href={"/dashboard"} className="text-blue-400 cursor-pointer">
          Dashboard
        </Link>
        <ChevronRight size={20} className="text-gray-200" />
        <span className="text-white">All Products</span>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search products..."
          className="w-full bg-transparent text-white outline-none"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading products...</p>
        ) : (
          <table className="w-full text-white">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-800">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 text-left">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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

        {!isLoading && products?.length === 0 && <p className="text-center py-3 text-white">No products found!</p>}

        {/* Analytics Modal */}
        {showAnalytics && <ProductAnalyticsModal product={analyticsData} onClose={() => setShowAnalytics(false)} />}

        {showDeleteModal && (
          <DeleteProductModal
            product={selectedProduct}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => deleteMutation.mutate(selectedProduct?.id)}
            onRestore={() => restoreMutation.mutate(selectedProduct?.id)}
          />
        )}
      </div>
    </div>
  );
}
