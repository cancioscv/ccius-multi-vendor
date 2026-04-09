"use client";

import ProductCard from "@/shared/components/cards/product-card";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Range } from "react-range";

const MIN = 0;
const MAX = 1199;
export default function ProductsPage() {
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedProductType, setSelectedProductType] = useState<string>("");
  const [priceRange, setPriceRange] = useState([MIN, MAX]);
  const [tempPriceRange, setTempPriceRange] = useState([MIN, MAX]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const searchParams = useSearchParams();
  const router = useRouter();

  const hasHydrated = useRef(false);

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

  // Also need productTypes from the categories query
  const productTypes: Record<string, string[]> = data?.productTypes ?? {};
  const subCategories: Record<string, string[]> = data?.subCategories ?? {};

  // Single effect — searchParams is the only dependency
  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
    }

    const raw = searchParams.get("categories") || searchParams.get("category");
    const cats = raw ? raw.split(",") : [];
    const sub = searchParams.get("subCategory") ?? "";
    const type = searchParams.get("productType") ?? "";
    const rawPrice = searchParams.get("priceRange");
    const price = rawPrice ? rawPrice.split(",").map(Number) : [MIN, MAX];
    const colors = searchParams.get("colors")?.split(",").filter(Boolean) ?? [];
    const sizes = searchParams.get("sizes")?.split(",").filter(Boolean) ?? [];
    const p = Number(searchParams.get("page")) || 1;

    // Sync UI state (sidebar checkboxes, sliders)
    setSelectedCategories(cats);
    setSelectedSubCategory(sub);
    setSelectedProductType(type);
    setPriceRange(price);
    setTempPriceRange(price);
    setSelectedColors(colors);
    setSelectedSizes(sizes);
    setPage(p);

    // Fetch directly with fresh values — never touches state
    fetchFilteredProducts({ categories: cats, subCategory: sub, productType: type, priceRange: price, colors, sizes, page: p });
  }, [searchParams]); // ✅ only fires when URL actually changes

  // ✅ Sidebar interactions: just update URL, let searchParams effect do the rest
  function updateURL(
    overrides?: Partial<{
      categories: string[];
      subCategory: string;
      productType: string;
      priceRange: number[];
      colors: string[];
      sizes: string[];
      page: number;
    }>
  ) {
    const params = new URLSearchParams();
    const cats = overrides?.categories ?? selectedCategories;
    const sub = overrides?.subCategory ?? selectedSubCategory;
    const type = overrides?.productType ?? selectedProductType;
    const price = overrides?.priceRange ?? priceRange;
    const cls = overrides?.colors ?? selectedColors;
    const szs = overrides?.sizes ?? selectedSizes;
    const p = overrides?.page ?? page;

    params.set("priceRange", price.join(","));
    if (cats.length > 0) params.set("categories", cats.join(","));
    if (sub) params.set("subCategory", sub);
    if (type) params.set("productType", type);
    if (cls.length > 0) params.set("colors", cls.join(","));
    if (szs.length > 0) params.set("sizes", szs.join(","));
    params.set("page", p.toString());
    router.replace(`/products?${params.toString()}`);
  }

  async function fetchFilteredProducts(overrides?: {
    categories?: string[];
    subCategory?: string;
    productType?: string;
    priceRange?: number[];
    colors?: string[];
    sizes?: string[];
    page?: number;
  }) {
    setIsProductLoading(true);
    try {
      const query = new URLSearchParams();

      // ✅ Use overrides (fresh values) if provided, otherwise fall back to state
      const cats = overrides?.categories ?? selectedCategories;
      const sub = overrides?.subCategory ?? selectedSubCategory;
      const type = overrides?.productType ?? selectedProductType;
      const price = overrides?.priceRange ?? priceRange;
      const colors = overrides?.colors ?? selectedColors;
      const sizes = overrides?.sizes ?? selectedSizes;
      const p = overrides?.page ?? page;

      query.set("priceRange", price.join(","));
      if (cats.length > 0) query.set("categories", cats.join(","));
      if (sub) query.set("subCategory", sub);
      if (type) query.set("productType", type);
      if (colors.length > 0) query.set("colors", colors.join(","));
      if (sizes.length > 0) query.set("sizes", sizes.join(","));
      query.set("page", p.toString());
      query.set("limit", "12");

      const res = await axiosInstance.get(`/product/api/filtered-products?${query.toString()}`);
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch filtered products", error);
    } finally {
      setIsProductLoading(false);
    }
  }

  function toggleCategory(label: string) {
    const next = selectedCategories.includes(label) ? selectedCategories.filter((c) => c !== label) : [...selectedCategories, label];
    // ✅ reset sub/type when category changes
    updateURL({ categories: next, subCategory: "", productType: "", page: 1 });
  }

  function toggleColor(color: string) {
    const next = selectedColors.includes(color) ? selectedColors.filter((c) => c !== color) : [...selectedColors, color];
    updateURL({ colors: next, page: 1 });
  }

  function toggleSize(size: string) {
    const next = selectedSizes.includes(size) ? selectedSizes.filter((s) => s !== size) : [...selectedSizes, size];
    updateURL({ sizes: next, page: 1 });
  }

  return (
    <div className="w-full pb-10">
      <div className="w-full m-auto">
        <div className="pb-[50px]">
          <h1 className="md:pt-[40px] font-medium text-[44px] leading-1 mb-[14px] font-jost">All Products</h1>
          <Link href="/" className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">All Products</span>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* sidebar */}
          {/* <aside className="w-full lg:w-[270px] !rounded bg-white p-4 space-y-6 shadow-md"> */}
          <aside className="w-full lg:w-[270px] shrink-0 !rounded bg-white p-4 space-y-6 shadow-md self-start sticky top-[123px] max-h-[calc(100vh-123px)] overflow-y-auto">
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
                  const percentageLeft = ((min - MIN) / (MAX - MIN)) * 100;
                  const percentageRight = ((max - MIN) / (MAX - MIN)) * 100;

                  return (
                    <div {...props} className="h-[6px] bg-blue-200 rounded relative" style={{ ...props.style }}>
                      <div
                        className="absolute h-full bg-blue-600 rounded"
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
                  return <div key={key} {...rest} className="w-[16px] h-[16px] bg-blue-600 rounded-full shadow" />;
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-600">
                ${tempPriceRange[0]} - ${tempPriceRange[1]}
              </div>
              <button
                onClick={() => {
                  updateURL({ priceRange: tempPriceRange, page: 1 });
                }}
                className="text-sm px-4 py-1 bg-gray-200 hover:bg-blue-600 hover:text-white transition !rounded"
              >
                Apply
              </button>
            </div>

            {/* Categories */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">Categories</h3>
            <ul className="space-y-2 !mt-3">
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                data?.categories?.map((category: any) => (
                  <li key={category} className="flex items-center justify-between">
                    <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategories.includes(category)}
                        onChange={() =>
                          updateURL({
                            categories: selectedCategories.includes(category) ? [] : [category],
                            subCategory: "",
                            productType: "",
                            page: 1,
                          })
                        }
                        className="accent-blue-600"
                      />
                      {category}
                    </label>
                  </li>
                ))
              )}
            </ul>

            {/* Subcategories — shown when a category is selected */}
            {selectedCategories.length === 1 && subCategories[selectedCategories[0]]?.length > 0 && (
              <>
                <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">Subcategory</h3>
                <ul className="space-y-2 !mt-3">
                  {subCategories[selectedCategories[0]].map((sub) => (
                    <li key={sub}>
                      <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="subCategory"
                          checked={selectedSubCategory === sub}
                          onChange={() => {
                            const next = selectedSubCategory === sub ? "" : sub;
                            updateURL({ subCategory: next, productType: "", page: 1 });
                          }}
                          className="accent-blue-600"
                        />
                        {sub}
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Product Types — shown when a subcategory is selected */}
            {selectedSubCategory && productTypes[selectedSubCategory]?.length > 0 && (
              <>
                <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">Product Type</h3>
                <ul className="space-y-2 !mt-3">
                  {productTypes[selectedSubCategory].map((type) => (
                    <li key={type}>
                      <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="productType"
                          checked={selectedProductType === type}
                          onChange={() => {
                            const next = selectedProductType === type ? "" : type;
                            updateURL({ productType: next, page: 1 });
                          }}
                          className="accent-blue-600"
                        />
                        {type}
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Colors */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1 mt-6">Filter by Color</h3>
            <ul className="space-y-2 !mt-3">
              {colors.map((color) => (
                <li key={color.code} className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color.code)}
                      onChange={() => toggleColor(color.code)}
                      className="accent-blue-600"
                    />
                    <span className="w-[16px] h-[16px] rounded-full border border-gray-200" style={{ backgroundColor: color.code }}></span>
                    {color.name}
                  </label>
                </li>
              ))}
            </ul>

            {/* Sizes */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1 mt-6">Filter by Size</h3>
            <ul className="space-y-2 !mt-3">
              {sizes.map((size) => (
                <li key={size} className="flex items-center justify-between">
                  <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} className="accent-blue-600" />
                    <span className="font-medium">{size}</span>
                  </label>
                </li>
              ))}
            </ul>
          </aside>

          {/* product grid */}
          <div className="flex-1 px-2 lg:px-3">
            {isProductLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="h-[250px] bg-gray-300 animate-pulse rounded-xl"></div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p>No products found</p>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => updateURL({ page: i + 1 })}
                    className={`px-3 py-1 !rounded border border-gray-200 text-sm ${
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
