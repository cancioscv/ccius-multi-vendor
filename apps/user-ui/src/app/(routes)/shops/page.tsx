"use client";

import ShopCard from "@/shared/components/cards/shop-card";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@e-com/ui";

// ─── Sort Options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "top_rated", label: "Top rated" },
  { value: "most_followers", label: "Most followers" },
  { value: "name_asc", label: "Name (A-Z)" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ─── Skeleton Components ───────────────────────────────────────────────────────

function SkeletonShopCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
      <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-gray-200 animate-pulse rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 animate-pulse rounded-full w-1/2" />
        <div className="h-8 bg-gray-200 animate-pulse rounded-lg w-full mt-3" />
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonShopCard key={i} />
      ))}
    </div>
  );
}

// ─── Custom Sort Dropdown (matches products page design) ───────────────────────

function SortDropdown({ value, onChange }: { value: SortValue; onChange: (v: SortValue) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Most popular";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* ✅ Same style as the products page Sort By dropdown */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded px-3 py-1.5 hover:border-gray-300 transition-colors min-w-[155px] justify-between shadow-sm"
      >
        <span>{currentLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[175px]">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                  isSelected ? "bg-orange-50 text-orange-500 font-semibold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" /> : <span className="w-3.5 h-3.5 shrink-0" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function countActiveFilters(categories: string[]) {
  return categories.length;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ShopsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isShopLoading, setIsShopLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortValue>("popular");
  const [page, setPage] = useState(1);
  const [shops, setShops] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShops, setTotalShops] = useState(0);

  const scrollRef = useRef<number>(0);
  const hasHydrated = useRef(false);

  // ── Fetch categories from DB ──────────────────────────────────────────────
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/seller/api/shop-categories`);
      return res.data.categories as string[];
    },
  });

  // ── Sync state from URL on searchParams change ────────────────────────────
  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
    }

    // ✅ Changed: categories → shopCategories
    const cats = searchParams.get("shopCategories")?.split(",").filter(Boolean) ?? [];
    const sort = (searchParams.get("sortBy") as SortValue) ?? "popular";
    const p = Number(searchParams.get("page")) || 1;

    setSelectedCategories(cats);
    setSortBy(sort);
    setPage(p);

    fetchFilteredShops({ categories: cats, sortBy: sort, page: p });
  }, [searchParams]);

  // Restore scroll after load
  useEffect(() => {
    if (!isShopLoading && scrollRef.current) {
      window.scrollTo({ top: scrollRef.current, behavior: "instant" });
    }
  }, [isShopLoading]);

  // ── Build and push URL ────────────────────────────────────────────────────
  function updateURL(
    overrides?: Partial<{
      categories: string[];
      sortBy: SortValue;
      page: number;
    }>
  ) {
    scrollRef.current = window.scrollY;
    const params = new URLSearchParams();
    const cats = overrides?.categories ?? selectedCategories;
    const sort = overrides?.sortBy ?? sortBy;
    const p = overrides?.page ?? page;

    // ✅ Changed: categories → shopCategories
    if (cats.length > 0) params.set("shopCategories", cats.join(","));
    params.set("sortBy", sort);
    params.set("page", p.toString());
    router.replace(`/shops?${params.toString()}`);
  }

  function clearAllFilters() {
    scrollRef.current = 0;
    router.replace("/shops?sortBy=popular&page=1");
  }

  // ── Fetch shops from API ──────────────────────────────────────────────────
  async function fetchFilteredShops(overrides?: { categories?: string[]; sortBy?: SortValue; page?: number }) {
    setIsShopLoading(true);
    try {
      const query = new URLSearchParams();
      const cats = overrides?.categories ?? selectedCategories;
      const sort = overrides?.sortBy ?? sortBy;
      const p = overrides?.page ?? page;

      // ✅ Changed: categories → shopCategories
      if (cats.length > 0) query.set("shopCategories", cats.join(","));
      query.set("sortBy", sort);
      query.set("page", p.toString());
      query.set("limit", "12");

      const res = await axiosInstance.get(`/product/api/filtered-shops?${query.toString()}`);
      setShops(res.data.shops);
      setTotalPages(res.data.pagination.totalPages);
      setTotalShops(res.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch filtered shops", error);
    } finally {
      setIsShopLoading(false);
    }
  }

  // ── Toggle category (multi-select) ───────────────────────────────────────
  function toggleCategory(label: string) {
    const next = selectedCategories.includes(label) ? selectedCategories.filter((c) => c !== label) : [...selectedCategories, label];
    updateURL({ categories: next, page: 1 });
  }

  const activeFilterCount = countActiveFilters(selectedCategories);

  // ── Dynamic breadcrumb ────────────────────────────────────────────────────
  const pageTitle = selectedCategories.length === 1 ? selectedCategories[0] : "All Shops";

  return (
    <div className="w-full pb-10">
      <div className="w-full m-auto">
        {/* ── Header ── */}
        <div className="pb-[10px] pt-[32px]">
          {/* Title */}
          <h1 className="font-bold text-[38px] leading-tight font-jost text-gray-900 mb-2">{pageTitle}</h1>

          {/* ✅ Dynamic Breadcrumbs (shadcn/ui) */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-[#55585b] hover:text-orange-500 transition-colors">
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-[#a8acb0]" />
              {selectedCategories.length === 1 ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild className="text-[#55585b] hover:text-orange-500 transition-colors">
                      <Link href="/shops">Shops</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-[#a8acb0]" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-orange-500 font-semibold">{selectedCategories[0]}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-orange-500 font-semibold">All Shops</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ── "Showing X shops" + Sort By — same row ── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            {isShopLoading ? "Loading shops..." : `Discover ${totalShops} trusted shop${totalShops !== 1 ? "s" : ""} from around the world`}
          </p>

          <div className="flex items-center gap-2">
            {/* Sort icon */}
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M9 17h6" />
            </svg>
            <span className="text-sm text-gray-500 hidden sm:inline">Sort by</span>
            {/* ✅ Same custom dropdown as products page */}
            <SortDropdown value={sortBy} onChange={(val) => updateURL({ sortBy: val, page: 1 })} />
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-[270px] shrink-0 rounded bg-white border border-gray-100 shadow-sm self-start sticky top-[80px] max-h-[calc(100vh-100px)] overflow-y-auto">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-sm text-gray-700 tracking-wide">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold bg-orange-500 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            {/* ── Accordion: Shop Categories ── */}
            <Accordion type="multiple" defaultValue={["categories"]} className="px-1">
              <AccordionItem value="categories">
                <AccordionTrigger className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-widest hover:no-underline">
                  <span className="flex items-center gap-1.5">
                    Shop Categories
                    {selectedCategories.length > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full">
                        {selectedCategories.length}
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-4">
                  {categoriesLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-0.5">
                      {categoriesData?.map((category: string) => {
                        const isSelected = selectedCategories.includes(category);
                        return (
                          <li key={category}>
                            {/* ✅ Checkbox multi-select — same style as products subcategory */}
                            <button
                              onClick={() => toggleCategory(category)}
                              className="w-full flex items-center gap-2.5 px-2 py-2 rounded text-sm transition-colors hover:bg-gray-50 group text-left"
                            >
                              <span
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? "bg-orange-500 border-orange-500" : "border-gray-300 group-hover:border-orange-300"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </span>
                              <span className={`${isSelected ? "text-orange-600 font-medium" : "text-gray-600"}`}>{category}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </aside>

          {/* ── Shop Grid ── */}
          <div className="flex-1">
            {isShopLoading ? (
              <SkeletonGrid count={12} />
            ) : shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-gray-400 text-lg font-medium">No shops found</p>
                <p className="text-gray-300 text-sm mt-1">Try adjusting your filters</p>
                <button onClick={clearAllFilters} className="mt-4 text-sm text-orange-500 hover:underline">
                  Clear all filters
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => updateURL({ page: i + 1 })}
                    className={`px-3 py-1 rounded border text-sm transition-colors ${
                      page === i + 1 ? "bg-orange-500 text-white border-orange-500" : "bg-white text-black border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
