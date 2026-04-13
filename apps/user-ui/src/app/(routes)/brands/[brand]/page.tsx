"use client";

import ProductCard from "@/shared/components/cards/product-card";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Range } from "react-range";

const MIN = 0;
const MAX = 1199;

export default function BrandPage() {
  const params = useParams();
  const brand = decodeURIComponent(params.brand as string);

  const [isProductLoading, setIsProductLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState([MIN, MAX]);
  const [tempPriceRange, setTempPriceRange] = useState([MIN, MAX]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const searchParams = useSearchParams();
  const router = useRouter();
  const hasHydrated = useRef(false);

  const colorOptions = [
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

  const { data: categoryData, isLoading: catLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/categories");
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  // Sync state from URL and fetch on searchParams change
  useEffect(() => {
    if (!hasHydrated.current) hasHydrated.current = true;

    const rawPrice = searchParams.get("priceRange");
    const price = rawPrice ? rawPrice.split(",").map(Number) : [MIN, MAX];
    const colors = searchParams.get("colors")?.split(",").filter(Boolean) ?? [];
    const szs = searchParams.get("sizes")?.split(",").filter(Boolean) ?? [];
    const cats = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
    const p = Number(searchParams.get("page")) || 1;

    setPriceRange(price);
    setTempPriceRange(price);
    setSelectedColors(colors);
    setSelectedSizes(szs);
    setSelectedCategories(cats);
    setPage(p);

    fetchBrandProducts({ priceRange: price, colors, sizes: szs, categories: cats, page: p });
  }, [searchParams, brand]);

  function updateURL(
    overrides?: Partial<{
      priceRange: number[];
      colors: string[];
      sizes: string[];
      categories: string[];
      page: number;
    }>
  ) {
    const params = new URLSearchParams();
    const price = overrides?.priceRange ?? priceRange;
    const cls = overrides?.colors ?? selectedColors;
    const szs = overrides?.sizes ?? selectedSizes;
    const cats = overrides?.categories ?? selectedCategories;
    const p = overrides?.page ?? page;

    params.set("priceRange", price.join(","));
    if (cls.length > 0) params.set("colors", cls.join(","));
    if (szs.length > 0) params.set("sizes", szs.join(","));
    if (cats.length > 0) params.set("categories", cats.join(","));
    params.set("page", p.toString());

    router.replace(`/search/brand/${encodeURIComponent(brand)}?${params.toString()}`);
  }

  async function fetchBrandProducts(overrides?: {
    priceRange?: number[];
    colors?: string[];
    sizes?: string[];
    categories?: string[];
    page?: number;
  }) {
    setIsProductLoading(true);
    try {
      const query = new URLSearchParams();
      const price = overrides?.priceRange ?? priceRange;
      const colors = overrides?.colors ?? selectedColors;
      const szs = overrides?.sizes ?? selectedSizes;
      const cats = overrides?.categories ?? selectedCategories;
      const p = overrides?.page ?? page;

      query.set("brand", brand);
      query.set("priceRange", price.join(","));
      if (colors.length > 0) query.set("colors", colors.join(","));
      if (szs.length > 0) query.set("sizes", szs.join(","));
      if (cats.length > 0) query.set("categories", cats.join(","));
      query.set("page", p.toString());
      query.set("limit", "12");

      const res = await axiosInstance.get(`/product/api/filtered-products?${query.toString()}`);
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
      setTotalProducts(res.data.pagination.total ?? 0);
    } catch (error) {
      console.error("Failed to fetch brand products", error);
    } finally {
      setIsProductLoading(false);
    }
  }

  function toggleColor(code: string) {
    const next = selectedColors.includes(code) ? selectedColors.filter((c) => c !== code) : [...selectedColors, code];
    updateURL({ colors: next, page: 1 });
  }

  function toggleSize(size: string) {
    const next = selectedSizes.includes(size) ? selectedSizes.filter((s) => s !== size) : [...selectedSizes, size];
    updateURL({ sizes: next, page: 1 });
  }

  function toggleCategory(cat: string) {
    const next = selectedCategories.includes(cat) ? selectedCategories.filter((c) => c !== cat) : [...selectedCategories, cat];
    updateURL({ categories: next, page: 1 });
  }

  return (
    <div className="w-full pb-10">
      <div className="w-full m-auto">
        {/* Breadcrumb */}
        <div className="pb-[50px]">
          <h1 className="md:pt-[40px] font-medium text-[44px] leading-1 mb-[14px] font-jost capitalize">{brand}</h1>
          <Link href="/" className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full" />
          <Link href="/products" className="text-[#55585b] hover:underline">
            Products
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full" />
          <span className="text-[#55585b] capitalize">{brand}</span>
          {totalProducts > 0 && <span className="ml-2 text-sm text-gray-400">({totalProducts} products)</span>}
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-[270px] shrink-0 rounded bg-white p-4 space-y-6 shadow-md self-start sticky top-[123px] max-h-[calc(100vh-123px)] overflow-y-auto">
            {/* Price */}
            <h3 className="text-xl font-Poppins font-medium">Price Filter</h3>
            <div className="ml-2">
              <Range
                step={1}
                min={MIN}
                max={MAX}
                values={tempPriceRange}
                onChange={(values) => setTempPriceRange(values)}
                renderTrack={({ props, children }) => {
                  const [min, max] = tempPriceRange;
                  const pctLeft = ((min - MIN) / (MAX - MIN)) * 100;
                  const pctRight = ((max - MIN) / (MAX - MIN)) * 100;
                  return (
                    <div {...props} className="h-[6px] bg-blue-200 rounded relative" style={props.style}>
                      <div className="absolute h-full bg-blue-600 rounded" style={{ left: `${pctLeft}%`, width: `${pctRight - pctLeft}%` }} />
                      {children}
                    </div>
                  );
                }}
                renderThumb={({ props }) => {
                  const { key, ...rest } = props;
                  return <div key={key} {...rest} className="w-[16px] h-[16px] bg-blue-600 rounded-full shadow" />;
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-600">
                ${tempPriceRange[0]} – ${tempPriceRange[1]}
              </p>
              <button
                onClick={() => updateURL({ priceRange: tempPriceRange, page: 1 })}
                className="text-sm px-4 py-1 bg-gray-200 hover:bg-blue-600 hover:text-white transition rounded"
              >
                Apply
              </button>
            </div>

            {/* Categories */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">Categories</h3>
            <ul className="space-y-2 !mt-3">
              {catLoading ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : (
                categoryData?.categories?.map((cat: string) => (
                  <li key={cat}>
                    <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="accent-blue-600"
                      />
                      {cat}
                    </label>
                  </li>
                ))
              )}
            </ul>

            {/* Colors */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">Filter by Color</h3>
            <ul className="space-y-2 !mt-3">
              {colorOptions.map((color) => (
                <li key={color.code}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color.code)}
                      onChange={() => toggleColor(color.code)}
                      className="accent-blue-600"
                    />
                    <span className="w-[16px] h-[16px] rounded-full border border-gray-200" style={{ backgroundColor: color.code }} />
                    {color.name}
                  </label>
                </li>
              ))}
            </ul>

            {/* Sizes */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">Filter by Size</h3>
            <ul className="space-y-2 !mt-3">
              {sizes.map((size) => (
                <li key={size}>
                  <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} className="accent-blue-600" />
                    <span className="font-medium">{size}</span>
                  </label>
                </li>
              ))}
            </ul>
          </aside>

          {/* Product grid */}
          <div className="flex-1 px-2 lg:px-3">
            {isProductLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-[250px] bg-gray-300 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p className="text-lg">
                  No products found for <span className="font-medium capitalize text-gray-600">{brand}</span>
                </p>
                <Link href="/products" className="mt-4 text-sm text-blue-600 hover:underline">
                  Browse all products
                </Link>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => updateURL({ page: i + 1 })}
                    className={`px-3 py-1 rounded border border-gray-200 text-sm ${
                      page === i + 1 ? "bg-blue-600 text-white" : "bg-white text-black"
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
