"use client";

import { HeartIcon, Search, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import HeaderBottom from "./header-bottom";
import useUser from "@/hooks/useUser";
import { useCartStore } from "@/store";
import useLayout from "@/hooks/useLayout";
import { useState } from "react";
import Image from "next/image";
import axiosInstance from "@/utils/axiosInstance";

export default function Header() {
  const { user, isLoading } = useUser();
  const { cart, wishList } = useCartStore();
  const { layout } = useLayout();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoadingSuggestions(true);

    try {
      const res = await axiosInstance.get(`/product/api/search-products?q=${encodeURIComponent(searchQuery)}`);
      setSuggestions(res.data.products.slice(0, 10));
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  return (
    <div className="w-full bg-white">
      <div className="w-[80%] py-5 m-auto flex items-center justify-between">
        <div>
          <Link href="/">
            <Image src={layout?.logo || "/placeholder.png"} alt="" width={300} height={100} className="h-[70px] ml-[-50px] mb-[-30px] object-cover" />
          </Link>
        </div>
        {/* Search input */}
        <div className="w-[50%] relative">
          <input
            type="text"
            value={searchQuery}
            placeholder="Search for products..."
            className="w-full px-4 font-Poppins font-medium border-[2.5px] border-gray-500 outline-none h-[55px]"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div
            className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-gray-500 absolute top-0 right-0"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4" color="white" />
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute w-full top-[60px] bg-white border border-gray-200 shadow-md z-50 max-h-[300px] overflow-y-auto">
              {suggestions.map((item) => (
                <Link
                  href={`/product/${item.slug}`}
                  key={item.id}
                  onClick={() => {
                    setSuggestions([]);
                    setSearchQuery("");
                  }}
                  className="block px-4 py-2 text-sm hover:bg-blue-50 text-gray-800"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          )}
          {loadingSuggestions && (
            <div className="absolute w-full top-[60px] bg-white border border-gray-200 shadow-md z-50 px-4 py-3 text-sm text-gray-500">
              Searching...
            </div>
          )}
        </div>

        {/* Profile & Icons */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            {user && !isLoading ? (
              <>
                <Link href="/profile" className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]">
                  <User />
                </Link>
                <Link href="/profile">
                  <span className="block font-medium">Hello, </span>
                  <span className="font-semibold">{user.name.split(" ")[0]}</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]">
                  <User />
                </Link>

                <Link href="/login">
                  <span className="block font-medium">Hello, </span>
                  <span className="font-semibold">{isLoading ? "..." : "Sign In"}</span>
                </Link>
              </>
            )}
          </div>

          {/* Wishlist & Cart */}
          <div className="flex items-center gap-5">
            <Link href="/wishlist" className="relative">
              <HeartIcon />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm">{wishList?.length}</span>
              </div>
            </Link>
            <Link href="/cart" className="relative">
              <ShoppingCart />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm">{cart?.length}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-300" />
      <HeaderBottom />
    </div>
  );
}
