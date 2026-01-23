"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  product: any;
}
export default function ProductCard({ product }: Props) {
  // Calculate Discount
  const regularPrice = product?.regularPrice || 0;
  const salePrice = product?.salePrice || 0;
  const discount = regularPrice > 0 ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  // Format the starting and ending dates
  const startingDate = product?.startingDate ? new Date(product.startingDate).toLocaleDateString() : null;
  const endingDate = product?.endingDate ? new Date(product.endingDate).toLocaleDateString() : null;
  const images = product?.images.length === 0 ? "/placeholder.png" : product?.images?.[0].url;
  return (
    <div className="w-full min-h-[350px] p-3 bg-slate-700 rounded-lg shadow-md hover:shadow-lg transition duration-300">
      {/* Product Image */}
      <Link href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${product?.slug}`} className="block">
        <div className="relative w-full h-[200px] rounded-md overflow-hidden">
          <Image src={images} layout="fill" objectFit="cover" alt={product?.title} className="hover:scale-105 transition duration-300 bg-black" />
        </div>
      </Link>

      {/* Product Details */}
      <div className="mt-3">
        {/* Product Title */}
        <Link href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${product?.slug}`} className="block mt-1">
          <h3 className="text-md font-semibold text-white truncate">{product?.title}</h3>
        </Link>

        {/* Rating Section */}
        <div className="flex items-center gap-1 text-yellow-400 mt-2">
          <Star fill="#facc15" size={18} />
          <span className="text-sm">{product?.ratings ? product?.ratings.toFixed(1) : "No Ratings Yet"}</span>
        </div>

        {/* Pricing Section */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">${product?.salePrice}</span>
            <span className="text-sm text-gray-400 line-through">${product?.regularPrice}</span>
            {/* Discount Badge (only if discount > 0) */}
            {discount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-md">{discount}% OFF</span>}
          </div>
        </div>

        {/* Event Dates */}
        {startingDate && endingDate && (
          <div className="text-sm text-gray-300 mt-2">
            <p>
              Offer Running: {startingDate} - {endingDate}
            </p>
          </div>
        )}

        {/* Sold Count */}
        <div className="text-sm text-green-400 mt-1">{product?.sold > 0 ? `${product?.sold} Sold` : "Not Sold Yet"}</div>

        {/* View Details Button */}
        <Link
          href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${product?.slug}`}
          className="mt-3 block bg-blue-600 text-center text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
