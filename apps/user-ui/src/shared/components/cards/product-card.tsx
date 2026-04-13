"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { Eye, Heart, ShoppingCart, Star, StarHalf } from "lucide-react";
import ProductDetailsCard from "./product-details-card";
import { useCartStore } from "@/store";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import useUser from "@/hooks/useUser";

interface Props {
  product: any;
  isEvent?: boolean;
}

export default function ProductCard({ product, isEvent }: Props) {
  const [timeLeft, setTimeLeft] = useState("");
  const [open, setOpen] = useState(false);

  const { addToCart, addToWishlist, removeFromWishlist, wishList, isInCart } = useCartStore();
  const isWishlisted = wishList.some((item) => item.id === product.id);
  const isColorSelected = product?.colors?.[0] || "";
  const isSizeSelected = product?.sizes?.[0] || "";

  const { location } = useLocationTracking();
  const { deviceInfo } = useDeviceTracking();
  const { user } = useUser();

  const reviewRating = product?.reviewRating ?? 0;
  const reviewCount = product?.reviewCount ?? 0;
  const hasDiscount = product?.regularPrice > product?.salePrice;

  const badge = isEvent
    ? "Sale"
    : product?.totalSales > 50
    ? "Best Seller"
    : product?.createdAt && Date.now() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    ? "New"
    : null;

  useEffect(() => {
    if (!isEvent || !product?.endingDate) return;
    const interval = setInterval(() => {
      const diff = new Date(product.endingDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      setTimeLeft(`${d}d ${h}h ${m}m left`);
    }, 60000);
    return () => clearInterval(interval);
  }, [isEvent, product?.endingDate]);

  function handleAddToCart() {
    if (!isInCart(product?.id)) {
      addToCart({ ...product, quantity: 1, selectedOptions: { color: isColorSelected, size: isSizeSelected } }, user, location, deviceInfo);
      toast.success("Product was added to Cart");
    }
  }

  // Correct star rendering: full, half, empty based on decimal rating
  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => {
      const index = i + 1;
      if (rating >= index) {
        return <Star key={i} size={15} className="fill-amber-400 text-amber-400" />;
      } else if (rating >= index - 0.5) {
        return (
          <span key={i} className="relative" style={{ width: 15, height: 15, display: "inline-block" }}>
            <Star size={15} className="absolute inset-0 text-gray-300" />
            <StarHalf size={15} className="absolute inset-0 fill-amber-400 text-amber-400" />
          </span>
        );
      } else {
        return <Star key={i} size={15} className="text-gray-300" />;
      }
    });
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm">
      {/* Image area */}
      <div className="relative">
        {/* Badge — top left */}
        {badge && (
          <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-orange-500 text-white">{badge}</span>
        )}
        {product?.stock <= 5 && (
          <span
            className="absolute z-10 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-yellow-400 text-yellow-900"
            style={{ top: badge ? "2.5rem" : "0.75rem", left: "0.75rem" }}
          >
            Limited Stock
          </span>
        )}

        <Link href={`/product/${product?.slug}`}>
          <Image
            src={product?.images?.[0]?.url || "/placeholder.png"}
            alt={product?.title}
            width={400}
            height={260}
            className="w-full h-[260px] object-cover"
          />
        </Link>

        {/* Wishlist — top right */}
        <button
          onClick={() =>
            isWishlisted
              ? removeFromWishlist(product.id, user, location, deviceInfo)
              : addToWishlist({ ...product, quantity: 1 }, user, location, deviceInfo)
          }
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
        >
          <Heart size={18} fill={isWishlisted ? "#ef4444" : "transparent"} stroke={isWishlisted ? "#ef4444" : "#9ca3af"} />
        </button>

        {/* Eye preview — middle right */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
        >
          <Eye size={18} className="text-gray-400" />
        </button>

        {/* Cart — bottom right, orange */}
        <button
          onClick={handleAddToCart}
          disabled={isInCart(product.id)}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: isInCart(product.id) ? "#d1d5db" : "#f97316" }}
        >
          <ShoppingCart size={18} className="text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 flex flex-col gap-1 flex-1" style={{ background: "#f9f9f7" }}>
        {/* Shop name */}
        <Link href={`/shop/${product?.shop?.id}`} className="text-[13px] font-semibold text-green-600 hover:underline truncate">
          {product?.shop?.name}
        </Link>

        {/* Product title */}
        <Link href={`/product/${product?.slug}`}>
          <h3 className="text-[15px] font-semibold text-gray-900 line-clamp-2 leading-snug hover:text-gray-600 transition-colors">
            {product?.title}
          </h3>
        </Link>

        {/* Stars + rating number + review count */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex items-center gap-[2px]">{renderStars(reviewRating)}</div>
          {reviewRating > 0 && <span className="text-[13px] font-medium text-gray-700">{reviewRating.toFixed(1)}</span>}
          {reviewCount > 0 && <span className="text-[13px] text-gray-400">({reviewCount})</span>}
        </div>

        {/* Price row + sold count */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-bold text-gray-900">${product?.salePrice?.toFixed(2)}</span>
            {hasDiscount && <span className="text-[13px] text-gray-400 line-through">${product?.regularPrice?.toFixed(2)}</span>}
          </div>
          {product?.totalSales > 0 && <span className="text-[13px] font-medium text-green-500">{product.totalSales} sold</span>}
        </div>

        {/* Event countdown */}
        {isEvent && timeLeft && <span className="mt-1 text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded font-medium w-fit">{timeLeft}</span>}
      </div>

      {open && <ProductDetailsCard product={product} setOpen={setOpen} />}
    </div>
  );
}
