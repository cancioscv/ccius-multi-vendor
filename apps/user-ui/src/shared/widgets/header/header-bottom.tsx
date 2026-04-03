"use client";

import useUser from "@/hooks/useUser";
import { useCartStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { AlignLeft, HeartIcon, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

async function fetchCategories() {
  const res = await axiosInstance.get("/product/api/categories");
  return res.data;
}

export default function HeaderBottom() {
  const [isSticky, setIsSticky] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isLoading } = useUser();
  const { cart, wishList } = useCartStore();

  useEffect(() => {
    function handleScroll() {
      setIsSticky(window.scrollY > 100);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAllCategories(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30,
  });

  const categories: string[] = data?.categories ?? [];
  const subCategories: Record<string, string[]> = data?.subCategories ?? {};

  return (
    <div
      className={`w-full transition-all duration-300 border-b border-gray-200 ${
        isSticky ? "fixed top-0 left-0 z-[100] bg-white shadow-md" : "relative bg-white"
      }`}
    >
      <div className="w-[80%] m-auto flex items-center justify-between">
        {/* Left: All Categories + Dynamic Category Tabs */}
        <div className="flex items-center" ref={dropdownRef}>
          {/* All Categories Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowAllCategories((prev) => !prev)}
              className="flex items-center gap-2 pr-6 py-4 font-medium text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              <AlignLeft size={18} />
              <span>All Categories</span>
            </button>

            {/* All Categories Dropdown */}
            {showAllCategories && (
              <div className="absolute top-full left-0 z-50 bg-white shadow-xl border border-gray-100 rounded-b-lg w-64">
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/products?category=${encodeURIComponent(cat)}`}
                    onClick={() => setShowAllCategories(false)}
                    className="flex items-center justify-between px-5 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-medium border-b border-gray-50 last:border-b-0"
                  >
                    {cat}
                    <span className="text-gray-300 text-xs">›</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200 mr-2" />

          {/* Dynamic Category Tabs */}
          <nav className="flex items-center overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <div key={cat} className="relative group">
                <Link
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  onMouseEnter={() => setActiveCategory(cat)}
                  onMouseLeave={() => setActiveCategory(null)}
                  className={`relative px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors block ${
                    activeCategory === cat ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  {cat}
                  {/* Active underline */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 transition-all duration-200 ${
                      activeCategory === cat ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                    } origin-left`}
                  />
                </Link>

                {/* Subcategory Mega Dropdown */}
                {subCategories[cat] && subCategories[cat].length > 0 && (
                  <div
                    onMouseEnter={() => setActiveCategory(cat)}
                    onMouseLeave={() => setActiveCategory(null)}
                    className={`absolute top-full left-0 z-50 bg-white shadow-xl border border-gray-100 rounded-b-lg min-w-[200px] transition-all duration-200 ${
                      activeCategory === cat ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    {subCategories[cat].map((sub) => (
                      <Link
                        key={sub}
                        href={`/products?category=${encodeURIComponent(cat)}&subCategory=${encodeURIComponent(sub)}`}
                        className="flex items-center justify-between px-5 py-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm border-b border-gray-50 last:border-b-0"
                      >
                        {sub}
                        <span className="text-gray-300 text-xs">›</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right: Sticky user/cart icons */}
        {isSticky && (
          <div className="flex items-center gap-6 py-2 ml-4 shrink-0">
            <div className="flex items-center gap-2">
              {!isLoading && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/"
                    className="border-2 w-[42px] h-[42px] flex items-center justify-center rounded-full border-gray-200 hover:border-blue-400 transition-colors"
                  >
                    <User size={18} />
                  </Link>
                  <Link href="/profile">
                    <span className="block text-xs text-gray-500">Hello,</span>
                    <span className="font-semibold text-sm">{user?.name?.split(" ")[0]}</span>
                  </Link>
                </div>
              ) : (
                <Link href="/login">
                  <span className="block text-xs text-gray-500">Hello,</span>
                  <span className="font-semibold text-sm">{isLoading ? "..." : "Sign In"}</span>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link href="/wishlist" className="relative">
                <HeartIcon size={22} />
                <div className="w-5 h-5 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute -top-2 -right-2">
                  <span className="text-white font-medium text-xs">{wishList?.length ?? 0}</span>
                </div>
              </Link>
              <Link href="/cart" className="relative">
                <ShoppingCart size={22} />
                <div className="w-5 h-5 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute -top-2 -right-2">
                  <span className="text-white font-medium text-xs">{cart?.length ?? 0}</span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
