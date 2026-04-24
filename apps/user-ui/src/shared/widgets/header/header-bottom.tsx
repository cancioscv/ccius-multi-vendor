"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { AlignLeft, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

async function fetchCategories() {
  const res = await axiosInstance.get("/product/api/categories");
  return res.data;
}

// ✅ How many categories to show inline — adjust to fit your design
const MAX_VISIBLE = 9;

export default function HeaderBottom() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [megaActiveCategory, setMegaActiveCategory] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

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

  const visibleCats = categories.slice(0, MAX_VISIBLE);
  const overflowCats = categories.slice(MAX_VISIBLE);

  useEffect(() => {
    if (showMegaMenu && categories.length > 0) {
      setMegaActiveCategory(categories[0]);
    }
  }, [showMegaMenu, categories]);

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    // ✅ Use 'click' not 'mousedown' — lets the button's onClick fire first
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShowMegaMenu(true);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setShowMegaMenu(false), 120);
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const activeSubs = megaActiveCategory ? subCategories[megaActiveCategory] ?? [] : [];

  return (
    <>
      {/* ── Category bar ── */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-[1370px] mx-auto px-4 flex items-center">
          {/* All Categories trigger */}
          <button
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
            className="flex items-center gap-2 pr-5 py-3 font-medium text-sm hover:text-orange-500 transition-colors whitespace-nowrap font-sans text-[#8C7B73] shrink-0"
          >
            {showMegaMenu ? <X size={18} /> : <AlignLeft size={18} />}
            <span>All Categories</span>
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

          {/* ✅ Visible category tabs — capped at MAX_VISIBLE */}
          <nav className="flex items-center min-w-0">
            {visibleCats.map((cat) => (
              <div key={cat} className="relative shrink-0">
                <Link
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  className={`relative font-sans px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors block hover:text-orange-500 ${
                    activeCats.includes(cat) ? "text-orange-500" : "text-[#8C7B73]"
                  }`}
                >
                  {cat}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-orange-500 transition-all duration-200 ${
                      activeCats.includes(cat) ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                    } origin-left`}
                  />
                </Link>
                {/* ✅ No subcategory dropdown here — subcategories are in the mega menu only */}
              </div>
            ))}

            {/* ✅ "More" dropdown for overflow categories */}
            {overflowCats.length > 0 && (
              <div ref={moreMenuRef} className="relative shrink-0">
                <button
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                  className={`flex items-center gap-1 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors font-sans hover:text-orange-500 ${
                    showMoreMenu ? "text-orange-500" : "text-[#8C7B73]"
                  }`}
                >
                  More
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showMoreMenu ? "rotate-180" : ""}`} />
                </button>

                {/* More dropdown panel */}
                {showMoreMenu && (
                  <div className="absolute top-full right-0 z-50 bg-white shadow-xl border border-gray-100 rounded-b-lg min-w-[200px] py-1 ">
                    {overflowCats.map((cat) => (
                      <Link
                        key={cat}
                        href={`/products?category=${encodeURIComponent(cat)}`}
                        onClick={() => setShowMoreMenu(false)}
                        className={`flex !text-[#8C7B73] items-center justify-between px-5 py-2.5 text-sm font-medium transition-colors border-b border-gray-50 last:border-b-0 hover:bg-orange-50 hover:!text-orange-500 ${
                          activeCats.includes(cat) ? "!text-orange-500" : "text-gray-600"
                        }`}
                      >
                        {cat}
                        <span className="text-gray-300 text-xs">›</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* ── Mega Menu Panel ── (unchanged) */}
      {showMegaMenu && (
        <div
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          className="w-full bg-white border-t border-gray-100 shadow-2xl absolute left-0 z-[89]"
        >
          <div className="max-w-[1370px] mx-auto px-4 flex" style={{ minHeight: 420 }}>
            <div className="w-[240px] border-r border-gray-100 py-2 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onMouseEnter={() => setMegaActiveCategory(cat)}
                  onClick={() => setShowMegaMenu(false)}
                  className={`w-full flex items-center justify-between px-5 py-2 text-sm font-medium transition-colors text-left font-sans ${
                    megaActiveCategory === cat
                      ? "bg-[#fbf0e9] text-orange-500 border-l-[3px] border-orange-500"
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
                className="block px-5 py-3 text-sm font-semibold text-orange-500 hover:underline"
              >
                View All Categories
              </Link>
            </div>

            <div className="flex-1 px-8 py-6 overflow-y-auto">
              {megaActiveCategory && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 font-headings">{megaActiveCategory}</h2>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                    {activeSubs.map((sub) => (
                      <div key={sub}>
                        <Link
                          href={`/products?category=${encodeURIComponent(megaActiveCategory)}&subCategory=${encodeURIComponent(sub)}`}
                          onClick={() => setShowMegaMenu(false)}
                          className="block text-xs font-bold uppercase tracking-wider font-sans hover:text-orange-500 mb-2"
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
                                className="text-sm text-gray-500 hover:text-orange-500 transition-colors font-sans"
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
