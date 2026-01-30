import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Eye, Heart, ShoppingCart, X } from "lucide-react";

interface AnalyticsProps {
  product: any;
  onClose: () => void;
}

async function fetchProductAnalytics(productId: string) {
  const res = await axiosInstance.get(`/product/api/product-analytics/${productId}`);
  return res.data.analytics;
}

export default function ProductAnalyticsModal({ product, onClose }: AnalyticsProps) {
  const { data: analytics = [] } = useQuery({
    queryKey: ["product-analytics", product.id],
    queryFn: () => fetchProductAnalytics(product.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!product.id, // Whether the query should automatically run
  });

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[400px]">
        {/* Title */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl text-white">{product.title} Analytics</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {/* Analytics Metrics */}
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center text-gray-300">
            <span className="flex items-center gap-2">
              <Eye size={18} className="text-blue-400" /> Views
            </span>
            <span className="text-white font-semibold">{analytics?.views || 0}</span>
          </div>

          <div className="flex justify-between items-center text-gray-300">
            <span className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-yellow-400" /> Cart Adds
            </span>
            <span className="text-white font-semibold">{analytics?.addedToCart || 0}</span>
          </div>

          <div className="flex justify-between items-center text-gray-300">
            <span className="flex items-center gap-2">
              <Heart size={18} className="text-pink-400" /> Wishlist Adds
            </span>
            <span className="text-white font-semibold">{analytics?.addedToWishlist || 0}</span>
          </div>

          <div className="flex justify-between items-center text-gray-300">
            <span className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" /> Purchases
            </span>
            <span className="text-white font-semibold">{analytics?.purchases || 0}</span>
          </div>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="mt-6 w-full bg-red-500 hover:bg-red-600 py-2 rounded-md text-white font-semibold">
          Close
        </button>
      </div>
    </div>
  );
}
