"use client";

import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import ProductCard from "@/shared/components/cards/product-card";
import { useCartStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import { isProtected } from "@/utils/protected";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  MessageSquareText,
  Package,
  RotateCcw,
  Share2,
  ShoppingCart,
  Store,
  Truck,
  WalletMinimal,
  CheckCircle2,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import DOMPurify from "dompurify";
import StarRating from "@/shared/components/ratings/star-rating";
import { roundToDecimalPlace } from "@/utils/roundToDecimalPlace";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@e-com/ui";

// ─── Review pagination constants ──────────────────────────────────────────────
const REVIEWS_PER_PAGE = 5;

// ─── Tab type ─────────────────────────────────────────────────────────────────
type Tab = "description" | "specifications" | "shipping";

// ─── Image Magnifier (Amazon-style) ───────────────────────────────────────────
// Uses a CSS transform-based lens approach: no external library needed.
// The lens tracks the cursor and renders a zoomed copy of the image in a
// floating panel to the right — identical to how Amazon's magnifier works.

interface ImageMagnifierProps {
  src: string;
  alt: string;
  zoom?: number; // multiplier, default 2.5
}

function ImageMagnifier({ src, alt, zoom = 2.5 }: ImageMagnifierProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  // Size of the lens square shown on the image
  const LENS_SIZE = 140;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    // Raw cursor position relative to container
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    // Clamp so the lens never overflows the image
    x = Math.max(LENS_SIZE / 2, Math.min(x, rect.width - LENS_SIZE / 2));
    y = Math.max(LENS_SIZE / 2, Math.min(y, rect.height - LENS_SIZE / 2));
    setLensPos({ x, y });
  }, []);

  // The zoomed panel background-position mirrors the lens centre, scaled by zoom
  const bgX = lensPos.x * zoom - LENS_SIZE / 2;
  const bgY = lensPos.y * zoom - LENS_SIZE / 2;

  return (
    <div className="relative w-full">
      {/* ── Main image container ── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl bg-white border border-gray-100 cursor-crosshair select-none"
        style={{ aspectRatio: "1 / 1" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <Image src={src || "/placeholder.png"} alt={alt} fill sizes="(max-width: 768px) 100vw, 400px" className="object-contain" priority />

        {/* ── Lens overlay ── */}
        {isHovering && (
          <div
            className="absolute border-2 border-orange-400 bg-orange-100/20 pointer-events-none rounded-sm"
            style={{
              width: LENS_SIZE,
              height: LENS_SIZE,
              left: lensPos.x - LENS_SIZE / 2,
              top: lensPos.y - LENS_SIZE / 2,
              zIndex: 10,
            }}
          />
        )}

        {/* Zoom hint icon when not hovering */}
        {!isHovering && (
          <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm border border-gray-100">
            <ZoomIn size={14} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* ── Zoomed panel (rendered to the right of the container) ── */}
      {isHovering && (
        <div
          className="absolute top-0 left-[calc(100%+16px)] z-50 rounded-xl border border-gray-200 shadow-2xl overflow-hidden bg-white pointer-events-none"
          style={{
            width: 380,
            height: 380,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              // The background-image + size recreates the zoomed view:
              // container width/height × zoom gives the "virtual" image size.
              // background-position then shifts to centre the lens area.
              backgroundImage: `url(${src || "/placeholder.png"})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${containerRef.current?.offsetWidth ? containerRef.current.offsetWidth * zoom : 800}px ${
                containerRef.current?.offsetHeight ? containerRef.current.offsetHeight * zoom : 800
              }px`,
              backgroundPosition: `-${bgX}px -${bgY}px`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Page Component ────────────────────────────────────────────────────────────
export default function ProductDetails({ product }: any) {
  const { user } = useUser();
  const { location } = useLocationTracking();
  const { deviceInfo } = useDeviceTracking();

  const { isWishlisted, addToWishlist, removeFromWishlist, isInCart, addToCart } = useCartStore();
  const router = useRouter();

  const [currentImage, setCurrentImage] = useState(product?.images[0]?.url);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [priceRange, setPriceRange] = useState([product?.salePrice, 1199]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(product?.colors?.[0] || "");
  const [isSizeSelected, setIsSizeSelected] = useState(product?.sizes?.[0] || "");
  const [activeTab, setActiveTab] = useState<Tab>("description");

  // ── Review pagination state ────────────────────────────────────────────────
  const [visibleReviews, setVisibleReviews] = useState(REVIEWS_PER_PAGE);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
  const [allReviews, setAllReviews] = useState<any[]>(product?.reviews ?? []);
  const [hasMoreReviews, setHasMoreReviews] = useState((product?.reviews?.length ?? 0) > REVIEWS_PER_PAGE);

  // Navigate to Previous Image
  function prevImage() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImage(product?.images[currentIndex - 1]?.url);
    }
  }

  // Navigate to Next Image
  function nextImage() {
    if (currentIndex < product?.images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(product?.images[currentIndex + 1]?.url);
    }
  }

  async function handleChat() {
    if (isChatLoading) return;
    setIsChatLoading(true);
    try {
      const response = await axiosInstance.post("/chat/api/create-user-conversation-group", { sellerId: product?.shop?.sellerId }, isProtected);
      router.push(`/inbox?conversationId=${response.data.conversation.id}`);
    } catch (error) {
      console.log(error);
    } finally {
      setIsChatLoading(false);
    }
  }

  const handleBuyNow = useCallback(() => {
    if (product?.stock === 0) return;
    if (!isInCart(product?.id)) {
      addToCart({ ...product, quantity, selectedOptions: { color: isSelected, size: isSizeSelected } }, user, location, deviceInfo);
    }
    router.push("/cart");
  }, [product, quantity, isSelected, isSizeSelected, user, location, deviceInfo, isInCart, addToCart, router]);

  // ── Load more reviews from backend (paginated) ─────────────────────────────
  async function handleLoadMoreReviews() {
    setIsLoadingMoreReviews(true);
    try {
      const nextPage = Math.ceil(visibleReviews / REVIEWS_PER_PAGE) + 1;
      const res = await axiosInstance.get(`/product/api/product/${product.slug}/reviews?page=${nextPage}&limit=${REVIEWS_PER_PAGE}`);
      const newReviews: any[] = res.data.reviews ?? [];
      const totalReviews: number = res.data.total ?? product.reviewCount;

      setAllReviews((prev) => [...prev, ...newReviews]);
      const nextVisible = visibleReviews + newReviews.length;
      setVisibleReviews(nextVisible);
      setHasMoreReviews(nextVisible < totalReviews);
    } catch (error) {
      console.error("Failed to load more reviews", error);
    } finally {
      setIsLoadingMoreReviews(false);
    }
  }

  const discountPercentage =
    product?.regularPrice > product?.salePrice ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100) : 0;

  async function fetchFilteredProducts() {
    try {
      const query = new URLSearchParams();
      query.set("priceRange", priceRange.join(","));
      query.set("page", "1");
      query.set("limit", "5");
      const res = await axiosInstance.get(`/product/api/filtered-products?${query.toString()}`);
      setRecommendedProducts(res.data.products);
    } catch (error) {
      console.error("Failed to fetch filtered products", error);
    }
  }

  useEffect(() => {
    fetchFilteredProducts();
  }, [priceRange]);

  const sanitized = typeof window !== "undefined" ? DOMPurify.sanitize(product?.detailedDescription ?? "") : product?.detailedDescription ?? "";

  // Displayed reviews (client-side slice from allReviews)
  const displayedReviews = allReviews.slice(0, visibleReviews);

  // Stock label
  const stockLabel = product?.stock === 0 ? "Out of Stock" : product?.stock <= 5 ? "Limited" : "In Stock";

  const estimatedDelivery = new Date(); // This depends on DHL or so.
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  return (
    <div className="w-full py-4">
      {/* ── Dynamic Breadcrumbs ── */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition-colors text-sm">
                <Home size={13} />
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={`/products?categories=${encodeURIComponent(product?.category ?? "")}`}
                className="text-gray-500 hover:text-orange-500 transition-colors text-sm"
              >
                Products
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-orange-500 font-semibold text-sm truncate max-w-[200px]">{product?.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── TOP SECTION: 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr_280px] gap-6">
        {/* ── LEFT: Images ── */}
        <div>
          {/* Main image with Amazon-style magnifier */}
          <div className="relative">
            {/* Badges */}
            {product?.stock <= 5 && product?.stock > 0 && (
              <span className="absolute top-3 left-3 z-20 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-500 text-white shadow-sm">
                Limited Stock
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="absolute top-3 right-3 z-20 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-600 text-white shadow-sm">
                -{discountPercentage}%
              </span>
            )}

            {/* Amazon-style magnifier — no react-image-magnify */}
            <ImageMagnifier src={currentImage || "/placeholder.png"} alt={product?.title ?? "Product image"} zoom={2.5} />
          </div>

          {/* Thumbnails */}
          <div className="relative flex items-center gap-2 mt-3 overflow-hidden">
            {product?.images?.length > 4 && (
              <button
                className="absolute left-0 bg-white p-1.5 rounded-full shadow-md z-10 border border-gray-100"
                onClick={prevImage}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {product?.images?.map((img: any, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setCurrentImage(img?.url);
                  }}
                  className={`shrink-0 w-[72px] h-[72px] rounded-lg border-2 overflow-hidden transition-all ${
                    currentIndex === index ? "border-orange-500 shadow-sm" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img?.url || "/placeholder.png"}
                    alt={`Thumbnail ${index + 1}`}
                    width={72}
                    height={72}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            {product?.images?.length > 4 && (
              <button
                className="absolute right-0 bg-white p-1.5 rounded-full shadow-md z-10 border border-gray-100"
                onClick={nextImage}
                disabled={currentIndex === product?.images.length - 1}
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ── MIDDLE: Product Info ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          {/* Title + actions row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 leading-snug flex-1">{product?.title}</h1>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <button
                onClick={() =>
                  isWishlisted(product?.id)
                    ? removeFromWishlist(product.id, user, location, deviceInfo)
                    : addToWishlist(
                        {
                          ...product,
                          quantity,
                          selectedOptions: { color: isSelected, size: isSizeSelected },
                        },
                        user,
                        location,
                        deviceInfo
                      )
                }
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-red-300 transition-colors"
              >
                <Heart
                  size={16}
                  fill={isWishlisted(product?.id) ? "#ef4444" : "transparent"}
                  stroke={isWishlisted(product?.id) ? "#ef4444" : "#9ca3af"}
                />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 transition-colors">
                <Share2 size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Stars + review count + sold */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-gray-800">{roundToDecimalPlace(product.reviewRating, 1)}</span>
            <StarRating rating={product.reviewRating} iconClassName="size-4" />
            <Link href="#reviews" className="text-sm text-orange-500 hover:underline">
              {product.reviewCount} Reviews
            </Link>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{product?.totalSales ?? 0} sold</span>
          </div>

          {/* Brand */}
          <p className="text-sm text-gray-500 mb-3">
            Brand: <span className="text-orange-500 font-medium">{product?.brand || "No Brand"}</span>
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-gray-100">
            <span className="text-4xl font-bold text-orange-500">${product?.salePrice?.toFixed(2)}</span>
            {discountPercentage > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">${product?.regularPrice?.toFixed(2)}</span>
                <span className="text-sm font-semibold px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">-{discountPercentage}%</span>
              </>
            )}
          </div>

          {/* Color picker */}
          {product?.colors?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Color:{" "}
                <span className="font-normal text-gray-500">{isSelected ? colors_map[isSelected as keyof typeof colors_map] ?? isSelected : ""}</span>
              </p>
              <div className="flex gap-2">
                {product.colors.map((color: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setIsSelected(color)}
                    title={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      isSelected === color ? "border-orange-500 scale-110 shadow-md" : "border-gray-200 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size picker — orange-toned, matches app palette */}
          {product?.sizes?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Size: <span className="font-normal text-gray-500">{isSizeSelected}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setIsSizeSelected(size)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg border-2 transition-all ${
                      isSizeSelected === size
                        ? "bg-orange-400 text-white border-orange-400 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Quantity + Add to Cart row ── */}
          <div className="flex items-center gap-3 mb-3">
            {/* Stepper */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                aria-label="Decrease quantity"
                className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                –
              </button>
              <span className="w-9 text-center text-sm font-semibold text-gray-800 select-none">{quantity}</span>
              <button
                aria-label="Increase quantity"
                className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                onClick={() => setQuantity((prev) => prev + 1)}
              >
                +
              </button>
            </div>

            {/* Add to Cart */}
            <button
              suppressHydrationWarning
              disabled={isInCart(product?.id) || product?.stock === 0}
              onClick={() =>
                addToCart({ ...product, quantity, selectedOptions: { color: isSelected, size: isSizeSelected } }, user, location, deviceInfo)
              }
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                isInCart(product?.id) || product?.stock === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-orange-100 text-orange-400 cursor-pointer border border-orange-400"
              }`}
            >
              <ShoppingCart size={16} />
              {isInCart(product?.id) ? "In Cart" : "Add to Cart"}
            </button>
          </div>

          {/* Buy Now  */}
          <button
            onClick={handleBuyNow}
            disabled={product?.stock === 0}
            className="w-full py-2.5 text-sm font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 transform: translateY(-1px) text-white cursor-pointer transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buy Now
          </button>

          {/* Estimated Delivery */}
          {product?.stock > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <Truck size={16} className="text-orange-500 shrink-0" />
              <span className="text-sm text-gray-600">
                Estimated delivery by{" "}
                <span className="font-semibold text-gray-900">
                  {estimatedDelivery.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </span>
            </div>
          )}

          {/* Out of stock hint */}
          {product?.stock === 0 && <p className="text-xs text-red-400 mt-2">This item is currently out of stock.</p>}
        </div>

        {/* ── RIGHT: Seller / Delivery panel ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3 self-start">
          {/* Delivery Option */}
          <div className="pb-3 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Delivery Option</p>
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <MapPin size={14} className="text-orange-500 shrink-0" />
              <span className="font-medium">
                {location?.city}, {location?.country}
              </span>
            </div>
          </div>

          {/* Return & Warranty */}
          <div className="pb-3 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Return &amp; Warranty</p>
            <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
              <RotateCcw size={14} className="text-gray-400 shrink-0" />7 Days Returns
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <WalletMinimal size={14} className="text-gray-400 shrink-0" />
              Warranty not available
            </div>
          </div>

          {/* Sold by */}
          <div className="pb-3 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sold By</p>
            <span className="font-semibold text-gray-900 text-sm block mb-2">{product?.shop?.name}</span>
            <button
              onClick={handleChat}
              disabled={isChatLoading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border bg-[#E3F2FD] border-gray-200 rounded-lg text-[#1976D2] hover:bg-[#1565C0] hover:text-white transition-colors disabled:opacity-50"
            >
              <MessageSquareText size={13} />
              Chat with Vendor
            </button>

            {/* Seller stats */}
            <div className="grid grid-cols-3 gap-1 mt-3">
              {[
                { label: "Positive Ratings", value: "88%" },
                { label: "Ship on Time", value: "100%" },
                { label: "Chat Response", value: "100%" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-base font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Go to Store */}
          <Link
            href={`/shop/${product?.shop?.id}`}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold border border-gray-200 rounded-lg text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <Store size={14} />
            Go to Store
          </Link>

          {/* Trust badges */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="flex items-center gap-2 text-xs text-gray-500">
              <Truck size={13} className="text-orange-400 shrink-0" />
              Free shipping on orders over $50
            </span>
            <span className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 size={13} className="text-orange-400 shrink-0" />
              Verified seller · Authentic guarantee
            </span>
          </div>
        </div>
      </div>

      {/* ── DESCRIPTION / TABS SECTION ── */}
      <div id="description" className="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {(["description", "specifications", "shipping"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-sm font-semibold capitalize transition-colors relative ${
                activeTab === tab ? "text-orange-500" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "description" ? "Description" : tab === "specifications" ? "Specifications" : "Shipping & Returns"}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-t" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "description" && (
            <div className="flex gap-8">
              {/* Left: rich text description */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About {product?.title}</h2>
                <div className="ql-snow quill-display">
                  <div
                    className="ql-editor text-sm text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitized }}
                    style={{ padding: 0 }}
                  />
                </div>

                {/* Key Highlights */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Key Highlights</h3>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-6">
                    {[
                      "Premium materials, built to last",
                      "Independently verified seller",
                      "Fast & trackable shipping",
                      "30-day hassle-free returns",
                      "Eco-conscious packaging",
                      "Backed by buyer protection",
                    ].map((highlight) => (
                      <div key={highlight} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: AT A GLANCE box */}
              <div className="w-[220px] shrink-0">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">At a Glance</p>
                  <div className="space-y-3">
                    {[
                      { label: "Brand", value: product?.brand || "—" },
                      { label: "Vendor", value: product?.shop?.name || "—" },
                      {
                        label: "Sold",
                        value: product?.totalSales ? `${product.totalSales} units` : "—",
                      },
                      {
                        label: "Rating",
                        value: product?.reviewRating > 0 ? `${roundToDecimalPlace(product.reviewRating, 1)} / 5` : "—",
                      },
                      { label: "Stock", value: stockLabel },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                        <span className="text-gray-500">{label}</span>
                        <span
                          className={`font-semibold text-gray-800 ${
                            label === "Stock" && stockLabel === "Limited"
                              ? "text-orange-500"
                              : label === "Stock" && stockLabel === "Out of Stock"
                              ? "text-red-500"
                              : ""
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "specifications" && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Specifications</h2>
              {product?.customSpecifications ? (
                <div className="divide-y divide-gray-100 rounded-xl overflow-hidden border border-gray-100">
                  {Object.entries(product.customSpecifications as Record<string, string>).map(([key, val]) => (
                    <div key={key} className="flex text-sm">
                      <span className="w-[40%] bg-gray-50 px-4 py-2.5 font-medium text-gray-600">{key}</span>
                      <span className="flex-1 px-4 py-2.5 text-gray-800">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No specifications available.</p>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="max-w-xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Shipping &amp; Returns</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <Truck size={18} className="text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Free Shipping</p>
                    <p>Available on orders over $50. Standard delivery takes 3–7 business days.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw size={18} className="text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">7-Day Returns</p>
                    <p>Items may be returned within 7 days of receipt in their original condition.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package size={18} className="text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Packaging</p>
                    <p>All orders are shipped in eco-conscious packaging.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RATINGS & REVIEWS ── */}
      <div id="reviews" className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-2xl font-bold text-gray-900">Ratings &amp; Reviews</h3>
        <h3 className="mb-6 font-sans text-sm text-gray-600">
          What customers says about <span className="font-bold">{product?.title}</span>
        </h3>

        {product.reviews.length > 0 ? (
          <div className="flex gap-8">
            {/* ── Left: summary ── */}
            <div className="w-[280px] shrink-0 bg-gray-50 rounded-xl border border-gray-100 p-5 self-start">
              {/* Big rating number */}
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">{roundToDecimalPlace(product.reviewRating, 1)}</span>
                <span className="text-sm text-gray-400 mb-2">of 5</span>
              </div>
              <StarRating rating={product.reviewRating} iconClassName="size-5" />
              <p className="text-xs text-gray-400 mt-1 mb-5">Based on {product.reviewCount} reviews</p>

              {/* Rating bars */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-10 text-gray-500 shrink-0">{stars} stars</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${product.ratingDistribution?.[stars] ?? 0}%` }} />
                    </div>
                    <span className="w-8 text-right text-gray-500 shrink-0">{product.ratingDistribution?.[stars] ?? 0}%</span>
                  </div>
                ))}
              </div>

              {/* Write a Review button */}
              <button className="mt-5 w-full py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
                Write a Review
              </button>
            </div>

            {/* ── Right: review cards ── */}
            <div className="flex-1 min-w-0 space-y-4">
              {displayedReviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  {/* Reviewer header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {/* Avatar initials */}
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-orange-600">
                          {review.user?.name?.[0]?.toUpperCase() ?? "?"}
                          {review.user?.name?.split(" ")?.[1]?.[0]?.toUpperCase() ?? ""}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{review.user?.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} iconClassName="size-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{review.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}

              {/* ── Load More Reviews ── */}
              {hasMoreReviews && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleLoadMoreReviews}
                    disabled={isLoadingMoreReviews}
                    className="px-8 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoadingMoreReviews ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                        Loading…
                      </>
                    ) : (
                      "Load more reviews"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center py-10 text-gray-400">No reviews available yet!</p>
        )}
      </div>

      {/* ── You May Also Like ── */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">You may also like</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {recommendedProducts?.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Color name lookup (common CSS color names) ─────────────────────────────────
const colors_map: Record<string, string> = {
  "#000000": "Black",
  "#ffffff": "White",
  "#ff0000": "Red",
  "#00ff00": "Green",
  "#0000ff": "Blue",
  "#ffff00": "Yellow",
  "#ff00ff": "Magenta",
  "#00ffff": "Cyan",
  black: "Black",
  white: "White",
  red: "Red",
  blue: "Blue",
  green: "Green",
};
