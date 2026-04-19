"use client";

import ProductCard from "@/shared/components/cards/product-card";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Range } from "react-range";
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
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";

const MIN = 0;
const MAX = 1199;

// ─── Sort Options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Rating" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ─── Skeleton Components ───────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
      <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-gray-200 animate-pulse rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 animate-pulse rounded-full w-1/2" />
        <div className="h-4 bg-gray-200 animate-pulse rounded-full w-1/3 mt-3" />
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function countActiveFilters(params: {
  categories: string[];
  subCategories: string[];
  productTypes: string[];
  priceRange: number[];
  colors: string[];
  sizes: string[];
}) {
  let count = 0;
  if (params.categories.length > 0) count++;
  if (params.subCategories.length > 0) count += params.subCategories.length;
  if (params.productTypes.length > 0) count += params.productTypes.length;
  if (params.priceRange[0] !== MIN || params.priceRange[1] !== MAX) count++;
  if (params.colors.length > 0) count += params.colors.length;
  if (params.sizes.length > 0) count += params.sizes.length;
  return count;
}

// ─── Custom Sort Dropdown (native-looking, matches screenshot exactly) ─────────

function SortDropdown({ value, onChange }: { value: SortValue; onChange: (v: SortValue) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Popular";

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
      {/* ✅ Trigger: white bg, border, rounded — matches screenshot */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded px-3 py-1.5 hover:border-gray-300 transition-colors min-w-[155px] justify-between shadow-sm"
      >
        <span>{currentLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* ✅ Dropdown panel: white, border, shadow — selected item highlighted orange */}
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
                className={`w-full flex items-center gap-2 px-2 py-2 text-sm text-left transition-colors ${
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

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // ✅ Multi-selectable subcategories and product types (arrays, not single strings)
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([MIN, MAX]);
  const [tempPriceRange, setTempPriceRange] = useState([MIN, MAX]);
  // ✅ Empty string = show placeholder; actual value = user typed / slider moved
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortBy, setSortBy] = useState<SortValue>("popular");

  const searchParams = useSearchParams();
  const router = useRouter();
  const hasHydrated = useRef(false);
  const scrollRef = useRef<number>(0);

  const colors = [
    { name: "Black", code: "#000000" },
    { name: "White", code: "#ffffff" },
    { name: "Red", code: "#ff0000" },
    { name: "Green", code: "#00ff00" },
    { name: "Blue", code: "#0000ff" },
    { name: "Yellow", code: "#ffff00" },
    { name: "Magenta", code: "#ff00ff" },
    { name: "Cyan", code: "#00ffff" },
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/categories");
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const productTypes: Record<string, string[]> = data?.productTypes ?? {};
  const subCategories: Record<string, string[]> = data?.subCategories ?? {};

  // ✅ All subcategories available for the selected categories (flat)
  const availableSubCategories = selectedCategories.flatMap((cat) => subCategories[cat] ?? []);

  // ✅ All product types available for the selected subcategories (flat)
  const availableProductTypes = selectedSubCategories.flatMap((sub) => productTypes[sub] ?? []);

  // Derived: has the slider/inputs moved away from the applied priceRange?
  const isPriceChanged = tempPriceRange[0] !== priceRange[0] || tempPriceRange[1] !== priceRange[1];

  // Active filter count for badge
  const activeFilterCount = countActiveFilters({
    categories: selectedCategories,
    subCategories: selectedSubCategories,
    productTypes: selectedProductTypes,
    priceRange,
    colors: selectedColors,
    sizes: selectedSizes,
  });

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
    }

    const raw = searchParams.get("categories") || searchParams.get("category");
    const cats = raw ? raw.split(",") : [];
    // ✅ Parse multi-value subcategories and productTypes
    const subs = searchParams.get("subCategories")?.split(",").filter(Boolean) ?? [];
    const types = searchParams.get("productTypes")?.split(",").filter(Boolean) ?? [];
    const rawPrice = searchParams.get("priceRange");
    const price = rawPrice ? rawPrice.split(",").map(Number) : [MIN, MAX];
    const cls = searchParams.get("colors")?.split(",").filter(Boolean) ?? [];
    const szs = searchParams.get("sizes")?.split(",").filter(Boolean) ?? [];
    const p = Number(searchParams.get("page")) || 1;
    const sort = (searchParams.get("sortBy") as SortValue) ?? "popular";

    // ✅ Only populate inputs when a non-default price is active
    const hasCustomPrice = price[0] !== MIN || price[1] !== MAX;

    // Sync UI state (sidebar checkboxes, sliders)
    setSelectedCategories(cats);
    setSelectedSubCategories(subs);
    setSelectedProductTypes(types);
    setPriceRange(price);
    setTempPriceRange(price);
    setMinInput(hasCustomPrice ? String(price[0]) : "");
    setMaxInput(hasCustomPrice ? String(price[1]) : "");
    setSelectedColors(cls);
    setSelectedSizes(szs);
    setPage(p);
    setSortBy(sort);

    // Fetch directly with fresh values — never touches state
    fetchFilteredProducts({
      categories: cats,
      subCategories: subs,
      productTypes: types,
      priceRange: price,
      colors: cls,
      sizes: szs,
      page: p,
      sortBy: sort,
    });
  }, [searchParams]); // ✅ only fires when URL actually changes

  // Restore scroll position after products load
  useEffect(() => {
    if (!isProductLoading && scrollRef.current) {
      window.scrollTo({ top: scrollRef.current, behavior: "instant" });
    }
  }, [isProductLoading]);

  // ✅ Sidebar interactions: just update URL, let searchParams effect do the rest
  function updateURL(
    overrides?: Partial<{
      categories: string[];
      subCategories: string[];
      productTypes: string[];
      priceRange: number[];
      colors: string[];
      sizes: string[];
      page: number;
      sortBy: SortValue;
    }>
  ) {
    // Save scroll position before navigation
    scrollRef.current = window.scrollY;

    const params = new URLSearchParams();
    const cats = overrides?.categories ?? selectedCategories;
    const subs = overrides?.subCategories ?? selectedSubCategories;
    const types = overrides?.productTypes ?? selectedProductTypes;
    const price = overrides?.priceRange ?? priceRange;
    const cls = overrides?.colors ?? selectedColors;
    const szs = overrides?.sizes ?? selectedSizes;
    const p = overrides?.page ?? page;
    const sort = overrides?.sortBy ?? sortBy;

    params.set("priceRange", price.join(","));
    if (cats.length > 0) params.set("categories", cats.join(","));
    if (subs.length > 0) params.set("subCategories", subs.join(","));
    if (types.length > 0) params.set("productTypes", types.join(","));
    if (cls.length > 0) params.set("colors", cls.join(","));
    if (szs.length > 0) params.set("sizes", szs.join(","));
    params.set("page", p.toString());
    params.set("sortBy", sort);
    router.replace(`/products?${params.toString()}`);
  }

  function clearAllFilters() {
    scrollRef.current = 0;
    setTempPriceRange([MIN, MAX]);
    setMinInput("");
    setMaxInput("");
    router.replace("/products?priceRange=0,1199&page=1&sortBy=popular");
  }

  async function fetchFilteredProducts(overrides?: {
    categories?: string[];
    subCategories?: string[];
    productTypes?: string[];
    priceRange?: number[];
    colors?: string[];
    sizes?: string[];
    page?: number;
    sortBy?: SortValue;
  }) {
    setIsProductLoading(true);
    try {
      const query = new URLSearchParams();

      // ✅ Use overrides (fresh values) if provided, otherwise fall back to state
      const cats = overrides?.categories ?? selectedCategories;
      const subs = overrides?.subCategories ?? selectedSubCategories;
      const types = overrides?.productTypes ?? selectedProductTypes;
      const price = overrides?.priceRange ?? priceRange;
      const cls = overrides?.colors ?? selectedColors;
      const szs = overrides?.sizes ?? selectedSizes;
      const p = overrides?.page ?? page;
      const sort = overrides?.sortBy ?? sortBy;

      query.set("priceRange", price.join(","));
      if (cats.length > 0) query.set("categories", cats.join(","));
      if (subs.length > 0) query.set("subCategories", subs.join(","));
      if (types.length > 0) query.set("productTypes", types.join(","));
      if (cls.length > 0) query.set("colors", cls.join(","));
      if (szs.length > 0) query.set("sizes", szs.join(","));
      query.set("page", p.toString());
      query.set("limit", "12");
      query.set("sortBy", sort);

      const res = await axiosInstance.get(`/product/api/filtered-products?${query.toString()}`);
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
      setTotalProducts(res.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch filtered products", error);
    } finally {
      setIsProductLoading(false);
    }
  }

  function toggleColor(color: string) {
    const next = selectedColors.includes(color) ? selectedColors.filter((c) => c !== color) : [...selectedColors, color];
    updateURL({ colors: next, page: 1 });
  }

  function toggleSize(size: string) {
    const next = selectedSizes.includes(size) ? selectedSizes.filter((s) => s !== size) : [...selectedSizes, size];
    updateURL({ sizes: next, page: 1 });
  }

  // ✅ Toggle subcategory (multi-select) — also prunes orphaned product types
  function toggleSubCategory(sub: string) {
    const next = selectedSubCategories.includes(sub) ? selectedSubCategories.filter((s) => s !== sub) : [...selectedSubCategories, sub];
    const validTypes = next.flatMap((s) => productTypes[s] ?? []);
    const prunedTypes = selectedProductTypes.filter((t) => validTypes.includes(t));
    updateURL({ subCategories: next, productTypes: prunedTypes, page: 1 });
  }

  // ✅ Toggle product type (multi-select)
  function toggleProductType(type: string) {
    const next = selectedProductTypes.includes(type) ? selectedProductTypes.filter((t) => t !== type) : [...selectedProductTypes, type];
    updateURL({ productTypes: next, page: 1 });
  }

  // ✅ Slider → sync both inputs dynamically
  function handleSliderChange(values: number[]) {
    setTempPriceRange(values);
    setMinInput(String(values[0]));
    setMaxInput(String(values[1]));
  }

  // ✅ Min input → sync slider
  function handleMinInputChange(val: string) {
    setMinInput(val);
    const num = Number(val);
    if (!isNaN(num) && num >= MIN && num <= tempPriceRange[1]) {
      setTempPriceRange([num, tempPriceRange[1]]);
    }
  }

  // ✅ Max input → sync slider
  function handleMaxInputChange(val: string) {
    setMaxInput(val);
    const num = Number(val);
    if (!isNaN(num) && num <= MAX && num >= tempPriceRange[0]) {
      setTempPriceRange([tempPriceRange[0], num]);
    }
  }

  // ─── Dynamic breadcrumb ────────────────────────────────────────────────────────
  const breadcrumbCategory = selectedCategories.length === 1 ? selectedCategories[0] : null;
  const pageTitle = breadcrumbCategory ?? "All Products";

  return (
    <div className="w-full pb-10">
      <div className="w-full m-auto">
        {/* ── Header ── */}
        <div className="pb-[15px] pt-[28px]">
          {/* ✅ Title FIRST — matches screenshot layout */}
          <h1 className="font-bold text-[38px] leading-tight font-jost text-gray-900 mb-2">{pageTitle}</h1>

          {/* ✅ Breadcrumbs BELOW title — matches screenshot */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-[#55585b] hover:text-orange-500 transition-colors">
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-[#a8acb0]" />
              {breadcrumbCategory ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild className="text-[#55585b] hover:text-orange-500 transition-colors">
                      <Link href="/products">Products</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-[#a8acb0]" />
                  {/* ✅ Active crumb: orange, hover stays orange */}
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-orange-500 font-semibold hover:text-orange-600 cursor-default">
                      {breadcrumbCategory}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-orange-500 font-semibold">All Products</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ✅ "Showing X products from top vendors" + Sort By — same row, matches screenshot */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            {isProductLoading ? (
              "Loading products..."
            ) : (
              <>
                Showing <span className="font-bold">{totalProducts}</span> product{totalProducts !== 1 ? "s" : ""} from top vendors
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            {/* Sort icon */}
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M9 17h6" />
            </svg>
            <span className="text-sm text-gray-500 hidden sm:inline">Sort by</span>
            {/* ✅ Custom sort dropdown matching screenshot */}
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

            {/* Accordion Sections */}
            <Accordion type="multiple" defaultValue={["price", "categories", "subcategory", "productType", "color", "size"]} className="px-1">
              {/* ── Price Range ── */}
              <AccordionItem value="price" className="border-b border-gray-100">
                <AccordionTrigger className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-widest hover:no-underline">
                  Price Range
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-4 space-y-4">
                  {/* Slider */}
                  <div className="px-1 pt-1">
                    <Range
                      step={1}
                      min={MIN}
                      max={MAX}
                      values={tempPriceRange}
                      onChange={handleSliderChange}
                      renderTrack={({ props, children }) => {
                        const [min, max] = tempPriceRange;
                        const percentageLeft = ((min - MIN) / (MAX - MIN)) * 100;
                        const percentageRight = ((max - MIN) / (MAX - MIN)) * 100;
                        return (
                          <div {...props} className="h-[5px] bg-gray-200 rounded relative" style={{ ...props.style }}>
                            <div
                              className="absolute h-full bg-orange-500 rounded"
                              style={{
                                left: `${percentageLeft}%`,
                                width: `${percentageRight - percentageLeft}%`,
                              }}
                            />
                            {children}
                          </div>
                        );
                      }}
                      renderThumb={({ props }) => {
                        const { key, ...rest } = props;
                        return (
                          <div
                            key={key}
                            {...rest}
                            className="w-4 h-4 bg-orange-500 rounded-full shadow-md border-2 border-white focus:outline-none"
                          />
                        );
                      }}
                    />
                  </div>

                  {/* ✅ Min / Max inputs: empty by default, placeholder shows range limits */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5 block">Min</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
                        <input
                          type="number"
                          value={minInput}
                          placeholder={String(MIN)}
                          min={MIN}
                          max={tempPriceRange[1]}
                          onChange={(e) => handleMinInputChange(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5 block">Max</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
                        <input
                          type="number"
                          value={maxInput}
                          placeholder={String(MAX)}
                          min={tempPriceRange[0]}
                          max={MAX}
                          onChange={(e) => handleMaxInputChange(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ✅ Apply Price — disabled (gray) until range changes */}
                  <button
                    disabled={!isPriceChanged}
                    onClick={() => {
                      updateURL({ priceRange: tempPriceRange, page: 1 });
                    }}
                    className={`w-full py-2 text-sm font-semibold rounded transition-all flex items-center justify-center gap-1.5 ${
                      isPriceChanged ? "bg-orange-500 hover:bg-orange-600 text-white cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isPriceChanged && <Check className="w-3.5 h-3.5" />}
                    Apply Price
                  </button>
                </AccordionContent>
              </AccordionItem>

              {/* ── Categories ── */}
              <AccordionItem value="categories" className="border-b border-gray-100">
                <AccordionTrigger className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-widest hover:no-underline">
                  Categories
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-4">
                  {isLoading ? (
                    <p className="text-sm text-gray-400">Loading...</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {data?.categories?.map((category: string) => {
                        const isSelected = selectedCategories.includes(category);
                        return (
                          <li key={category}>
                            <button
                              onClick={() =>
                                updateURL({
                                  categories: isSelected ? [] : [category],
                                  subCategories: [],
                                  productTypes: [],
                                  page: 1,
                                })
                              }
                              className={`w-full flex items-center justify-between px-2 py-2 rounded text-sm transition-colors ${
                                isSelected ? "bg-orange-50 text-orange-500 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                              }`}
                            >
                              <span>{category}</span>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* ── Subcategory — multi-selectable, shown when category is selected ── */}
              {selectedCategories.length > 0 && availableSubCategories.length > 0 && (
                <AccordionItem value="subcategory" className="border-b border-gray-100">
                  <AccordionTrigger className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-widest hover:no-underline">
                    <span className="flex items-center gap-1.5">
                      Subcategory
                      {selectedSubCategories.length > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full">
                          {selectedSubCategories.length}
                        </span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-4">
                    <ul className="space-y-0.5">
                      {availableSubCategories.map((sub) => {
                        const isSelected = selectedSubCategories.includes(sub);
                        return (
                          <li key={sub}>
                            {/* ✅ Checkbox multi-select */}
                            <button
                              onClick={() => toggleSubCategory(sub)}
                              className="w-full flex items-center gap-2.5 px-2 py-2 rounded text-sm transition-colors hover:bg-gray-50 group text-left"
                            >
                              <span
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? "bg-orange-500 border-orange-500" : "border-gray-300 group-hover:border-orange-300"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </span>
                              <span className={`${isSelected ? "text-orange-600 font-medium" : "text-gray-600"}`}>{sub}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── Product Types — multi-selectable, shown when subcategory is selected ── */}
              {selectedSubCategories.length > 0 && availableProductTypes.length > 0 && (
                <AccordionItem value="productType" className="border-b border-gray-100">
                  <AccordionTrigger className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-widest hover:no-underline">
                    <span className="flex items-center gap-1.5">
                      Product Type
                      {selectedProductTypes.length > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full">
                          {selectedProductTypes.length}
                        </span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-4">
                    <ul className="space-y-0.5">
                      {availableProductTypes.map((type) => {
                        const isSelected = selectedProductTypes.includes(type);
                        return (
                          <li key={type}>
                            {/* ✅ Checkbox multi-select */}
                            <button
                              onClick={() => toggleProductType(type)}
                              className="w-full flex items-center gap-2.5 px-2 py-2 rounded text-sm transition-colors hover:bg-gray-50 group text-left"
                            >
                              <span
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? "bg-orange-500 border-orange-500" : "border-gray-300 group-hover:border-orange-300"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </span>
                              <span className={`${isSelected ? "text-orange-600 font-medium" : "text-gray-600"}`}>{type}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── Colors ── */}
              <AccordionItem value="color" className="border-b border-gray-100">
                <AccordionTrigger className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-widest hover:no-underline">
                  <span className="flex items-center gap-1.5">
                    Color
                    {selectedColors.length > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full">
                        {selectedColors.length}
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-4">
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map((color) => {
                      const isSelected = selectedColors.includes(color.code);
                      return (
                        <button
                          key={color.code}
                          title={color.name}
                          onClick={() => toggleColor(color.code)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            isSelected ? "border-orange-500 scale-110 shadow-md" : "border-gray-200 hover:scale-105 hover:border-gray-300"
                          } ${color.code === "#ffffff" ? "shadow-sm" : ""}`}
                          style={{ backgroundColor: color.code }}
                        />
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ── Sizes ── */}
              <AccordionItem value="size">
                <AccordionTrigger className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-widest hover:no-underline">
                  <span className="flex items-center gap-1.5">
                    Size
                    {selectedSizes.length > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full">
                        {selectedSizes.length}
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded border transition-all ${
                            isSelected
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </aside>

          {/* ── Product Grid ── */}
          <div className="flex-1">
            {isProductLoading ? (
              <SkeletonGrid count={12} />
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-gray-400 text-lg font-medium">No products found</p>
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
