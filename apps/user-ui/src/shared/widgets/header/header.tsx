"use client";

import { Heart, Search, ShoppingCart, Store, User } from "lucide-react";
import Link from "next/link";
import HeaderBottom from "./header-bottom";
import useUser from "@/hooks/useUser";
import { useCartStore } from "@/store";
import useLayout from "@/hooks/useLayout";
import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import axiosInstance from "@/utils/axiosInstance";

interface NavIconProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

function NavIcon({ href, icon, label, count }: NavIconProps) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center gap-[3px] px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors group min-w-[52px]"
    >
      <div className="relative">
        {icon}
        {count !== undefined && count > 0 && (
          <span className="absolute -top-[7px] -right-[7px] min-w-[17px] h-[17px] bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-[3px]">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>
      <span className="text-[11px] text-gray-500 group-hover:text-gray-700 font-medium transition-colors whitespace-nowrap">{label}</span>
    </Link>
  );
}

export default function Header() {
  const { user, isLoading } = useUser();
  const { cart, wishList } = useCartStore();
  const { layout } = useLayout();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full bg-white border-b border-gray-100 sticky top-0 z-[100] shadow-sm">
      {/* Main header row */}
      <div className="w-[88%] max-w-[1400px] mx-auto h-[74px] flex items-center gap-5">
        {/* ── Logo ── */}
        <Link href="/" className="shrink-0 flex items-center mr-1">
          {layout?.logo ? (
            <Image src={layout.logo} alt="logo" width={120} height={36} className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-lg font-bold tracking-tight text-gray-900">Shop</span>
          )}
        </Link>

        {/* ── Search ── */}
        <div ref={searchRef} className="flex-1 relative">
          <div
            className={`flex items-center h-[40px] border rounded-lg overflow-hidden transition-all duration-150 bg-white ${
              isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Search size={16} className="ml-3 shrink-0 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              placeholder="Search for products, brands and vendors..."
              className="flex-1 px-2.5 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400 h-full"
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="h-full px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shrink-0 rounded-r-lg"
            >
              Search
            </button>
          </div>

          {/* Suggestions dropdown */}
          {(suggestions.length > 0 || loadingSuggestions) && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-gray-200 rounded-lg shadow-lg z-[200] overflow-hidden">
              {loadingSuggestions ? (
                <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  Searching...
                </div>
              ) : (
                <ul>
                  {suggestions.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => {
                          setSuggestions([]);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <Search size={12} className="text-gray-400 shrink-0" />
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Right nav icons ── */}
        <div className="flex items-center shrink-0 ml-1">
          {/* Stores */}
          <NavIcon href="/shops" icon={<Store size={22} className="text-gray-600 group-hover:text-gray-800 transition-colors" />} label="Stores" />

          {/* Account */}
          <NavIcon
            href={user ? "/profile" : "/login"}
            icon={<User size={22} className="text-gray-600 group-hover:text-gray-800 transition-colors" />}
            label={isLoading ? "..." : user ? user.name.split(" ")[0] : "Account"}
          />

          {/* Saved / Wishlist */}
          <NavIcon
            href="/wishlist"
            icon={<Heart size={22} className="text-gray-600 group-hover:text-gray-800 transition-colors" />}
            label="Saved"
            count={wishList?.length ?? 0}
          />

          {/* Cart */}
          <NavIcon
            href="/cart"
            icon={<ShoppingCart size={22} className="text-gray-600 group-hover:text-gray-800 transition-colors" />}
            label="Cart"
            count={cart?.length ?? 0}
          />
        </div>
      </div>

      <div className="border-b border-gray-300" />

      {/* ── Nav bar (categories) ── */}
      <Suspense>
        <HeaderBottom />
      </Suspense>
    </div>
  );
}
