"use client";

import ShopCard from "@/shared/components/cards/shop-card";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ShopsPage() {
  const router = useRouter();
  const [isShopLoading, setIsShopLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [shops, setShops] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  function updateURL() {
    const params = new URLSearchParams();
    // ✅ Changed: categories → shopCategories
    if (selectedCategories.length > 0) params.set("shopCategories", selectedCategories.join(","));

    params.set("page", page.toString());
    router.replace(`/shops?${decodeURIComponent(params.toString())}`);
  }

  async function fetchFilteredShops() {
    setIsShopLoading(true);
    try {
      const query = new URLSearchParams();

      // ✅ Changed: categories → shopCategories
      if (selectedCategories.length > 0) query.set("shopCategories", selectedCategories.join(","));

      query.set("page", page.toString());
      query.set("limit", "12");

      const res = await axiosInstance.get(`/product/api/filtered-shops?${query.toString()}`);
      setShops(res.data.shops);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch filtered shops", error);
    } finally {
      setIsShopLoading(false);
    }
  }

  // Fetch categories from DB
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/seller/api/shop-categories`);
      return res.data.categories as string[];
    },
  });

  // ✅ Fixed: added selectedCountries to dependency array
  useEffect(() => {
    updateURL();
    fetchFilteredShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedCountries, page]);

  function toggleCategory(label: string) {
    setSelectedCategories((prev) => (prev.includes(label) ? prev.filter((cat) => cat !== label) : [...prev, label]));
  }
  function toggleCountry(country: string) {
    setSelectedCountries((prev) => (prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]));
  }

  return (
    <div className="w-full pb-10">
      <div className="w-full m-auto">
        <div className="pb-[50px]">
          <h1 className="md:pt-[40px] font-[500] text-[44px] leading-[1] mb-[14px] font-jost">All Shops</h1>
          <Link href="/" className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">All Shops</span>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-[270px] !rounded bg-white p-4 space-y-6 shadow-sm">
            {/* Categories */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">Shop Categories</h3>

            {/* ✅ Added: loading skeleton for categories */}
            {categoriesLoading ? (
              <div className="space-y-3 !mt-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                ))}
              </div>
            ) : (
              <ul className="space-y-2 !mt-3">
                {categoriesData?.map((category: any) => (
                  <li key={category} className="flex items-center justify-between">
                    <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="accent-blue-600"
                      />
                      {category}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Shop Grid */}
          <div className="flex-1 px-2 lg:px-3">
            {isShopLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="h-[250px] bg-gray-300 animate-pulse rounded-xl"></div>
                ))}
              </div>
            ) : shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            ) : (
              <p>No Shops found</p>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
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
