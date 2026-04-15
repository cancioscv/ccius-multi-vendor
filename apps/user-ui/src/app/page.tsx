"use client";

import ProductCard from "@/shared/components/cards/product-card";
import ShopCard from "@/shared/components/cards/shop-card";
import Hero from "@/shared/modules/hero";
import { useAuthStore } from "@/store/authStore";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

// ─── Data Fetchers ────────────────────────────────────────────────────────────

async function getAllProducts() {
  const res = await axiosInstance.get("/product/api/all-products?page=1&limit=20");
  return res?.data?.products ?? [];
}
async function getLatestProducts() {
  const res = await axiosInstance.get("/product/api/all-products?page=1&limit=10&type=latest");
  return res.data.products ?? [];
}
async function getTopShops() {
  const res = await axiosInstance.get("/product/api/top-shops");
  return res.data.shops ?? [];
}
async function getTopOffers() {
  const res = await axiosInstance.get("/product/api/all-offers?page=1&limit=10");
  return res.data.offers ?? [];
}
async function getRecommendedProducts() {
  const res = await axiosInstance.get("/recommendation/api/recommended-products");
  return res.data.recommendations.products ?? [];
}

// ─── Shared Grid Class (preserves user's breakpoints) ────────────────────────

const GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

// ─── Skeleton Card ────────────────────────────────────────────────────────────

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
    <div className={GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── Section Component ────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
}

function Section({ title, badge, children, isLoading, isEmpty, emptyMessage = "Nothing here yet.", skeletonCount = 4 }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={`mb-14 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex flex-col gap-0.5">
          {badge && <span className="text-[11px] font-semibold tracking-widest uppercase text-orange-400">{badge}</span>}
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonGrid count={skeletonCount} />
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-400 font-medium">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

// ─── Grids ────────────────────────────────────────────────────────────────────

function ProductGrid({ products, isEvent = false }: { products: any[]; isEvent?: boolean }) {
  return (
    <div className={GRID}>
      {products.map((product: any) => (
        <ProductCard key={product.id} product={product} isEvent={isEvent} />
      ))}
    </div>
  );
}

function ShopGrid({ shops }: { shops: any[] }) {
  return (
    <div className={GRID}>
      {shops.map((shop: any) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const { isLoggedIn } = useAuthStore();

  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: getAllProducts,
    staleTime: 1000 * 60 * 2,
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

  // Uncomment to use recommendation endpoint instead of all-products:
  // const { data: products, isLoading, isError } = useQuery({
  //   queryKey: ["products"],
  //   queryFn: getRecommendedProducts,
  //   staleTime: 1000 * 60 * 2,
  // });

  return (
    <div className="min-h-screen">
      <Hero />

      <main className="my-10 m-auto w-full">
        {/* Suggested Products — logged-in users only */}
        {(isLoggedIn || isLoading) && (
          <Section
            title="Suggested Products"
            badge="Personalised"
            isLoading={isLoading}
            isEmpty={!isLoading && !isError && products?.length === 0}
            emptyMessage="No suggested products yet."
          >
            {!isError && products?.length > 0 && <ProductGrid products={products} />}
          </Section>
        )}

        {/* Latest Products */}
        <Section
          title="Latest Products"
          badge="New Arrivals"
          isLoading={isLoadingLatestProducts}
          isEmpty={!isLoadingLatestProducts && latestProducts?.length === 0}
          emptyMessage="No new products yet."
        >
          {latestProducts?.length > 0 && <ProductGrid products={latestProducts} />}
        </Section>

        {/* Top Shops */}
        <Section
          title="Top Shops"
          badge="Featured"
          isLoading={isLoadingTopShops}
          isEmpty={!isLoadingTopShops && topShops?.length === 0}
          emptyMessage="No shops listed yet."
        >
          {topShops?.length > 0 && <ShopGrid shops={topShops} />}
        </Section>

        {/* Top Offers */}
        <Section
          title="Top Offers"
          badge="Limited Deals"
          isLoading={isLoadingTopOffers}
          isEmpty={!isLoadingTopOffers && !isErrorOffers && topOffers?.length === 0}
          emptyMessage="No active offers right now."
        >
          {!isErrorOffers && topOffers?.length > 0 && <ProductGrid products={topOffers} isEvent={true} />}
        </Section>
      </main>
    </div>
  );
}
