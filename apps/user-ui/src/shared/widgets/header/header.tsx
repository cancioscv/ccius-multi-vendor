"use client";

import { Heart, Search, ShoppingCart, Store, Tag, User } from "lucide-react";
import Link from "next/link";
import HeaderBottom from "./header-bottom";
import useUser from "@/hooks/useUser";
import { useCartStore } from "@/store";
import useLayout from "@/hooks/useLayout";
import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import axiosInstance from "@/utils/axiosInstance";
import { useScrollBehavior } from "@/hooks/useScrollBehavior";

interface NavIconProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  hidden?: boolean;
}

interface BrandResult {
  name: string;
  products: {
    id: string;
    title: string;
    slug: string;
    salePrice: number;
    regularPrice: number;
    ratings: number;
    brand: string | null;
    stock: number;
    images: { url: string }[];
  }[];
}

interface SearchResults {
  products: { id: string; title: string; slug: string }[];
  shops: { id: string; name: string; avatar: string | null; category: string }[];
  brands: BrandResult[];
}

function NavIcon({ href, icon, label, count, hidden }: NavIconProps) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center gap-[3px] px-2.5 py-1 rounded-md hover:bg-gray-50 transition-all duration-300 group min-w-[52px] ${
        hidden ? "opacity-0 w-0 min-w-0 px-0 overflow-hidden pointer-events-none" : "opacity-100"
      }`}
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

const HEADER_EXPANDED_H = 74;
const NAV_BAR_H = 49;
const TOTAL_EXPANDED_H = HEADER_EXPANDED_H + NAV_BAR_H;

export default function Header() {
  const { user, isLoading } = useUser();
  const { cart, wishList } = useCartStore();
  const { layout } = useLayout();

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [results, setResults] = useState<SearchResults | null>(null);
  const [searchedOnce, setSearchedOnce] = useState(false);

  const scrollState = useScrollBehavior(80, 80);
  const isShrunken = scrollState === "scrolled-down";
  const showNav = scrollState !== "scrolled-down";

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoadingSuggestions(true);
    setSearchedOnce(true);
    try {
      const res = await axiosInstance.get(`/product/api/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  const hasResults = results && (results.products?.length > 0 || results.shops?.length > 0 || results.brands?.length > 0);

  function clearSearch() {
    setResults(null);
    setSearchQuery("");
    setSearchedOnce(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults(null);
        setSearchedOnce(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Spacer — keeps content from jumping under the fixed header */}
      <div style={{ height: TOTAL_EXPANDED_H }} aria-hidden="true" />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1280px] z-[100] bg-white shadow-sm">
        {/* ── Main header row ──
            IMPORTANT: NO overflow-hidden here — it would clip the suggestions dropdown.
            Height is controlled by the transition on this div itself, and logo/icons
            clip themselves individually where needed. */}
        <div
          className={`w-full mx-auto flex items-center gap-4 transition-all duration-300 ease-in-out pl-4 pr-4 border-b border-gray-300 ${
            isShrunken ? "h-[48px]" : "h-[74px]"
          }`}
        >
          {/* Logo — clips itself so it doesn't overflow when collapsing */}
          <Link
            href="/"
            className={`shrink-0 flex items-center transition-all duration-300 overflow-hidden ${
              isShrunken ? "w-0 opacity-0 mr-0" : "opacity-100 mr-1"
            }`}
            tabIndex={isShrunken ? -1 : 0}
          >
            {layout?.logo ? (
              <Image src={layout.logo} alt="logo" width={120} height={36} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap">Shop</span>
            )}
          </Link>

          {/* ── Search ── */}
          <div ref={searchRef} className="flex-1 relative">
            <div
              className={`flex items-center border rounded-lg overflow-hidden transition-all duration-300 bg-white ${
                isShrunken ? "h-[32px]" : "h-[40px]"
              } ${isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300 hover:border-gray-400"}`}
            >
              <Search size={isShrunken ? 13 : 16} className="ml-3 shrink-0 text-gray-400 transition-all duration-300" />
              <input
                type="text"
                value={searchQuery}
                placeholder={isShrunken ? "Search..." : "Search for products, brands and vendors..."}
                className="flex-1 px-2 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400 h-full transition-all duration-300"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value === "") {
                    setResults(null);
                    setSearchedOnce(false);
                  }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className={`h-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium transition-all duration-300 shrink-0 rounded-r-lg ${
                  isShrunken ? "px-3 text-xs" : "px-4 text-sm"
                }`}
              >
                {isShrunken ? <Search size={13} /> : "Search"}
              </button>
            </div>

            {(hasResults || loadingSuggestions || searchedOnce) && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-gray-200 rounded-lg shadow-lg z-[300] overflow-hidden">
                {loadingSuggestions ? (
                  <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    Searching...
                  </div>
                ) : (
                  <div className="py-1">
                    {/* ── Products ── */}
                    {results!.products.length > 0 && (
                      <section>
                        <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Products</p>
                        <ul>
                          {results!.products.map((item) => (
                            <li key={item.id}>
                              <Link
                                href={`/product/${item.slug}`}
                                onClick={clearSearch}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                              >
                                <Search size={12} className="text-gray-400 shrink-0" />
                                {item.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* ── Shops ── */}
                    {results!.shops.length > 0 && (
                      <section>
                        <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Stores</p>
                        <ul>
                          {results!.shops.map((shop) => (
                            <li key={shop.id}>
                              <Link
                                href={`/shop/${shop.id}`}
                                onClick={clearSearch}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                              >
                                <Store size={12} className="text-gray-400 shrink-0" />
                                <span className="flex-1">{shop.name}</span>
                                <span className="text-[11px] text-gray-400">{shop.category.toUpperCase()}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* ── Brands ── */}
                    {results!.brands.length > 0 && (
                      <section>
                        <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Brands</p>
                        <ul>
                          {results!.brands.map((brand) => (
                            <li key={brand.name}>
                              <Link
                                href={`/brands/${encodeURIComponent(brand.name.toLowerCase())}`}
                                onClick={clearSearch}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                              >
                                <Tag size={12} className="text-gray-400 shrink-0" />
                                <span className="flex-1">{brand.name}</span>
                                <span className="text-[11px] text-gray-400">{brand.products.length} products</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* No results */}
                    {!hasResults && <p className="px-4 py-3 text-sm text-gray-400">No results found.</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right nav icons ── */}
          <div className="flex items-center shrink-0 ml-1">
            <NavIcon
              href="/shops"
              icon={<Store size={isShrunken ? 18 : 22} className="text-gray-600 group-hover:text-gray-800 transition-colors" />}
              label="Stores"
              hidden={isShrunken}
            />

            <Link
              href={user ? "/profile" : "/login"}
              className="relative flex flex-col items-center gap-[3px] px-2.5 py-1 rounded-md hover:bg-gray-50 transition-all duration-300 group"
            >
              <User size={isShrunken ? 18 : 22} className="text-gray-600 group-hover:text-gray-800 transition-colors" />
              {!isShrunken && (
                <span className="text-[11px] text-gray-500 group-hover:text-gray-700 font-medium transition-colors whitespace-nowrap">
                  {isLoading ? "..." : user ? user.name.split(" ")[0] : "Account"}
                </span>
              )}
            </Link>

            <NavIcon
              href="/wishlist"
              icon={<Heart size={isShrunken ? 18 : 22} className="text-gray-600 group-hover:text-gray-800 transition-colors" />}
              label="Saved"
              count={wishList?.length ?? 0}
              hidden={isShrunken}
            />

            <Link
              href="/cart"
              className="relative flex flex-col items-center gap-[3px] px-2.5 py-1 rounded-md hover:bg-gray-50 transition-all duration-300 group"
            >
              <div className="relative">
                <ShoppingCart size={isShrunken ? 18 : 22} className="text-gray-600 group-hover:text-gray-800 transition-colors" />
                {(cart?.length ?? 0) > 0 && (
                  <span className="absolute -top-[7px] -right-[7px] min-w-[17px] h-[17px] bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-[3px]">
                    {(cart?.length ?? 0) > 99 ? "99+" : cart?.length}
                  </span>
                )}
              </div>
              {!isShrunken && (
                <span className="text-[11px] text-gray-500 group-hover:text-gray-700 font-medium transition-colors whitespace-nowrap">Cart</span>
              )}
            </Link>
          </div>
        </div>

        {/* ── Nav bar (categories) — slides in/out ── */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showNav ? "max-h-[56px] opacity-100" : "max-h-0 opacity-0"}`}>
          <Suspense>
            <HeaderBottom />
          </Suspense>
        </div>
      </div>
    </>
  );
}
