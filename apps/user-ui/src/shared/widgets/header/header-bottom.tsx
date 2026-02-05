"use client";

import { navItems } from "@/configs/constants";
import useUser from "@/hooks/useUser";
import { useCartStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { AlignLeft, ChevronDown, ChevronRight, HeartIcon, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

async function fetchCategories() {
  const res = await axiosInstance.get("/product/api/categories");
  return res.data;
}

export default function HeaderBottom() {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const { user, isLoading } = useUser();

  const { cart, wishList } = useCartStore();

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    }

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30,
  });

  return (
    <div className={`w-full transition-all duration-300 ${isSticky ? "fixed top-0 left-0 z-[100] bg-white shadow-lg" : "relative"}`}>
      <div className={`w-[80%] relative m-auto flex items-center justify-between ${isSticky ? "pt-3" : "py-0"}`}>
        <div
          className={`w-[260px] ${isSticky && "-mb-2"} cursor-pointer flex items-center justify-between px-5 h-[50px] bg-gray-500`}
          onClick={() => setShow(!show)}
        >
          <div className="flex items-center gap-2">
            <AlignLeft color="white" />
            <span className="text-white font-medium">All Departments</span>
          </div>
          <ChevronDown color="white" />
        </div>

        {/* Dropdown menu */}
        {show && (
          <div
            className={`absolute left-0 ${
              isSticky ? "top-[70px]" : "top-[50px]"
            } w-[260px] max-h-[400px] bg-[#f5f5f5] overflow-y-auto shadow-lg z-[999]`}
          >
            {data?.categories?.length > 0 ? (
              data.categories.map((cat: string, i: number) => {
                const hasSub = data.subCategories?.[cat]?.length > 0;
                const isExpanded = expandedCategory === cat;

                return (
                  <div key={i} className="relative">
                    <button
                      onClick={() => {
                        if (hasSub) {
                          setExpandedCategory((prev) => (prev === cat ? null : cat));
                        } else {
                          setShow(false);
                          window.location.href = `/products?category=${encodeURIComponent(cat)}`;
                        }
                      }}
                      className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-600 border-b border-gray-100 transition"
                    >
                      <span>{cat}</span>
                      {hasSub &&
                        (isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />)}
                    </button>

                    {/* Subcategories Panel */}
                    {isExpanded && hasSub && (
                      <div className="pl-4 bg-gray-50 border-t border-gray-200">
                        {data.subCategories[cat].map((sub: string, j: number) => (
                          <Link
                            key={j}
                            href={`/products?category=${encodeURIComponent(cat)}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                            onClick={() => setShow(false)}
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="px-5 py-4 text-sm text-gray-500">No categories found.</p>
            )}
          </div>
        )}

        {/* Navigation links */}
        <div className="flex items-center">
          {navItems.map((item: NavItemsTypes) => (
            <Link href={item.href} className="px-5 font-medium text-lg" key={item.title}>
              {item.title}
            </Link>
          ))}
        </div>

        <div>
          {isSticky && (
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
          )}
        </div>
      </div>
    </div>
  );
}
