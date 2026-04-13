"use client";

import ProductCard from "@/shared/components/cards/product-card";
import ShopCard from "@/shared/components/cards/shop-card";
import SectionTitle from "@/shared/components/section/section-title";
import Hero from "@/shared/modules/hero";
import { useAuthStore } from "@/store/authStore";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

async function getAllProducts() {
  const res = await axiosInstance.get("/product/api/all-products?page=1&limit=20");
  if (res?.data) {
    return res.data.products;
  }
}
async function getLatestProducts() {
  const res = await axiosInstance.get("/product/api/all-products?page=1&limit=10&type=latest");
  return res.data.products;
}

async function getTopShops() {
  const res = await axiosInstance.get("/product/api/top-shops");
  return res.data.shops;
}

async function getTopOffers() {
  const res = await axiosInstance.get("/product/api/all-offers?page=1&limit=10");
  return res.data.offers;
}

async function getRecommendedProducts() {
  const res = await axiosInstance.get("/recommendation/api/recommended-products");
  return res.data.recommendations.products;
}
export default function Page() {
  const { isLoggedIn } = useAuthStore();
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: getAllProducts,
    staleTime: 1000 * 60 * 2, // 2mins
  });

  const { data: latestProducts, isLoading: isLoadingLatestProducts } = useQuery({
    queryKey: ["latest-products"],
    queryFn: getLatestProducts,
    staleTime: 1000 * 60 * 2,
  });

  const { data: topShops, isLoading: isLoadingTopShops } = useQuery({
    queryKey: ["top-shops"],
    queryFn: getTopShops,
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: topOffers,
    isLoading: isLoadingTopOffers,
    isError: isErrorOffers,
  } = useQuery({
    queryKey: ["offers"],
    queryFn: getTopOffers,
    staleTime: 1000 * 60 * 2,
  });

  // const {
  //   data: products,
  //   isLoading,
  //   isError,
  // } = useQuery({
  //   queryKey: ["products"],
  //   queryFn: getRecommendedProducts,
  //   staleTime: 1000 * 60 * 2,
  // });

  return (
    <div>
      <Hero />
      <div className="my-10 m-auto">
        {!isLoading && isLoggedIn && (
          <div className="mb-8">
            <SectionTitle title="Suggested Products" />
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="h-[250px] bg-gray-300 animate-pulse rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && !isError && isLoggedIn && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {products?.length === 0 && <p className="text-center">No Products available yet!</p>}

        {/* {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="h-[250px] bg-gray-300 animate-pulse rounded-xl"></div>
            ))}
          </div>
        )} */}

        <div className="my-8 block">
          <SectionTitle title="Latest Products" />
        </div>
        {!isLoadingLatestProducts && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {latestProducts?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {latestProducts?.length === 0 && <p className="text-center">No products Available yet!</p>}

        <div className="my-8 block">
          <SectionTitle title="Top Shops" />
        </div>
        {!isLoadingTopShops && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topShops?.map((shop: any) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
        {topShops?.length === 0 && <p className="text-center">No shops Available yet!</p>}

        <div className="my-8 block">
          <SectionTitle title="Top offers" />
        </div>
        {!isLoadingTopOffers && !isErrorOffers && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topOffers?.map((product: any) => (
              <ProductCard key={product.id} product={product} isEvent={true} />
            ))}
          </div>
        )}
        {topOffers?.length === 0 && <p className="text-center">No offers Available yet!</p>}
      </div>
    </div>
  );
}
