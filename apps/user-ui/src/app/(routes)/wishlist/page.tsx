"use client";

import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import { useCartStore } from "@/store";
import { Heart, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@e-com/ui";

export default function WishlistPage() {
  const { user } = useUser();
  const { deviceInfo } = useDeviceTracking();
  const { location } = useLocationTracking();

  const { wishList, removeFromWishlist, addToCart, isInCart } = useCartStore();

  function decreaseQuantity(id: string | undefined) {
    useCartStore.setState((state: any) => ({
      wishList: state.wishList.map((item: any) => (item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item)),
    }));
  }

  function increaseQuantity(id: string | undefined) {
    useCartStore.setState((state: any) => ({
      wishList: state.wishList.map((item: any) => (item.id === id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item)),
    }));
  }

  function handleAddToCart(item: any) {
    addToCart(
      {
        ...item,
        selectedOptions: {
          color: item?.colors?.[0] || "",
          size: item.sizes?.[0] || "",
        },
      },
      user,
      location,
      deviceInfo
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="w-full m-auto">
        {/* ── Header ── */}
        <div className="pb-8 pt-6">
          <h1 className="text-[38px] font-bold text-gray-900 leading-tight mb-2">Wishlist</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="text-gray-500 hover:text-orange-500 transition-colors">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-orange-500 font-semibold">Wishlist</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ── Empty state ── */}
        {wishList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <Heart className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-400 text-lg mb-4">Your wishlist is empty.</p>
            <Link href="/products" className="px-6 py-2.5 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pl-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">Product</th>
                  <th className="py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">Price</th>
                  <th className="py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">Quantity</th>
                  <th className="py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">Action</th>
                  <th className="py-4 pr-6 text-xs font-semibold text-gray-400 uppercase tracking-widest" />
                </tr>
              </thead>
              <tbody>
                {wishList.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                    {/* Product */}
                    <td className="flex items-center gap-4 p-4 pl-6">
                      <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                        <Image
                          src={(item?.images as Record<string, any>)[0]?.url || "/placeholder.png"}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm leading-snug mb-0.5">{item.title}</p>
                        {/* Color + size badges if available */}
                        <div className="flex items-center gap-2 mt-1">
                          {item?.colors?.[0] && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-200 inline-block flex-shrink-0"
                              style={{ backgroundColor: item.colors[0] }}
                            />
                          )}
                          {item?.sizes?.[0] && (
                            <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[11px] font-medium border border-orange-100">
                              {item.sizes[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="text-center px-4">
                      <span className="font-semibold text-gray-800 text-sm">${item?.salePrice.toFixed(2)}</span>
                    </td>

                    {/* Quantity */}
                    <td className="text-center px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="w-7 h-7 rounded-full border border-gray-200 bg-white hover:bg-orange-500 hover:border-orange-500 hover:text-white flex items-center justify-center transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-gray-800">{item?.quantity ?? 1}</span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="w-7 h-7 rounded-full border border-gray-200 bg-white hover:bg-orange-500 hover:border-orange-500 hover:text-white flex items-center justify-center transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Add to Cart */}
                    <td className="text-center px-4">
                      <button
                        disabled={item.stock === 0 || isInCart(item.id)}
                        onClick={() => handleAddToCart(item)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          isInCart(item.id)
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : item.stock === 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-orange-500 hover:bg-orange-600 text-white"
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {isInCart(item.id) ? "In Cart" : "Add to Cart"}
                      </button>
                    </td>

                    {/* Remove */}
                    <td className="text-center pr-6">
                      <button
                        onClick={() => removeFromWishlist(item.id as string, user, location, deviceInfo)}
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
