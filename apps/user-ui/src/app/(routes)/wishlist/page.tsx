"use client";

import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import { useCartStore } from "@/store";
import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function WishlistPage() {
  const { user } = useUser();
  const { deviceInfo } = useDeviceTracking();
  const { location } = useLocationTracking();

  const { wishList, removeFromWishlist, addToCart } = useCartStore();

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
        selectedOptions: { color: item?.colors?.[0] || "", size: item.sizes[0] || "" },
      },
      user,
      location,
      deviceInfo
    );
  }
  return (
    <div className="w-full bg-white">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        {/* Breadcrumbs */}
        <div className="pb-[50px]">
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-jost">Wishlist</h1>
          <Link href={"/"} className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">Wishlist</span>
        </div>

        {/* If wishlist is empty */}
        {wishList.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">Your wishlist is empty. Start adding products.</div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Wishlist items table */}
            <table className="w-full border-collapse">
              <thead className="bg-[#f1f3f4]">
                <tr>
                  <th className="py-3 text-left pl-4">Product</th>
                  <th className="py-3 text-left">Price</th>
                  <th className="py-3 text-left">Quantity</th>
                  <th className="py-3 text-left">Action</th>
                  <th className="py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {wishList?.map((item) => (
                  <tr key={item.id} className="border-b border-b-[#0000000e]">
                    <td className="flex items-center gap-3 p-4">
                      <Image
                        src={(item?.images as Record<string, any>)[0]?.url || "/placeholder.png"}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="rounded"
                      />
                      <span>{item.title}</span>
                    </td>
                    <td className="px-6 text-lg">${item?.salePrice.toFixed(2)}</td>
                    <td>
                      <div className="flex justify-center itms-center border border-gray-200 rounded-[20px] w-[90px] p-[2px]">
                        <button className="text-black cursor-pointer text-xl" onClick={() => decreaseQuantity(item.id)}>
                          <Minus size={16} />
                        </button>
                        <span className="px-4">{item?.quantity}</span>
                        <button className="text-black cursor-pointer text-xl" onClick={() => increaseQuantity(item.id)}>
                          <Plus size={16} />
                        </button>
                      </div>
                    </td>

                    <td>
                      <button
                        disabled={item.stock === 0}
                        className="bg-[#2295FF] cursor-öpointer text-white px-5 py-2 rounded-md hover:bg-[#007bff] transition-all"
                        onClick={() => handleAddToCart(item)}
                      >
                        Add to Cart
                      </button>
                    </td>
                    <td>
                      <button
                        className="text-[#818487] cursor-pointer hover:text-[#ff1826] transition duration-200 flex"
                        onClick={() => removeFromWishlist(item.id as string, user, location, deviceInfo)}
                      >
                        <span className="flex items-center gap-1">
                          <X size={14} /> Remove
                        </span>
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
