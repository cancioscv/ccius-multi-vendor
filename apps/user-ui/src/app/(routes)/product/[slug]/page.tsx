import ProductDetails from "@/shared/modules/product/product-details";
import axiosInstance from "@/utils/axiosInstance";
import { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchProductDetails(slug: string) {
  const response = await axiosInstance.get(`/product/api/product/${slug}`);
  return response.data.product;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductDetails(slug);

  return {
    title: `${product?.title} | Ccius Marketplace`,
    description: product?.description || "Discover high-quality products on Ccius Marketplace.",
    openGraph: {
      title: product?.title,
      description: product?.description || "",
      images: [product?.images?.[0]?.url || "/placeholder.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product?.title,
      description: product?.description || "",
      images: [product?.images?.[0]?.url || "/placeholder.png"],
    },
  };
}

// Important for SEO
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProductDetails(slug);
  return <ProductDetails product={product} />;
}
