"use client";

import ProductCard from "@/shared/components/cards/product-card";
import SectionTitle from "@/shared/components/section/section-title";
import Hero from "@/shared/modules/hero";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

async function getAllProducts() {
  const res = await axiosInstance.get("/product/api/all-products?page=1&limit=10");
  if (res?.data) {
    return res.data.products;
  }
}
async function getLatestProducts() {
  const res = await axiosInstance.get("/product/api/all-products?page=1&limit=10&type=latest");
  return res.data.products;
}
export default function Page() {
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: getAllProducts,
    staleTime: 1000 * 60 * 2, // 2mins
  });

  // const { data: latestProducts } = useQuery({
  //   queryKey: ["latest-products"],
  //   queryFn: getLatestProducts,
  //   staleTime: 1000 * 60 * 2,
  // });

  return (
    <div className="bg-[#f5f5f5]">
      <Hero />
      <div className="md:w-[80%] w-[90%] my-10 m-auto">
        <div className="mb-8">
          <SectionTitle title="Suggested Products" />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="h-[250px] bg-gray-300 animate-pulse rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {products?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
