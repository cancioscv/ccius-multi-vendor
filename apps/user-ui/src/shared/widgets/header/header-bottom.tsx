"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { AlignLeft, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

async function fetchCategories() {
  const res = await axiosInstance.get("/product/api/categories");
  return res.data;
}

export default function HeaderBottom() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [megaActiveCategory, setMegaActiveCategory] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // ✅ delay timer

  const searchParams = useSearchParams();
  const activeCats = (searchParams.get("categories") || searchParams.get("category") || "").split(",").filter(Boolean);

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30,
  });

  const categories: string[] = data?.categories ?? [];
  const subCategories: Record<string, string[]> = data?.subCategories ?? {};
  const productTypes: Record<string, string[]> = data?.productTypes ?? {};

  useEffect(() => {
    if (showMegaMenu && categories.length > 0) {
      setMegaActiveCategory(categories[0]);
    }
  }, [showMegaMenu, categories]);

  // ✅ Delay helpers — prevent flicker when moving between trigger and panel
  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShowMegaMenu(true);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => {
      setShowMegaMenu(false);
    }, 120);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const activeSubs = megaActiveCategory ? subCategories[megaActiveCategory] ?? [] : [];

  return (
    <>
      {/* ── Category bar ── */}
      <div className="w-full bg-white border-b border-gray-200 pl-4 pr-4">
        <div className="mx-auto flex items-center">
          <div className="flex items-center">
            {/* All Categories trigger */}
            <button
              onMouseEnter={openMenu} // ✅ open
              onMouseLeave={scheduleClose} // ✅ schedule close (cancelled if mouse enters panel)
              className="flex items-center gap-2 pr-6 py-3 font-medium text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              {showMegaMenu ? <X size={18} /> : <AlignLeft size={18} />}
              <span>All Categories</span>
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200 mr-2" />

            {/* Category tabs */}
            <nav className="flex items-center overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <div key={cat} className="relative group">
                  <Link
                    href={`/products?category=${encodeURIComponent(cat)}`}
                    onMouseEnter={() => setActiveCategory(cat)}
                    onMouseLeave={() => setActiveCategory(null)}
                    className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors block ${
                      activeCategory === cat || activeCats.includes(cat) ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    {cat}
                    <span
                      className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 transition-all duration-200 ${
                        activeCategory === cat || activeCats.includes(cat) ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                      } origin-left`}
                    />
                  </Link>

                  {/* Subcategory hover dropdown */}
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
        </div>
      </div>

      {/* ── Mega Menu Panel ── */}
      {showMegaMenu && (
        <div
          onMouseEnter={openMenu} // ✅ cancel close when mouse enters panel
          onMouseLeave={scheduleClose} // ✅ schedule close when mouse leaves panel
          className="w-full bg-white border-t border-gray-100 shadow-2xl absolute left-0 z-[89]"
        >
          <div className="mx-auto flex pl-4 pr-4" style={{ minHeight: 420 }}>
            {/* Left: category list */}
            <div className="w-[240px] border-r border-gray-100 py-2 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onMouseEnter={() => setMegaActiveCategory(cat)}
                  onClick={() => setShowMegaMenu(false)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-sm font-medium transition-colors text-left ${
                    megaActiveCategory === cat
                      ? "bg-blue-50 text-blue-600 border-l-[3px] border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 border-l-[3px] border-transparent"
                  }`}
                >
                  <Link href={`/products?category=${encodeURIComponent(cat)}`} className="flex-1" onClick={() => setShowMegaMenu(false)}>
                    {cat}
                  </Link>
                  <span className="text-gray-400 text-xs">›</span>
                </button>
              ))}
              <Link
                href="/products"
                onClick={() => setShowMegaMenu(false)}
                className="block px-5 py-3 text-sm font-semibold text-blue-600 hover:underline"
              >
                View All Categories
              </Link>
            </div>

            {/* Right: subcategory + product types grid */}
            <div className="flex-1 px-8 py-6 overflow-y-auto">
              {megaActiveCategory && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">{megaActiveCategory}</h2>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                    {activeSubs.map((sub) => (
                      <div key={sub}>
                        <Link
                          href={`/products?category=${encodeURIComponent(megaActiveCategory)}&subCategory=${encodeURIComponent(sub)}`}
                          onClick={() => setShowMegaMenu(false)}
                          className="block text-xs font-bold uppercase tracking-wider text-gray-800 hover:text-blue-600 mb-2"
                        >
                          {sub}
                        </Link>
                        <ul className="space-y-1">
                          {(productTypes[sub] ?? []).map((type) => (
                            <li key={type}>
                              <Link
                                href={`/products?category=${encodeURIComponent(megaActiveCategory)}&subCategory=${encodeURIComponent(
                                  sub
                                )}&productType=${encodeURIComponent(type)}`}
                                onClick={() => setShowMegaMenu(false)}
                                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                              >
                                {type}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
