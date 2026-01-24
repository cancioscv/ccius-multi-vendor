import SellerProfile from "@/shared/modules/seller/seller-profile";
import axiosInstance from "@/utils/axiosInstance";
import { Metadata } from "next";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

async function getSellerDetails(id: string) {
  const response = await axiosInstance.get(`/seller/api/seller-info/${id}`);
  return response.data;
}

// Dynamic metadata generator
export async function generateMetadata({ params }: ParamsProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getSellerDetails(id);

  return {
    title: `${data?.shop?.name} | Ccius Marketplace`,
    description: data?.shop?.bio || "Explore products and services from trusted sellers on Ccius.",
    openGraph: {
      title: `${data?.shop?.name} | Ccius Marketplace`,
      description: data?.shop?.bio || "Explore products and services from trusted sellers on Ccius.",
      type: "website",
      images: [
        {
          url: data?.shop?.avatar || "/placeholder.png",
          width: 800,
          height: 600,
          alt: data?.shop?.name || "Shop Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data?.shop?.name} | Ccius Marketplace`,
      description: data?.shop?.bio || "Explore products and services from trusted sellers on Ccius.",
      images: [data?.shop?.avatar || "/placeholder.png"],
    },
  };
}

export default async function ShopPage({ params }: ParamsProps) {
  const { id } = await params;
  const data = await getSellerDetails(id);
  return (
    <div>
      <SellerProfile shop={data?.shop} followersCount={data?.followersCount} />
    </div>
  );
}
